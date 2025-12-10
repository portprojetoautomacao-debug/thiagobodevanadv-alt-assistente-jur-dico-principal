import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class FinanceiroAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Análise Financeira
    return createInvokeAgentSpan(
      {
        agentName: "Análise Financeira",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.2,
      },
      {
        sessionId: (state.data?.sessionId as string) || `financeiro_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "financeiro:start" });

        // Extrair dados financeiros
        const periodo = (state.data?.periodo as string) || "mes-atual";
        const honorariosRecebidos = (state.data?.honorariosRecebidos as number[]) || [];
        const despesas = (state.data?.despesas as number[]) || [];
        const inadimplentes = (state.data?.inadimplentes as number) || 0;

        span?.setAttribute("financeiro.periodo", periodo);
        span?.setAttribute("financeiro.honorarios_count", honorariosRecebidos.length);
        span?.setAttribute("financeiro.despesas_count", despesas.length);
        span?.setAttribute("financeiro.inadimplentes", inadimplentes);

        // Calcular KPIs
        const totalReceitas = honorariosRecebidos.reduce((acc, val) => acc + val, 0);
        const totalDespesas = despesas.reduce((acc, val) => acc + val, 0);
        const lucroLiquido = totalReceitas - totalDespesas;
        const margemLucro = totalReceitas > 0 ? (lucroLiquido / totalReceitas) * 100 : 0;
        const ticketMedio =
          honorariosRecebidos.length > 0 ? totalReceitas / honorariosRecebidos.length : 0;

        // Usar LLM para análise financeira e recomendações
        const analiseFinanceira = await createChatSpan(
          {
            agentName: "Análise Financeira",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.2,
          },
          [
            {
              role: "system",
              content:
                "Você é um analista financeiro especializado em escritórios jurídicos. Forneça análises objetivas e recomendações práticas.",
            },
            {
              role: "user",
              content: `Analise a situação financeira do escritório (${periodo}):

Receitas:
- Total de honorários: R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Número de recebimentos: ${honorariosRecebidos.length}
- Ticket médio: R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

Despesas:
- Total: R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Número de lançamentos: ${despesas.length}

Resultado:
- Lucro líquido: R$ ${lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
- Margem de lucro: ${margemLucro.toFixed(1)}%

Inadimplência:
- Clientes inadimplentes: ${inadimplentes}

Forneça:
1. Análise da saúde financeira (excelente/boa/média/ruim)
2. Principais indicadores de alerta
3. Recomendações prioritárias
4. Metas financeiras sugeridas`,
            },
          ],
          async (chatSpan) => {
            // Simular análise financeira
            await new Promise((resolve) => setTimeout(resolve, 40));

            let saudeFinanceira = "boa";
            const indicadoresAlerta: string[] = [];
            const recomendacoes: string[] = [];

            // Análise de margem de lucro
            if (margemLucro < 20) {
              saudeFinanceira = "ruim";
              indicadoresAlerta.push("Margem de lucro abaixo de 20%");
              recomendacoes.push("Revisar estrutura de custos e honorários praticados");
            } else if (margemLucro < 30) {
              saudeFinanceira = "média";
              indicadoresAlerta.push("Margem de lucro entre 20-30% (melhorável)");
            } else if (margemLucro >= 40) {
              saudeFinanceira = "excelente";
            }

            // Análise de inadimplência
            const taxaInadimplencia =
              honorariosRecebidos.length > 0
                ? (inadimplentes / honorariosRecebidos.length) * 100
                : 0;

            if (taxaInadimplencia > 10) {
              if (saudeFinanceira === "excelente") saudeFinanceira = "boa";
              indicadoresAlerta.push(`Taxa de inadimplência de ${taxaInadimplencia.toFixed(1)}%`);
              recomendacoes.push("Implementar política de cobrança preventiva");
            }

            // Análise de fluxo de caixa
            if (totalReceitas < totalDespesas) {
              saudeFinanceira = "ruim";
              indicadoresAlerta.push("Fluxo de caixa negativo");
              recomendacoes.push("URGENTE: Revisar despesas e buscar novas fontes de receita");
            }

            // Ticket médio
            if (ticketMedio < 5000 && honorariosRecebidos.length > 5) {
              indicadoresAlerta.push("Ticket médio abaixo de R$ 5.000");
              recomendacoes.push("Avaliar reajuste de tabela de honorários");
            }

            // Metas financeiras
            const metaMargemLucro = Math.max(35, margemLucro + 5);
            const metaFaturamento = totalReceitas * 1.15;

            const resultado = {
              saudeFinanceira,
              indicadoresAlerta,
              recomendacoes:
                recomendacoes.length > 0
                  ? recomendacoes
                  : [
                      "Manter controle rigoroso do fluxo de caixa",
                      "Revisar tabela de honorários semestralmente",
                    ],
              metas: [
                `Atingir margem de lucro de ${metaMargemLucro.toFixed(0)}%`,
                `Faturamento mensal de R$ ${metaFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                `Reduzir inadimplência para menos de 5%`,
              ],
              kpis: {
                totalReceitas,
                totalDespesas,
                lucroLiquido,
                margemLucro,
                ticketMedio,
                taxaInadimplencia,
              },
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([resultado]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 280);

            return resultado;
          }
        );

        span?.setAttribute("financeiro.saude_financeira", analiseFinanceira.saudeFinanceira);
        span?.setAttribute("financeiro.margem_lucro", margemLucro);
        span?.setAttribute("financeiro.lucro_liquido", lucroLiquido);
        span?.setAttribute(
          "financeiro.indicadores_alerta_count",
          analiseFinanceira.indicadoresAlerta.length
        );
        span?.setAttribute(
          "financeiro.recomendacoes_count",
          analiseFinanceira.recomendacoes.length
        );

        current = updateState(current, {
          currentStep: "financeiro:analysis",
          data: {
            ...current.data,
            ...analiseFinanceira,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Análise financeira: ${analiseFinanceira.saudeFinanceira.toUpperCase()} (margem: ${margemLucro.toFixed(1)}%, ${analiseFinanceira.indicadoresAlerta.length} alerta(s))`
        );
      }
    );
  }
}

export async function runFinanceiro(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new FinanceiroAgent();
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
