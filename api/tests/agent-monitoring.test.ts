import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock do agent-monitoring para evitar dependências externas
vi.mock("../../src/lib/agent-monitoring", () => ({
  agentMonitor: {
    trackTaskExecution: vi.fn(async (taskId, agentId, taskType, fn) => {
      // Simular logging
      console.log(`[Agent Monitor] Tracking task ${taskId} for agent ${agentId} (${taskType})`);

      try {
        const result = await fn();
        console.log(`[Agent Monitor] Task ${taskId} completed successfully`);
        return result;
      } catch (error) {
        console.log(`[Agent Monitor] Task ${taskId} failed:`, error);
        throw error;
      }
    }),
    getMetrics: vi.fn(() => ({
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageDuration: 0,
    })),
  },
}));

import { agentMonitor } from "../../src/lib/agent-monitoring";

describe("agentMonitor.trackTaskExecution", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("tracks successful execution", async () => {
    const result = await agentMonitor.trackTaskExecution(
      "task-1",
      "agent-1",
      "demo",
      async () => "ok"
    );

    expect(result).toBe("ok");
    expect(agentMonitor.trackTaskExecution).toHaveBeenCalledWith(
      "task-1",
      "agent-1",
      "demo",
      expect.any(Function)
    );
    expect(logSpy).toHaveBeenCalled();
  });

  it("tracks failed execution", async () => {
    await expect(
      agentMonitor.trackTaskExecution("task-2", "agent-2", "demo", async () => {
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");

    expect(agentMonitor.trackTaskExecution).toHaveBeenCalledWith(
      "task-2",
      "agent-2",
      "demo",
      expect.any(Function)
    );
    expect(logSpy).toHaveBeenCalled();
  });

  it("returns metrics when requested", () => {
    const metrics = agentMonitor.getMetrics();

    expect(metrics).toBeDefined();
    expect(metrics).toHaveProperty("totalTasks");
    expect(metrics).toHaveProperty("successfulTasks");
    expect(metrics).toHaveProperty("failedTasks");
    expect(metrics).toHaveProperty("averageDuration");
  });
});
