import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API consolidada para backup de agentes IA
 * Endpoints:
 * - POST /api/backup - Criar backup
 * - GET /api/backup?action=restore&userId=... - Restaurar backup
 * - GET /api/backup?action=history&userId=... - Ver histórico
 * 
 * NOTA: Usa Spark KV (localStorage) como primary storage
 * Para backup em servidor, considere Vercel KV (Pro) ou Supabase
 */

interface BackupData {
  timestamp: number;
  userId: string;
  data: {
    agents?: Record<string, unknown>;
    monitoredLawyers?: Record<string, unknown>;
    taskQueue?: Record<string, unknown>;
    completedTasks?: Record<string, unknown>;
    lastDjenCheck?: Record<string, unknown>;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { action } = req.query;

  try {
    // POST - Criar backup
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.warn('Failed to parse request body:', e);
        }
      }
      
      const { userId, data } = body || {};

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Criar backup com timestamp
      const backup: BackupData = {
        timestamp: Date.now(),
        userId,
        data
      };

      // Validar tamanho do backup
      const backupSize = JSON.stringify(backup).length;
      if (backupSize > 1024 * 1024) { // 1MB limit
        return res.status(413).json({ 
          error: 'Backup too large',
          size: backupSize,
          limit: 1024 * 1024
        });
      }

      console.log(`Backup validated for user ${userId}: ${(backupSize / 1024).toFixed(2)} KB`);

      return res.status(200).json({
        success: true,
        message: 'Backup validated successfully',
        timestamp: backup.timestamp,
        size: backupSize,
        backup: backup,
        note: 'Data returned for client-side storage. For server storage, upgrade to Vercel Pro with KV or integrate Supabase.'
      });
    }

    // GET - Restaurar ou ver histórico
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Restaurar backup
      if (action === 'restore') {
        return res.status(200).json({
          success: true,
          message: 'Using client-side storage (Spark KV)',
          info: 'Backups are stored locally in the browser. For server-side backup, configure Vercel KV (Pro plan) or Supabase.',
          userId,
          recommendation: 'Data persists in browser localStorage. Clear browser data will reset agents.'
        });
      }

      // Ver histórico
      if (action === 'history') {
        return res.status(200).json({
          success: true,
          message: 'Using client-side storage (Spark KV)',
          info: 'Backup history is maintained in browser localStorage',
          userId,
          storage: 'local',
          recommendation: 'For persistent server-side backups across devices, configure Vercel KV (Pro) or Supabase'
        });
      }

      return res.status(400).json({ error: 'Invalid action. Use: restore or history' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Backup API error:', error);
    return res.status(500).json({
      error: 'Backup operation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
