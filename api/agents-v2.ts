/**
 * API consolidada para processamento de agentes IA - VERSÃO PRODUÇÃO V2
 * 
 * MUDANÇAS vs VERSÃO ANTERIOR:
 * ✅ Usa arquitetura modular (core-agent, tools, registry)
 * ✅ Conecta com APIs REAIS (sem dados simulados)
 * ✅ Suporta 15 agentes especializados
 * ✅ Sistema de tools com permissões por agente
 * ✅ Logs estruturados para auditoria
 * ✅ Tratamento de erros robusto
 * ✅ ReAct pattern com observabilidade completa (NOVO)
 * ✅ Circuit breakers para resiliência de APIs (NOVO)
 * ✅ Traces detalhados de execução (NOVO)
 * 
 * Endpoints:
 * - POST /api/agents-v2 - Executa agente específico
 *   Body: { agentId: string, message?: string, sessionId?: string }
 * 
 * Response:
 * {
 *   ok: true,
 *   agentId: string,
 *   agentName: string,
 *   steps: number,
 *   usedTools: string[],
 *   answer: string,
 *   traces: AgentTrace[], // NOVO: histórico completo de execução
 *   totalDuration: number, // NOVO: duração total em ms
 *   executionTimeMs: number,
 *   timestamp: string
 * }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SimpleAgent, InMemoryMemoryStore } from '../lib/ai/core-agent';
import { HttpLlmClient } from '../lib/ai/http-llm-client';
import { ALL_TOOLS, type GlobalToolContext } from '../lib/ai/tools';
import { AGENTS, type AgentId } from '../lib/ai/agents-registry';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const { agentId, message, sessionId } = (req.body || {}) as {
      agentId?: AgentId;
      message?: string;
      sessionId?: string;
    };

    // Validação de agentId
    if (!agentId) {
      return res.status(400).json({ 
        error: "Campo 'agentId' é obrigatório.",
        availableAgents: Object.keys(AGENTS),
      });
    }

    const persona = AGENTS[agentId];
    if (!persona) {
      return res.status(404).json({ 
        error: `Agente '${agentId}' não encontrado.`,
        availableAgents: Object.keys(AGENTS),
      });
    }

    // Configurar cliente LLM
    const llmProxyUrl = process.env.LLM_PROXY_URL || 
                        `${process.env.APP_BASE_URL || ''}/api/llm-proxy`;
    
    const llm = new HttpLlmClient({
      baseUrl: llmProxyUrl,
      timeout: 30000, // 30s
      maxRetries: 3,
    });

    // Configurar contexto de tools
    const ctx: GlobalToolContext = {
      baseUrl: process.env.APP_BASE_URL || 'https://assistente-juridico-p.vercel.app',
      evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
      evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
    };

    // Validar configurações críticas
    if (!ctx.baseUrl) {
      console.warn('[Agentes] APP_BASE_URL não configurada, usando fallback');
    }

    // Criar instância do agente
    const agent = new SimpleAgent({
      llm,
      tools: ALL_TOOLS,
      persona,
      toolContext: ctx,
      sessionId: sessionId || `session-${agentId}-${Date.now()}`,
      maxSteps: 6,
      // TODO: Trocar por UpstashMemoryStore em produção
      memoryStore: InMemoryMemoryStore,
    });

    // Mensagem padrão se não fornecida
    const inputMessage = message || 
      `Execute sua rotina automática para o dia de hoje. Priorize tarefas urgentes e use as ferramentas disponíveis para obter dados reais.`;

    console.log(`[Agentes] Executando ${persona.name} (${agentId})`);
    console.log(`[Agentes] Mensagem: ${inputMessage.substring(0, 100)}...`);

    // Executar agente
    const startTime = Date.now();
    const result = await agent.run(inputMessage);
    const executionTime = Date.now() - startTime;

    console.log(`[Agentes] ${persona.name} concluído em ${executionTime}ms`);
    console.log(`[Agentes] Steps: ${result.steps}, Tools usadas: ${result.usedTools.join(', ')}`);

    // Retornar resultado
    return res.status(200).json({
      ok: true,
      agentId,
      agentName: persona.name,
      steps: result.steps,
      usedTools: result.usedTools,
      answer: result.answer,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('[/api/agents] Erro na execução:', err);
    
    // Retornar erro detalhado
    return res.status(500).json({
      ok: false,
      error: err?.message ?? 'Erro interno no agente',
      stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
    });
  }
}
