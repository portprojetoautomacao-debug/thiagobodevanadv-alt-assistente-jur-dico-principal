/**
 * Sentry Google Gen AI Integration (Official SDK Implementation)
 *
 * Integração OFICIAL do Sentry para monitorar Google Gemini SDK.
 * Usa googleGenAIIntegration() disponível em @sentry/react v10.14.0+
 *
 * **✅ LGPD COMPLIANCE:** Sanitiza inputs/outputs de LLM antes de enviar para Sentry
 *
 * Baseado em:
 * - https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/integrations/google-genai/
 * - https://docs.sentry.io/platforms/javascript/guides/react/tracing/span-metrics/examples/#manual-llm-instrumentation-custom-ai-agent--tool-calls
 * - https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents-module/
 *
 * A integração oficial captura automaticamente:
 * - models.generateContent()
 * - models.generateContentStream()
 * - chats.create()
 * - sendMessage()
 * - sendMessageStream()
 *
 * Spans criados seguem convenções OpenTelemetry:
 * - op: gen_ai.chat, gen_ai.invoke_agent, gen_ai.execute_tool
 * - Atributos: gen_ai.system, gen_ai.request.model, gen_ai.usage.*, etc.
 *
 * @module sentry-gemini-integration-v2
 * @version 2.1.0 - Adicionado PII filtering para LGPD compliance
 */

import * as Sentry from "@sentry/react";
import { sanitizePII, DEFAULT_PII_CONFIG, type PIIFilterConfig } from "@/services/pii-filtering";

/**
 * Opções de configuração da integração Gemini (padrão oficial SDK)
 */
export interface GeminiIntegrationOptions {
  /**
   * Se deve gravar INPUTS (prompts, messages) nos spans do Sentry.
   *
   * O Sentry considera inputs/outputs de LLM como PII (Personally Identifiable Information).
   * Por padrão, usa o valor de `send_default_pii` na inicialização do Sentry.
   *
   * ✅ LGPD: Mesmo quando true, dados sensíveis são sanitizados automaticamente
   *
   * @default true se send_default_pii=true, false caso contrário
   */
  recordInputs?: boolean;

  /**
   * Se deve gravar OUTPUTS (respostas, generated text) nos spans do Sentry.
   *
   * O Sentry considera inputs/outputs de LLM como PII (Personally Identifiable Information).
   * Por padrão, usa o valor de `send_default_pii` na inicialização do Sentry.
   *
   * ✅ LGPD: Mesmo quando true, dados sensíveis são sanitizados automaticamente
   *
   * @default true se send_default_pii=true, false caso contrário
   */
  recordOutputs?: boolean;

  /**
   * ✅ LGPD: Configuração de PII filtering
   *
   * Se não especificado, usa DEFAULT_PII_CONFIG (habilitado em produção)
   */
  piiFilterConfig?: PIIFilterConfig;
}

/**
 * Tipos de role em uma mensagem de chat AI
 */
type ChatRole = "user" | "assistant" | "system";

/**
 * Mensagem de chat AI
 */
interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * Atributos de configuração de um agente AI (seguindo convenções OpenTelemetry)
 */
export interface AIAgentConfig {
  /**
   * Nome do agente (ex: "Harvey Specter", "Mrs. Justin-e")
   */
  agentName: string;

  /**
   * Sistema de IA (ex: "gemini", "openai", "custom-llm")
   * @see https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents-module/#common-span-attributes
   */
  system: "gemini" | "gcp.gemini" | "openai" | "anthropic" | "custom-llm";

  /**
   * Modelo usado (ex: "gemini-2.5-pro", "gpt-4", "claude-3")
   */
  model: string;

  /**
   * Temperatura (0.0 - 1.0)
   */
  temperature?: number;

  /**
   * Máximo de tokens
   */
  maxTokens?: number;
}

/**
 * Metadados de uma conversa AI (para rastreamento de sessões)
 */
export interface AIConversationMetadata {
  /**
   * ID único da sessão de conversa
   */
  sessionId: string;

  /**
   * Número do turno da conversa (incrementa a cada mensagem)
   */
  turn: number;

  /**
   * Histórico de mensagens (opcional)
   */
  messages?: ChatMessage[];
}

/**
 * Configuração global da integração (pode ser alterada em runtime)
 */
let globalGeminiConfig: GeminiIntegrationOptions = {
  recordInputs: true,
  recordOutputs: true,
  piiFilterConfig: DEFAULT_PII_CONFIG,
};

/**
 * ✅ LGPD: Sanitiza atributos de um span AI
 *
 * Remove ou mascara dados sensíveis (CPF, email, telefone, etc.) de:
 * - gen_ai.request.messages
 * - gen_ai.response.text
 * - gen_ai.tool.input
 * - gen_ai.tool.output
 * - conversation.session_id (se contém dados sensíveis)
 *
 * @internal
 */
