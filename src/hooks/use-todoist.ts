import { useEffect, useState } from 'react'
import { todoistClient } from '@/lib/todoist-client'
import type { Task, Project } from '@doist/todoist-api-typescript'

export function useTodoist() {
  const [isConfigured, setIsConfigured] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsConfigured(todoistClient.isConfigured())
  }, [])

  const loadTasks = async (params?: {
    projectId?: string
    label?: string
    filter?: string
  }) => {
    if (!isConfigured) return

    setIsLoading(true)
    setError(null)
    try {
      const fetchedTasks = await todoistClient.getTasks(params)
      setTasks(fetchedTasks)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tarefas'
      setError(errorMessage)
      console.error('Erro ao carregar tarefas do Todoist:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadProjects = async () => {
    if (!isConfigured) return

    setIsLoading(true)
    setError(null)
    try {
      const fetchedProjects = await todoistClient.getProjects()
      setProjects(fetchedProjects)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar projetos'
      setError(errorMessage)
      console.error('Erro ao carregar projetos do Todoist:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const addTask = async (params: {
    content: string
    description?: string
    projectId?: string
    dueString?: string
    priority?: number
    labels?: string[]
  }) => {
    if (!isConfigured) {
      throw new Error('Todoist não está configurado')
    }

    setIsLoading(true)
    setError(null)
    try {
      const newTask = await todoistClient.addTask(params)
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar tarefa'
      setError(errorMessage)
      console.error('Erro ao adicionar tarefa no Todoist:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createProject = async (name: string, color?: string) => {
    if (!isConfigured) {
      throw new Error('Todoist não está configurado')
    }

    setIsLoading(true)
    setError(null)
    try {
      const newProject = await todoistClient.createProject(name, color)
      setProjects(prev => [...prev, newProject])
      return newProject
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar projeto'
      setError(errorMessage)
      console.error('Erro ao criar projeto no Todoist:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    if (!isConfigured) {
      throw new Error('Todoist não está configurado')
    }

    setIsLoading(true)
    setError(null)
    try {
      await todoistClient.completeTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao completar tarefa'
      setError(errorMessage)
      console.error('Erro ao completar tarefa no Todoist:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateTask = async (taskId: string, params: {
    content?: string
    description?: string
    dueString?: string
    priority?: number
    labels?: string[]
  }) => {
    if (!isConfigured) {
      throw new Error('Todoist não está configurado')
    }

    setIsLoading(true)
    setError(null)
    try {
      const updatedTask = await todoistClient.updateTask(taskId, params)
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))
      return updatedTask
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa'
      setError(errorMessage)
      console.error('Erro ao atualizar tarefa no Todoist:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!isConfigured) {
      throw new Error('Todoist não está configurado')
    }

    setIsLoading(true)
    setError(null)
    try {
      await todoistClient.deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefa'
      setError(errorMessage)
      console.error('Erro ao deletar tarefa no Todoist:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isConfigured,
    tasks,
    projects,
    isLoading,
    error,
    loadTasks,
    loadProjects,
    addTask,
    createProject,
    completeTask,
    updateTask,
    deleteTask,
  }
}
