/**
 * Testes do Sistema AOP Logging
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateConsolidatedLog,
  getCorrelationId,
  getCurrentContext,
  LogAgent,
  LogMethod,
  withRequestContext,
  wrapAgentFunction,
} from "./aop-logging";

describe("AOP Logging System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Request Context", () => {
    it("deve criar contexto com correlationId único", async () => {
      await withRequestContext(async () => {
        const ctx = getCurrentContext();

        expect(ctx).toBeDefined();
        expect(ctx?.requestId).toBeDefined();
        expect(ctx?.history).toEqual([]);
      });
    });

    it("deve manter correlationId durante execução", async () => {
      let id1: string | undefined;
      let id2: string | undefined;

      await withRequestContext(async () => {
        id1 = getCorrelationId();
        await new Promise((resolve) => setTimeout(resolve, 10));
        id2 = getCorrelationId();
      });

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).toBe(id2);
    });

    it("deve isolar contextos de diferentes requests", async () => {
      const ids: string[] = [];

      await Promise.all([
        withRequestContext(async () => {
          ids.push(getCorrelationId()!);
        }),
        withRequestContext(async () => {
          ids.push(getCorrelationId()!);
        }),
      ]);

      expect(ids[0]).not.toBe(ids[1]);
    });
  });

  describe("@LogMethod Decorator", () => {
    it("deve logar execução de método com sucesso", async () => {
      const consoleSpy = vi.spyOn(console, "info");

      class TestClass {
        @LogMethod()
        async testMethod(value: string) {
          return value.toUpperCase();
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();
        const result = await instance.testMethod("hello");

        expect(result).toBe("HELLO");
        expect(consoleSpy).toHaveBeenCalledWith(
          "[AOP:START]",
          expect.objectContaining({
            class: "TestClass",
            method: "testMethod",
          })
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          "[AOP:SUCCESS]",
          expect.objectContaining({
            output: "HELLO",
          })
        );
      });
    });

    it("deve logar erros corretamente", async () => {
      const errorSpy = vi.spyOn(console, "error");

      class TestClass {
        @LogMethod()
        async failingMethod() {
          throw new Error("Test error");
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();

        await expect(instance.failingMethod()).rejects.toThrow("Test error");

        expect(errorSpy).toHaveBeenCalledWith(
          "[AOP:ERROR]",
          expect.objectContaining({
            error: "Test error",
          })
        );
      });
    });

    it("deve adicionar execuções ao history", async () => {
      class TestClass {
        @LogMethod()
        async method1() {
          return "result1";
        }

        @LogMethod()
        async method2() {
          return "result2";
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();

        await instance.method1();
        await instance.method2();

        const ctx = getCurrentContext();
        expect(ctx?.history).toHaveLength(2);
        expect(ctx?.history[0].method).toBe("method1");
        expect(ctx?.history[1].method).toBe("method2");
      });
    });
  });

  describe("@LogAgent Decorator", () => {
    it("deve logar agente com agentId", async () => {
      class HarveyAgent {
        @LogAgent("harvey")
        async strategicAnalysis(data: any) {
          return { strategy: "attack" };
        }
      }

      await withRequestContext(async () => {
        const agent = new HarveyAgent();
        await agent.strategicAnalysis({ case: "test" });

        const ctx = getCurrentContext();
        expect(ctx?.history[0].agentId).toBe("harvey");
      });
    });
  });

  describe("Consolidated Log", () => {
    it("deve gerar log consolidado com summary", async () => {
      class TestAgent {
        @LogAgent("test-agent")
        async method1() {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return "ok";
        }

        @LogAgent("test-agent")
        async method2() {
          await new Promise((resolve) => setTimeout(resolve, 30));
          return "ok";
        }

        @LogAgent("test-agent")
        async method3() {
          throw new Error("fail");
        }
      }

      await withRequestContext(async () => {
        const agent = new TestAgent();

        await agent.method1();
        await agent.method2();

        try {
          await agent.method3();
        } catch {
          // Expected
        }

        const log = generateConsolidatedLog();

        expect(log).toBeDefined();
        expect(log?.correlationId).toBeDefined();
        expect(log?.history).toHaveLength(3);
        expect(log?.summary.totalCalls).toBe(3);
        expect(log?.summary.successCalls).toBe(2);
        expect(log?.summary.errorCalls).toBe(1);
        expect(log?.summary.avgDuration).toBeGreaterThan(0);
      });
    });

    it("deve incluir metadata no log consolidado", async () => {
      await withRequestContext(
        async () => {
          const log = generateConsolidatedLog();
          expect(log?.metadata.taskType).toBe("analyze");
        },
        { taskType: "analyze", priority: "high" }
      );
    });
  });

  describe("Wrapper de Função", () => {
    it("deve wrappear função existente sem modificá-la", async () => {
      async function originalFunction(input: string) {
        return input.toUpperCase();
      }

      const wrapped = wrapAgentFunction("test-agent", "Test Agent", originalFunction);

      const result = await wrapped("hello");

      // Função original foi executada corretamente
      expect(result).toBe("HELLO");
    });
  });

  describe("Sanitização de Dados", () => {
    it("deve sanitizar campos sensíveis", async () => {
      class TestClass {
        @LogMethod({ sanitize: true })
        async methodWithSecrets(data: any) {
          return data;
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();

        await instance.methodWithSecrets({
          username: "user",
          password: "secret123",
          apiKey: "key123",
        });

        const ctx = getCurrentContext();
        const execution = ctx?.history[0];

        expect(execution?.input[0].password).toBe("***REDACTED***");
        expect(execution?.input[0].apiKey).toBe("***REDACTED***");
        expect(execution?.input[0].username).not.toBe("***REDACTED***");
      });
    });
  });

  describe("Performance Tracking", () => {
    it("deve medir duração corretamente", async () => {
      class TestClass {
        @LogMethod({ logDuration: true })
        async slowMethod() {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return "done";
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();
        await instance.slowMethod();

        const ctx = getCurrentContext();
        const execution = ctx?.history[0];

        expect(execution?.duration).toBeGreaterThanOrEqual(100);
        expect(execution?.duration).toBeLessThan(200);
      });
    });
  });

  describe("Error Handling", () => {
    it("deve capturar erros e adicionar ao history", async () => {
      class TestClass {
        @LogMethod()
        async errorMethod() {
          throw new Error("Test error");
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();

        try {
          await instance.errorMethod();
        } catch {
          // Expected
        }

        const ctx = getCurrentContext();
        expect(ctx?.history[0].status).toBe("error");
        expect(ctx?.history[0].error).toBe("Test error");
      });
    });

    it("deve incluir erros no summary", async () => {
      class TestClass {
        @LogMethod()
        async method1() {
          return "ok";
        }

        @LogMethod()
        async method2() {
          throw new Error("fail");
        }
      }

      await withRequestContext(async () => {
        const instance = new TestClass();

        await instance.method1();

        try {
          await instance.method2();
        } catch {
          // Expected
        }

        const log = generateConsolidatedLog();
        expect(log?.summary.successCalls).toBe(1);
        expect(log?.summary.errorCalls).toBe(1);
      });
    });
  });
});
