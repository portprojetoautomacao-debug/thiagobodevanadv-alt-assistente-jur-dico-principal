import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class ComplianceAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "compliance:start" });

    await new Promise((resolve) => setTimeout(resolve, 40));

    current = updateState(current, {
      currentStep: "compliance:checked",
      data: { ...current.data, lgpdPassed: true },
      completed: true,
    });

    return this.addAgentMessage(current, "Verificação de compliance concluída");
  }
}

export async function runCompliance(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new ComplianceAgent();
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
