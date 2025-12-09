import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class AnaliseRiscoAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Análise de Risco
    return createInvokeAgentSpan(
      {
        agentName: "Análise de Risco",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      {
        sessionId: state.data?.sessionId || `risco_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "analise-risco:start" });

        // Extrair dados do caso
        const tipoCaso = (state.data?.tipoCaso as string) || "trabalhista";
        const valorCausa = (state.data?.valorCausa as number) || 0;
        const complexidade = (state.data?.complexidade as string) || "média";
        const precedentes = (state.data?.precedentes as string[]) || [];

        span?.setAttribute("risco.tipo_caso", tipoCaso);
        span?.setAttribute("risco.valor_causa", valorCausa);
        span?.setAttribute("risco.complexidade", complexidade);
        span?.setAttribute("risco.precedentes_count", precedentes.length);

        // Usar LLM para análise de risco
        const analiseRisco = await createChatSpan(
          {
            agentName: "Análise de Risco",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.3,
          },
          [
            {
              role: "system",
              content:
                "Você é um analista jurídico especializado em avaliação de riscos processuais.",
            },
            {
              role: "user",
              content: `Analise o risco processual:
Tipo: ${tipoCaso}
Valor: R$ ${valorCausa.toLocaleString("pt-BR")}
Complexidade: ${complexidade}
Precedentes favoráveis: ${precedentes.length}

Forneça:
1. Score de risco (0-1, onde 0=baixo, 1=alto)
2. Principais fatores de risco
3. Probabilidade de sucesso
4. Recomendações`,
            },
          ],
          async (chatSpan) => {
            // Simular análise com LLM
            await new Promise((resolve) => setTimeout(resolve, 40));

            // Calcular score baseado em heurísticas
            let riskScore = 0.5; // Baseline

            // Ajustar por complexidade
            if (complexidade === "baixa") riskScore -= 0.15;
            else if (complexidade === "alta") riskScore += 0.2;

            // Ajustar por precedentes
            if (precedentes.length > 3) riskScore -= 0.1;
            else if (precedentes.length === 0) riskScore += 0.15;

            // Ajustar por valor da causa
            if (valorCausa > 100000) riskScore += 0.1;

            // Limitar entre 0 e 1
            riskScore = Math.max(0, Math.min(1, riskScore));

            const probabilidadeSucesso = (1 - riskScore) * 100;

            const analise = {
              riskScore,
              probabilidadeSucesso,
              classificacao: riskScore < 0.3 ? "baixo" : riskScore < 0.6 ? "médio" : "alto",
              fatoresRisco: [
                complexidade === "alta" && "Complexidade elevada do caso",
                precedentes.length === 0 && "Falta de precedentes favoráveis",
                valorCausa > 100000 && "Alto valor da causa",
              ].filter(Boolean),
              recomendacoes: [
                riskScore > 0.7 && "Considerar acordo extrajudicial",
                precedentes.length < 2 && "Buscar mais precedentes",
                complexidade === "alta" && "Consultar especialista",
              ].filter(Boolean),
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([analise]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 250);

            return analise;
          }
        );

        span?.setAttribute("risco.score", analiseRisco.riskScore);
        span?.setAttribute("risco.classificacao", analiseRisco.classificacao);
        span?.setAttribute("risco.probabilidade_sucesso", analiseRisco.probabilidadeSucesso);
        span?.setAttribute("risco.fatores_count", analiseRisco.fatoresRisco.length);
        span?.setAttribute("risco.recomendacoes_count", analiseRisco.recomendacoes.length);

        current = updateState(current, {
          currentStep: "analise-risco:done",
          data: {
            ...current.data,
            ...analiseRisco,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Análise de risco concluída: ${analiseRisco.classificacao.toUpperCase()} (score: ${analiseRisco.riskScore.toFixed(2)}, ${analiseRisco.probabilidadeSucesso.toFixed(1)}% de sucesso)`
        );
      }
    );
  }
}

export async function runAnaliseRisco(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new AnaliseRiscoAgent();
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
