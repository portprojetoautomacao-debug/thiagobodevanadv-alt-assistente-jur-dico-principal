import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class PesquisaJurisAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "pesquisa-juris:start" });

    await new Promise((resolve) => setTimeout(resolve, 50));

    current = updateState(current, {
      currentStep: "pesquisa-juris:results",
      data: { ...current.data, precedents: ["STF - Tema X", "STJ - Recurso Y"] },
      completed: true,
    });

    return this.addAgentMessage(current, "Resultados de jurisprudência gerados");
  }
}

export async function runPesquisaJuris(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new PesquisaJurisAgent();
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
