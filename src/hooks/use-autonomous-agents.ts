import { useState, useEffect, useCallback } from "react";
import type { Agent, AgentTask } from "@/lib/agents";
import { useKV } from "./use-kv";

export interface ActivityLog {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  result: "success" | "warning" | "error";
}

export interface MemoryItem {
  id: string;
  category: string;
  content: string;
  timestamp: string;
  createdAt: string;
  agentId: string;
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentActionLog {
  agentId: string;
  action: string;
  details?: Record<string, unknown>;
  timestamp: string;
  success: boolean;
  durationMs?: number;
}

interface UseAutonomousAgentsReturn {
  agents: Agent[];
  tasks: AgentTask[];
  taskQueue: AgentTask[];
  completedTasks: AgentTask[];
  activityLog: ActivityLog[];
  streamingContent: string;
  isStreamingEnabled: boolean;
  serverLogs: AgentActionLog[];
  legalMemory: MemoryItem[];
  addTask: (task: Omit<AgentTask, "id" | "createdAt" | "status">) => Promise<void>;
  toggleAgent: (agentId: string) => Promise<void>;
  toggleStreaming: (enabled: boolean) => void;
  refreshServerData: () => Promise<void>;
  setAgents: (agents: Agent[] | ((prev: Agent[]) => Agent[])) => void;
  isLoading: boolean;
  error: string | null;
}

const AGENTS_KEY = "agents";
const TASKS_KEY = "agent-tasks";
const ACTIVITY_LOG_KEY = "activity-log";

/**
 * Hook para gerenciar agentes autônomos 24/7
 * Fornece estado e controle para o sistema de agentes IA
 */
export function useAutonomousAgents(): UseAutonomousAgentsReturn {
  const [agentsData, updateAgents] = useKV<Agent[]>(AGENTS_KEY, []);
  const [tasksData, updateTasks] = useKV<AgentTask[]>(TASKS_KEY, []);
  const [activityData, updateActivity] = useKV<ActivityLog[]>(ACTIVITY_LOG_KEY, []);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreamingEnabled, setIsStreamingEnabled] = useState(false);
  const [serverLogs, setServerLogs] = useState<AgentActionLog[]>([]);
  const [legalMemory, setLegalMemory] = useState<MemoryItem[]>([]);

  const agents = agentsData;
  const allTasks = tasksData;
  const activityLog = activityData;

  // Separar tarefas completas das pendentes e fila de tarefas
  const tasks = allTasks.filter((t: AgentTask) => t.status !== "completed" && t.status !== "failed");
  const completedTasks = allTasks.filter((t: AgentTask) => t.status === "completed" || t.status === "failed");
  const taskQueue = tasks; // taskQueue is an alias for tasks

  // Inicializar agentes padrão se não houver dados
  useEffect(() => {
    if (agents.length === 0) {
      const defaultAgents: Agent[] = [
        {
          id: "harvey",
          name: "Harvey Specter",
          description: "Estrategista-chefe do escritório",
          type: "strategic",
          status: "idle",
          enabled: true,
          lastActivity: "Aguardando tarefas",
          continuousMode: true,
        },
        {
          id: "justine",
          name: "Mrs. Justin-e",
          description: "Especialista em intimações e prazos",
          type: "intimation",
          status: "idle",
          enabled: true,
          lastActivity: "Aguardando tarefas",
          continuousMode: true,
        },
        {
          id: "analise-documental",
          name: "Análise Documental",
          description: "Analisador de documentos 24/7",
          type: "document",
          status: "idle",
          enabled: true,
          lastActivity: "Aguardando tarefas",
          continuousMode: true,
        },
        {
          id: "monitor-djen",
          name: "Monitor DJEN",
          description: "Monitoramento de publicações",
          type: "monitoring",
          status: "idle",
          enabled: true,
          lastActivity: "Aguardando tarefas",
          continuousMode: true,
        },
        {
          id: "gestao-prazos",
          name: "Gestão de Prazos",
          description: "Calculadora e gestor de prazos",
          type: "deadline",
          status: "idle",
          enabled: true,
          lastActivity: "Aguardando tarefas",
          continuousMode: true,
        },
      ];

      updateAgents(defaultAgents);
    }
  }, [agents.length, updateAgents]);

  // Adicionar nova tarefa
  const addTask = useCallback(
    async (taskData: Omit<AgentTask, "id" | "createdAt" | "status">) => {
      try {
        const newTask: AgentTask = {
          ...taskData,
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          createdAt: new Date().toISOString(),
          status: "queued",
        };

        const updatedTasks = [...allTasks, newTask];
        await updateTasks(updatedTasks);

        // Adicionar log de atividade
        const newLog: ActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          agentId: taskData.agentId,
          timestamp: new Date().toISOString(),
          action: `Nova tarefa: ${taskData.type}`,
          result: "success",
        };

        await updateActivity([newLog, ...activityLog].slice(0, 100)); // Manter últimas 100 atividades

        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMsg);
        throw new Error(`Falha ao adicionar tarefa: ${errorMsg}`);
      }
    },
    [allTasks, activityLog, updateTasks, updateActivity]
  );

  // Habilitar/desabilitar agente (sem segundo parâmetro para compatibilidade com AIAgents)
  const toggleAgent = useCallback(
    async (agentId: string) => {
      try {
        const updatedAgents = agents.map((agent: Agent) => {
          if (agent.id === agentId) {
            const newEnabled = !agent.enabled;
            return {
              ...agent,
              enabled: newEnabled,
              lastActivity: newEnabled ? "Ativado pelo usuário" : "Pausado pelo usuário",
            };
          }
          return agent;
        });

        updateAgents(updatedAgents);

        // Adicionar log de atividade
        const agent = agents.find((a: Agent) => a.id === agentId);
        const newLog: ActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          agentId,
          timestamp: new Date().toISOString(),
          action: agent?.enabled ? "Agente pausado" : "Agente ativado",
          result: "success",
        };

        updateActivity([newLog, ...activityLog].slice(0, 100));
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMsg);
        throw new Error(`Falha ao atualizar agente: ${errorMsg}`);
      }
    },
    [agents, activityLog, updateAgents, updateActivity]
  );

  // Toggle streaming
  const toggleStreaming = useCallback((enabled: boolean) => {
    setIsStreamingEnabled(enabled);
    if (!enabled) {
      setStreamingContent("");
    }
  }, []);

  // Refresh server data (fetch logs and memory)
  const refreshServerData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch server logs
      const logsResponse = await fetch("/api/agents/logs");
      if (logsResponse.ok) {
        const logs = await logsResponse.json();
        setServerLogs(logs.slice(0, 50)); // Keep last 50 logs
      }

      // Fetch legal memory
      const memoryResponse = await fetch("/api/agents/memory");
      if (memoryResponse.ok) {
        const memory = await memoryResponse.json();
        setLegalMemory(memory.slice(0, 100)); // Keep last 100 items
      }

      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    agents,
    tasks,
    taskQueue,
    completedTasks,
    activityLog,
    streamingContent,
    isStreamingEnabled,
    serverLogs,
    legalMemory,
    addTask,
    toggleAgent,
    toggleStreaming,
    refreshServerData,
    setAgents: updateAgents,
    isLoading,
    error,
  };
}

/**
 * Process autonomous task - stub for compatibility
 * This is called from aop-logging-examples.ts
 */
export async function processAutonomousTask(task: AgentTask): Promise<void> {
  console.log("Processing autonomous task:", task);
  // This is a stub - actual processing happens in the backend
  return Promise.resolve();
}
