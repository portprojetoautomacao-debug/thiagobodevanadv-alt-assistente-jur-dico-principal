import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import {
  createInvokeAgentSpan,
  createExecuteToolSpan,
  createChatSpan,
} from "@/lib/sentry-gemini-integration-v2";

export class PesquisaJurisAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Pesquisa Jurisprudencial
    return createInvokeAgentSpan(
      {
        agentName: "Pesquisa Jurisprudencial",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.4,
      },
      {
        sessionId: (state.data?.sessionId as string) || `pesquisa_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "pesquisa-juris:start" });

        // Extrair parâmetros de pesquisa
        const tema = (state.data?.tema as string) || "direitos trabalhistas";
        const tribunal = (state.data?.tribunal as string) || "todos";
        const dataInicio = (state.data?.dataInicio as string) || "2020-01-01";

        span?.setAttribute("pesquisa.tema", tema);
        span?.setAttribute("pesquisa.tribunal", tribunal);
        span?.setAttribute("pesquisa.data_inicio", dataInicio);

        // 1. Usar LLM para gerar query de busca otimizada
        const queryGerada = await createChatSpan(
          {
            agentName: "Pesquisa Jurisprudencial",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.4,
          },
          [
            {
              role: "system",
              content:
                "Você é um especialista em pesquisa jurisprudencial. Gere queries de busca otimizadas.",
            },
            {
              role: "user",
              content: `Gere uma query de busca para: ${tema} (tribunal: ${tribunal})`,
            },
          ],
          async (chatSpan) => {
            // Simular geração de query
            await new Promise((resolve) => setTimeout(resolve, 25));

            const query = `"${tema}" AND tribunal:${tribunal} AND data:>${dataInicio}`;

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([query]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 150);

            return query;
          }
        );

        span?.setAttribute("pesquisa.query_gerada", queryGerada);

        // 2. Executar busca em base de jurisprudência (tool calling)
        const resultados = await createExecuteToolSpan(
          {
            agentName: "Pesquisa Jurisprudencial",
            system: "gemini",
            model: "gemini-2.5-pro",
          },
          {
            toolName: "search_jurisprudence_database",
            toolType: "datastore",
            toolInput: JSON.stringify({
              query: queryGerada,
              limit: 10,
              relevance_threshold: 0.7,
            }),
          },
          async (toolSpan) => {
            // Simular busca em base vetorial/Qdrant
            await new Promise((resolve) => setTimeout(resolve, 50));

            const precedentes = [
              {
                titulo: "STF - Tema 1234 - Direito à greve",
                ementa: "É constitucional o exercício do direito de greve...",
                relevancia: 0.92,
                tribunal: "STF",
                data: "2023-05-15",
              },
              {
                titulo: "STJ - REsp 987654 - Adicional de insalubridade",
                ementa: "O adicional de insalubridade deve ser calculado...",
                relevancia: 0.85,
                tribunal: "STJ",
                data: "2023-08-22",
              },
              {
                titulo: "TST - RR 555666 - Horas extras",
                ementa: "Configurada a prestação de horas extras...",
                relevancia: 0.78,
                tribunal: "TST",
                data: "2024-02-10",
              },
            ];

            toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(precedentes));
            toolSpan?.setAttribute("search.results_count", precedentes.length);
            toolSpan?.setAttribute(
              "search.avg_relevance",
              precedentes.reduce((acc, p) => acc + p.relevancia, 0) / precedentes.length
            );

            return precedentes;
          }
        );

        span?.setAttribute("pesquisa.resultados_encontrados", resultados.length);
        span?.setAttribute(
          "pesquisa.tribunais_encontrados",
          [...new Set(resultados.map((r) => r.tribunal))].join(", ")
        );

        current = updateState(current, {
          currentStep: "pesquisa-juris:results",
          data: {
            ...current.data,
            query: queryGerada,
            precedentes: resultados,
            totalResultados: resultados.length,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Pesquisa jurisprudencial concluída: ${resultados.length} precedentes encontrados (STF, STJ, TST)`
        );
      }
    );
  }
}

export async function runPesquisaJuris(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new PesquisaJurisAgent();
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
