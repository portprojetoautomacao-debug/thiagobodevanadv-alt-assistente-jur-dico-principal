/**
 * Vercel Cron Job - DJEN Publication Monitor
 * This endpoint runs periodically to check for new legal publications
 * 
 * Schedule: Daily at 9 AM (Hobby plan limit)
 * Path: /api/cron/djen-monitor
 * 
 * This cron job will:
 * 1. Query DJEN API (Comunica PJe) for new publications in official gazette
 * 2. Optionally query DataJud API for process metadata
 * 3. Filter publications relevant to tracked lawyers
 * 4. Store new publications in Spark KV
 * 5. Generate notifications for users
 * 
 * IMPORTANTE:
 * - DJEN API: https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/html
 * - DataJud API: https://api-publica.datajud.cnj.jus.br/{alias}/_search
 * - São APIs diferentes com propósitos diferentes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMonitoredLawyers, storePublication, updateLastDJENCheck, queueNotification } from '../../lib/api/kv-utils';
import { consultarDJENForLawyer } from '../../lib/api/djen-client';
import { consultarDataJudForLawyer } from '../../lib/api/datajud-client';

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
        
        // 1. Consultar DJEN (publicações do diário oficial)
        const { resultados: pubsDJEN, erros: errosDJEN } = await consultarDJENForLawyer(
          tribunais,
          lawyer.name,
          lawyer.oab
        );

        console.log(`[DJEN Monitor Cron] Found ${pubsDJEN.length} DJEN publications for ${lawyer.name}`);

        // Store DJEN publications
        for (const pub of pubsDJEN) {
          const storedPub = {
            id: crypto.randomUUID(),
            ...pub,
            lawyerId: lawyer.id,
            source: 'DJEN',
            notified: false,
            createdAt: timestamp
          };

          await storePublication(storedPub);
          result.publicationsFound++;

          // Queue notification
          if (lawyer.email) {
            await queueNotification({
              type: 'publication',
              title: `Nova publicação DJEN - ${pub.tribunal}`,
              message: `Publicação encontrada para ${lawyer.name} no tribunal ${pub.tribunal}`,
              data: storedPub,
              recipientEmail: lawyer.email
            });
          }
        }

        // 2. Opcionalmente consultar DataJud (metadados processuais)
        // Descomente se quiser buscar também processos novos no DataJud
        /*
        const { resultados: processosDataJud, erros: errosDataJud } = await consultarDataJudForLawyer(
          tribunais,
          lawyer.name,
          lawyer.oab
        );

        console.log(`[DJEN Monitor Cron] Found ${processosDataJud.length} DataJud processes for ${lawyer.name}`);

        for (const processo of processosDataJud) {
          // Armazenar metadados do processo
          await storePublication({
            id: crypto.randomUUID(),
            tribunal: processo.tribunal,
            numeroProcesso: processo.numeroProcesso,
            data: processo.dataAjuizamento,
            tipo: processo.classe?.nome || 'Processo',
            teor: `Processo ${processo.numeroProcesso} - ${processo.classe?.nome || ''}`,
            lawyerId: lawyer.id,
            source: 'DataJud',
            notified: false,
            createdAt: timestamp
          });
        }
        
        errosDataJud.forEach(erro => {
          result.errors.push(`DataJud ${erro.tribunal}: ${erro.erro}`);
        });
        */

        // Log errors
        for (const erro of errosDJEN) {
          const errorMsg = `DJEN ${erro.tribunal}: ${erro.erro}`;
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
