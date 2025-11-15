import { createAgentTask, type AgentTask } from './agents'

export interface TaskGeneratorConfig {
  enabled: boolean
  intervalMinutes: number
  maxTasksPerInterval: number
  agentIds: string[]
}

const defaultConfig: TaskGeneratorConfig = {
  enabled: true,
  intervalMinutes: 5,
  maxTasksPerInterval: 3,
  agentIds: []
}

const taskTemplates = {
  'doc-analyzer': [
    { type: 'analyze_document' as const, data: { fileName: 'intimacao_123.pdf', hasDeadline: true }, priority: 'high' as const },
    { type: 'analyze_document' as const, data: { fileName: 'sentenca_456.pdf', hasDeadline: false }, priority: 'medium' as const },
    { type: 'analyze_document' as const, data: { fileName: 'despacho_789.pdf', hasDeadline: true }, priority: 'high' as const }
  ],
  'djen-monitor': [
    { type: 'monitor_djen' as const, data: { tribunais: ['TJDFT', 'STJ'] }, priority: 'medium' as const },
    { type: 'monitor_djen' as const, data: { tribunais: ['TST', 'TRT1'] }, priority: 'low' as const }
  ],
  'deadline-tracker': [
    { type: 'calculate_deadline' as const, data: { businessDays: 15, startDate: new Date().toISOString() }, priority: 'high' as const },
    { type: 'calculate_deadline' as const, data: { businessDays: 5, startDate: new Date().toISOString() }, priority: 'critical' as const },
    { type: 'calculate_deadline' as const, data: { businessDays: 30, startDate: new Date().toISOString() }, priority: 'medium' as const }
  ],
  'petition-writer': [
    { type: 'draft_petition' as const, data: { tipo: 'contestação', vara: '1ª Vara Cível', comarca: 'Brasília' }, priority: 'medium' as const },
    { type: 'draft_petition' as const, data: { tipo: 'recurso', vara: '2ª Vara Trabalhista', comarca: 'São Paulo' }, priority: 'high' as const }
  ],
  'datajud-query': [
    { type: 'check_datajud' as const, data: { numeroProcesso: '1234567-89.2024.8.07.0001' }, priority: 'low' as const }
  ],
  'file-organizer': [
    { type: 'organize_files' as const, data: { folder: 'processos_novos' }, priority: 'low' as const }
  ],
  'mrs-justin-e': [
    { type: 'analyze_document' as const, data: { fileName: 'intimacao_pje.pdf', hasDeadline: true, source: 'PJe' }, priority: 'critical' as const },
    { type: 'calculate_deadline' as const, data: { businessDays: 15, startDate: new Date().toISOString() }, priority: 'high' as const }
  ]
}

export class AgentTaskGenerator {
  private config: TaskGeneratorConfig
  private intervalId?: number
  private taskCallback?: (task: AgentTask) => void

  constructor(config: Partial<TaskGeneratorConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  public setTaskCallback(callback: (task: AgentTask) => void) {
    this.taskCallback = callback
  }

  public start() {
    if (this.intervalId) {
      console.warn('Task generator já está rodando')
      return
    }

    if (!this.config.enabled) {
      console.warn('Task generator está desabilitado')
      return
    }

    this.generateTasks()

    this.intervalId = window.setInterval(() => {
      this.generateTasks()
    }, this.config.intervalMinutes * 60 * 1000)
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  private generateTasks() {
    if (!this.taskCallback) {
      console.warn('Task callback não configurado')
      return
    }

    const numTasks = Math.floor(Math.random() * this.config.maxTasksPerInterval) + 1

    for (let i = 0; i < numTasks; i++) {
      const agentId = this.config.agentIds[Math.floor(Math.random() * this.config.agentIds.length)]
      
      if (!agentId) continue

      const templates = taskTemplates[agentId as keyof typeof taskTemplates]
      
      if (!templates || templates.length === 0) continue

      const template = templates[Math.floor(Math.random() * templates.length)]
      
      const task = createAgentTask(
        agentId,
        template.type,
        template.data,
        template.priority
      )

      this.taskCallback(task)
    }
  }

  public generateTaskNow(agentId: string) {
    if (!this.taskCallback) {
      console.warn('Task callback não configurado')
      return
    }

    const templates = taskTemplates[agentId as keyof typeof taskTemplates]
    
    if (!templates || templates.length === 0) {
      console.warn(`Nenhum template encontrado para agente ${agentId}`)
      return
    }

    const template = templates[Math.floor(Math.random() * templates.length)]
    
    const task = createAgentTask(
      agentId,
      template.type,
      template.data,
      template.priority
    )

    this.taskCallback(task)
  }

  public updateConfig(newConfig: Partial<TaskGeneratorConfig>) {
    const wasRunning = !!this.intervalId

    if (wasRunning) {
      this.stop()
    }

    this.config = { ...this.config, ...newConfig }

    if (wasRunning && this.config.enabled) {
      this.start()
    }
  }

  public getConfig(): TaskGeneratorConfig {
    return { ...this.config }
  }
}

export function createTaskGenerator(config?: Partial<TaskGeneratorConfig>): AgentTaskGenerator {
  return new AgentTaskGenerator(config)
}
