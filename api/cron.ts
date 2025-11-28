/**
 * API consolidada para tarefas cron
 * Endpoints:
 * - POST /api/cron?action=daily-reset - Reset diário de contadores (midnight UTC)
 * - POST /api/cron?action=djen-monitor - Monitor DJEN publicações (11 AM BRT / 14 UTC)
 * 
 * Schedule em vercel.json:
 * - daily-reset: "0 0 * * *" (midnight UTC)
 * - djen-monitor: "0 14 * * *" (14:00 UTC = 11:00 BRT - São Paulo)
 * 
 * API DJEN: https://comunicaapi.pje.jus.br/api/v1/comunicacao
 * Documentação: v1.0.3 (29/05/2025)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

// ================= KV UTILS (INLINE) =================

interface AgentTask {
  id: string;
  title?: string;
  agentId?: string;
  type: string;
  status: 'pending' | 'queued' | 'in_progress' | 'completed' | 'failed';
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
  NOTIFICATION_QUEUE: 'notification-queue',
  // Cache keys para otimização
  DJEN_CACHE: 'djen-cache',
  DJEN_CACHE_TTL: 'djen-cache-ttl',
  PUBLICATION_HASHES: 'publication-hashes'
} as const;

// Cache configuration
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 500; // Max cached publications

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

    // Check duplicate using hash for better performance
    const pubHash = publication.hash || `${publication.tribunal}-${publication.data}-${publication.numeroProcesso}`;
    const isDuplicate = existing.some(p => {
      const existingHash = p.hash || `${p.tribunal}-${p.data}-${p.numeroProcesso}`;
      return existingHash === pubHash;
    });

    if (!isDuplicate) {
      existing.unshift(publication);
      // Use pipeline for atomic operations
      await kv.set(key, existing.slice(0, 1000));

      // Update hash index for fast duplicate checking
      const hashKey = `${KV_KEYS.PUBLICATION_HASHES}:${publication.lawyerId}`;
      const hashes = (await kv.get(hashKey) as string[]) || [];
      hashes.unshift(pubHash);
      await kv.set(hashKey, hashes.slice(0, 2000));

      console.log(`[KV] Stored publication: ${pubHash}`);
    } else {
      console.log(`[KV] Skipped duplicate: ${pubHash}`);
    }
  } catch (error) {
    console.error('[KV] Error storing publication:', error);
    throw error;
  }
}

// Check if publication already exists (fast hash lookup)
async function publicationExists(lawyerId: string, hash: string): Promise<boolean> {
  try {
    const kv = await getKv();
    const hashKey = `${KV_KEYS.PUBLICATION_HASHES}:${lawyerId}`;
    const hashes = (await kv.get(hashKey) as string[]) || [];
    return hashes.includes(hash);
  } catch {
    return false;
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

// Send real-time notification via webhooks
async function sendRealTimeNotification(notification: { type: string; title: string; message: string; priority?: string; metadata?: Record<string, unknown> }): Promise<void> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    await fetch(`${baseUrl}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notification,
        priority: notification.priority || 'normal'
      })
    });
  } catch (error) {
    console.error('[Notification] Failed to send real-time notification:', error);
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
// Conforme documentação oficial DJEN API v1.0.3 (29/05/2025)

/**
 * Interface de Comunicação retornada pela API DJEN
 * Endpoint: GET /api/v1/comunicacao
 */
interface DJENComunicacao {
  id: number;
  datadisponibilizacao: string;          // Campo oficial: datadisponibilizacao
  data_disponibilizacao?: string;        // Alias para compatibilidade
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  numeroprocessocommascara?: string;     // Campo oficial com máscara CNJ
  meio: string;
  meiocompleto: string;
  link: string;
  hash: string;
  // Destinatários conforme doc oficial
  destinatarios?: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at?: string;
    updated_at?: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

/**
 * Resposta da API DJEN
 * A API pode retornar array direto ou objeto com items
 */
interface DJENResponse {
  status?: string;
  message?: string;
  count?: number;
  items?: DJENComunicacao[];
  // API pode retornar array direto em alguns casos
  [index: number]: DJENComunicacao;
  length?: number;
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
const DJEN_DELAY = 2000; // Delay entre tribunais para evitar rate limit
const DJEN_RATE_LIMIT_WAIT = 60000; // 1 minuto conforme documentação DJEN para erro 429

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

async function consultarComunicacoes(params: DJENQueryParams, retryOnRateLimit = true): Promise<{ response: DJENResponse | null; rateLimitInfo: { limit?: number; remaining?: number }; rateLimitHit?: boolean }> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    console.log(`[DJEN] Consultando: ${url}`);
    const response = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' }, signal: controller.signal });
    clearTimeout(timeoutId);

