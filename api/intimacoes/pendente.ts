aqui vai revisado e padronizado, pronto pra colar:

```ts
// api/intimacoes/pendente.ts
// Wrapper endpoint que alinha com modelo de referência
// Delega para /api/djen/check internamente

import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/djen/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'next-pending'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as Record<string, unknown>))
      return res.status(response.status).json({
        ok: false,
        error: (errorData as { error?: string }).error || 'Erro ao buscar intimação',
        detalhes: errorData
      })
    }

    const data = await response.json()

    // Normaliza resposta para padrão do modelo
    return res.status(200).json({
      ok: true,
      intimacao: (data as { intimacao?: unknown }).intimacao ?? data,
      timestamp: new Date().toISOString()
    })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('[api/intimacoes/pendente] Erro:', error)

    return res.status(500).json({
      ok: false,
      error: 'Erro ao buscar intimação',
      message: error.message
    })
  }
}
```
