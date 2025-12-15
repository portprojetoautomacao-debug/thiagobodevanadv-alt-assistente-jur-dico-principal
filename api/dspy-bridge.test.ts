import { execSync } from "child_process";
import { expect, test, vi, beforeAll, afterAll } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

let fastapiAvailable = true;
try {
  execSync('python3 -c "import fastapi"', { stdio: "ignore" });
} catch {
  fastapiAvailable = false;
}

// Mock server response
const mockHealthResponse = {
  status: "healthy",
  service: "dspy-bridge",
  version: "1.0.0",
};

const mockOptimizeResponse = {
  optimized_prompt: "Optimized: Hello please optimize me",
  metadata: {
    original_length: 25,
    optimized_length: 35,
    improvement: "10%",
  },
};

beforeAll(() => {
  // Setup mocks
  mockFetch.mockImplementation((url: string, _options?: RequestInit) => {
    if (url.includes("/health")) {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve(mockHealthResponse),
      });
    }
    if (url.includes("/optimize")) {
      return Promise.resolve({
        status: 200,
        ok: true,
        json: () => Promise.resolve(mockOptimizeResponse),
      });
    }
    return Promise.reject(new Error("Unknown endpoint"));
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Skip real test if fastapi not installed, use mock instead
if (!fastapiAvailable || process.env.DSPY_BRIDGE_ENABLED === "false") {
  test("DSPy Bridge - health and optimize (mocked)", async () => {
    const token = "test-token-123";
    const port = 8765;

    // Test health endpoint
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    expect(health.status).toBe(200);
    const json = await health.json();
    expect(json.service).toBe("dspy-bridge");

    // Test optimize endpoint
    const res = await fetch(`http://127.0.0.1:${port}/optimize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello please optimize me" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.optimized_prompt).toBeDefined();
    expect(body.metadata).toBeDefined();
  });
} else {
  test("DSPy Bridge - health and optimize (real)", async () => {
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
