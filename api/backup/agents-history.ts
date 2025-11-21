import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API para visualizar histórico de backups
 * 
 * NOTA: Esta versão usa Spark KV (localStorage) como primary storage
 * Para histórico em servidor, considere Vercel KV (Pro) ou Supabase
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Sem Vercel KV, retornar informação sobre storage local
    return res.status(200).json({
      success: true,
      message: 'Using client-side storage (Spark KV)',
      info: 'Backup history is maintained in browser localStorage',
      userId,
      storage: 'local',
      recommendation: 'For persistent server-side backups across devices, configure Vercel KV (Pro) or Supabase'
    });

  } catch (error) {
    console.error('History error:', error);
    return res.status(500).json({
      error: 'Failed to retrieve backup history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
