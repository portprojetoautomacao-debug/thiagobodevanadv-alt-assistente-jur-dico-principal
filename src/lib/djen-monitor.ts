/**
 * DJEN Monitor - Módulo de Orquestração
 * 
 * Cérebro do monitor DJEN com integração ao sistema de agentes IA.
 * Projetado para funcionar 100% automático com Vercel Serverless + Upstash Redis.
 * 
 * @module djen-monitor
 * @version 2.0.0
 * @since 2025-11-28
 * 
 * Funcionalidades:
 * - Consulta API pública do CNJ (numeroOab, ufOab, meio=D)
 * - Dedupe de publicações por hash no Redis
 * - Criação automática de AgentTask para análise
 * - Suporte a streaming via onAIStream callback
 * - Integração com 15 agentes tipados
 * 
 * @example
 * ```typescript
 * import { runDJENDailyMonitor, syncDJENForLawyer } from '@/lib/djen-monitor'
 * 
 * // Execução diária via cron
 * const result = await runDJENDailyMonitor()
 * 
 * // Sync manual para um advogado
 * const lawyerResult = await syncDJENForLawyer({
 *   id: 'adv-1',
 *   nome: 'Thiago Bodevan Veiga',
 *   numeroOAB: '184404',
 *   ufOAB: 'MG',
 *   ativo: true
 * })
 * ```
 */

import type { AgentTask, TaskPriority, TarefaSistemaTipo, AgentId } from '@/lib/agents'

// ============================================================================
// TYPES - DJEN API (Conforme documentação CNJ v1.0.3)
// ============================================================================

/**
 * Destinatário da comunicação DJEN
 */
export interface RawDJENRecipient {
    nome: string
    polo?: string
    comunicacao_id?: number
}

/**
 * Advogado destinatário conforme API DJEN
 */
export interface RawDJENAdvogado {
    id?: number
    nome: string
    numero_oab: string
    uf_oab: string
}

/**
 * Estrutura de destinatário advogado retornada pela API
 */
export interface RawDJENDestinatarioAdvogado {
    id: number
    comunicacao_id: number
    advogado_id: number
    advogado: RawDJENAdvogado
}

/**
 * Item de comunicação retornado pela API DJEN
 * Endpoint: GET /api/v1/comunicacao
 */
export interface RawDJENItem {
    id: number
    siglaTribunal: string
    tipoComunicacao: string
    nomeOrgao: string
    numero_processo: string
    numeroprocessocommascara?: string
    datadisponibilizacao: string
    data_disponibilizacao?: string // Alias
    dataPublicacao?: string
    texto: string
    meio: string
    meiocompleto?: string
    link: string
    hash: string
    destinatarios?: RawDJENRecipient[]
    destinatarioadvogados?: RawDJENDestinatarioAdvogado[]
}

/**
 * Resposta da API DJEN
 */
export interface RawDJENResponse {
    status?: string
    message?: string
    count?: number
    items?: RawDJENItem[]
    // API pode retornar array direto
    [index: number]: RawDJENItem
    length?: number
}

// ============================================================================
// TYPES - Internal Normalized
// ============================================================================

/**
 * Publicação normalizada para uso interno
 */
export interface NormalizedDJENPublication {
    id: string
    djenId: number
    tribunal: string
    tipoComunicacao: string
    orgao: string
    numeroProcesso: string
    dataDisponibilizacao: string
    dataPublicacao?: string
    texto: string
    meio: string
    link: string
    hash: string
    destinatarios?: RawDJENRecipient[]
    advogados?: RawDJENAdvogado[]
}

/**
 * Advogado monitorado pelo sistema
 */
export interface MonitoredLawyer {
    id: string
    nome: string
    numeroOAB: string // Apenas dígitos: "184404"
    ufOAB: string     // UF: "MG"
    email?: string
    tribunais?: string[] // Filtrar por siglaTribunal (opcional)
    ativo: boolean
}

/**
 * Resultado do monitoramento para um advogado
 */
export interface DJENMonitorResult {
    totalPublicacoes: number
    novasPublicacoes: number
    tasksCriadas: number
    porTribunal: Record<string, number>
    errors: string[]
}

/**
 * Resultado consolidado do monitoramento diário
 */
