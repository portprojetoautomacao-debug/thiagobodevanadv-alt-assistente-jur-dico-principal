import { describe, expect, it, vi } from "vitest";
import { agentMonitor } from "../../src/lib/agent-monitoring";

describe("agentMonitor.trackTaskExecution", () => {
  it("tracks successful execution", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const result = await agentMonitor.trackTaskExecution(
      "task-1",
      "agent-1",
      "demo",
      async () => "ok"
    );
    expect(result).toBe("ok");
    // Deve ter registrado alguma ação
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("tracks failed execution", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await expect(
      agentMonitor.trackTaskExecution("task-2", "agent-2", "demo", async () => {
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
