/**
 * DJEN Monitor LangGraph Agent
 *
 * This agent monitors the DJEN (Diário de Justiça Eletrônico Nacional)
 * for new publications using a LangGraph workflow.
 *
 * Security Notes:
 * - Uses safe HTTP requests with timeout
 * - No eval() or dynamic code execution
 * - Validates all external data before processing
 */

import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";
import { createInvokeAgentSpan } from "@/lib/sentry-gemini-integration-v2";

export interface DJENPublication {
  id: string;
  court: string;
  date: string;
  content: string;
  processNumber?: string;
}

export class DJENMonitorAgent extends LangGraphAgent {
  /**
   * Main workflow execution
   */
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    // 🔍 Instrumentar invocação do agente Monitor DJEN
    return createInvokeAgentSpan(
      {
        agentName: "Monitor DJEN",
        system: "custom-llm",
        model: "djen-api",
      },
      {
        sessionId:
          typeof state.data?.sessionId === "string"
            ? state.data.sessionId
            : `djen_session_${Date.now()}`,
        turn: state.retryCount + 1,
        messages: state.messages.map((m) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      },
      async (span) => {
        // Step 1: Fetch publications
        let currentState = updateState(state, { currentStep: "fetching_publications" });

        const startFetch = Date.now();
        const publications = await this.fetchPublications(signal);
        const fetchDuration = Date.now() - startFetch;

        // Adicionar métricas ao span
        span?.setAttribute("djen.publications_found", publications.length);
        span?.setAttribute("djen.fetch_duration_ms", fetchDuration);
        span?.setAttribute("djen.scan_timestamp", new Date().toISOString());

        // Analisar publicações críticas (com número de processo)
        const criticalPublications = publications.filter((p) => p.processNumber);
        const courtDistribution = publications.reduce(
          (acc, p) => {
            acc[p.court] = (acc[p.court] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        span?.setAttribute("djen.critical_count", criticalPublications.length);
        span?.setAttribute("djen.courts_found", Object.keys(courtDistribution).join(", "));
        span?.setAttribute("djen.court_distribution", JSON.stringify(courtDistribution));

        // Step 2: Process publications
        currentState = updateState(currentState, {
          currentStep: "processing_publications",
          data: {
            ...currentState.data,
            publications,
            criticalPublications,
            courtDistribution,
            fetchedAt: Date.now(),
            fetchDuration,
          },
        });

        // Step 3: Determinar ação baseada em publicações críticas
        if (criticalPublications.length > 0) {
          span?.setAttribute("djen.action", "escalate_to_justine");
          currentState = updateState(currentState, {
            currentStep: "escalate",
            data: {
              ...currentState.data,
              action: "escalate",
              targetAgent: "justine",
            },
          });
        } else {
          span?.setAttribute("djen.action", "no_action_needed");
        }

        // Step 4: Complete
        currentState = updateState(currentState, {
          currentStep: "completed",
          completed: true,
        });

        span?.setStatus({ code: 1, message: "ok" });

        return this.addAgentMessage(
          currentState,
          `Monitor DJEN concluído: ${publications.length} publicações (${criticalPublications.length} críticas) em ${fetchDuration}ms`
        );
      }
    );
  }

  /**
   * Fetch publications from DJEN API
   *
   * Security: Uses AbortSignal for timeout protection
   * Integration: Real DJEN API via existing djen-api.ts service
   */
  private async fetchPublications(signal: AbortSignal): Promise<DJENPublication[]> {
    // Import DJEN API service
    const { consultarDJEN } = await import("@/lib/djen-api");

    // Get date range (last 7 days)
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);

    const dataFim = today.toISOString().split("T")[0];
    const dataInicio = lastWeek.toISOString().split("T")[0];

    // Fetch from DJEN API with timeout
    const results = await consultarDJEN({
      tribunais: ["TST", "TRT3", "TJMG"],
      searchTerms: {},
      dataInicio,
      dataFim,
      timeout: 30000, // 30s timeout
    });

    // Check if aborted
    if (signal.aborted) {
      throw new Error("Operation aborted");
    }

    // Transform DJEN results to our format and filter invalid ones
    const publications: DJENPublication[] = (results.resultados || [])
      .map((result: any, index: number) => ({
        id: `${result.tribunal}-${result.data}-${index}`,
        court: result.tribunal,
        date: result.data,
        content: result.teor || "",
        processNumber: result.numeroProcesso,
      }))
      .filter((p) => this.validatePublication(p));

    return publications;
  }

  /**
   * Validate publication data
   *
   * Security: Ensures data conforms to expected schema
   */
  private validatePublication(data: unknown): data is DJENPublication {
    if (typeof data !== "object" || data === null) return false;

    const pub = data as Record<string, unknown>;
    return (
      typeof pub.id === "string" &&
      typeof pub.court === "string" &&
      typeof pub.date === "string" &&
      typeof pub.content === "string"
    );
  }
}

/**
 * Factory function to create and execute the DJEN monitor agent
 */
export async function monitorDJEN(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new DJENMonitorAgent({
    timeoutMs: 60000, // 1 minute for DJEN API
    maxRetries: 3,
  });

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
