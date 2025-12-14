/**
 * OpenTelemetry Integration for Assistente Jurídico PJe
 *
 * Integra o sistema de tracing existente com OpenTelemetry SDK para
 * exportação para AI Toolkit Trace Viewer e outras ferramentas de observabilidade.
 *
 * IMPORTANTE: Este arquivo deve ser importado e inicializado ANTES de qualquer
 * outro código no entry point da aplicação (main.tsx).
 */

import { Span as OtelSpan, SpanStatusCode, trace } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { tracingService, type Span } from "./tracing";

// Nome do serviço
const SERVICE_NAME = "assistente-juridico-pje";
const SERVICE_VERSION = "1.0.1";

// Endpoint do AI Toolkit (HTTP OTLP)
const OTLP_ENDPOINT = import.meta.env.VITE_OTLP_ENDPOINT || "http://localhost:4319/v1/traces";

// Provider global
let tracerProvider: WebTracerProvider | null = null;
let isInitialized = false;

/**
 * Inicializa OpenTelemetry SDK
 *
 * Esta função DEVE ser chamada uma vez no início da aplicação (main.tsx)
 * ANTES de qualquer outra inicialização.
 *
 * @example
 * ```typescript
 * // main.tsx
 * import { initializeOpenTelemetry } from './lib/otel-integration';
 *
 * // Inicializar PRIMEIRO
 * initializeOpenTelemetry();
 *
 * // Depois inicializar React
 * ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
 * ```
 */
export function initializeOpenTelemetry(): void {
  if (isInitialized) {
    console.warn("[OpenTelemetry] Já inicializado, ignorando chamada duplicada");
    return;
  }

  try {
    // Criar resource com metadados do serviço
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: SERVICE_NAME,
      [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
      "deployment.environment": import.meta.env.MODE || "development",
      "service.namespace": "legal-ai",
      "telemetry.sdk.name": "opentelemetry",
      "telemetry.sdk.language": "typescript",
      "telemetry.sdk.version": "1.28.0",
    });

    // Criar tracer provider
    tracerProvider = new WebTracerProvider({
      resource,
    });

    // Configurar exportador OTLP
    const otlpExporter = new OTLPTraceExporter({
      url: OTLP_ENDPOINT,
      headers: {
        "Content-Type": "application/json",
      },
      // Timeout para evitar travar a aplicação
      timeoutMillis: 5000,
    });

    // Adicionar span processor em batch (melhor performance)
    tracerProvider.addSpanProcessor(
      new BatchSpanProcessor(otlpExporter, {
        // Tamanho máximo da fila
        maxQueueSize: 100,
        // Número máximo de spans por batch
        maxExportBatchSize: 10,
        // Delay antes de exportar (ms)
        scheduledDelayMillis: 1000,
        // Timeout de exportação (ms)
        exportTimeoutMillis: 5000,
      })
    );

    // Registrar provider globalmente (API moderna)
    trace.setGlobalTracerProvider(tracerProvider);

    // Integrar com o sistema de tracing existente
    bridgeTracingService();

    isInitialized = true;

    console.log("✅ [OpenTelemetry] Inicializado com sucesso");
    console.log(`📊 [OpenTelemetry] Endpoint: ${OTLP_ENDPOINT}`);
    console.log("🔍 [OpenTelemetry] Abra o AI Toolkit Trace Viewer para visualizar traces");

    // Em desenvolvimento, mostrar instruções
    if (import.meta.env.DEV) {
      console.log(`\n${"=".repeat(70)}`);
      console.log("🎯 TRACING ATIVADO - Como visualizar:");
      console.log("1. Abra o Command Palette (Ctrl+Shift+P)");
      console.log('2. Execute: "AI Toolkit: Open Trace Viewer"');
      console.log("3. Traces aparecerão automaticamente conforme você usa o sistema");
      console.log(`${"=".repeat(70)}\n`);
    }
  } catch (error) {
    console.error("❌ [OpenTelemetry] Erro ao inicializar:", error);

    // Não travar a aplicação se tracing falhar
    // Continuar sem tracing
  }
}

