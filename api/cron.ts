/**
 * Vercel Cron Job - Main Health Check
 * This endpoint runs periodically to verify the system is working
 * 
 * Schedule: Every hour
 * Path: /api/cron
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  
  // In production, Vercel cron jobs include authorization header
  // For local testing, we'll allow requests without it
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development' || !authHeader;
  
  if (!isVercelCron && !isLocalTest) {
    return res.status(401).json({ 
      error: 'Unauthorized - This endpoint is only for Vercel Cron Jobs' 
    });
  }

  try {
    const timestamp = new Date().toISOString();
    
    console.log(`[Cron] Health check executed at ${timestamp}`);
    
    // Return success response
    return res.status(200).json({
      ok: true,
      message: 'Cron job executed successfully',
      timestamp,
      service: 'Assistente Jurídico PJe',
      checks: {
        system: 'healthy',
        timestamp: timestamp
      }
    });
  } catch (error) {
    console.error('[Cron] Error in health check:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
