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
  continuousMode: boolean
  currentTask?: AgentTask
  capabilities?: string[]
  config?: Record<string, unknown>
  nextScheduledRun?: string
  workQueue?: AgentTask[]
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
    continuousMode: true,
    capabilities: ['deadline-calculation', 'business-days', 'holiday-detection', 'alert-generation']
  },
  {
    id: 'redacao-peticoes',
    name: 'Redator de Petições',
    description: 'Auxilia na criação de petições e documentos jurídicos profissionais com base nos autos e precedentes',
    type: 'writer',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    continuousMode: true,
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
    continuousMode: false,
    capabilities: ['file-organization', 'categorization', 'indexing', 'duplicate-detection']
  },
  {
    id: 'pesquisa-juris',
    name: 'Pesquisador de Jurisprudência',
    description: 'Busca e analisa precedentes e jurisprudências relevantes automaticamente em tribunais superiores',
    type: 'researcher',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    continuousMode: true,
    capabilities: ['jurisprudence-search', 'precedent-analysis', 'case-law-research', 'trend-analysis']
  },
  {
    id: 'analise-risco',
    name: 'Análise de Risco',
    description: 'Avalia riscos processuais, financeiros e estratégicos de cada caso com base em dados e precedentes',
    type: 'risk-analyzer',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    continuousMode: true,
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
    continuousMode: false,
    capabilities: ['financial-monitoring', 'profitability-analysis', 'receivables-tracking', 'metrics-calculation']
  },
  {
    id: 'estrategia-processual',
    name: 'Estratégia Processual',
    description: 'Sugere estratégias processuais baseadas em análise de dados, precedentes e probabilidade de sucesso',
    type: 'strategy-advisor',
    status: 'idle',
    enabled: true,
    lastActivity: 'Aguardando tarefas',
    continuousMode: true,
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
    continuousMode: false,
    capabilities: ['compliance-check', 'lgpd-verification', 'ethics-review', 'regulatory-audit']
  }
]

/**
 * Initialize agents with default configuration
 * Sets essential agents as enabled by default
 * Merges with existing agents if provided, preserving user settings
 */
export function initializeAgents(existingAgents?: Agent[]): Agent[] {
  // Agentes essenciais são habilitados automaticamente
  const essentialAgents = [
    'harvey',              // Assistente estratégico
    'justine',             // Análise de intimações
    'analise-documental',  // Análise de documentos
    'monitor-djen',        // Monitoramento DJEN
    'gestao-prazos',       // Cálculo de prazos
    'redacao-peticoes',    // Redação automática
    'pesquisa-juris',      // Pesquisa de jurisprudência
    'analise-risco',       // Análise de risco
    'estrategia-processual' // Estratégia processual automática
  ];

  // Se não há agentes existentes, retorna defaults
  if (!existingAgents || existingAgents.length === 0) {
    return DEFAULT_AGENTS.map(agent => ({
      ...agent,
      status: 'idle' as const,
      enabled: essentialAgents.includes(agent.id),
      lastActivity: essentialAgents.includes(agent.id) ? 'Pronto para análise' : 'Aguardando ativação'
    }))
  }

  // Merge: preserva settings do usuário, atualiza capabilities dos defaults
  return DEFAULT_AGENTS.map(defaultAgent => {
    const existing = existingAgents.find(a => a.id === defaultAgent.id)

    if (existing) {
      // Preserva configurações do usuário, atualiza capabilities do default
      return {
        ...defaultAgent,
        ...existing,
        capabilities: defaultAgent.capabilities, // Sempre usa capabilities atualizados
        description: defaultAgent.description    // Sempre usa description atualizada
      }
    }

    // Agente não existe no existingAgents, usa default
    return {
      ...defaultAgent,
      status: 'idle' as const,
      enabled: essentialAgents.includes(defaultAgent.id),
      lastActivity: essentialAgents.includes(defaultAgent.id) ? 'Pronto para análise' : 'Aguardando ativação'
    }
  })
}

