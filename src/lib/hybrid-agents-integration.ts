/**
 * Hybrid Agents Integration
 *
 * Integra os agentes LangGraph com o sistema existente de 15 agentes
 * Permite execução paralela e coordenação entre agentes tradicionais e híbridos
 *
 * NOTA: Agentes LangGraph em desenvolvimento - implementação planejada para próxima versão
 */

import type { AgentState } from "@/agents/base/agent_state";
import { updateState } from "@/agents/base/agent_state";
import { LangGraphAgent } from "@/agents/base/langgraph_agent";
import type { AgentTask } from "./agents.js";

/**
 * Tipos de agentes híbridos disponíveis
 */
export type HybridAgentType = "langgraph-djen" | "langgraph-custom";

/**
 * Configuração de execução híbrida
 */
export interface HybridExecutionConfig {
  enableLangGraph?: boolean;
  enableTraditional?: boolean;
  coordinationMode?: "sequential" | "parallel" | "fallback";
  timeoutMs?: number;
}

/**
 * Resultado de execução híbrida
 */
export interface HybridExecutionResult {
  success: boolean;
  langGraphResult?: AgentState;
  traditionalResult?: {
    taskId: string;
    status: AgentTask["status"];
    output?: unknown;
  };
  executionTime: number;
  mode: "langgraph" | "traditional" | "hybrid";
}

/**
 * Mapeamento de agentes tradicionais para híbridos
 */
const AGENT_MAPPING: Record<string, HybridAgentType | null> = {
  "monitor-djen": "langgraph-djen",
  justine: "langgraph-custom",
  harvey: "langgraph-custom",
  "redacao-peticoes": "langgraph-custom",
  "analise-documental": "langgraph-custom",
  "gestao-prazos": "langgraph-custom",
  "organizacao-arquivos": "langgraph-custom",
  "pesquisa-juris": "langgraph-custom",
  "analise-risco": "langgraph-custom",
  "revisao-contratual": "langgraph-custom",
  "comunicacao-clientes": "langgraph-custom",
  financeiro: "langgraph-custom",
  "estrategia-processual": "langgraph-custom",
  "traducao-juridica": "langgraph-custom",
  compliance: "langgraph-custom",
};

/**
 * Cache de instâncias de agentes LangGraph
 */
const agentCache = new Map<string, LangGraphAgent>();

/**
 * Obtém instância de agente LangGraph (com cache)
 *
 * @throws Error - LangGraph agents ainda não implementados (em construção)
 */
function getLangGraphAgent(type: HybridAgentType, agentId?: string): LangGraphAgent {
  const cacheKey = agentId ? `${type}:${agentId}` : type;

  const cachedAgent = agentCache.get(cacheKey);
  if (cachedAgent) {
    return cachedAgent;
  }

  // Agentes LangGraph em desenvolvimento - implementação planejada para próxima versão
  throw new Error(`LangGraph agents em construção - agentId: ${agentId || type}`);
}

/**
 * Executa tarefa usando agente híbrido
 */
