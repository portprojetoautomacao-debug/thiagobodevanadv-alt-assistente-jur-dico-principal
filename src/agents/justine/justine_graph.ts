import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class JustineAgent extends LangGraphAgent {
  protected async run(state: AgentState, _signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "justine:start" });

    // For the stub: simulate quick analysis and extraction
    await new Promise((resolve) => setTimeout(resolve, 50));

    current = updateState(current, {
      currentStep: "justine:intimations_extracted",
      data: { ...current.data, found: 1 },
      completed: true,
    });

    return this.addAgentMessage(current, "Mrs. Justin-e: Intimação identificada e classificada.");
  }
}

export async function runJustine(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new JustineAgent();
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
