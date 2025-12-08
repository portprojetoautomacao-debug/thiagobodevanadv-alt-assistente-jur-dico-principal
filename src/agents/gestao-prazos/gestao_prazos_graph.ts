import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class GestaoPrazosAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "gestao-prazos:start" });

    await new Promise((resolve) => setTimeout(resolve, 30));

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 10);

    current = updateState(current, {
      currentStep: "gestao-prazos:calculated",
      data: { ...current.data, deadline: deadline.toISOString() },
      completed: true,
    });

    return this.addAgentMessage(current, "Gestão de prazos: prazo calculado");
  }
}

export async function runGestaoPrazos(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new GestaoPrazosAgent();
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
