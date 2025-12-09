/**
 * Script Automatizado - Popular Qdrant com Dados do DataJud
 * 
 * Este script:
 * 1. Conecta na API DataJud do CNJ
 * 2. Busca processos/precedentes jurídicos
 * 3. Gera embeddings com Gemini
 * 4. Envia para Qdrant Cloud
 * 
 * Uso:
 *   npm run qdrant:populate-datajud
 */

import { config } from "dotenv";
import { createQdrantService } from "../src/lib/qdrant-service";
import { dataJudService } from "../src/lib/datajud-service";
import { geminiEmbeddingService } from "../src/lib/gemini-embedding-service";

config();

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const QDRANT_CONFIG = {
  url: process.env.QDRANT_URL || "",
  apiKey: process.env.QDRANT_API_KEY || "",
  collectionName: process.env.QDRANT_COLLECTION_NAME || "legal_docs",
};

const TRIBUNAIS_PRIORITARIOS = ["TST", "TRT3", "TJMG", "TRF1", "TRF6", "STJ"];

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  console.log("?? Iniciando população automatizada do Qdrant com DataJud\n");

  // 1. Validar configuração
  if (!QDRANT_CONFIG.url || !QDRANT_CONFIG.apiKey) {
    console.error("? ERRO: QDRANT_URL e QDRANT_API_KEY não configurados no .env");
    process.exit(1);
  }

  if (!process.env.VITE_GEMINI_API_KEY) {
    console.error("? ERRO: VITE_GEMINI_API_KEY não configurado no .env");
    process.exit(1);
  }

  // 2. Conectar ao Qdrant
  console.log("?? Conectando ao Qdrant Cloud...");
  const qdrant = createQdrantService(QDRANT_CONFIG);

  if (!qdrant) {
    console.error("? Falha ao criar serviço Qdrant");
    process.exit(1);
  }

  console.log(`? Conectado: ${QDRANT_CONFIG.url}`);
  console.log(`?? Collection: ${QDRANT_CONFIG.collectionName}\n`);

  // 3. Verificar/Criar collection com dimensões corretas
  const embeddingDimensions = geminiEmbeddingService.getDimensions();
  console.log(`?? Modelo Gemini: text-embedding-004 (${embeddingDimensions} dimensões)`);

  try {
    await qdrant.createCollection(embeddingDimensions, "Cosine");
    console.log("? Collection verificada/criada\n");
  } catch (error) {
    console.error("? Erro ao criar collection:", error);
    process.exit(1);
  }

  // 4. Buscar dados do DataJud
  console.log("?? Buscando dados do DataJud (CNJ)...\n");

  let totalProcessed = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  try {
    // Estratégia 1: Buscar temas curados (mais relevantes)
    console.log("?? Estratégia: Temas Jurídicos Curados\n");
    const temasCurados = await dataJudService.searchTemasCurados();

    for (const { tema, tribunal, processos } of temasCurados) {
      console.log(`\n?? Processando: ${tema} (${tribunal})`);
      console.log(`   ${processos.length} processos encontrados`);

      if (processos.length === 0) {
        console.log("   ?? Pulando (sem dados)");
        continue;
      }

      // Processar em lotes de 5 para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < processos.length; i += batchSize) {
        const batch = processos.slice(i, i + batchSize);
        
        console.log(`   ?? Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(processos.length / batchSize)} (${batch.length} itens)`);

        for (const processo of batch) {
          totalProcessed++;

          try {
            // Gerar embedding
            const embeddingResult = await geminiEmbeddingService.generateDocumentEmbedding({
              numero: processo.numero,
              tribunal: processo.tribunal,
              classe: processo.classe,
              assunto: processo.assunto,
              movimentacoes: processo.movimentacoes?.map(m => m.descricao).join("; "),
            });

            // Inserir no Qdrant
            await qdrant.upsert([{
              id: processo.id,
              vector: embeddingResult.embedding,
              payload: {
                numero: processo.numero,
                tribunal: processo.tribunal,
                classe: processo.classe,
                assunto: processo.assunto,
                tema,
                dataAjuizamento: processo.dataAjuizamento,
                orgaoJulgador: processo.orgaoJulgador,
                totalMovimentacoes: processo.movimentacoes?.length || 0,
                partes: processo.partes?.map(p => p.nome).join("; ") || "",
                embedModel: embeddingResult.model,
                createdAt: new Date().toISOString(),
              },
            }]);

            totalInserted++;
            process.stdout.write(".");
          } catch (error) {
            totalErrors++;
            console.error(`\n   ? Erro ao processar ${processo.numero}:`, error);
          }
        }

        // Delay entre lotes
        await delay(2000);
      }

      console.log(`\n   ? ${tema} concluído`);
    }

    // Estratégia 2: Buscar por tribunais prioritários (complementar)
    console.log("\n\n?? Estratégia: Tribunais Prioritários\n");
    
    for (const tribunal of TRIBUNAIS_PRIORITARIOS) {
      console.log(`\n??? Tribunal: ${tribunal}`);

      try {
        const processos = await dataJudService.searchProcessos({
          tribunal,
          limit: 20,
          dataInicio: "2023-01-01",
        });

        console.log(`   ${processos.length} processos encontrados`);

        for (const processo of processos) {
          totalProcessed++;

          try {
            const embeddingResult = await geminiEmbeddingService.generateDocumentEmbedding({
              numero: processo.numero,
              tribunal: processo.tribunal,
              classe: processo.classe,
              assunto: processo.assunto,
            });

            await qdrant.upsert([{
              id: `${tribunal}-${processo.id}`,
              vector: embeddingResult.embedding,
              payload: {
                numero: processo.numero,
                tribunal: processo.tribunal,
                classe: processo.classe,
                assunto: processo.assunto,
                dataAjuizamento: processo.dataAjuizamento,
                embedModel: embeddingResult.model,
                createdAt: new Date().toISOString(),
              },
            }]);

            totalInserted++;
            process.stdout.write(".");
          } catch (error) {
            totalErrors++;
            console.error(`\n   ? Erro ao processar ${processo.numero}:`, error);
          }
        }

        console.log(`\n   ? ${tribunal} concluído`);
        
        // Delay entre tribunais
        await delay(3000);
      } catch (error) {
        console.error(`   ? Erro ao buscar ${tribunal}:`, error);
      }
    }

  } catch (error) {
    console.error("\n? Erro fatal durante processamento:", error);
  }

  // 5. Resumo final
  console.log("\n\n?? RESUMO DA POPULAÇÃO\n");
  console.log(`   Total Processado: ${totalProcessed}`);
  console.log(`   Total Inserido:   ${totalInserted} ?`);
  console.log(`   Total Erros:      ${totalErrors} ${totalErrors > 0 ? "??" : ""}`);
  console.log(`   Taxa de Sucesso:  ${totalProcessed > 0 ? ((totalInserted / totalProcessed) * 100).toFixed(1) : 0}%`);

  console.log("\n? População concluída!");
  console.log(`\n?? Acesse o dashboard: https://cloud.qdrant.io/clusters`);
}

// ============================================================================
// HELPERS
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EXECUTE
// ============================================================================

main().catch(error => {
  console.error("\n?? Erro fatal:", error);
  process.exit(1);
});
