/**
 * API consolidada para processamento de agentes IA
 * Endpoints:
 * - POST /api/agents?action=process-queue - Processa fila de tarefas (cron)
 * - POST /api/agents?action=process-task - Processa tarefa individual
 *
 * Usa Google Gemini para processamento com IA
 * ✨ Refatorado com Enums, validação e tratamento de erros robusto
 */

import { Redis } from '@upstash/redis'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { agentMonitor } from '../src/lib/agent-monitoring.js'
import { AnalyzeIntimationInputSchema, DraftPetitionInputSchema } from '../src/lib/agent-schemas.js'
import { legalMemory, type LegalContextType } from '../src/lib/legal-memory.js'

// ===== Redis singleton (Upstash) =====

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

let _redisClient: Redis | null = null

function getRedisOrNull(): Redis | null {
  if (!redisUrl || !redisToken) return null
  if (!_redisClient) {
    _redisClient = new Redis({
      url: redisUrl,
      token: redisToken
    })
  }
  return _redisClient
}

// ✨ ENUMS para melhor type safety
export enum AgentTaskType {
  ANALYZE_DOCUMENT = 'analyze_document',
  ANALYZE_INTIMATION = 'analyze_intimation',
  MONITOR_DJEN = 'monitor_djen',
  CALCULATE_DEADLINE = 'calculate_deadline',
  DRAFT_PETITION = 'draft_petition',
  CHECK_DATAJUD = 'check_datajud',
  ORGANIZE_FILES = 'organize_files',
  RESEARCH_PRECEDENTS = 'research_precedents',
  RISK_ANALYSIS = 'risk_analysis',
  CONTRACT_REVIEW = 'contract_review',
  CLIENT_COMMUNICATION = 'client_communication',
  BILLING_ANALYSIS = 'billing_analysis',
  CASE_STRATEGY = 'case_strategy',
  LEGAL_TRANSLATION = 'legal_translation',
  COMPLIANCE_CHECK = 'compliance_check'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum TaskStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  HUMAN_INTERVENTION = 'human_intervention'
}

export enum AgentType {
  ANALYZER = 'analyzer',
  INTIMATION_ANALYZER = 'intimation-analyzer',
  MONITOR = 'monitor',
  CALCULATOR = 'calculator',
  WRITER = 'writer',
  ORGANIZER = 'organizer',
  RESEARCHER = 'researcher',
  STRATEGIC = 'strategic',
  COMPLIANCE = 'compliance',
  TRANSLATOR = 'translator',
  COMMUNICATOR = 'communicator'
}

export enum AgentStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  PROCESSING = 'processing',
  PAUSED = 'paused',
  WAITING_HUMAN = 'waiting_human'
}

// ✨ Interface melhorada com validações
interface AgentTask {
  id: string
  agentId: string
  type: AgentTaskType
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
  retryCount?: number
  maxRetries?: number
  timeout?: number
}

interface TaskResult extends Record<string, unknown> {
  suggestedActions?: string[]
  draft?: string
  tokensUsed?: number
  processingTimeMs?: number
  processedAt?: string
  agentId?: string
  taskType?: AgentTaskType
}

interface Agent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  enabled: boolean
}

// ✨ Validadores de tipo seguro
function validateAgentTask(task: unknown): task is AgentTask {
  if (!task || typeof task !== 'object') return false
  const t = task as Record<string, unknown>

  return !!(
    typeof t.id === 'string' &&
    typeof t.agentId === 'string' &&
    Object.values(AgentTaskType).includes(t.type as AgentTaskType) &&
    Object.values(TaskPriority).includes(t.priority as TaskPriority) &&
    Object.values(TaskStatus).includes(t.status as TaskStatus) &&
    typeof t.createdAt === 'string' &&
    typeof t.data === 'object' &&
    t.data !== null
  )
}

function validateAgent(agent: unknown): agent is Agent {
  if (!agent || typeof agent !== 'object') return false
  const a = agent as Record<string, unknown>

  return !!(
    typeof a.id === 'string' &&
    typeof a.name === 'string' &&
    Object.values(AgentType).includes(a.type as AgentType) &&
    Object.values(AgentStatus).includes(a.status as AgentStatus) &&
    typeof a.enabled === 'boolean'
  )
}

// ✨ Logger estruturado
const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      console.log(`[Agents] ${message}`, JSON.stringify(context))
    } else {
      console.log(`[Agents] ${message}`)
    }
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(`[Agents] ERROR: ${message}`, {
      error: error instanceof Error ? error.message : String(error),
      ...(context || {})
    })
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (context) {
      console.warn(`[Agents] WARNING: ${message}`, JSON.stringify(context))
    } else {
      console.warn(`[Agents] WARNING: ${message}`)
    }
  }
}

