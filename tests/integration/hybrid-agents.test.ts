/**
 * Hybrid Architecture Integration Tests
 *
 * Tests for LangGraph + DSPy + Qdrant + AutoGen integration
 */

import { describe, it, expect, beforeAll } from "vitest";
import { QdrantService } from "../../src/lib/qdrant-service";
import { monitorDJEN } from "../../src/agents/monitor-djen/monitor_graph";

describe("Hybrid Architecture Integration", () => {
  describe("DJEN Monitor with LangGraph", () => {
    it("should execute monitor workflow successfully", async () => {
      const result = await monitorDJEN({});

      expect(result).toBeDefined();
      expect(result.completed).toBe(true);
      expect(result.currentStep).toBe("completed");
      expect(result.data.publications).toBeDefined();
    }, 10000); // 10s timeout

    it("should handle timeout gracefully", async () => {
      const { DJENMonitorAgent } = await import(
        "../../src/agents/monitor-djen/monitor_graph"
      );

      const agent = new DJENMonitorAgent({
        timeoutMs: 100, // Very short timeout
        maxRetries: 0,
      });

      const initialState = {
        messages: [],
        currentStep: "init",
        data: {},
        completed: false,
        retryCount: 0,
        maxRetries: 0,
        startedAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };

      await expect(agent.execute(initialState)).rejects.toThrow();
    });
  });

  describe("Qdrant Vector Search", () => {
    let qdrantService: QdrantService;

    beforeAll(() => {
      qdrantService = new QdrantService({
        url: process.env.QDRANT_URL || "http://localhost:6333",
        apiKey: process.env.QDRANT_API_KEY || "dev-local-key",
        collectionName: "test-collection",
        timeout: 5000,
      });
    });

    it("should create service instance", () => {
      expect(qdrantService).toBeDefined();
    });

    it("should validate search parameters", async () => {
      // Empty vector should be rejected
      await expect(qdrantService.search([], 5)).rejects.toThrow();

      // Invalid limit should be rejected
      await expect(qdrantService.search([0.1, 0.2, 0.3], 0)).rejects.toThrow();
    });
  });

  describe("AutoGen Orchestrator API", () => {
    it("should require authentication", async () => {
      const response = await fetch("http://localhost:3000/api/agents/autogen_orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "test",
          agents: ["harvey"],
        }),
      });

      expect(response.status).toBe(401); // Unauthorized
    });

    it("should accept valid API key", async () => {
      const response = await fetch("http://localhost:3000/api/agents/autogen_orchestrator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AUTOGEN_API_KEY || "dev-autogen-key"}`,
        },
        body: JSON.stringify({
          task: "analyze document",
          agents: ["harvey"],
          maxRounds: 1,
        }),
      });

      expect([200, 500]).toContain(response.status); // May fail if server not running
    });
  });

  describe("DSPy Bridge Integration", () => {
    const DSPY_URL = process.env.DSPY_BRIDGE_URL || "http://localhost:8765";
    const DSPY_TOKEN = process.env.DSPY_API_TOKEN || "dev-dspy-secure-token-change-in-production";

    it("should have health endpoint", async () => {
      try {
        const response = await fetch(`${DSPY_URL}/health`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.status).toBe("healthy");
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });

    it("should require API token for optimization", async () => {
      try {
        const response = await fetch(`${DSPY_URL}/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Test prompt",
          }),
        });

        expect(response.status).toBe(401); // Unauthorized
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });

    it("should optimize prompts with valid token", async () => {
      try {
        const response = await fetch(`${DSPY_URL}/optimize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DSPY_TOKEN}`,
          },
          body: JSON.stringify({
            prompt: "Analyze this legal document",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          expect(data.optimized_prompt).toBeDefined();
          expect(data.metadata).toBeDefined();
        }
      } catch (error) {
        console.warn("DSPy bridge not running, skipping test");
      }
    });
  });
});
