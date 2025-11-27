/**
 * KV API endpoint
 *
 * Handles GET and POST requests for key-value storage
 * - GET: Retrieve value by key
 * - POST: Set value for key
 * - POST ?action=init: Initialize configuration with agents and lawyer data
 *
 * Supports both Upstash Redis and Vercel KV
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { requireAuth, sendAuthError } from './lib/auth.js';
import { rateLimitMiddleware } from './lib/rate-limit.js';
import { handleError, withErrorHandler } from './lib/error-handler.js';
import { SafeLogger } from './lib/safe-logger.js';

// Initialize Redis client (supports both Upstash and Vercel KV)
// Prefer Upstash explicit configuration if available
const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

const redis = (redisUrl && redisToken) ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

const logger = new SafeLogger('KV');

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

    // Use Upstash Redis if available
    if (redis) {
      await Promise.all([
        redis.set('autonomous-agents', JSON.stringify(agentes)),
        redis.set('monitored-lawyers', JSON.stringify([advogado])),
        redis.set('agent-task-queue', JSON.stringify([])),
        redis.set('completed-agent-tasks', JSON.stringify([])),
      ]);
    } else {
      throw new Error('No KV storage available (Upstash Redis required)');
    }

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


export default withErrorHandler(async (req: VercelRequest, res: VercelResponse) => {
  // Apply authentication
  const authResult = await requireAuth(req, res);
  if (!authResult.authenticated) {
    sendAuthError(res, authResult);
    return;
  }

  // Apply rate limiting
  const clientIP = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                   (req.headers['x-real-ip'] as string) ||
                   'unknown';

  const rateLimitResult = await rateLimitMiddleware(clientIP);
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', Math.ceil((Date.now() + 60000) / 1000).toString());
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.status(429).json({
      error: rateLimitResult.error || 'Rate limit exceeded'
    });
    return;
  }

  // Set rate limit headers
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  logger.info('KV API request', {
    method: req.method,
    url: req.url,
    userId: authResult.userId,
    ip: clientIP
  });

  logger.info('KV API request', {
    method: req.method,
    url: req.url,
    userId: authResult.userId
  });
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
    handleInitConfig(req, res);
    return;
  }

  // Parse body if needed
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      console.warn('Failed to parse request body:', e);
    }
  }

  // If no KV is available, return fallback indication
  if (!redis) {
    console.warn('No KV storage available');
    if (req.method === 'GET') {
      res.status(200).json({ key: req.query.key, value: null, fallback: true });
    } else if (req.method === 'POST') {
      res.status(200).json({ success: true, key: body?.key, fallback: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    return;
  }

  try {
    // Use Upstash if available, otherwise Vercel KV
    if (redis) {
      // Upstash Redis
      if (req.method === 'GET') {
        const { key } = req.query;
        if (!key || typeof key !== 'string') {
          res.status(400).json({ error: 'Key parameter is required' });
          return;
        }

        const value = await redis.get(key);
        // Handle null/undefined values gracefully
        if (value === null || value === undefined) {
          res.status(200).json({ key, value: null });
          return;
        }

        res.status(200).json({ key, value });
      } else if (req.method === 'POST') {
        const { key, value } = body || {};
        if (!key || typeof key !== 'string') {
          res.status(400).json({ error: 'Key is required in request body' });
          return;
        }
        if (value === undefined) {
          res.status(400).json({ error: 'Value is required in request body' });
          return;
        }

        await redis.set(key, value);
        res.status(200).json({ success: true, key });
      } else {
        res.status(405).json({ error: 'Method not allowed' });
      }
    }
  } catch (error) {
    logger.error('KV API Error', error);
    return handleError(error, res);
  }
});
