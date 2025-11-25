/**
 * Core types and utilities for AI Agents system
 * 
 * This file defines the base types and helper functions used across all agents
 */

// ============================================================================
// TYPES
// ============================================================================

export type AgentStatus = 'active' | 'idle' | 'processing' | 'paused' | 'waiting_human' | 'error'
export type TaskStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'human_intervention'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Agent {
  id: string
  name: string
  description: string
  type: string
  status: AgentStatus
  enabled: boolean
  lastActivity: string
  tasksCompleted: number
  tasksToday: number
  continuousMode: boolean
  currentTask?: AgentTask
  capabilities?: string[]
  config?: Record<string, unknown>
  autonomyLevel?: number
  nextScheduledRun?: string
  workQueue?: any[]
  humanInteractionMode?: string
}

export interface AgentTask {
  id: string
  agentId: string
  type: string
  priority: TaskPriority
  status: TaskStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: Record<string, unknown>
  result?: AgentTaskResult
  error?: string
  humanTouchedAt?: string
  resumeAfterHuman?: boolean
  retryCount?: number
  maxRetries?: number
}

export interface AgentTaskResult {
  success: boolean
  data?: Record<string, unknown>
  message?: string
  error?: string
  suggestions?: string[]
  nextSteps?: string[]
}

export interface AgentTaskGeneratorConfig {
  enabled: boolean
  intervalMinutes: number
  maxTasksPerInterval: number
  agentIds: string[]
}

export interface AgentTaskGenerator {
  start(): void
  stop(): void
  updateConfig(config: Partial<AgentTaskGeneratorConfig>): void
  setOnTaskGenerated(callback: (task: AgentTask) => void): void
}

// ============================================================================
// TASK PROCESSING
// ============================================================================

/**
 * Simulates AI processing of a task
 * This is used when real AI is disabled
 */
export async function processTaskWithAI(
  task: AgentTask,
  agent: Agent
): Promise<AgentTaskResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Simulate different outcomes based on task type
  const taskType = task.type.toLowerCase()
  
  if (taskType.includes('monitor') || taskType.includes('check')) {
    return {
      success: true,
      message: `Monitoramento concluído: ${task.data.description || 'sem descrição'}`,
      data: {
        itemsFound: Math.floor(Math.random() * 5),
        timestamp: new Date().toISOString()
      },
      suggestions: ['Verificar novamente em 1 hora', 'Notificar equipe se houver novidades']
    }
  }

  if (taskType.includes('analyze') || taskType.includes('review')) {
    return {
      success: true,
      message: `Análise concluída: ${task.data.description || 'documento'}`,
      data: {
        confidence: 0.85 + Math.random() * 0.15,
        findings: ['Item 1 verificado', 'Item 2 aprovado', 'Item 3 requer atenção']
      },
      suggestions: ['Revisar item 3 manualmente', 'Aprovar documento']
    }
  }

  if (taskType.includes('calculate') || taskType.includes('deadline')) {
    return {
      success: true,
      message: `Cálculo de prazo concluído`,
      data: {
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        businessDays: 15,
        warnings: []
      },
      suggestions: ['Adicionar ao calendário', 'Configurar lembrete']
    }
  }

  // Default success response
  return {
    success: true,
    message: `Tarefa "${task.type}" processada com sucesso`,
    data: {
      processedAt: new Date().toISOString(),
      agentId: agent.id
    }
  }
}

// ============================================================================
// HUMAN-IN-THE-LOOP
// ============================================================================

/**
 * Determines if a task should pause for human review
 */
export function shouldPauseForHuman(agent: Agent, task: AgentTask): boolean {
  // High-risk tasks always require human review
  if (task.priority === 'critical') {
    return true
  }

  // Tasks that have failed multiple times
  if (task.retryCount && task.retryCount >= (task.maxRetries || 3)) {
    return true
  }

  // Specific task types that require human oversight
  const humanReviewTypes = [
    'petition-filing',
    'contract-signing',
    'payment-processing',
    'client-communication',
    'legal-advice'
  ]

  if (humanReviewTypes.some(type => task.type.toLowerCase().includes(type))) {
    return true
  }

  return false
}

/**
 * Checks if a task can resume after human intervention
 */
