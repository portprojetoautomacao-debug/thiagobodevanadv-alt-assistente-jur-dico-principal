/**
 * Testes do Sistema de Tracing OpenTelemetry
 */

import {
  addEvent,
  endLLMSpan,
  endSpan,
  recordException,
  setAttribute,
  startAgentSpan,
  startLLMSpan,
  startSpan,
  tracingService,
  withTracing,
} from "@/lib/tracing";
import { beforeEach, describe, expect, it } from "vitest";

describe("Tracing Service", () => {
  beforeEach(() => {
    // Limpar traces entre testes
    tracingService.clearTraces();
    tracingService.setEnabled(true);
    tracingService.setSamplingRate(1.0);
  });

  describe("Basic Span Operations", () => {
    it("deve criar e finalizar um span básico", async () => {
      const span = startSpan("test-span", {
        kind: "internal",
        attributes: { "test.id": "test-123" },
      });

      expect(span.name).toBe("test-span");
      expect(span.kind).toBe("internal");
      expect(span.attributes["test.id"]).toBe("test-123");
      expect(span.status).toBe("unset");

      await endSpan(span, "ok");

      expect(span.status).toBe("ok");
      expect(span.endTime).toBeGreaterThanOrEqual(span.startTime);
    });

    it("deve gerar IDs únicos para trace e span", () => {
      const span1 = startSpan("span-1");
      const span2 = startSpan("span-2");

      expect(span1.context.traceId).toHaveLength(32);
      expect(span1.context.spanId).toHaveLength(16);
      expect(span2.context.traceId).toHaveLength(32);
      expect(span2.context.spanId).toHaveLength(16);
      expect(span1.context.spanId).not.toBe(span2.context.spanId);
    });

    it("deve criar child span com mesmo traceId", () => {
      const parentSpan = startSpan("parent");
      const childSpan = startSpan("child", {
        parentContext: parentSpan.context,
      });

      expect(childSpan.context.traceId).toBe(parentSpan.context.traceId);
      expect(childSpan.context.parentSpanId).toBe(parentSpan.context.spanId);
    });
  });

  describe("Span Attributes and Events", () => {
    it("deve adicionar atributos a um span", () => {
      const span = startSpan("test-span");

      setAttribute(span, "user.id", "user-123");
      setAttribute(span, "user.role", "admin");
      setAttribute(span, "request.size", 1024);

      expect(span.attributes["user.id"]).toBe("user-123");
      expect(span.attributes["user.role"]).toBe("admin");
      expect(span.attributes["request.size"]).toBe(1024);
    });

    it("deve adicionar eventos a um span", () => {
      const span = startSpan("test-span");

      addEvent(span, "processing.started", { "item.count": 10 });
      addEvent(span, "processing.completed", { "items.processed": 10 });

      expect(span.events).toHaveLength(2);
      expect(span.events[0].name).toBe("processing.started");
      expect(span.events[1].name).toBe("processing.completed");
    });

    it("deve registrar exceções em um span", () => {
      const span = startSpan("test-span");
      const error = new Error("Test error");

      recordException(span, error);

      expect(span.status).toBe("error");
      expect(span.statusMessage).toBe("Test error");
      expect(span.events).toHaveLength(1);
      expect(span.events[0].name).toBe("exception");
      expect(span.events[0].attributes?.["exception.type"]).toBe("Error");
    });
  });

  describe("Agent Spans", () => {
    it("deve criar um agent span com metadados", () => {
      const span = startAgentSpan("harvey", "Harvey Specter", {
        sessionId: "session-123",
        attributes: { "agent.task": "analyze" },
      });

      expect(span.name).toBe("agent.harvey");
      expect(span.agentId).toBe("harvey");
      expect(span.agentName).toBe("Harvey Specter");
      expect(span.sessionId).toBe("session-123");
      expect(span.attributes["agent.id"]).toBe("harvey");
      expect(span.attributes["agent.task"]).toBe("analyze");
    });
  });

  describe("LLM Spans", () => {
    it("deve criar e finalizar um LLM span com uso de tokens", async () => {
      const span = startLLMSpan("gemini-2.5-pro", {
        temperature: 0.7,
        maxTokens: 2048,
      });

      expect(span.name).toBe("llm.gemini-2.5-pro");
      expect(span.model).toBe("gemini-2.5-pro");
      expect(span.attributes["llm.temperature"]).toBe(0.7);
      expect(span.attributes["llm.max_tokens"]).toBe(2048);

      await endLLMSpan(span, {
        promptTokens: 150,
        completionTokens: 320,
        success: true,
      });

      expect(span.promptTokens).toBe(150);
      expect(span.completionTokens).toBe(320);
      expect(span.totalTokens).toBe(470);
      expect(span.status).toBe("ok");
      expect(span.attributes["llm.total_tokens"]).toBe(470);
    });

    it("deve registrar erro em LLM span", async () => {
      const span = startLLMSpan("gemini-2.5-pro");
      const error = new Error("API rate limit exceeded");

      await endLLMSpan(span, {
        promptTokens: 0,
        completionTokens: 0,
        success: false,
        error,
      });

      expect(span.status).toBe("error");
      expect(span.events.some((e) => e.name === "exception")).toBe(true);
    });
  });

  describe("Sampling", () => {
    it("deve respeitar sampling rate de 0 (nenhum trace)", async () => {
      tracingService.setSamplingRate(0);

      const span = startSpan("test-span");
      await endSpan(span, "ok");

      expect(span.context.traceFlags).toBe(0); // No-op span
      expect(tracingService.getTraces()).toHaveLength(0);
    });

    it("deve respeitar sampling rate de 1 (todos traces)", async () => {
      tracingService.setSamplingRate(1);

      const span = startSpan("test-span");
      await endSpan(span, "ok");

      expect(span.context.traceFlags).toBe(1); // Sampled
      expect(tracingService.getTraces().length).toBeGreaterThan(0);
    });
  });

  describe("Tracing Disabled", () => {
    it("deve criar no-op spans quando desabilitado", async () => {
      tracingService.setEnabled(false);

      const span = startSpan("test-span");
      await endSpan(span, "ok");

      expect(span.context.traceFlags).toBe(0);
      expect(tracingService.getTraces()).toHaveLength(0);
    });
  });

  describe("Memory Storage", () => {
    it("deve armazenar traces na memória", async () => {
      const span1 = startSpan("span-1");
      await endSpan(span1, "ok");

      const span2 = startSpan("span-2");
      await endSpan(span2, "ok");

      const traces = tracingService.getTraces();
      expect(traces).toHaveLength(2);
    });

    it("deve buscar traces por traceId", async () => {
      const parentSpan = startSpan("parent");
      const childSpan = startSpan("child", {
        parentContext: parentSpan.context,
      });

      await endSpan(childSpan, "ok");
      await endSpan(parentSpan, "ok");

      const traces = tracingService.getTraceById(parentSpan.context.traceId);
      expect(traces).toHaveLength(2);
      expect(traces.every((t) => t.context.traceId === parentSpan.context.traceId)).toBe(true);
    });

    it("deve buscar traces por nome", async () => {
      const span1 = startSpan("api.users.get");
      const span2 = startSpan("api.users.create");
      const span3 = startSpan("api.posts.get");

      await Promise.all([endSpan(span1, "ok"), endSpan(span2, "ok"), endSpan(span3, "ok")]);

      const userTraces = tracingService.getTracesByName("users");
      expect(userTraces).toHaveLength(2);
    });

    it("deve limpar traces da memória", async () => {
      const span = startSpan("test-span");
      await endSpan(span, "ok");

      expect(tracingService.getTraces().length).toBeGreaterThan(0);

      tracingService.clearTraces();

      expect(tracingService.getTraces()).toHaveLength(0);
    });
  });

  describe("withTracing Helper", () => {
    it("deve executar função com tracing automático", async () => {
      const result = await withTracing("test-operation", async (span) => {
        setAttribute(span, "operation.id", "op-123");
        return "success";
      });

      expect(result).toBe("success");

      const traces = tracingService.getTracesByName("test-operation");
      expect(traces).toHaveLength(1);
      expect(traces[0].status).toBe("ok");
      expect(traces[0].attributes["operation.id"]).toBe("op-123");
    });

    it("deve registrar erro automaticamente", async () => {
      await expect(
        withTracing("failing-operation", async () => {
          throw new Error("Operation failed");
        })
      ).rejects.toThrow("Operation failed");

      const traces = tracingService.getTracesByName("failing-operation");
      expect(traces).toHaveLength(1);
      expect(traces[0].status).toBe("error");
      expect(traces[0].events.some((e) => e.name === "exception")).toBe(true);
    });
  });

  describe("Statistics", () => {
    it("deve fornecer estatísticas do tracing", async () => {
      // Limpar traces para garantir estado limpo
      tracingService.clearTraces();

      const span = startSpan("test-span");

      const statsBefore = tracingService.getStats();
      expect(statsBefore.activeSpans).toBeGreaterThanOrEqual(1);
      expect(statsBefore.enabled).toBe(true);
      expect(statsBefore.samplingRate).toBe(1);

      await endSpan(span, "ok");

      const statsAfter = tracingService.getStats();
      expect(statsAfter.activeSpans).toBeLessThan(statsBefore.activeSpans);
      expect(statsAfter.totalSpans).toBeGreaterThan(0);
    });
  });
});