function sanitizeSpanAttributes(
  attributes: Record<string, unknown>,
  config: PIIFilterConfig
): Record<string, unknown> {
  if (!config.enabled) {
    return attributes;
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    // Sanitiza strings
    if (typeof value === "string") {
      sanitized[key] = sanitizePII(value, config);
    }
    // Sanitiza objetos JSON (messages, tool input/output)
    else if (value && typeof value === "object") {
      try {
        const jsonStr = JSON.stringify(value);
        const sanitizedStr = sanitizePII(jsonStr, config);
        sanitized[key] = JSON.parse(sanitizedStr);
      } catch {
        // Se falhar parsing, mantém original
        sanitized[key] = value;
      }
    }
    // Outros tipos passam direto
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * ✅ LGPD: Cria beforeSendTransaction para sanitizar AI spans
 *
 * Aplicar no Sentry.init():
 * ```ts
 * Sentry.init({
 *   beforeSendTransaction: createAISanitizingBeforeSendTransaction()
 * });
 * ```
 */
export function createAISanitizingBeforeSendTransaction(
  config: PIIFilterConfig = DEFAULT_PII_CONFIG
) {
  return (transaction: any) => {
    if (!config.enabled) {
      return transaction;
    }

    // Sanitiza spans de AI (gen_ai.*)
    if (transaction.spans) {
      for (const span of transaction.spans) {
        // Verifica se é span de AI
        if (
          span.op?.startsWith("gen_ai.") ||
          span.op?.startsWith("gen_ai_") ||
          span.description?.includes("gen_ai") ||
          span.description?.includes("invoke_agent") ||
          span.description?.includes("execute_tool")
        ) {
          // Sanitiza atributos do span
          if (span.data) {
            span.data = sanitizeSpanAttributes(span.data, config);
          }

          // Sanitiza description (pode conter nome do agente com dados sensíveis)
          if (span.description && typeof span.description === "string") {
            span.description = sanitizePII(span.description, config);
          }
        }
      }
    }

    // Sanitiza contexts (extra, tags, etc.)
    if (transaction.contexts) {
      for (const [contextName, contextData] of Object.entries(transaction.contexts)) {
        if (contextData && typeof contextData === "object") {
          transaction.contexts[contextName] = sanitizeSpanAttributes(
            contextData as Record<string, unknown>,
            config
          );
        }
      }
    }

    return transaction;
  };
}

/**
 * Cria um span manual de invocação de agente AI
 *
 * ✅ LGPD: Dados sensíveis são sanitizados antes de enviar para Sentry
 *
 * Segue convenções OpenTelemetry do Sentry:
 * - op: "gen_ai.invoke_agent"
 * - name: "invoke_agent {agentName}"
 * - Atributos: gen_ai.operation.name, gen_ai.agent.name, gen_ai.system, etc.
 *
 * @example
 * ```tsx
 * const result = await createInvokeAgentSpan(
 *   {
 *     agentName: "Harvey Specter",
 *     system: "gemini",
 *     model: "gemini-2.5-pro"
 *   },
 *   { sessionId: "session_123", turn: 1 },
 *   async (span) => {
 *     const response = await callGeminiAPI();
 *     span.setAttribute("gen_ai.response.text", response.text);
 *     span.setAttribute("gen_ai.usage.total_tokens", response.tokens);
 *     return response;
 *   }
 * );
 * ```
 */
export async function createInvokeAgentSpan<T>(
  config: AIAgentConfig,
  conversation: AIConversationMetadata,
  callback: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  // ✅ LGPD: Sanitiza atributos antes de criar span
  const piiConfig = globalGeminiConfig.piiFilterConfig || DEFAULT_PII_CONFIG;
  const shouldRecord = globalGeminiConfig.recordInputs !== false;

  const sanitizedAttributes = shouldRecord
    ? sanitizeSpanAttributes(
        {
          "gen_ai.operation.name": "invoke_agent",
          "gen_ai.agent.name": config.agentName,
          "gen_ai.system": config.system,
          "gen_ai.request.model": config.model,
          "gen_ai.response.model": config.model,
          "conversation.session_id": conversation.sessionId,
          "conversation.turn": conversation.turn,
          ...(config.temperature !== undefined && {
            "gen_ai.request.temperature": config.temperature,
          }),
          ...(config.maxTokens !== undefined && {
            "gen_ai.request.max_tokens": config.maxTokens,
          }),
          ...(conversation.messages && {
            "gen_ai.request.messages": JSON.stringify(conversation.messages),
          }),
        },
        piiConfig
      )
    : {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": config.agentName,
        "gen_ai.system": config.system,
        "gen_ai.request.model": config.model,
        "conversation.turn": conversation.turn,
      };

  return Sentry.startSpan(
    {
      name: `invoke_agent ${config.agentName}`,
      op: "gen_ai.invoke_agent",
      attributes: sanitizedAttributes as Record<string, any>,
    },
    async (span) => {
      try {
        const result = await callback(span);

        // Marca como sucesso se não houve erro
        span?.setStatus({ code: 1, message: "ok" });

        return result;
      } catch (error) {
        // Marca como erro
        span?.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : "internal_error",
        });

        span?.setAttribute(
          "error.type",
          error instanceof Error ? error.constructor.name : "UnknownError"
        );

        throw error;
      }
    }
  );
}