export interface DJENDailyMonitorResult {
    lawyersCount: number
    results: Record<string, DJENMonitorResult>
    totalNovas: number
    totalTasks: number
    timestamp: string
}

// ============================================================================
// REDIS KEYS
// ============================================================================

export const DJEN_REDIS_KEYS = {
    LAWYERS: 'djen:lawyers',                    // Lista de advogados monitorados
    SEEN_PREFIX: 'djen:seen:',                  // djen:seen:{hash} - dedupe
    PUB_PREFIX: 'djen:pub:',                    // djen:pub:{id} - publicação completa
    TASK_QUEUE: 'agents:queue',                 // Fila de tarefas dos agentes
    LAST_CHECK: 'djen:last-check',              // Timestamp do último check
    STATS: 'djen:stats',                        // Estatísticas acumuladas
} as const

// ============================================================================
// CONSTANTS
// ============================================================================

/** Agente responsável por análise de intimações DJEN */
const MONITOR_AGENT_ID: AgentId = 'monitor-djen'

/** Agente especialista em intimações */
const JUSTINE_AGENT_ID: AgentId = 'justine'

/** Tipo de tarefa padrão para intimações */
const DJEN_TASK_TYPE: TarefaSistemaTipo = 'ANALYZE_INTIMATION'

/** Timeout para chamadas à API DJEN (ms) */
const DJEN_TIMEOUT = 30000

/** Delay entre consultas para evitar rate limit (ms) */
const DJEN_DELAY = 2000

/** TTL para hash de dedupe (180 dias em segundos) */
const SEEN_TTL_SECONDS = 60 * 60 * 24 * 180

// ============================================================================
// REDIS CLIENT (Lazy initialization)
// ============================================================================

let _redisClient: import('@upstash/redis').Redis | null = null

async function getRedis(): Promise<import('@upstash/redis').Redis> {
    if (_redisClient) return _redisClient

    const { Redis } = await import('@upstash/redis')

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN são obrigatórios')
    }

    _redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL.trim(),
        token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    })

    return _redisClient
}

// ============================================================================
// LAWYER MANAGEMENT
// ============================================================================

/**
 * Busca lista de advogados monitorados no Redis
 */
export async function getMonitoredLawyers(): Promise<MonitoredLawyer[]> {
    try {
        const redis = await getRedis()
        const raw = await redis.get<MonitoredLawyer[] | string>(DJEN_REDIS_KEYS.LAWYERS)

        if (!raw) return []

        // Pode vir como string JSON ou objeto
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
        return (parsed as MonitoredLawyer[]).filter(l => l.ativo !== false)
    } catch (error) {
        console.error('[DJEN Monitor] Erro ao buscar advogados:', error)
        return []
    }
}

/**
 * Atualiza lista de advogados monitorados
 */
export async function setMonitoredLawyers(lawyers: MonitoredLawyer[]): Promise<void> {
    const redis = await getRedis()
    await redis.set(DJEN_REDIS_KEYS.LAWYERS, JSON.stringify(lawyers))
}

/**
 * Adiciona um advogado à lista de monitoramento
 */
export async function addMonitoredLawyer(lawyer: MonitoredLawyer): Promise<void> {
    const lawyers = await getMonitoredLawyers()
    const existingIndex = lawyers.findIndex(l => l.id === lawyer.id || l.numeroOAB === lawyer.numeroOAB)

    if (existingIndex >= 0) {
        lawyers[existingIndex] = lawyer
    } else {
        lawyers.push(lawyer)
    }

    await setMonitoredLawyers(lawyers)
}

/**
 * Remove um advogado da lista de monitoramento
 */
export async function removeMonitoredLawyer(lawyerId: string): Promise<void> {
    const lawyers = await getMonitoredLawyers()
    const filtered = lawyers.filter(l => l.id !== lawyerId)
    await setMonitoredLawyers(filtered)
}

// ============================================================================
// DJEN API CLIENT
// ============================================================================

/**
 * Consulta a API pública do CNJ DJEN para uma OAB específica
 * 
 * @param numeroOAB - Número da OAB (apenas dígitos)
 * @param ufOAB - UF da OAB (ex: "MG")
 * @param options - Opções adicionais de consulta
 */
