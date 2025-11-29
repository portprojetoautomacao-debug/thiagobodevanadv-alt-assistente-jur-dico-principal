/**
 * KV API endpoint
 *
 * Handles GET and POST requests for key-value storage
 * - GET:  Retrieve value by key
 * - POST: Set value for key
 * - POST ?action=init: Initialize configuration with agents and lawyer data
 *
 * Suporta Upstash Redis (recomendado em Vercel)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { rateLimitMiddleware } from './lib/rate-limit.js'
import { handleError, withErrorHandler } from './lib/error-handler.js'
import { SafeLogger } from './lib/safe-logger.js'

const logger = new SafeLogger('KV')

// ===== Redis singleton (Upstash) =====

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

let _redisClient: Redis | null = null

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null
  if (!_redisClient) {
    _redisClient = new Redis({
      url: redisUrl,
      token: redisToken
    })
  }
  return _redisClient
}

// ===== Init de configuração (agentes + advogado monitorado) =====

async function handleInitConfig(_req: VercelRequest, res: VercelResponse): Promise<void> {
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
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
        lastActivity: null as string | null
      }
    ]

    const advogado = {
      id: 'lawyer-thiago-bodevan',
      name: 'Thiago Bodevan Veiga',
      oab: '184404/MG',
      email: 'thiagobodevanadvocacia@gmail.com',
      tribunals: ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1'],
      enabled: true
    }

    const redis = getRedisOrNull()
    if (!redis) {
      throw new Error('No KV storage available (Upstash Redis required)')
    }

    await Promise.all([
      redis.set('autonomous-agents', agentes),
      redis.set('monitored-lawyers', [advogado]),
      redis.set('agent-task-queue', []),
      redis.set('completed-agent-tasks', [])
    ])

    res.status(200).json({
      ok: true,
      message: 'Configuração inicializada com sucesso!',
      data: {
        agentes: agentes.length,
        advogado: {
          name: advogado.name,
          oab: advogado.oab,
          email: advogado.email,
          tribunals: advogado.tribunals
        },
        keys: [
          'autonomous-agents',
          'monitored-lawyers',
          'agent-task-queue',
          'completed-agent-tasks'
        ]
      }
    })
  } catch (error) {

    console.error('Error initializing config:', error)
    res.status(500).json({
      ok: false,
      error: 'Failed to initialize configuration',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

// ===== Handler principal =====

export default withErrorHandler(
  async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    // CORS / preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.status(200).end()
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    // Rate limiting por IP
    const clientIP =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string | undefined) ||
      'unknown'

    const rateLimitResult = await rateLimitMiddleware(clientIP)
    Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })

    if (!rateLimitResult.allowed) {
      const resetSeconds = Math.max(
        1,
        Math.ceil((Number(rateLimitResult.headers['X-RateLimit-Reset']) - Date.now()) / 1000)
      )

      res.setHeader('Retry-After', resetSeconds.toString())
      res.status(429).json({
        error: rateLimitResult.error || 'Rate limit exceeded'
      })
      return
    }

    logger.info('KV API request', {
      method: req.method,
      url: req.url,
      ip: clientIP
    })

    const action = typeof req.query.action === 'string' ? req.query.action : undefined

    // POST ?action=init → inicializa configuração
    if (action === 'init' && req.method === 'POST') {
      await handleInitConfig(req, res)
      return
    }

    // Parse body se vier como string
    let body: any = req.body
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {

        console.warn('Failed to parse request body:', e)
      }
    }

    const redis = getRedisOrNull()

    // Se não houver KV configurado, responde em modo "fallback"
    if (!redis) {

      console.warn('No KV storage available')
      if (req.method === 'GET') {
        res.status(200).json({ key: req.query.key, value: null, fallback: true })
      } else if (req.method === 'POST') {
        res
          .status(200)
          .json({ success: true, key: body?.key ?? null, fallback: true })
      } else {
        res.status(405).json({ error: 'Method not allowed' })
      }
      return
    }

    try {
      // ======================
      // GET /api/kv?key=...
      // ======================
      if (req.method === 'GET') {
        const { key } = req.query

        if (!key || typeof key !== 'string') {
          res.status(400).json({ error: 'Key parameter is required' })
          return
        }

        const value = await redis.get(key)

        res.status(200).json({
          key,
          value: value ?? null
        })
        return
      }

      // ======================
      // POST /api/kv
      // ======================
      if (req.method === 'POST') {
        const {
          key,
          value,
          action: bodyAction,
          keys,
          entries
        }: {
          key?: string
          value?: unknown
          action?: string
          keys?: unknown
          entries?: unknown
        } = body || {}

        // batch-get: ler várias chaves de uma vez
        if (bodyAction === 'batch-get' && Array.isArray(keys)) {
          const validKeys = keys
            .filter((k: unknown): k is string => typeof k === 'string')
            .slice(0, 50)

          const values: Record<string, unknown> = {}

          if (validKeys.length > 0) {
            const pipeline = redis.pipeline()
            for (const k of validKeys) {
              pipeline.get(k)
            }
            const results = await pipeline.exec()

            for (let i = 0; i < validKeys.length; i++) {
              values[validKeys[i]] = results[i] ?? null
            }
          }

          res.status(200).json({ success: true, values })
          return
        }

        // batch-set: gravar várias chaves de uma vez
        if (bodyAction === 'batch-set' && Array.isArray(entries)) {
          const validEntries = entries
            .filter(
              (e: unknown): e is { key: string; value: unknown } =>
                !!e &&
                typeof e === 'object' &&
                'key' in e &&
                'value' in e &&
                typeof (e as any).key === 'string'
            )
            .slice(0, 50)

          if (validEntries.length > 0) {
            const pipeline = redis.pipeline()
            for (const entry of validEntries) {
              pipeline.set(entry.key, entry.value)
            }
            await pipeline.exec()
          }

          res.status(200).json({ success: true, count: validEntries.length })
          return
        }

        // set simples key/value
        if (!key || typeof key !== 'string') {
          res.status(400).json({ error: 'Key is required in request body' })
          return
        }
        if (value === undefined) {
          res.status(400).json({ error: 'Value is required in request body' })
          return
        }

        await redis.set(key, value)
        res.status(200).json({ success: true, key })
        return
      }

      res.status(405).json({ error: 'Method not allowed' })
    } catch (error) {
      logger.error('KV API Error', error)
      // passa contexto pro error handler central
      handleError(error, res, 'KV API')
    }
  },
  'KV API'
)