export function canResumeAfterHuman(task: AgentTask): boolean {
  // Task explicitly marked for resumption
  if (task.resumeAfterHuman) {
    return true
  }

  // Task is in human intervention status but was touched recently
  if (task.status === 'human_intervention' && task.humanTouchedAt) {
    const touchedTime = new Date(task.humanTouchedAt).getTime()
    const now = Date.now()
    const hoursSinceTouched = (now - touchedTime) / (1000 * 60 * 60)
    
    // Auto-resume after 24 hours if not explicitly handled
    return hoursSinceTouched > 24
  }

  return task.status === 'queued'
}

// ============================================================================
// TASK GENERATOR
// ============================================================================

/**
 * Creates a task generator that automatically creates tasks for agents
 */
export function createTaskGenerator(
  config: AgentTaskGeneratorConfig,
  onTaskGenerated: (task: AgentTask) => void
): AgentTaskGenerator {
  let intervalId: number | undefined
  let currentConfig = { ...config }
  let callback = onTaskGenerated

  const taskTemplates = [
    { type: 'monitor-djen', priority: 'high' as TaskPriority, description: 'Verificar publicações DJEN' },
    { type: 'check-deadlines', priority: 'high' as TaskPriority, description: 'Verificar prazos próximos' },
    { type: 'analyze-documents', priority: 'medium' as TaskPriority, description: 'Analisar documentos pendentes' },
    { type: 'sync-calendar', priority: 'medium' as TaskPriority, description: 'Sincronizar calendário' },
    { type: 'update-metrics', priority: 'low' as TaskPriority, description: 'Atualizar métricas' },
    { type: 'backup-data', priority: 'low' as TaskPriority, description: 'Backup de dados' }
  ]

  const generateTasks = () => {
    if (!currentConfig.enabled || currentConfig.agentIds.length === 0) {
      return
    }

    const numTasks = Math.min(
      Math.floor(Math.random() * currentConfig.maxTasksPerInterval) + 1,
      currentConfig.maxTasksPerInterval
    )

    for (let i = 0; i < numTasks; i++) {
      const template = taskTemplates[Math.floor(Math.random() * taskTemplates.length)]
      const agentId = currentConfig.agentIds[Math.floor(Math.random() * currentConfig.agentIds.length)]

      const task: AgentTask = {
        id: crypto.randomUUID(),
        agentId,
        type: template.type,
        priority: template.priority,
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {
          description: template.description,
          autoGenerated: true
        }
      }

      callback(task)
    }
  }

  return {
    start() {
      if (intervalId) return
      
      // Generate initial tasks
      generateTasks()
      
      // Set up interval
      const intervalMs = currentConfig.intervalMinutes * 60 * 1000
      intervalId = window.setInterval(generateTasks, intervalMs)
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = undefined
      }
    },

    updateConfig(newConfig: Partial<AgentTaskGeneratorConfig>) {
      const wasRunning = !!intervalId
      
      if (wasRunning) {
        this.stop()
      }

      currentConfig = { ...currentConfig, ...newConfig }

      if (wasRunning && currentConfig.enabled) {
        this.start()
      }
    },

    setOnTaskGenerated(newCallback: (task: AgentTask) => void) {
      callback = newCallback
    }
  }
}

// ============================================================================
// AGENT REGISTRY
// ============================================================================

/**
 * Default agent configurations - All 15 agents
 */
