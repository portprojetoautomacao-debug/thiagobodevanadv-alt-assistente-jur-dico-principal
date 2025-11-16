import { createAgentTask, type AgentTask } from './agents'

export interface TaskGeneratorConfig {
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
  'mrs-justin-e': [
    { type: 'analyze_document' as const, priority: 'high' as const },
  ],
  'precedent-researcher': [
    { type: 'research_precedents' as const, priority: 'medium' as const },
  ],
  'risk-analyst': [
    { type: 'risk_analysis' as const, priority: 'high' as const },
  ],
  'contract-reviewer': [
    { type: 'contract_review' as const, priority: 'medium' as const },
  ],
  'client-communicator': [
    { type: 'client_communication' as const, priority: 'medium' as const },
  ],
  'billing-analyst': [
    { type: 'billing_analysis' as const, priority: 'low' as const },
  ],
  'strategy-advisor': [
    { type: 'case_strategy' as const, priority: 'high' as const },
  ],
  'legal-translator': [
    { type: 'legal_translation' as const, priority: 'low' as const },
  ],
  'compliance-checker': [
    { type: 'compliance_check' as const, priority: 'high' as const },
  ],
}

export class AgentTaskGenerator {
  private config: TaskGeneratorConfig
  private intervalId: NodeJS.Timeout | null = null
  private onTaskGenerated?: (task: AgentTask) => void

  constructor(config?: Partial<TaskGeneratorConfig>, onTaskGenerated?: (task: AgentTask) => void) {
    this.config = { ...defaultConfig, ...config }
    this.onTaskGenerated = onTaskGenerated
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
        
        const task = createAgentTask(
          randomAgentId,
          template.type,
          { 
            description: `Auto-generated task for ${randomAgentId}`,
            generatedAt: new Date().toISOString()
          },
          template.priority
        )

        if (this.onTaskGenerated) {
          this.onTaskGenerated(task)
        }
      }
    }
  }

  public setOnTaskGenerated(callback: (task: AgentTask) => void) {
    this.onTaskGenerated = callback
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

export function createTaskGenerator(config?: Partial<TaskGeneratorConfig>, onTaskGenerated?: (task: AgentTask) => void): AgentTaskGenerator {
  return new AgentTaskGenerator(config, onTaskGenerated)
}
