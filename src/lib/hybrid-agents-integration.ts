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

export class HybridAgentOrchestrator {
  async executeTask(): Promise<void> {
    throw new Error("Hybrid agents desabilitados - modo manutenção");
  }
}

export default HybridAgentOrchestrator;
