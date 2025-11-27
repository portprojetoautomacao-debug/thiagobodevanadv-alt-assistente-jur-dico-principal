import { useEffect, useCallback, useRef } from 'react'
import { useKV } from '@/hooks/use-kv'
import {
  processTaskWithRealAI
} from '@/lib/real-agent-client'
import {
  type Agent,
  type AgentTask,
  shouldPauseForHuman,
  canResumeAfterHuman,
  initializeAgents
} from '@/lib/agents'

function getAgentActivity(agent: Agent): string {
  if (agent.status === 'processing') return 'Processando tarefa...'
  return 'Aguardando tarefas'
}

// Version flag to force data reset when structure changes
// INCREMENTADO para v6: força reset de agentes para usar apenas os 15 agentes do agents.ts
// Remove agentes duplicados/antigos que estavam salvos no KV storage
const AGENTS_DATA_VERSION = 6

// Verifica a versão no localStorage ANTES de inicializar
// Isso garante que dados antigos sejam limpos imediatamente
function getInitialAgents(): Agent[] {
  if (typeof window === 'undefined') return initializeAgents()

  try {
    const storedVersion = window.localStorage.getItem('agents-data-version')
    const version = storedVersion ? JSON.parse(storedVersion) : 0

    if (version < AGENTS_DATA_VERSION) {
      // Limpa dados antigos imediatamente
      console.log('[Agents] Versão desatualizada, limpando dados antigos...')
      window.localStorage.removeItem('autonomous-agents')
      window.localStorage.removeItem('agent-task-queue')
      window.localStorage.removeItem('completed-agent-tasks')
      window.localStorage.removeItem('agent-activity-log')
      window.localStorage.setItem('agents-data-version', JSON.stringify(AGENTS_DATA_VERSION))
      return initializeAgents()
    }

    // Carrega agentes existentes se versão estiver correta
    const storedAgents = window.localStorage.getItem('autonomous-agents')
    if (storedAgents) {
      const parsed = JSON.parse(storedAgents)
      // Valida se tem o número correto de agentes (15)
      if (Array.isArray(parsed) && parsed.length === 15) {
        return parsed
      }
      // Se não tem 15, reinicializa
      console.log('[Agents] Número incorreto de agentes, reinicializando...')
      return initializeAgents()
    }
  } catch (e) {
    console.error('[Agents] Erro ao carregar agentes:', e)
  }

  return initializeAgents()
}