// ✨ Task mapping para reduzir Cognitive Complexity (SonarCloud S3776)
interface TaskMapping {
  keywords: string[]
  agentId: string
  type: AgentTaskType
  priority: TaskPriority
}

const TASK_MAPPINGS: TaskMapping[] = [
  {
    keywords: ['prazo', 'deadline'],
    agentId: 'deadline-tracker',
    type: AgentTaskType.CALCULATE_DEADLINE,
    priority: TaskPriority.HIGH
  },
  {
    keywords: ['petição', 'peticao', 'defesa', 'recurso', 'manifestação', 'manifestacao'],
    agentId: 'petition-writer',
    type: AgentTaskType.DRAFT_PETITION,
    priority: TaskPriority.MEDIUM
  },
  {
    keywords: ['pesquisa', 'jurisprudência', 'jurisprudencia'],
    agentId: 'precedent-researcher',
    type: AgentTaskType.RESEARCH_PRECEDENTS,
    priority: TaskPriority.LOW
  },
  {
    keywords: ['avisar', 'comunicar', 'informar', 'cliente'],
    agentId: 'client-communicator',
    type: AgentTaskType.CLIENT_COMMUNICATION,
    priority: TaskPriority.MEDIUM
  },
  {
    keywords: ['datajud', 'andamento', 'autos', 'movimentação', 'movimentacao'],
    agentId: 'datajud-query',
    type: AgentTaskType.CHECK_DATAJUD,
    priority: TaskPriority.MEDIUM
  },
  {
    keywords: ['sentença', 'sentenca', 'decisão', 'decisao', 'acórdão', 'acordao', 'risco'],
    agentId: 'risk-analyst',
    type: AgentTaskType.RISK_ANALYSIS,
    priority: TaskPriority.HIGH
  },
  {
    keywords: ['custas', 'honorários', 'honorarios', 'depósito', 'deposito', 'guia', 'pagamento'],
    agentId: 'billing-analyst',
    type: AgentTaskType.BILLING_ANALYSIS,
    priority: TaskPriority.HIGH
  },
  {
    keywords: ['arquivar', 'salvar', 'pasta', 'organizar'],
    agentId: 'document-organizer',
    type: AgentTaskType.ORGANIZE_FILES,
    priority: TaskPriority.LOW
  },
  {
    keywords: ['lgpd', 'sigilo', 'segredo', 'ética', 'etica', 'compliance'],
    agentId: 'compliance-officer',
    type: AgentTaskType.COMPLIANCE_CHECK,
    priority: TaskPriority.HIGH
  },
  {
    keywords: ['explicar', 'simplificar', 'traduzir', 'leigo'],
    agentId: 'legal-translator',
    type: AgentTaskType.LEGAL_TRANSLATION,
    priority: TaskPriority.MEDIUM
  },
  {
    keywords: ['contrato', 'minuta', 'aditivo', 'cláusula', 'clausula', 'rescisão', 'rescissao'],
    agentId: 'contract-reviewer',
    type: AgentTaskType.CONTRACT_REVIEW,
    priority: TaskPriority.HIGH
  },
  {
    keywords: ['estratégia', 'estrategia', 'plano', 'probabilidade', 'tese', 'linha de defesa'],
    agentId: 'case-strategist',
    type: AgentTaskType.CASE_STRATEGY,
    priority: TaskPriority.HIGH
  }
]

/**
 * Encontra mapeamento de tarefa com base no texto da ação
 */
function findTaskMapping(actionStr: string): TaskMapping | null {
  const lowerAction = actionStr.toLowerCase()
  return TASK_MAPPINGS.find(mapping =>
    mapping.keywords.some(keyword => lowerAction.includes(keyword))
  ) || null
}

/**
 * Cria tarefa encadeada a partir do texto da ação e dados da tarefa origem
 */
function createChainedTask(
  actionText: string,
  sourceTask: AgentTask,
  mapping: TaskMapping
): AgentTask {
  return {
    id: randomUUID(),
    agentId: mapping.agentId,
    type: mapping.type,
    priority: mapping.priority,
    status: TaskStatus.QUEUED,
    createdAt: new Date().toISOString(),
    data: {
      ...sourceTask.data,
      instruction: actionText,
      sourceTask: sourceTask.id
    }
  }
}

