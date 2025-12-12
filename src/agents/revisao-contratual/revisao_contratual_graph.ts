import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import {
  createInvokeAgentSpan,
  createChatSpan,
  createExecuteToolSpan,
} from "@/lib/sentry-gemini-integration-v2";

export class RevisaoContratualAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Revisão Contratual
    return createInvokeAgentSpan(
      {
        agentName: "Revisão Contratual",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.2,
      },
      {
        sessionId: (state.data?.sessionId as string) || `revisao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "revisao-contratual:start" });

        // Extrair dados do contrato
        const contratoTexto = (state.data?.contratoTexto as string) || "";
        const tipoContrato = (state.data?.tipoContrato as string) || "prestação de serviços";
        const partes = (state.data?.partes as string[]) || [];

        span?.setAttribute("revisao.tipo_contrato", tipoContrato);
        span?.setAttribute("revisao.texto_length", contratoTexto.length);
        span?.setAttribute("revisao.partes_count", partes.length);

        // 1. Usar tool para extrair cláusulas do contrato
        const clausulas = await createExecuteToolSpan(
          {
            agentName: "Revisão Contratual",
            system: "gemini",
            model: "gemini-2.5-pro",
          },
          {
            toolName: "extract_contract_clauses",
            toolType: "function",
            toolInput: JSON.stringify({
              texto: contratoTexto.substring(0, 500),
              tipo: tipoContrato,
            }),
          },
          async (toolSpan) => {
            // Simular extração de cláusulas
            await new Promise((resolve) => setTimeout(resolve, 25));

            const clausulasExtraidas = [
              {
                numero: "5.1",
                titulo: "Prazo de vigência",
                texto: "O presente contrato terá vigência de 12 meses...",
                tipo: "prazo",
              },
              {
                numero: "7.3",
                titulo: "Rescisão",
                texto: "Qualquer das partes poderá rescindir...",
                tipo: "rescisao",
              },
              {
                numero: "10.2",
                titulo: "Multa contratual",
                texto: "Em caso de descumprimento, multa de 20%...",
                tipo: "penalidade",
              },
            ];

            toolSpan?.setAttribute("gen_ai.tool.output", JSON.stringify(clausulasExtraidas));
            toolSpan?.setAttribute("contract.clauses_extracted", clausulasExtraidas.length);

            return clausulasExtraidas;
          }
        );

        span?.setAttribute("revisao.clausulas_count", clausulas.length);

        // 2. Usar LLM para analisar problemas nas cláusulas
        const analise = await createChatSpan(
          {
            agentName: "Revisão Contratual",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.2,
          },
          [
            {
              role: "system",
              content:
                "Você é um revisor contratual especializado. Identifique cláusulas abusivas, ambíguas ou que possam prejudicar o cliente.",
            },
            {
              role: "user",
              content: `Analise as seguintes cláusulas de contrato de ${tipoContrato}:

${clausulas.map((c) => `Cláusula ${c.numero} (${c.titulo}): ${c.texto}`).join("\n\n")}

Identifique:
1. Cláusulas abusivas (segundo CDC)
2. Termos ambíguos ou vagos
3. Riscos potenciais para o cliente
4. Sugestões de alteração`,
            },
          ],
          async (chatSpan) => {
            // Simular análise
            await new Promise((resolve) => setTimeout(resolve, 50));

            const problemas = [
              {
                clausula: "7.3",
                tipo: "ambiguidade",
                severidade: "média",
                descricao: 'Termo "qualquer das partes" sem especificar condições',
                sugestao: "Especificar motivos e prazos para rescisão",
              },
              {
                clausula: "10.2",
                tipo: "abusiva",
                severidade: "alta",
                descricao: "Multa de 20% pode ser considerada excessiva (CDC Art. 51)",
                sugestao: "Reduzir para 10% ou valor razoável",
              },
            ];

            const resultado = {
              problemas,
              totalProblemas: problemas.length,
              problemasAlta: problemas.filter((p) => p.severidade === "alta").length,
              recomendacao:
                problemas.length > 2 ? "Renegociar contrato" : "Ajustes pontuais suficientes",
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 300);

            return resultado;
          }
        );

        span?.setAttribute("revisao.problemas_count", analise.totalProblemas);
        span?.setAttribute("revisao.problemas_alta_severidade", analise.problemasAlta);
        span?.setAttribute("revisao.recomendacao", analise.recomendacao);

        current = updateState(current, {
          currentStep: "revisao-contratual:issues_found",
          data: {
            ...current.data,
            clausulas,
            ...analise,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Revisão concluída: ${analise.totalProblemas} problema(s) identificado(s) (${analise.problemasAlta} alta severidade) - ${analise.recomendacao}`
        );
      }
    );
  }
}

export async function runRevisaoContratual(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new RevisaoContratualAgent();
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
