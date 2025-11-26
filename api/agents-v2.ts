/**
 * API consolidada para processamento de agentes IA - VERSÃO PRODUÇÃO V2
 * Endpoint simplificado para evitar problemas de bundling
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lista de agentes disponíveis
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
      message: 'Use POST com { agentId, message?, sessionId? } para executar um agente',
      version: 'v2-simplified'
    });
  }

  // POST - Executa agente (versão simplificada)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use GET ou POST.' });
  }

  try {
    const { agentId, message } = (req.body || {}) as {
      agentId?: string;
      message?: string;
    };

    // Validação
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

    // Versão simplificada: retorna resposta mock
    // TODO: Implementar integração completa com lib/ai quando bundling estiver funcionando
    const startTime = Date.now();
    
    return res.status(200).json({
      ok: true,
      agentId,
      agentName: agentId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      steps: 1,
      usedTools: [],
      answer: `Agente ${agentId} executado com sucesso (modo simplificado). Mensagem recebida: ${message || 'nenhuma'}`,
      traces: [],
      totalDuration: '0.1s',
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      note: 'Versão simplificada - integração completa em desenvolvimento'
    });

  } catch (err: unknown) {
    console.error('[/api/agents-v2] Erro:', err);
    
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
