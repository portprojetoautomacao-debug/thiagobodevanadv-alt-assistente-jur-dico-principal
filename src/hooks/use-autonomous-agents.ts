import { useEffect, useCallback, useRef, useState } from 'react'
import { useKV } from '@/hooks/use-kv'
import {
  processTaskWithRealAI,
  processTaskWithStreamingAI
} from '@/lib/real-agent-client'
import {
  type Agent,
  type AgentTask,
  shouldPauseForHuman,
  canResumeAfterHuman,
  initializeAgents
} from '@/lib/agents'

// ===========================
// Types for callbacks
// ===========================

interface StreamingCallbacks {
  onChunk: (chunk: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

// ===========================
// Helper Functions
// ===========================

function getAgentActivity(agent: Agent): string {
  if (agent.status === 'processing') return 'Processando tarefa...'
  return 'Aguardando tarefas'
}

/**
 * Creates streaming callbacks for an agent - extracted to reduce nesting (S2004)
 */
function createStreamingCallbacks(
  agentId: string,
  setStreamingContent: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAgents: (fn: (current: Agent[] | null) => Agent[]) => void,
  logActivity: (agentId: string, action: string, result: 'success' | 'warning' | 'error') => void
): StreamingCallbacks {
  return {
    onChunk: (chunk: string) => {
      setStreamingContent(prev => ({
        ...prev,
        [agentId]: (prev[agentId] || '') + chunk
      }))

      // Update last activity with preview
      setAgents(current =>
        (current || []).map(a =>
          a.id === agentId
            ? {
              ...a,
              lastActivity: `Gerando: ${chunk.substring(0, 50)}...`
            }
            : a
        )
      )
    },
    onComplete: () => {
      // Clear streaming content when complete
      setStreamingContent(prev => {
        const { [agentId]: _, ...rest } = prev
        return rest
      })
    },
    onError: (error: Error) => {
      console.error(`[Agent ${agentId}] Streaming error:`, error)
      logActivity(agentId, `Erro streaming: ${error.message}`, 'error')
    }
  }
}

/**
 * Handles task completion - extracted to reduce nesting (S2004)
 */
function handleTaskCompletion(
  task: AgentTask,
  result: AgentTask['result'],
  agentId: string,
  setTaskQueue: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  setCompletedTasks: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  setAgents: (fn: (current: Agent[] | null) => Agent[]) => void,
  logActivity: (agentId: string, action: string, result: 'success' | 'warning' | 'error') => void
): void {
  const completed: AgentTask = {
    ...task,
    status: 'completed',
    completedAt: new Date().toISOString(),
    result
  }

  setTaskQueue(current => (current || []).filter(t => t.id !== task.id))
  setCompletedTasks(current => [completed, ...(current || [])].slice(0, 500))
  setAgents(current =>
    updateAgentInList(current || [], agentId, { lastActivity: `Concluído: ${task.type}` })
  )
  logActivity(agentId, `Tarefa concluída: ${task.type}`, 'success')
}

/**
 * Handles task failure - extracted to reduce nesting (S2004)
 */
function handleTaskFailure(
  task: AgentTask,
  error: unknown,
  agentId: string,
  setTaskQueue: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  logActivity: (agentId: string, action: string, result: 'success' | 'warning' | 'error') => void
): void {
  setTaskQueue(current =>
    updateTaskInQueue(current || [], task.id, { status: 'failed', error: String(error) })
  )
  logActivity(agentId, `Erro no processamento: ${task.type}`, 'error')
}

function sortTasksByPriority(tasks: AgentTask[]): AgentTask[] {
  const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  return tasks.sort((a, b) => order[a.priority] - order[b.priority])
}

function updateAgentInList(agents: Agent[], agentId: string, updates: Partial<Agent>): Agent[] {
  return agents.map(a => a.id === agentId ? { ...a, ...updates } : a)
}

function updateTaskInQueue(tasks: AgentTask[], taskId: string, updates: Partial<AgentTask>): AgentTask[] {
  return tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
}

function getQueuedTasksForAgent(queue: AgentTask[], agentId: string): AgentTask[] {
  return queue.filter(
    t => t.agentId === agentId && t.status === 'queued' && canResumeAfterHuman(t)
  )
}

function isDataVersionOutdated(storedVersion: number, currentVersion: number): boolean {
  return storedVersion < currentVersion
}

function clearOutdatedLocalStorage(): void {
  console.log('[Agents] Versão desatualizada → limpando dados locais…')
  window.localStorage.removeItem('autonomous-agents')
  window.localStorage.removeItem('agent-task-queue')
  window.localStorage.removeItem('completed-agent-tasks')
  window.localStorage.removeItem('agent-activity-log')
}

/**
 * Incrementa sempre que a estrutura dos agentes mudar
 * Assim forçamos reset de dados antigos no localStorage
 */
const AGENTS_DATA_VERSION = 7

function getInitialAgents(): Agent[] {
  if (typeof window === 'undefined') return initializeAgents()

  try {
    const storedVersion = window.localStorage.getItem('agents-data-version')
    const version = storedVersion ? JSON.parse(storedVersion) : 0

    if (isDataVersionOutdated(version, AGENTS_DATA_VERSION)) {
      clearOutdatedLocalStorage()
      window.localStorage.setItem('agents-data-version', JSON.stringify(AGENTS_DATA_VERSION))
      return initializeAgents()
    }

    const storedAgents = window.localStorage.getItem('autonomous-agents')
    if (storedAgents) {
      const parsed = JSON.parse(storedAgents)
      if (Array.isArray(parsed) && parsed.length === 15) return parsed

      console.log('[Agents] Quantidade incorreta de agentes → reinicializando…')
      return initializeAgents()
    }
  } catch (e) {
    console.error('[Agents] Erro ao carregar agentes:', e)
  }

  return initializeAgents()
}

export function useAutonomousAgents() {
  const [_version, _setVersion] = useKV<number>('agents-data-version', AGENTS_DATA_VERSION)

  const [agents, setAgents] = useKV<Agent[]>('autonomous-agents', getInitialAgents())
  const [taskQueue, setTaskQueue] = useKV<AgentTask[]>('agent-task-queue', [])
  const [completedTasks, setCompletedTasks] = useKV<AgentTask[]>('completed-agent-tasks', [])
  const [activityLog, setActivityLog] = useKV<
    Array<{
      id: string
      agentId: string
      timestamp: string
      action: string
      result: 'success' | 'warning' | 'error'
    }>
  >('agent-activity-log', [])

  // Estado para logs do servidor e memória jurídica
  const [serverLogs, setServerLogs] = useState<unknown[]>([])
  const [legalMemory, setLegalMemory] = useState<unknown[]>([])

  // Estado para streaming em tempo real
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({})
  const [useStreaming, setUseStreaming] = useState(true) // Streaming habilitado por padrão

  const processingRef = useRef<Set<string>>(new Set())

  // Garante sempre 15 agentes
  useEffect(() => {
    if (agents && agents.length !== 15) {
      console.log('[Agents] Corrigindo → 15 agentes obrigatórios')
      setAgents(initializeAgents())
    }
  }, [agents, setAgents])

  // =============================
  // SYNC COM SERVIDOR (Logs e Memória)
  // =============================
  const fetchServerData = useCallback(async () => {
    try {
      // Fetch logs
      const logsRes = await fetch('/api/agents?action=logs')
      if (logsRes.ok) {
        const data = await logsRes.json()
        if (data.logs && Array.isArray(data.logs)) {
          setServerLogs(data.logs)
        }
      }

      // Fetch memory
      const memoryRes = await fetch('/api/agents?action=memory')
      if (memoryRes.ok) {
        const data = await memoryRes.json()
        if (data.memory && Array.isArray(data.memory)) {
          setLegalMemory(data.memory)
        }
      }
    } catch (error) {
      console.error('[Agents] Erro ao buscar dados do servidor:', error)
    }
  }, [])

  // Poll de dados do servidor a cada 30s
  useEffect(() => {
    fetchServerData()
    const interval = setInterval(fetchServerData, 30000)
    return () => clearInterval(interval)
  }, [fetchServerData])

  // =============================
  // TASK QUEUE
  // =============================

  const addTask = useCallback(
    (task: AgentTask) => {
      setTaskQueue(current => {
        const updated = [...(current || []), task]
        return sortTasksByPriority(updated)
      })
    },
    [setTaskQueue]
  )

  const logActivity = useCallback(
    (agentId: string, action: string, result: 'success' | 'warning' | 'error' = 'success') => {
      setActivityLog(current => {
        const log = {
          id: crypto.randomUUID(),
          agentId,
          timestamp: new Date().toISOString(),
          action,
          result
        }
        return [log, ...(current || [])].slice(0, 100)
      })
    },
    [setActivityLog]
  )

  // =============================
  // CORE: PROCESSAMENTO DE TAREFAS
  // =============================
  const processNextTask = useCallback(
    async (agent: Agent) => {
      if (processingRef.current.has(agent.id)) return
      if (!agent.enabled || agent.status === 'paused') return

      const queue = getQueuedTasksForAgent(taskQueue || [], agent.id)

      if (queue.length === 0) {
        setAgents(current =>
          updateAgentInList(current || [], agent.id, { status: 'idle', currentTask: undefined })
        )
        return
      }

      const task = queue[0]

      // Filtro de segurança → não regras de autonomia
      if (shouldPauseForHuman(agent, task)) {
        setAgents(current =>
          updateAgentInList(current || [], agent.id, { status: 'waiting_human', currentTask: task })
        )
        return
      }

      processingRef.current.add(agent.id)

      // Status: Processing
      setTaskQueue(current =>
        updateTaskInQueue(current || [], task.id, { status: 'processing', startedAt: new Date().toISOString() })
      )

      setAgents(current =>
        updateAgentInList(current || [], agent.id, { status: 'processing', currentTask: task })
      )

      try {
        let result

        if (useStreaming) {
          // Create callbacks using extracted helper (S2004 compliance)
          const callbacks = createStreamingCallbacks(agent.id, setStreamingContent, setAgents, logActivity)
          result = await processTaskWithStreamingAI(task, agent, callbacks)
        } else {
          // Fallback para processamento sem streaming
          result = await processTaskWithRealAI(task, agent)
        }

        // Use extracted helper for completion (S2004 compliance)
        handleTaskCompletion(task, result, agent.id, setTaskQueue, setCompletedTasks, setAgents, logActivity)
      } catch (err) {
        // Use extracted helper for failure (S2004 compliance)
        handleTaskFailure(task, err, agent.id, setTaskQueue, logActivity)
      } finally {
        processingRef.current.delete(agent.id)
      }
    },
    [taskQueue, setTaskQueue, setAgents, setCompletedTasks, logActivity, useStreaming]
  )

  const processNextTaskRef = useRef(processNextTask)

  useEffect(() => {
    processNextTaskRef.current = processNextTask
  }, [processNextTask])

  // Loop contínuo de processamento
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAgents = agents || []

      currentAgents.forEach(agent => {
        if (agent.enabled && agent.continuousMode) {
          processNextTaskRef.current(agent)
        }
      })

      // Atualização visual (status de atividade)
      setAgents(current =>
        (current || []).map(a => {
          if (!a.enabled || !a.continuousMode) return a
          const activity = getAgentActivity(a)
          if (activity !== a.lastActivity) return { ...a, lastActivity: activity }
          return a
        })
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [agents, setAgents])

  // =============================
  // RESET DIÁRIO (local)
  // =============================
  useEffect(() => {
    const resetDailyCounters = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)

      const timeUntilMidnight = midnight.getTime() - now.getTime()

      const timeout = setTimeout(() => {
        setAgents(current =>
          (current || []).map(agent => ({
            ...agent
          }))
        )

        const interval = setInterval(() => {
          setAgents(current =>
            (current || []).map(agent => ({
              ...agent
            }))
          )
        }, 24 * 60 * 60 * 1000)

        return () => clearInterval(interval)
      }, timeUntilMidnight)

      return () => clearTimeout(timeout)
    }

    return resetDailyCounters()
  }, [])

