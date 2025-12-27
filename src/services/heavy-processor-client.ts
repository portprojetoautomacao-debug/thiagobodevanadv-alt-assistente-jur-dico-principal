/**
 * Heavy Processor Client
 *
 * Adapter para comunicação com microserviço Java 21 (Spring Boot + Virtual Threads)
 * que processa tarefas pesadas de forma assíncrona.
 *
 * MODO MANUTENÇÃO: Este cliente não altera a lógica existente dos agentes.
 * Atua como fallback de alta performance quando o processamento local é inviável.
 *
 * @see docs/HEAVY_PROCESSOR_INTEGRATION.md
 */

import type { Expediente } from "@/types";

// ===========================
// Types
// ===========================

export interface HeavyProcessorConfig {
  baseUrl: string;
  timeout: number;
  apiKey?: string;
  enabled: boolean;
}

export interface ProcessorRequest {
  expedientes: Expediente[];
  operation: "pdf-extraction" | "batch-sync" | "bulk-analysis";
  options?: {
    parallel?: boolean;
    priority?: "low" | "normal" | "high";
    maxThreads?: number;
  };
}

export interface ProcessorResponse {
  success: boolean;
  results: ProcessorResult[];
  executionTimeMs: number;
  threadsUsed: number;
  error?: string;
}

export interface ProcessorResult {
  expedienteId: string;
  success: boolean;
  data?: {
    extractedText?: string;
    analysis?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
}

export interface StreamingChunk {
  expedienteId: string;
  progress: number;
  status: "processing" | "completed" | "error";
  chunk?: string;
}

// ===========================
// Client Class
// ===========================

export class HeavyProcessorClient {
  private config: HeavyProcessorConfig;
  private abortControllers: Map<string, AbortController>;

  constructor(config?: Partial<HeavyProcessorConfig>) {
    this.config = {
      baseUrl: import.meta.env.VITE_HEAVY_PROCESSOR_URL || "http://localhost:8080",
      timeout: 300000, // 5 minutos (limite do Vercel)
      apiKey: import.meta.env.VITE_HEAVY_PROCESSOR_API_KEY,
      enabled: import.meta.env.VITE_HEAVY_PROCESSOR_ENABLED === "true",
      ...config,
    };
    this.abortControllers = new Map();
  }

  /**
   * Verifica se o serviço está disponível
   */
  async isAvailable(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/actuator/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5s timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Processa expedientes em lote (não-streaming)
   */
  async processBatch(request: ProcessorRequest): Promise<ProcessorResponse> {
    if (!this.config.enabled) {
      throw new Error("Heavy Processor está desabilitado");
    }

    const controller = new AbortController();
    const requestId = `batch-${Date.now()}`;
    this.abortControllers.set(requestId, controller);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/process/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Processor error: ${error}`);
      }

      const result: ProcessorResponse = await response.json();
      return result;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Processa expedientes com streaming (para UI em tempo real)
   */
  async *processWithStreaming(
    request: ProcessorRequest
  ): AsyncGenerator<StreamingChunk, void, undefined> {
    if (!this.config.enabled) {
      throw new Error("Heavy Processor está desabilitado");
    }

    const controller = new AbortController();
    const requestId = `stream-${Date.now()}`;
    this.abortControllers.set(requestId, controller);

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/process/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Processor error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream não disponível");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.substring(6);
            if (data === "[DONE]") continue;

            try {
              const chunk: StreamingChunk = JSON.parse(data);
              yield chunk;
            } catch {
              // Ignora chunks malformados
              continue;
            }
          }
        }
      }
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Cancela processamento em andamento
   */
  cancelProcessing(requestId?: string): void {
    if (requestId) {
      const controller = this.abortControllers.get(requestId);
      controller?.abort();
      this.abortControllers.delete(requestId);
    } else {
      // Cancela todos
      this.abortControllers.forEach((controller) => controller.abort());
      this.abortControllers.clear();
    }
  }

  /**
   * Extrai texto de PDFs (operação pesada)
   */
  async extractPdfText(pdfUrl: string): Promise<string> {
    const response = await this.processBatch({
      expedientes: [
        {
          id: `pdf-${Date.now()}`,
          tipo: "documento",
          conteudo: pdfUrl,
        } as Expediente,
      ],
      operation: "pdf-extraction",
      options: {
        parallel: false,
      },
    });

    if (!response.success || response.results.length === 0) {
      throw new Error(response.error || "Falha ao extrair PDF");
    }

    return response.results[0].data?.extractedText || "";
  }
}

// ===========================
// Singleton Instance
// ===========================

let clientInstance: HeavyProcessorClient | null = null;

export function getHeavyProcessorClient(): HeavyProcessorClient {
  if (!clientInstance) {
    clientInstance = new HeavyProcessorClient();
  }
  return clientInstance;
}

// ===========================
// Utility Functions
// ===========================

/**
 * Verifica se deve usar o processador pesado ao invés do processamento local
 */
export function shouldUseHeavyProcessor(expedientes: Expediente[]): boolean {
  // Verificar se está habilitado via env var
  const enabled = import.meta.env.VITE_HEAVY_PROCESSOR_ENABLED === 'true';
  if (!enabled) {
    return false;
  }

  // Volume alto de expedientes (> 10)
  if (expedientes.length > 10) {
    return true;
  }

  // Expedientes com PDFs grandes
  const hasPdfProcessing = expedientes.some(
    (exp) => exp.tipo === "documento" && exp.conteudo && exp.conteudo.length > 10000
  );
  if (hasPdfProcessing) {
    return true;
  }

  return false;
}
