import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan, createChatSpan } from "@/lib/sentry-gemini-integration-v2";

export class OrganizacaoArquivosAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    // ?? Instrumentar invocação do agente Organização de Arquivos
    return createInvokeAgentSpan(
      {
        agentName: "Organização de Arquivos",
        system: "gemini",
        model: "gemini-2.5-pro",
        temperature: 0.3,
      },
      {
        sessionId: state.data?.sessionId as string || `organizacao_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        let current = updateState(state, { currentStep: "organizacao-arquivos:start" });

        // Extrair dados dos arquivos
        const arquivos = (state.data?.arquivos as Array<{ nome: string; tipo: string }>) || [];
        const processoId = (state.data?.processoId as string) || "";

        span?.setAttribute("organizacao.arquivos_count", arquivos.length);
        span?.setAttribute("organizacao.processo_id", processoId);

        // Usar LLM para categorizar arquivos
        const categorizacao = await createChatSpan(
          {
            agentName: "Organização de Arquivos",
            system: "gemini",
            model: "gemini-2.5-pro",
            temperature: 0.3,
          },
          [
            {
              role: "system",
              content:
                "Você é um organizador de arquivos jurídicos. Categorize documentos por tipo, prioridade e processo.",
            },
            {
              role: "user",
              content: `Organize os seguintes arquivos do processo ${processoId}:

${arquivos.map((a) => `- ${a.nome} (${a.tipo})`).join("\n")}

Crie uma estrutura de pastas lógica:
1. Por tipo de documento (petições, contratos, decisões, etc.)
2. Por ordem cronológica
3. Sugestões de nomenclatura padronizada`,
            },
          ],
          async (chatSpan) => {
            // Simular categorização
            await new Promise((resolve) => setTimeout(resolve, 30));

            const estrutura = {
              pastas: [
                {
                  nome: "01_Peticoes",
                  arquivos: arquivos.filter((a) => a.tipo === "petição").length,
                },
                {
                  nome: "02_Contratos",
                  arquivos: arquivos.filter((a) => a.tipo === "contrato").length,
                },
                {
                  nome: "03_Decisoes",
                  arquivos: arquivos.filter((a) => a.tipo === "decisão").length,
                },
                {
                  nome: "04_Outros",
                  arquivos: arquivos.filter((a) => !["petição", "contrato", "decisão"].includes(a.tipo)).length,
                },
              ],
              nomenclatura: [
                "AAAAMMDD_TipoDocumento_NomeDescritivo.pdf",
                "Exemplo: 20241208_Peticao_Inicial.pdf",
              ],
              totalOrganizado: arquivos.length,
            };

            chatSpan?.setAttribute("gen_ai.response.text", JSON.stringify([estrutura]));
            chatSpan?.setAttribute("gen_ai.usage.total_tokens", 180);

            return estrutura;
          }
        );

        span?.setAttribute("organizacao.pastas_criadas", categorizacao.pastas.length);
        span?.setAttribute("organizacao.total_organizado", categorizacao.totalOrganizado);

        current = updateState(current, {
          currentStep: "organizacao-arquivos:done",
          data: {
            ...current.data,
            ...categorizacao,
            organized: true,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Organização concluída: ${categorizacao.totalOrganizado} arquivo(s) em ${categorizacao.pastas.length} pasta(s)`
        );
      }
    );
  }
}

export async function runOrganizacaoArquivos(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new OrganizacaoArquivosAgent();
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