export async function fetchDJENForOAB(
    numeroOAB: string,
    ufOAB: string,
    options: {
        dataInicio?: string // YYYY-MM-DD
        dataFim?: string    // YYYY-MM-DD
        tribunal?: string
        pagina?: number
        itensPorPagina?: number
    } = {}
): Promise<NormalizedDJENPublication[]> {
    const url = new URL('https://comunicaapi.pje.jus.br/api/v1/comunicacao')

    // Parâmetros obrigatórios
    url.searchParams.set('numeroOab', numeroOAB.replace(/\D/g, ''))
    url.searchParams.set('ufOab', ufOAB.toUpperCase())
    url.searchParams.set('meio', 'D') // Diário Eletrônico

    // Parâmetros opcionais
    if (options.dataInicio) {
        url.searchParams.set('dataDisponibilizacaoInicio', options.dataInicio)
    }
    if (options.dataFim) {
        url.searchParams.set('dataDisponibilizacaoFim', options.dataFim)
    }
    if (options.tribunal) {
        url.searchParams.set('siglaTribunal', options.tribunal)
    }
    if (options.pagina) {
        url.searchParams.set('pagina', String(options.pagina))
    }
    if (options.itensPorPagina) {
        url.searchParams.set('itensPorPagina', String(options.itensPorPagina))
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT)

    try {
        console.log(`[DJEN API] Consultando: ${url.toString()}`)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'AssistenteJuridicoP-DJEN/2.0'
            },
            signal: controller.signal,
            cache: 'no-store'
        })

        clearTimeout(timeoutId)

        // Log rate limit info
        const remaining = response.headers.get('x-ratelimit-remaining')
        if (remaining) {
            console.log(`[DJEN API] Rate limit remaining: ${remaining}`)
        }

        if (response.status === 429) {
            throw new Error('Rate limit atingido (429) - aguarde 1 minuto')
        }

        if (response.status === 422) {
            const errorBody = await response.text()
            throw new Error(`Erro negocial DJEN (422): ${errorBody}`)
        }

        if (!response.ok) {
            throw new Error(`DJEN API error ${response.status}: ${response.statusText}`)
        }

        const data = await response.json() as RawDJENResponse

        // API pode retornar array direto ou objeto com items
        const items: RawDJENItem[] = Array.isArray(data)
            ? data
            : (data.items || [])

        console.log(`[DJEN API] Retornou ${items.length} comunicações`)

        return items.map((item): NormalizedDJENPublication => ({
            id: `djen-${item.id}`,
            djenId: item.id,
            tribunal: item.siglaTribunal,
            tipoComunicacao: item.tipoComunicacao,
            orgao: item.nomeOrgao,
            numeroProcesso: item.numeroprocessocommascara || item.numero_processo,
            dataDisponibilizacao: item.datadisponibilizacao || item.data_disponibilizacao || '',
            dataPublicacao: item.dataPublicacao,
            texto: item.texto,
            meio: item.meiocompleto || item.meio,
            link: item.link,
            hash: item.hash || `${item.siglaTribunal}-${item.id}-${item.numero_processo}`,
            destinatarios: item.destinatarios,
            advogados: item.destinatarioadvogados?.map(d => d.advogado)
        }))
    } catch (error) {
        clearTimeout(timeoutId)
        console.error('[DJEN API] Erro:', error)
        throw error
    }
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Verifica se a publicação já foi vista (dedupe por hash)
 */
export async function isPublicationSeen(pubHash: string): Promise<boolean> {
    try {
        const redis = await getRedis()
        const key = `${DJEN_REDIS_KEYS.SEEN_PREFIX}${pubHash}`
        const exists = await redis.exists(key)
        return exists === 1
    } catch {
        return false
    }
}

/**
 * Marca publicação como vista
 */
export async function markPublicationAsSeen(pubHash: string): Promise<void> {
    const redis = await getRedis()
    const key = `${DJEN_REDIS_KEYS.SEEN_PREFIX}${pubHash}`
    await redis.set(key, '1', { ex: SEEN_TTL_SECONDS })
}

/**
 * Salva a publicação completa no Redis
 */
