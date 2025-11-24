/**
 * Agent Orchestrator
 * 
 * Coordinates multiple AI agents, manages task distribution,
 * and handles inter-agent communication
 */

import type { Agent, AgentTask, AgentTaskResult } from './agents'
import { processTaskWithAI, shouldPauseForHuman } from './agents'
import { processTaskWithRealAI, isRealAgentsEnabled } from './real-agent-client'

export interface OrchestrationConfig {
  maxConcurrentTasks: number
  taskTimeout: number
  enableLoadBalancing: boolean
  enablePrioritization: boolean
  useRealAI: boolean
}

export interface OrchestrationMetrics {
  totalTasksProcessed: number
  successRate: number
  averageProcessingTime: number
  activeAgents: number
  queuedTasks: number
}

export class AgentOrchestrator {
  private config: OrchestrationConfig
  private processingTasks: Map<string, AgentTask> = new Map()
  private metrics: OrchestrationMetrics = {
    totalTasksProcessed: 0,
    successRate: 0,
    averageProcessingTime: 0,
    activeAgents: 0,
    queuedTasks: 0
  }

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 300000, // 5 minutes
      enableLoadBalancing: true,
      enablePrioritization: true,
      useRealAI: false,
      ...config
    }
  }

  /**
   * Distributes tasks to appropriate agents based on capabilities
   */
  async distributeTask(
    task: AgentTask,
    agents: Agent[]
  ): Promise<Agent | null> {
    // Find agents capable of handling this task
    const capableAgents = agents.filter(agent => {
      if (!agent.enabled || agent.status === 'paused') return false
      
      // Check if agent has required capabilities
      const taskType = task.type.toLowerCase()
      const capabilities = agent.capabilities || []
      
      return capabilities.some(cap => 
        taskType.includes(cap.toLowerCase()) ||
        agent.type.toLowerCase().includes(taskType)
      )
    })

    if (capableAgents.length === 0) {
      console.warn(`No capable agent found for task type: ${task.type}`)
      return null
    }

    // Load balancing: choose agent with least current tasks
    if (this.config.enableLoadBalancing) {
      capableAgents.sort((a, b) => {
        const aLoad = Array.from(this.processingTasks.values())
          .filter(t => t.agentId === a.id).length
        const bLoad = Array.from(this.processingTasks.values())
          .filter(t => t.agentId === b.id).length
        return aLoad - bLoad
      })
    }

    return capableAgents[0]
  }

  /**
   * Processes a task with the appropriate agent
   */
  async processTask(
    task: AgentTask,
    agent: Agent,
    onProgress?: (progress: number) => void
  ): Promise<AgentTaskResult> {
    // Check if we've reached max concurrent tasks
    if (this.processingTasks.size >= this.config.maxConcurrentTasks) {
      throw new Error('Max concurrent tasks reached')
    }

    // Check if task requires human review
    if (shouldPauseForHuman(agent, task)) {
      return {
        success: false,
        message: 'Task requires human review',
        data: { requiresHumanReview: true }
      }
    }

    this.processingTasks.set(task.id, task)
    const startTime = Date.now()

    try {
      // Set timeout for task processing
      const timeoutPromise = new Promise<AgentTaskResult>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.config.taskTimeout)
      })

      // Process task with AI
      const processPromise = this.config.useRealAI && isRealAgentsEnabled()
        ? processTaskWithRealAI(task, agent)
        : processTaskWithAI(task, agent)

      const result = await Promise.race([processPromise, timeoutPromise])

      // Update metrics
      const processingTime = Date.now() - startTime
      this.updateMetrics(true, processingTime)

      return result

    } catch (error) {
      const processingTime = Date.now() - startTime
      this.updateMetrics(false, processingTime)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Task processing failed'
      }

    } finally {
      this.processingTasks.delete(task.id)
    }
  }

  /**
   * Prioritizes tasks in the queue
   */
  prioritizeTasks(tasks: AgentTask[]): AgentTask[] {
    if (!this.config.enablePrioritization) {
      return tasks
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    
    return [...tasks].sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then by creation time (older first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  /**
   * Checks agent health and availability
   */
  checkAgentHealth(agent: Agent): {
    healthy: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Check if agent is stuck processing
    const agentTasks = Array.from(this.processingTasks.values())
      .filter(t => t.agentId === agent.id)

    agentTasks.forEach(task => {
      const taskAge = Date.now() - new Date(task.createdAt).getTime()
      if (taskAge > this.config.taskTimeout) {
        issues.push(`Task ${task.id} has been processing for too long`)
      }
    })

    // Check if agent has too many tasks
    if (agentTasks.length > 3) {
      issues.push(`Agent has ${agentTasks.length} concurrent tasks (high load)`)
    }

    return {
      healthy: issues.length === 0,
      issues
    }
  }

  /**
   * Gets current orchestration metrics
   */
  getMetrics(): OrchestrationMetrics {
    return {
      ...this.metrics,
      queuedTasks: this.processingTasks.size
    }
  }

  /**
   * Updates internal metrics
   */
  private updateMetrics(success: boolean, processingTime: number): void {
    this.metrics.totalTasksProcessed++
    
    // Update success rate
    const successCount = Math.round(this.metrics.successRate * (this.metrics.totalTasksProcessed - 1))
    this.metrics.successRate = (successCount + (success ? 1 : 0)) / this.metrics.totalTasksProcessed

    // Update average processing time
    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalTasksProcessed - 1)
    this.metrics.averageProcessingTime = (totalTime + processingTime) / this.metrics.totalTasksProcessed
  }

  /**
   * Resets orchestrator state
   */
  reset(): void {
    this.processingTasks.clear()
    this.metrics = {
      totalTasksProcessed: 0,
      successRate: 0,
      averageProcessingTime: 0,
      activeAgents: 0,
      queuedTasks: 0
    }
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<OrchestrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

/**
 * Singleton instance for global orchestration
 */
export const globalOrchestrator = new AgentOrchestrator()
