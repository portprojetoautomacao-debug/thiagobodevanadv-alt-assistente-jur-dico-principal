import { beforeAll, expect, test } from "vitest";
import handler from "../../api/agents-v2";
import { HYBRID_AGENTS_DISABLED } from "../../src/lib/hybrid-agents-integration";

function makeReq(body: any, apiKey = "test-autogen-key") {
  return {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body,
  } as any;
}

function makeRes() {
  const result: any = {};
  result.headers = {};
  result.setHeader = (k: string, v: string) => {
    result.headers[k] = v;
  };
  result.status = (code: number) => {
    result.statusCode = code;
    return result;
  };
  result.json = (payload: any) => {
    result.payload = payload;
    return result;
  };
  result.end = () => result;
  return result;
}

beforeAll(() => {
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
});

test("POST /api/agents-v2 executa agente LangGraph com sucesso", async () => {
  const req = makeReq({ agentId: "harvey", message: "Analisar caso com prazo curto" });
  const res = makeRes();
  await handler(req, res);

  if (HYBRID_AGENTS_DISABLED) {
    expect(res.statusCode).toBe(400);
    expect(res.payload?.error).toContain("has no v2/hybrid implementation");
    return;
  }

  expect(res.statusCode).toBe(200);
  expect(res.payload).toBeDefined();
  expect(res.payload.success).toBe(true);
  expect(res.payload.data).toBeDefined();
  expect(res.payload.mode).toBe("langgraph");
  expect(res.payload.data.langGraphResult?.completed).toBe(true);
});
