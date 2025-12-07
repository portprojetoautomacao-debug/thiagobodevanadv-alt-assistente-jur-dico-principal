/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// mockRes removed - handler uses Fetch API Response

function makeReq(body: any, method = "POST", headers: any = {}) {
  const headerObj = {
    get: (k: string) => headers[k] || null,
  };
  return {
    method,
    headers: headerObj,
    json: async () => body,
  } as any;
}

const mockRedis: any = {
    set: vi.fn(async () => null),
    get: vi.fn(async () => null),
    sismember: vi.fn(async () => 1),
    lpush: vi.fn(async () => null),
  };

describe("pje-sync API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Upstash Redis export
    vi.mock("@upstash/redis", () => {
      function RedisMock() {
        return mockRedis;
      }
      return { Redis: RedisMock } as any;
    });

    // Ensure fetch is defined for triggerJustineAgent
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true })) as any);

    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
  });

  afterEach(() => {
    // Restore global mocks
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    vi.clearAllMocks();
  });

  it("should reject unauthorized requests", async () => {
    const req = makeReq({}, "POST", {});
    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();
    expect(resp.status).toBe(401);
    expect(body).toHaveProperty("error");
  });

  it("should process SYNC_PROCESSOS and return synced count", async () => {
    const processos = [
      {
        numero: "50005764620218130223",
        numeroFormatado: "5000576-46.2021.8.13.0223",
        classe: "Guarda",
        assunto: "Assunto",
        parteAutor: "Autor",
        parteReu: "Réu",
        vara: "1ª Vara",
        comarca: "SP",
        ultimoMovimento: {
          descricao: "Publicação de intimação",
          data: "2025-12-01",
          timestamp: 1700000000000,
        },
        situacao: "ativo",
        distribuicao: "2025-12-01",
      },
    ];

    const req = makeReq({ type: "SYNC_PROCESSOS", data: processos }, "POST", {
      "X-API-Key": "valid-api-key",
    });
    // NOTE: This handler returns a Fetch Response object, not a Vercel res.

    // sismember will return 1 to allow API key
    mockRedis.sismember.mockResolvedValue(1);

    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();
    expect(resp.status).toBe(200);
    expect(body).toHaveProperty("success", true);
    expect(body).toHaveProperty("synced");
    expect(typeof body.synced).toBe("number");
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it("should process SYNC_EXPEDIENTES and return created count", async () => {
    const expedientes = [
      {
        id: "exp-1",
        processNumber: "1234567-89.2023.8.26.0100",
        description: "Intimação",
        type: "intimacao",
        createdAt: new Date().toISOString(),
        source: "pje-extension",
        metadata: {
          vara: "1ª Vara Cível",
          comarca: "São Paulo",
          timestamp: Date.now(),
        },
      },
    ];

    const req = makeReq({ type: "SYNC_EXPEDIENTES", data: expedientes }, "POST", {
      "X-API-Key": "valid-api-key",
    });
    // NOTE: This handler returns a Fetch Response object, not a Vercel res.

    mockRedis.sismember.mockResolvedValue(1);

    const handler = (await import("../pje-sync")).default;
    const resp = await handler(req as any);
    const body = await resp.json();
    expect(resp.status).toBe(200);
    expect(body).toHaveProperty("success", true);
    expect(body).toHaveProperty("created", 1);
    // lpush should be called for each expediente
    expect(mockRedis.lpush).toHaveBeenCalled();
    // ensure triggerJustineAgent tried to call API
    expect((global as any).fetch).toHaveBeenCalled();
  });
});
