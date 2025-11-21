/**
 * Vercel Cron Job - DJEN Publication Monitor
 * This endpoint runs periodically to check for new legal publications
 * 
 * Schedule: Daily at 9 AM UTC (Hobby plan limit)
 * Path: /api/cron/djen-monitor
 * 
 * This cron job will:
 * 1. Query DJEN API (Comunica PJe) using /api/v1/comunicacao endpoint
 * 2. Filter publications relevant to tracked lawyers (by name and OAB)
 * 3. Store new publications in Spark KV
 * 4. Generate notifications for users
 * 5. Respect rate limiting (x-ratelimit headers)
 * 
 * IMPORTANTE:
 * - DJEN API: https://comunicaapi.pje.jus.br/api/v1/comunicacao (consultas)
 * - DJEN Caderno: https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/{meio} (downloads)
 * - DataJud API: https://api-publica.datajud.cnj.jus.br/{alias}/_search (metadados processuais)
 * - São APIs diferentes com propósitos diferentes
 * 
 * Rate Limiting:
 * - Monitora headers x-ratelimit-limit e x-ratelimit-remaining
 * - Em caso de erro 429, aguarda 1 minuto antes de retomar
 * - Respeita delay de 1 segundo entre tribunais
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMonitoredLawyers, storePublication, updateLastDJENCheck, queueNotification } from '../../lib/api/kv-utils';
import { consultarDJENForLawyer } from '../../lib/api/djen-client';

interface DJENMonitorResult {
  success: boolean;
  timestamp: string;
  publicationsFound: number;
  lawyersChecked: number;
  tribunaisChecked: string[];
  errors: string[];
  rateLimitWarning: boolean;
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
      'TJMG', 'TRT3', 'TST', 'STJ', 'TRF1' // Tribunais do advogado Thiago Bodevan
    ];

    const result: DJENMonitorResult = {
      success: true,
      timestamp,
      publicationsFound: 0,
      lawyersChecked: 0,
      tribunaisChecked: defaultTribunais,
      errors: [],
      rateLimitWarning: false
    };

    // Get monitored lawyers from Spark KV
    const lawyers = await getMonitoredLawyers();
    console.log(`[DJEN Monitor Cron] Found ${lawyers.length} monitored lawyers`);

    if (lawyers.length === 0) {
      console.log(`[DJEN Monitor Cron] No monitored lawyers configured.`);
      return res.status(200).json({
        ok: true,
        message: 'DJEN monitor executed - no lawyers configured',
        result,
        note: 'Use o script INICIALIZAR_AGENTES_BROWSER.js para configurar advogados monitorados'
      });
    }

    // Query DJEN for each enabled lawyer
    for (const lawyer of lawyers) {
      if (!lawyer.enabled) {
        console.log(`[DJEN Monitor Cron] Skipping disabled lawyer: ${lawyer.name}`);
        continue;
      }

      result.lawyersChecked++;
      const tribunais = lawyer.tribunals && lawyer.tribunals.length > 0 
        ? lawyer.tribunals 
        : defaultTribunais;

      try {
        console.log(`[DJEN Monitor Cron] Checking DJEN for ${lawyer.name} (${lawyer.oab}) in ${tribunais.length} tribunais`);
        
        // Consultar DJEN usando API /api/v1/comunicacao (endpoint correto)
        const { resultados, erros, rateLimitWarning } = await consultarDJENForLawyer(
          tribunais,
          lawyer.name,
          lawyer.oab,
          undefined, // dataInicio (padrão: hoje)
          undefined, // dataFim (padrão: dataInicio)
          'D' // Diário Eletrônico (não Edital)
        );

        if (rateLimitWarning) {
          result.rateLimitWarning = true;
          console.warn(`[DJEN Monitor Cron] Rate limit warning for ${lawyer.name}`);
        }

        console.log(`[DJEN Monitor Cron] Found ${resultados.length} communications for ${lawyer.name}`);

        // Store DJEN publications
        for (const comunicacao of resultados) {
          const storedPub = {
            id: crypto.randomUUID(),
            djenId: comunicacao.id,
            tribunal: comunicacao.tribunal,
            data: comunicacao.data,
            tipo: comunicacao.tipo,
            teor: comunicacao.teor,
            numeroProcesso: comunicacao.numeroProcesso,
            orgao: comunicacao.orgao,
            meio: comunicacao.meio,
            link: comunicacao.link,
            hash: comunicacao.hash,
            lawyerId: lawyer.id,
            lawyerName: lawyer.name,
            lawyerOAB: lawyer.oab,
            matchType: comunicacao.matchType,
            advogados: comunicacao.advogados,
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
              title: `Nova Comunicação DJEN - ${comunicacao.tribunal}`,
              message: `${comunicacao.tipo} encontrada no processo ${comunicacao.numeroProcesso || 'N/A'}`,
              data: {
                tribunal: comunicacao.tribunal,
                tipo: comunicacao.tipo,
                processo: comunicacao.numeroProcesso,
                orgao: comunicacao.orgao,
                link: comunicacao.link,
                advogado: lawyer.name,
                oab: lawyer.oab
              },
              recipientEmail: lawyer.email,
              priority: 'high'
            });
          }
        }

        // Log errors from DJEN API
        for (const erro of erros) {
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

    console.log(`[DJEN Monitor Cron] Completed: ${result.publicationsFound} communications found`);

    // Add warning if rate limit was hit
    if (result.rateLimitWarning) {
      result.errors.push('ATENÇÃO: Rate limit da API DJEN foi atingido durante a execução. Algumas consultas podem ter sido adiadas.');
    }

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
