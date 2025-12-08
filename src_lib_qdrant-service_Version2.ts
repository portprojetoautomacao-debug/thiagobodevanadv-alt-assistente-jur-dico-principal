import { QdrantClient } from "qdrant-js";

/**
 * QdrantService - thin wrapper around qdrant-js with safe helpers.
 * - Handles create/list collections compatibly across client versions.
 * - Exposes upsert batch and search with error handling.
 */
export class QdrantService {
  private client: any;
  private collectionName = "jurisprudencia_stf_stj";

  constructor(url?: string, apiKey?: string) {
    const qdrantUrl = url || process.env.QDRANT_URL || "http://localhost:6333";
    const key = apiKey || process.env.QDRANT_API_KEY;
    this.client = new QdrantClient({ url: qdrantUrl, apiKey: key } as any);
  }

  async initJurisprudenceCollection() {
    try {
      // safe list + create flow to be compatible with different client versions
      const { collections } = (await this.client.collections?.list?.()) || { collections: [] };
      const exists = collections?.some((c: any) => c.name === this.collectionName);
      if (exists) {
        console.log(`Collection ${this.collectionName} already exists`);
        return;
      }
      // create collection
      await this.client.collections?.create?.({
        name: this.collectionName,
        vectors: { size: 1536, distance: "Cosine" },
      } as any);
      console.log(`✅ Collection ${this.collectionName} criada`);
    } catch (error) {
      console.error("Erro criando collection:", error);
      throw error;
    }
  }

  async upsertBatch(points: Array<{ id: string; vector: number[]; payload?: any }>) {
    try {
      await this.client.points?.upsert({
        collection_name: this.collectionName,
        points,
      } as any);
    } catch (err) {
      console.error("Qdrant upsert error:", err);
      throw err;
    }
  }

  async searchPrecedents(embedding: number[], limit = 10) {
    try {
      const resp = await this.client.search(this.collectionName, {
        vector: embedding,
        limit,
      } as any);
      const hits = (resp.result || resp).map((r: any) => ({
        id: r.id,
        score: r.score ?? (r.payload && r.payload._score) ?? null,
        metadata: r.payload,
      }));
      return hits;
    } catch (err) {
      console.error("Qdrant search error:", err);
      return [];
    }
  }

  async health() {
    try {
      return await this.client.getCollections?.();
    } catch (err) {
      console.warn("Qdrant health check failed", err);
      return null;
    }
  }
}