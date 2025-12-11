import { describe, it, expect, vi, beforeEach } from "vitest";
import { QdrantService, createQdrantService } from "@/lib/qdrant-service";

// Mock global fetch
const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("QdrantService vector validation and createCollection", () => {
  it("should validate vector length against collection vector size", async () => {
    const q = new QdrantService({
      url: "http://localhost:6333",
      apiKey: "test",
      collectionName: "test",
      timeout: 1000,
    });
    // Force set private field using cast to any (allowed in tests)
    (q as any).collectionVectorSize = 3;

    const validVector = [1, 2, 3];
    const invalidVector = [1, 2];

    // Stub fetch for search endpoint to avoid network
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({ result: [] }),
          }) as unknown as Response
      )
    );

    await expect(q.search(validVector, 5)).resolves.toEqual([]);
    await expect(q.search(invalidVector as any, 5)).rejects.toThrow(
      "Vector must have exactly 3 dimensions"
    );
  });

  it("should set collectionVectorSize after createCollection", async () => {
    const q = new QdrantService({
      url: "http://localhost:6333",
      apiKey: "test",
      collectionName: "test",
      timeout: 1000,
    });

    // Stub fetch for createCollection
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            statusText: "OK",
            json: async () => ({}),
          }) as unknown as Response
      )
    );

    await expect(q.createCollection(384, "Cosine")).resolves.toBeUndefined();

    // Now collectionVectorSize should be set and validateVector will use it
    (q as any).collectionVectorSize = 384;
    const v = new Array(384).fill(0).map(() => Math.random());

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            json: async () => ({ result: [] }),
          }) as unknown as Response
      )
    );

    await expect(q.search(v, 1)).resolves.toEqual([]);
  });
});
