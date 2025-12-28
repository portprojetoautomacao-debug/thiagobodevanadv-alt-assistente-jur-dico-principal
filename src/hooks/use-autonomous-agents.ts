/**
 * Hook para gerenciar agentes autônomos
 * 
 * Este é um stub temporário para manter compatibilidade com componentes existentes.
 * A implementação completa está em desenvolvimento.
 */

import { useState, useCallback } from 'react';
import type { Agent, AgentTask } from '@/lib/agents';
import { DEFAULT_AGENTS } from '@/lib/agents';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'started' | 'completed' | 'failed' | 'info';
  message: string;
  taskId?: string;
  action?: string;
  result?: 'success' | 'error' | 'warning';
}

export interface MemoryItem {
  id: string;
  timestamp: string;
  createdAt?: string;
  type: string;
  content: string;
  agentId?: string;
  metadata?: {
    source?: string;
    confidence?: number;
    tags?: string[];
    [key: string]: unknown;
  };
}

export interface ServerLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface UseAutonomousAgentsReturn {
  agents: Agent[];
  activityLog: ActivityLogEntry[];
  taskQueue: AgentTask[];
  completedTasks: AgentTask[];
  streamingContent: string;
  isStreamingEnabled: boolean;
  serverLogs: ServerLog[];
  legalMemory: MemoryItem[];
  toggleAgent: (agentId: string) => void;
  toggleStreaming: () => void;
  executeTask: (agentId: string, task: AgentTask) => Promise<void>;
  addTask: (task: AgentTask) => void;
  clearActivityLog: () => void;
  refreshServerData: () => void;
  setAgents: (agents: Agent[]) => void;
}

/**
 * Process an autonomous task (stub implementation)
 */
export async function processAutonomousTask(task: AgentTask): Promise<void> {
  // Stub implementation
  console.log('Processing task:', task.id);
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Hook para gerenciar agentes autônomos
 */
export function useAutonomousAgents(): UseAutonomousAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>(() => 
    DEFAULT_AGENTS.map(agent => ({
      ...agent,
      status: 'idle' as const,
      enabled: false,
      lastActivity: new Date().toISOString(),
      continuousMode: false,
    }))
  );
  
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<AgentTask[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreamingEnabled, setIsStreamingEnabled] = useState<boolean>(false);
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [legalMemory, setLegalMemory] = useState<MemoryItem[]>([]);

  const addToLog = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };
    
    setActivityLog(prev => [newEntry, ...prev].slice(0, 100));
  }, []);

  const toggleAgent = useCallback((agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { 
            ...agent, 
            enabled: !agent.enabled,
            status: !agent.enabled ? 'active' : 'idle',
            lastActivity: new Date().toISOString(),
          }
        : agent
    ));

    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      addToLog({
        agentId,
        agentName: agent.name,
        type: 'info',
        message: `Agente ${agent.enabled ? 'desativado' : 'ativado'}`,
        action: 'toggle',
        result: 'success',
      });
    }
  }, [agents, addToLog]);

  const toggleStreaming = useCallback(() => {
    setIsStreamingEnabled(prev => !prev);
  }, []);

  const addTask = useCallback((task: AgentTask) => {
    setTaskQueue(prev => [...prev, task]);
  }, []);

  const refreshServerData = useCallback(() => {
    // Stub implementation - refresh data
    setServerLogs([]);
    setLegalMemory([]);
  }, []);

  const executeTask = useCallback(async (agentId: string, task: AgentTask) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
      console.error(`Agent ${agentId} not found`);
      return;
    }

    addToLog({
      agentId,
      agentName: agent.name,
      type: 'started',
      message: `Executando tarefa: ${task.type}`,
      taskId: task.id,
      action: 'execute',
    });

    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { 
            ...a, 
            status: 'processing',
            currentTask: task,
            lastActivity: new Date().toISOString(),
          }
        : a
    ));

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              status: 'idle',
              currentTask: undefined,
              lastActivity: new Date().toISOString(),
            }
          : a
      ));

      setTaskQueue(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [...prev, task]);

      addToLog({
        agentId,
        agentName: agent.name,
        type: 'completed',
        message: `Tarefa concluída: ${task.type}`,
        taskId: task.id,
        action: 'complete',
        result: 'success',
      });
    } catch (error) {
      setAgents(prev => prev.map(a => 
        a.id === agentId 
          ? { 
              ...a, 
              status: 'error',
              currentTask: undefined,
              lastActivity: new Date().toISOString(),
            }
          : a
      ));

      addToLog({
        agentId,
        agentName: agent.name,
        type: 'failed',
        message: `Erro na tarefa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        taskId: task.id,
        action: 'error',
        result: 'error',
      });
    }
  }, [agents, addToLog]);

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  return {
    agents,
    activityLog,
    taskQueue,
    completedTasks,
    streamingContent,
    isStreamingEnabled,
    serverLogs,
    legalMemory,
    toggleAgent,
    toggleStreaming,
    executeTask,
    addTask,
    clearActivityLog,
    refreshServerData,
    setAgents,
  };
}
