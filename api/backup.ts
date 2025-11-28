import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * API consolidada para backup de agentes IA
 *
 * Endpoints:
 * - POST /api/backup                   → Criar/validar backup (client-side storage)
 * - GET  /api/backup?action=restore   → Restaurar (orienta uso do storage do Spark)
 * - GET  /api/backup?action=history   → Ver histórico (orienta uso do storage do Spark)
 *
 * NOTA: Usa Spark (localStorage/KV do front) como storage primário.
 * Este endpoint só valida e devolve o payload para o cliente guardar.
 */

interface BackupPayloadData {
  agents?: Record<string, unknown>
  monitoredLawyers?: Record<string, unknown>
  taskQueue?: Record<string, unknown>
  completedTasks?: Record<string, unknown>
  lastDjenCheck?: Record<string, unknown>
}

interface BackupData {
  timestamp: number
  userId: string
  data: BackupPayloadData
}

interface BackupRequestBody {
  userId?: string
  data?: BackupPayloadData
}

function normalizeAction(action: string | string[] | undefined): string | undefined {
  if (!action) return undefined
  return Array.isArray(action) ? action[0] : action
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const action = normalizeAction(req.query.action)

  try {
    // =========================
    // POST - Criar/validar backup
    // =========================
    if (req.method === 'POST') {
      let body: BackupRequestBody | undefined

      if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body) as BackupRequestBody
        } catch (e) {
           
          console.warn('[api/backup] Failed to parse request body as JSON:', e)
          body = undefined
        }
      } else {
        body = req.body as BackupRequestBody
      }

      const userId = body?.userId
      const data = body?.data ?? {}

      if (!userId || typeof userId !== 'string') {
        res.status(400).json({ error: 'userId is required' })
        return
      }

      // Criar backup com timestamp
      const backup: BackupData = {
        timestamp: Date.now(),
        userId,
        data
      }

      // Validar tamanho do backup (limite ~1MB)
      const backupString = JSON.stringify(backup)
      const backupSize = backupString.length

      if (backupSize > 1024 * 1024) {
        res.status(413).json({
          error: 'Backup too large',
          size: backupSize,
          limit: 1024 * 1024
        })
        return
      }

       
      console.log(
        `[api/backup] Backup validated for user ${userId}: ${(backupSize / 1024).toFixed(2)} KB`
      )

      res.status(200).json({
        success: true,
        message: 'Backup validated successfully',
        timestamp: backup.timestamp,
        size: backupSize,
        backup,
        note:
          'Data returned for client-side storage. For server storage, use Vercel KV (Pro) or a DB like Supabase.'
      })
      return
    }

    // =========================
    // GET - Restaurar ou ver histórico (apenas orienta o cliente)
    // =========================
    if (req.method === 'GET') {
      const userId =
        typeof req.query.userId === 'string' ? (req.query.userId as string) : undefined

      if (!userId) {
        res.status(400).json({ error: 'userId is required' })
        return
      }

      if (action === 'restore') {
        res.status(200).json({
          success: true,
          message: 'Using client-side storage (Spark KV / localStorage)',
          info:
            'Backups são armazenados no navegador (localStorage). Para backup em servidor, configure Vercel KV (Pro) ou Supabase.',
          userId,
          recommendation:
            'Os dados persistem no navegador atual. Limpar os dados do navegador zera os agentes e o backup local.'
        })
        return
      }

      if (action === 'history') {
        res.status(200).json({
          success: true,
          message: 'Using client-side storage (Spark KV / localStorage)',
          info: 'O histórico de backups é mantido no localStorage do navegador.',
          userId,
          storage: 'local',
          recommendation:
            'Para histórico centralizado entre dispositivos/usuários, configure um backend com Vercel KV, Supabase ou outro banco.'
        })
        return
      }

      res.status(400).json({
        error: 'Invalid action. Use: restore or history'
      })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
     
    console.error('[api/backup] Backup API error:', error)

    res.status(500).json({
      error: 'Backup operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
