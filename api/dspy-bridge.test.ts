import { execSync, spawn } from "child_process";
import fetch from "node-fetch";
import { expect, test } from "vitest";

let fastapiAvailable = true;
try {
  execSync('python3 -c "import fastapi"', { stdio: "ignore" });
} catch (err) {
  fastapiAvailable = false;
}

if (!fastapiAvailable) {
  test.skip("DSPy Bridge - fastapi not installed in environment - skipping", () => {});
} else {
  test("DSPy Bridge - health and optimize", async () => {
    const token = "test-token-123";
    const port = 8765;
    process.env.DSPY_API_TOKEN = token;
    process.env.DSPY_PORT = String(port);

    const proc = spawn("python3", ["scripts/dspy_bridge.py"], { stdio: "inherit" });
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 800));

    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      const json = await health.json();
      expect(json.service).toBe("dspy-bridge");

      const res = await fetch(`http://127.0.0.1:${port}/optimize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Hello please optimize me" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.optimized_prompt).toBeDefined();
      expect(body.metadata).toBeDefined();
    } finally {
      proc.kill();
    }
  });
}