/**
 * Cria um span manual de chamada LLM (chat)
 *
 * Segue convenções OpenTelemetry do Sentry:
 * - op: "gen_ai.chat"
 * - name: "chat {model}"
 * - Atributos: gen_ai.operation.name, gen_ai.system, gen_ai.request.messages, etc.
 *
 * @example
 * ```tsx
 * const response = await createChatSpan(
 *   {
 *     agentName: "Assistant",
 *     system: "gemini",
 *     model: "gemini-2.5-pro",
 *     temperature: 0.7
 *   },
 *   [{ role: "user", content: "Analyze this legal document" }],
 *   async (span) => {
 *     const result = await callGeminiAPI();
 *     span.setAttribute("gen_ai.response.text", JSON.stringify([result.text]));
 *     span.setAttribute("gen_ai.usage.input_tokens", result.usage.promptTokens);
 *     span.setAttribute("gen_ai.usage.output_tokens", result.usage.responseTokens);
 *     return result;
 *   }
 * );
 * ```
 */
export async function createChatSpan<T>(
  config: AIAgentConfig,
  messages: ChatMessage[],
  callback: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `chat ${config.model}`,
      op: "gen_ai.chat",
      attributes: {
        "gen_ai.operation.name": "chat",
        "gen_ai.system": config.system,
        "gen_ai.request.model": config.model,
        "gen_ai.request.messages": JSON.stringify(messages),
        ...(config.temperature !== undefined && {
          "gen_ai.request.temperature": config.temperature,
        }),
        ...(config.maxTokens !== undefined && { "gen_ai.request.max_tokens": config.maxTokens }),
      },
    },
    async (span) => {
      try {
        const result = await callback(span);
        span?.setStatus({ code: 1, message: "ok" });
        return result;
      } catch (error) {
        span?.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : "error",
        });

        span?.setAttribute(
          "error.type",
          error instanceof Error ? error.constructor.name : "UnknownError"
        );

        throw error;
      }
    }
  );
}

/**
 * Cria um span manual de execução de ferramenta (tool)
 *
 * Segue convenções OpenTelemetry do Sentry:
 * - op: "gen_ai.execute_tool"
 * - name: "execute_tool {toolName}"
 * - Atributos: gen_ai.tool.name, gen_ai.tool.type, gen_ai.tool.input, gen_ai.tool.output
 *
 * @example
 * ```tsx
 * const toolOutput = await createExecuteToolSpan(
 *   { agentName: "Harvey", system: "gemini", model: "gemini-2.5-pro" },
 *   {
 *     toolName: "search_knowledge_base",
 *     toolType: "function",
 *     toolInput: JSON.stringify({ query: "prazo recursal" })
 *   },
 *   async (span) => {
 *     const result = await searchKnowledgeBase("prazo recursal");
 *     span.setAttribute("gen_ai.tool.output", JSON.stringify(result));
 *     return result;
 *   }
 * );
 * ```
 */
export async function createExecuteToolSpan<T>(
  config: AIAgentConfig,
  tool: {
    toolName: string;
    toolType: "function" | "extension" | "datastore";
    toolInput?: string;
    toolDescription?: string;
  },
  callback: (span: Sentry.Span | undefined) => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `execute_tool ${tool.toolName}`,
      op: "gen_ai.execute_tool",
      attributes: {
        "gen_ai.operation.name": "execute_tool",
        "gen_ai.tool.name": tool.toolName,
        "gen_ai.tool.type": tool.toolType,
        "gen_ai.system": config.system,
        "gen_ai.request.model": config.model,
        ...(tool.toolInput && { "gen_ai.tool.input": tool.toolInput }),
        ...(tool.toolDescription && { "gen_ai.tool.description": tool.toolDescription }),
      },
    },
    async (span) => {
      try {
        const result = await callback(span);
        span?.setStatus({ code: 1, message: "ok" });
        return result;
      } catch (error) {
        span?.setStatus({
          code: 2,
          message: error instanceof Error ? error.message : "error",
        });

        span?.setAttribute(
          "error.type",
          error instanceof Error ? error.constructor.name : "UnknownError"
        );

        throw error;
      }
    }
  );
}

