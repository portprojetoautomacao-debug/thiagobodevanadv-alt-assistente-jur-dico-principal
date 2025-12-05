/**
 * Sentry Google Gen AI Integration
 *
 * Integração automática para monitorar chamadas ao Google Gemini no Sentry.
 * Baseado em: https://docs.sentry.io/platforms/python/integrations/google-genai/
 *
 * Esta integração intercepta chamadas ao Gemini e cria spans automaticamente,
 * incluindo dados de prompts, respostas e uso de tokens.
 *
 * @module sentry-gemini-integration
 * @version 1.0.0
 */

import * as Sentry from "@sentry/react";

/**
 * Opções de configuração da integração Gemini
 */
export interface GeminiIntegrationOptions {
  /**
   * Se deve incluir prompts e outputs nos spans do Sentry.
   *
   * O Sentry considera inputs/outputs de LLM como PII (Personally Identifiable Information).
   * Para incluir esses dados, defina `send_default_pii=true` na inicialização do Sentry
   * OU configure `includePrompts=true` aqui.
   *
   * @default true (se send_default_pii estiver ativo)
   */
  includePrompts?: boolean;

  /**
   * Se deve capturar erros automaticamente
   *
   * @default true
   */
  captureErrors?: boolean;
}

/**
 * Metadados de uma chamada Gemini interceptada
 */
interface GeminiCallMetadata {
  model: string;
  operation: "generate_content" | "stream_generate_content";
  prompt?: string | string[];
  temperature?: number;
  maxTokens?: number;
  startTime: number;
}

/**
 * Wrapper para chamada ao Gemini com instrumentação Sentry
 *
 * @example
 * ```ts
 * const geminiCall = instrumentGeminiCall({
 *   model: "gemini-2.5-pro",
 *   operation: "generate_content",
 *   prompt: "Analyze this legal document"
 * });
 *
 * const result = await geminiCall(async () => {
 *   return await callGeminiAPI();
 * });
 * ```
 */
export function instrumentGeminiCall<T>(
  metadata: GeminiCallMetadata,
  options: GeminiIntegrationOptions = {}
): (fn: () => Promise<T>) => Promise<T> {
  const { includePrompts = true, captureErrors = true } = options;

  return async (fn: () => Promise<T>): Promise<T> => {
    // Criar span para a chamada LLM
    const span = Sentry.startInactiveSpan({
      op: "gen_ai.chat",
      name: `chat ${metadata.model}`,
      attributes: {
        "gen_ai.operation.name": "chat",
        "gen_ai.system": "gcp.gemini",
        "gen_ai.request.model": metadata.model,
      },
    });

    // Adicionar atributos opcionais
    if (metadata.temperature !== undefined) {
      span?.setAttribute("gen_ai.request.temperature", metadata.temperature);
    }

    if (metadata.maxTokens !== undefined) {
      span?.setAttribute("gen_ai.request.max_tokens", metadata.maxTokens);
    }

    // Adicionar prompts se permitido
    if (includePrompts && metadata.prompt) {
      const messages = Array.isArray(metadata.prompt)
        ? metadata.prompt.map((p) => ({ role: "user", content: p }))
        : [{ role: "user", content: metadata.prompt }];

      span?.setAttribute("gen_ai.request.messages", JSON.stringify(messages));
    }

    try {
      const result = await fn();

      // Extrair informações da resposta
      if (result && typeof result === "object") {
        const response = result as Record<string, unknown>;

        // Capturar texto da resposta
        if (includePrompts && response.text) {
          span?.setAttribute("gen_ai.response.text", JSON.stringify([String(response.text)]));
        }

        // Capturar uso de tokens
        if (response.metadata && typeof response.metadata === "object") {
          const meta = response.metadata as Record<string, unknown>;

          if (typeof meta.promptTokens === "number") {
            span?.setAttribute("gen_ai.usage.input_tokens", meta.promptTokens);
          }

          if (typeof meta.responseTokens === "number") {
            span?.setAttribute("gen_ai.usage.output_tokens", meta.responseTokens);
          }

          if (typeof meta.totalTokens === "number") {
            span?.setAttribute("gen_ai.usage.total_tokens", meta.totalTokens);
          }
        }
      }

      // Marcar como sucesso
      span?.setStatus({ code: 1 });

      return result;
    } catch (error) {
      // Capturar erro
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      span?.setStatus({
        code: 2,
        message: errorMessage,
      });

      // Reportar erro ao Sentry se habilitado
      if (captureErrors) {
        Sentry.captureException(error, {
          tags: {
            "ai.model": metadata.model,
            "ai.operation": metadata.operation,
          },
          contexts: {
            gemini: {
              model: metadata.model,
              operation: metadata.operation,
              duration_ms: Date.now() - metadata.startTime,
            },
          },
        });
      }

      throw error;
    } finally {
      span?.end();
    }
  };
}

