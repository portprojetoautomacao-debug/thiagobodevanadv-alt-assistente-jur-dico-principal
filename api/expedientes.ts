/**
 * API para gerenciar expedientes/publicações do DJEN
 *
 * Endpoints:
 * - GET  /api/expedientes              → Lista publicações encontradas
 * - POST /api/expedientes/sync (*)     → Força sincronização com DJEN (trigger manual)
 *
 * (*) Em Vercel o ideal é ter /api/expedientes/index.ts e /api/expedientes/sync.ts,
 * mas aqui mantemos a checagem por URL/action pra compatibilizar com o código atual.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'

const KV_KEYS = {
  PUBLICATIONS: 'publications',
  LAST_CHECK: 'last-djen-check',
  MONITORED_LAWYERS: 'monitored-lawyers'
} as const

interface StoredPublication {
  id: string
  djenId?: number | string
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  meio?: string
  link?: string
  hash?: string
  lawyerId: string
  lawyerName: string
  lawyerOAB: string
  matchType: 'nome' | 'oab' | 'ambos'
  notified: boolean
  createdAt: string
}

interface MonitoredLawyer {
  id: string
  name: string
  oab: string
  email?: string
  enabled: boolean
  tribunals: string[]
}

// Type aliases for query parameters (S4323)
type QueryParamValue = string | string[] | undefined

// Singleton do Redis pra não abrir conexão a cada request
let _kvClient: Redis | null = null

async function getKv(): Promise<Redis> {
  if (_kvClient) return _kvClient

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis not configured')
  }

  _kvClient = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim()
  })

  return _kvClient
}

// ===========================
// Helper: Filter publications
// ===========================
function filterPublications(
  publications: StoredPublication[],
  lawyerId: QueryParamValue,
  status: QueryParamValue
): StoredPublication[] {
  let filtered = [...publications]

  // Filter by lawyer
  if (typeof lawyerId === 'string' && lawyerId.trim().length > 0) {
    filtered = filtered.filter(p => p.lawyerId === lawyerId)
  }

  // Filter by unread status
  if (status === 'unread') {
    filtered = filtered.filter(p => !p.notified)
  }

  return filtered
}

// ===========================
// Helper: Sort and limit
// ===========================
function sortAndLimit(
  publications: StoredPublication[],
  limit: string | string[] | undefined
): StoredPublication[] {
  // Sort by createdAt desc
  publications.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Limit results
  const maxResults =
    typeof limit === 'string' && !Number.isNaN(Number(limit))
      ? Number.parseInt(limit, 10)
      : 50

  return publications.slice(0, maxResults)
}

// ===========================
// Helper: Convert to expediente format
// ===========================
function toExpedienteFormat(pub: StoredPublication) {
  return {
    id: pub.id,
    type: pub.tipo || 'Intimação',
    tipo: pub.tipo,
    content: pub.teor,
    teor: pub.teor,
    data: pub.data || pub.createdAt,
    receivedAt: pub.data || pub.createdAt,
    dataRecebimento: pub.data || pub.createdAt,
    analyzed: false,
    tribunal: pub.tribunal,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.orgao,
    lawyerName: pub.lawyerName,
    matchType: pub.matchType,
    source: 'DJEN',
    createdAt: pub.createdAt
  }
}

// ===========================
// Handler: GET /api/expedientes
// ===========================
async function handleGetExpedientes(
  req: VercelRequest,
  res: VercelResponse,
  kv: Redis
): Promise<VercelResponse> {
  const { lawyerId, limit, status } = req.query

  const allPublications =
    (await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS)) ?? []

  const filtered = filterPublications(allPublications, lawyerId, status)
  const publications = sortAndLimit(filtered, limit)

  const lastCheck = await kv.get<string>(KV_KEYS.LAST_CHECK)
  const lawyers =
    (await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)) ?? []

  const expedientes = publications.map(toExpedienteFormat)

  const message =
    lawyers.length === 0
      ? 'Nenhum advogado configurado. Use POST /api/lawyers para adicionar.'
      : `${lawyers.length} advogado(s) monitorado(s)`

  return res.status(200).json({
    success: true,
    expedientes,
    publications,
    count: publications.length,
    lastCheck,
    lawyersConfigured: lawyers.length,
    message
  })
}

// ===========================
// Helper: Build base URL
// ===========================
function buildBaseUrl(req: VercelRequest): string {
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim().length > 0) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NODE_ENV === 'production') {
    return `https://${req.headers.host}`
  }
  return 'http://localhost:3000'
}

// ===========================
// Handler: POST /api/expedientes/sync
// ===========================
async function handlePostSync(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const baseUrl = buildBaseUrl(req)
  const cronUrl = `${baseUrl}/api/cron?action=djen-monitor`

  const response = await fetch(cronUrl, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer manual-sync-token'
    }
  })

  const result = await response.json().catch(() => ({}))

  return res.status(200).json({
    success: true,
    message: 'Sincronização iniciada',
    result
  })
}

// ===========================
// Helper: Check if sync request
// ===========================
function isSyncRequest(req: VercelRequest): boolean {
  const action =
    typeof req.query.action === 'string' ? req.query.action : undefined
  const isSyncByAction = action === 'sync'
  const isSyncByPath = req.url?.includes('/sync') ?? false
  return isSyncByAction || isSyncByPath
}

// ===========================
// Helper: Set CORS headers
// ===========================
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const kv = await getKv()

    if (req.method === 'GET') {
      return handleGetExpedientes(req, res, kv)
    }

    if (req.method === 'POST' && isSyncRequest(req)) {
      return handlePostSync(req, res)
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {

    console.error('[API Expedientes] Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      hint:
        'Verifique se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estão configurados na Vercel'
    })
  }
}