export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'harvey',
    name: 'Harvey Specter',
    description: 'Assistente jurídico estratégico que analisa performance, processos, prazos e finanças do escritório em tempo real',
    type: 'strategic',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: true,
    capabilities: ['strategic-analysis', 'performance-monitoring', 'risk-identification', 'data-analysis']
  },
  {
    id: 'justine',
    name: 'Mrs. Justin-e',
    description: 'Especialista em análise automática de intimações com foco em identificação de prazos, providências e geração de tarefas',
    type: 'intimation-analyzer',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: true,
    capabilities: ['intimation-analysis', 'deadline-identification', 'task-generation', 'priority-assessment']
  },
  {
    id: 'analise-documental',
    name: 'Analisador de Documentos',
    description: 'Analisa automaticamente expedientes, intimações e documentos do PJe 24/7, extraindo informações estruturadas',
    type: 'analyzer',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: true,
    capabilities: ['document-analysis', 'text-extraction', 'entity-recognition', 'classification']
  },
  {
    id: 'monitor-djen',
    name: 'Monitor DJEN',
    description: 'Monitora automaticamente o Diário de Justiça Eletrônico Nacional (DJEN) e DataJud para novas publicações relevantes',
    type: 'monitor',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: true,
    capabilities: ['djen-monitoring', 'publication-detection', 'notification', 'datajud-integration']
  },
  {
    id: 'gestao-prazos',
    name: 'Gestão de Prazos',
    description: 'Calcula e acompanha prazos processuais automaticamente, gerando alertas e priorizando ações',
    type: 'calculator',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: true,
    capabilities: ['deadline-calculation', 'business-days', 'holiday-detection', 'alert-generation']
  },
  {
    id: 'redacao-peticoes',
    name: 'Redator de Petições',
    description: 'Auxilia na criação de petições e documentos jurídicos profissionais com base nos autos e precedentes',
    type: 'writer',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['document-drafting', 'legal-writing', 'template-generation', 'precedent-integration']
  },
  {
    id: 'organizacao-arquivos',
    name: 'Organizador de Arquivos',
    description: 'Organiza e categoriza automaticamente documentos do escritório por processo, tipo e relevância',
    type: 'organizer',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['file-organization', 'categorization', 'indexing', 'duplicate-detection']
  },
  {
    id: 'pesquisa-juris',
    name: 'Pesquisador de Jurisprudência',
    description: 'Busca e analisa precedentes e jurisprudências relevantes automaticamente em tribunais superiores',
    type: 'researcher',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['jurisprudence-search', 'precedent-analysis', 'case-law-research', 'trend-analysis']
  },
  {
    id: 'analise-risco',
    name: 'Análise de Risco',
    description: 'Avalia riscos processuais, financeiros e estratégicos de cada caso com base em dados e precedentes',
    type: 'risk-analyzer',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['risk-assessment', 'probability-analysis', 'financial-impact', 'mitigation-strategies']
  },
  {
    id: 'revisao-contratual',
    name: 'Revisor Contratual',
    description: 'Analisa contratos identificando cláusulas problemáticas, riscos e pontos de não conformidade',
    type: 'contract-reviewer',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['contract-analysis', 'clause-review', 'compliance-check', 'risk-identification']
  },
  {
    id: 'comunicacao-clientes',
    name: 'Comunicação com Clientes',
    description: 'Gera comunicações personalizadas e relatórios para clientes em linguagem acessível e respeitosa',
    type: 'communicator',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['client-communication', 'report-generation', 'language-simplification', 'personalization']
  },
  {
    id: 'financeiro',
    name: 'Análise Financeira',
    description: 'Monitora faturamento, recebimentos e análises de rentabilidade do escritório com base em dados reais',
    type: 'financial-analyzer',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['financial-monitoring', 'profitability-analysis', 'receivables-tracking', 'metrics-calculation']
  },
  {
    id: 'estrategia-processual',
    name: 'Estratégia Processual',
    description: 'Sugere estratégias processuais baseadas em análise de dados, precedentes e probabilidade de sucesso',
    type: 'strategy-advisor',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['strategic-planning', 'option-analysis', 'cost-benefit', 'success-probability']
  },
  {
    id: 'traducao-juridica',
    name: 'Tradutor Jurídico',
    description: 'Traduz termos técnicos jurídicos para linguagem simples e vice-versa, mantendo precisão',
    type: 'translator',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['legal-translation', 'term-explanation', 'glossary-creation', 'language-adaptation']
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Verifica conformidade com LGPD, Código de Ética da OAB, normas trabalhistas e regulatórias',
    type: 'compliance-checker',
    status: 'idle',
    enabled: false,
    lastActivity: 'Aguardando tarefas',
    tasksCompleted: 0,
    tasksToday: 0,
    continuousMode: false,
    capabilities: ['compliance-check', 'lgpd-verification', 'ethics-review', 'regulatory-audit']
  }
]

/**
 * Initialize agents with default configuration
 */
export function initializeAgents(existingAgents?: Agent[]): Agent[] {
  if (!existingAgents || existingAgents.length === 0) {
    return DEFAULT_AGENTS.map(agent => ({ ...agent }))
  }

  // Merge existing agents with defaults, preserving user settings
  const agentMap = new Map(existingAgents.map(a => [a.id, a]))
  
  return DEFAULT_AGENTS.map(defaultAgent => {
    const existing = agentMap.get(defaultAgent.id)
    if (existing) {
      // Preserve user settings but update capabilities and description
      return {
        ...existing,
        description: defaultAgent.description,
        capabilities: defaultAgent.capabilities
      }
    }
    return { ...defaultAgent }
  })
}
