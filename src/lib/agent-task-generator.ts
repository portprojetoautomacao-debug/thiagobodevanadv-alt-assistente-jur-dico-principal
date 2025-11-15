import { createAgentTask, type AgentTask } from './agents'

interface TaskGeneratorConfig {
  enabled: boolean
  intervalMinutes: number
  maxTasksPerInterval: number
  agentIds: string[]
}

const defaultConfig: TaskGeneratorConfig = {
  enabled: false,
  intervalMinutes: 5,
  maxTasksPerInterval: 3,
  agentIds: [],
}

const taskTemplates = {
  'doc-analyzer': [
    { type: 'analyze_document' as const, priority: 'medium' as const },
  ],
  'djen-monitor': [
    { type: 'monitor_djen' as const, priority: 'high' as const },
  ],
  'deadline-tracker': [
    { type: 'calculate_deadline' as const, priority: 'high' as const },
  ],
  'petition-writer': [
    { type: 'draft_petition' as const, priority: 'medium' as const },
  ],
  'datajud-query': [
    { type: 'check_datajud' as const, priority: 'medium' as const },
  ],
  'file-organizer': [
    { type: 'organize_files' as const, priority: 'low' as const },
  ],
}

export class AgentTaskGenerator {
  private config: TaskGeneratorConfig
  private intervalId: NodeJS.Timeout | null = null

  constructor(config?: Partial<TaskGeneratorConfig>) {
    this.config = { ...defaultConfig, ...config }
  }

  public start() {
    if (!this.config.enabled) {
      return
    }

    if (this.intervalId) {
      this.stop()
    }

    this.intervalId = setInterval(() => {
      this.generateTasks()
    }, this.config.intervalMinutes * 60 * 1000)

    this.generateTasks()
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private generateTasks() {
    const agentIds = this.config.agentIds.length > 0 
      ? this.config.agentIds 
      : Object.keys(taskTemplates)

    const tasksToGenerate = Math.min(
      this.config.maxTasksPerInterval,
      agentIds.length
    )

    for (let i = 0; i < tasksToGenerate; i++) {
      const randomAgentId = agentIds[Math.floor(Math.random() * agentIds.length)]
      const templates = taskTemplates[randomAgentId as keyof typeof taskTemplates]
      
      if (templates && templates.length > 0) {
        const template = templates[Math.floor(Math.random() * templates.length)]
        
        createAgentTask({
          agentId: randomAgentId,
          type: template.type,
          priority: template.priority,
          description: `Auto-generated task for ${randomAgentId}`,
        })
      }
    }
  }

  public updateConfig(config: Partial<TaskGeneratorConfig>) {
    this.config = { ...this.config, ...config }
    
    if (this.config.enabled && !this.intervalId) {
      this.start()
    } else if (!this.config.enabled && this.intervalId) {
      this.stop()
    }
  }

  public getConfig(): TaskGeneratorConfig {
    return { ...this.config }
  }
}

export const taskGenerator = new AgentTaskGenerator()