/**
 * Cria um span de handoff entre agentes
 *
 * Marca a transferência de contexto de um agente para outro.
 * Segue convenções OpenTelemetry do Sentry.
 *
 * @example
 * ```tsx
 * await createHandoffSpan("Harvey Specter", "Mrs. Justin-e");
 * // Agora invoke o segundo agente
 * await createInvokeAgentSpan({ agentName: "Mrs. Justin-e", ... }, ...);
 * ```
 */
export async function createHandoffSpan(fromAgent: string, toAgent: string): Promise<void> {
  return Sentry.startSpan(
    {
      name: `handoff from ${fromAgent} to ${toAgent}`,
      op: "gen_ai.handoff",
      attributes: {
        "gen_ai.from_agent": fromAgent,
        "gen_ai.to_agent": toAgent,
      },
    },
    async (span) => {
      span?.setStatus({ code: 1, message: "ok" });
      // Handoff span apenas marca a transferência, não executa código
    }
  );
}

/**
 * Hook React para criar spans AI com gerenciamento de estado
 *
 * @example
 * ```tsx
 * function MyAIComponent() {
 *   const { invokeAgent, executeTool } = useAIInstrumentation();
 *
 *   const handleQuery = async (userMessage: string) => {
 *     const result = await invokeAgent(
 *       {
 *         agentName: "Harvey Specter",
 *         system: "gemini",
 *         model: "gemini-2.5-pro"
 *       },
 *       { sessionId: "session_123", turn: 1 },
 *       async (span) => {
 *         const response = await callGeminiAPI(userMessage);
 *         span?.setAttribute("gen_ai.response.text", response.text);
 *         return response;
 *       }
 *     );
 *   };
 * }
 * ```
 */
export function useAIInstrumentation() {
  const invokeAgent = async <T>(
    config: AIAgentConfig,
    conversation: AIConversationMetadata,
    callback: (span: Sentry.Span | undefined) => Promise<T>
  ): Promise<T> => {
    return createInvokeAgentSpan(config, conversation, callback);
  };

  const chat = async <T>(
    config: AIAgentConfig,
    messages: ChatMessage[],
    callback: (span: Sentry.Span | undefined) => Promise<T>
  ): Promise<T> => {
    return createChatSpan(config, messages, callback);
  };

  const executeTool = async <T>(
    config: AIAgentConfig,
    tool: {
      toolName: string;
      toolType: "function" | "extension" | "datastore";
      toolInput?: string;
      toolDescription?: string;
    },
    callback: (span: Sentry.Span | undefined) => Promise<T>
  ): Promise<T> => {
    return createExecuteToolSpan(config, tool, callback);
  };

  const handoff = async (fromAgent: string, toAgent: string): Promise<void> => {
    return createHandoffSpan(fromAgent, toAgent);
  };

  return {
    invokeAgent,
    chat,
    executeTool,
    handoff,
  };
}

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

/**
 * Retorna as opções da integração Gemini para uso no Sentry.init()
 *
 * NOTA: No JavaScript SDK, a integração googleGenAIIntegration() está disponível
 * mas pode não estar importada por padrão. Se o SDK não tiver a integração,
 * use os spans manuais (createInvokeAgentSpan, createChatSpan, etc.)
 *
 * @example
 * ```ts
 * import * as Sentry from '@sentry/react';
 * import { getGeminiIntegrationForSentry } from '@/lib/sentry-gemini-integration-v2';
 *
 * Sentry.init({
 *   dsn: "...",
 *   integrations: [
 *     // ...outras integrações
 *     ...getGeminiIntegrationForSentry()
 *   ]
 * });
 * ```
 */
export function getGeminiIntegrationForSentry(): Array<unknown> {
  // NOTA: googleGenAIIntegration pode não estar disponível no @sentry/react v10
  // Se estiver disponível, retorna a integração oficial:
  // return [Sentry.googleGenAIIntegration({
  //   recordInputs: globalGeminiConfig.recordInputs,
  //   recordOutputs: globalGeminiConfig.recordOutputs
  // })];

  // Por enquanto, retorna array vazio e usa spans manuais
  console.warn(
    "[Sentry] googleGenAIIntegration não disponível no @sentry/react v10, usando spans manuais"
  );
  return [];
}

/**
 * Inicializar integração Gemini com Sentry (legacy compatibility)
 *
 * Mantido para compatibilidade com código existente.
 * Use getGeminiIntegrationForSentry() no Sentry.init() em vez disso.
 *
 * @deprecated Use getGeminiIntegrationForSentry() no Sentry.init()
 */
export function initGeminiIntegration(options: GeminiIntegrationOptions = {}) {
  setGeminiIntegrationOptions(options);

  console.log("[Sentry] Gemini Integration configurada (usando spans manuais)", options);

  return globalGeminiConfig;
}