export function useAutonomousAgents() {
  const [dataVersion, setDataVersion] = useKV<number>('agents-data-version', AGENTS_DATA_VERSION)
  const [agents, setAgents] = useKV<Agent[]>('autonomous-agents', getInitialAgents())
  const [taskQueue, setTaskQueue] = useKV<AgentTask[]>('agent-task-queue', [])
  const [completedTasks, setCompletedTasks] = useKV<AgentTask[]>('completed-agent-tasks', [])
  const [activityLog, setActivityLog] = useKV<Array<{
    id: string
    agentId: string
    timestamp: string
    action: string
    result: 'success' | 'warning' | 'error'
  }>>('agent-activity-log', [])

  const processingRef = useRef<Set<string>>(new Set())

  // Validação adicional: garante que sempre temos exatamente 15 agentes
  useEffect(() => {
    if (agents && agents.length !== 15) {
      console.log('[Agents] Corrigindo número de agentes:', agents.length, '-> 15')
      setAgents(initializeAgents())
    }
  }, [agents, setAgents])

  const addTask = useCallback((task: AgentTask) => {
    setTaskQueue((current) => {
      const updated = [...(current || []), task]
      updated.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })
      return updated
    })
  }, [setTaskQueue])

  const logActivity = useCallback((agentId: string, action: string, result: 'success' | 'warning' | 'error' = 'success') => {
    setActivityLog((current) => {
      const log = {
        id: crypto.randomUUID(),
        agentId,
        timestamp: new Date().toISOString(),
        action,
        result,
      }
      return [log, ...(current || [])].slice(0, 100)
    })
  }, [setActivityLog])

  const processNextTask = useCallback(async (agent: Agent) => {
    if (processingRef.current.has(agent.id)) return
    if (!agent.enabled || agent.status === 'paused') return

    const queue = (taskQueue || []).filter(t =>
      t.agentId === agent.id &&
      t.status === 'queued' &&
      canResumeAfterHuman(t)
    )

    if (queue.length === 0) {
      setAgents((current) =>
        (current || []).map(a =>
          a.id === agent.id
            ? { ...a, status: 'idle', currentTask: undefined }
            : a
        )
      )
      return
    }

    const task = queue[0]

    if (shouldPauseForHuman(agent, task)) {
      setAgents((current) =>
        (current || []).map(a =>
          a.id === agent.id
            ? { ...a, status: 'waiting_human', currentTask: task }
            : a
        )
      )
      return
    }

    processingRef.current.add(agent.id)

    setTaskQueue((current) =>
      (current || []).map(t =>
        t.id === task.id
          ? { ...t, status: 'processing', startedAt: new Date().toISOString() }
          : t
      )
    )

    setAgents((current) =>
      (current || []).map(a =>
        a.id === agent.id
          ? { ...a, status: 'processing', currentTask: task }
          : a
      )
    )

    try {
      // Sempre usar IA real (Gemini/OpenAI) - não usar simulação
      const result = await processTaskWithRealAI(task, agent)

      const completedTask: AgentTask = {
        ...task,
        status: 'completed',
        completedAt: new Date().toISOString(),
        result,
      }

      setTaskQueue((current) =>
        (current || []).filter(t => t.id !== task.id)
      )

      setCompletedTasks((current) =>
        [completedTask, ...(current || [])].slice(0, 500)
      )

      setAgents((current) =>
        (current || []).map(a =>
          a.id === agent.id
            ? {
              ...a,
              lastActivity: `Concluído: ${task.type}`,
            }
            : a
        )
      )

      logActivity(agent.id, `Tarefa concluída: ${task.type}`, 'success')

    } catch (error) {
      setTaskQueue((current) =>
        (current || []).map(t =>
          t.id === task.id
            ? { ...t, status: 'failed', error: String(error) }
            : t
        )
      )

      logActivity(agent.id, `Erro ao processar: ${task.type}`, 'error')

    } finally {
      processingRef.current.delete(agent.id)
    }
  }, [taskQueue, setTaskQueue, setAgents, setCompletedTasks, logActivity])

  // Store the processNextTask function in a ref to avoid re-renders
  const processNextTaskRef = useRef(processNextTask)

  // Update the ref when processNextTask changes
  useEffect(() => {
    processNextTaskRef.current = processNextTask
  }, [processNextTask])

  useEffect(() => {
    const interval = setInterval(() => {
      const currentAgents = agents || []

      currentAgents.forEach(agent => {
        if (agent.enabled && agent.continuousMode) {
          // Use the ref to avoid triggering re-renders
          processNextTaskRef.current(agent)
        }
      })

      // Update agent activities periodically
      setAgents((current) =>
        (current || []).map(agent => {
          if (!agent.enabled || !agent.continuousMode) return agent

          const activity = getAgentActivity(agent)

          if (activity !== agent.lastActivity) {
            return { ...agent, lastActivity: activity }
          }

          return agent
        })
      )
    }, 5000) // Increased interval from 3s to 5s

    return () => clearInterval(interval)
  }, [agents, setAgents]) // Removed processNextTask from dependencies

  useEffect(() => {
    const resetDailyCounters = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)

      const timeUntilMidnight = midnight.getTime() - now.getTime()

      const timeout = setTimeout(() => {
        setAgents((current) =>
          (current || []).map(agent => ({
            ...agent,
          }))
        )

        const dailyInterval = setInterval(() => {
          setAgents((current) =>
            (current || []).map(agent => ({
              ...agent,
            }))
          )
        }, 24 * 60 * 60 * 1000)

        return () => clearInterval(dailyInterval)
      }, timeUntilMidnight)

      return () => clearTimeout(timeout)
    }

    return resetDailyCounters()
  }, [])

  const toggleAgent = useCallback((agentId: string) => {
    setAgents((current) =>
      (current || []).map(agent => {
        if (agent.id === agentId) {
          const newEnabled = !agent.enabled
          return {
            ...agent,
            enabled: newEnabled,
            status: newEnabled ? 'active' : 'paused',
            lastActivity: newEnabled ? 'Iniciando...' : 'Pausado pelo usuário',
          }
        }
        return agent
      })
    )
  }, [setAgents])

  const markTaskAsHumanTouched = useCallback((taskId: string) => {
    setTaskQueue((current) =>
      (current || []).map(t =>
        t.id === taskId
          ? { ...t, humanTouchedAt: new Date().toISOString(), status: 'human_intervention' }
          : t
      )
    )
  }, [setTaskQueue])

  const resumeTaskAfterHuman = useCallback((taskId: string) => {
    setTaskQueue((current) =>
      (current || []).map(t =>
        t.id === taskId
          ? { ...t, status: 'queued', resumeAfterHuman: true }
          : t
      )
    )
  }, [setTaskQueue])

  return {
    agents: agents || [],
    taskQueue: taskQueue || [],
    completedTasks: completedTasks || [],
    activityLog: activityLog || [],
    addTask,
    toggleAgent,
    markTaskAsHumanTouched,
    resumeTaskAfterHuman,
    setAgents,
  }
}
