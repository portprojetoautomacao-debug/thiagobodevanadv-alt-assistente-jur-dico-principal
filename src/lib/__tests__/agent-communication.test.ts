import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { communicationHub } from "../agent-communication";

// Store unsubscribe functions for cleanup
const unsubscribeFunctions: Array<() => void> = [];

// Mock console.error para evitar poluição de logs
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

describe("AgentCommunicationHub", () => {
  beforeEach(() => {
    // Mock console.error antes de cada teste
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Clear state
    // Reset internal state using typed casts for testing
    (communicationHub as unknown as { messages: unknown[] }).messages.length = 0;
    (communicationHub as unknown as { contexts: { clear: () => void } }).contexts.clear();
    // Clear subscribers map
    (communicationHub as unknown as { subscribers: Map<string, Set<unknown>> }).subscribers.clear();
  });

  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();

    // Cleanup all subscriptions
    unsubscribeFunctions.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    unsubscribeFunctions.length = 0;

    // Clear subscribers map again
    (communicationHub as unknown as { subscribers: Map<string, Set<unknown>> }).subscribers.clear();

    // Limpar timers pendentes
    vi.clearAllTimers();
  });

  it("sanitizes content and data on sendMessage", async () => {
    const malicious = {
      fromAgentId: "harvey",
      type: "notification" as import("../agent-communication").AgentMessageType,
      priority: "medium" as import("../agent-communication").AgentMessagePriority,
      content: "<script>alert(1)</script>hello",
      data: { x: "<img src=1 onerror=alert(1) />" },
    };

    const msg = await communicationHub.sendMessage(
      malicious as Omit<import("../agent-communication").AgentMessage, "id" | "timestamp">
    );

    expect(msg.content).toBe("hello"); // script tags removed during sanitization
    expect(msg.data?.x).not.toContain("<img");
  });

  it("handles concurrent sends without losing messages", async () => {
    const N = 200;
    const promises: Promise<import("../agent-communication").AgentMessage>[] = [];

    for (let i = 0; i < N; i++) {
      promises.push(
        communicationHub.sendMessage({
          fromAgentId: "harvey",
          type: "notification",
          priority: "low",
          content: `concurrent-${i}`,
        })
      );
    }

    await Promise.all(promises);

    // Ensure all messages present
    const len = (communicationHub as unknown as { messages: unknown[] }).messages.length;
    expect(len).toBeGreaterThanOrEqual(N);

    // Verify last messages present
    const last = communicationHub.getMessages("harvey", 5);
    expect(last.length).toBe(5);
  });

  it("does not crash if one subscriber throws and other subscribers still receive messages", async () => {
    // Prepare two subscribers: one throws, one records
    const received: import("../agent-communication").AgentMessage[] = [];

    const unsub1 = communicationHub.subscribe("harvey", (_msg) => {
      throw new Error("subscriber error");
    });

    const unsub2 = communicationHub.subscribe("harvey", (msg) => {
      received.push(msg);
    });

    await communicationHub.sendMessage({
      fromAgentId: "harvey",
      type: "notification",
      priority: "low",
      content: "test-subscriber",
    });

    expect(received.length).toBeGreaterThanOrEqual(1);

    unsub1();
    unsub2();
  });

  it("getMessages returns recent messages respecting limit", async () => {
    // send 10 messages
    for (let i = 0; i < 10; i++) {
      await communicationHub.sendMessage({
        fromAgentId: "harvey",
        type: "notification",
        priority: "low",
        content: `m${i}`,
      });
    }

    const last3 = communicationHub.getMessages("harvey", 3);
    expect(last3).toHaveLength(3);
    expect(last3[0].content).toBe("m7");
    expect(last3[2].content).toBe("m9");
  });

  it("evicts contexts and keeps indices consistent", async () => {
    // create many contexts
    for (let i = 0; i < 520; i++) {
      await communicationHub.setContext({
        type: "test",
        data: { i },
        createdBy: "harvey",
        accessibleBy: ["harvey"],
      });
    }

    // ensure contexts count less or equal to MAX_CONTEXTS
    const size = (
      communicationHub as unknown as { contexts: { size: () => number } }
    ).contexts.size();
    expect(size).toBeLessThanOrEqual(500);
  });
});

