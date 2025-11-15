import { createAgentTask, type AgentTask } from './agents'

interface TaskGeneratorConfig {
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
    const agentIds = this.config.agentIds.length > 0 
      ? this.config.agentIds 
      : Object.keys(taskTemplates)

    let tasksGenerated = 0

    for (const agentId of agentIds) {
      if (tasksGenerated >= this.config.maxTasksPerInterval) break

      const templates = taskTemplates[agentId as keyof typeof taskTemplates]
      if (!templates || templates.length === 0) continue

      const template = templates[Math.floor(Math.random() * templates.length)]
      const task = createAgentTask(agentId, template.type, template.data, template.priority)

      if (this.taskCallback) {
        this.taskCallback(task)
        tasksGenerated++
      }
    }
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
