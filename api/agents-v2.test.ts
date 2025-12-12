import { beforeAll, expect, test, vi } from "vitest";
import handler from "./agents-v2";

type Handler = typeof handler;
type HandlerReq = Parameters<Handler>[0];
type HandlerRes = Parameters<Handler>[1];

function makeReq(body: unknown, apiKey = "test-autogen-key"): HandlerReq {
  const req = {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body,
  };
  return req as unknown as HandlerReq;
}

type MockRes = {
  headers: Record<string, string>;
  statusCode?: number;
  payload?: unknown;
  setHeader: (k: string, v: string) => void;
  status: (code: number) => MockRes;
  json: (payload: unknown) => MockRes;
  end: () => MockRes;
};

function makeRes(): MockRes & HandlerRes {
  const result: MockRes = {
    headers: {},
    setHeader: (k: string, v: string) => {
      result.headers[k] = v;
    },
    status: (code: number) => {
      result.statusCode = code;
      return result;
    },
    json: (payload: unknown) => {
      result.payload = payload;
      return result;
    },
    end: () => result,
  };

  return result as unknown as MockRes & HandlerRes;
}

// Mock hybrid-agents-integration para evitar erro "LangGraph agents em construção"
vi.mock("../src/lib/hybrid-agents-integration.js", () => ({
  HYBRID_AGENTS_DISABLED: true,
  hasHybridVersion: () => true,
  executeHybridTask: vi.fn().mockResolvedValue({
    success: true,
    mode: "mock",
    langGraphResult: { messages: [] },
  }),
}));

beforeAll(() => {
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
});

test("POST /api/agents-v2 returns success for a valid agent", async () => {
  const req = makeReq({ agentId: "harvey", message: "Analisar caso com prazo curto" });
  const res = makeRes();
  await handler(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.payload).toBeDefined();
  const payload = res.payload as { success?: boolean; agentId?: string };
  expect(payload.success).toBe(true);
  expect(payload.agentId).toBe("harvey");
});