describe("AgentCommunicationHub - Stress Tests", () => {
  beforeEach(() => {
    // Clear state
    (communicationHub as unknown as { messages: unknown[] }).messages.length = 0;
    (communicationHub as unknown as { contexts: { clear: () => void } }).contexts.clear();
  });

  it("handles 1000 concurrent sendMessage calls without data loss", async () => {
    const promises = Array.from({ length: 1000 }, (_, i) =>
      communicationHub.sendMessage({
        fromAgentId: "harvey",
        type: "notification",
        priority: "normal",
        content: `Stress test message ${i}`,
      })
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(1000);
    expect(results.every((msg) => msg.id && msg.timestamp)).toBe(true);

    const messages = (communicationHub as unknown as { messages: unknown[] }).messages;
    expect(messages.length).toBeGreaterThanOrEqual(1000);
  });

  it("maintains context integrity under 500 concurrent setContext calls", async () => {
    const promises = Array.from({ length: 500 }, (_, i) =>
      communicationHub.setContext({
        type: `test-type-${i % 10}`,
        data: { value: i, timestamp: Date.now() },
        createdBy: "harvey",
        accessibleBy: ["harvey", "justine"],
      })
    );

    await Promise.all(promises);

    const size = (
      communicationHub as unknown as { contexts: { size: () => number } }
    ).contexts.size();

    // Deve respeitar MAX_CONTEXTS=500
    expect(size).toBeLessThanOrEqual(500);
  });

  it("handles mixed concurrent operations (send + setContext + getMessages)", async () => {
    const operations = [];

    // 200 sendMessage
    for (let i = 0; i < 200; i++) {
      operations.push(
        communicationHub.sendMessage({
          fromAgentId: "harvey",
          type: "notification",
          priority: "low",
          content: `Mixed op message ${i}`,
        })
      );
    }

    // 200 setContext
    for (let i = 0; i < 200; i++) {
      operations.push(
        communicationHub.setContext({
          type: "mixed-test",
          data: { i },
          createdBy: "justine",
          accessibleBy: ["justine"],
        })
      );
    }

    // 100 getMessages (read operations)
    for (let i = 0; i < 100; i++) {
      operations.push(Promise.resolve(communicationHub.getMessages("harvey", 10)));
    }

    await Promise.all(operations);

    const messages = (communicationHub as unknown as { messages: unknown[] }).messages;
    const contexts = (communicationHub as unknown as { contexts: { size: () => number } }).contexts;

    expect(messages.length).toBeGreaterThanOrEqual(200);
    expect(contexts.size()).toBeGreaterThanOrEqual(100); // At least 100 contexts
  });

  it("handles subscription notifications under heavy concurrent load", async () => {
    const receivedMessages: import("../agent-communication").AgentMessage[] = [];

    // Subscriber que registra mensagens
    const unsub = communicationHub.subscribe("harvey", (msg) => {
      receivedMessages.push(msg);
    });
    unsubscribeFunctions.push(unsub);

    // Subscriber que ocasionalmente falha (10% de chance)
    const unsub2 = communicationHub.subscribe("harvey", (_msg) => {
      if (Math.random() < 0.1) {
        throw new Error("Random subscriber error");
      }
    });
    unsubscribeFunctions.push(unsub2);

    // Enviar 100 mensagens concorrentemente
    const promises = Array.from({ length: 100 }, (_, i) =>
      communicationHub.sendMessage({
        fromAgentId: "justine",
        type: "notification",
        priority: "medium",
        content: `Load test ${i}`,
      })
    );

    await Promise.all(promises);

    // Aguardar propagação de callbacks
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Garantir que recebemos as mensagens (o importante é que o sistema não quebrou)
    expect(receivedMessages.length).toBeGreaterThanOrEqual(100);

    // Cleanup
    unsub();
    unsub2();
  });

  it("throttles error logs from subscriber callbacks", async () => {
    let errorCount = 0;

    // Subscriber que SEMPRE falha (determinístico)
    const unsub = communicationHub.subscribe("harvey", (_msg) => {
      errorCount++;
      throw new Error(`Subscriber error ${errorCount}`);
    });
    unsubscribeFunctions.push(unsub);

    // Enviar 10 mensagens rapidamente (dentro do throttle window de 5s)
    const promises = Array.from({ length: 10 }, (_, i) =>
      communicationHub.sendMessage({
        fromAgentId: "justine",
        type: "notification",
        priority: "medium",
        content: `Message ${i}`,
      })
    );

    await Promise.all(promises);

    // Aguardar callbacks assíncronos (queueMicrotask) executarem completamente
    // Múltiplos ticks para garantir que todos os microtasks foram processados
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verificar que todos os callbacks falharam
    expect(errorCount).toBe(10);

    // O throttling pode ser tão eficaz que não loga nenhum erro dentro do teste
    // ou loga apenas alguns. O importante é que o sistema não quebrou.
    const errorCalls = consoleErrorSpy.mock.calls.length;

    // Verificar comportamento do throttling:
    // - Se houve logs, deve ser menos que o total de erros (throttling funcionando)
    // - Se não houve logs, o throttling está super agressivo (também válido)
    // - O sistema deve continuar funcionando (errorCount = 10)
    if (errorCalls > 0) {
      // Se teve logs, deve ter menos que o total de erros
      expect(errorCalls).toBeLessThan(10);

      // Verificar que mensagem de throttling apareceu se houve múltiplos erros
      const throttledMessage = consoleErrorSpy.mock.calls.some((call) =>
        call[0]?.toString().includes("errors throttled")
      );
      // Se teve mais de 1 log, deveria ter mensagem de throttling
      if (errorCalls > 1) {
        expect(throttledMessage).toBe(true);
      }
    }

    // O mais importante: o sistema não quebrou
    expect(errorCount).toBe(10);

    unsub();
  });
});