// ============================================================================
// TASK PROCESSING
// ============================================================================

/**
 * Process a task using AI capabilities
 * Simulates AI processing based on agent type and task requirements
 */
export async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<AgentTaskResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 10))

  const taskType = task.type.toLowerCase()

  // Monitor tasks (DJEN, DataJud, etc)
  if (taskType.includes('monitor') || agent.type === 'monitor') {
    return {
      success: true,
      message: 'Monitoramento concluído com sucesso',
      data: {
        publicationsFound: Math.floor(Math.random() * 10),
        lastChecked: new Date().toISOString(),
        source: 'DJEN/DataJud'
      },
      suggestions: ['Verificar publicações encontradas', 'Atualizar filtros de busca']
    }
  }

  // Analysis tasks (documents, contracts, etc)
  if (taskType.includes('analy') || taskType.includes('analise') || agent.type === 'analyzer') {
    return {
      success: true,
      message: 'Análise concluída com sucesso',
      data: {
        confidence: 0.85 + Math.random() * 0.1,
        entities: ['partes', 'valores', 'datas'],
        summary: 'Documento analisado com alta confiança'
      },
      suggestions: ['Revisar entidades extraídas', 'Validar classificação']
    }
  }

  // Deadline calculation tasks
  if (taskType.includes('deadline') || taskType.includes('prazo') || agent.type === 'calculator') {
    const businessDays = (task.data?.businessDays as number) || 15
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + Math.ceil(businessDays * 1.4)) // Aproximação para dias úteis

    return {
      success: true,
      message: 'Cálculo de prazo concluído',
      data: {
        deadline: deadline.toISOString(),
        businessDays,
        holidays: [],
        urgency: businessDays <= 5 ? 'high' : 'normal'
      },
      nextSteps: ['Adicionar ao calendário', 'Configurar alertas']
    }
  }

  // Default processing for other task types
  return {
    success: true,
    message: `Tarefa ${task.type} processada com sucesso`,
    data: {
      processedAt: new Date().toISOString(),
      agentId: agent.id
    }
  }
}

// ============================================================================
// TASK GENERATOR
// ============================================================================

/**
 * Creates a task generator that automatically creates tasks at regular intervals
 */
export function createTaskGenerator(
  config: AgentTaskGeneratorConfig,
  onTaskGenerated: (task: AgentTask) => void
): AgentTaskGenerator {
  let intervalId: ReturnType<typeof setInterval> | null = null
  let currentConfig = { ...config }
  let taskCallback = onTaskGenerated
  let tasksGeneratedInInterval = 0

  const generateTask = (): AgentTask => {
    const agentId = currentConfig.agentIds[Math.floor(Math.random() * currentConfig.agentIds.length)]
    const taskTypes = ['monitor-check', 'analyze-queue', 'deadline-review', 'status-update']
    const priorities: TaskPriority[] = ['low', 'medium', 'high']

    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      type: taskTypes[Math.floor(Math.random() * taskTypes.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: 'queued',
      createdAt: new Date().toISOString(),
      data: {
        autoGenerated: true,
        generatorConfig: currentConfig
      }
    }
  }

  const tick = () => {
    if (!currentConfig.enabled) return

    if (tasksGeneratedInInterval < currentConfig.maxTasksPerInterval) {
      const task = generateTask()
      taskCallback(task)
      tasksGeneratedInInterval++
    }
  }

  return {
    start() {
      if (intervalId) return
      tasksGeneratedInInterval = 0

      // Generate first task immediately
      tick()

      // Then continue at intervals
      const intervalMs = currentConfig.intervalMinutes * 60 * 1000
      intervalId = setInterval(() => {
        tasksGeneratedInInterval = 0
        tick()
      }, intervalMs)
    },

    stop() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },

    updateConfig(newConfig: Partial<AgentTaskGeneratorConfig>) {
      currentConfig = { ...currentConfig, ...newConfig }
    },

    setOnTaskGenerated(callback: (task: AgentTask) => void) {
      taskCallback = callback
    }
  }
}