// ✨ Cache de prompts com enum keys
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.ANALYZER]: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

  [AgentType.INTIMATION_ANALYZER]: `Você é a Mrs. Justin-e, uma especialista em análise de intimações judiciais do PJe e DJEN.
Sua função é:
1. Identificar o tipo de intimação (citação, notificação, sentença, despacho, decisão)
2. Extrair prazos e datas importantes
3. Identificar as providências necessárias
4. Classificar a urgência (baixa, média, alta, crítica)
5. Sugerir próximos passos práticos

Sempre retorne JSON estruturado com: summary, deadline (days, type, endDate), priority, nextSteps (array), suggestedAction.`,

  [AgentType.MONITOR]: `Você é um agente de monitoramento de publicações jurídicas especializado em DJEN e DataJud.
Analise intimações, extraia dados do processo, identifique prazos e classifique a urgência.
Retorne sempre em JSON com campos: processo, tipo, prazo, urgência.`,

  [AgentType.CALCULATOR]: `Você é um especialista em cálculo de prazos processuais segundo o CPC/2015.
Considere: dias úteis, feriados nacionais e estaduais, suspensões de prazos, recesso forense.
Retorne JSON com: deadline (ISO date), businessDays, reasoning (array).`,

  [AgentType.WRITER]: `Você é um redator jurídico sênior especializado em peças processuais.
Redija petições, manifestações e documentos jurídicos com linguagem técnica, formal e persuasiva.
Siga normas ABNT, formatação padrão, e fundamente juridicamente.`,

  [AgentType.RESEARCHER]: `Você é um pesquisador jurídico especializado em jurisprudência e doutrina.
Busque precedentes, analise tendências jurisprudenciais, identifique teses vencedoras.
Retorne JSON com: precedentsFound, relevantCases, thematicAnalysis.`,

  [AgentType.STRATEGIC]: `Você é um estrategista jurídico com visão de negócios.
Analise casos sob perspectiva estratégica, identifique riscos, oportunidades e probabilidades de sucesso.
Retorne JSON com: riskLevel, successProbability, recommendations.`,

  [AgentType.ORGANIZER]: `Você é um especialista em organização e gestão de documentos jurídicos.
Classifique documentos por tipo, processo, data e relevância.
Retorne JSON com: categories, filesOrganized, indexingStrategy.`,

  [AgentType.COMPLIANCE]: `Você é um especialista em compliance jurídico e regulatório.
Verifique conformidade com LGPD, Código de Ética OAB, legislação trabalhista e civil.
Retorne JSON com: complianceStatus, violations, recommendations.`,

  [AgentType.TRANSLATOR]: `Você é um especialista em tradução de jargão jurídico para linguagem acessível.
Simplifique termos técnicos mantendo precisão jurídica.
Retorne JSON com: simplifiedText, glossary, readabilityScore.`,

  [AgentType.COMMUNICATOR]: `Você é um especialista em comunicação com clientes jurídicos.
Redija comunicações claras, empáticas e profissionais.
Retorne JSON com: messageText, tone, channels, urgency.`
}

function getSystemPrompt(agentType: AgentType): string {
  const prompt = SYSTEM_PROMPTS[agentType]

  if (!prompt) {
    logger.warn(`System prompt not found for agent type: ${agentType}`)
    return 'Você é um assistente jurídico inteligente.'
  }

  return prompt
}

// ✨ Helper para determinar tipo de minuta baseado no documentType
function determineMinutaTipo(
  documentType?: string
): 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'procuracao' | 'outro' {
  if (!documentType) return 'peticao'

  const type = documentType.toLowerCase()

  if (type.includes('contrato') || type.includes('acordo')) return 'contrato'
  if (type.includes('parecer') || type.includes('opinião')) return 'parecer'
  if (type.includes('recurso') || type.includes('apelação') || type.includes('agravo') || type.includes('embargos')) {
    return 'recurso'
  }
  if (type.includes('procuração') || type.includes('mandato')) return 'procuracao'
  if (
    type.includes('petição') ||
    type.includes('contestação') ||
    type.includes('manifestação') ||
    type.includes('defesa')
  ) {
    return 'peticao'
  }

  return 'outro'
}