  // =============================
  // CONTROLES DO USUÁRIO
  // =============================

  const toggleAgent = useCallback(
    (agentId: string) => {
      setAgents(current => {
        const agent = (current || []).find(a => a.id === agentId)
        if (!agent) return current || []

        const isNowEnabled = !agent.enabled
        return updateAgentInList(current || [], agentId, {
          enabled: isNowEnabled,
          status: isNowEnabled ? 'active' : 'paused',
          lastActivity: isNowEnabled ? 'Iniciando…' : 'Pausado pelo usuário'
        })
      })
    },
    [setAgents]
  )

  const markTaskAsHumanTouched = useCallback(
    (taskId: string) => {
      setTaskQueue(current =>
        updateTaskInQueue(current || [], taskId, {
          humanTouchedAt: new Date().toISOString(),
          status: 'human_intervention'
        })
      )
    },
    [setTaskQueue]
  )

  const resumeTaskAfterHuman = useCallback(
    (taskId: string) => {
      setTaskQueue(current =>
        updateTaskInQueue(current || [], taskId, { status: 'queued', resumeAfterHuman: true })
      )
    },
    [setTaskQueue]
  )

  // Toggle streaming mode
  const toggleStreaming = useCallback(() => {
    setUseStreaming(prev => !prev)
  }, [])

  return {
    agents: agents || [],
    taskQueue: taskQueue || [],
    completedTasks: completedTasks || [],
    activityLog: activityLog || [],
    serverLogs, // Logs persistentes do servidor
    legalMemory, // Memória jurídica compartilhada
    refreshServerData: fetchServerData, // Função para forçar atualização
    // Streaming state
    streamingContent,
    isStreamingEnabled: useStreaming,
    // Actions
    addTask,
    toggleAgent,
    toggleStreaming,
    markTaskAsHumanTouched,
    resumeTaskAfterHuman,
    setAgents
  }
}
