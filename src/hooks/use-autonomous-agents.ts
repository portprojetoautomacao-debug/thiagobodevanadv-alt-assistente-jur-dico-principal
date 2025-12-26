/**
 * Hook para gerenciar agentes autônomos
 *
 * Este é um stub temporário para manter compatibilidade com componentes existentes.
 * A implementação completa está em desenvolvimento.
 */

import { useState, useCallback } from "react";
import type { Agent, AgentTask } from "@/lib/agents";
import { DEFAULT_AGENTS } from "@/lib/agents";

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "started" | "completed" | "failed" | "info";
  message: string;
  action: string;
  result: "success" | "error" | "warning";
  taskId?: string;
  success: boolean;
}

export interface UseAutonomousAgentsReturn {
  agents: Agent[];
  activityLog: ActivityLogEntry[];
  toggleAgent: (agentId: string) => void;
  executeTask: (agentId: string, task: AgentTask) => Promise<void>;
  clearActivityLog: () => void;
  // Propriedades adicionais para compatibilidade
  taskQueue: AgentTask[];
  completedTasks: AgentTask[];
  streamingContent: string;
  isStreamingEnabled: boolean;
  toggleStreaming: () => void;
  serverLogs: ActivityLogEntry[];
  legalMemory: unknown;
  refreshServerData: () => void;
  setAgents: (agents: Agent[]) => void;
  addTask: (task: AgentTask) => void;
}

// Export tipos adicionais para compatibilidade
export interface MemoryItem {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function processAutonomousTask(task: AgentTask): Promise<void> {
  return Promise.resolve();
}

/**
 * Hook para gerenciar agentes autônomos
 */
export function useAutonomousAgents(): UseAutonomousAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>(() =>
    DEFAULT_AGENTS.map((agent) => ({
      ...agent,
      status: "idle" as const,
      enabled: false,
      lastActivity: new Date().toISOString(),
      continuousMode: false,
    }))
  );

  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  const addToLog = useCallback((entry: Omit<ActivityLogEntry, "id" | "timestamp">) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    };

    setActivityLog((prev) => [newEntry, ...prev].slice(0, 100));
  }, []);

  const toggleAgent = useCallback(
    (agentId: string) => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId
            ? {
                ...agent,
                enabled: !agent.enabled,
                status: !agent.enabled ? "active" : "idle",
                lastActivity: new Date().toISOString(),
              }
            : agent
        )
      );

      const agent = agents.find((a) => a.id === agentId);
      if (agent) {
        addToLog({
          agentId,
          agentName: agent.name,
          type: "info",
          message: `Agente ${agent.enabled ? "desativado" : "ativado"}`,
          action: "toggle",
          result: "success",
          success: true,
        });
      }
    },
    [agents, addToLog]
  );

  const executeTask = useCallback(
    async (agentId: string, task: AgentTask) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) {
        console.error(`Agent ${agentId} not found`);
        return;
      }

      addToLog({
        agentId,
        agentName: agent.name,
        type: "started",
        message: `Executando tarefa: ${task.type}`,
        taskId: task.id,
        action: "execute",
        result: "success",
        success: true,
      });

      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId
            ? {
                ...a,
                status: "processing",
                currentTask: task,
                lastActivity: new Date().toISOString(),
              }
            : a
        )
      );

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  status: "idle",
                  currentTask: undefined,
                  lastActivity: new Date().toISOString(),
                }
              : a
          )
        );

        addToLog({
          agentId,
          agentName: agent.name,
          type: "completed",
          message: `Tarefa concluída: ${task.type}`,
          taskId: task.id,
          action: "complete",
          result: "success",
          success: true,
        });
      } catch (error) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  status: "error",
                  currentTask: undefined,
                  lastActivity: new Date().toISOString(),
                }
              : a
          )
        );

        addToLog({
          agentId,
          agentName: agent.name,
          type: "failed",
          message: `Erro na tarefa: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          taskId: task.id,
          action: "execute",
          result: "error",
          success: false,
        });
      }
    },
    [agents, addToLog]
  );

  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  return {
    agents,
    activityLog,
    toggleAgent,
    executeTask,
    clearActivityLog,
    // Valores padrão para compatibilidade
    taskQueue: [],
    completedTasks: [],
    streamingContent: "",
    isStreamingEnabled: false,
    toggleStreaming: () => {},
    serverLogs: activityLog,
    legalMemory: null,
    refreshServerData: () => {},
    setAgents,
    addTask: () => {},
  };
}
