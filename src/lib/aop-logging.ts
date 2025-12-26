/**
 * AOP-Style Logging - Inspired by Spring Boot AOP
 *
 * Sistema de logging automático usando decorators TypeScript
 * Similar ao @Aspect/@Around do Spring Framework
 *
 * Features:
 * - Auto-logging de métodos com decorator @LogMethod
 * - Request context global (similar RequestContextHolder)
 * - History tracking de todas as execuções
 * - CorrelationId automático
 * - Performance monitoring
 * - Exception handling centralizado
 * - LGPD compliant (PII filtering)
 */

import { AsyncLocalStorage } from "async_hooks";
import { sanitizePII } from "./document-sanitizer";

// ============================================================================
// REQUEST CONTEXT (Similar ao Spring RequestContextHolder)
// ============================================================================

export interface ExecutionHistory {
  method: string;
  className: string;
  duration: number;
  timestamp: number;
  status: "success" | "error";
  input?: any;
  output?: any;
  error?: string;
  agentId?: string;
}

export interface RequestContext {
  requestId: string; // CorrelationId
  startTime: number;
  history: ExecutionHistory[];
  metadata: Record<string, any>;
  agentId?: string;
  userId?: string;
}

// AsyncLocalStorage para contexto global por request
const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Inicia um novo contexto de request
 * Similar ao RequestContextHolder do Spring
 */
export async function withRequestContext<T>(
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const context: RequestContext = {
    requestId: crypto.randomUUID(),
    startTime: Date.now(),
    history: [],
    metadata: metadata || {},
  };

  return requestContext.run(context, fn);
}

/**
 * Obtém o contexto atual da request
 */
export function getCurrentContext(): RequestContext | undefined {
  return requestContext.getStore();
}

/**
 * Adiciona uma execução ao histórico
 */
export function addToHistory(execution: ExecutionHistory): void {
  const ctx = getCurrentContext();
  if (ctx) {
    ctx.history.push(execution);
  }
}

/**
 * Obtém o correlationId atual
 */
export function getCorrelationId(): string | undefined {
  return getCurrentContext()?.requestId;
}

// ============================================================================
// DECORATOR @LogMethod (Similar ao Spring @Around)
// ============================================================================

interface LogMethodOptions {
  logInput?: boolean;
  logOutput?: boolean;
  logDuration?: boolean;
  sanitize?: boolean;
  agentId?: string;
}

/**
 * Decorator para logging automático de métodos
 * Similar ao @Around do Spring Boot AOP
 *
 * @example
 * ```typescript
 * class MyAgent {
 *   @LogMethod({ agentId: 'justine' })
 *   async analyzeDocument(doc: Document) {
 *     // Automaticamente logado com correlationId, duration, input/output
 *     return analysis;
 *   }
 * }
 * ```
 */
