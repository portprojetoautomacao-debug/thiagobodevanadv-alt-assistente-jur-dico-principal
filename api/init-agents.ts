/**
 * API Endpoint - Inicializar Agentes Reais
 * POST /api/init-agents
 * 
 * Popula o Spark KV com dados reais dos agentes e advogado monitorado
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Agent {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  status: string;
  capabilities: string[];
  lastActivity: string | null;
  tasksCompleted: number;
  autonomyLevel: number;
}

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email: string;
  tribunals: string[];
  enabled: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autenticação básica
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  if (!authHeader && !apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sparkKvBase = process.env.GITHUB_RUNTIME_PERMANENT_NAME 
      ? `/_spark/kv`
      : 'https://assistente-jurdico-p.vercel.app/_spark/kv';

    // 1. Criar agentes
    const agents: Agent[] = [
      {
        id: 'agent-djen-monitor',
        name: 'Agente de Monitoramento DJEN',
        type: 'monitor',
        enabled: true,
        status: 'active',
        capabilities: [
          'Monitoramento 24/7',
          'Detecção de publicações',
          'Alertas em tempo real',
          'Análise de relevância'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.92,
      },
      {
        id: 'agent-deadline-calculator',
        name: 'Agente Calculador de Prazos',
        type: 'calculator',
        enabled: true,
        status: 'active',
        capabilities: [
          'Cálculo de prazos processuais',
          'Considera feriados e recessos',
          'Alertas de vencimento',
          'Análise de urgência'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.88,
      },
      {
        id: 'agent-document-analyzer',
        name: 'Agente Analisador de Documentos',
        type: 'analyzer',
        enabled: true,
        status: 'active',
        capabilities: [
          'Análise de petições',
          'Extração de dados',
          'Identificação de prazos',
          'Resumo automático'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.85,
      },
      {
        id: 'agent-legal-writer',
        name: 'Agente Redator Jurídico',
        type: 'writer',
        enabled: true,
        status: 'active',
        capabilities: [
          'Redação de peças',
          'Sugestão de teses',
          'Formatação ABNT',
          'Revisão jurídica'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.78,
      },
      {
        id: 'agent-jurisprudence-researcher',
        name: 'Agente Pesquisador de Jurisprudência',
        type: 'researcher',
        enabled: true,
        status: 'active',
        capabilities: [
          'Busca de precedentes',
          'Análise de tendências',
          'Resumo de decisões',
          'Recomendações estratégicas'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.82,
      },
      {
        id: 'agent-strategic-advisor',
        name: 'Agente Estratégico',
        type: 'strategic',
        enabled: true,
        status: 'active',
        capabilities: [
          'Análise de riscos',
          'Planejamento processual',
          'Probabilidade de êxito',
          'Sugestões táticas'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.75,
      },
      {
        id: 'agent-calendar-sync',
        name: 'Agente de Sincronização de Agenda',
        type: 'calendar',
        enabled: true,
        status: 'active',
        capabilities: [
          'Sincronização Google Calendar',
          'Lembretes automáticos',
          'Gestão de compromissos',
          'Alertas de audiências'
        ],
        lastActivity: null,
        tasksCompleted: 0,
        autonomyLevel: 0.90,
      },
    ];

    // 2. Configurar advogado
    const lawyers: MonitoredLawyer[] = [
      {
        id: 'lawyer-thiago-bodevan',
        name: 'Thiago Bodevan Veiga',
        oab: 'OAB/MG 184.404',
        email: req.body?.email || '',
        tribunals: [
          'TJMG',   // Tribunal de Justiça de Minas Gerais
          'TRT3',   // Tribunal Regional do Trabalho 3ª Região (MG)
          'TST',    // Tribunal Superior do Trabalho
          'STJ',    // Superior Tribunal de Justiça
        ],
        enabled: true,
      },
    ];

    // 3. Inicializar filas vazias
    const taskQueue: any[] = [];
    const completedTasks: any[] = [];

    // Salvar no KV usando endpoints internos
    const results = {
      agents: null as any,
      lawyers: null as any,
      taskQueue: null as any,
      completedTasks: null as any,
    };

    // Tentar salvar usando método POST com operação set
    const kvResults = await Promise.allSettled([
      fetch(`${sparkKvBase}/autonomous-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ operation: 'set', value: agents }),
      }),
      fetch(`${sparkKvBase}/monitored-lawyers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ operation: 'set', value: lawyers }),
      }),
      fetch(`${sparkKvBase}/agent-task-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ operation: 'set', value: taskQueue }),
      }),
      fetch(`${sparkKvBase}/completed-agent-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        },
        body: JSON.stringify({ operation: 'set', value: completedTasks }),
      }),
    ]);

    console.log('[Init Agents] KV write results:', kvResults.map((r, i) => ({
      index: i,
      status: r.status,
      reason: r.status === 'rejected' ? r.reason : 'ok'
    })));

    return res.status(200).json({
      ok: true,
      message: 'Agentes inicializados com sucesso',
      data: {
        agents: {
          count: agents.length,
          names: agents.map(a => a.name),
        },
        lawyers: {
          count: lawyers.length,
          name: lawyers[0].name,
          oab: lawyers[0].oab,
          tribunals: lawyers[0].tribunals,
        },
        queues: {
          taskQueue: taskQueue.length,
          completedTasks: completedTasks.length,
        },
      },
      kvResults: kvResults.map((r, i) => ({
        index: i,
        status: r.status,
      })),
      note: 'Dados salvos no Spark KV. Aguarde próxima execução dos cron jobs (9h DJEN, 0h reset).',
    });

  } catch (error) {
    console.error('[Init Agents] Error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
