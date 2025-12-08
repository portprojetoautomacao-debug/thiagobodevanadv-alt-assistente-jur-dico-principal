import handler from "@/api/agents-v2";
import { beforeAll, expect, test } from "vitest";

beforeAll(() => {
  process.env.AUTOGEN_API_KEY = "test-autogen-key";
});

async function callHandler(agentId: string) {
  const req = {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.AUTOGEN_API_KEY}`,
      "content-type": "application/json",
    },
    body: { agentId, message: `Teste para ${agentId}`, traces: true },
  } as any;
  const res: any = {
    headers: {},
    setHeader: (k: string, v: string) => (res.headers[k] = v),
    status: (c: number) => (res.statusCode = c) && res,
    json: (p: any) => (res.payload = p) && res,
  };
  await handler(req, res);
  return res;
}

test("agents-v2 multi run - harvey", async () => {
  const res = await callHandler("harvey");
  expect(res.statusCode).toBe(200);
  expect(res.payload.success).toBe(true);
});

test("agents-v2 multi run - justine", async () => {
  const res = await callHandler("justine");
  expect(res.statusCode).toBe(200);
  expect(res.payload.success).toBe(true);
});

test("agents-v2 multi run - gestao-prazos", async () => {
  const res = await callHandler("gestao-prazos");
  expect(res.statusCode).toBe(200);
  expect(res.payload.success).toBe(true);
});
