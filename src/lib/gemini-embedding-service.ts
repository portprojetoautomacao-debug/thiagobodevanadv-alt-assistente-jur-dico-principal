/**
 * Gemini Embedding Service - Geração de Embeddings para Vetores
 * 
 * Usa a API do Google Gemini para converter texto jurídico em vetores
 * de 768 dimensões (text-embedding-004) compatíveis com Qdrant.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config();

// ============================================================================
// TYPES
// ============================================================================

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  model: string;
  dimensions: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class GeminiEmbeddingService {
  private genAI: GoogleGenerativeAI;
  private readonly model = "text-embedding-004";
  private readonly dimensions = 768; // Gemini text-embedding-004

  constructor(apiKey?: string) {
    const key = apiKey || process.env.VITE_GEMINI_API_KEY || "";
    
    if (!key) {
      throw new Error("VITE_GEMINI_API_KEY não configurado");
    }

    this.genAI = new GoogleGenerativeAI(key);
  }

  /**
   * Gera embedding para um texto
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error("Texto vazio não pode ser convertido em embedding");
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      const result = await model.embedContent(text);

      if (!result.embedding || !result.embedding.values) {
        throw new Error("Resposta da API Gemini inválida");
      }

      const embedding = result.embedding.values;

      // Validar dimensões
      if (embedding.length !== this.dimensions) {
        console.warn(
          `[GeminiEmbedding] Dimensões inesperadas: ${embedding.length} (esperado: ${this.dimensions})`
        );
      }

      return {
        embedding,
        text: text.slice(0, 100), // Primeiros 100 chars para referência
        model: this.model,
        dimensions: embedding.length,
      };
    } catch (error) {
      console.error("[GeminiEmbedding] Erro ao gerar embedding:", error);
      throw new Error(`Falha ao gerar embedding: ${String(error)}`);
    }
  }

  /**
   * Gera embeddings para múltiplos textos (batch)
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (const text of texts) {
      try {
        const result = await this.generateEmbedding(text);
        results.push(result);

        // Delay para respeitar rate limits (1 req/s aproximadamente)
        await this.delay(100);
      } catch (error) {
        console.error(`[GeminiEmbedding] Erro ao processar texto: ${text.slice(0, 50)}...`, error);
        // Continua processando os próximos
      }
    }

    return results;
  }

  /**
   * Gera embedding para documento jurídico completo
   * (combina classe + assunto + movimentações)
   */
  async generateDocumentEmbedding(doc: {
    numero: string;
    tribunal: string;
    classe: string;
    assunto: string;
    movimentacoes?: string;
  }): Promise<EmbeddingResult> {
    // Construir texto representativo do documento
    const parts = [
      `Tribunal: ${doc.tribunal}`,
      `Classe: ${doc.classe}`,
      `Assunto: ${doc.assunto}`,
    ];

    if (doc.movimentacoes) {
      parts.push(`Movimentações: ${doc.movimentacoes}`);
    }

    const fullText = parts.join(". ");

    return this.generateEmbedding(fullText);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna dimensões do modelo usado
   */
  getDimensions(): number {
    return this.dimensions;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let _embeddingService: GeminiEmbeddingService | null = null;

export function getEmbeddingService(): GeminiEmbeddingService {
  if (!_embeddingService) {
    _embeddingService = new GeminiEmbeddingService();
  }
  return _embeddingService;
}

export const geminiEmbeddingService = getEmbeddingService();
