/**
 * Hybrid Agents Integration
 *
 * DESABILITADO (modo manutenção): Este arquivo foi temporariamente desabilitado
 * pois depende de agentes LangGraph que não estão disponíveis no build Vercel.
 *
 * Motivo: Sistema em produção estável - foco em corrigir bugs, não adicionar features.
 * Os agentes LangGraph estão localizados em src/agents/ mas causam erros de build
 * devido a incompatibilidades de path alias @/agents/
 *
 * Para reativar: Configure path mapping correto no tsconfig.json e vercel.json
 */

/**
 * Integra os agentes LangGraph com o sistema existente de 15 agentes
 * Permite execução paralela e coordenação entre agentes tradicionais e híbridos
 */

// CÓDIGO DESABILITADO - Mantido para referência futura
export const HYBRID_AGENTS_DISABLED = true;

console.warn("⚠️  Hybrid Agents Integration está desabilitado (modo manutenção)");

// ============================================================================
// TYPE EXPORTS (para compatibilidade)
// ============================================================================

export type HybridAgentType = "langgraph-djen" | "langgraph-custom";

export type HybridExecutionConfig = {
  enableLangGraph?: boolean;
  enableTraditional?: boolean;
  coordinationMode?: "parallel" | "fallback" | "sequential";
  timeoutMs?: number;
};

export type HybridExecutionResult = {
  success: boolean;
  mode: "langgraph" | "traditional" | "hybrid";
  executionTime: number;
  langGraphResult?: { completed: boolean; data?: unknown };
  traditionalResult?: { completed: boolean; data?: unknown };
  error?: string;
};

export type HybridStats = {
  totalExecutions: number;
  langGraphExecutions: number;
  traditionalExecutions: number;
  hybridExecutions: number;
  successRate: number;
  averageExecutionTime: number;
};

// ============================================================================
// STUB FUNCTIONS (para compatibilidade)
// ============================================================================

export function executeHybridTask(
  agentId: string,
  task: unknown,
  config?: Partial<HybridExecutionConfig>
): Promise<HybridExecutionResult> {
  console.warn(`[Hybrid] executeHybridTask chamado para ${agentId} mas sistema está desabilitado`);
  
  return Promise.resolve({
    success: false,
    mode: "traditional",
    executionTime: 0,
    error: "Hybrid agents desabilitados - modo manutenção"
  });
}

export function getHybridStats(): HybridStats {
  return {
    totalExecutions: 0,
    langGraphExecutions: 0,
    traditionalExecutions: 0,
    hybridExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0
  };
}

export function hasHybridVersion(agentId: string): boolean {
  return false;
}

export function listHybridAgents(): Array<{ agentId: string; type?: string }> {
  return [];
}

export function recordExecution(result: HybridExecutionResult): void {
  // No-op quando desabilitado
}

export function resetHybridStats(): void {
  // No-op quando desabilitado
}

// ============================================================================
// LEGACY CLASS (mantida para compatibilidade)
// ============================================================================

export class HybridAgentOrchestrator {
  async executeTask(): Promise<void> {
    throw new Error("Hybrid agents desabilitados - modo manutenção");
  }
}

export default HybridAgentOrchestrator;