export async function savePublication(
    pub: NormalizedDJENPublication,
    lawyer: MonitoredLawyer
): Promise<void> {
    const redis = await getRedis()
    const key = `${DJEN_REDIS_KEYS.PUB_PREFIX}${pub.id}`

    await redis.set(key, JSON.stringify({
        ...pub,
        monitoredLawyer: {
            id: lawyer.id,
            nome: lawyer.nome,
            numeroOAB: lawyer.numeroOAB,
            ufOAB: lawyer.ufOAB
        },
        savedAt: new Date().toISOString()
    }))
}

/**
 * Recupera uma publicação salva
 */
export async function getPublication(pubId: string): Promise<NormalizedDJENPublication | null> {
    try {
        const redis = await getRedis()
        const key = `${DJEN_REDIS_KEYS.PUB_PREFIX}${pubId}`
        const data = await redis.get<NormalizedDJENPublication>(key)
        return data
    } catch {
        return null
    }
}

// ============================================================================
// TASK CREATION
// ============================================================================

/**
 * Cria uma AgentTask a partir de uma publicação DJEN
 * 
 * Esta tarefa será consumida pelo agente `monitor-djen` ou `justine`
 * para análise automática via IA (com suporte a streaming)
 */
export function buildDJENTaskFromPublication(
    pub: NormalizedDJENPublication,
    lawyer: MonitoredLawyer
): AgentTask {
    const now = new Date().toISOString()

    // Prioridade baseada no tipo de comunicação
    const isIntimacao = pub.tipoComunicacao.toLowerCase().includes('intima')
    const isCitacao = pub.tipoComunicacao.toLowerCase().includes('cita')

    let priority: TaskPriority = 'medium'
    if (isIntimacao || isCitacao) {
        priority = 'high'
    }

    const task: AgentTask = {
        id: `task-${pub.id}-${Date.now()}`,
        agentId: JUSTINE_AGENT_ID, // Mrs. Justin-e - especialista em intimações
        type: DJEN_TASK_TYPE,
        priority,
        status: 'queued',
        createdAt: now,
        data: {
            source: 'DJEN',
            publicationId: pub.id,
            djenId: pub.djenId,
            tribunal: pub.tribunal,
            tipoComunicacao: pub.tipoComunicacao,
            orgao: pub.orgao,
            numeroProcesso: pub.numeroProcesso,
            dataDisponibilizacao: pub.dataDisponibilizacao,
            texto: pub.texto,
            link: pub.link,
            hash: pub.hash,
            advogadoMonitorado: {
                id: lawyer.id,
                nome: lawyer.nome,
                numeroOAB: lawyer.numeroOAB,
                ufOAB: lawyer.ufOAB,
                email: lawyer.email
            },
            // Flag para indicar que suporta streaming
            supportsStreaming: true
        },
        // Campos de rastreabilidade (FASE 1)
        criadoPor: 'cron',
        processoNumero: pub.numeroProcesso
    }

    return task
}

/**
 * Enfileira uma AgentTask na fila global (Redis)
 */
export async function enqueueAgentTask(task: AgentTask): Promise<void> {
    const redis = await getRedis()

    // Usa LPUSH para fila FIFO (mais antigas primeiro quando usar RPOP)
    await redis.lpush(DJEN_REDIS_KEYS.TASK_QUEUE, JSON.stringify(task))

    console.log(`[DJEN Monitor] Task enfileirada: ${task.id} (${task.type})`)
}

/**
 * Consome uma tarefa da fila (para workers)
 */
export async function dequeueAgentTask(): Promise<AgentTask | null> {
    try {
        const redis = await getRedis()
        const raw = await redis.rpop(DJEN_REDIS_KEYS.TASK_QUEUE)

        if (!raw) return null

        return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
        return null
    }
}

/**
 * Retorna quantidade de tarefas na fila
 */
export async function getQueueLength(): Promise<number> {
    try {
        const redis = await getRedis()
        return await redis.llen(DJEN_REDIS_KEYS.TASK_QUEUE)
    } catch {
        return 0
    }
}

// ============================================================================
// SYNC PIPELINE
// ============================================================================

