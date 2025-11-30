/**
 * API para sincronização manual do DJEN
 *
 * Este endpoint é público e pode ser chamado pelo frontend para forçar
 * uma sincronização com a API do DJEN.
 *
 * POST /api/djen-sync - Executa sincronização para advogados monitorados
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import { randomUUID } from 'node:crypto'

// Rate limiting para evitar abuso
const SYNC_COOLDOWN_MS = 60_000 // 1 minuto entre syncs
const DJEN_TIMEOUT = 15_000

interface MonitoredLawyer {
  id: string
  name: string
  oab: string
  email?: string
  enabled: boolean
  tribunals: string[]
}

interface StoredPublication {
  id: string
  djenId?: number
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  meio?: string
  link?: string
  hash?: string
  matchType: 'nome' | 'oab' | 'ambos'
  lawyerId: string
  lawyerName?: string
  lawyerOAB?: string
  advogados?: Array<{ nome: string; numero_oab: string; uf_oab: string }>
  notified: boolean
  createdAt: string
}

interface DJENComunicacao {
  id: number
  data_disponibilizacao: string
  siglaTribunal: string
  tipoComunicacao: string
  nomeOrgao: string
  texto: string
  numero_processo: string
  meio: string
  link: string
  hash: string
  destinatarioadvogados?: Array<{
    advogado: {
      nome: string
      numero_oab: string
      uf_oab: string
    }
  }>
}

interface DJENResponse {
  status: string
  message: string
  count: number
  items: DJENComunicacao[]
}

const KV_KEYS = {
  PUBLICATIONS: 'publications',
  LAST_SYNC: 'last-djen-sync',
  LAST_CHECK: 'last-djen-check',
  MONITORED_LAWYERS: 'monitored-lawyers',
  PUBLICATION_HASHES: 'publication-hashes'
} as const

// Redis singleton (evita várias conexões em cold starts)
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

function parseOAB(oab: string): { numero?: string; uf?: string } {
  if (!oab) return {}
  const match = oab.match(/(\d+)\s*[/-]?\s*([A-Z]{2})/i)
  if (match) return { numero: match[1], uf: match[2].toUpperCase() }

  const numOnly = oab.match(/^(\d+)$/)
  if (numOnly) return { numero: numOnly[1] }

  return {}
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? ''
}

interface DJENQueryParams {
  numeroOab?: string
  ufOab?: string
  nomeAdvogado?: string
  dataInicio?: string
  dataFim?: string
  meio?: 'D' | 'E'
}

async function consultarDJEN(params: DJENQueryParams): Promise<DJENResponse | null> {
  const queryParts: string[] = []

  if (params.numeroOab) queryParts.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`)
  if (params.ufOab) queryParts.push(`ufOab=${encodeURIComponent(params.ufOab)}`)
  if (params.nomeAdvogado) queryParts.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`)
  if (params.dataInicio) queryParts.push(`dataDisponibilizacaoInicio=${params.dataInicio}`)
  if (params.dataFim) queryParts.push(`dataDisponibilizacaoFim=${params.dataFim}`)
  queryParts.push('itensPorPagina=50')
  queryParts.push(`meio=${params.meio || 'D'}`) // D = Digital (intimações eletrônicas)

  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParts.join('&')}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT)

  try {
     
    console.log(
      '[DJEN-Sync] Consultando:',
      url.replace(/numeroOab=[^&]*/, 'numeroOab=***')
    )

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AssistenteJuridico/1.0'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (response.status === 429) {
       
      console.warn('[DJEN-Sync] Rate limit atingido')
      return null
    }

    if (response.status === 403) {
       
      console.error('[DJEN-Sync] Acesso bloqueado (403) - possível bloqueio geográfico')
      throw new Error('API DJEN bloqueou acesso - verifique se a função está rodando no Brasil (gru1)')
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return (await response.json()) as DJENResponse
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
       
      console.error('[DJEN-Sync] Timeout na consulta')
      throw new Error('Timeout na consulta DJEN')
    }

    throw error
  }
}

interface SyncResult {
  totalPublications: number
  newPublications: number
  errors: string[]
}

function createPublicationFromItem(
  item: DJENComunicacao,
  lawyer: MonitoredLawyer,
  hash: string
): StoredPublication {
  return {
    id: randomUUID(),
    djenId: item.id,
    tribunal: item.siglaTribunal,
    data: item.data_disponibilizacao,
    tipo: item.tipoComunicacao || 'Intimação',
    teor: item.texto?.substring(0, 2000) || '',
    numeroProcesso: item.numero_processo,
    orgao: item.nomeOrgao,
    meio: item.meio,
    link: item.link,
    hash,
    matchType: 'oab',
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    lawyerOAB: lawyer.oab,
    advogados: item.destinatarioadvogados?.map(d => d.advogado) ?? [],
    notified: false,
    createdAt: new Date().toISOString()
  }
}

