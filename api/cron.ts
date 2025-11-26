/**
 * API consolidada para tarefas cron
 * Endpoints:
 * - POST /api/cron?action=daily-reset - Reset diário de contadores (midnight)
 * - POST /api/cron?action=djen-monitor - Monitor DJEN publicações (9 AM UTC)
 * 
 * Schedule em vercel.json:
 * - daily-reset: "0 0 * * *" (midnight UTC)
 * - djen-monitor: "0 9 * * *" (9 AM UTC)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  getAgents, 
  updateAgents, 
  getCompletedTasks, 
  updateCompletedTasks,
  getMonitoredLawyers,
  storePublication,
  updateLastDJENCheck,
  queueNotification,
  addTaskToQueue
} from './_lib/kv-utils';
import { consultarDJENForLawyer } from './_lib/djen-client';

interface DailyResetResult {
  success: boolean;
  timestamp: string;
  agentsReset: number;
  tasksArchived: number;
  errors: string[];
}

interface DJENMonitorResult {
  success: boolean;
  timestamp: string;
  publicationsFound: number;
  lawyersChecked: number;
  tribunaisChecked: string[];
  errors: string[];
  rateLimitWarning: boolean;
}

interface CompletedTask {
  completedAt?: string | null;
  [key: string]: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  // Verificar autorização cron
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development';
  
  if (!isVercelCron && !isLocalTest) {
    return res.status(401).json({ 
      error: 'Unauthorized - This endpoint is only for Vercel Cron Jobs' 
    });
  }

  const timestamp = new Date().toISOString();

  try {
    // DAILY RESET (midnight)
    if (action === 'daily-reset') {
      console.log(`[Cron Daily Reset] Starting execution at ${timestamp}`);

      const result: DailyResetResult = {
        success: true,
        timestamp,
        agentsReset: 0,
        tasksArchived: 0,
        errors: []
      };

      // Reset agent counters
      const agents = await getAgents();
      console.log(`[Cron Daily Reset] Found ${agents.length} agents`);

      if (agents.length > 0) {
        const updatedAgents = agents.map(agent => ({
          ...agent,
          tasksToday: 0
        }));

        await updateAgents(updatedAgents);
        result.agentsReset = agents.length;
        console.log(`[Cron Daily Reset] Reset counters for ${agents.length} agents`);
      }

      // Archive old completed tasks (>30 days)
      const completedTasks = (await getCompletedTasks()) as CompletedTask[];
      console.log(`[Cron Daily Reset] Found ${completedTasks.length} completed tasks`);
      
      if (completedTasks.length > 0) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        
        const tasksToKeep = completedTasks.filter((task) => {
          if (!task.completedAt) return true;
          return new Date(task.completedAt) >= cutoffDate;
        });
      
        result.tasksArchived = completedTasks.length - tasksToKeep.length;
      
        if (result.tasksArchived > 0) {
          await updateCompletedTasks(tasksToKeep);
          console.log(`[Cron Daily Reset] Archived ${result.tasksArchived} old tasks`);
        }
      }

      console.log(`[Cron Daily Reset] Completed successfully`);

      return res.status(200).json({
        ok: true,
        message: 'Daily reset cron executed successfully',
        result
      });
    }

    // DJEN MONITOR (9 AM UTC)
    if (action === 'djen-monitor') {
      console.log(`[Cron DJEN Monitor] Starting execution at ${timestamp}`);

      const defaultTribunais = process.env.DJEN_TRIBUNAIS?.split(',') || [
        'TJMG', 'TRT3', 'TST', 'STJ', 'TRF1' // Tribunais do advogado Thiago Bodevan
      ];

      // Advogado padrão fixo - Thiago Bodevan Veiga
      const defaultLawyer = {
        id: 'lawyer-thiago-bodevan',
        name: 'Thiago Bodevan Veiga',
        oab: 'MG184404',
        email: 'thiagobodevanadvocacia@gmail.com',
        enabled: true,
        tribunals: ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1']
      };

      const result: DJENMonitorResult = {
        success: true,
        timestamp,
        publicationsFound: 0,
        lawyersChecked: 0,
        tribunaisChecked: defaultTribunais,
        errors: [],
        rateLimitWarning: false
      };

      // Get monitored lawyers ou usa o padrão
      let lawyers = await getMonitoredLawyers();
      console.log(`[Cron DJEN Monitor] Found ${lawyers.length} monitored lawyers`);

      // Se não houver advogados configurados, usa o advogado padrão
      if (lawyers.length === 0) {
        console.log(`[Cron DJEN Monitor] Using default lawyer: ${defaultLawyer.name}`);
        lawyers = [defaultLawyer];
      }

      // Query DJEN for each enabled lawyer
      for (const lawyer of lawyers) {
        if (!lawyer.enabled) {
          console.log(`[Cron DJEN Monitor] Skipping disabled lawyer: ${lawyer.name}`);
          continue;
        }

        result.lawyersChecked++;
        const tribunais = lawyer.tribunals && lawyer.tribunals.length > 0 
          ? lawyer.tribunals 
          : defaultTribunais;

        try {
          console.log(`[Cron DJEN Monitor] Checking ${lawyer.name} (${lawyer.oab}) in ${tribunais.length} tribunais`);
          
          // Consultar DJEN usando API /api/v1/comunicacao (endpoint oficial)
          const { resultados, erros, rateLimitWarning } = await consultarDJENForLawyer(
            tribunais,
            lawyer.name,
            lawyer.oab,
            undefined, // dataInicio (padrão: hoje)
            undefined, // dataFim (padrão: dataInicio)
            'D' // Diário Eletrônico
          );

          if (rateLimitWarning) {
            result.rateLimitWarning = true;
            console.warn(`[Cron DJEN Monitor] Rate limit warning for ${lawyer.name}`);
          }

          console.log(`[Cron DJEN Monitor] Found ${resultados.length} communications for ${lawyer.name}`);

          // Store publications
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

            // Create analysis task for the new publication
            await addTaskToQueue({
              id: crypto.randomUUID(),
              agentId: 'doc-analyzer', // ID do agente de análise
              type: 'analyze_document',
              priority: 'high',
              status: 'pending',
              createdAt: new Date().toISOString(),
              data: {
                publicationId: storedPub.id,
                text: storedPub.teor,
                processNumber: storedPub.numeroProcesso,
                tribunal: storedPub.tribunal,
                type: storedPub.tipo,
                source: 'DJEN Monitor'
              }
            });

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
                recipientEmail: lawyer.email
              });
            }
          }

          // Log errors
          for (const erro of erros) {
            const errorMsg = `DJEN ${erro.tribunal}: ${erro.erro}`;
            result.errors.push(errorMsg);
            console.warn(`[Cron DJEN Monitor] ${errorMsg}`);
          }

        } catch (error) {
          const errorMsg = `Error checking ${lawyer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error(`[Cron DJEN Monitor] ${errorMsg}`);
        }
      }

      // Update last check timestamp
      await updateLastDJENCheck();

      console.log(`[Cron DJEN Monitor] Completed: ${result.publicationsFound} communications found`);

      if (result.rateLimitWarning) {
        result.errors.push('ATENÇÃO: Rate limit da API DJEN atingido. Algumas consultas foram adiadas.');
      }

      return res.status(200).json({
        ok: true,
        message: 'DJEN monitor cron executed successfully',
        result
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action. Use: daily-reset or djen-monitor' 
    });

  } catch (error) {
    console.error('[Cron API] Fatal error:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }
}