/**
 * Pipeline completo para UM advogado:
 * 1. Chama DJEN API
 * 2. Dedupe publicações já vistas
 * 3. Salva novas publicações
 * 4. Cria tarefas para os agentes
 */
export async function syncDJENForLawyer(
    lawyer: MonitoredLawyer,
    options: {
        dataInicio?: string
        dataFim?: string
    } = {}
): Promise<DJENMonitorResult> {
    const result: DJENMonitorResult = {
        totalPublicacoes: 0,
        novasPublicacoes: 0,
        tasksCriadas: 0,
        porTribunal: {},
        errors: []
    }

    try {
        // Buscar publicações da API
        const pubs = await fetchDJENForOAB(
            lawyer.numeroOAB,
            lawyer.ufOAB,
            {
                dataInicio: options.dataInicio,
                dataFim: options.dataFim
            }
        )

        result.totalPublicacoes = pubs.length

        for (const pub of pubs) {
            // Contagem por tribunal
            result.porTribunal[pub.tribunal] = (result.porTribunal[pub.tribunal] || 0) + 1

            // Verificar dedupe
            const alreadySeen = await isPublicationSeen(pub.hash)
            if (alreadySeen) {
                console.log(`[DJEN Monitor] Publicação já vista: ${pub.hash}`)
                continue
            }

            result.novasPublicacoes++

            // Marcar como vista
            await markPublicationAsSeen(pub.hash)

            // Salvar publicação completa
            await savePublication(pub, lawyer)

            // Criar e enfileirar tarefa para agente
            const task = buildDJENTaskFromPublication(pub, lawyer)
            await enqueueAgentTask(task)
            result.tasksCriadas++

            console.log(`[DJEN Monitor] Nova publicação processada: ${pub.tribunal} - ${pub.numeroProcesso}`)
        }

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
        result.errors.push(errorMsg)
        console.error(`[DJEN Monitor] Erro ao sincronizar ${lawyer.nome}:`, error)
    }

    return result
}

// ============================================================================
// DAILY ORCHESTRATION
// ============================================================================

/**
 * Advogado padrão quando nenhum está configurado
 */
const DEFAULT_LAWYER: MonitoredLawyer = {
    id: 'lawyer-thiago-bodevan',
    nome: 'Thiago Bodevan Veiga',
    numeroOAB: '184404',
    ufOAB: 'MG',
    email: process.env.NOTIFICATION_EMAIL || 'thiagobodevanadvocacia@gmail.com',
    tribunais: ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1', 'TRF6'],
    ativo: true
}

/**
 * Orquestra o monitoramento DJEN para TODOS os advogados cadastrados
 * 
 * Pensado para ser chamado pelo cron da Vercel:
 * `/api/cron?action=djen-monitor`
 * 
 * @returns Resultado consolidado do monitoramento
 */
export async function runDJENDailyMonitor(): Promise<DJENDailyMonitorResult> {
    const timestamp = new Date().toISOString()
    console.log(`[DJEN Monitor] Iniciando monitoramento diário em ${timestamp}`)

    // Buscar advogados monitorados
    let lawyers = await getMonitoredLawyers()

    // Se não houver advogados, usa o padrão
    if (lawyers.length === 0) {
        console.log('[DJEN Monitor] Nenhum advogado configurado, usando padrão')
        lawyers = [DEFAULT_LAWYER]
    }

    const results: Record<string, DJENMonitorResult> = {}
    let totalNovas = 0
    let totalTasks = 0

    for (const lawyer of lawyers) {
        if (!lawyer.ativo) {
            console.log(`[DJEN Monitor] Advogado desativado: ${lawyer.nome}`)
            continue
        }

        try {
            console.log(`[DJEN Monitor] Processando ${lawyer.nome} (OAB ${lawyer.ufOAB} ${lawyer.numeroOAB})`)

            const result = await syncDJENForLawyer(lawyer)
            results[lawyer.id] = result

            totalNovas += result.novasPublicacoes
            totalTasks += result.tasksCriadas

            console.log(`[DJEN Monitor] ${lawyer.nome}: ${result.novasPublicacoes} novas de ${result.totalPublicacoes} total`)

            // Delay entre advogados para evitar rate limit
            if (lawyers.indexOf(lawyer) < lawyers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, DJEN_DELAY))
            }

        } catch (error) {
            console.error(`[DJEN Monitor] Erro ao processar ${lawyer.nome}:`, error)
            results[lawyer.id] = {
                totalPublicacoes: 0,
                novasPublicacoes: 0,
                tasksCriadas: 0,
                porTribunal: {},
                errors: [error instanceof Error ? error.message : 'Erro desconhecido']
            }
        }
    }

    // Atualizar timestamp do último check
    try {
        const redis = await getRedis()
        await redis.set(DJEN_REDIS_KEYS.LAST_CHECK, timestamp)
    } catch {
        console.warn('[DJEN Monitor] Não foi possível atualizar last-check')
    }

    console.log(`[DJEN Monitor] Concluído: ${totalNovas} novas publicações, ${totalTasks} tarefas criadas`)

    return {
        lawyersCount: lawyers.length,
        results,
        totalNovas,
        totalTasks,
        timestamp
    }
}