// ✨ Prompts de usuário com enum keys
const USER_PROMPTS: Record<AgentTaskType, (data: string) => string> = {
  [AgentTaskType.ANALYZE_DOCUMENT]: (data) =>
    `Analise o seguinte documento jurídico e retorne JSON estruturado:\n\n${data}\n\nRetorne: summary, extractedData, suggestedActions, deadlines, confidence.`,

  [AgentTaskType.ANALYZE_INTIMATION]: (data) =>
    `Analise a seguinte intimação judicial e retorne JSON estruturado:

${data}

Retorne um JSON com os seguintes campos:
- summary: resumo objetivo da intimação em 2-3 frases
- deadline: objeto com { days: número de dias, type: "úteis" ou "corridos", endDate: data calculada ISO }
- priority: "baixa", "média", "alta" ou "crítica"
- nextSteps: array com 3-5 providências práticas necessárias
- suggestedAction: ação principal recomendada
- processNumber: número do processo extraído
- court: tribunal/vara identificado
- parties: objeto com { author: nome, defendant: nome }
- documentType: tipo de documento (intimação, citação, notificação, etc)`,

  [AgentTaskType.MONITOR_DJEN]: (data) =>
    `Verifique publicações no DJEN/DataJud para:\n\n${data}\n\nRetorne JSON: newIntimations (array), checked, tribunaisVerificados, nextCheck.`,

  [AgentTaskType.CALCULATE_DEADLINE]: (data) =>
    `Calcule prazo processual:\n\n${data}\n\nRetorne JSON: deadline (ISO), businessDays, reasoning (array), holidays, alerts.`,

  [AgentTaskType.DRAFT_PETITION]: (data) =>
    `Redija peça processual:\n\n${data}\n\nRetorne JSON: draft (texto completo), confidence, needsReview, suggestions, metadata.`,

  [AgentTaskType.CHECK_DATAJUD]: (data) =>
    `Consulte DataJud:\n\n${data}\n\nRetorne JSON: processosEncontrados, ultimaAtualizacao, movimentacoes, status, partes.`,

  [AgentTaskType.ORGANIZE_FILES]: (data) =>
    `Organize arquivos:\n\n${data}\n\nRetorne JSON: filesOrganized, categoriesCreated, duplicatesFound, spaceSaved.`,

  [AgentTaskType.RESEARCH_PRECEDENTS]: (data) =>
    `Pesquise precedentes:\n\n${data}\n\nRetorne JSON: precedentsFound, relevantCases, thematicAnalysis, recommendation.`,

  [AgentTaskType.RISK_ANALYSIS]: (data) =>
    `Análise de risco:\n\n${data}\n\nRetorne JSON: riskLevel, riskScore, factors, recommendations, probabilitySuccess.`,

  [AgentTaskType.CONTRACT_REVIEW]: (data) =>
    `Revise contrato:\n\n${data}\n\nRetorne JSON: contractAnalysis, findings, compliance, riskAssessment.`,

  [AgentTaskType.CLIENT_COMMUNICATION]: (data) =>
    `Comunique ao cliente:\n\n${data}\n\nRetorne JSON: messageGenerated, template, tone, urgency, channels.`,

  [AgentTaskType.BILLING_ANALYSIS]: (data) =>
    `Analise faturamento:\n\n${data}\n\nRetorne JSON: periodAnalyzed, totalBilled, pendingInvoices, insights.`,

  [AgentTaskType.CASE_STRATEGY]: (data) =>
    `Estratégia para caso:\n\n${data}\n\nRetorne JSON: strategyAnalysis, recommendedActions, successProbability.`,

  [AgentTaskType.LEGAL_TRANSLATION]: (data) =>
    `Simplifique texto jurídico:\n\n${data}\n\nRetorne JSON: translationCompleted, simplifiedText, keyTermsGlossary.`,

  [AgentTaskType.COMPLIANCE_CHECK]: (data) =>
    `Verifique compliance:\n\n${data}\n\nRetorne JSON: complianceStatus, checksPerformed, violations, recommendations.`
}

function getUserPrompt(task: AgentTask): string {
  const data = task.data
  const taskData = JSON.stringify(data, null, 2)
  const promptGenerator = USER_PROMPTS[task.type]

  if (!promptGenerator) {
    logger.warn(`User prompt generator not found for task type: ${task.type}`)
    return `Processe:\n\n${taskData}`
  }

  return promptGenerator(taskData)
}

// ===========================
// Helper functions for processTaskWithAI - Extracted per SonarCloud S3776
// ===========================

/**
 * Valida inputs da tarefa usando Zod schemas quando aplicável
 * @throws Error se validação falhar
 */
function validateTaskInputWithSchema(task: AgentTask): void {
  if (task.type === AgentTaskType.ANALYZE_INTIMATION) {
    const validation = AnalyzeIntimationInputSchema.safeParse(task.data)
    if (!validation.success) {
      const error = new Error(`Invalid input for ANALYZE_INTIMATION: ${validation.error.message}`)
      logger.error('Schema validation failed', error, { data: task.data })
      throw error
    }
    return
  }

  if (task.type === AgentTaskType.DRAFT_PETITION) {
    const validation = DraftPetitionInputSchema.safeParse(task.data)
    if (!validation.success) {
      const error = new Error(`Invalid input for DRAFT_PETITION: ${validation.error.message}`)
      logger.error('Schema validation failed', error, { data: task.data })
      throw error
    }
  }
}

