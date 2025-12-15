/**
 * Exemplo de Integração de Tracing em Agentes IA
 *
 * Este arquivo demonstra como adicionar tracing OpenTelemetry
 * aos agentes autônomos do sistema.
 *
 * @example
 * import { withAgentTracing } from '@/lib/tracing-examples';
 * const result = await withAgentTracing('justine', analisarIntimacao, expediente);
 */

import {
  addEvent,
  endLLMSpan,
  endSpan,
  recordException,
  setAttribute,
  startAgentSpan,
  startLLMSpan,
  type AgentSpan,
} from "@/lib/tracing";
import type { Expediente } from "@/types";

/**
 * Exemplo 1: Wrapper de agente com tracing automático
 */
export async function withAgentTracing<T>(
  agentId: string,
  agentName: string,
  fn: (span: AgentSpan) => Promise<T>,
  sessionId?: string
): Promise<T> {
  const span = startAgentSpan(agentId, agentName, { sessionId });

  try {
    const result = await fn(span);
    await endSpan(span, "ok");
    return result;
  } catch (error) {
    recordException(span, error as Error);
    await endSpan(span, "error", (error as Error).message);
    throw error;
  }
}

/**
 * Exemplo 2: Análise de intimação com tracing
 */
export async function analisarIntimacaoComTracing(
  expediente: Expediente
): Promise<{ tipo: string; prazo: number; urgencia: "alta" | "media" | "baixa" }> {
  // Criar span do agente
  const agentSpan = startAgentSpan("justine", "Mrs. Justin-e", {
    sessionId: `session-${Date.now()}`,
    attributes: {
      "expediente.id": expediente.id,
      "expediente.tipo": expediente.tipo,
    },
  });

  try {
    // Evento: Iniciando análise
    addEvent(agentSpan, "analise.iniciada", {
      "expediente.tamanho": (expediente.conteudo || expediente.content)?.length || 0,
    });

    // Passo 1: Extrair texto
    setAttribute(agentSpan, "step", "extraindo_texto");
    const textoCompleto = expediente.conteudo || expediente.content || "";

    addEvent(agentSpan, "texto.extraido", {
      "texto.length": textoCompleto.length,
    });

    // Passo 2: Chamar LLM (Gemini) para análise
    setAttribute(agentSpan, "step", "analisando_com_llm");
    const llmSpan = startLLMSpan("gemini-2.5-pro", {
      parentContext: agentSpan.context,
      temperature: 0.7,
      maxTokens: 1024,
      attributes: {
        "llm.task": "analise_intimacao",
      },
    });

    try {
      // Simular chamada Gemini (substitua com código real)
      const promptTokens = Math.floor(textoCompleto.length / 4);
      const completionTokens = 200;

      const resultado = {
        tipo: "intimacao",
        prazo: 15,
        urgencia: "alta" as const,
      };

      await endLLMSpan(llmSpan, {
        promptTokens,
        completionTokens,
        success: true,
      });

      // Evento: Análise concluída
      addEvent(agentSpan, "analise.concluida", {
        "resultado.tipo": resultado.tipo,
        "resultado.prazo": resultado.prazo,
        "resultado.urgencia": resultado.urgencia,
      });

      // Atributos finais do agente
      setAttribute(agentSpan, "tools_used", "gemini-2.5-pro");
      setAttribute(agentSpan, "tokens_used", promptTokens + completionTokens);
      setAttribute(agentSpan, "cost", ((promptTokens + completionTokens) / 1000) * 0.002); // $0.002 per 1k tokens

      await endSpan(agentSpan, "ok");
      return resultado;
    } catch (llmError) {
      await endLLMSpan(llmSpan, {
        promptTokens: 0,
        completionTokens: 0,
        success: false,
        error: llmError as Error,
      });
      throw llmError;
    }
  } catch (error) {
    recordException(agentSpan, error as Error);
    await endSpan(agentSpan, "error", (error as Error).message);
    throw error;
  }
}

/**
 * Exemplo 3: Workflow multi-agente com tracing
 */
export async function workflowCompletoComTracing(expediente: Expediente) {
  // Span principal do workflow
  const workflowSpan = startAgentSpan("workflow", "Workflow Completo", {
    sessionId: `workflow-${Date.now()}`,
  });

  try {
    // Passo 1: Análise (Justine)
    setAttribute(workflowSpan, "step", "analise");
    addEvent(workflowSpan, "step.analise.start");

    const analise = await analisarIntimacaoComTracing(expediente);

    addEvent(workflowSpan, "step.analise.complete", {
      "analise.tipo": analise.tipo,
    });

    // Passo 2: Geração de tarefa
    setAttribute(workflowSpan, "step", "geracao_tarefa");
    addEvent(workflowSpan, "step.tarefa.start");

    const tarefa = {
      titulo: `Responder ${analise.tipo}`,
      prazo: new Date(Date.now() + analise.prazo * 24 * 60 * 60 * 1000),
      urgencia: analise.urgencia,
    };

    addEvent(workflowSpan, "step.tarefa.complete", {
      "tarefa.titulo": tarefa.titulo,
    });

    // Passo 3: Notificação
    setAttribute(workflowSpan, "step", "notificacao");
    addEvent(workflowSpan, "step.notificacao.start");

    // Simular envio de notificação
    await new Promise((resolve) => setTimeout(resolve, 100));

    addEvent(workflowSpan, "step.notificacao.complete");

    await endSpan(workflowSpan, "ok");

    return {
      analise,
      tarefa,
      notificado: true,
    };
  } catch (error) {
    recordException(workflowSpan, error as Error);
    await endSpan(workflowSpan, "error", (error as Error).message);
    throw error;
  }
}

/**
 * Exemplo 4: Integração com agente existente
 *
 * Para adicionar tracing a um agente existente sem modificar muito código:
 */
export function wrapAgentWithTracing<TInput, TOutput>(
  agentId: string,
  agentName: string,
  originalFunction: (input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<TOutput> => {
    return withAgentTracing(agentId, agentName, async (span) => {
      // Adicionar atributos do input
      setAttribute(span, "input.type", typeof input);

      if (typeof input === "object" && input !== null) {
        setAttribute(span, "input.keys", Object.keys(input).join(","));
      }

      // Executar função original
      const result = await originalFunction(input);

      // Adicionar atributos do output
      setAttribute(span, "output.type", typeof result);

      return result;
    });
  };
}

/**
 * Exemplo de uso do wrapper:
 *
 * ```typescript
 * import { analisarDocumento } from '@/lib/agents/analise-documental';
 *
 * const analisarDocumentoComTracing = wrapAgentWithTracing(
 *   'analise-documental',
 *   'Análise Documental',
 *   analisarDocumento
 * );
 *
 * // Usar normalmente, agora com tracing automático
 * const resultado = await analisarDocumentoComTracing(expediente);
 * ```
 */
