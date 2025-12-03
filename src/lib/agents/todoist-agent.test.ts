import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoist mocks to ensure they are applied before imports
const mocks = vi.hoisted(() => {
  return {
    getTodoistClient: vi.fn(),
    updateLegalTask: vi.fn(),
    llmService: {
      execute: vi.fn(),
    },
    googleCalendarService: {
      createEvent: vi.fn(),
    },
    todoistApi: {
      addComment: vi.fn(),
    },
  };
});

// Mock dependencies
vi.mock("../todoist-integration", () => ({
  getTodoistClient: mocks.getTodoistClient,
  updateLegalTask: mocks.updateLegalTask,
}));

vi.mock("../llm-service", () => ({
  llmService: mocks.llmService,
}));

vi.mock("../google-calendar-service", () => ({
  googleCalendarService: mocks.googleCalendarService,
}));

// Import the agent AFTER mocking
import { todoistAgent } from "./todoist-agent";

describe("TodoistAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock return values
    mocks.getTodoistClient.mockReturnValue(mocks.todoistApi);
  });

  describe("processWebhookEvent", () => {
    it("should handle item:updated event", async () => {
      const event = {
        event_name: "item:updated",
        event_data: {
          id: "123",
          content: "Test Task",
          due: { date: "2023-10-27" },
        },
      };

      // Spy on console.log to verify execution flow (since handleItemUpdated logs)
      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agente Todoist processando evento"),
        "item:updated"
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Data da tarefa 123 atualizada")
      );
    });

    it("should handle item:completed event", async () => {
      const event = {
        event_name: "item:completed",
        event_data: {
          id: "123",
          content: "Processo 1234567-89.2023.8.26.0100",
        },
      };

      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Tarefa Processo 1234567-89.2023.8.26.0100 concluída!"
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Atualizando progresso do processo")
      );
    });

    it("should handle note:added event (comments)", async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_123",
          item_id: "task_123",
          content: "@Harvey reagendar para amanhã",
        },
      };

      // Mock LLM response
      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "reschedule",
          parameters: {
            taskId: "task_123",
            date: "2023-10-28",
          },
          confidence: 0.9,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.llmService.execute).toHaveBeenCalled();
      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_123", {
        dueDate: "2023-10-28",
      });
    });

    it("should ignore unknown events", async () => {
      const event = {
        event_name: "unknown:event",
        event_data: { id: "1" } as Record<string, unknown>,
      };

      const consoleSpy = vi.spyOn(console, "log");

      await todoistAgent.processWebhookEvent(event);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Evento ignorado pelo agente:",
        "unknown:event"
      );
    });
  });

  describe("Command Interpretation & Execution", () => {
    it('should interpret and execute "reschedule" command', async () => {
      // We can access private methods by casting to any if needed,
      // but better to test via public interface (processWebhookEvent with note:added)

      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_1",
          item_id: "task_1",
          content: "@Harvey remarcar para 2023-12-25",
        },
      };

      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "reschedule",
          parameters: {
            taskId: "task_1",
            date: "2023-12-25",
          },
          confidence: 0.95,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_1", {
        dueDate: "2023-12-25",
      });
    });

    it('should interpret and execute "update_status" (urgency) command', async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_2",
          item_id: "task_2",
          content: "URGENTE: verificar isso agora",
        },
      };

      // Simulate LLM failure or fallback logic
      mocks.llmService.execute.mockRejectedValue(new Error("LLM Error"));

      await todoistAgent.processWebhookEvent(event);

      // Should fall back to simple keyword matching for "urgente"
      expect(mocks.updateLegalTask).toHaveBeenCalledWith("task_2", {
        priority: 4,
      });
    });

    it('should interpret and execute "create_event" command', async () => {
      const event = {
        event_name: "note:added",
        event_data: {
          id: "note_3",
          item_id: "task_3",
          content: "@Harvey criar reunião dia 2023-11-01 às 14:00",
        },
      };

      mocks.llmService.execute.mockResolvedValue(
        JSON.stringify({
          action: "create_event",
          parameters: {
            date: "2023-11-01",
            startTime: "14:00",
            description: "Reunião",
          },
          confidence: 0.9,
        })
      );

      await todoistAgent.processWebhookEvent(event);

      expect(mocks.googleCalendarService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          date: "2023-11-01",
          time: "14:00",
          title: "Reunião",
        })
      );
    });
  });
});
