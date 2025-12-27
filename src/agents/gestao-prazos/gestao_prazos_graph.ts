import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";

export class GestaoPrazosAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Gestão de Prazos
    return createInvokeAgentSpan(
      {
        agentName: "Gestão de Prazos",
        system: "custom-llm",
        model: "prazo-calculator",
      },
      {
        sessionId: (state.data?.sessionId as string) || `gestao_prazos_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "gestao-prazos:start" });

        // Extrair dados de entrada
        const tipoProcesso = (state.data?.tipoProcesso as string) || "cível";
        const dataPublicacao = (state.data?.dataPublicacao as string) || new Date().toISOString();
        const prazoEmDias = (state.data?.prazoEmDias as number) || 15;

        span?.setAttribute("prazos.tipo_processo", tipoProcesso);
        span?.setAttribute("prazos.data_publicacao", dataPublicacao);
        span?.setAttribute("prazos.prazo_dias", prazoEmDias);

        // Simular cálculo de prazo (incluindo dias úteis, feriados)
        await new Promise((resolve) => setTimeout(resolve, 30));

        const deadline = new Date(dataPublicacao);
        deadline.setDate(deadline.getDate() + prazoEmDias);

        // Verificar se é urgente (menos de 5 dias)
        const hoje = new Date();
        const diffDias = Math.ceil((deadline.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        const isUrgente = diffDias <= 5 && diffDias >= 0;

        span?.setAttribute("prazos.deadline", deadline.toISOString());
        span?.setAttribute("prazos.dias_restantes", diffDias);
        span?.setAttribute("prazos.urgente", isUrgente);

        current = updateState(current, {
          currentStep: "gestao-prazos:calculated",
          data: {
            ...current.data,
            deadline: deadline.toISOString(),
            diasRestantes: diffDias,
            urgente: isUrgente,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Gestão de prazos: prazo calculado - ${deadline.toLocaleDateString()} (${diffDias} dias restantes)${isUrgente ? " ⚠️ URGENTE" : ""}`
        );
      }
    );
  }
}

export async function runGestaoPrazos(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new GestaoPrazosAgent();
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
