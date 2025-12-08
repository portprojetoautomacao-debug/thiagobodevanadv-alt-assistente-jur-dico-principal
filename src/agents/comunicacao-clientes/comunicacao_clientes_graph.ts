import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class ComunicacaoClientesAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "comunicacao-clientes:start" });

    await new Promise((resolve) => setTimeout(resolve, 30));

    current = updateState(current, {
      currentStep: "comunicacao-clientes:generated",
      data: { ...current.data, message: "Prezado cliente, atualização do processo..." },
      completed: true,
    });

    return this.addAgentMessage(current, "Comunicação com cliente gerada");
  }
}

export async function runComunicacaoClientes(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new ComunicacaoClientesAgent();
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
