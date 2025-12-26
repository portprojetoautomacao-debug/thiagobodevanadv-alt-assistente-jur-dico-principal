/**
 * Hybrid Agents Integration
 *
 * HABILITADO TEMPORARIAMENTE PARA MANUTENÇÃO (25/12/2025)
 *
 * ⚠️ ATENÇÃO: Este sistema está habilitado apenas para verificação e manutenção.
 * Não adicione novas funcionalidades. Apenas corrija bugs se necessário.
 *
 * Motivo da habilitação: Verificar status de funcionamento dos agentes LangGraph
 * após otimizações de TypeScript/JavaScript realizadas.
 *
 * Os agentes LangGraph estão localizados em src/agents/
 */

/**
 * Integra os agentes LangGraph com o sistema existente de 16 agentes
 * Permite execução paralela e coordenação entre agentes tradicionais e híbridos
 */

// HABILITADO TEMPORARIAMENTE PARA MANUTENÇÃO
export const HYBRID_AGENTS_DISABLED = false;

let hasWarnedDisabled = false;

function warnDisabledOnce(): void {
  // Aviso quando desabilitado - agora está habilitado
  const isBrowser = typeof globalThis.window !== "undefined";
  const isDev = process.env.NODE_ENV === "development";

  if (!isBrowser || !isDev) return;
  if (hasWarnedDisabled) return;

  hasWarnedDisabled = true;
  console.log("✅ Hybrid Agents Integration HABILITADO para manutenção (25/12/2025)");
}

// Stub functions para manter compatibilidade
export type HybridAgentType = "langgraph-djen" | "langgraph-custom";

export interface HybridExecutionConfig {
  // Mantém opcional para compatibilidade com chamadas antigas/stub (modo manutenção)
  agentType?: HybridAgentType;
  input?: unknown;
  timeout?: number;
  /** Compatibilidade com chamadas antigas que usavam timeoutMs */
  timeoutMs?: number;
  coordinationMode?: "sequential" | "parallel" | "hybrid" | "fallback";
  enableLangGraph?: boolean;
  enableTraditional?: boolean;
}

export interface HybridExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  langGraphResult?: {
    data?: unknown;
    messages?: Array<{ role: string; content: string }>;
  };
  traditionalResult?: {
    output?: unknown;
  };
  mode?: "langgraph" | "traditional" | "hybrid";
  executionTime?: number;
}

export interface HybridStats {
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  langGraphExecutions: number;
  traditionalExecutions: number;
  hybridExecutions: number;
  successRate: number;
  averageExecutionTime: number;
}

export class HybridAgentOrchestrator {
  async executeTask(): Promise<void> {
    throw new Error("Hybrid agents desabilitados - modo manutenção");
  }
}

// Stub functions para compatibilidade
export function executeHybridTask(
  _configOrAgentId: HybridExecutionConfig | string,
  _taskOrEnableLangGraph?: unknown,
  _configOrCoordinationMode?: unknown
): Promise<HybridExecutionResult> {
  warnDisabledOnce();
  // Aceita ambas assinaturas: nova (config) e antiga (agentId, task, config)
  return Promise.resolve({
    success: false,
    error: "Hybrid agents desabilitados",
    mode: "traditional",
    executionTime: 0,
    langGraphResult: { data: null, messages: [] },
    traditionalResult: { output: null },
  });
}

export function hasHybridVersion(_agentId: string): boolean {
  warnDisabledOnce();
  return false;
}

export function getHybridStats(): HybridStats {
  warnDisabledOnce();
  return {
    totalExecutions: 0,
    successCount: 0,
    failureCount: 0,
    langGraphExecutions: 0,
    traditionalExecutions: 0,
    hybridExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0,
  };
}

export function listHybridAgents(): Array<{ agentId: string; type: string }> {
  return [];
}

export function recordExecution(
  _agentIdOrResult: string | HybridExecutionResult,
  _success?: boolean,
  _executionTime?: number
): void {
  // Aceita tanto (agentId, success, time) quanto (result) para compatibilidade
  // Stub - não faz nada
}

export function resetHybridStats(): void {
  // Stub - não faz nada
}

// Enhance default export compatibility: attach helpers as properties on the default export
// so both ESM named imports and CommonJS require() interop consumers can access them reliably.
const DefaultHybridExport = Object.assign(HybridAgentOrchestrator, {
  executeHybridTask,
  hasHybridVersion,
  getHybridStats,
  listHybridAgents,
  recordExecution,
  resetHybridStats,
  HYBRID_AGENTS_DISABLED,
});

export default DefaultHybridExport;

// CommonJS compatibility: ensure module.exports contains named functions when building to CommonJS
// This avoids "is not a function" errors in CI environments that import compiled files via require().
// Not needed in ESM, but harmless with the guard.
declare const module: any;
try {
  if (typeof module !== "undefined" && module?.exports) {
    module.exports = {
      ...(module.exports || {}),
      executeHybridTask,
      hasHybridVersion,
      getHybridStats,
      listHybridAgents,
      recordExecution,
      resetHybridStats,
      HybridAgentOrchestrator: DefaultHybridExport,
      HYBRID_AGENTS_DISABLED,
    };
  }
} catch {
  // Ignore errors in ESM environments
}
