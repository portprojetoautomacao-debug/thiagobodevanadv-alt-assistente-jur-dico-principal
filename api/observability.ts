/**
 * API de Observabilidade
 * Endpoints:
 * - GET /api/observability?action=circuit-breakers - Status dos circuit breakers
 * - GET /api/observability?action=metrics - Métricas gerais
 * - GET /api/observability?action=health - Health check detalhado
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

interface CircuitBreakerStatus {
  name: string
  state: 'closed' | 'open' | 'half-open'
  failures: number
  lastFailure: string | null
  successRate: number
}

interface SystemMetrics {
  uptime: number
  requestsTotal: number
  errorsTotal: number
  avgResponseTime: number
}

/**
 * Verifica autorização da requisição
 */
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader?.startsWith('Bearer ')
  const host = req.headers.host || ''
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1') || process.env.NODE_ENV === 'development'
  const hasApiKey = !!req.headers['x-api-key']

  return !!(isVercelCron || isLocalDev || hasApiKey)
}

// Simulação de circuit breakers (em produção viria de um serviço real)
function getCircuitBreakers(): CircuitBreakerStatus[] {
  return [
    {
      name: 'gemini-api',
      state: 'closed',
      failures: 0,
      lastFailure: null,
      successRate: 100
    },
    {
      name: 'datajud-api',
      state: 'closed',
      failures: 0,
      lastFailure: null,
      successRate: 100
    },
    {
      name: 'djen-api',
      state: 'closed',
      failures: 0,
      lastFailure: null,
      successRate: 100
    },
    {
      name: 'upstash-redis',
      state: 'closed',
      failures: 0,
      lastFailure: null,
      successRate: 100
    }
  ]
}

// Métricas simuladas (em produção viria de monitoring real)
function getMetrics(): SystemMetrics {
  return {
    uptime: Math.floor(process.uptime()),
    requestsTotal: 0,
    errorsTotal: 0,
    avgResponseTime: 0
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Em dev local, permitir acesso sem auth
  const host = req.headers.host || ''
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1')

  if (!isLocalDev && !isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const actionParam = req.query.action
    const action = Array.isArray(actionParam) ? actionParam[0] : actionParam

    switch (action) {
      case 'circuit-breakers':
        return res.status(200).json({
          ok: true,
          circuitBreakers: getCircuitBreakers(),
          timestamp: new Date().toISOString()
        })

      case 'metrics':
        return res.status(200).json({
          ok: true,
          metrics: getMetrics(),
          timestamp: new Date().toISOString()
        })

      case 'health':
        return res.status(200).json({
          ok: true,
          status: 'healthy',
          services: {
            api: 'up',
            redis: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'not-configured',
            gemini: process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY ? 'configured' : 'not-configured'
          },
          timestamp: new Date().toISOString()
        })

      default:
        return res.status(200).json({
          ok: true,
          availableActions: ['circuit-breakers', 'metrics', 'health'],
          timestamp: new Date().toISOString()
        })
    }
  } catch (error) {
    console.error('Observability API error:', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
