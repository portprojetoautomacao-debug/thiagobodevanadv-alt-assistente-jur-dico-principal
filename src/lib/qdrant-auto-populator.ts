/**
 * Qdrant Auto-Populator Service
 *
 * Serviço responsável por popular automaticamente o Qdrant quando uma nova
 * intimação é recebida. Integra:
 * - TemaExtractor (classificação)
 * - DataJud (enriquecimento)
 * - Gemini Embeddings (vetorização)
 * - Qdrant (armazenamento)
 * - Redis (cache e índice reverso)
 *
 * Fluxo:
 * 1. Verifica duplicata
 * 2. Extrai temas da intimação
 * 3. Busca precedentes no DataJud
 * 4. Gera embedding
 * 5. Valida embedding
 * 6. Insere no Qdrant
 * 7. Cria índice reverso no Redis
 *
 * @module qdrant-auto-populator
 */

import type { QdrantService } from "./qdrant-service";
import type { DataJudService } from "./datajud-service";
import type { GeminiEmbeddingService } from "./gemini-embedding-service";
import type { TemaExtractorService, TemaExtracao } from "./tema-extractor";
import type { Expediente } from "@/types";
import { kv } from "./kv";

/**
 * Payload completo do documento jurídico no Qdrant
 */
export interface LegalDocumentPayload {
  // Identificação
  id: string;
  tipo: "intimacao" | "processo" | "precedente" | "jurisprudencia";

  // Dados Processuais
  numeroProcesso: string;
  tribunal: string;
  classe: string;
  assunto: string;
  orgaoJulgador?: string;

  // Classificação Temática
  temaPrimario: string;
  temasSecundarios: string[];
  palavrasChave: string[];
  confidenceTema: number;

  // Taxonomia Jurídica
  taxonomia: {
    area: string;
    subarea: string;
    especialidade: string;
  };

  // Enriquecimento DataJud
  temPrecedentes: boolean;
  qtdPrecedentes: number;
  precedentesRelevantes: Array<{
    numero: string;
    tribunal: string;
    decisao: string;
    relevancia: number;
  }>;

  // Contexto da Intimação
  tipoIntimacao?: string;
  prazo?: {
    dias: number;
    tipo: "corridos" | "úteis";
    vencimento: string;
    urgente: boolean;
  };

  // Partes do Processo (LGPD compliant)
  partes: Array<{
    tipo: "autor" | "reu" | "terceiro";
    nome: string;
    cpfCnpj?: string;
  }>;

  // Metadados de Embedding
  embedModel: string;
  embedDimensions: number;
  embedGeneratedAt: string;
  embedConfidence: number;

  // Histórico e Versionamento
  versao: number;
  criadoEm: string;
  atualizadoEm: string;
  fonte: "djen" | "datajud" | "pje" | "manual";

  // Análise Interna
  escritorio: string;
  responsavel?: string;
  estrategiaAdotada?: string;
  resultadoFinal?: string;

  // Campos de Busca
  textoCompleto: string;
  entidadesNomeadas: string[];
  citacoesLegais: string[];
}

/**
 * Resultado da população automática
 */
export interface PopulationResult {
  success: boolean;
  inserted: boolean;
  qdrantId: string;
  temas: TemaExtracao;
  precedentesEncontrados: number;
  error?: string;
  duration: number;
}

/**
 * Configuração do auto-populator
 */
export interface AutoPopulatorConfig {
  enableCache?: boolean;
  enablePrecedentSearch?: boolean;
  minConfidence?: number;
  maxPrecedents?: number;
  timeoutMs?: number;
}

const DEFAULT_CONFIG: Required<AutoPopulatorConfig> = {
  enableCache: true,
  enablePrecedentSearch: true,
  minConfidence: 0.7,
  maxPrecedents: 10,
  timeoutMs: 30000,
};

export class QdrantAutoPopulator {
  private config: Required<AutoPopulatorConfig>;

