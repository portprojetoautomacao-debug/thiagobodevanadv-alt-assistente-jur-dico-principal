import { useKV } from "@/hooks/use-kv";
import {
  type Agent,
  type AgentTask,
  canResumeAfterHuman,
  initializeAgents,
  shouldPauseForHuman,
} from "@/lib/agents";
import { processTaskWithRealAI, processTaskWithStreamingAI } from "@/lib/real-agent-client";
import { useCallback, useEffect, useRef, useState } from "react";

// Type alias for activity result
type ActivityResult = "success" | "warning" | "error";

// Type alias para log de atividade
type ActivityLogEntry = {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  result: ActivityResult;
};

// ===========================
// Types for server data
// ===========================

export interface AgentActionLog {
  agentId: string;
  action: string;
  details?: Record<string, unknown>;
  timestamp: string;
  success: boolean;
  durationMs?: number;
}

export interface MemoryItem {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// ===========================
// Types for callbacks
// ===========================

interface StreamingCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

// ===========================
// Helper Functions
// ===========================

function getAgentActivity(agent: Agent): string {
  if (agent.status === "processing") return "Processando tarefa...";
  return "Aguardando tarefas";
}

/**
 * Creates streaming callbacks for an agent - extracted to reduce nesting (S2004)
 */
function createStreamingCallbacks(
  agentId: string,
  setStreamingContent: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAgents: (fn: (current: Agent[] | null) => Agent[]) => void,
  logActivity: (agentId: string, action: string, result: ActivityResult) => void
): StreamingCallbacks {
  return {
    onChunk: (chunk: string) => {
      setStreamingContent((prev) => ({
        ...prev,
        [agentId]: (prev[agentId] || "") + chunk,
      }));

      // Update last activity with preview
      setAgents((current) =>
        (current || []).map((a) =>
          a.id === agentId
            ? {
                ...a,
                lastActivity: `Gerando: ${chunk.substring(0, 50)}...`,
              }
            : a
        )
      );
    },
    onComplete: () => {
      // Clear streaming content when complete
      setStreamingContent((prev) => {
        const { [agentId]: _, ...rest } = prev;
        return rest;
      });
    },
    onError: (error: Error) => {
      console.error(`[Agent ${agentId}] Streaming error:`, error);
      logActivity(agentId, `Erro streaming: ${error.message}`, "error");
    },
  };
}

/**
 * Handles task completion - extracted to reduce nesting (S2004)
 */
function handleTaskCompletion(
  task: AgentTask,
  result: AgentTask["result"],
  agentId: string,
  setTaskQueue: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  setCompletedTasks: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  setAgents: (fn: (current: Agent[] | null) => Agent[]) => void,
  logActivity: (agentId: string, action: string, result: ActivityResult) => void
): void {
  const completed: AgentTask = {
    ...task,
    status: "completed",
    completedAt: new Date().toISOString(),
    result,
  };

  setTaskQueue((current) => (current || []).filter((t) => t.id !== task.id));
  setCompletedTasks((current) => [completed, ...(current || [])].slice(0, 500));
  setAgents((current) =>
    updateAgentInList(current || [], agentId, {
      lastActivity: `Concluído: ${task.type}`,
    })
  );
  logActivity(agentId, `Tarefa concluída: ${task.type}`, "success");
}

/**
 * Handles task failure - extracted to reduce nesting (S2004)
 */
function handleTaskFailure(
  task: AgentTask,
  error: unknown,
  agentId: string,
  setTaskQueue: (fn: (current: AgentTask[] | null) => AgentTask[]) => void,
  logActivity: (agentId: string, action: string, result: "success" | "warning" | "error") => void
): void {
  setTaskQueue((current) =>
    updateTaskInQueue(current || [], task.id, {
      status: "failed",
      error: String(error),
    })
  );
  logActivity(agentId, `Erro no processamento: ${task.type}`, "error");
}

function sortTasksByPriority(tasks: AgentTask[]): AgentTask[] {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}

function updateAgentInList(agents: Agent[], agentId: string, updates: Partial<Agent>): Agent[] {
  return agents.map((a) => (a.id === agentId ? { ...a, ...updates } : a));
}

function updateTaskInQueue(
  tasks: AgentTask[],
  taskId: string,
  updates: Partial<AgentTask>
): AgentTask[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
}

function getQueuedTasksForAgent(queue: AgentTask[], agentId: string): AgentTask[] {
  return queue.filter(
    (t) => t.agentId === agentId && t.status === "queued" && canResumeAfterHuman(t)
  );
}

function isDataVersionOutdated(storedVersion: number, currentVersion: number): boolean {
  return storedVersion < currentVersion;
}

function clearOutdatedLocalStorage(): void {
  if (import.meta.env.DEV) {
    console.log("[Agents] Atualizando estrutura de dados local...");
  }
  globalThis.window.localStorage.removeItem("autonomous-agents");
  globalThis.window.localStorage.removeItem("agent-task-queue");
  globalThis.window.localStorage.removeItem("completed-agent-tasks");
  globalThis.window.localStorage.removeItem("agent-activity-log");
}

/**
 * Incrementa sempre que a estrutura dos agentes mudar
 * Assim forçamos reset de dados antigos no localStorage
 */
const AGENTS_DATA_VERSION = 7;

function getInitialAgents(): Agent[] {
  // Early return for server-side rendering
  if (globalThis.window === undefined) return initializeAgents();

  try {
    const storedVersion = globalThis.localStorage.getItem("agents-data-version");
    const version = storedVersion ? JSON.parse(storedVersion) : 0;

    // Handle outdated data version
    if (isDataVersionOutdated(version, AGENTS_DATA_VERSION)) {
      clearOutdatedLocalStorage();
      globalThis.localStorage.setItem("agents-data-version", JSON.stringify(AGENTS_DATA_VERSION));
      return initializeAgents();
    }

    const storedAgents = globalThis.localStorage.getItem("autonomous-agents");

    // Handle stored agents
    if (storedAgents) {
      const parsed = JSON.parse(storedAgents);

      // Return valid stored agents
      if (Array.isArray(parsed) && parsed.length === 15) return parsed;

      console.log("[Agents] Quantidade incorreta de agentes → reinicializando…");
      return initializeAgents();
    }
  } catch (e) {
    console.error("[Agents] Erro ao carregar agentes:", e);
  }

  return initializeAgents();
}

export function useAutonomousAgents() {
  const [_version, _setVersion] = useKV<number>("agents-data-version", AGENTS_DATA_VERSION);

  const [agents, setAgents] = useKV<Agent[]>("autonomous-agents", getInitialAgents());
  const [taskQueue, setTaskQueue] = useKV<AgentTask[]>("agent-task-queue", []);
  const [completedTasks, setCompletedTasks] = useKV<AgentTask[]>("completed-agent-tasks", []);
  const [activityLog, setActivityLog] = useKV<
    Array<{
      id: string;
      agentId: string;
      timestamp: string;
      action: string;
      result: "success" | "warning" | "error";
    }>
  >("agent-activity-log", []);

  // Estado para logs do servidor e memória jurídica
  const [serverLogs, setServerLogs] = useState<AgentActionLog[]>([]);
  const [legalMemory, setLegalMemory] = useState<MemoryItem[]>([]);

  // Estado para streaming em tempo real
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [useStreaming, setUseStreaming] = useState(true); // Streaming habilitado por padrão

  const processingRef = useRef<Set<string>>(new Set());

  // Garante sempre 15 agentes
  useEffect(() => {
    if (agents && agents.length !== 15) {
      console.log("[Agents] Corrigindo → 15 agentes obrigatórios");
      setAgents(initializeAgents());
    }
  }, [agents, setAgents]);

  // =============================
  // SYNC COM SERVIDOR (Logs e Memória)
  // =============================
  const fetchServerData = useCallback(async () => {
    try {
      // Fetch logs com timeout
      const logsController = new AbortController();
      const logsTimeout = setTimeout(() => logsController.abort(), 5000);

      const logsRes = await fetch("/api/agents?action=logs", {
        signal: logsController.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(logsTimeout);

      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data.logs && Array.isArray(data.logs)) {
          setServerLogs(data.logs);
        }
      } else if (logsRes.status === 401) {
        // Em desenvolvimento, ignorar silenciosamente erros de autenticação
      }

      // Fetch memory com timeout
      const memoryController = new AbortController();
      const memoryTimeout = setTimeout(() => memoryController.abort(), 5000);

      const memoryRes = await fetch("/api/agents?action=memory", {
        signal: memoryController.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(memoryTimeout);

      if (memoryRes.ok) {
        const data = await memoryRes.json();
        if (data.memory && Array.isArray(data.memory)) {
          setLegalMemory(data.memory);
        }
      } else if (memoryRes.status === 401) {
        // Em desenvolvimento, ignorar silenciosamente erros de autenticação
      }
    } catch (error) {
      // Silenciar erros de rede em dev (servidor pode não estar rodando)
      if (error instanceof Error && error.name !== "AbortError") {
        console.debug("[Agents] Servidor não disponível (normal em dev):", error.message);
      }
    }
  }, []);

  // Poll de dados do servidor a cada 60s (reduzido de 30s)
  // Desabilita automaticamente se servidor não responder
  useEffect(() => {
    let failureCount = 0;
    let interval: NodeJS.Timeout | null = null;

    const pollWithBackoff = async () => {
      try {
        await fetchServerData();
        failureCount = 0; // Reset em sucesso
      } catch {
        failureCount++;
        // Desabilita polling após 3 falhas consecutivas
        if (failureCount >= 3 && interval) {
          console.info("[Agents] Servidor indisponível - desabilitando polling automático");
          clearInterval(interval);
          interval = null;
        }
      }
    };

    // Poll inicial
    pollWithBackoff();

    // Poll periódico (apenas se servidor responder)
    interval = setInterval(pollWithBackoff, 60000); // 60s

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchServerData]);

  // =============================
  // TASK QUEUE
  // =============================

  // Helper para adicionar tarefa à fila (reduz S2004 nesting)
  const addTaskToQueue = useCallback((current: AgentTask[], task: AgentTask): AgentTask[] => {
    const updated = [...current, task];
    return sortTasksByPriority(updated);
  }, []);

  const addTask = useCallback(
    (task: AgentTask) => {
      setTaskQueue((current) => addTaskToQueue(current || [], task));
    },
    [setTaskQueue, addTaskToQueue]
  );

  // Helper para criar log de atividade (reduz S2004 nesting)
  const createActivityLog = useCallback(
    (agentId: string, action: string, result: "success" | "warning" | "error" = "success") => {
      return {
        id: crypto.randomUUID(),
        agentId,
        timestamp: new Date().toISOString(),
        action,
        result,
      };
    },
    []
  );

  // Helper para adicionar log à lista (reduz S2004 nesting)
  const addLogToActivityList = useCallback(
    (current: ActivityLogEntry[], log: ActivityLogEntry): ActivityLogEntry[] => {
      return [log, ...(current || [])].slice(0, 100);
    },
    []
  );

  const logActivity = useCallback(
    (agentId: string, action: string, result: "success" | "warning" | "error" = "success") => {
      setActivityLog((current) => {
        const log = createActivityLog(agentId, action, result);
        return addLogToActivityList(current || [], log);
      });
    },
    [setActivityLog, createActivityLog, addLogToActivityList]
  );

  // =============================
  // CORE: PROCESSAMENTO DE TAREFAS
  // =============================
  const processNextTask = useCallback(
    async (agent: Agent) => {
      if (processingRef.current.has(agent.id)) return;
      if (!agent.enabled || agent.status === "paused") return;

      const queue = getQueuedTasksForAgent(taskQueue || [], agent.id);

      if (queue.length === 0) {
        setAgents((current) =>
          updateAgentInList(current || [], agent.id, {
            status: "idle",
            currentTask: undefined,
          })
        );
        return;
      }

      const task = queue[0];

      // Filtro de segurança → não regras de autonomia
      if (shouldPauseForHuman(agent, task)) {
        setAgents((current) =>
          updateAgentInList(current || [], agent.id, {
            status: "waiting_human",
            currentTask: task,
          })
        );
        return;
      }

      processingRef.current.add(agent.id);

      // Status: Processing
      setTaskQueue((current) =>
        updateTaskInQueue(current || [], task.id, {
          status: "processing",
          startedAt: new Date().toISOString(),
        })
      );

      setAgents((current) =>
        updateAgentInList(current || [], agent.id, {
          status: "processing",
          currentTask: task,
        })
      );

      try {
        let result;

        if (useStreaming) {
          // Create callbacks using extracted helper (S2004 compliance)
          const callbacks = createStreamingCallbacks(
            agent.id,
            setStreamingContent,
            setAgents,
            logActivity
          );
          result = await processTaskWithStreamingAI(task, agent, callbacks);
        } else {
          // Fallback para processamento sem streaming
          result = await processTaskWithRealAI(task, agent);
        }

        // Use extracted helper for completion (S2004 compliance)
        handleTaskCompletion(
          task,
          result,
          agent.id,
          setTaskQueue,
          setCompletedTasks,
          setAgents,
          logActivity
        );
      } catch (err) {
        // Use extracted helper for failure (S2004 compliance)
        handleTaskFailure(task, err, agent.id, setTaskQueue, logActivity);
      } finally {
        processingRef.current.delete(agent.id);
      }
    },
    [taskQueue, setTaskQueue, setAgents, setCompletedTasks, logActivity, useStreaming]
  );

  const processNextTaskRef = useRef(processNextTask);

  useEffect(() => {
    processNextTaskRef.current = processNextTask;
  }, [processNextTask]);

  // =============================
  // LOOP CONTÍNUO DE PROCESSAMENTO
  // =============================

  // Helper para processar agentes ativos (reduz S2004 nesting)
  const processActiveAgents = useCallback(() => {
    const currentAgents = agents || [];
    currentAgents.forEach((agent) => {
      if (agent.enabled && agent.continuousMode) {
        processNextTaskRef.current(agent);
      }
    });
  }, [agents]);

  // Helper para atualizar atividade de um agente individual (reduz S2004 nesting)
  const updateSingleAgentActivity = useCallback((agent: Agent): Agent => {
    // Skip disabled or non-continuous agents
    if (!agent.enabled || !agent.continuousMode) return agent;

    const activity = getAgentActivity(agent);

    // Update only if activity changed
    if (activity !== agent.lastActivity) {
      return { ...agent, lastActivity: activity };
    }

    return agent;
  }, []);

  // Helper para atualizar status visual dos agentes (reduz S2004 nesting)
  const updateAgentsActivityStatus = useCallback(() => {
    setAgents((current) => (current || []).map(updateSingleAgentActivity));
  }, [setAgents, updateSingleAgentActivity]);

  // Loop contínuo de processamento
  useEffect(() => {
    const interval = setInterval(() => {
      processActiveAgents();
      updateAgentsActivityStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [processActiveAgents, updateAgentsActivityStatus]);

  // =============================
  // RESET DIÁRIO (local)
  // =============================

  // Helper para reset diário dos agentes (reduz S2004 nesting)
  const performDailyReset = useCallback(() => {
    setAgents((current) =>
      (current || []).map((agent) => ({
        ...agent,
      }))
    );
  }, [setAgents]);

  // Helper para configurar intervalo diário (reduz S2004 nesting)
  const setupDailyResetInterval = useCallback(() => {
    const interval = setInterval(
      () => {
        performDailyReset();
      },
      24 * 60 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [performDailyReset]);

  useEffect(() => {
    const resetDailyCounters = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);

      const timeUntilMidnight = midnight.getTime() - now.getTime();

      const timeout = setTimeout(() => {
        performDailyReset();
        setupDailyResetInterval();
      }, timeUntilMidnight);

      return () => clearTimeout(timeout);
    };

    return resetDailyCounters();
  }, [performDailyReset, setupDailyResetInterval]);

  // =============================
  // CONTROLES DO USUÁRIO
  // =============================

  // Helper para encontrar agente por ID (reduz S2004 nesting)
  const findAgentById = useCallback((agents: Agent[], agentId: string): Agent | undefined => {
    return agents.find((a) => a.id === agentId);
  }, []);

  // Helper para determinar novo status do agente (reduz S2004 nesting)
  const getNewAgentStatus = useCallback((agent: Agent): Partial<Agent> => {
    const isNowEnabled = !agent.enabled;
    return {
      enabled: isNowEnabled,
      status: isNowEnabled ? "active" : "paused",
      lastActivity: isNowEnabled ? "Iniciando…" : "Pausado pelo usuário",
    };
  }, []);

  const toggleAgent = useCallback(
    (agentId: string) => {
      setAgents((current) => {
        const agent = findAgentById(current || [], agentId);
        if (!agent) return current || [];

        const newStatus = getNewAgentStatus(agent);
        return updateAgentInList(current || [], agentId, newStatus);
      });
    },
    [setAgents, findAgentById, getNewAgentStatus]
  );

  const markTaskAsHumanTouched = useCallback(
    (taskId: string) => {
      setTaskQueue((current) =>
        updateTaskInQueue(current || [], taskId, {
          humanTouchedAt: new Date().toISOString(),
          status: "human_intervention",
        })
      );
    },
    [setTaskQueue]
  );

  const resumeTaskAfterHuman = useCallback(
    (taskId: string) => {
      setTaskQueue((current) =>
        updateTaskInQueue(current || [], taskId, {
          status: "queued",
          resumeAfterHuman: true,
        })
      );
    },
    [setTaskQueue]
  );

  // Toggle streaming mode
  const toggleStreaming = useCallback(() => {
    setUseStreaming((prev) => !prev);
  }, []);

  // Clear old activity logs (older than 24h)
  const clearOldLogs = useCallback(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    setActivityLog((current) =>
      (current || []).filter((log) => new Date(log.timestamp).getTime() > oneDayAgo)
    );
  }, [setActivityLog]);

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
    setAgents,
    clearOldLogs, // Clear logs older than 24h
  };
}
