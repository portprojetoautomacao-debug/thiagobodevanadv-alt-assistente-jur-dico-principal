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

// Stub functions para manter compatibilidade
export type HybridAgentType = "langgraph-djen" | "langgraph-custom";

export interface HybridExecutionConfig {
  agentType: HybridAgentType;
  input: unknown;
  timeout?: number;
  coordinationMode?: 'sequential' | 'parallel' | 'hybrid';
  enableLangGraph?: boolean;
}

export interface HybridExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  langGraphResult?: unknown;
  traditionalResult?: unknown;
  mode?: 'langgraph' | 'traditional' | 'hybrid';
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
export function executeHybridTask(_config: HybridExecutionConfig): Promise<HybridExecutionResult> {
  return Promise.resolve({ success: false, error: "Hybrid agents desabilitados" });
}

export function hasHybridVersion(_agentId: string): boolean {
  return false;
}

export function getHybridStats(): HybridStats {
  return { totalExecutions: 0, successCount: 0, failureCount: 0 };
}

export function listHybridAgents(): string[] {
  return [];
}

export function recordExecution(_agentId: string, _success: boolean): void {
  // Stub - não faz nada
}

export function resetHybridStats(): void {
  // Stub - não faz nada
}

export default HybridAgentOrchestrator;
