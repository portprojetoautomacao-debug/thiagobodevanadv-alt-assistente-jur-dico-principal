import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class TraducaoJuridicaAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "traducao-juridica:start" });

    await new Promise((resolve) => setTimeout(resolve, 25));

    current = updateState(current, {
      currentStep: "traducao-juridica:done",
      data: { ...current.data, translated: true },
      completed: true,
    });

    return this.addAgentMessage(current, "Tradução jurídica concluída");
  }
}

export async function runTraducaoJuridica(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new TraducaoJuridicaAgent();
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
