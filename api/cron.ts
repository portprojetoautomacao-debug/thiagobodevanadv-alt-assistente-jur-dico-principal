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
import { Redis } from '@upstash/redis';

// ================= KV UTILS (INLINE) =================

interface AgentTask {
  id: string;
  title?: string;
  agentId?: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  completedAt?: string;
  result?: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

const KV_KEYS = {
  MONITORED_LAWYERS: 'monitored-lawyers',
  PUBLICATIONS: 'publications',
  AGENTS: 'autonomous-agents',
  COMPLETED_TASKS: 'completed-agent-tasks',
  LAST_DJEN_CHECK: 'last-djen-check',
  NOTIFICATION_QUEUE: 'notification-queue'
} as const;

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

interface StoredPublication {
  id: string;
  djenId?: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  matchType: 'nome' | 'oab' | 'ambos';
  lawyerId: string;
  lawyerName?: string;
  lawyerOAB?: string;
  advogados?: Array<{ nome: string; numero_oab: string; uf_oab: string }>;
  source?: string;
  notified: boolean;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  enabled: boolean;
  tasksCompleted: number;
  tasksToday: number;
  status: 'idle' | 'active' | 'paused' | 'processing' | 'waiting_human';
  lastActivity?: string;
  continuousMode: boolean;
  currentTask?: unknown;
}

let _kvClient: Redis | null = null;

async function getKv() {
  if (_kvClient) return _kvClient;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    _kvClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    });
    return _kvClient;
  }
  throw new Error('No KV storage available (Upstash Redis required)');
}

async function getMonitoredLawyers(): Promise<MonitoredLawyer[]> {
  try {
    const kv = await getKv();
    const lawyers = await kv.get(KV_KEYS.MONITORED_LAWYERS);
    return (lawyers as MonitoredLawyer[]) || [];
  } catch (error) {
    console.error('[KV] Error getting monitored lawyers:', error);
    return [];
  }
}

async function storePublication(publication: StoredPublication): Promise<void> {
  try {
    const kv = await getKv();
    const key = `${KV_KEYS.PUBLICATIONS}:${publication.lawyerId}`;
    const existing = (await kv.get(key) as StoredPublication[]) || [];
    const isDuplicate = existing.some(p => 
      p.tribunal === publication.tribunal && p.data === publication.data && p.numeroProcesso === publication.numeroProcesso
    );
    if (!isDuplicate) {
      existing.unshift(publication);
      await kv.set(key, existing.slice(0, 1000));
    }
  } catch (error) {
    console.error('[KV] Error storing publication:', error);
    throw error;
  }
}

async function updateLastDJENCheck(): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.LAST_DJEN_CHECK, new Date().toISOString());
  } catch (error) {
    console.error('[KV] Error updating last DJEN check:', error);
  }
}

async function getAgents(): Promise<Agent[]> {
  try {
    const kv = await getKv();
    const agents = await kv.get(KV_KEYS.AGENTS);
    return (agents as Agent[]) || [];
  } catch (error) {
    console.error('[KV] Error getting agents:', error);
    return [];
  }
}

async function updateAgents(agents: Agent[]): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.AGENTS, agents);
  } catch (error) {
    console.error('[KV] Error updating agents:', error);
    throw error;
  }
}

async function getCompletedTasks(): Promise<unknown[]> {
  try {
    const kv = await getKv();
    const tasks = await kv.get(KV_KEYS.COMPLETED_TASKS);
    return (tasks as unknown[]) || [];
  } catch (error) {
    console.error('[KV] Error getting completed tasks:', error);
    return [];
  }
}

async function updateCompletedTasks(tasks: unknown[]): Promise<void> {
  try {
    const kv = await getKv();
    await kv.set(KV_KEYS.COMPLETED_TASKS, tasks);
  } catch (error) {
    console.error('[KV] Error updating completed tasks:', error);
    throw error;
  }
}

async function queueNotification(notification: { type: 'publication' | 'agent' | 'system'; title: string; message: string; data?: unknown; recipientEmail?: string }): Promise<void> {
  try {
    const kv = await getKv();
    const queue = (await kv.get(KV_KEYS.NOTIFICATION_QUEUE) as Array<{ id: string; type: string; title: string; message: string; data?: unknown; recipientEmail?: string; createdAt: string; sent: boolean }>) || [];
    queue.push({ ...notification, id: crypto.randomUUID(), createdAt: new Date().toISOString(), sent: false });
    await kv.set(KV_KEYS.NOTIFICATION_QUEUE, queue);
  } catch (error) {
    console.error('[KV] Error queuing notification:', error);
  }
}

async function addTaskToQueue(task: AgentTask): Promise<void> {
  try {
    const kv = await getKv();
    const queue = (await kv.get('agent-task-queue') as AgentTask[]) || [];
    queue.push(task);
    await kv.set('agent-task-queue', queue);
  } catch (error) {
    console.error('[KV] Error adding task to queue:', error);
  }
}

// ================= DJEN CLIENT (INLINE) =================

interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  meiocompleto: string;
  hash: string;
  destinatarioadvogados: Array<{
    advogado: { id: number; nome: string; numero_oab: string; uf_oab: string };
  }>;
}

interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: 'nome' | 'oab' | 'ambos';
  advogados: Array<{ nome: string; numero_oab: string; uf_oab: string }>;
}

interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: 'E' | 'D';
}

const DJEN_TIMEOUT = 30000;
const DJEN_DELAY = 1000;

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  const value = numeroOAB.trim();
  const matchOABPattern = value.match(/OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i);
  if (matchOABPattern) return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  const matchNumericUF = value.match(/(\d+)\s*\/\s*([A-Z]{2})/i);
  if (matchNumericUF) return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  const matchNumeric = value.match(/^(\d+)$/);
  if (matchNumeric) return { numero: matchNumeric[1] };
  // Handle MG184404 format
  const matchUFNum = value.match(/^([A-Z]{2})(\d+)$/i);
  if (matchUFNum) return { uf: matchUFNum[1].toUpperCase(), numero: matchUFNum[2] };
  return {};
}

function buildDJENQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];
  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado) queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.dataDisponibilizacaoInicio) queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim) queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal) queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina) queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);
  return queryParams.join('&');
}

async function consultarComunicacoes(params: DJENQueryParams): Promise<{ response: DJENResponse | null; rateLimitInfo: { limit?: number; remaining?: number } }> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeoutId);
    const rateLimitInfo = {
      limit: response.headers.get('x-ratelimit-limit') ? parseInt(response.headers.get('x-ratelimit-limit')!) : undefined,
      remaining: response.headers.get('x-ratelimit-remaining') ? parseInt(response.headers.get('x-ratelimit-remaining')!) : undefined
    };
    if (response.status === 429) return { response: null, rateLimitInfo };
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json() as DJENResponse;
    console.log(`[DJEN] Consulta retornou ${data.count} comunicações`);
    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error:`, error);
    return { response: null, rateLimitInfo: {} };
  }
}

function formatDJENDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function consultarDJENForLawyer(tribunais: string[], nomeAdvogado?: string, numeroOAB?: string, dataInicio?: string, dataFim?: string, meio?: 'D' | 'E'): Promise<{ resultados: DJENFilteredResult[]; erros: Array<{ tribunal: string; erro: string }>; rateLimitWarning?: boolean }> {
  if (!nomeAdvogado && !numeroOAB) throw new Error('É necessário fornecer pelo menos nomeAdvogado ou numeroOAB');
  
  const defaultDate = formatDJENDate(new Date());
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio;
  
  let numeroOabNumerico: string | undefined;
  let ufOab: string | undefined;
  if (numeroOAB) {
    const parsed = parseOAB(numeroOAB);
    numeroOabNumerico = parsed.numero;
    ufOab = parsed.uf;
  }

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (const tribunal of tribunais) {
    try {
      console.log(`[DJEN] Consultando ${tribunal} para ${nomeAdvogado || numeroOAB}`);
      const queryParams: DJENQueryParams = {
        siglaTribunal: tribunal,
        dataDisponibilizacaoInicio: queryDataInicio,
        dataDisponibilizacaoFim: queryDataFim,
        itensPorPagina: 100,
        pagina: 1
      };
      if (nomeAdvogado) queryParams.nomeAdvogado = nomeAdvogado;
      if (numeroOabNumerico) queryParams.numeroOab = numeroOabNumerico;
      if (ufOab) queryParams.ufOab = ufOab;
      if (meio) queryParams.meio = meio;

      const { response, rateLimitInfo } = await consultarComunicacoes(queryParams);
      if (!response) {
        rateLimitWarning = true;
        erros.push({ tribunal, erro: 'Rate limit ou erro na consulta' });
        continue;
      }

      for (const comunicacao of response.items) {
        let matchType: 'nome' | 'oab' | 'ambos' = 'nome';
        const temAdvogado = comunicacao.destinatarioadvogados?.some(dest => {
          const matchNome = nomeAdvogado ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado)) : false;
          const matchOab = numeroOabNumerico ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab : false;
          if (matchNome && matchOab) { matchType = 'ambos'; return true; }
          if (matchOab) { matchType = 'oab'; return true; }
          if (matchNome) { matchType = 'nome'; return true; }
          return false;
        }) || false;

        if (temAdvogado) {
          resultados.push({
            id: comunicacao.id,
            tribunal: comunicacao.siglaTribunal,
            data: comunicacao.data_disponibilizacao,
            tipo: comunicacao.tipoComunicacao,
            teor: comunicacao.texto,
            numeroProcesso: comunicacao.numero_processo,
            orgao: comunicacao.nomeOrgao,
            meio: comunicacao.meiocompleto || comunicacao.meio,
            link: comunicacao.link,
            hash: comunicacao.hash,
            matchType,
            advogados: comunicacao.destinatarioadvogados?.map(dest => ({ nome: dest.advogado.nome, numero_oab: dest.advogado.numero_oab, uf_oab: dest.advogado.uf_oab })) || []
          });
        }
      }

      if (tribunais.indexOf(tribunal) < tribunais.length - 1) await new Promise(resolve => setTimeout(resolve, DJEN_DELAY));
    } catch (error) {
      erros.push({ tribunal, erro: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  }

  console.log(`[DJEN] Consulta finalizada: ${resultados.length} comunicações encontradas`);
  return { resultados, erros, rateLimitWarning: rateLimitWarning ? true : undefined };
}

// ================= CRON HANDLERS =================

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
