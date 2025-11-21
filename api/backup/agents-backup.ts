import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API para backup automático dos dados dos agentes IA
 * Usa localStorage do servidor (filesystem temporário) + retorna para cliente salvar
 * 
 * NOTA: Vercel KV requer plano pago. Esta versão usa abordagem híbrida:
 * - Cliente mantém dados no Spark KV (localStorage)
 * - API valida e retorna confirmação
 * - Para storage permanente, considere Vercel KV (Pro) ou Supabase
 */

interface BackupData {
  timestamp: number;
  userId: string;
  data: {
    agents?: any;
    monitoredLawyers?: any;
    taskQueue?: any;
    completedTasks?: any;
    lastDjenCheck?: any;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas POST para criar backups
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, data } = req.body;

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

    // Log para monitoramento
    console.log(`Backup validated for user ${userId}: ${(backupSize / 1024).toFixed(2)} KB`);

    // Retornar backup para o cliente salvar localmente
    return res.status(200).json({
      success: true,
      message: 'Backup validated successfully',
      timestamp: backup.timestamp,
      size: backupSize,
      backup: backup,
      note: 'Data returned for client-side storage. For server storage, upgrade to Vercel Pro with KV or integrate Supabase.'
    });

  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
