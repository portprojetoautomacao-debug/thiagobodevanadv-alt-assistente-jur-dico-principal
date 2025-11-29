/**
 * API para gerenciar advogados monitorados
 *
 * Endpoints:
 * - GET    /api/lawyers                 → Lista todos os advogados
 * - POST   /api/lawyers                 → Adiciona um advogado
 * - DELETE /api/lawyers?id=xxx          → Remove um advogado
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEY = 'monitored-lawyers'

interface MonitoredLawyer {
  id: string
  name: string
  oab: string
  email?: string
  enabled: boolean
  tribunals: string[]
}

interface LawyerPayload {
  name?: string
  oab?: string
  email?: string
  tribunals?: string[]
}

// ===== Redis singleton =====

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

let _redisClient: Redis | null = null

function getRedis(): Redis {
  if (!redisUrl || !redisToken) {
    throw new Error(
      'Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN'
    )
  }

  if (!_redisClient) {
    _redisClient = new Redis({
      url: redisUrl,
      token: redisToken
    })
  }

  return _redisClient
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const kv = getRedis()

    // =========================
    // GET - Lista advogados
    // =========================
    if (req.method === 'GET') {
      const lawyers = (await kv.get<MonitoredLawyer[]>(KV_KEY)) ?? []

      res.status(200).json({
        success: true,
        lawyers,
        count: lawyers.length
      })
      return
    }

    // =========================
    // POST - Adiciona advogado
    // =========================
    if (req.method === 'POST') {
      let body: unknown = req.body

      if (typeof body === 'string') {
        try {
          body = JSON.parse(body) as LawyerPayload
        } catch (e) {
          console.warn('[API Lawyers] Failed to parse JSON body:', e)
          body = {}
        }
      }

      const { name, oab, email, tribunals } = (body || {}) as LawyerPayload

      if (!name || !oab) {
        res.status(400).json({
          success: false,
          error: 'Nome e OAB sao obrigatorios'
        })
        return
      }

      const lawyers = (await kv.get<MonitoredLawyer[]>(KV_KEY)) ?? []

      // Verifica se já existe por OAB (case-insensitive, ignorando espaços)
      const normalizedOab = oab.replaceAll(/\s+/g, '').toUpperCase()
      const exists = lawyers.some(
        (l) => l.oab.replaceAll(/\s+/g, '').toUpperCase() === normalizedOab
      )

      if (exists) {
        res.status(400).json({
          success: false,
          error: 'Advogado com esta OAB ja cadastrado'
        })
        return
      }

      const newLawyer: MonitoredLawyer = {
        id: `lawyer-${Date.now()}`,
        name,
        oab,
        email: email || '',
        enabled: true,
        tribunals: Array.isArray(tribunals) && tribunals.length > 0
          ? tribunals
          : ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1']
      }

      lawyers.push(newLawyer)
      await kv.set(KV_KEY, lawyers)

      res.status(201).json({
        success: true,
        message: 'Advogado cadastrado com sucesso',
        lawyer: newLawyer
      })
      return
    }

    // =========================
    // DELETE - Remove advogado
    // =========================
    if (req.method === 'DELETE') {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          error: 'ID do advogado e obrigatorio'
        })
        return
      }

      const lawyers = (await kv.get<MonitoredLawyer[]>(KV_KEY)) ?? []
      const filtered = lawyers.filter((l) => l.id !== id)

      if (filtered.length === lawyers.length) {
        res.status(404).json({
          success: false,
          error: 'Advogado nao encontrado'
        })
        return
      }

      await kv.set(KV_KEY, filtered)

      res.status(200).json({
        success: true,
        message: 'Advogado removido com sucesso'
      })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('[API Lawyers] Error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}
