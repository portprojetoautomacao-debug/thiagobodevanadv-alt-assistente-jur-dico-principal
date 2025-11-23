/**
 * Agent Communication System
 * 
 * Enables agents to share information, request help from other agents,
 * and maintain shared context
 */

import type { Agent, AgentTask } from './agents'

export interface AgentMessage {
  id: string
  fromAgentId: string
  toAgentId?: string // undefined means broadcast
  type: 'request' | 'response' | 'notification' | 'alert'
  priority: 'low' | 'medium' | 'high' | 'critical'
  content: string
  data?: Record<string, unknown>
  timestamp: string
  relatedTaskId?: string
}

export interface SharedContext {
  id: string
  type: string
  data: Record<string, unknown>
  createdBy: string
  createdAt: string
  updatedAt: string
  accessibleBy: string[] // Agent IDs that can access this context
}

class AgentCommunicationHub {
  private messages: AgentMessage[] = []
  private contexts: Map<string, SharedContext> = new Map()
  private subscribers: Map<string, Set<(message: AgentMessage) => void>> = new Map()

  /**
   * Sends a message from one agent to another (or broadcast)
   */
  sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
    const fullMessage: AgentMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    this.messages.push(fullMessage)

    // Keep only last 1000 messages
    if (this.messages.length > 1000) {
      this.messages = this.messages.slice(-1000)
    }

    // Notify subscribers
    if (message.toAgentId) {
      const subscribers = this.subscribers.get(message.toAgentId)
      subscribers?.forEach(callback => callback(fullMessage))
    } else {
      // Broadcast to all subscribers
      this.subscribers.forEach(subscribers => {
        subscribers.forEach(callback => callback(fullMessage))
      })
    }

    return fullMessage
  }

  /**
   * Subscribes an agent to receive messages
   */
  subscribe(agentId: string, callback: (message: AgentMessage) => void): () => void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set())
    }

    this.subscribers.get(agentId)!.add(callback)

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(agentId)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          this.subscribers.delete(agentId)
        }
      }
    }
  }

  /**
   * Gets messages for a specific agent
   */
  getMessages(agentId: string, limit: number = 50): AgentMessage[] {
    return this.messages
      .filter(m => m.toAgentId === agentId || !m.toAgentId)
      .slice(-limit)
  }

  /**
   * Creates or updates shared context
   */
  setContext(context: Omit<SharedContext, 'id' | 'createdAt' | 'updatedAt'>): SharedContext {
    const existingContext = Array.from(this.contexts.values())
      .find(c => c.type === context.type && c.createdBy === context.createdBy)

    if (existingContext) {
      const updated: SharedContext = {
        ...existingContext,
        data: { ...existingContext.data, ...context.data },
        updatedAt: new Date().toISOString()
      }
      this.contexts.set(updated.id, updated)
      return updated
    }

    const newContext: SharedContext = {
      ...context,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.contexts.set(newContext.id, newContext)
    return newContext
  }

  /**
   * Gets shared context accessible by an agent
   */
  getContext(agentId: string, type?: string): SharedContext[] {
    return Array.from(this.contexts.values())
      .filter(c => 
        c.accessibleBy.includes(agentId) || c.accessibleBy.includes('*')
      )
      .filter(c => !type || c.type === type)
  }

  /**
   * Requests help from another agent
   */
  requestHelp(
    fromAgent: Agent,
    toAgentId: string,
    task: AgentTask,
    reason: string
  ): AgentMessage {
    return this.sendMessage({
      fromAgentId: fromAgent.id,
      toAgentId,
      type: 'request',
      priority: task.priority,
      content: `Help requested: ${reason}`,
      data: {
        task,
        reason,
        requestType: 'help'
      },
      relatedTaskId: task.id
    })
  }

  /**
   * Broadcasts an alert to all agents
   */
  broadcastAlert(
    fromAgentId: string,
    message: string,
    data?: Record<string, unknown>
  ): AgentMessage {
    return this.sendMessage({
      fromAgentId,
      type: 'alert',
      priority: 'high',
      content: message,
      data
    })
  }

  /**
   * Clears old messages and contexts
   */
  cleanup(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)

    // Clean messages
    this.messages = this.messages.filter(m => 
      new Date(m.timestamp).getTime() > cutoffTime
    )

    // Clean contexts
    Array.from(this.contexts.entries()).forEach(([id, context]) => {
      if (new Date(context.updatedAt).getTime() < cutoffTime) {
        this.contexts.delete(id)
      }
    })
  }

  /**
   * Gets communication statistics
   */
  getStats(): {
    totalMessages: number
    messagesByType: Record<string, number>
    activeContexts: number
    subscribedAgents: number
  } {
    const messagesByType: Record<string, number> = {}
    
    this.messages.forEach(m => {
      messagesByType[m.type] = (messagesByType[m.type] || 0) + 1
    })

    return {
      totalMessages: this.messages.length,
      messagesByType,
      activeContexts: this.contexts.size,
      subscribedAgents: this.subscribers.size
    }
  }
}

/**
 * Global communication hub instance
 */
export const communicationHub = new AgentCommunicationHub()

/**
 * Helper function to create a notification message
 */
export function notifyAgents(
  fromAgentId: string,
  message: string,
  data?: Record<string, unknown>
): void {
  communicationHub.sendMessage({
    fromAgentId,
    type: 'notification',
    priority: 'medium',
    content: message,
    data
  })
}

/**
 * Helper function to share context between agents
 */
export function shareContext(
  agentId: string,
  type: string,
  data: Record<string, unknown>,
  accessibleBy: string[] = ['*']
): SharedContext {
  return communicationHub.setContext({
    type,
    data,
    createdBy: agentId,
    accessibleBy
  })
}
