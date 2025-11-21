/**
 * Vercel KV API endpoint
 * 
 * Handles GET and POST requests for key-value storage
 * - GET: Retrieve value by key
 * - POST: Set value for key
 * - POST ?action=init: Initialize configuration with agents and lawyer data
 * 
 * Uses Vercel KV in production, returns 404 in development (falls back to localStorage)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Check if we're in a production environment with Vercel KV available
const isVercelKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

/**
 * Initialize configuration with default agents and lawyer data
 */
async function handleInitConfig(req: VercelRequest, res: VercelResponse) {
  try {
    const agentes = [
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

    const advogado = {
      id: 'lawyer-thiago-bodevan',
      name: 'Thiago Bodevan Veiga',
      oab: '184404/MG',
      email: 'thiagobodevanadvocacia@gmail.com',
      tribunals: ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1'],
      enabled: true,
    };

    // Dynamically import @vercel/kv (only available in production)
    const { kv } = await import('@vercel/kv');

    // Salvar todas as chaves
    await Promise.all([
      kv.set('autonomous-agents', JSON.stringify(agentes)),
      kv.set('monitored-lawyers', JSON.stringify([advogado])),
      kv.set('agent-task-queue', JSON.stringify([])),
      kv.set('completed-agent-tasks', JSON.stringify([])),
    ]);

    return res.status(200).json({
      ok: true,
      message: 'Configuração inicializada com sucesso!',
      data: {
        agentes: agentes.length,
        advogado: {
          name: advogado.name,
          oab: advogado.oab,
          email: advogado.email,
          tribunals: advogado.tribunals,
        },
        keys: [
          'autonomous-agents',
          'monitored-lawyers',
          'agent-task-queue',
          'completed-agent-tasks',
        ],
      },
    });
  } catch (error) {
    console.error('Error initializing config:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to initialize configuration',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Special action: Initialize configuration
  const action = req.query.action as string | undefined;
  if (action === 'init' && req.method === 'POST') {
    return handleInitConfig(req, res);
  }

  // If Vercel KV is not available, return success with fallback indication
  // This allows the client to use localStorage as fallback
  if (!isVercelKVAvailable) {
    if (req.method === 'GET') {
      // Return null for GET requests when KV is not available
      res.status(200).json({ key: req.query.key, value: null, fallback: true });
    } else if (req.method === 'POST') {
      // Return success for POST requests when KV is not available
      res.status(200).json({ success: true, key: req.body?.key, fallback: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    return;
  }

  try {
    // Dynamically import @vercel/kv (only available in production)
    const { kv } = await import('@vercel/kv');

    if (req.method === 'GET') {
      // GET: Retrieve value
      const { key } = req.query;

      if (!key || typeof key !== 'string') {
        res.status(400).json({ error: 'Key parameter is required' });
        return;
      }

      const value = await kv.get(key);

      if (value === null) {
        res.status(404).json({ error: 'Key not found' });
        return;
      }

      res.status(200).json({ key, value });
    } else if (req.method === 'POST') {
      // POST: Set value
      const { key, value } = req.body;

      if (!key || typeof key !== 'string') {
        res.status(400).json({ error: 'Key is required in request body' });
        return;
      }

      if (value === undefined) {
        res.status(400).json({ error: 'Value is required in request body' });
        return;
      }

      await kv.set(key, value);
      res.status(200).json({ success: true, key });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vercel KV error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
