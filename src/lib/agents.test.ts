/**
 * Tests for AI Agents system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  type Agent,
  type AgentTask,
  processTaskWithAI,
  shouldPauseForHuman,
  canResumeAfterHuman,
  createTaskGenerator,
  initializeAgents
} from './agents'

describe('AI Agents System', () => {
  describe('processTaskWithAI', () => {
    it('should process monitoring tasks successfully', async () => {
      const task: AgentTask = {
        id: '1',
        agentId: 'djen-monitor',
        type: 'monitor-djen',
        priority: 'high',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: { description: 'Check DJEN publications' }
      }

      const agent: Agent = {
        id: 'djen-monitor',
        name: 'DJEN Monitor',
        description: 'Monitors DJEN',
        type: 'monitor',
        status: 'idle',
        enabled: true,
        lastActivity: '',
        tasksCompleted: 0,
        tasksToday: 0,
        continuousMode: true
      }

      const result = await processTaskWithAI(task, agent)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Monitoramento concluído')
      expect(result.data).toBeDefined()
    })

    it('should process analysis tasks successfully', async () => {
      const task: AgentTask = {
        id: '2',
        agentId: 'doc-analyzer',
        type: 'analyze-document',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: { description: 'Analyze legal document' }
      }

      const agent: Agent = {
        id: 'doc-analyzer',
        name: 'Document Analyzer',
        description: 'Analyzes documents',
        type: 'analyzer',
        status: 'idle',
        enabled: true,
        lastActivity: '',
        tasksCompleted: 0,
        tasksToday: 0,
        continuousMode: true
      }

      const result = await processTaskWithAI(task, agent)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Análise concluída')
      expect(result.data?.confidence).toBeGreaterThan(0.8)
    })

    it('should process deadline calculation tasks', async () => {
      const task: AgentTask = {
        id: '3',
        agentId: 'deadline-calc',
        type: 'calculate-deadline',
        priority: 'high',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: { businessDays: 15 }
      }

      const agent: Agent = {
        id: 'deadline-calc',
        name: 'Deadline Calculator',
        description: 'Calculates deadlines',
        type: 'calculator',
        status: 'idle',
        enabled: true,
        lastActivity: '',
        tasksCompleted: 0,
        tasksToday: 0,
        continuousMode: true
      }

      const result = await processTaskWithAI(task, agent)

      expect(result.success).toBe(true)
      expect(result.data?.deadline).toBeDefined()
      expect(result.data?.businessDays).toBe(15)
    })
  })

  describe('shouldPauseForHuman', () => {
    const agent: Agent = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'Test',
      type: 'test',
      status: 'idle',
      enabled: true,
      lastActivity: '',
      tasksCompleted: 0,
      tasksToday: 0,
      continuousMode: true
    }

    it('should pause for critical priority tasks', () => {
      const task: AgentTask = {
        id: '1',
        agentId: 'test-agent',
        type: 'test-task',
        priority: 'critical',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {}
      }

      expect(shouldPauseForHuman(agent, task)).toBe(true)
    })

    it('should pause for tasks that failed multiple times', () => {
      const task: AgentTask = {
        id: '2',
        agentId: 'test-agent',
        type: 'test-task',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {},
        retryCount: 3,
        maxRetries: 3
      }

      expect(shouldPauseForHuman(agent, task)).toBe(true)
    })

    it('should pause for sensitive task types', () => {
      const task: AgentTask = {
        id: '3',
        agentId: 'test-agent',
        type: 'contract-signing',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {}
      }

      expect(shouldPauseForHuman(agent, task)).toBe(true)
    })

    it('should not pause for normal tasks', () => {
      const task: AgentTask = {
        id: '4',
        agentId: 'test-agent',
        type: 'monitor-check',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {}
      }

      expect(shouldPauseForHuman(agent, task)).toBe(false)
    })
  })

  describe('canResumeAfterHuman', () => {
    it('should allow resume if explicitly marked', () => {
      const task: AgentTask = {
        id: '1',
        agentId: 'test-agent',
        type: 'test-task',
        priority: 'medium',
        status: 'human_intervention',
        createdAt: new Date().toISOString(),
        data: {},
        resumeAfterHuman: true
      }

      expect(canResumeAfterHuman(task)).toBe(true)
    })

    it('should allow resume for queued tasks', () => {
      const task: AgentTask = {
        id: '2',
        agentId: 'test-agent',
        type: 'test-task',
        priority: 'medium',
        status: 'queued',
        createdAt: new Date().toISOString(),
        data: {}
      }

      expect(canResumeAfterHuman(task)).toBe(true)
    })

    it('should auto-resume after 24 hours', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000)
      
      const task: AgentTask = {
        id: '3',
        agentId: 'test-agent',
        type: 'test-task',
        priority: 'medium',
        status: 'human_intervention',
        createdAt: new Date().toISOString(),
        data: {},
        humanTouchedAt: yesterday.toISOString()
      }

      expect(canResumeAfterHuman(task)).toBe(true)
    })
  })

  describe('createTaskGenerator', () => {
    it('should generate tasks when started', async () => {
      const generatedTasks: AgentTask[] = []
      
      const generator = createTaskGenerator(
        {
          enabled: true,
          intervalMinutes: 0.01, // Very short for testing
          maxTasksPerInterval: 2,
          agentIds: ['agent-1', 'agent-2']
        },
        (task) => generatedTasks.push(task)
      )

      generator.start()
      
      // Wait a bit for tasks to be generated
      await new Promise(resolve => setTimeout(resolve, 100))
      
      generator.stop()

      expect(generatedTasks.length).toBeGreaterThan(0)
      expect(generatedTasks[0]).toHaveProperty('id')
      expect(generatedTasks[0]).toHaveProperty('type')
      expect(generatedTasks[0]).toHaveProperty('priority')
    })

    it('should respect maxTasksPerInterval', async () => {
      const generatedTasks: AgentTask[] = []
      
      const generator = createTaskGenerator(
        {
          enabled: true,
          intervalMinutes: 0.01,
          maxTasksPerInterval: 1,
          agentIds: ['agent-1']
        },
        (task) => generatedTasks.push(task)
      )

      generator.start()
      await new Promise(resolve => setTimeout(resolve, 50))
      generator.stop()

      // Should generate at most maxTasksPerInterval tasks
      expect(generatedTasks.length).toBeLessThanOrEqual(1)
    })
  })

  describe('initializeAgents', () => {
    it('should return all 15 default agents when no existing agents', () => {
      const agents = initializeAgents()

      expect(agents.length).toBe(15)
      expect(agents[0]).toHaveProperty('id')
      expect(agents[0]).toHaveProperty('name')
      expect(agents[0]).toHaveProperty('capabilities')
      
      // Verify all 15 agents are present
      const agentIds = agents.map(a => a.id)
      expect(agentIds).toContain('harvey')
      expect(agentIds).toContain('justine')
      expect(agentIds).toContain('analise-documental')
      expect(agentIds).toContain('monitor-djen')
      expect(agentIds).toContain('gestao-prazos')
      expect(agentIds).toContain('redacao-peticoes')
      expect(agentIds).toContain('organizacao-arquivos')
      expect(agentIds).toContain('pesquisa-juris')
      expect(agentIds).toContain('analise-risco')
      expect(agentIds).toContain('revisao-contratual')
      expect(agentIds).toContain('comunicacao-clientes')
      expect(agentIds).toContain('financeiro')
      expect(agentIds).toContain('estrategia-processual')
      expect(agentIds).toContain('traducao-juridica')
      expect(agentIds).toContain('compliance')
    })

    it('should merge existing agents with defaults', () => {
      const existingAgents: Agent[] = [
        {
          id: 'monitor-djen',
          name: 'Custom DJEN Monitor',
          description: 'Custom description',
          type: 'monitor',
          status: 'idle',
          enabled: false, // User disabled it
          lastActivity: 'Custom activity',
          tasksCompleted: 10,
          tasksToday: 2,
          continuousMode: false
        }
      ]

      const agents = initializeAgents(existingAgents)

      const djenAgent = agents.find(a => a.id === 'monitor-djen')
      
      expect(djenAgent).toBeDefined()
      expect(djenAgent?.enabled).toBe(false) // Preserved user setting
      expect(djenAgent?.tasksCompleted).toBe(10) // Preserved user data
      expect(djenAgent?.capabilities).toBeDefined() // Updated from defaults
    })

    it('should have Harvey and Justin-e as primary agents', () => {
      const agents = initializeAgents()
      
      const harvey = agents.find(a => a.id === 'harvey')
      const justine = agents.find(a => a.id === 'justine')
      
      expect(harvey).toBeDefined()
      expect(harvey?.name).toBe('Harvey Specter')
      expect(harvey?.enabled).toBe(true)
      
      expect(justine).toBeDefined()
      expect(justine?.name).toBe('Mrs. Justin-e')
      expect(justine?.enabled).toBe(true)
    })
  })
})
