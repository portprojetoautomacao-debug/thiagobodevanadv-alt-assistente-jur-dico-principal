import { createAgentTask, type AgentTask } from './agents'

  intervalMinutes: number
  agentIds: string
  intervalMinutes: number
  enabled: true,
  maxTasksPerInterva
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
  'file-organizer': [
  ],
    
  ]

  private config: TaskGeneratorConfig
  pr
  constructor(config: P
  }
  public setTaskCallback(callback: (task: AgentTask) => void) {
  }
  pu
      console.warn('Ta
    }
    if (!this.config.enabled) {
    

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



      this.start()
  }

  }

  return new AgentTaskGenerator(conf


































































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
