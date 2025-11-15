import { createAgentTask, type AgentTask } from './agents'

  intervalMinutes: number
  agentIds: string
  intervalMinutes: number
  enabled: false,
  maxTasksPerInterva
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
    
  'djen-monitor': [
    { type: 'monitor_djen' as const, priority: 'high' as const },
  co
  'deadline-tracker': [
    { type: 'calculate_deadline' as const, priority: 'high' as const },
  ],
  'petition-writer': [
    { type: 'draft_petition' as const, priority: 'medium' as const },
  ],
  'datajud-query': [
    { type: 'check_datajud' as const, priority: 'medium' as const },
  ],
      this.intervalId
    { type: 'organize_files' as const, priority: 'low' as const },
  pr
}

export class AgentTaskGenerator {
  private config: TaskGeneratorConfig
  private intervalId: NodeJS.Timeout | null = null

  constructor(config?: Partial<TaskGeneratorConfig>) {
      }
  }

  public start() {
    if (!this.config.enabled) {
      return


    if (this.intervalId) {
      this.stop()
    t

    }
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













































