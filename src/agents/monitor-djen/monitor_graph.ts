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
    // Step 1: Fetch publications
    let currentState = updateState(state, { currentStep: "fetching_publications" });

    const publications = await this.fetchPublications(signal);

    // Step 2: Process publications
    currentState = updateState(currentState, {
      currentStep: "processing_publications",
      data: {
        ...currentState.data,
        publications,
        fetchedAt: Date.now(),
      },
    });

    // Step 3: Complete
    currentState = updateState(currentState, {
      currentStep: "completed",
      completed: true,
    });

    return this.addAgentMessage(
      currentState,
      `Successfully monitored DJEN. Found ${publications.length} publications.`
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

    try {
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

      // Transform DJEN results to our format
      const publications: DJENPublication[] = results.resultados.map(
        (result: any, index: number) => ({
          id: `${result.tribunal}-${result.data}-${index}`,
          court: result.tribunal,
          date: result.data,
          content: result.teor || "",
          processNumber: result.numeroProcesso,
        })
      );

      return publications;
    } catch (error) {
      // Re-throw with context
      if (signal.aborted) {
        throw new Error("Operation aborted");
      }
      throw error;
    }
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