/**
 * Recupera contexto relevante da memória jurídica
 */
async function retrieveMemoryContext(task: AgentTask): Promise<string> {
  const query = (task.data?.description || task.data?.query) as string | undefined
  if (!query) return ''

  try {
    const relevantItems = await legalMemory.search({ query, limit: 3 })
    if (relevantItems.length === 0) return ''

    logger.info(`Found ${relevantItems.length} relevant memory items for task ${task.id}`)
    return `\n\n# Contexto Jurídico Relevante (Memória):\n${relevantItems
      .map((item) => `- ${item.content} (Score: ${item.relevanceScore})`)
      .join('\n')}`
  } catch (memError) {
    logger.warn('Failed to retrieve legal memory', { error: memError })
    return ''
  }
}

/**
 * Mapeamento de tipos de tarefa para configuração de salvamento na memória
 */
const MEMORY_SAVE_CONFIG: Record<AgentTaskType, {
  getContent: (result: TaskResult) => string | null
  category: LegalContextType
} | null> = {
  [AgentTaskType.DRAFT_PETITION]: {
    getContent: (result) => result.draft ? `Minuta de petição: ${String(result.draft).substring(0, 200)}...` : null,
    category: 'peca_processual'
  },
  [AgentTaskType.RESEARCH_PRECEDENTS]: {
    getContent: (result) => result.precedentsFound ? `Pesquisa de precedentes: ${JSON.stringify(result.precedentsFound)}` : null,
    category: 'precedente'
  },
  [AgentTaskType.CASE_STRATEGY]: {
    getContent: (result) => result.strategyAnalysis ? `Estratégia processual: ${String(result.strategyAnalysis)}` : null,
    category: 'estrategia'
  },
  // Tipos que não salvam na memória
  [AgentTaskType.ANALYZE_DOCUMENT]: null,
  [AgentTaskType.ANALYZE_INTIMATION]: null,
  [AgentTaskType.MONITOR_DJEN]: null,
  [AgentTaskType.CALCULATE_DEADLINE]: null,
  [AgentTaskType.CHECK_DATAJUD]: null,
  [AgentTaskType.ORGANIZE_FILES]: null,
  [AgentTaskType.RISK_ANALYSIS]: null,
  [AgentTaskType.CONTRACT_REVIEW]: null,
  [AgentTaskType.CLIENT_COMMUNICATION]: null,
  [AgentTaskType.BILLING_ANALYSIS]: null,
  [AgentTaskType.LEGAL_TRANSLATION]: null,
  [AgentTaskType.COMPLIANCE_CHECK]: null
}

/**
 * Salva resultado na memória jurídica quando aplicável
 */
async function saveResultToMemory(task: AgentTask, result: TaskResult): Promise<void> {
  const config = MEMORY_SAVE_CONFIG[task.type]
  if (!config) return

  const content = config.getContent(result)
  if (!content) return

  try {
    await legalMemory.addContext(
      content,
      config.category,
      { taskId: task.id, agentId: result.agentId, fullDraft: result.draft }
    )
  } catch (memSaveError) {
    logger.warn('Failed to save to legal memory', { error: memSaveError })
  }
}

/**
 * Valida estruturas de entrada (task e agent)
 * @throws Error se validação falhar
 */
function validateInputStructures(task: AgentTask, agent: Agent): void {
  if (!validateAgentTask(task)) {
    const error = new Error('Invalid agent task structure')
    logger.error('Task validation failed', error, { task })
    throw error
  }

  if (!validateAgent(agent)) {
    const error = new Error('Invalid agent structure')
    logger.error('Agent validation failed', error, { agent })
    throw error
  }
}

/**
 * Obtém API key do Gemini
 * @throws Error se não configurada
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    const error = new Error('Missing GOOGLE_API_KEY / GEMINI_API_KEY env var')
    logger.error('Gemini API key not configured', error)
    throw error
  }
  return apiKey
}

/**
 * Parseia resposta JSON do Gemini
 */
function parseGeminiResponse(aiContent: string): TaskResult {
  try {
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: aiContent }
  } catch (parseError) {
    logger.warn('Failed to parse Gemini JSON response', {
      error: parseError instanceof Error ? parseError.message : String(parseError),
      contentPreview: aiContent.slice(0, 500)
    })
    return { rawResponse: aiContent }
  }
}

