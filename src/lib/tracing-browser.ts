/**
 * OpenTelemetry Tracing Configuration for Browser
 *
 * Configuração específica para frontend (React/Vite)
 * Instrumenta automaticamente Gemini AI e interações do usuário
 */

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
import { XMLHttpRequestInstrumentation } from "@opentelemetry/instrumentation-xml-http-request";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

// Resource attributes para identificar o serviço
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: "assistente-juridico-pje-frontend",
  [SEMRESATTRS_SERVICE_VERSION]: "1.0.1",
  "deployment.environment": import.meta.env.MODE || "development",
});

// ✅ Configuração de tracing otimizada para AI Toolkit
const isDev = import.meta.env.MODE === "development";
const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT || "";
const tracingEnabled = import.meta.env.VITE_ENABLE_TRACING === "true" && otlpEndpoint !== "";

let spanProcessor: BatchSpanProcessor;

if (tracingEnabled && otlpEndpoint) {
  // OTLP configurado - enviar para AI Toolkit
  console.log(`[Tracing] Enviando traces para: ${otlpEndpoint}`);
  try {
    const otlpExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      headers: {},
      // Timeout aumentado para evitar erros de conexão
      timeoutMillis: 5000,
    });
    spanProcessor = new BatchSpanProcessor(otlpExporter, {
      // Configuração otimizada para AI Toolkit
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 1000, // Enviar a cada 1 segundo
    });
    console.log("[Tracing] ✅ OTLP Exporter configurado com sucesso");
  } catch (error) {
    console.warn("[Tracing] ⚠️  Erro ao configurar OTLP, usando console apenas:", error);
    spanProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
  }
  } catch (error) {
    console.warn("[Tracing] ⚠️ Erro ao configurar OTLP, usando ConsoleSpanExporter:", error);
    spanProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
  }
} else {
  // Fallback: ConsoleSpanExporter (debug local)
  console.log("[Tracing] Usando ConsoleSpanExporter (tracing desabilitado ou sem endpoint)");
  spanProcessor = new BatchSpanProcessor(new ConsoleSpanExporter());
}

// Provider de traces com span processor configurado
const provider = new WebTracerProvider({
  resource,
  spanProcessors: [spanProcessor],
});

// Registrar o provider globalmente
provider.register();

// Instrumentações automáticas para browser
registerInstrumentations({
  instrumentations: [
    new FetchInstrumentation({
      // Propagar contexto de tracing em requests
      propagateTraceHeaderCorsUrls: [
        /localhost/,
        /127\.0\.0\.1/,
        /vercel\.app/,
        /generativelanguage\.googleapis\.com/, // Gemini API
        /openai\.azure\.com/, // Azure OpenAI
        /services\.ai\.azure\.com/, // Azure AI Foundry
      ],
      // Ignorar health checks e assets estáticos
      ignoreUrls: [/\/api\/health/, /\.(js|css|png|jpg|svg|woff|woff2)$/],
    }),
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        /localhost/,
        /vercel\.app/,
        /generativelanguage\.googleapis\.com/,
      ],
    }),
  ],
});

/**
 * Inicializa o tracing no browser
 * DEVE ser chamado no início da aplicação React
 */
export function initBrowserTracing(): void {
  try {
    const isDev = import.meta.env.MODE === "development";
    const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT;

    console.log("[Tracing] OpenTelemetry Browser iniciado com sucesso");

    if (otlpEndpoint) {
      console.log("[Tracing] OTLP Endpoint:", otlpEndpoint);
    } else if (isDev) {
      console.log(
        "[Tracing] Modo desenvolvimento - usando ConsoleSpanExporter (OTLP desabilitado)"
      );
    } else {
      console.warn("[Tracing] OTLP não configurado - traces não serão enviados");
    }
  } catch (error) {
    console.error("[Tracing] Erro ao iniciar OpenTelemetry Browser:", error);
  }
}

/**
 * Finaliza o tracing gracefully
 */
export async function shutdownBrowserTracing(): Promise<void> {
  try {
    await provider.shutdown();
    console.log("[Tracing] OpenTelemetry Browser finalizado com sucesso");
  } catch (error) {
    console.error("[Tracing] Erro ao finalizar OpenTelemetry Browser:", error);
  }
}