  constructor(
    private qdrant: QdrantService,
    private dataJud: DataJudService,
    private temaExtractor: TemaExtractorService,
    private embeddings: GeminiEmbeddingService,
    config: Partial<AutoPopulatorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Popula Qdrant automaticamente a partir de uma intimação
   */
  async populateFromIntimacao(intimacao: Expediente): Promise<PopulationResult> {
    const startTime = Date.now();

    try {
      console.log(`[AutoPopulator] Processando intimação: ${intimacao.id}`);
      console.log(`[AutoPopulator] Processo: ${intimacao.numeroProcesso}`);

      // 1. Verificar duplicata
      if (this.config.enableCache) {
        const existente = await this.checkDuplicate(intimacao.numeroProcesso);
        if (existente) {
          console.log(`[AutoPopulator] ??  Documento já existe: ${existente.id}`);
          return {
            success: true,
            inserted: false,
            qdrantId: existente.id,
            temas: existente.temas,
            precedentesEncontrados: existente.qtdPrecedentes || 0,
            duration: Date.now() - startTime,
          };
        }
      }

      // 2. Extrair temas
      const temas = await this.temaExtractor.extractTemasFromExpediente(intimacao);

      if (temas.confidence < this.config.minConfidence) {
        throw new Error(
          `Confiança insuficiente para popular Qdrant: ${temas.confidence} < ${this.config.minConfidence}`
        );
      }

      console.log(
        `[AutoPopulator] ? Tema extraído: ${temas.temaPrimario} (confidence: ${temas.confidence})`
      );

      // 3. Buscar precedentes no DataJud (paralelo)
      let precedentes: any[] = [];
      if (this.config.enablePrecedentSearch) {
        try {
          const [precedentesTema, precedentesProcesso] = await Promise.all([
            this.dataJud
              .searchPrecedentesByTema(temas.temaPrimario, {
                limit: this.config.maxPrecedents,
              })
              .catch(() => []),
            this.dataJud.searchProcesso(intimacao.numeroProcesso).catch(() => null),
          ]);

          precedentes = [
            ...precedentesTema,
            ...(precedentesProcesso ? [precedentesProcesso] : []),
          ];

          console.log(`[AutoPopulator] ?? ${precedentes.length} precedentes encontrados`);
        } catch (error) {
          console.warn("[AutoPopulator] ??  Falha ao buscar precedentes:", error);
          // Não falha a operação
        }
      }

      // 4. Gerar embedding
      const embeddingResult = await this.embeddings.generateDocumentEmbedding({
        numero: intimacao.numeroProcesso,
        tribunal: intimacao.tribunal || "DESCONHECIDO",
        classe: temas.temaPrimario,
        assunto: temas.temasSecundarios.join("; "),
        movimentacoes: intimacao.conteudo?.substring(0, 3000),
      });

      console.log(`[AutoPopulator] ?? Embedding gerado: ${embeddingResult.embedding.length}d`);

      // 5. Validar embedding
      const validation = this.validateEmbedding(embeddingResult.embedding, 768);
      if (!validation.valid) {
        throw new Error(`Embedding inválido: ${validation.issues.join(", ")}`);
      }

      console.log(
        `[AutoPopulator] ? Embedding validado (confidence: ${validation.confidence.toFixed(3)})`
      );

      // 6. Construir payload
      const payload = this.buildPayload(intimacao, temas, precedentes, embeddingResult);

      // 7. Inserir no Qdrant
      await this.qdrant.upsert([
        {
          id: intimacao.id,
          vector: embeddingResult.embedding,
          payload,
        },
      ]);

      console.log(`[AutoPopulator] ? Inserido no Qdrant: ${intimacao.id}`);

      // 8. Cache Redis (índice reverso)
      if (this.config.enableCache) {
        await this.createReverseIndex(intimacao.numeroProcesso, intimacao.id, temas.temaPrimario);
      }

      return {
        success: true,
        inserted: true,
        qdrantId: intimacao.id,
        temas,
        precedentesEncontrados: precedentes.length,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[AutoPopulator] ? Erro ao popular Qdrant:", error);
      return {
        success: false,
        inserted: false,
        qdrantId: "",
        temas: {
          temaPrimario: "",
          temasSecundarios: [],
          palavrasChave: [],
          confidence: 0,
          entidades: { pessoas: [], empresas: [], leis: [], tribunais: [] },
          taxonomia: { area: "", subarea: "", especialidade: "" },
        },
        precedentesEncontrados: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Verifica se documento já existe no Qdrant
   */
  private async checkDuplicate(numeroProcesso: string): Promise<any | null> {
    try {
      // 1. Busca no cache Redis
      const cachedId = await kv.get<string>(`qdrant:processo:${numeroProcesso}`);
      if (cachedId) {
        console.log(`[AutoPopulator] ?? Cache hit: ${cachedId}`);
        // Buscar metadados do Qdrant se necessário
        return { id: cachedId, cached: true };
      }

      // 2. Busca no Qdrant (filtro exato)
      // Nota: Precisa de um vector dummy para buscar com filtros
      const dummyVector = new Array(768).fill(0);

      const results = await this.qdrant.search(dummyVector, 1, {
        must: [
          {
            key: "numeroProcesso",
            match: { value: numeroProcesso },
          },
        ],
      } as any);

      if (results.length > 0) {
        console.log(`[AutoPopulator] ?? Documento encontrado no Qdrant: ${results[0].id}`);

        // Atualiza cache
        await kv.set(`qdrant:processo:${numeroProcesso}`, results[0].id, { ex: 7 * 24 * 60 * 60 });

        return results[0];
      }

      return null;
    } catch (error) {
      console.warn("[AutoPopulator] ??  Erro ao verificar duplicata:", error);
      return null;
    }
  }

  /**
   * Valida qualidade do embedding
   */
  private validateEmbedding(
    embedding: number[],
    expectedDims: number
  ): {
    valid: boolean;
    issues: string[];
    confidence: number;
  } {
    const issues: string[] = [];

    // 1. Validar dimensões
    if (embedding.length !== expectedDims) {
      issues.push(`Dimensões incorretas: ${embedding.length} != ${expectedDims}`);
    }

    // 2. Validar valores NaN/Infinity
    const hasInvalidValues = embedding.some((v) => !isFinite(v));
    if (hasInvalidValues) {
      issues.push("Contém valores NaN ou Infinity");
    }

    // 3. Validar magnitude (embeddings Gemini são normalizados)
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (Math.abs(magnitude - 1.0) > 0.01) {
      issues.push(`Magnitude anormal: ${magnitude.toFixed(4)} (esperado ~1.0)`);
    }

    // 4. Validar que não é zero vector
    const isZeroVector = embedding.every((v) => v === 0);
    if (isZeroVector) {
      issues.push("Zero vector detectado");
    }

    // Confidence baseado na magnitude
    const confidence = Math.max(0, 1 - Math.abs(magnitude - 1.0));

    return {
      valid: issues.length === 0,
      issues,
      confidence,
    };
  }

  /**
   * Constrói payload completo para inserção no Qdrant
   */
  private buildPayload(
    intimacao: Expediente,
    temas: TemaExtracao,
    precedentes: any[],
    embeddingResult: { embedding: number[]; model: string }
  ): LegalDocumentPayload {
    return {
      id: intimacao.id,
      tipo: "intimacao",

      numeroProcesso: intimacao.numeroProcesso,
      tribunal: intimacao.tribunal || "DESCONHECIDO",
      classe: temas.temaPrimario,
      assunto: temas.temasSecundarios.join("; "),
      orgaoJulgador: intimacao.orgaoJulgador,

      temaPrimario: temas.temaPrimario,
      temasSecundarios: temas.temasSecundarios,
      palavrasChave: temas.palavrasChave,
      confidenceTema: temas.confidence,

      taxonomia: temas.taxonomia,

      temPrecedentes: precedentes.length > 0,
      qtdPrecedentes: precedentes.length,
      precedentesRelevantes: precedentes.slice(0, 5).map((p) => ({
        numero: p.numero || "N/A",
        tribunal: p.tribunal || "N/A",
        decisao: p.decisao || "N/A",
        relevancia: p.relevancia || 0.5,
      })),

      tipoIntimacao: intimacao.tipo,
      prazo: intimacao.prazo
        ? {
            dias: intimacao.prazo.diasUteis || 0,
            tipo: "úteis",
            vencimento: intimacao.prazo.dataLimite || "",
            urgente: (intimacao.prazo.diasUteis || 999) < 5,
          }
        : undefined,

      partes:
        intimacao.partes?.map((p) => ({
          tipo: (p.tipo as any) || "terceiro",
          nome: p.nome,
          cpfCnpj: "[REDACTED]", // LGPD compliance
        })) || [],

      embedModel: embeddingResult.model,
      embedDimensions: embeddingResult.embedding.length,
      embedGeneratedAt: new Date().toISOString(),
      embedConfidence: this.validateEmbedding(embeddingResult.embedding, 768).confidence,

      versao: 1,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      fonte: intimacao.fonte === "DJEN" ? "djen" : "pje",

      escritorio: "default", // TODO: pegar do contexto
      textoCompleto: intimacao.conteudo || "",
      entidadesNomeadas: [...temas.entidades.pessoas, ...temas.entidades.empresas],
      citacoesLegais: temas.entidades.leis,
    };
  }

  /**
   * Cria índice reverso no Redis para busca rápida
   */
  private async createReverseIndex(
    numeroProcesso: string,
    qdrantId: string,
    temaPrimario: string
  ): Promise<void> {
    try {
      // Índice: processo -> qdrant_id
      await kv.set(`qdrant:processo:${numeroProcesso}`, qdrantId, { ex: 7 * 24 * 60 * 60 });

      // Índice: tema -> [qdrant_ids]
      const temaKey = `qdrant:tema:${temaPrimario}`;
      const existingIds = (await kv.get<string[]>(temaKey)) || [];
      await kv.set(temaKey, [...existingIds, qdrantId], { ex: 7 * 24 * 60 * 60 });

      console.log(`[AutoPopulator] ???  Índice reverso criado no Redis`);
    } catch (error) {
      console.warn("[AutoPopulator] ??  Falha ao criar índice reverso:", error);
      // Não falha a operação
    }
  }
}