// ============================================================================
// AI INTEGRATION (Streaming Support)
// ============================================================================

/**
 * System prompt para análise de intimações DJEN com IA
 */
export const DJEN_AI_SYSTEM_PROMPT = `Você é um assistente jurídico especializado em análise de intimações do Diário de Justiça Eletrônico Nacional (DJEN).

Sua função é analisar intimações processuais e fornecer:
1. **Resumo executivo** - O que é a intimação em linguagem simples
2. **Prazo identificado** - Se houver prazo mencionado, destacar (ex: "15 dias para contestar")
3. **Providência necessária** - O que o advogado precisa fazer
4. **Classificação de urgência** - URGENTE, ALTA, MÉDIA ou BAIXA
5. **Partes envolvidas** - Autor(es), Réu(s), Terceiros

Formate sua resposta de forma clara e estruturada. Use marcadores HTML quando apropriado (<strong>, <ul>, <li>).
Seja objetivo e direto. Destaque prazos em negrito.`

/**
 * Gera análise de uma publicação DJEN com IA
 * 
 * Pode ser chamado com streaming via callback ou síncrono
 * 
 * @param pub - Publicação normalizada do DJEN
 * @param options - Opções de execução
 */
export async function analyzePublicationWithAI(
    pub: NormalizedDJENPublication,
    options: {
        /** Callback para streaming (opcional) */
        onStream?: (chunk: string) => void
        /** Provider de IA (default: gemini) */
        provider?: 'gemini' | 'azure' | 'github'
        /** Modelo específico (default: gemini-2.5-pro) */
        model?: string
    } = {}
): Promise<string> {
    const { aiClient } = await import('@/lib/ai-providers')

    const prompt = `Analise a seguinte intimação do DJEN:

**Tribunal:** ${pub.tribunal}
**Órgão:** ${pub.orgao}
**Processo:** ${pub.numeroProcesso}
**Tipo:** ${pub.tipoComunicacao}
**Data Disponibilização:** ${pub.dataDisponibilizacao}

**Texto da Intimação:**
${pub.texto}

Forneça sua análise conforme as instruções do sistema.`

    const messages = [
        { role: 'system', content: DJEN_AI_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
    ]

    // Se tem callback de streaming, usa endpoint de streaming
    if (options.onStream) {
        // Streaming via SSE - implementar no endpoint /api/llm-stream
        const response = await fetch('/api/llm-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages,
                model: options.model || 'gemini-2.5-pro',
                temperature: 0.3,
                maxTokens: 1000
            })
        })

        if (!response.ok || !response.body) {
            throw new Error('Erro ao iniciar streaming')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6))
                        if (data.type === 'content' && data.content) {
                            fullContent += data.content
                            options.onStream(data.content)
                        }
                    } catch {
                        // Ignora linhas inválidas
                    }
                }
            }
        }

        return fullContent
    }

    // Sem streaming - chamada síncrona
    const result = await aiClient.chat(messages, {
        provider: options.provider || 'gemini',
        model: options.model || 'gemini-2.5-pro',
        maxTokens: 1000,
        temperature: 0.3
    })

    return result.content
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
    MONITOR_AGENT_ID,
    JUSTINE_AGENT_ID,
    DJEN_TASK_TYPE,
    DEFAULT_LAWYER
}
