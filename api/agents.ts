/**
 * API consolidada para processamento de agentes IA
 * Endpoints:
 * - POST /api/agents?action=process-queue - Processa fila de tarefas (cron)
 * - POST /api/agents?action=process-task - Processa tarefa individual
 * 
 * Usa Spark LLM real para processamento com IA
 * ✨ Refatorado com Enums, validação e tratamento de erros robusto
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { addTaskToQueue as _addTaskToQueue } from './lib/kv-utils';

// ✨ ENUMS para melhor type safety
export enum AgentTaskType {
  ANALYZE_DOCUMENT = 'analyze_document',
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
    typeof t.data === 'object' && t.data !== null
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
    console.log(`[Agents] ${message}`, context ? JSON.stringify(context) : '')
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(`[Agents] ERROR: ${message}`, {
      error: error instanceof Error ? error.message : String(error),
      ...context
    })
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[Agents] WARNING: ${message}`, context ? JSON.stringify(context) : '')
  }
}

// ✨ Cache de prompts com enum keys
const SYSTEM_PROMPTS: Record<AgentType, string> = {
  [AgentType.ANALYZER]: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

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
Retorne JSON com: messageText, tone, channels, urgency.`,
};

function getSystemPrompt(agentType: AgentType): string {
  const prompt = SYSTEM_PROMPTS[agentType]
  
  if (!prompt) {
    logger.warn(`System prompt not found for agent type: ${agentType}`)
    return 'Você é um assistente jurídico inteligente.'
  }
  
  return prompt
}

// ✨ Prompts de usuário com enum keys
const USER_PROMPTS: Record<AgentTaskType, (data: string) => string> = {
  [AgentTaskType.ANALYZE_DOCUMENT]: (data) => 
    `Analise o seguinte documento jurídico e retorne JSON estruturado:\n\n${data}\n\nRetorne: summary, extractedData, suggestedActions, deadlines, confidence.`,
  
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
    `Verifique compliance:\n\n${data}\n\nRetorne JSON: complianceStatus, checksPerformed, violations, recommendations.`,
};

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

async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<Record<string, unknown>> {
  const startTime = Date.now()
  
  // Validar entrada
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

  try {
    const systemPrompt = getSystemPrompt(agent.type)
    const userPrompt = getUserPrompt(task)

    logger.info('Processing task with AI', {
      taskId: task.id,
      agentId: agent.id,
      taskType: task.type,
      timeout: task.timeout || 30000
    })

    // Timeout protection
    const controller = new AbortController()
    const timeout = setTimeout(
      () => controller.abort(),
      task.timeout || 30000
    )

    try {
      const sparkResponse = await fetch('/_spark/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
        signal: controller.signal as RequestInit['signal'],
      });

      if (!sparkResponse.ok) {
        throw new Error(`Spark LLM error: ${sparkResponse.statusText}`)
      }

      const sparkData = await sparkResponse.json() as { 
        choices?: Array<{ message?: { content?: string } }>, 
        usage?: { total_tokens?: number } 
      };
      
      const aiContent = sparkData.choices?.[0]?.message?.content || ''

      if (!aiContent) {
        throw new Error('Empty response from AI')
      }

      // Parse JSON from AI response
      let result: Record<string, unknown>
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
        result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: aiContent }
      } catch (parseError) {
        logger.warn('Failed to parse AI JSON response', { error: parseError, content: aiContent })
        result = { rawResponse: aiContent }
      }

      // Enrich result with metadata
      result.processedAt = new Date().toISOString()
      result.agentId = agent.id
      result.taskType = task.type
      result.tokensUsed = sparkData.usage?.total_tokens
      result.processingTimeMs = Date.now() - startTime

      logger.info('Task processed successfully', {
        taskId: task.id,
        agentId: agent.id,
        tokensUsed: sparkData.usage?.total_tokens,
        processingTimeMs: result.processingTimeMs
      })

      return result

    } finally {
      clearTimeout(timeout)
    }

  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logger.error('Task processing failed', error, {
      taskId: task.id,
      agentId: agent.id,
      taskType: task.type,
      processingTimeMs,
      errorMessage
    })

    throw error
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query

  // Verificar autenticação (cron ou API key)
  const authHeader = req.headers.authorization
  const isVercelCron = authHeader?.startsWith('Bearer ')
  const isLocalTest = process.env.NODE_ENV === 'development'
  
  if (!isVercelCron && !isLocalTest && !req.headers['x-api-key']) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // ✨ PROCESS QUEUE (cron job)
    if (action === 'process-queue' && req.method === 'POST') {
      const kvEndpoint = '/_spark/kv/agent-task-queue'
      
      try {
        const tasksResponse = await fetch(kvEndpoint, {
          headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` },
        })

        if (!tasksResponse.ok) {
          throw new Error(`KV fetch failed: ${tasksResponse.statusText}`)
        }

        const kvData = await tasksResponse.json() as { value?: unknown[] }
        const taskQueue = kvData.value || []
        
        // Validar tarefas
        const validTasks = taskQueue.filter(t => validateAgentTask(t)) as AgentTask[]
        const pendingTasks = validTasks.filter((t: AgentTask) => t.status === TaskStatus.QUEUED)

        logger.info(`Found ${pendingTasks.length} pending tasks`)

        if (pendingTasks.length === 0) {
          return res.status(200).json({
            ok: true,
            message: 'No pending tasks',
            processed: 0,
            timestamp: new Date().toISOString(),
          })
        }

        // Processar até 5 tarefas por execução
        const tasksToProcess = pendingTasks.slice(0, 5)
        const results: Array<{ taskId: string; status: 'completed' | 'failed'; error?: string }> = []

        for (const task of tasksToProcess) {
          try {
            const agentsResponse = await fetch('/_spark/kv/autonomous-agents', {
              headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` },
            })

            if (!agentsResponse.ok) {
              throw new Error(`Agents KV fetch failed: ${agentsResponse.statusText}`)
            }

            const agentsData = await agentsResponse.json() as { value?: unknown[] }
            const agents = (agentsData.value || []).filter(a => validateAgent(a)) as Agent[]
            const agent = agents.find((a: Agent) => a.id === task.agentId)

            if (!agent) {
              logger.info(`Skipping task ${task.id} - agent not found`)
              results.push({ taskId: task.id, status: 'failed', error: 'Agent not found' })
              continue
            }

            if (!agent.enabled) {
              logger.info(`Skipping task ${task.id} - agent disabled`)
              results.push({ taskId: task.id, status: 'failed', error: 'Agent disabled' })
              continue
            }

            logger.info(`Processing task ${task.id} for ${agent.name}`)
            const result = await processTaskWithAI(task, agent)

            task.status = TaskStatus.COMPLETED
            task.completedAt = new Date().toISOString()
            task.result = result

            // ✨ Chain tasks based on analysis (keep existing logic)
            if (task.type === AgentTaskType.ANALYZE_DOCUMENT && result.suggestedActions && Array.isArray(result.suggestedActions)) {
              for (const action of result.suggestedActions) {
                const actionStr = String(action).toLowerCase()
                let nextTask: AgentTask | null = null

                if (actionStr.includes('prazo') || actionStr.includes('deadline')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'deadline-tracker',
                    type: AgentTaskType.CALCULATE_DEADLINE,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('petição') || actionStr.includes('defesa') || actionStr.includes('recurso') || actionStr.includes('manifestação')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'petition-writer',
                    type: AgentTaskType.DRAFT_PETITION,
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('pesquisa') || actionStr.includes('jurisprudência')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'precedent-researcher',
                    type: AgentTaskType.RESEARCH_PRECEDENTS,
                    priority: TaskPriority.LOW,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('avisar') || actionStr.includes('comunicar') || actionStr.includes('informar') || actionStr.includes('cliente')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'client-communicator',
                    type: AgentTaskType.CLIENT_COMMUNICATION,
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('datajud') || actionStr.includes('andamento') || actionStr.includes('autos') || actionStr.includes('movimentação')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'datajud-query',
                    type: AgentTaskType.CHECK_DATAJUD,
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('sentença') || actionStr.includes('decisão') || actionStr.includes('acórdão') || actionStr.includes('risco')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'risk-analyst',
                    type: AgentTaskType.RISK_ANALYSIS,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('custas') || actionStr.includes('honorários') || actionStr.includes('depósito') || actionStr.includes('guia') || actionStr.includes('pagamento')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'billing-analyst',
                    type: AgentTaskType.BILLING_ANALYSIS,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('arquivar') || actionStr.includes('salvar') || actionStr.includes('pasta') || actionStr.includes('organizar')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'document-organizer',
                    type: AgentTaskType.ORGANIZE_FILES,
                    priority: TaskPriority.LOW,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('lgpd') || actionStr.includes('sigilo') || actionStr.includes('segredo') || actionStr.includes('ética') || actionStr.includes('compliance')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'compliance-officer',
                    type: AgentTaskType.COMPLIANCE_CHECK,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('explicar') || actionStr.includes('simplificar') || actionStr.includes('traduzir') || actionStr.includes('leigo')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'legal-translator',
                    type: AgentTaskType.LEGAL_TRANSLATION,
                    priority: TaskPriority.MEDIUM,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('contrato') || actionStr.includes('minuta') || actionStr.includes('aditivo') || actionStr.includes('cláusula') || actionStr.includes('rescisão')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'contract-reviewer',
                    type: AgentTaskType.CONTRACT_REVIEW,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                } else if (actionStr.includes('estratégia') || actionStr.includes('plano') || actionStr.includes('probabilidade') || actionStr.includes('tese') || actionStr.includes('linha de defesa')) {
                  nextTask = {
                    id: crypto.randomUUID(),
                    agentId: 'case-strategist',
                    type: AgentTaskType.CASE_STRATEGY,
                    priority: TaskPriority.HIGH,
                    status: TaskStatus.QUEUED,
                    createdAt: new Date().toISOString(),
                    data: {
                      ...task.data,
                      instruction: action,
                      sourceTask: task.id
                    }
                  }
                }

                if (nextTask) {
                  logger.info(`Chaining task: ${nextTask.type} for ${nextTask.agentId}`)
                  taskQueue.push(nextTask as AgentTask)
                }
              }
            }

            results.push({ taskId: task.id, status: 'completed' })

          } catch (error) {
            logger.error(`Error processing task ${task.id}`, error)
            task.status = TaskStatus.FAILED
            task.error = error instanceof Error ? error.message : 'Unknown error'
            
            results.push({
              taskId: task.id,
              status: 'failed',
              error: task.error,
            })
          }
        }

        // Atualizar fila no KV
        await fetch(kvEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          },
          body: JSON.stringify({ value: taskQueue }),
        })

        logger.info(`Processed ${results.length} tasks`)

        return res.status(200).json({
          ok: true,
          message: 'Tasks processed',
          processed: results.filter(r => r.status === 'completed').length,
          failed: results.filter(r => r.status === 'failed').length,
          results,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        logger.error('Queue processing error', error)
        throw error
      }
    }

    // ✨ PROCESS TASK (individual)
    if (action === 'process-task' && req.method === 'POST') {
      const { task, agent } = req.body as { 
        task: unknown; 
        agent: unknown 
      }

      // Validar entrada
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

      const result = await processTaskWithAI(task, agent)

      return res.status(200).json({
        ok: true,
        result,
        metadata: {
          tokensUsed: result.tokensUsed,
          processingTimeMs: result.processingTimeMs,
          processedAt: result.processedAt,
        },
        timestamp: new Date().toISOString(),
      })
    }

    return res.status(400).json({ 
      error: 'Invalid action. Use: process-queue or process-task',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Handler error', error)
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
}
