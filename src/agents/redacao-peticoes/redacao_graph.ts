import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import { generatePeticao } from "@/lib/gemini-service";

export class RedacaoPeticoesAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente completo
    return createInvokeAgentSpan(
      {
        agentName: "Redação de Petições",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.5,
      },
      {
        sessionId: (state.data?.sessionId as string) || `redacao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "redacao:start" });

        // Extrair dados para redação
        const tipo = (state.data?.tipo as string) || "petição inicial";
        const detalhes = (state.data?.detalhes as string) || "Detalhes não fornecidos";

        span?.setAttribute("gen_ai.petition.type", tipo);
        span?.setAttribute("gen_ai.petition.details_length", detalhes.length);

        // Chamar Gemini para gerar petição
        const geminiResponse = await generatePeticao(tipo, detalhes);

        if (geminiResponse.error) {
          span?.setAttribute("gen_ai.error", geminiResponse.error);
          span?.setStatus({ code: 2, message: geminiResponse.error });

          current = updateState(current, {
            currentStep: "redacao:error",
            error: geminiResponse.error,
            completed: true,
          });

          return current;
        }

        const draft = geminiResponse.text;

        span?.setAttribute("gen_ai.response.length", draft.length);
        span?.setAttribute("gen_ai.response.model", geminiResponse.metadata?.model || "unknown");
        span?.setAttribute("gen_ai.usage.total_tokens", geminiResponse.metadata?.totalTokens || 0);

        current = updateState(current, {
          currentStep: "redacao:done",
          data: {
            ...current.data,
            draft,
            metadata: geminiResponse.metadata,
          },
          completed: true,
        });

        return this.addAgentMessage(
          current,
          `Redação: rascunho gerado com sucesso (${draft.length} caracteres)`
        );
      }
    );
  }
}

export async function runRedacaoPeticoes(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new RedacaoPeticoesAgent();
  const initialState: AgentState = {
    messages: [],
    currentStep: "init",
    data,
    completed: false,
    retryCount: 0,
    maxRetries: 3,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  return agent.execute(initialState);
}
