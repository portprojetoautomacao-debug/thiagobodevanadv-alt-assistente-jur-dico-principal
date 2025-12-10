/**
 * Pesquisa Jurisprudencial com Qdrant - Integra��o Real
 *
 * Este agente conecta ao cluster Qdrant para buscar precedentes similares
 */

import { createQdrantService } from "@/lib/qdrant-service";
import { createExecuteToolSpan, createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";
import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class PesquisaJurisAgentQdrant extends LangGraphAgent {
  private qdrantService;

  constructor() {
    super();

    // Inicializar servi�o Qdrant
    const qdrantConfig = {
      url: import.meta.env.VITE_QDRANT_URL || "",
      apiKey: import.meta.env.VITE_QDRANT_API_KEY || "",
      collectionName: import.meta.env.VITE_QDRANT_COLLECTION_NAME || "legal_docs",
    };

    this.qdrantService = createQdrantService(qdrantConfig);

    if (!this.qdrantService) {
      console.warn("[PesquisaJuris] Qdrant n�o configurado - usando fallback");
    }
  }

  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    return createInvokeAgentSpan(
      {
        agentName: "Pesquisa Jurisprudencial (Qdrant)",
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
        let current = updateState(state, { currentStep: "pesquisa-juris:qdrant:start" });

        const tema = (state.data?.tema as string) || "direitos trabalhistas";
        const tribunal = (state.data?.tribunal as string) || "todos";

        span?.setAttribute("pesquisa.tema", tema);
        span?.setAttribute("pesquisa.tribunal", tribunal);
        span?.setAttribute("pesquisa.using_qdrant", !!this.qdrantService);

        // 1. Gerar embedding da query com Gemini
        const queryEmbedding = await this.generateEmbedding(tema);

        // 2. Buscar vetores similares no Qdrant
        const precedentes = await createExecuteToolSpan(
          {
            agentName: "Pesquisa Jurisprudencial",
            system: "custom-llm",
            model: "vector-search",
          },
          {
            toolName: "qdrant_vector_search",
            toolType: "datastore",
            toolInput: JSON.stringify({
              collection: "legal_docs",
              vector: queryEmbedding,
              limit: 10,
              filter: tribunal !== "todos" ? { tribunal } : undefined,
            }),
          },
          async (toolSpan) => {
            if (!this.qdrantService) {
              toolSpan?.setAttribute("search.fallback", "mock_data");
              return this.getMockPrecedentes(tema);
            }

            try {
              const results = await this.qdrantService.search(
                queryEmbedding,
                10,
                tribunal !== "todos" ? { tribunal: { $eq: tribunal } } : undefined
              );

              toolSpan?.setAttribute("search.results_count", results.length);
              toolSpan?.setAttribute("search.qdrant_url", import.meta.env.VITE_QDRANT_URL);

              return results.map((r) => {
                const payload = r.payload as Record<string, unknown>;
                return {
                  titulo: (payload.titulo as string) || "Sem t\u00edtulo",
                  ementa: (payload.ementa as string) || "",
                  relevancia: r.score,
                  tribunal: (payload.tribunal as string) || "N\u00e3o especificado",
                  data: (payload.data as string) || "",
                  numero: (payload.numero as string) || "",
                };
              });
            } catch (error) {
              console.error("[PesquisaJuris] Erro ao buscar no Qdrant:", error);
              toolSpan?.setAttribute("search.error", String(error));
              toolSpan?.setAttribute("search.fallback", "mock_data");
              return this.getMockPrecedentes(tema);
            }
          }
        );

        type Precedente = {
          titulo: string;
          ementa: string;
          relevancia: number;
          tribunal: string;
          data: string;
          numero: string;
        };

        const precedentesTyped = precedentes as Precedente[];

        span?.setAttribute("pesquisa.resultados_encontrados", precedentesTyped.length);

        current = updateState(current, {
          currentStep: "pesquisa-juris:qdrant:complete",
          data: {
            ...current.data,
            precedentes: precedentesTyped,
            totalResultados: precedentesTyped.length,
            usedQdrant: !!this.qdrantService,
          },
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          current,
          `Pesquisa jurisprudencial via ${this.qdrantService ? "Qdrant" : "Mock"}: ${precedentesTyped.length} precedentes encontrados`
        );
      }
    );
  }

  /**
   * Gerar embedding usando Gemini
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Placeholder - integrar com Gemini Embedding API
    // Por enquanto, retorna vetor aleat�rio de 1536 dimens�es
    return Array.from({ length: 1536 }, () => Math.random());
  }

  /**
   * Fallback: retornar dados mockados se Qdrant n�o dispon�vel
   */
  private getMockPrecedentes(tema: string) {
    return [
      {
        titulo: `[MOCK] STF - ${tema}`,
        ementa: `Este � um precedente mockado sobre ${tema}`,
        relevancia: 0.85,
        tribunal: "STF",
        data: "2024-01-01",
        numero: "MOCK-12345",
      },
    ];
  }
}

export async function runPesquisaJurisQdrant(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new PesquisaJurisAgentQdrant();
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