function getPublicationHash(item: DJENComunicacao): string {
  return item.hash ||
    `${item.siglaTribunal}-${item.data_disponibilizacao}-${item.numero_processo}`
}

async function processLawyerPublications(
  lawyer: MonitoredLawyer,
  dataInicio: string,
  dataFim: string,
  existingPubs: StoredPublication[],
  existingHashes: Set<string>
): Promise<{ totalFound: number; newAdded: number; error?: string }> {
  const { numero, uf } = parseOAB(lawyer.oab)

  if (!numero) {
    console.warn(`[DJEN-Sync] OAB inválida para ${lawyer.name}: ${lawyer.oab}`)
    return { totalFound: 0, newAdded: 0, error: `OAB inválida: ${lawyer.oab}` }
  }

  const djenResponse = await consultarDJEN({
    numeroOab: numero,
    ufOab: uf,
    dataInicio,
    dataFim
  })

  if (!djenResponse?.items) {
    return { totalFound: 0, newAdded: 0 }
  }

  let newAdded = 0
  for (const item of djenResponse.items) {
    const hash = getPublicationHash(item)

    if (existingHashes.has(hash)) {
      continue
    }

    const publication = createPublicationFromItem(item, lawyer, hash)
    existingPubs.unshift(publication)
    existingHashes.add(hash)
    newAdded++
  }

  return { totalFound: djenResponse.items.length, newAdded }
}

async function syncAllLawyers(
  enabledLawyers: MonitoredLawyer[],
  dataInicio: string,
  dataFim: string,
  existingPubs: StoredPublication[],
  existingHashes: Set<string>
): Promise<SyncResult> {
  const result: SyncResult = {
    totalPublications: 0,
    newPublications: 0,
    errors: []
  }

  for (const lawyer of enabledLawyers) {
    try {
      const lawyerResult = await processLawyerPublications(
        lawyer,
        dataInicio,
        dataFim,
        existingPubs,
        existingHashes
      )

      result.totalPublications += lawyerResult.totalFound
      result.newPublications += lawyerResult.newAdded

      if (lawyerResult.error) {
        result.errors.push(`${lawyer.name}: ${lawyerResult.error}`)
      }

      // Delay entre consultas para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
      result.errors.push(`${lawyer.name}: ${errorMsg}`)
      console.error(`[DJEN-Sync] Erro para ${lawyer.name}:`, error)
    }
  }

  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()

  try {
    const kv = await getKv()

    // Rate limiting
    const lastSync = await kv.get<string>(KV_KEYS.LAST_SYNC)
    if (lastSync) {
      const elapsed = Date.now() - new Date(lastSync).getTime()
      if (elapsed < SYNC_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((SYNC_COOLDOWN_MS - elapsed) / 1000)
        return res.status(429).json({
          ok: false,
          error: 'Rate limit',
          message: `Aguarde ${waitSeconds}s antes de sincronizar novamente`,
          retryAfter: waitSeconds
        })
      }
    }

    const lawyers = (await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS)) ?? []
    const enabledLawyers = lawyers.filter(l => l.enabled)

    if (enabledLawyers.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'Nenhum advogado configurado para monitoramento',
        lawyersChecked: 0,
        publicationsFound: 0
      })
    }

    const hoje = new Date()
    const dataFim = formatDate(hoje)
    const dataInicio = formatDate(new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000))

    const existingPubs = (await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS)) ?? []
    const existingHashes = new Set(
      existingPubs.map(p => p.hash || `${p.tribunal}-${p.data}-${p.numeroProcesso ?? ''}`)
    )

    const syncResult = await syncAllLawyers(
      enabledLawyers,
      dataInicio,
      dataFim,
      existingPubs,
      existingHashes
    )

    await kv.set(KV_KEYS.PUBLICATIONS, existingPubs.slice(0, 1000))

    const now = new Date().toISOString()
    await kv.set(KV_KEYS.LAST_SYNC, now)
    await kv.set(KV_KEYS.LAST_CHECK, now)

    const duration = Date.now() - startTime

    return res.status(200).json({
      ok: true,
      message:
        syncResult.newPublications > 0
          ? `Encontradas ${syncResult.newPublications} novas publicações`
          : 'Nenhuma nova publicação encontrada',
      result: {
        lawyersChecked: enabledLawyers.length,
        publicationsFound: syncResult.totalPublications,
        newPublications: syncResult.newPublications,
        duration: `${duration}ms`,
        errors: syncResult.errors.length > 0 ? syncResult.errors : undefined
      }
    })
  } catch (error) {
    console.error('[DJEN-Sync] Error:', error)
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Erro interno',
      hint:
        'Verifique se o Upstash Redis está configurado e se a região da função é gru1 (São Paulo) para acessar a API do PJ-e.'
    })
  }
}
