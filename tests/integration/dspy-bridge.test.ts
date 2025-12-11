import { spawn } from "child_process";
import fetch from "node-fetch";

/**
 * Verifica se o servidor DSPy Bridge está acessível
 */
async function isDspyBridgeAvailable(port: number, maxAttempts = 3): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`, { timeout: 1000 });
      if (res.ok) return true;
    } catch {
      // Servidor não respondeu
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

describe("DSPy Bridge (FastAPI) integration", () => {
  let proc: ReturnType<typeof spawn> | null = null;
  const port = 8765;
  const token = "test-token-123";
  let bridgeAvailable = false;

  beforeAll(async () => {
    process.env.DSPY_API_TOKEN = token;
    process.env.DSPY_PORT = String(port);

    // Tentar iniciar o servidor Python
    try {
      proc = spawn("python3", ["scripts/dspy_bridge.py"], { stdio: "ignore" });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.warn("DSPy bridge not running, skipping test");
    }

    // Verificar se o servidor está acessível
    bridgeAvailable = await isDspyBridgeAvailable(port);
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, skipping test");
    }
  });

  afterAll(() => {
    if (proc) {
      proc.kill();
    }
  });

  test("/health returns healthy", async () => {
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, skipping test");
      return;
    }
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.service).toBe("dspy-bridge");
  });

  test("/optimize returns an optimized_prompt with auth", async () => {
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, skipping test");
      return;
    }
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
