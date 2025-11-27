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
const AGENTS_DATA_VERSION = 3

export function useAutonomousAgents() {
  const [dataVersion, setDataVersion] = useKV<number>('agents-data-version', 0)
  const [agents, setAgents] = useKV<Agent[]>('autonomous-agents', initializeAgents())
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

  // Force reset if data version is outdated (clears old data from previous versions)
  useEffect(() => {
    if (dataVersion < AGENTS_DATA_VERSION) {
      console.log('Resetting agent data for new version...')
      setAgents(initializeAgents())
      setTaskQueue([])
      setCompletedTasks([])
      setActivityLog([])
      setDataVersion(AGENTS_DATA_VERSION)
    }
  }, [dataVersion, setDataVersion, setAgents, setTaskQueue, setCompletedTasks, setActivityLog])

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