    // Captura headers de rate limit conforme documentação DJEN
    const rateLimitInfo = {
      limit: response.headers.get('x-ratelimit-limit') ? parseInt(response.headers.get('x-ratelimit-limit')!) : undefined,
      remaining: response.headers.get('x-ratelimit-remaining') ? parseInt(response.headers.get('x-ratelimit-remaining')!) : undefined
    };

    console.log(`[DJEN] Rate Limit - Limit: ${rateLimitInfo.limit}, Remaining: ${rateLimitInfo.remaining}`);

    // Erro 429 - Conforme doc: aguardar 1 minuto para retomar
    if (response.status === 429) {
      console.warn(`[DJEN] Rate limit atingido (429). Conforme documentação, aguardar 1 minuto.`);
      if (retryOnRateLimit) {
        console.log(`[DJEN] Aguardando ${DJEN_RATE_LIMIT_WAIT / 1000}s antes de retry...`);
        await new Promise(resolve => setTimeout(resolve, DJEN_RATE_LIMIT_WAIT));
        return consultarComunicacoes(params, false); // Tenta novamente sem retry
      }
      return { response: null, rateLimitInfo, rateLimitHit: true };
    }

    // Erro 422 - Erro negocial (parâmetros inválidos)
    if (response.status === 422) {
      const errorBody = await response.text();
      console.error(`[DJEN] Erro negocial (422): ${errorBody}`);
      throw new Error(`Erro negocial DJEN: ${errorBody}`);
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json() as DJENResponse;
    console.log(`[DJEN] Consulta retornou ${data.count || data.items?.length || 0} comunicações`);
    return { response: data, rateLimitInfo };
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error:`, error);
    return { response: null, rateLimitInfo: {}, rateLimitHit: false };
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

      const { response, rateLimitInfo, rateLimitHit } = await consultarComunicacoes(queryParams);

      // Log rate limit info para monitoramento
      if (rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining < 10) {
        console.warn(`[DJEN] Atenção: apenas ${rateLimitInfo.remaining} requisições restantes na janela`);
      }

      if (!response) {
        rateLimitWarning = rateLimitHit || rateLimitWarning;
        erros.push({ tribunal, erro: rateLimitHit ? 'Rate limit atingido (429) - aguarde 1 minuto' : 'Erro na consulta' });
        continue;
      }

      // API DJEN pode retornar array direto ou objeto com items
      const comunicacoes: DJENComunicacao[] = Array.isArray(response)
        ? response
        : (response.items || []);

      console.log(`[DJEN] Processando ${comunicacoes.length} comunicações do ${tribunal}`);

      for (const comunicacao of comunicacoes) {
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
          // Usa datadisponibilizacao (oficial) ou data_disponibilizacao (alias)
          const dataDisp = comunicacao.datadisponibilizacao || comunicacao.data_disponibilizacao || '';

          resultados.push({
            id: comunicacao.id,
            tribunal: comunicacao.siglaTribunal,
            data: dataDisp,
            tipo: comunicacao.tipoComunicacao,
            teor: comunicacao.texto,
            numeroProcesso: comunicacao.numeroprocessocommascara || comunicacao.numero_processo,
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
  const { action, secret } = req.query;

  // Verificar autorização cron
  // Aceita:
  // 1. Vercel Cron Jobs (header Authorization: Bearer ...)
  // 2. CRON_SECRET via query param para testes manuais
  // 3. Ambiente de desenvolvimento local
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const cronSecret = process.env.CRON_SECRET;
  const isValidSecret = cronSecret && secret === cronSecret;
  const isLocalTest = process.env.NODE_ENV === 'development';

  if (!isVercelCron && !isValidSecret && !isLocalTest) {
    return res.status(401).json({
      error: 'Unauthorized - Use Vercel Cron Jobs or provide valid secret',
      hint: 'Add ?secret=YOUR_CRON_SECRET for manual testing'
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
            // Generate hash for deduplication
            const pubHash = comunicacao.hash || `${comunicacao.tribunal}-${comunicacao.data}-${comunicacao.numeroProcesso}-${comunicacao.id}`;

            // Fast duplicate check using hash index
            const exists = await publicationExists(lawyer.id, pubHash);
            if (exists) {
              console.log(`[Cron DJEN Monitor] Skipping duplicate: ${pubHash}`);
              continue;
            }

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
              hash: pubHash,
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
              agentId: 'justine', // Mrs. Justin-e - especialista em análise de intimações
              type: 'analyze_intimation',
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

            // Send real-time notification via webhooks (Slack/Discord/Teams)
            await sendRealTimeNotification({
              type: 'new_publication',
              title: `📋 Nova Publicação DJEN - ${comunicacao.tribunal}`,
              message: `${comunicacao.tipo} encontrada para ${lawyer.name}\nProcesso: ${comunicacao.numeroProcesso || 'N/A'}\nÓrgão: ${comunicacao.orgao || 'N/A'}`,
              priority: 'high',
              metadata: {
                tribunal: comunicacao.tribunal,
                tipo: comunicacao.tipo,
                processNumber: comunicacao.numeroProcesso,
                orgao: comunicacao.orgao,
                advogado: lawyer.name,
                oab: lawyer.oab,
                link: comunicacao.link
              }
            });

            // Queue email notification
            const emailToNotify = lawyer.email || process.env.NOTIFICATION_EMAIL;
            if (emailToNotify) {
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
                recipientEmail: emailToNotify
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

      // Enviar email de relatório diário (mesmo se não encontrar publicações)
      const notificationEmail = process.env.NOTIFICATION_EMAIL;
      if (notificationEmail) {
        const dataHoje = new Date().toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/Sao_Paulo'
        });

        if (result.publicationsFound === 0) {
          // Notificar que não encontrou publicações
          await queueNotification({
            type: 'system',
            title: `📭 DJEN - Nenhuma publicação encontrada`,
            message: `Relatório diário de ${dataHoje}:\n\n` +
              `✅ Monitoramento executado com sucesso\n` +
              `👤 Advogados verificados: ${result.lawyersChecked}\n` +
              `📋 Publicações encontradas: 0\n` +
              `🏛️ Tribunais consultados: TJMG, TRT3, TST, STJ, TRF1, TRF6\n\n` +
              (result.errors.length > 0 ? `⚠️ Erros: ${result.errors.join(', ')}\n\n` : '') +
              `Próxima verificação: amanhã às 11:00 BRT`,
            recipientEmail: notificationEmail
          });
          console.log(`[Cron DJEN Monitor] Email de relatório enviado para ${notificationEmail}`);
        } else {
          // Resumo quando encontrou publicações
          await queueNotification({
            type: 'system',
            title: `📬 DJEN - ${result.publicationsFound} publicação(ões) encontrada(s)`,
            message: `Relatório diário de ${dataHoje}:\n\n` +
              `✅ Monitoramento executado com sucesso\n` +
              `👤 Advogados verificados: ${result.lawyersChecked}\n` +
              `📋 Publicações encontradas: ${result.publicationsFound}\n\n` +
              `Acesse o sistema para ver os detalhes.`,
            recipientEmail: notificationEmail
          });
          console.log(`[Cron DJEN Monitor] Email de resumo enviado para ${notificationEmail}`);
        }
      }

      return res.status(200).json({
        ok: true,
        message: 'DJEN monitor cron executed successfully',
        result
      });
    }

    // ================= PROCESS AGENT QUEUE (every 15 min) =================
    if (action === 'process-agent-queue') {
      console.log(`[Cron Agent Queue] Starting execution at ${timestamp}`);

      interface AgentQueueResult {
        success: boolean;
        timestamp: string;
        tasksProcessed: number;
        tasksFailed: number;
        errors: string[];
      }

      const result: AgentQueueResult = {
        success: true,
        timestamp,
        tasksProcessed: 0,
        tasksFailed: 0,
        errors: []
      };

      try {
        const kv = await getKv();
        const taskQueue = (await kv.get('agent-task-queue') as AgentTask[]) || [];
        const pendingTasks = taskQueue.filter(t => t.status === 'pending' || t.status === 'queued');

        console.log(`[Cron Agent Queue] Found ${pendingTasks.length} pending tasks`);

        if (pendingTasks.length === 0) {
          return res.status(200).json({
            ok: true,
            message: 'No pending tasks in queue',
            result
          });
        }

        // Process up to 10 tasks per execution
        const tasksToProcess = pendingTasks.slice(0, 10);
        const agents = await getAgents();

        for (const task of tasksToProcess) {
          try {
            const agent = agents.find(a => a.id === task.agentId);
            
            if (!agent || !agent.enabled) {
              console.log(`[Cron Agent Queue] Skipping task ${task.id} - agent not found or disabled`);
              continue;
            }

            // Update task status
            task.status = 'in_progress';
            const taskIndex = taskQueue.findIndex(t => t.id === task.id);
            if (taskIndex >= 0) {
              taskQueue[taskIndex] = task;
            }

            // Call agent processing endpoint
            const baseUrl = process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : 'http://localhost:3000';

            const agentResponse = await fetch(`${baseUrl}/api/agents?action=process-task`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ task, agent })
            });

            if (agentResponse.ok) {
              task.status = 'completed';
              task.completedAt = new Date().toISOString();
              result.tasksProcessed++;
              console.log(`[Cron Agent Queue] Task ${task.id} completed`);
            } else {
              task.status = 'failed';
              result.tasksFailed++;
              result.errors.push(`Task ${task.id} failed`);
            }

            // Update task in queue
            if (taskIndex >= 0) {
              taskQueue[taskIndex] = task;
            }

          } catch (taskError) {
            task.status = 'failed';
            result.tasksFailed++;
            result.errors.push(`Task ${task.id}: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`);
          }
        }

        // Save updated queue
        await kv.set('agent-task-queue', taskQueue);

        // Move completed tasks to completed list
        const completedTasks = taskQueue.filter(t => t.status === 'completed');
        if (completedTasks.length > 0) {
          const existingCompleted = (await kv.get(KV_KEYS.COMPLETED_TASKS) as AgentTask[]) || [];
          existingCompleted.unshift(...completedTasks);
          await kv.set(KV_KEYS.COMPLETED_TASKS, existingCompleted.slice(0, 1000));

          // Remove completed from queue
          const remainingQueue = taskQueue.filter(t => t.status !== 'completed');
          await kv.set('agent-task-queue', remainingQueue);
        }

        console.log(`[Cron Agent Queue] Completed: ${result.tasksProcessed} processed, ${result.tasksFailed} failed`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'Agent queue processing completed',
        result
      });
    }

    // ================= PROCESS NOTIFICATIONS (every 5 min) =================
    if (action === 'process-notifications') {
      console.log(`[Cron Notifications] Starting execution at ${timestamp}`);

      interface NotificationResult {
        success: boolean;
        timestamp: string;
        emailsSent: number;
        webhooksSent: number;
        errors: string[];
      }

      const result: NotificationResult = {
        success: true,
        timestamp,
        emailsSent: 0,
        webhooksSent: 0,
        errors: []
      };

      try {
        const kv = await getKv();
        const notificationQueue = (await kv.get(KV_KEYS.NOTIFICATION_QUEUE) as Array<{
          id: string;
          type: string;
          title: string;
          message: string;
          data?: unknown;
          recipientEmail?: string;
          createdAt: string;
          sent: boolean;
        }>) || [];

        const pendingNotifications = notificationQueue.filter(n => !n.sent);
        console.log(`[Cron Notifications] Found ${pendingNotifications.length} pending notifications`);

        if (pendingNotifications.length === 0) {
          return res.status(200).json({
            ok: true,
            message: 'No pending notifications',
            result
          });
        }

        // Process up to 20 notifications per execution
        const toProcess = pendingNotifications.slice(0, 20);

        for (const notification of toProcess) {
          try {
            // Send via webhook if configured
            const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
            if (webhookUrl) {
              await sendRealTimeNotification({
                type: notification.type,
                title: notification.title,
                message: notification.message,
                priority: 'normal'
              });
              result.webhooksSent++;
            }

            // Send email if Resend is configured
            const resendApiKey = process.env.RESEND_API_KEY;
            const recipientEmail = notification.recipientEmail || process.env.NOTIFICATION_EMAIL;

            if (resendApiKey && recipientEmail) {
              const emailResponse = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${resendApiKey}`
                },
                body: JSON.stringify({
                  from: process.env.EMAIL_FROM || 'Assistente Jurídico <noreply@resend.dev>',
                  to: recipientEmail,
                  subject: notification.title,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #333;">${notification.title}</h2>
                      <p style="color: #666; font-size: 16px; line-height: 1.6;">${notification.message.replace(/\n/g, '<br>')}</p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                      <p style="color: #999; font-size: 12px;">
                        Enviado automaticamente pelo Assistente Jurídico PJe<br>
                        ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </p>
                    </div>
                  `
                })
              });

              if (emailResponse.ok) {
                result.emailsSent++;
              }
            }

            // Mark as sent
            notification.sent = true;
            const idx = notificationQueue.findIndex(n => n.id === notification.id);
            if (idx >= 0) {
              notificationQueue[idx] = notification;
            }

          } catch (notifError) {
            result.errors.push(`Notification ${notification.id}: ${notifError instanceof Error ? notifError.message : 'Unknown error'}`);
          }
        }

        // Save updated queue (keep last 500)
        await kv.set(KV_KEYS.NOTIFICATION_QUEUE, notificationQueue.slice(0, 500));

        console.log(`[Cron Notifications] Completed: ${result.emailsSent} emails, ${result.webhooksSent} webhooks`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'Notification processing completed',
        result
      });
    }

    // ================= CALENDAR SYNC (every 2 hours) =================
    if (action === 'calendar-sync') {
      console.log(`[Cron Calendar Sync] Starting execution at ${timestamp}`);

      interface CalendarSyncResult {
        success: boolean;
        timestamp: string;
        eventsCreated: number;
        eventsUpdated: number;
        deadlinesSynced: number;
        errors: string[];
      }

      const result: CalendarSyncResult = {
        success: true,
        timestamp,
        eventsCreated: 0,
        eventsUpdated: 0,
        deadlinesSynced: 0,
        errors: []
      };

      try {
        const kv = await getKv();

        // Get all processes with deadlines
        const processes = (await kv.get('processes') as Array<{
          id: string;
          numeroCNJ: string;
          titulo: string;
          prazos?: Array<{
            id: string;
            descricao: string;
            dataFinal: string;
            urgente?: boolean;
            syncedToCalendar?: boolean;
            calendarEventId?: string;
          }>;
        }>) || [];

        console.log(`[Cron Calendar Sync] Found ${processes.length} processes`);

        // Get calendar sync settings
        const calendarSettings = await kv.get('calendar-settings') as {
          enabled?: boolean;
          accessToken?: string;
          refreshToken?: string;
          calendarId?: string;
        } | null;

        if (!calendarSettings?.enabled || !calendarSettings?.accessToken) {
          console.log(`[Cron Calendar Sync] Calendar sync not configured or disabled`);
          return res.status(200).json({
            ok: true,
            message: 'Calendar sync skipped - not configured',
            result
          });
        }

        // Process deadlines not yet synced
        for (const processo of processes) {
          if (!processo.prazos) continue;

          for (const prazo of processo.prazos) {
            if (prazo.syncedToCalendar) continue;

            try {
              // Create calendar event via Google Calendar API
              const eventResponse = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${calendarSettings.calendarId || 'primary'}/events`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${calendarSettings.accessToken}`
                  },
                  body: JSON.stringify({
                    summary: `⚖️ PRAZO: ${prazo.descricao}`,
                    description: `Processo: ${processo.numeroCNJ}\n${processo.titulo}\n\nPrazo cadastrado automaticamente pelo Assistente Jurídico.`,
                    start: {
                      date: prazo.dataFinal.split('T')[0],
                      timeZone: 'America/Sao_Paulo'
                    },
                    end: {
                      date: prazo.dataFinal.split('T')[0],
                      timeZone: 'America/Sao_Paulo'
                    },
                    reminders: {
                      useDefault: false,
                      overrides: [
                        { method: 'email', minutes: 1440 }, // 1 day before
                        { method: 'popup', minutes: 60 },   // 1 hour before
                        { method: 'popup', minutes: 2880 }  // 2 days before
                      ]
                    },
                    colorId: prazo.urgente ? '11' : '9' // Red for urgent, Blue for normal
                  })
                }
              );

              if (eventResponse.ok) {
                const eventData = await eventResponse.json() as { id: string };
                prazo.syncedToCalendar = true;
                prazo.calendarEventId = eventData.id;
                result.eventsCreated++;
                result.deadlinesSynced++;
              } else {
                const errorText = await eventResponse.text();
                result.errors.push(`Failed to create event for prazo ${prazo.id}: ${errorText}`);
              }

            } catch (calError) {
              result.errors.push(`Calendar error for prazo ${prazo.id}: ${calError instanceof Error ? calError.message : 'Unknown'}`);
            }
          }
        }

        // Save updated processes
        if (result.eventsCreated > 0) {
          await kv.set('processes', processes);
        }

        // Update last sync time
        await kv.set('calendar-last-sync', timestamp);

        console.log(`[Cron Calendar Sync] Completed: ${result.eventsCreated} events created`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'Calendar sync completed',
        result
      });
    }

    // ================= BACKUP (daily at 3 AM UTC) =================
    if (action === 'backup') {
      console.log(`[Cron Backup] Starting execution at ${timestamp}`);

      interface BackupResult {
        success: boolean;
        timestamp: string;
        keysBackedUp: number;
        totalSize: string;
        errors: string[];
      }

      const result: BackupResult = {
        success: true,
        timestamp,
        keysBackedUp: 0,
        totalSize: '0 KB',
        errors: []
      };

      try {
        const kv = await getKv();

        // Keys to backup
        const keysToBackup = [
          'processes',
          'publications',
          'autonomous-agents',
          'agent-task-queue',
          'completed-agent-tasks',
          'monitored-lawyers',
          'notification-queue',
          'calendar-settings',
          'user-settings'
        ];

        const backupData: Record<string, unknown> = {};
        let totalBytes = 0;

        for (const key of keysToBackup) {
          try {
            const data = await kv.get(key);
            if (data) {
              backupData[key] = data;
              result.keysBackedUp++;
              totalBytes += JSON.stringify(data).length;
            }
          } catch (keyError) {
            result.errors.push(`Failed to backup ${key}: ${keyError instanceof Error ? keyError.message : 'Unknown'}`);
          }
        }

        // Also backup lawyer-specific publications
        const lawyers = (await kv.get(KV_KEYS.MONITORED_LAWYERS) as MonitoredLawyer[]) || [];
        for (const lawyer of lawyers) {
          const pubKey = `${KV_KEYS.PUBLICATIONS}:${lawyer.id}`;
          try {
            const pubs = await kv.get(pubKey);
            if (pubs) {
              backupData[pubKey] = pubs;
              result.keysBackedUp++;
              totalBytes += JSON.stringify(pubs).length;
            }
          } catch {
            // Ignore errors for individual lawyer publications
          }
        }

        // Calculate size
        result.totalSize = totalBytes > 1024 * 1024
          ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
          : `${(totalBytes / 1024).toFixed(2)} KB`;

        // Store backup with timestamp
        const backupKey = `backup:${new Date().toISOString().split('T')[0]}`;
        await kv.set(backupKey, {
          timestamp,
          data: backupData,
          keysCount: result.keysBackedUp,
          sizeBytes: totalBytes
        });

        // Keep only last 7 backups
        const allBackupKeys: string[] = [];
        // Clean old backups (we'll keep track in a list)
        const backupList = (await kv.get('backup-list') as string[]) || [];
        backupList.unshift(backupKey);
        const keysToKeep = backupList.slice(0, 7);
        const keysToDelete = backupList.slice(7);

        for (const oldKey of keysToDelete) {
          try {
            await kv.del(oldKey);
          } catch {
            // Ignore delete errors
          }
        }

        await kv.set('backup-list', keysToKeep);

        console.log(`[Cron Backup] Completed: ${result.keysBackedUp} keys, ${result.totalSize}`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'Backup completed',
        result
      });
    }

    // ================= DATAJUD MONITOR (daily at 4 PM UTC = 1 PM BRT) =================
    if (action === 'datajud-monitor') {
      console.log(`[Cron DataJud Monitor] Starting execution at ${timestamp}`);

      interface DataJudResult {
        success: boolean;
        timestamp: string;
        processesChecked: number;
        updatesFound: number;
        errors: string[];
      }

      const result: DataJudResult = {
        success: true,
        timestamp,
        processesChecked: 0,
        updatesFound: 0,
        errors: []
      };

      try {
        const kv = await getKv();

        // Get all active processes
        const processes = (await kv.get('processes') as Array<{
          id: string;
          numeroCNJ: string;
          titulo: string;
          status: string;
          ultimaAtualizacao?: string;
          movimentos?: Array<{
            data: string;
            descricao: string;
          }>;
        }>) || [];

        const activeProcesses = processes.filter(p => p.status === 'ativo' || p.status === 'em_andamento');
        console.log(`[Cron DataJud Monitor] Found ${activeProcesses.length} active processes`);

        // DataJud API key (optional - public API has rate limits)
        const datajudApiKey = process.env.DATAJUD_API_KEY;

        for (const processo of activeProcesses.slice(0, 20)) { // Limit to 20 per execution
          try {
            result.processesChecked++;

            // Query DataJud API
            const datajudUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search`;
            const query = {
              query: {
                match: {
                  numeroProcesso: processo.numeroCNJ.replace(/\D/g, '')
                }
              },
              size: 1
            };

            const headers: Record<string, string> = {
              'Content-Type': 'application/json'
            };
            if (datajudApiKey) {
              headers['Authorization'] = `ApiKey ${datajudApiKey}`;
            }

            const response = await fetch(datajudUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(query)
            });

            if (!response.ok) {
              console.warn(`[Cron DataJud Monitor] API returned ${response.status} for ${processo.numeroCNJ}`);
              continue;
            }

            const data = await response.json() as {
              hits?: {
                hits?: Array<{
                  _source?: {
                    movimentos?: Array<{
                      dataHora: string;
                      nome: string;
                      complemento?: string;
                    }>;
                  };
                }>;
              };
            };

            const hits = data.hits?.hits || [];
            if (hits.length > 0) {
              const source = hits[0]._source;
              const movimentos = source?.movimentos || [];

              // Check for new movements
              const lastCheck = processo.ultimaAtualizacao ? new Date(processo.ultimaAtualizacao) : new Date(0);
              const newMovimentos = movimentos.filter(m => new Date(m.dataHora) > lastCheck);

              if (newMovimentos.length > 0) {
                result.updatesFound++;

                // Update process
                processo.ultimaAtualizacao = new Date().toISOString();
                processo.movimentos = [
                  ...newMovimentos.map(m => ({
                    data: m.dataHora,
                    descricao: `${m.nome}${m.complemento ? ': ' + m.complemento : ''}`
                  })),
                  ...(processo.movimentos || [])
                ].slice(0, 100);

                // Create task for analysis
                await addTaskToQueue({
                  id: crypto.randomUUID(),
                  agentId: 'analise-documental',
                  type: 'analyze_movement',
                  priority: 'medium',
                  status: 'pending',
                  createdAt: new Date().toISOString(),
                  data: {
                    processId: processo.id,
                    processCNJ: processo.numeroCNJ,
                    newMovements: newMovimentos,
                    source: 'DataJud Monitor'
                  }
                });

                // Send notification
                await sendRealTimeNotification({
                  type: 'new_movement',
                  title: `📋 Nova Movimentação - ${processo.numeroCNJ}`,
                  message: `${newMovimentos.length} nova(s) movimentação(ões) detectada(s)\n${newMovimentos[0]?.nome || ''}`,
                  priority: 'normal',
                  metadata: {
                    processCNJ: processo.numeroCNJ,
                    movementsCount: newMovimentos.length
                  }
                });
              }
            }

            // Rate limit - wait 500ms between requests
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (processError) {
            result.errors.push(`Process ${processo.numeroCNJ}: ${processError instanceof Error ? processError.message : 'Unknown'}`);
          }
        }

