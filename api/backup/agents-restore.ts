import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * API para restaurar dados dos agentes IA
 * 
 * NOTA: Esta versão usa Spark KV (localStorage) como primary storage
 * Para backup em servidor, considere Vercel KV (Pro) ou Supabase
 */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas GET para restaurar
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Sem Vercel KV disponível, retornar informação
    return res.status(200).json({
      success: true,
      message: 'Using client-side storage (Spark KV)',
      info: 'Backups are stored locally in the browser. For server-side backup, configure Vercel KV (Pro plan) or Supabase.',
      userId,
      recommendation: 'Data persists in browser localStorage. Clear browser data will reset agents.'
    });

  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({
      error: 'Failed to restore backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