export async function executeHybridTask(
  agentId: string,
  task: AgentTask,
  config: HybridExecutionConfig = {}
): Promise<HybridExecutionResult> {
  const startTime = Date.now();
  const {
    enableLangGraph = true,
    enableTraditional = true,
    coordinationMode = "fallback",
    timeoutMs = 30000,
  } = config;

  // Verifica se agente tem versão LangGraph
  const hybridType = AGENT_MAPPING[agentId];
  const hasLangGraph = hybridType !== null;

  // Modo 1: Apenas LangGraph (se disponível e habilitado)
  if (hasLangGraph && enableLangGraph && !enableTraditional) {
    const agent = getLangGraphAgent(hybridType, agentId);
    const taskDescription =
      typeof task.data === "object" && task.data !== null && "description" in task.data
        ? String(task.data.description || "")
        : String(task.data || "");
    const initialState: AgentState = {
      messages: [{ role: "user", content: taskDescription, timestamp: Date.now() }],
      currentStep: "init",
      data: { taskId: task.id, agentId },
      completed: false,
      retryCount: 0,
      maxRetries: 3,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    try {
      const result = await agent.execute(initialState);
      return {
        success: !result.error,
        langGraphResult: result,
        executionTime: Date.now() - startTime,
        mode: "langgraph",
      };
    } catch (error) {
      return {
        success: false,
        langGraphResult: updateState(initialState, {
          error: error instanceof Error ? error.message : "Unknown error",
          completed: true,
        }),
        executionTime: Date.now() - startTime,
        mode: "langgraph",
      };
    }
  }

  // Modo 2: Apenas tradicional (se LangGraph não disponível ou desabilitado)
  if (!hasLangGraph || !enableLangGraph) {
    return {
      success: true,
      traditionalResult: {
        taskId: task.id,
        status: "queued", // Será processado pelo sistema tradicional
      },
      executionTime: Date.now() - startTime,
      mode: "traditional",
    };
  }

  // Modo 3: Híbrido (coordenação entre LangGraph e tradicional)
  if (coordinationMode === "sequential") {
    // LangGraph primeiro, depois tradicional
    const agent = getLangGraphAgent(hybridType, agentId);
    const taskDescription =
      typeof task.data === "object" && task.data !== null && "description" in task.data
        ? String(task.data.description || "")
        : String(task.data || "");
    const initialState: AgentState = {
      messages: [{ role: "user", content: taskDescription, timestamp: Date.now() }],
      currentStep: "init",
      data: { taskId: task.id, agentId },
      completed: false,
      retryCount: 0,
      maxRetries: 3,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    const langGraphResult = await agent.execute(initialState);

    return {
      success: !langGraphResult.error,
      langGraphResult,
      traditionalResult: {
        taskId: task.id,
        status: langGraphResult.error ? "queued" : "completed",
      },
      executionTime: Date.now() - startTime,
      mode: "hybrid",
    };
  }

  if (coordinationMode === "fallback") {
    // Tenta LangGraph, fallback para tradicional se falhar
    const agent = getLangGraphAgent(hybridType, agentId);
    const taskDescription =
      typeof task.data === "object" && task.data !== null && "description" in task.data
        ? String(task.data.description || "")
        : String(task.data || "");
    const initialState: AgentState = {
      messages: [{ role: "user", content: taskDescription, timestamp: Date.now() }],
      currentStep: "init",
      data: { taskId: task.id, agentId },
      completed: false,
      retryCount: 0,
      maxRetries: 3,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };

    try {
      const langGraphResult = await Promise.race([
        agent.execute(initialState),
        new Promise<AgentState>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        ),
      ]);

      if (!langGraphResult.error) {
        return {
          success: true,
          langGraphResult,
          executionTime: Date.now() - startTime,
          mode: "langgraph",
        };
      }
    } catch (error) {
      // Fallback para tradicional
      console.warn(`LangGraph failed for ${agentId}, falling back to traditional`, error);
    }

    return {
      success: true,
      traditionalResult: {
        taskId: task.id,
        status: "queued",
      },
      executionTime: Date.now() - startTime,
      mode: "traditional",
    };
  }

  // Modo parallel (executa ambos simultaneamente)
  const agent = getLangGraphAgent(hybridType, agentId);
  const taskDescription =
    typeof task.data === "object" && task.data !== null && "description" in task.data
      ? String(task.data.description || "")
      : String(task.data || "");
  const initialState: AgentState = {
    messages: [{ role: "user", content: taskDescription, timestamp: Date.now() }],
    currentStep: "init",
    data: { taskId: task.id, agentId },
    completed: false,
    retryCount: 0,
    maxRetries: 3,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  const [langGraphResult] = await Promise.allSettled([agent.execute(initialState)]);

  return {
    success: langGraphResult.status === "fulfilled" && !langGraphResult.value.error,
    langGraphResult: langGraphResult.status === "fulfilled" ? langGraphResult.value : undefined,
    traditionalResult: {
      taskId: task.id,
      status: "queued",
    },
    executionTime: Date.now() - startTime,
    mode: "hybrid",
  };
}

/**
 * Verifica se um agente tem versão híbrida disponível
 */
export function hasHybridVersion(agentId: string): boolean {
  return AGENT_MAPPING[agentId] !== null;
}

/**
 * Lista todos os agentes com versão híbrida
 */
export function listHybridAgents(): Array<{ agentId: string; type: HybridAgentType }> {
  return Object.entries(AGENT_MAPPING)
    .filter(([_, type]) => type !== null)
    .map(([agentId, type]) => ({ agentId, type: type! }));
}

/**
 * Obtém estatísticas de execução híbrida
 */
export interface HybridStats {
  totalExecutions: number;
  langGraphExecutions: number;
  traditionalExecutions: number;
  hybridExecutions: number;
  averageExecutionTime: number;
  successRate: number;
}

let executionStats = {
  total: 0,
  langgraph: 0,
  traditional: 0,
  hybrid: 0,
  totalTime: 0,
  successes: 0,
};

/**
 * Registra resultado de execução para estatísticas
 */
export function recordExecution(result: HybridExecutionResult): void {
  executionStats.total++;
  executionStats.totalTime += result.executionTime;

  if (result.mode === "langgraph") executionStats.langgraph++;
  else if (result.mode === "traditional") executionStats.traditional++;
  else if (result.mode === "hybrid") executionStats.hybrid++;

  if (result.success) executionStats.successes++;
}

/**
 * Obtém estatísticas de execução
 */
export function getHybridStats(): HybridStats {
  return {
    totalExecutions: executionStats.total,
    langGraphExecutions: executionStats.langgraph,
    traditionalExecutions: executionStats.traditional,
    hybridExecutions: executionStats.hybrid,
    averageExecutionTime:
      executionStats.total > 0 ? executionStats.totalTime / executionStats.total : 0,
    successRate: executionStats.total > 0 ? executionStats.successes / executionStats.total : 0,
  };
}

/**
 * Reseta estatísticas
 */
export function resetHybridStats(): void {
  executionStats = {
    total: 0,
    langgraph: 0,
    traditional: 0,
    hybrid: 0,
    totalTime: 0,
    successes: 0,
  };
}
