/**
 * Client para interagir com agentes reais (backend)
 * Substitui as simulações por chamadas reais à API
 */

import type { AgentTask, Agent, AgentTaskResult } from './agents'

interface ProcessTaskAPIResponse {
  result: AgentTaskResult
}

interface FetchTasksAPIResponse {
  tasks?: AgentTask[]
}

/**
 * Processa uma tarefa usando o backend real (Spark LLM)
 */
export async function processTaskWithRealAI(
  task: AgentTask,
  agent: Agent
): Promise<AgentTaskResult> {
  try {
    const response = await fetch('/api/agents/process-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task,
        agent: {
          id: agent.id,
          type: agent.type,
          name: agent.name
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as ProcessTaskAPIResponse

    if (!data || typeof data !== 'object' || !data.result) {
      throw new Error('Invalid API response: missing result')
    }

    return data.result
  } catch (error) {
    console.error('[Real Agent Client] Error processing task:', error)
    throw error
  }
}

/**
 * Busca tarefas pendentes do backend
 */
export async function fetchPendingTasks(agentId?: string): Promise<AgentTask[]> {
  try {
    const url = agentId
      ? `/api/agents/tasks?agentId=${encodeURIComponent(agentId)}&status=queued`
      : '/api/agents/tasks?status=queued'

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as FetchTasksAPIResponse

    return Array.isArray(data.tasks) ? data.tasks : []
  } catch (error) {
    console.error('[Real Agent Client] Error fetching tasks:', error)
    return []
  }
}

/**
 * Envia uma tarefa para a fila de processamento
 */
export async function queueTask(task: AgentTask): Promise<void> {
  try {
    const response = await fetch('/api/agents/queue-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task })
    })

    if (!response.ok) {
      throw new Error(`Failed to queue task: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('[Real Agent Client] Error queueing task:', error)
    throw error
  }
}

/**
 * Monitora DJEN usando o endpoint real
 */
export async function monitorDJEN(tribunais: string[]): Promise<any> {
  try {
    const response = await fetch('/api/djen/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tribunais })
    })

    if (!response.ok) {
      throw new Error(`DJEN API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Real Agent Client] Error monitoring DJEN:', error)
    throw error
  }
}

/**
 * Calcula prazos usando lógica real de dias úteis
 */
export async function calculateRealDeadline(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): Promise<any> {
  try {
    const response = await fetch('/api/deadline/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        businessDays,
        tribunalCode
      })
    })

    if (!response.ok) {
      throw new Error(`Deadline API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Real Agent Client] Error calculating deadline:', error)
    throw error
  }
}

/**
 * Verifica se o modo de agentes reais está habilitado
 * SEMPRE retorna true - não há mais modo simulado
 */
export function isRealAgentsEnabled(): boolean {
  // Agentes SEMPRE usam IA real - não há mais modo simulado
  return true
}

/**
 * @deprecated Modo simulado foi removido. Agentes sempre usam IA real.
 */
export function setRealAgentsMode(_enabled: boolean): void {
  console.warn(
    '[DEPRECATED] setRealAgentsMode: Modo simulado foi removido. Agentes sempre usam IA real.'
  )
  // Função mantida apenas para compatibilidade - não faz nada
}
