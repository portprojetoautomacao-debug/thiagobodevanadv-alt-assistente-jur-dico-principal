/**
 * Gemini Embedding Service - Geração de Embeddings para Vetores (Frontend Stub)
 * 
 * Este é um stub que chama a API backend.
 * A implementação real está em /api/lib/gemini-embedding-service.ts
 */

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
// SERVICE CLASS (Frontend Stub)
// ============================================================================

export class GeminiEmbeddingService {
  private readonly dimensions = 768; // Gemini text-embedding-004

  /**
   * Gera embedding para um texto (via API backend)
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new Error("Texto vazio não pode ser convertido em embedding");
    }

    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      return result as EmbeddingResult;
    } catch (error) {
      console.error("[GeminiEmbedding] Erro ao gerar embedding:", error);
      throw new Error(`Falha ao gerar embedding: ${String(error)}`);
    }
  }

  /**
   * Gera embeddings para múltiplos textos (batch)
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      const response = await fetch('/api/embeddings/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const results = await response.json();
      return results as EmbeddingResult[];
    } catch (error) {
      console.error("[GeminiEmbedding] Erro ao gerar embeddings batch:", error);
      throw new Error(`Falha ao gerar embeddings: ${String(error)}`);
    }
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
