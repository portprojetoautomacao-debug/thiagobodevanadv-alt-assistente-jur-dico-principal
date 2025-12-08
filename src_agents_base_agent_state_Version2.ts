import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/**
 * AgentState: typed shared state used by LangGraph agents.
 * - Mantém histórico mínimo para checkpoints e versionamento.
 * - Use validação (zod) antes de persistir em produção.
 */
export const AgentState = Annotation.Root({
  agentId: Annotation<string>({
    reducer: (current, update) => update || current,
  }),
  processId: Annotation<string | null>({
    reducer: (current, update) => update || current,
    default: () => null,
  }),
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...(current || []), ...(update || [])],
    default: () => [],
  }),
  analysis: Annotation<Record<string, any>>({
    reducer: (current, update) => ({ ...(current || {}), ...(update || {}) }),
    default: () => ({}),
  }),
  input: Annotation<Record<string, any>>({
    reducer: (current, update) => update || current,
    default: () => ({}),
  }),
  result: Annotation<Record<string, any>>({
    reducer: (current, update) => update || current,
    default: () => ({}),
  }),
  metadata: Annotation<{
    startedAt: string;
    updatedAt: string;
    nodeHistory: string[];
    version: number;
  }>({
    reducer: (current, update) => ({ ...(current || {}), ...(update || {}) }),
    default: () => ({
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeHistory: [],
      version: 1,
    }),
  }),
});

export type AgentStateType = typeof AgentState.State;