import { useKV } from "@/hooks/use-kv";
import { getUnhealthyAgents, metricsCollector } from "@/lib/agent-metrics";
import {
  canResumeAfterHuman,
  cleanupExpiredTasks,
  clearTaskTimeoutCache,
  initializeAgents,
  sanitizeAgentTask,
  shouldPauseForHuman,
  validateTaskAgentId,
  type Agent,
  type AgentTask,
  type AgentTaskResult,
} from "@/lib/agents";
import { executeHybridTask, hasHybridVersion } from "@/lib/hybrid-agents-integration";
import { processTaskWithRealAI, processTaskWithStreamingAI } from "@/lib/real-agent-client";
import { validateAgent, validateAgentTask } from "@/schemas/agent.schema";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Type alias for activity result (success, warning, or error)
type ActivityResult = "success" | "warning" | "error";

// Type alias for state setter functions
type StateSetter<T> = (fn: (current: T | null) => T) => void;

// Activity log entry interface
interface ActivityLogEntry {
  id: string;
  agentId: string;
  timestamp: string;
  action: string;
  result: ActivityResult;
}

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
type ActivityLogger = (agentId: string, action: string, result: ActivityResult) => void;

function handleTaskCompletion(
  task: AgentTask,
  result: AgentTask["result"],
  agentId: string,
  setTaskQueue: StateSetter<AgentTask[]>,
  setCompletedTasks: StateSetter<AgentTask[]>,
  setAgents: StateSetter<Agent[]>,
  logActivity: ActivityLogger
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

type TaskQueueSetter = (fn: (current: AgentTask[] | null) => AgentTask[]) => void;

/**
 * Handles task failure - extracted to reduce nesting (S2004)
 */
function handleTaskFailure(
  task: AgentTask,
  error: unknown,
  agentId: string,
  setTaskQueue: TaskQueueSetter,
  logActivity: ActivityLogger
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
const AGENTS_DATA_VERSION = 8; // Atualizado para 16 agentes (adicionado pesquisa-juris-qdrant)

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
      console.log("[Agents] Versão desatualizada → inicializando 16 agentes");
      return initializeAgents();
    }

    const storedAgents = globalThis.localStorage.getItem("autonomous-agents");

    // Handle stored agents
    if (storedAgents) {
      const parsed = JSON.parse(storedAgents);

      // Return valid stored agents SOMENTE se tiver exatamente 16
      if (Array.isArray(parsed) && parsed.length === 16) {
        // ✅ CORREÇÃO: Log apenas uma vez (throttle) para evitar spam no console
        const lastLogTime = (globalThis as any).__lastAgentsLogTime || 0;
        const now = Date.now();
        if (now - lastLogTime > 10000) {
          // Log apenas a cada 10 segundos
          console.log("[Agents] ✓ 16 agentes ativos do localStorage");
          (globalThis as any).__lastAgentsLogTime = now;
        }
        return parsed;
      }

      // Se quantidade incorreta, limpa e reinicializa
      console.log(
        `[Agents] Quantidade incorreta (${parsed?.length || 0}) → inicializando 16 agentes`
      );
      globalThis.localStorage.removeItem("autonomous-agents");
      return initializeAgents();
    }
  } catch (e) {
    console.error("[Agents] Erro ao carregar agentes:", e);
  }

  // Fallback: sempre retorna 16 agentes
  console.log("[Agents] Sem dados → inicializando 16 agentes");
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
  const initializedRef = useRef(false);

  // Garante sempre 16 agentes - APENAS UMA VEZ na inicialização
  // ⚠️ FIX: Adiciona agents.length como dependência para evitar loop infinito
  useEffect(() => {
    if (!initializedRef.current && agents && agents.length !== 16) {
      console.log("[Agents] Corrigindo → 16 agentes obrigatórios");
      initializedRef.current = true; // ✅ FIX: Seta ANTES de chamar setAgents
      setAgents(initializeAgents());
    }
  }, [agents?.length]); // ✅ FIX: Adiciona agents.length como dependência

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
    // Validar tarefa com Zod
    const validation = validateAgentTask(task);

    if (!validation.isValid || !validation.data) {
      console.error("Validação de tarefa falhou:", validation.errors);
      toast.error("Tarefa inválida. Verifique os campos obrigatórios.");
      return current;
    }

    // Type assertion segura através de unknown - validated data tem a estrutura correta
    const validatedTask = validation.data as unknown as AgentTask;
    const updated = [...current, validatedTask];
    return sortTasksByPriority(updated);
  }, []);

  // ✨ MODIFICADO: addTask agora usa validação
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

      // ✅ SECURITY: Sanitizar e validar task antes de processar
      const sanitizedTask = sanitizeAgentTask(task);
      const validatedTask = validateTaskAgentId(sanitizedTask);

      // Filtro de segurança → não regras de autonomia
      if (shouldPauseForHuman(agent, validatedTask)) {
        setAgents((current) =>
          updateAgentInList(current || [], agent.id, {
            status: "waiting_human",
            currentTask: task,
          })
        );
        return;
      }

      processingRef.current.add(agent.id);

      // ✅ Registrar início da métrica
      const startTime = Date.now();

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
          currentTask: validatedTask,
        })
      );

      try {
        let result: AgentTaskResult;

        // 🔥 NOVA INTEGRAÇÃO HÍBRIDA - Verifica se agente tem versão LangGraph
        const hasHybrid = hasHybridVersion(agent.id);

        if (hasHybrid) {
          // Usar arquitetura híbrida com fallback automático
          const hybridResult = await executeHybridTask(agent.id, validatedTask, {
            enableLangGraph: true,
            enableTraditional: true,
            coordinationMode: "fallback", // LangGraph primeiro, tradicional como fallback
            timeout: 30000,
          });

          // Converter resultado híbrido para formato AgentTaskResult
          const hybridData =
            (hybridResult.langGraphResult?.data as Record<string, unknown> | undefined) ??
            (hybridResult.traditionalResult?.output as Record<string, unknown> | undefined) ??
            ({} as Record<string, unknown>);

          result = {
            success: hybridResult.success,
            data: hybridData,
            message: `Executado via ${hybridResult.mode}`,
            processingTimeMs: hybridResult.executionTime,
            confidence: hybridResult.success ? 0.95 : 0.5,
          };

          // Log da execução híbrida
          logActivity(
            agent.id,
            `Executado via ${hybridResult.mode} (${hybridResult.executionTime}ms)`,
            hybridResult.success ? "success" : "error"
          );
        } else if (useStreaming) {
          // Fallback para agentes sem versão híbrida - usar streaming tradicional
          const callbacks = createStreamingCallbacks(
            agent.id,
            setStreamingContent,
            setAgents,
            logActivity
          );
          result = await processTaskWithStreamingAI(validatedTask, agent, callbacks);
        } else {
          // Fallback para processamento tradicional sem streaming
          result = await processTaskWithRealAI(validatedTask, agent);
        }

        // ✅ Registrar métrica de sucesso
        const duration = Date.now() - startTime;
        metricsCollector.recordMetric({
          agentId: agent.id,
          timestamp: Date.now(),
          duration,
          success: true,
          tokensUsed: result.tokensUsed,
          taskType: validatedTask.type,
        });

        // ✅ PERFORMANCE: Invalidar cache de timeout após conclusão
        clearTaskTimeoutCache(validatedTask.id);

        // Use extracted helper for completion (S2004 compliance)
        handleTaskCompletion(
          validatedTask,
          result,
          agent.id,
          setTaskQueue,
          setCompletedTasks,
          setAgents,
          logActivity
        );
      } catch (err) {
        // ✅ Registrar métrica de erro
        const duration = Date.now() - startTime;
        metricsCollector.recordMetric({
          agentId: agent.id,
          timestamp: Date.now(),
          duration,
          success: false,
          taskType: validatedTask.type,
          error: err instanceof Error ? err.message : String(err),
        });

        // ✅ PERFORMANCE: Invalidar cache de timeout após falha
        clearTaskTimeoutCache(validatedTask.id);

        // Use extracted helper for failure (S2004 compliance)
        handleTaskFailure(validatedTask, err, agent.id, setTaskQueue, logActivity);
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
  // CLEANUP AUTOMÁTICO DE TAREFAS EXPIRADAS
  // =============================

  useEffect(() => {
    // Cleanup inicial após 10 segundos
    const initialCleanup = setTimeout(() => {
      setTaskQueue((current) => {
        const cleaned = cleanupExpiredTasks(current || []);
        const removed = (current || []).length - cleaned.length;

        if (removed > 0) {
          console.log(`[TaskCleanup] Removidas ${removed} tarefa(s) expirada(s)`);
        }

        return cleaned;
      });

      setCompletedTasks((current) => {
        const cleaned = cleanupExpiredTasks(current || []);
        const removed = (current || []).length - cleaned.length;

        if (removed > 0) {
          console.log(`[TaskCleanup] Removidas ${removed} tarefa(s) completa(s) expirada(s)`);
        }

        return cleaned;
      });
    }, 10000);

    // Cleanup diário (24 horas)
    const dailyCleanup = setInterval(
      () => {
        setTaskQueue((current) => {
          const cleaned = cleanupExpiredTasks(current || []);
          const removed = (current || []).length - cleaned.length;

          if (removed > 0) {
            console.log(`[TaskCleanup] Cleanup diário: ${removed} tarefa(s) removida(s)`);
            toast.info(`🧹 ${removed} tarefa(s) expirada(s) removida(s)`);
          }

          return cleaned;
        });

        setCompletedTasks((current) => cleanupExpiredTasks(current || []));
      },
      24 * 60 * 60 * 1000
    );

    return () => {
      clearTimeout(initialCleanup);
      clearInterval(dailyCleanup);
    };
  }, [setTaskQueue, setCompletedTasks]);

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

  // ✨ NOVO: Validar agentes ao atualizar
  const updateAgentWithValidation = useCallback(
    (agentId: string, updates: Partial<Agent>) => {
      setAgents((current) => {
        const agent = findAgentById(current || [], agentId);
        if (!agent) return current || [];

        const updatedAgent = { ...agent, ...updates };
        const validation = validateAgent(updatedAgent);

        if (!validation.isValid) {
          console.error("Validação de agente falhou:", validation.errors);
          toast.error("Dados do agente inválidos.");
          return current || [];
        }

        return updateAgentInList(current || [], agentId, validation.data || agent);
      });
    },
    [setAgents, findAgentById]
  );

  // ✨ MODIFICADO: toggleAgent agora usa validação
  const toggleAgent = useCallback(
    (agentId: string) => {
      setAgents((current) => {
        const agent = findAgentById(current || [], agentId);
        if (!agent) return current || [];

        const newStatus = getNewAgentStatus(agent);
        const updatedAgent = { ...agent, ...newStatus };

        // Validar antes de atualizar
        const validation = validateAgent(updatedAgent);

        if (!validation.isValid || !validation.data) {
          console.error("Validação de agente falhou:", validation.errors);
          toast.error("Erro ao alterar status do agente.");
          return current || [];
        }

        return updateAgentInList(current || [], agentId, validation.data);
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

  // 🚨 Sistema de Alertas Automáticos - Detecta agentes degradados
  useEffect(() => {
    const checkAgentHealth = async () => {
      const unhealthy = getUnhealthyAgents({
        maxLatencyMs: 5000, // 5 segundos
        maxErrorRate: 10, // 10% de erro
      });

      if (unhealthy.length > 0) {
        console.warn(
          "[AgentHealth] Agentes degradados detectados:",
          unhealthy.map((a: { agentId: string }) => a.agentId)
        );

        // Notificação visual local
        toast.error(`⚠️ ${unhealthy.length} agente(s) degradado(s)`, {
          description: `Agentes com problemas: ${unhealthy.map((a: { agentId: string }) => a.agentId).join(", ")}`,
          duration: 10000,
        });

        // Enviar notificação via API (email/webhook)
        try {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "system_alert",
              title: "🚨 Agentes Degradados Detectados",
              message: `${unhealthy.length} agente(s) apresentando problemas de performance: ${unhealthy.map((a: { agentId: string }) => a.agentId).join(", ")}`,
              priority: "high",
              metadata: {
                agentes: unhealthy.map((a: { agentId: string }) => a.agentId).join(", "),
                latenciaMedia: Math.round(
                  unhealthy.reduce(
                    (sum: number, a: { p95Latency: number }) => sum + a.p95Latency,
                    0
                  ) / unhealthy.length
                ),
                taxaErroMedia:
                  (
                    unhealthy.reduce(
                      (sum: number, a: { errorRate: number }) => sum + a.errorRate,
                      0
                    ) / unhealthy.length
                  ).toFixed(1) + "%",
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (error) {
          console.error("[AgentHealth] Falha ao enviar notificação:", error);
        }

        // Pausar agentes degradados automaticamente
        unhealthy.forEach((agent: { agentId: string; p95Latency: number; errorRate: number }) => {
          setAgents((current) =>
            updateAgentInList(current || [], agent.agentId, {
              status: "paused",
              lastActivity: `Pausado: alta latência (${agent.p95Latency}ms) ou erro (${agent.errorRate}%)`,
            })
          );
        });
      }
    };

    // Verificar a cada 5 minutos
    const interval = setInterval(checkAgentHealth, 5 * 60 * 1000);

    // Verificação inicial após 30 segundos
    const timeout = setTimeout(checkAgentHealth, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [setAgents]);

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
    // ✨ NOVO: Expor função de atualização validada
    updateAgentWithValidation,
  };
}