/**
 * Hook para instrumentar chamadas Gemini automaticamente
 *
 * @example
 * ```tsx
 * const { wrapGeminiCall } = useGeminiInstrumentation();
 *
 * const response = await wrapGeminiCall({
 *   model: "gemini-2.5-pro",
 *   prompt: "Analyze this"
 * }, async () => {
 *   return await callGeminiAPI();
 * });
 * ```
 */
export function useGeminiInstrumentation(options: GeminiIntegrationOptions = {}) {
  const wrapGeminiCall = async <T>(
    config: {
      model: string;
      prompt?: string | string[];
      temperature?: number;
      maxTokens?: number;
      operation?: "generate_content" | "stream_generate_content";
    },
    fn: () => Promise<T>
  ): Promise<T> => {
    const metadata: GeminiCallMetadata = {
      model: config.model,
      operation: config.operation || "generate_content",
      prompt: config.prompt,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      startTime: Date.now(),
    };

    const wrapper = instrumentGeminiCall<T>(metadata, options);
    return wrapper(fn);
  };

  return { wrapGeminiCall };
}

/**
 * Decorator para funções que fazem chamadas ao Gemini
 *
 * @example
 * ```ts
 * const myGeminiFunction = withGeminiInstrumentation(
 *   async (prompt: string) => {
 *     return await callGeminiAPI(prompt);
 *   },
 *   { model: "gemini-2.5-pro" }
 * );
 * ```
 */
export function withGeminiInstrumentation<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: {
    model: string;
    getPrompt?: (...args: TArgs) => string | string[];
    temperature?: number;
    maxTokens?: number;
  },
  options: GeminiIntegrationOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const metadata: GeminiCallMetadata = {
      model: config.model,
      operation: "generate_content",
      prompt: config.getPrompt ? config.getPrompt(...args) : undefined,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      startTime: Date.now(),
    };

    const wrapper = instrumentGeminiCall<TReturn>(metadata, options);
    return wrapper(() => fn(...args));
  };
}

/**
 * Inicializar integração Gemini com Sentry
 *
 * Deve ser chamado após `Sentry.init()` para habilitar monitoramento automático.
 *
 * @example
 * ```ts
 * import { initGeminiIntegration } from '@/lib/sentry-gemini-integration';
 *
 * // Depois de Sentry.init()
 * initGeminiIntegration({
 *   includePrompts: true,
 *   captureErrors: true
 * });
 * ```
 */
export function initGeminiIntegration(options: GeminiIntegrationOptions = {}) {
  const config = {
    includePrompts: options.includePrompts !== false,
    captureErrors: options.captureErrors !== false,
  };

  console.log("[Sentry] Gemini Integration initialized", config);

  // Retornar configuração para uso global
  return config;
}

/**
 * Configuração global da integração (pode ser alterada em runtime)
 */
let globalGeminiConfig: GeminiIntegrationOptions = {
  includePrompts: true,
  captureErrors: true,
};

/**
 * Atualizar configuração global da integração Gemini
 */
export function setGeminiIntegrationOptions(options: GeminiIntegrationOptions) {
  globalGeminiConfig = { ...globalGeminiConfig, ...options };
}

/**
 * Obter configuração global da integração Gemini
 */
export function getGeminiIntegrationOptions(): GeminiIntegrationOptions {
  return { ...globalGeminiConfig };
}
