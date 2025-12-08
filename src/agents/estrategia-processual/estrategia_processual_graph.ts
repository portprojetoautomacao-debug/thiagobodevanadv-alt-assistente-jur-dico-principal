import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class EstrategiaProcessualAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "estrategia-processual:start" });

    await new Promise((resolve) => setTimeout(resolve, 70));

    current = updateState(current, {
      currentStep: "estrategia-processual:advice",
      data: { ...current.data, recommendation: "Ingresso de recurso X" },
      completed: true,
    });

    return this.addAgentMessage(current, "Estratégia processual recomendada");
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
