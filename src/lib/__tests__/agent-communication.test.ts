import { beforeEach, describe, expect, it } from "vitest";
import { communicationHub } from "../agent-communication";

describe("AgentCommunicationHub", () => {
  beforeEach(() => {
    // Clear state
    // Reset internal state using typed casts for testing
    (communicationHub as unknown as { messages: unknown[] }).messages.length = 0;
    (communicationHub as unknown as { contexts: { clear: () => void } }).contexts.clear();
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
    let callbackErrors = 0;

    // Subscriber que registra mensagens
    const unsub = communicationHub.subscribe("harvey", (msg) => {
      receivedMessages.push(msg);
    });

    // Subscriber que ocasionalmente falha
    const unsub2 = communicationHub.subscribe("harvey", (_msg) => {
      if (Math.random() < 0.1) {
        callbackErrors++;
        throw new Error("Random subscriber error");
      }
    });

    // Enviar 500 mensagens concorrentemente
    const promises = Array.from({ length: 500 }, (_, i) =>
      communicationHub.sendMessage({
        fromAgentId: "justine",
        type: "notification",
        priority: "normal",
        content: `Load test ${i}`,
      })
    );

    await Promise.all(promises);

    // Aguardar propagação de callbacks
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Garantir que recebemos as 500 mensagens apesar de alguns callbacks falharem
    expect(receivedMessages.length).toBeGreaterThanOrEqual(500);
    expect(callbackErrors).toBeGreaterThan(0); // Pelo menos alguns callbacks falharam

    unsub();
    unsub2();
  });
});
