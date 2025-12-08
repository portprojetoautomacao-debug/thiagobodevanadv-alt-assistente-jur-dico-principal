import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class AnaliseDocumentalAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "analise-documental:start" });

    // Simulate document analysis
    await new Promise((resolve) => setTimeout(resolve, 40));

    current = updateState(current, {
      currentStep: "analise-documental:extracted",
      data: { ...current.data, entities: ["partes", "datas", "valores"] },
      completed: true,
    });

    return this.addAgentMessage(current, "Análise documental concluída");
  }
}

export async function runAnaliseDocumental(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new AnaliseDocumentalAgent();
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
