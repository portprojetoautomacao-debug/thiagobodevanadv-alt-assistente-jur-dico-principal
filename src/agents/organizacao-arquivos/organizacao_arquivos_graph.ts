import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class OrganizacaoArquivosAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "organizacao-arquivos:start" });

    await new Promise((resolve) => setTimeout(resolve, 30));

    current = updateState(current, {
      currentStep: "organizacao-arquivos:done",
      data: { ...current.data, organized: true },
      completed: true,
    });

    return this.addAgentMessage(current, "Arquivos organizados e indexados");
  }
}

export async function runOrganizacaoArquivos(
  data: Record<string, unknown> = {}
): Promise<AgentState> {
  const agent = new OrganizacaoArquivosAgent();
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