        // Save updated processes
        if (result.updatesFound > 0) {
          await kv.set('processes', processes);
        }

        // Update last check
        await kv.set('datajud-last-check', timestamp);

        console.log(`[Cron DataJud Monitor] Completed: ${result.processesChecked} checked, ${result.updatesFound} updates`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'DataJud monitoring completed',
        result
      });
    }

    // ================= DEADLINE ALERTS (daily at 12 PM UTC = 9 AM BRT) =================
    if (action === 'deadline-alerts') {
      console.log(`[Cron Deadline Alerts] Starting execution at ${timestamp}`);

      interface DeadlineAlertResult {
        success: boolean;
        timestamp: string;
        alertsSent: number;
        urgentDeadlines: number;
        upcomingDeadlines: number;
        errors: string[];
      }

      const result: DeadlineAlertResult = {
        success: true,
        timestamp,
        alertsSent: 0,
        urgentDeadlines: 0,
        upcomingDeadlines: 0,
        errors: []
      };

      try {
        const kv = await getKv();

        // Get all processes
        const processes = (await kv.get('processes') as Array<{
          id: string;
          numeroCNJ: string;
          titulo: string;
          prazos?: Array<{
            id: string;
            descricao: string;
            dataFinal: string;
            urgente?: boolean;
            alertSent?: boolean;
          }>;
        }>) || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const in3Days = new Date(today);
        in3Days.setDate(in3Days.getDate() + 3);

        const in7Days = new Date(today);
        in7Days.setDate(in7Days.getDate() + 7);

        const urgentDeadlines: Array<{ processo: string; prazo: string; dataFinal: string; diasRestantes: number }> = [];
        const upcomingDeadlines: Array<{ processo: string; prazo: string; dataFinal: string; diasRestantes: number }> = [];

        for (const processo of processes) {
          if (!processo.prazos) continue;

          for (const prazo of processo.prazos) {
            const deadline = new Date(prazo.dataFinal);
            deadline.setHours(0, 0, 0, 0);

            const diasRestantes = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diasRestantes < 0) continue; // Skip past deadlines

            if (diasRestantes <= 1) {
              // URGENT: Today or tomorrow
              result.urgentDeadlines++;
              urgentDeadlines.push({
                processo: processo.numeroCNJ,
                prazo: prazo.descricao,
                dataFinal: prazo.dataFinal,
                diasRestantes
              });
            } else if (diasRestantes <= 7) {
              // Upcoming: within 7 days
              result.upcomingDeadlines++;
              upcomingDeadlines.push({
                processo: processo.numeroCNJ,
                prazo: prazo.descricao,
                dataFinal: prazo.dataFinal,
                diasRestantes
              });
            }
          }
        }

        // Send urgent alerts
        if (urgentDeadlines.length > 0) {
          const urgentMessage = urgentDeadlines.map(d =>
            `🚨 ${d.processo}\n   ${d.prazo}\n   ${d.diasRestantes === 0 ? 'HOJE!' : 'AMANHÃ!'}`
          ).join('\n\n');

          await sendRealTimeNotification({
            type: 'deadline_alert',
            title: `🚨 URGENTE: ${urgentDeadlines.length} prazo(s) vencendo!`,
            message: urgentMessage,
            priority: 'urgent',
            metadata: {
              count: urgentDeadlines.length,
              deadlines: urgentDeadlines
            }
          });

          // Queue email
          const notificationEmail = process.env.NOTIFICATION_EMAIL;
          if (notificationEmail) {
            await queueNotification({
              type: 'system',
              title: `🚨 URGENTE: ${urgentDeadlines.length} prazo(s) vencendo hoje/amanhã!`,
              message: urgentMessage,
              recipientEmail: notificationEmail
            });
          }

          result.alertsSent++;
        }

        // Send daily summary if there are upcoming deadlines
        if (upcomingDeadlines.length > 0) {
          const summaryMessage = upcomingDeadlines.slice(0, 10).map(d =>
            `📅 ${d.processo}\n   ${d.prazo}\n   Em ${d.diasRestantes} dia(s)`
          ).join('\n\n');

          await sendRealTimeNotification({
            type: 'deadline_summary',
            title: `📅 Resumo: ${upcomingDeadlines.length} prazo(s) nos próximos 7 dias`,
            message: summaryMessage,
            priority: 'normal',
            metadata: {
              count: upcomingDeadlines.length
            }
          });

          result.alertsSent++;
        }

        console.log(`[Cron Deadline Alerts] Completed: ${result.urgentDeadlines} urgent, ${result.upcomingDeadlines} upcoming`);

      } catch (error) {
        result.success = false;
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      return res.status(200).json({
        ok: result.success,
        message: 'Deadline alerts completed',
        result
      });
    }

    return res.status(400).json({
      error: 'Invalid action. Use: daily-reset, djen-monitor, process-agent-queue, process-notifications, calendar-sync, backup, datajud-monitor, deadline-alerts'
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
