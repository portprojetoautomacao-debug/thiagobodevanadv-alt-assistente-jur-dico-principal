import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export class FinanceiroAgent extends LangGraphAgent {
  protected async run(state: AgentState, signal: AbortSignal): Promise<AgentState> {
    let current = updateState(state, { currentStep: "financeiro:start" });

    await new Promise((resolve) => setTimeout(resolve, 40));

    current = updateState(current, {
      currentStep: "financeiro:analysis",
      data: { ...current.data, invoices: 3, outstanding: 1200.0 },
      completed: true,
    });

    return this.addAgentMessage(current, "Análise financeira concluída");
  }
}

export async function runFinanceiro(data: Record<string, unknown> = {}): Promise<AgentState> {
  const agent = new FinanceiroAgent();
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
