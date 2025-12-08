import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class AnaliseRiscoAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "analise-risco:start" });

    await new Promise((resolve) => setTimeout(resolve, 40));

    current = updateState(current, {
      currentStep: "analise-risco:done",
      data: { ...current.data, riskScore: 0.32 },
      completed: true,
    });

    return this.addAgentMessage(current, "Análise de risco concluída");
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
