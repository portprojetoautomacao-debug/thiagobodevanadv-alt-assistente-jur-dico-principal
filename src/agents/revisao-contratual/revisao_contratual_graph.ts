import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class RevisaoContratualAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "revisao-contratual:start" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    current = updateState(current, {
      currentStep: "revisao-contratual:issues_found",
      data: { ...current.data, problems: ["clausula_5 - ambigua"] },
      completed: true,
    });

    return this.addAgentMessage(current, "Revisão contratual concluída - problemas identificados");
  }
}

export async function runRevisaoContratual(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new RevisaoContratualAgent();
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
