/**
 * Vercel Cron Job - DJEN Publication Monitor
 * This endpoint runs periodically to check for new legal publications
 * 
 * Schedule: Every 2 hours during business hours (8 AM - 8 PM)
 * Path: /api/cron/djen-monitor
 * 
 * This cron job will:
 * 1. Query DJEN/DataJud APIs for new publications
 * 2. Filter publications relevant to tracked lawyers/processes
 * 3. Store new publications in Vercel KV
 * 4. Generate notifications for users
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMonitoredLawyers, storePublication, updateLastDJENCheck, queueNotification } from '../lib/kv-utils';
import { consultarDJENForLawyer } from '../lib/djen-client';

interface DJENMonitorResult {
  success: boolean;
  timestamp: string;
  publicationsFound: number;
  lawyersChecked: number;
  tribunaisChecked: string[];
  errors: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development';
  
  if (!isVercelCron && !isLocalTest) {
    return res.status(401).json({ 
      error: 'Unauthorized - This endpoint is only for Vercel Cron Jobs' 
    });
  }

  const timestamp = new Date().toISOString();
  console.log(`[DJEN Monitor Cron] Starting execution at ${timestamp}`);

  try {
    // Default tribunals to monitor
    const defaultTribunais = process.env.DJEN_TRIBUNAIS?.split(',') || [
      'TST', 'TRT3', 'TJMG', 'TRF1', 'TJES', 'TJSP', 'STJ'
    ];

    const result: DJENMonitorResult = {
      success: true,
      timestamp,
      publicationsFound: 0,
      lawyersChecked: 0,
      tribunaisChecked: defaultTribunais,
      errors: []
    };

    // Get monitored lawyers from Vercel KV
    const lawyers = await getMonitoredLawyers();
    console.log(`[DJEN Monitor Cron] Found ${lawyers.length} monitored lawyers`);

    if (lawyers.length === 0) {
      console.log(`[DJEN Monitor Cron] No monitored lawyers configured. Use Vercel KV to add lawyers.`);
      return res.status(200).json({
        ok: true,
        message: 'DJEN monitor executed - no lawyers configured',
        result,
        note: 'Configure monitored lawyers in Vercel KV with key "monitored-lawyers"'
      });
    }

    // Query DJEN for each enabled lawyer
    for (const lawyer of lawyers) {
      if (!lawyer.enabled) {
        console.log(`[DJEN Monitor Cron] Skipping disabled lawyer: ${lawyer.name}`);
        continue;
      }

      result.lawyersChecked++;
      const tribunais = lawyer.tribunals.length > 0 ? lawyer.tribunals : defaultTribunais;

      try {
        console.log(`[DJEN Monitor Cron] Checking publications for ${lawyer.name} (${lawyer.oab})`);
        
        const { resultados, erros } = await consultarDJENForLawyer(
          tribunais,
          lawyer.name,
          lawyer.oab
        );

        console.log(`[DJEN Monitor Cron] Found ${resultados.length} publications for ${lawyer.name}`);

        // Store each publication
        for (const pub of resultados) {
          const storedPub = {
            id: crypto.randomUUID(),
            ...pub,
            lawyerId: lawyer.id,
            notified: false,
            createdAt: timestamp
          };

          await storePublication(storedPub);
          result.publicationsFound++;

          // Queue notification
          if (lawyer.email) {
            await queueNotification({
              type: 'publication',
              title: `Nova publicação - ${pub.tribunal}`,
              message: `Publicação encontrada para ${lawyer.name} no tribunal ${pub.tribunal}`,
              data: storedPub,
              recipientEmail: lawyer.email
            });
          }
        }

        // Log errors
        for (const erro of erros) {
          const errorMsg = `${erro.tribunal}: ${erro.erro}`;
          result.errors.push(errorMsg);
          console.warn(`[DJEN Monitor Cron] ${errorMsg}`);
        }

      } catch (error) {
        const errorMsg = `Error checking ${lawyer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`[DJEN Monitor Cron] ${errorMsg}`);
      }
    }

    // Update last check timestamp
    await updateLastDJENCheck();

    console.log(`[DJEN Monitor Cron] Completed: ${result.publicationsFound} publications found`);

    return res.status(200).json({
      ok: true,
      message: 'DJEN monitor cron executed successfully',
      result
    });

  } catch (error) {
    console.error('[DJEN Monitor Cron] Fatal error:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }
}
