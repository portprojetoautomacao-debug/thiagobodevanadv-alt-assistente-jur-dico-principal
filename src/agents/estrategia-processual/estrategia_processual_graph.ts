import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import {
  createInvokeAgentSpan,
  createChatSpan,
  createHandoffSpan,
} from "@/lib/sentry-gemini-integration-v2";

export class EstrategiaProcessualAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Estratégia Processual
    return createInvokeAgentSpan(
      {
        agentName: "Estratégia Processual",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.6,
      },
      {
        sessionId: state.data?.sessionId || `estrategia_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "estrategia-processual:start" });

        // Extrair dados do caso
        const tipoCaso = (state.data?.tipoCaso as string) || "trabalhista";
        const fasseProcessual = (state.data?.faseProcessual as string) || "inicial";
        const resultadoAnterior = (state.data?.resultadoAnterior as string) || "";
        const objetivoCliente = (state.data?.objetivoCliente as string) || "vitória total";
        const riskScore = (state.data?.riskScore as number) || 0.5;

        span?.setAttribute("estrategia.tipo_caso", tipoCaso);
        span?.setAttribute("estrategia.fase_processual", fasseProcessual);
        span?.setAttribute("estrategia.objetivo", objetivoCliente);
        span?.setAttribute("estrategia.risk_score_input", riskScore);

        // Verificar se precisa de handoff para Análise de Risco
        if (riskScore === undefined || riskScore === 0.5) {
          await createHandoffSpan("Estratégia Processual", "Análise de Risco");
          span?.setAttribute("estrategia.handoff_triggered", true);
          span?.setAttribute("estrategia.handoff_reason", "Necessário análise de risco primeiro");

          // Simular que análise de risco foi solicitada
          current = updateState(current, {
            currentStep: "estrategia-processual:waiting_risk_analysis",
            data: {
              ...current.data,
              handoffTo: "analise-risco",
              waitingFor: "risk_analysis",
            },
          });
        }

        // Usar LLM para gerar estratégia processual
        const estrategia = await createChatSpan(
          {
            agentName: "Estratégia Processual",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.6,
          },
          [
            {
              role: "system",
              content:
                "Você é um estrategista jurídico experiente. Forneça estratégias processuais práticas e fundamentadas.",
            },
            {
              role: "user",
              content: `Recomende estratégia processual:

Tipo: ${tipoCaso}
Fase: ${fasseProcessual}
Resultado anterior: ${resultadoAnterior || "N/A"}
Objetivo: ${objetivoCliente}
Risco: ${riskScore < 0.3 ? "baixo" : riskScore < 0.6 ? "médio" : "alto"}

Forneça:
1. Estratégia principal recomendada
2. Estratégias alternativas
3. Ações imediatas
4. Riscos da estratégia
5. Previsão de tempo/custo`,
            },
          ],
          async (chatSpan) => {
            // Simular geração de estratégia
            await new Promise((resolve) => setTimeout(resolve, 70));

            // Determinar estratégia baseada em fase e risco
            let estrategiaPrincipal = "";
            let acoesImediatas: string[] = [];
            let estrategiasAlternativas: string[] = [];

            if (fasseProcessual === "inicial") {
              estrategiaPrincipal = "Contestação completa com preliminares e mérito";
              acoesImediatas = [
                "Juntar documentos comprobatórios",
                "Arrolar testemunhas",
                "Protocolar resposta no prazo",
              ];
              estrategiasAlternativas = ["Propor acordo", "Apresentar reconvenção"];
            } else if (fasseProcessual === "recursal") {
              if (riskScore > 0.6) {
                estrategiaPrincipal = "Avaliar acordo antes de recorrer";
                acoesImediatas = [
                  "Negociar acordo com parte contrária",
                  "Avaliar custo x benefício do recurso",
                ];
              } else {
                estrategiaPrincipal = "Recurso de Apelação com ênfase em precedentes";
                acoesImediatas = [
                  "Pesquisar jurisprudência favorável",
                  "Elaborar razões recursais",
                  "Protocolar recurso no prazo",
                ];
              }
              estrategiasAlternativas = ["Embargos de Declaração", "Acordo em segunda instância"];
            } else if (fasseProcessual === "execucao") {
              estrategiaPrincipal = "Execução forçada com penhora de bens";
              acoesImediatas = [
                "Localizar bens do devedor",
                "Requerer penhora",
                "Acompanhar leilão",
              ];
              estrategiasAlternativas = [
                "Acordo de parcelamento",
                "Penhora de percentual de salário",
              ];
            } else {
              estrategiaPrincipal = "Aguardar decisão judicial";
              acoesImediatas = ["Acompanhar movimentação do processo"];
              estrategiasAlternativas = ["Petição intermediária", "Diligências probatórias"];
            }

            const previsaoTempo = fasseProcessual === "inicial" ? "6-12 meses" : "12-24 meses";
            const previsaoCusto = riskScore < 0.4 ? "moderado" : "elevado";

            const resultado = {
              estrategiaPrincipal,
              estrategiasAlternativas,
              acoesImediatas,
              riscos: [
                riskScore > 0.6 ? "Risco elevado de sucumbência" : "Risco moderado",
                "Possível extensão do prazo processual",
              ],
              previsaoTempo,
              previsaoCusto,
              confianca: riskScore < 0.4 ? 0.8 : 0.6,
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 350);

            return resultado;
          }
        );

        span?.setAttribute("estrategia.principal", estrategia.estrategiaPrincipal);
        span?.setAttribute(
          "estrategia.alternativas_count",
          estrategia.estrategiasAlternativas.length
        );
        span?.setAttribute("estrategia.acoes_count", estrategia.acoesImediatas.length);
        span?.setAttribute("estrategia.confianca", estrategia.confianca);
        span?.setAttribute("estrategia.previsao_tempo", estrategia.previsaoTempo);

        current = updateState(current, {
          currentStep: "estrategia-processual:complete",
          data: {
            ...current.data,
            ...estrategia,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Estratégia recomendada: ${estrategia.estrategiaPrincipal} (confiança: ${(estrategia.confianca * 100).toFixed(0)}%)`
        );
      }
    );
  }
}

export async function runEstrategiaProcessual(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new EstrategiaProcessualAgent();
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
