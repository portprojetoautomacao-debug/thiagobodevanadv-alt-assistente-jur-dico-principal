import { useEffect, useCallback, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Agent, AgentTask } from '@/lib/agents'
import { 
  getAgentActivity, 
  processTaskWithAI, 
  shouldPauseForHuman,
  canResumeAfterHuman 
} from '@/lib/agents'

export function useAutonomousAgents() {
  const [agents, setAgents] = useKV<Agent[]>('autonomous-agents', [])
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
      const result = await processTaskWithAI(task, agent)

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
                tasksCompleted: a.tasksCompleted + 1,
                tasksToday: a.tasksToday + 1,
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

  useEffect(() => {
    const interval = setInterval(() => {
      const currentAgents = agents || []
      
      currentAgents.forEach(agent => {
        if (agent.enabled && agent.continuousMode) {
          processNextTask(agent)
        }
      })

      setAgents((current) => 
        (current || []).map(agent => {
          if (!agent.enabled || !agent.continuousMode) return agent
          
          const activity = getAgentActivity(agent)
          
          if (activity !== agent.lastActivity && Math.random() > 0.5) {
            return { ...agent, lastActivity: activity }
          }
          
          return agent
        })
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [agents, processNextTask, setAgents])

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
