// api/agents/log.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/kv internamente

import type { VercelRequest, VercelResponse } from '@vercel/node'

type LogRequestBody = {
  agentId?: string
  event?: string
  payload?: unknown
}

// Wrapper simples em torno de globalThis.fetch para evitar erro de tipos
const runtimeFetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  const f = globalThis.fetch
  if (typeof f !== 'function') {
    throw new TypeError('fetch não está disponível no ambiente de execução')
  }
  return f(...args)
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const { agentId, event, payload }: LogRequestBody = (req.body as LogRequestBody) || {}

  if (!agentId || !event) {
    res.status(400).json({
      ok: false,
      error: "Parâmetros 'agentId' e 'event' são obrigatórios."
    })
    return
  }

  try {
    // Descobre baseUrl para chamar o próprio backend
    const vercelUrl = process.env.VERCEL_URL?.trim()
    const hostHeader = typeof req.headers.host === 'string' ? req.headers.host.trim() : ''

    const baseUrl =
      vercelUrl && vercelUrl.length > 0
        ? `https://${vercelUrl}`
        : process.env.NODE_ENV === 'production' && hostHeader
          ? `https://${hostHeader}`
          : 'http://localhost:3000'

    const response = await runtimeFetch(`${baseUrl}/api/kv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Hint opcional para o /api/kv saber que é chamada interna
        'X-Internal-Caller': 'api/agents/log'
      },
      body: JSON.stringify({
        action: 'log-agent',
        payload: {
          agentId,
          event,
          data: payload ?? null,
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      let errorData: { error?: string;[key: string]: unknown } = {}
      try {
        errorData = (await response.json()) as { error?: string;[key: string]: unknown }
      } catch {
        // se não for JSON, mantemos errorData vazio
      }

      res.status(response.status).json({
        ok: false,
        error: errorData.error || 'Erro ao registrar log',
        detalhes: errorData
      })
      return
    }

    const data = (await response.json()) as {
      log?: unknown
      id?: string
      [key: string]: unknown
    }

    const logObj = data.log ?? data
    const logId =
      data.id ||
      (typeof logObj === 'object' && logObj && 'id' in logObj
        ? (logObj as { id?: string }).id
        : undefined)

    res.status(200).json({
      ok: true,
      log: logObj,
      logId,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {

    console.error('[api/agents/log] Erro:', err)
    res.status(500).json({
      ok: false,
      error: 'Erro ao registrar log',
      message: err instanceof Error ? err.message : 'Unknown error'
    })
  }
}