// 🔁 Agora usando Google Gemini no lugar do Spark
/**
 * Prepara a requisição para o Gemini
 */
function prepareGeminiRequest(
  fullPrompt: string,
  timeoutMs: number
): { requestBody: unknown; controller: AbortController; timeoutId: NodeJS.Timeout } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: fullPrompt }]
      }
    ],
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: 0.7
    }
  }

  return { requestBody, controller, timeoutId }
}

/**
 * Executa a chamada para o Gemini
 */
async function callGeminiAPI(
  apiKey: string,
  requestBody: unknown,
  controller: AbortController
): Promise<{ aiContent: string; tokensUsed?: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    }
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Gemini error: ${response.status} ${response.statusText} ${text}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
    usageMetadata?: { totalTokenCount?: number }
  }

  const parts = data.candidates?.[0]?.content?.parts || []
  const aiContent = parts.map((p) => p.text || '').join('\n').trim()

  if (!aiContent) {
    throw new Error('Empty response from Gemini')
  }

  return {
    aiContent,
    tokensUsed: data.usageMetadata?.totalTokenCount
  }
}

/**
 * Enriquecer resultado com metadados
 */
function enrichResultWithMetadata(
  result: TaskResult,
  agentId: string,
  taskType: AgentTaskType,
  tokensUsed: number | undefined,
  startTime: number
): TaskResult {
  return {
    ...result,
    processedAt: new Date().toISOString(),
    agentId,
    taskType,
    tokensUsed,
    processingTimeMs: Date.now() - startTime
  }
}

async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<TaskResult> {
  // ✨ PLANO MESTRE - FASE 4: Monitoramento
  return await agentMonitor.trackTaskExecution(
    task.id,
    agent.id,
    task.type,
    async () => {
      const startTime = Date.now()

      // Validações extraídas para helpers (SonarCloud S3776)
      validateInputStructures(task, agent)
      validateTaskInputWithSchema(task)

      const apiKey = getGeminiApiKey()
      const memoryContext = await retrieveMemoryContext(task)

      const systemPrompt = getSystemPrompt(agent.type)
      const userPrompt = getUserPrompt(task)

      logger.info('Processing task with Gemini', {
        taskId: task.id,
        agentId: agent.id,
        taskType: task.type,
        timeout: task.timeout || 30000
      })

      const timeoutMs = task.timeout || 30000
      const fullPrompt = [
        '# Instruções do agente (system):',
        systemPrompt,
        memoryContext, // Inserir contexto da memória
        '',
        '# Tarefa específica (user):',
        userPrompt
      ].join('\n')

      const { requestBody, controller, timeoutId } = prepareGeminiRequest(fullPrompt, timeoutMs)

      try {
        const { aiContent, tokensUsed } = await callGeminiAPI(apiKey, requestBody, controller)

        // Parsear resposta usando helper (SonarCloud S3776)
        const result = parseGeminiResponse(aiContent)

        // Enriquecer resultado com metadados
        const enrichedResult = enrichResultWithMetadata(
          result,
          agent.id,
          task.type,
          tokensUsed,
          startTime
        )

        // Salvar na memória jurídica usando helper (SonarCloud S3776)
        await saveResultToMemory(task, enrichedResult)

        logger.info('Task processed successfully (Gemini)', {
          taskId: task.id,
          agentId: agent.id,
          tokensUsed: enrichedResult.tokensUsed,
          processingTimeMs: enrichedResult.processingTimeMs
        })

        return enrichedResult
      } finally {
        clearTimeout(timeoutId)
      }
    }
  )
}

// ===========================
// Action Handlers - Extracted to reduce CC (S3776)
// ===========================

interface _ProcessQueueResult {
  ok: boolean
  message: string
  processed: number
  failed?: number
  results?: Array<{ taskId: string; status: 'completed' | 'failed'; error?: string }>
  timestamp: string
}

/**
 * Busca tarefas do KV
 */
async function fetchTaskQueue(): Promise<AgentTask[]> {
  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available for task queue')
      return []
    }

    const tasks = await redis.get('agent-task-queue') as AgentTask[] | null
    return (tasks ?? []).filter((t) => validateAgentTask(t))
  } catch (error) {
    logger.error('Failed to fetch task queue from Redis', error)
    return []
  }
}

/**
 * Busca agentes do KV
 */
async function fetchAgents(): Promise<Agent[]> {
  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available for agents')
      return []
    }

    const agents = await redis.get('autonomous-agents') as Agent[] | null
    return (agents ?? []).filter((a) => validateAgent(a))
  } catch (error) {
    logger.error('Failed to fetch agents from Redis', error)
    return []
  }
}

