import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class RedacaoPeticoesAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "redacao:start" });

    await new Promise((resolve) => setTimeout(resolve, 60));

    const draft = "Rascunho inicial: Petição contra ato X com fundamentos legais Y";

    current = updateState(current, {
      currentStep: "redacao:done",
      data: { ...current.data, draft },
      completed: true,
    });

    return this.addAgentMessage(current, "Redação: rascunho gerado com sucesso");
  }
}

export async function runRedacaoPeticoes(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new RedacaoPeticoesAgent();
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