/**
 * Integra o sistema de tracing existente com OpenTelemetry
 *
 * Isso permite que spans criados via tracingService sejam
 * automaticamente exportados para OpenTelemetry.
 */
function bridgeTracingService(): void {
  // Criar exporter customizado que envia spans para OpenTelemetry
  const otelBridge = {
    name: "opentelemetry-bridge",

    async export(spans: Span[]): Promise<void> {
      const tracer = trace.getTracer(SERVICE_NAME, SERVICE_VERSION);

      for (const span of spans) {
        // Converter span do sistema para OpenTelemetry
        const otelSpan = tracer.startSpan(span.name, {
          startTime: span.startTime,
          attributes: span.attributes,
        });

        // Adicionar eventos
        for (const event of span.events) {
          otelSpan.addEvent(event.name, event.attributes, event.timestamp);
        }

        // Definir status
        if (span.status === "error") {
          otelSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: span.statusMessage,
          });
        } else if (span.status === "ok") {
          otelSpan.setStatus({ code: SpanStatusCode.OK });
        }

        // Finalizar span
        if (span.endTime) {
          otelSpan.end(span.endTime);
        } else {
          otelSpan.end();
        }
      }
    },

    async shutdown(): Promise<void> {
      // Bridge não precisa de cleanup
    },
  };

  // Adicionar bridge ao sistema de tracing
  tracingService.addExporter(otelBridge);
}

/**
 * Desliga OpenTelemetry e envia traces pendentes
 *
 * Chamar antes de fechar a aplicação para garantir que
 * todos os traces sejam enviados.
 */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (tracerProvider) {
    try {
      console.log("[OpenTelemetry] Desligando e enviando traces pendentes...");
      await tracerProvider.shutdown();
      console.log("[OpenTelemetry] Desligado com sucesso");
    } catch (error) {
      console.error("[OpenTelemetry] Erro ao desligar:", error);
    }
  }
}

/**
 * Obtém o tracer OpenTelemetry para uso manual
 *
 * Na maioria dos casos, use as funções do tracingService
 * ao invés de usar o tracer diretamente.
 */
export function getOtelTracer() {
  return trace.getTracer(SERVICE_NAME, SERVICE_VERSION);
}

/**
 * Helper para criar span OpenTelemetry nativo com tratamento de erros
 *
 * @param name Nome do span
 * @param fn Função a ser executada
 * @param attributes Atributos opcionais
 *
 * @example
 * ```typescript
 * const resultado = await withOtelSpan('buscar-processo', async (span) => {
 *   span.setAttribute('processo.numero', numero);
 *   return await buscarProcesso(numero);
 * });
 * ```
 */
export async function withOtelSpan<T>(
  name: string,
  fn: (span: OtelSpan) => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = getOtelTracer();

  return tracer.startActiveSpan(name, async (span) => {
    try {
      // Adicionar atributos
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }

      // Executar função
      const result = await fn(span);

      // Marcar como sucesso
      span.setStatus({ code: SpanStatusCode.OK });

      return result;
    } catch (error) {
      // Registrar erro
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });

      span.recordException(error instanceof Error ? error : new Error(String(error)));

      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Verifica se OpenTelemetry está inicializado
 */
export function isOtelInitialized(): boolean {
  return isInitialized;
}

/**
 * Obtém estatísticas do sistema de tracing
 */
export function getTracingStats() {
  return {
    otel: {
      initialized: isInitialized,
      endpoint: OTLP_ENDPOINT,
      serviceName: SERVICE_NAME,
      serviceVersion: SERVICE_VERSION,
    },
    tracingService: tracingService.getStats(),
  };
}

/**
 * Configura endpoint OTLP customizado (útil para testes)
 *
 * IMPORTANTE: Chamar ANTES de initializeOpenTelemetry()
 */
export function setOtlpEndpoint(endpoint: string): void {
  if (isInitialized) {
    console.warn("[OpenTelemetry] Já inicializado, endpoint não pode ser alterado");
    return;
  }

  (globalThis as any).__OTLP_ENDPOINT__ = endpoint;
}

// Exportar tipos úteis
export type { AgentSpan, LLMSpan, Span, SpanKind, SpanStatus, TraceContext } from "./tracing";
