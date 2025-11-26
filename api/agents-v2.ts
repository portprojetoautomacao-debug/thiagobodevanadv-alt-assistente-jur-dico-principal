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
 * - GET /api/agents-v2 - Lista agentes disponíveis
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

// Lista de agentes disponíveis (simplificado para evitar problemas de import)
const AVAILABLE_AGENTS = [
  'djen-monitor',
  'datajud-monitor', 
  'deadline-calculator',
  'document-analyzer',
  'petition-drafter',
  'file-organizer',
  'calendar-sync',
  'notification-manager',
  'billing-tracker',
  'client-communicator',
  'research-assistant',
  'case-summarizer',
  'hearing-preparer',
  'task-prioritizer',
  'report-generator'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET - Lista agentes disponíveis
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      availableAgents: AVAILABLE_AGENTS,
      count: AVAILABLE_AGENTS.length,
      message: 'Use POST com { agentId, message?, sessionId? } para executar um agente'
    });
  }

  // POST - Executa agente
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use GET ou POST.' });
  }

  try {
    const { agentId, message, sessionId } = (req.body || {}) as {
      agentId?: string;
      message?: string;
      sessionId?: string;
    };

    // Validação de agentId
    if (!agentId) {
      return res.status(400).json({ 
        error: "Campo 'agentId' é obrigatório.",
        availableAgents: AVAILABLE_AGENTS,
      });
    }

    if (!AVAILABLE_AGENTS.includes(agentId)) {
      return res.status(404).json({ 
        error: `Agente '${agentId}' não encontrado.`,
        availableAgents: AVAILABLE_AGENTS,
      });
    }

    // Importar módulos dinamicamente para evitar problemas de bundling
    const { SimpleAgent, InMemoryMemoryStore } = await import('../lib/ai/core-agent');
    const { HttpLlmClient } = await import('../lib/ai/http-llm-client');
    const { ALL_TOOLS } = await import('../lib/ai/tools');
    const { AGENTS } = await import('../lib/ai/agents-registry');

    const persona = AGENTS[agentId as keyof typeof AGENTS];
    if (!persona) {
      return res.status(404).json({ 
        error: `Persona do agente '${agentId}' não encontrada.`,
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
    const ctx = {
      baseUrl: process.env.APP_BASE_URL || 'https://assistente-juridico-p.vercel.app',
      evolutionApiUrl: process.env.EVOLUTION_API_URL || '',
      evolutionApiKey: process.env.EVOLUTION_API_KEY || '',
    };

    // Criar instância do agente
    const agent = new SimpleAgent({
      llm,
      tools: ALL_TOOLS,
      persona,
      toolContext: ctx,
      sessionId: sessionId || `session-${agentId}-${Date.now()}`,
      maxSteps: 6,
      memoryStore: InMemoryMemoryStore,
    });

    // Mensagem padrão se não fornecida
    const inputMessage = message || 
      `Execute sua rotina automática para o dia de hoje. Priorize tarefas urgentes e use as ferramentas disponíveis para obter dados reais.`;

    console.log(`[Agentes-V2] Executando ${persona.name} (${agentId})`);

    // Executar agente
    const startTime = Date.now();
    const result = await agent.run(inputMessage);
    const executionTime = Date.now() - startTime;

    console.log(`[Agentes-V2] ${persona.name} concluído em ${executionTime}ms`);

    // Retornar resultado COM TRACES (V2)
    return res.status(200).json({
      ok: true,
      agentId,
      agentName: persona.name,
      steps: result.steps,
      usedTools: result.usedTools,
      answer: result.answer,
      traces: result.traces,
      totalDuration: `${(result.totalDuration / 1000).toFixed(1)}s`,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString(),
    });

  } catch (err: unknown) {
    console.error('[/api/agents-v2] Erro na execução:', err);
    
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.stack : undefined) : undefined,
    });
  }
}