/**
 * Salva fila de tarefas no KV
 */
async function saveTaskQueue(taskQueue: AgentTask[]): Promise<void> {
  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available to save task queue')
      return
    }

    await redis.set('agent-task-queue', taskQueue)
  } catch (error) {
    logger.error('Failed to save task queue to Redis', error)
  }
}

/**
 * Valida se uma tarefa pode ser processada
 */
function canProcessTask(task: AgentTask, agent: Agent): boolean {
  return agent.enabled && task.status === TaskStatus.QUEUED;
}

/**
 * Processa ações encadeadas de uma tarefa
 */
function processChainedActions(task: AgentTask, result: TaskResult, taskQueue: AgentTask[]): void {
  if (
    task.type !== AgentTaskType.ANALYZE_DOCUMENT ||
    !result.suggestedActions ||
    !Array.isArray(result.suggestedActions)
  ) {
    return
  }

  for (const actionText of result.suggestedActions) {
    const mapping = findTaskMapping(String(actionText))
    if (mapping) {
      const nextTask = createChainedTask(String(actionText), task, mapping)
      logger.info(`Chaining task: ${nextTask.type} for ${nextTask.agentId}`)
      taskQueue.push(nextTask)
    }
  }
}

/**
 * Salva minuta auto-gerada no KV
 */
async function saveAutoGeneratedMinuta(task: AgentTask, result: TaskResult): Promise<void> {
  if (task.type !== AgentTaskType.DRAFT_PETITION || !result.draft) return

  const data = task.data as Record<string, unknown>

  const minuta = {
    id: randomUUID(),
    titulo: `[Agente] ${(data.documentType as string) || 'Petição'} - ${(data.processNumber as string) || 'Novo'}`,
    processId: (data.processId as string) || undefined,
    tipo: determineMinutaTipo(data.documentType as string),
    conteudo: String(result.draft),
    status: 'pendente-revisao' as const,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    autor: 'Agente IA',
    criadoPorAgente: true,
    agenteId: task.agentId,
    expedienteId: (data.expedienteId as string) || undefined,
    variaveis: {}
  }

  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available to save auto-generated minuta')
      return
    }

    // Buscar minutas existentes
    const existingMinutas = await redis.get('minutas') as unknown[] | null
    const currentMinutas = existingMinutas ?? []

    // Adicionar nova minuta
    await redis.set('minutas', [...currentMinutas, minuta])

    logger.info('Auto-created minuta', {
      id: minuta.id,
      titulo: minuta.titulo,
      agentId: task.agentId
    })
  } catch (error) {
    logger.error('Failed to save auto-generated minuta to Redis', error)
  }
}

/**
 * Processa uma tarefa individual da fila
 */
async function processQueueTask(
  task: AgentTask,
  agents: Agent[],
  taskQueue: AgentTask[]
): Promise<{ taskId: string; status: 'completed' | 'failed'; error?: string }> {
  const agent = agents.find((a) => a.id === task.agentId)

  if (!agent) {
    logger.info(`Skipping task ${task.id} - agent not found`)
    return { taskId: task.id, status: 'failed', error: 'Agent not found' }
  }

  if (!canProcessTask(task, agent)) {
    logger.info(`Skipping task ${task.id} - agent disabled`)
    return { taskId: task.id, status: 'failed', error: 'Agent disabled' }
  }

  try {
    logger.info(`Processing task ${task.id} for ${agent.name}`)
    const result = await processTaskWithAI(task, agent)

    task.status = TaskStatus.COMPLETED
    task.completedAt = new Date().toISOString()
    task.result = result

    processChainedActions(task, result, taskQueue)
    await saveAutoGeneratedMinuta(task, result)

    return { taskId: task.id, status: 'completed' }
  } catch (error) {
    logger.error(`Error processing task ${task.id}`, error)
    task.status = TaskStatus.FAILED
    task.error = error instanceof Error ? error.message : 'Unknown error'

    return { taskId: task.id, status: 'failed', error: task.error }
  }
}

/**
 * Handler: POST ?action=process-queue
 */