export function LogMethod(options: LogMethodOptions = {}) {
  const {
    logInput = true,
    logOutput = true,
    logDuration = true,
    sanitize = true,
    agentId,
  } = options;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const className = target.constructor.name;
      const correlationId = getCorrelationId();

      const context = {
        class: className,
        method: propertyKey,
        correlationId,
        agentId: agentId || getCurrentContext()?.agentId,
      };

      // Sanitize input se necessário (LGPD)
      const sanitizedInput =
        sanitize && logInput ? sanitizeData(args) : logInput ? args : undefined;

      try {
        // Log de início
        console.info("[AOP:START]", {
          ...context,
          timestamp: new Date().toISOString(),
          input: sanitizedInput,
        });

        // Executar método original (proceed() do Spring)
        const result = await originalMethod.apply(this, args);

        const duration = Date.now() - start;

        // Sanitize output se necessário
        const sanitizedOutput =
          sanitize && logOutput ? sanitizeData(result) : logOutput ? result : undefined;

        // Log de sucesso
        console.info("[AOP:SUCCESS]", {
          ...context,
          duration: logDuration ? duration : undefined,
          output: sanitizedOutput,
          timestamp: new Date().toISOString(),
        });

        // Adicionar ao history (similar ao Spring)
        addToHistory({
          method: propertyKey,
          className,
          duration,
          timestamp: start,
          status: "success",
          input: sanitizedInput,
          output: sanitizedOutput,
          agentId: context.agentId,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        // Log de erro
        console.error("[AOP:ERROR]", {
          ...context,
          duration: logDuration ? duration : undefined,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
        });

        // Adicionar ao history
        addToHistory({
          method: propertyKey,
          className,
          duration,
          timestamp: start,
          status: "error",
          input: sanitizedInput,
          error: error instanceof Error ? error.message : String(error),
          agentId: context.agentId,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator especializado para agentes IA
 */
export function LogAgent(agentId: string) {
  return LogMethod({ agentId, sanitize: true, logDuration: true });
}

/**
 * Decorator para controllers/API routes
 */
export function LogController() {
  return LogMethod({ logInput: true, logOutput: true, sanitize: true });
}

/**
 * Decorator para services
 */
export function LogService() {
  return LogMethod({ logInput: false, logOutput: false, logDuration: true });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Sanitiza dados sensíveis (LGPD)
 */
function sanitizeData(data: any): any {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    // Sanitizar campos sensíveis
    if (
      typeof value === "string" &&
      (key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key"))
    ) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "string") {
      sanitized[key] = sanitizePII(value);
    } else {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
}

/**
 * Gera log consolidado com todo o histórico
 * Similar ao log final da controller no Spring Boot
 */
export function generateConsolidatedLog(): any {
  const ctx = getCurrentContext();

  if (!ctx) {
    return null;
  }

  const totalDuration = Date.now() - ctx.startTime;

  return {
    correlationId: ctx.requestId,
    totalDuration,
    timestamp: new Date(ctx.startTime).toISOString(),
    metadata: ctx.metadata,
    agentId: ctx.agentId,
    userId: ctx.userId,
    history: ctx.history,
    summary: {
      totalCalls: ctx.history.length,
      successCalls: ctx.history.filter((h) => h.status === "success").length,
      errorCalls: ctx.history.filter((h) => h.status === "error").length,
      avgDuration:
        ctx.history.length > 0
          ? ctx.history.reduce((sum, h) => sum + h.duration, 0) / ctx.history.length
          : 0,
    },
  };
}

/**
 * Middleware para Express/Vercel Functions
 * Wrapper que cria contexto automaticamente
 */
export function aopMiddleware<T>(handler: (req: any, res: any) => Promise<T>) {
  return async (req: any, res: any) => {
    return withRequestContext(async () => {
      const ctx = getCurrentContext();
      if (ctx) {
        ctx.metadata.method = req.method;
        ctx.metadata.url = req.url;
        ctx.metadata.userAgent = req.headers["user-agent"];
      }

      try {
        const result = await handler(req, res);

        // Log consolidado no final (similar ao Spring)
        const consolidatedLog = generateConsolidatedLog();
        console.info("[AOP:REQUEST_COMPLETE]", consolidatedLog);

        return result;
      } catch (error) {
        const consolidatedLog = generateConsolidatedLog();
        console.error("[AOP:REQUEST_ERROR]", {
          ...consolidatedLog,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    });
  };
}

/**
 * Wrapper para funções de agentes
 * Adiciona tracing + logging automático
 */
export function wrapAgentFunction<TInput, TOutput>(
  agentId: string,
  agentName: string,
  fn: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<TOutput> {
  return async (input: TInput): Promise<TOutput> => {
    return withRequestContext(async () => {
      const ctx = getCurrentContext();
      if (ctx) {
        ctx.agentId = agentId;
        ctx.metadata.agentName = agentName;
      }

      const start = Date.now();

      try {
        const result = await fn(input);
        const duration = Date.now() - start;

        addToHistory({
          method: "execute",
          className: agentName,
          duration,
          timestamp: start,
          status: "success",
          input: sanitizeData(input),
          output: sanitizeData(result),
          agentId,
        });

        return result;
      } catch (error) {
        const duration = Date.now() - start;

        addToHistory({
          method: "execute",
          className: agentName,
          duration,
          timestamp: start,
          status: "error",
          input: sanitizeData(input),
          error: error instanceof Error ? error.message : String(error),
          agentId,
        });

        throw error;
      }
    });
  };
}
