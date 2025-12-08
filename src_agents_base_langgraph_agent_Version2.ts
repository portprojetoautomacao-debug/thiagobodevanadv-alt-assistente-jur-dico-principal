import { StateGraph } from "@langchain/langgraph";
import { AgentState, AgentStateType } from "./agent_state";

type NodeFn = (state: AgentStateType) => Promise<Partial<AgentStateType>>;

/**
 * LangGraphAgent - base class for agents that expose a StateGraph.
 * - Adds retries, timeouts and basic telemetry hooks (TODO integrate OpenTelemetry).
 * - Model is injected as adapter (type any here to keep stub flexible).
 */
export abstract class LangGraphAgent {
  agentId: string;
  model: any;
  timeoutMs = 30_000;
  maxRetries = 2;

  constructor(agentId: string, model: any) {
    this.agentId = agentId;
    this.model = model;
  }

  abstract defineNodes(): Map<string, NodeFn>;
  abstract defineEdges(): Array<{ source: string; target: string | ((state: AgentStateType) => string) }>;

  buildGraph() {
    const graph = new StateGraph(AgentState);
    const nodes = this.defineNodes();

    for (const [nodeId, nodeFunc] of nodes) {
      graph.addNode(nodeId, async (state: AgentStateType) => {
        const start = Date.now();
        try {
          let attempt = 0;
          while (true) {
            attempt++;
            const resultPromise: Promise<Partial<AgentStateType>> = Promise.race([
              nodeFunc(state),
              new Promise<Partial<AgentStateType>>((_, rej) => setTimeout(() => rej(new Error("node-timeout")), this.timeoutMs)),
            ]);
            try {
              const res = await resultPromise;
              const now = new Date().toISOString();
              return {
                ...res,
                metadata: {
                  ...(res.metadata || state.metadata),
                  updatedAt: now,
                  nodeHistory: [...(state.metadata?.nodeHistory || []), nodeId],
                },
              };
            } catch (err) {
              if (attempt > this.maxRetries) throw err;
              // exponential backoff before retry
              await new Promise((r) => setTimeout(r, 200 * attempt));
            }
          }
        } finally {
          const elapsed = Date.now() - start;
          // TODO: emit telemetry span/metric: agentId, nodeId, elapsed
        }
      });
    }

    for (const edge of this.defineEdges()) {
      if (typeof edge.target === "string") {
        graph.addEdge(edge.source, edge.target);
      } else {
        graph.addConditionalEdges(edge.source, edge.target);
      }
    }

    return graph.compile();
  }

  async run(input: Record<string, any>) {
    const compiled = this.buildGraph();
    return await compiled.invoke({
      agentId: this.agentId,
      input,
      messages: [],
      analysis: {},
      metadata: {
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodeHistory: [],
        version: 1,
      },
    });
  }
}