async function handleProcessQueue(res: VercelResponse): Promise<VercelResponse> {
  const taskQueue = await fetchTaskQueue()
  const validTasks = taskQueue.filter((t) => validateAgentTask(t))
  const pendingTasks = validTasks.filter((t) => t.status === TaskStatus.QUEUED)

  logger.info(`Found ${pendingTasks.length} pending tasks`)

  if (pendingTasks.length === 0) {
    return res.status(200).json({
      ok: true,
      message: 'No pending tasks',
      processed: 0,
      timestamp: new Date().toISOString()
    })
  }

  const agents = await fetchAgents()
  const tasksToProcess = pendingTasks.slice(0, 5)
  const results: Array<{ taskId: string; status: 'completed' | 'failed'; error?: string }> = []

  for (const task of tasksToProcess) {
    const result = await processQueueTask(task, agents, taskQueue)
    results.push(result)
  }

  await saveTaskQueue(taskQueue)

  const processedCount = results.filter((r) => r.status === 'completed').length
  const failedCount = results.filter((r) => r.status === 'failed').length

  logger.info(`Processed ${results.length} tasks: ${processedCount} completed, ${failedCount} failed`)

  return res.status(200).json({
    ok: true,
    message: `Processed ${processedCount} tasks successfully`,
    processed: processedCount,
    failed: failedCount,
    results,
    timestamp: new Date().toISOString()
  })
}

/**
 * Handler: POST ?action=process-task
 */
async function handleProcessTask(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse> {
  const { task, agent } = req.body as { task: unknown; agent: unknown }

  if (!validateAgentTask(task)) {
    return res.status(400).json({
      error: 'Invalid task structure',
      timestamp: new Date().toISOString()
    })
  }

  if (!validateAgent(agent)) {
    return res.status(400).json({
      error: 'Invalid agent structure',
      timestamp: new Date().toISOString()
    })
  }

  const result = await processTaskWithAI(task as AgentTask, agent as Agent)

  return res.status(200).json({
    ok: true,
    result,
    metadata: {
      tokensUsed: result.tokensUsed,
      processingTimeMs: result.processingTimeMs,
      processedAt: result.processedAt
    },
    timestamp: new Date().toISOString()
  })
}

/**
 * Handler: GET ?action=logs
 */
async function handleGetLogs(res: VercelResponse): Promise<VercelResponse> {
  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available for logs')
      return res.status(200).json({ logs: [] })
    }

    const logsData = await redis.get('agent-logs')
    const logs = Array.isArray(logsData) ? logsData : []
    return res.status(200).json({ logs })
  } catch (error) {
    logger.error('Failed to fetch agent logs', error)
    return res.status(200).json({ logs: [] })
  }
}

/**
 * Handler: GET ?action=memory
 */
async function handleGetMemory(res: VercelResponse): Promise<VercelResponse> {
  try {
    const redis = getRedisOrNull()
    if (!redis) {
      logger.warn('No Redis available for memory')
      return res.status(200).json({ memory: [] })
    }

    const memoryData = await redis.get('legal-memory')
    const memory = Array.isArray(memoryData) ? memoryData : []
    return res.status(200).json({ memory })
  } catch (error) {
    logger.error('Failed to fetch legal memory', error)
    return res.status(200).json({ memory: [] })
  }
}

/**
 * Verifica autorização da requisição
 */
function isAuthorized(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader?.startsWith('Bearer ')
  // Detectar ambiente de desenvolvimento (localhost/127.0.0.1)
  const host = req.headers.host || ''
  const isLocalDev = host.includes('localhost') || host.includes('127.0.0.1') || process.env.NODE_ENV === 'development'
  const hasApiKey = !!req.headers['x-api-key']

  return !!(isVercelCron || isLocalDev || hasApiKey)
}

// ===========================
// Main Handler - Simplified
// ===========================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers - permitir apenas origens confiáveis
  const allowedOrigins = [
    'https://assistente-juridico-p.vercel.app',
    'https://assistente-juridico-github.vercel.app'
  ];
  const origin = req.headers.origin || '';
  // Permitir localhost em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development' || origin.includes('localhost') || origin.includes('127.0.0.1');
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (isDev && origin) {
    // Em desenvolvimento, permitir a origem especificada (localhost)
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Não definir header se origem não for permitida (mais seguro que '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const actionParam = req.query.action
  const action = Array.isArray(actionParam) ? actionParam[0] : actionParam

  if (!isAuthorized(req)) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Authentication required. Provide Bearer token, x-api-key header, or access from localhost.'
    })
  }

  try {
    if (action === 'process-queue' && req.method === 'POST') {
      return await handleProcessQueue(res)
    }

    if (action === 'process-task' && req.method === 'POST') {
      return await handleProcessTask(req, res)
    }

    if (action === 'logs' && req.method === 'GET') {
      return await handleGetLogs(res)
    }

    if (action === 'memory' && req.method === 'GET') {
      return await handleGetMemory(res)
    }

    return res.status(400).json({
      error: 'Invalid action. Use: process-queue, process-task, logs, or memory',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Handler error', error)

    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}
