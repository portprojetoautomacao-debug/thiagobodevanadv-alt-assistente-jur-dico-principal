import { spawn } from "child_process";
import fetch from "node-fetch";

/**
 * Verifica se o servidor DSPy Bridge está acessível
 */
async function isDspyBridgeAvailable(port: number, maxAttempts = 8): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Aumentamos o timeout para 2000ms e o número de tentativas para reduzir flakiness em CI
      const res = await fetch(`http://127.0.0.1:${port}/health`, { timeout: 2000 as any });
      if (res.ok) return true;
    } catch (err) {
      // Servidor não respondeu ainda - aguardar e tentar novamente
      // Perca a tolerância: loga se estiver no último round para melhorar visibilidade
      if (i === maxAttempts - 1) {
        console.warn(`DSPy health check failed after ${maxAttempts} attempts: ${String(err)}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

describe("DSPy Bridge (FastAPI) integration", () => {
  let proc: ReturnType<typeof spawn> | null = null;
  const port = 8765;
  // Prefer repository secret (CI) if provided, fall back to a stable test token
  const token = process.env.DSPY_API_TOKEN || "test-token";
  let bridgeAvailable = false;

  beforeAll(async () => {
    // Garantir que o token esteja definido antes de iniciar o servidor
    if (!process.env.DSPY_API_TOKEN) {
      process.env.DSPY_API_TOKEN = token;
    }
    process.env.DSPY_PORT = String(port);

    // Se já houver um servidor DSPy rodando (por ex., pelo workflow CI), não iniciar outro
    try {
      const existing = await isDspyBridgeAvailable(port, 3);
      if (existing) {
        console.info("DSPy bridge already running on port, reusing existing server for tests");
        bridgeAvailable = true;
        return;
      }
    } catch (e) {
      // ignore and proceed to spawn if check fails
    }

    // Tentar iniciar o servidor Python
    try {
      proc = spawn("python3", ["scripts/dspy_bridge.py"], {
        stdio: "pipe",
        env: { ...process.env, DSPY_API_TOKEN: token, DSPY_PORT: String(port) },
      });

      // Attaching logs for debugging on CI
      if (proc.stdout) {
        proc.stdout.on("data", (chunk) => {
          console.log(`[dspy stdout] ${chunk.toString()}`);
        });
      }
      if (proc.stderr) {
        proc.stderr.on("data", (chunk) => {
          console.error(`[dspy stderr] ${chunk.toString()}`);
        });
      }
      // Log when the process exits so CI can help debugging
      proc.on("close", (code, signal) => {
        console.warn(`[dspy] process exited with code=${code} signal=${signal}`);
      });
      proc.on("error", (err) => {
        console.error(`[dspy] process error: ${String(err)}`);
      });

      // Allow a slightly longer startup time in CI
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      console.warn("DSPy bridge not running, skipping test");
    }

    // Verificar se o servidor está acessível (aumentando tentativas em CI)
    bridgeAvailable = await isDspyBridgeAvailable(port, 8);
    if (!bridgeAvailable) {
      if (process.env.CI) {
        throw new Error(
          "DSPy bridge não está acessível em CI (esperado estar rodando no workflow). Verifique logs do step de startup."
        );
      }
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
      console.warn("DSPy bridge not running, test skipped");
      return; // Skip silently when service not available
    }
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.service).toBe("dspy-bridge");
  });

  test("/optimize returns an optimized_prompt with auth", async () => {
    if (!bridgeAvailable) {
      console.warn("DSPy bridge not running, test skipped");
      return; // Skip silently when service not available
    }
    // Use token from environment (garantido pelo beforeAll)
    const authToken = process.env.DSPY_API_TOKEN!;
    const res = await fetch(`http://127.0.0.1:${port}/optimize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "Olá, optimize me" }),
    });

    // Debug: Log response details if not 200
    if (res.status !== 200) {
      const body = await res.text();
      console.error(`DSPy /optimize failed with ${res.status}: ${body}`);
    }

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.optimized_prompt).toBeDefined();
    expect(json.metadata).toBeDefined();
  });
});
