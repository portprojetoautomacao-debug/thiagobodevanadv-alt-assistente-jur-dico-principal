import type { VercelRequest, VercelResponse } from "@vercel/node";
import { beforeAll, expect, test, vi } from "vitest";
import handler from "./agents-v2.js";

function makeReq(body: Record<string, unknown>, apiKey = "test-autogen-key") {
  return {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body,
  } as Partial<VercelRequest>;
}

function makeRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let payload: Record<string, unknown> | undefined;

  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get payload() {
      return payload;
    },
    setHeader(k: string, v: string) {
      headers[k] = v;
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: Record<string, unknown>) {
      payload = data;
      return this;
    },
    end() {
      return this;
    },
  } as unknown as VercelResponse;
}

// Mock hybrid-agents-integration para evitar erro "LangGraph agents em construção"
vi.mock("../src/lib/hybrid-agents-integration", () => ({
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
  await handler(req as VercelRequest, res);
  expect((res as { statusCode: number }).statusCode).toBe(200);
  expect((res as { payload?: Record<string, unknown> }).payload).toBeDefined();
  expect((res as { payload?: { success?: boolean } }).payload?.success).toBe(true);
  expect((res as { payload?: { agentId?: string } }).payload?.agentId).toBe("harvey");
});
