import { spawn } from "child_process";
import fetch from "node-fetch";

describe("DSPy Bridge (FastAPI) integration", () => {
  let proc: ReturnType<typeof spawn> | null = null;
  const port = 8765;
  const token = "test-token-123";

  beforeAll(async () => {
    process.env.DSPY_API_TOKEN = token;
    process.env.DSPY_PORT = String(port);

    proc = spawn("python3", ["scripts/dspy_bridge.py"], { stdio: "inherit" });

    // wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 600));
  });

  afterAll(() => {
    if (proc) {
      proc.kill();
    }
  });

  test("/health returns healthy", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.service).toBe("dspy-bridge");
  });

  test("/optimize returns an optimized_prompt with auth", async () => {
    const res = await fetch(`http://127.0.0.1:${port}/optimize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Olá, optimize me" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.optimized_prompt).toBeDefined();
    expect(json.metadata).toBeDefined();
  });
});
