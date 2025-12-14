import { useKV } from "@/hooks/use-kv";
import { getUnhealthyAgents, metricsCollector } from "@/lib/agent-metrics";
import {
  canResumeAfterHuman,
  initializeAgents,
  shouldPauseForHuman,
  type Agent,
  type AgentTask,
  type AgentTaskResult,
} from "@/lib/agents";
import { toast } from "sonner";
// ✨ NOVO: Importar validadores Zod
import { executeHybridTask, hasHybridVersion } from "@/lib/hybrid-agents-integration";
import { processTaskWithRealAI, processTaskWithStreamingAI } from "@/lib/real-agent-client";
import { validateAgentTask } from "@/schemas/agent.schema";
import { useCallback, useEffect, useRef, useState } from "react";

// 🔵 NOVO: Importar Azure Application Insights
import {
  measurePerformance,
  trackAgentPerformance,
  trackAgentTask,
  trackError,
} from "@/lib/azure-insights";

// 📊 NOVO: Importar tracing OpenTelemetry
import { addEvent, endSpan, setAttribute, startAgentSpan } from "@/lib/tracing";

// 🔍 TRACING: Importar tracing OpenTelemetry

// ===========================
// Type Aliases
// ===========================

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
  setAgents: (fn: (current: Array<Agent> | null) => Array<Agent>) => void,
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
  setTaskQueue: StateSetter<Array<AgentTask>>,
  setCompletedTasks: StateSetter<Array<AgentTask>>,
  setAgents: StateSetter<Array<Agent>>,
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

  // 🟡 NOVO: Enviar telemetria de tarefa concluída
  trackAgentTask(
    agentId,
    task.type,
    result?.success ? "COMPLETED" : "FAILED",
    Date.now() - new Date(task.createdAt).getTime(),
    result?.success ? undefined : String(result?.error || "Unknown error")
  );
}

type TaskQueueSetter = (fn: (current: Array<AgentTask> | null) => Array<AgentTask>) => void;

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

function sortTasksByPriority(tasks: Array<AgentTask>): Array<AgentTask> {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}

function updateAgentInList(
  agents: Array<Agent>,
  agentId: string,
  updates: Partial<Agent>
): Array<Agent> {
  return agents.map((a) => (a.id === agentId ? { ...a, ...updates } : a));
}

function updateTaskInQueue(
  tasks: Array<AgentTask>,
  taskId: string,
  updates: Partial<AgentTask>
): Array<AgentTask> {
  return tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
}

function getQueuedTasksForAgent(queue: Array<AgentTask>, agentId: string): Array<AgentTask> {
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

/**
 * Executa tarefa do agente selecionando modo apropriado
 * Reduz complexidade cognitiva ao extrair lógica de execução
 */
async function executeAgentTask(
  agent: Agent,
  task: AgentTask,
  agentSpan: any,
  useStreaming: boolean,
  logActivity: (agentId: string, action: string, result: ActivityResult) => void,
  setStreamingContent: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  setAgents: (fn: (current: Array<Agent> | null) => Array<Agent>) => void
): Promise<AgentTaskResult> {
  const hasHybrid = hasHybridVersion(agent.id);

  // Adicionar evento sobre tipo de execução
  addEvent(agentSpan, "execution.mode.selected", {
    has_hybrid: hasHybrid,
    use_streaming: useStreaming,
  });

  if (hasHybrid) {
    // Usar arquitetura híbrida com fallback automático
    setAttribute(agentSpan, "execution.mode", "hybrid");
    const hybridResult = await executeHybridTask(agent.id, task, {
      enableLangGraph: true,
      enableTraditional: true,
      coordinationMode: "fallback",
      timeoutMs: 30_000,
    });

    // Adicionar métricas do resultado híbrido
    setAttribute(agentSpan, "hybrid.mode_used", hybridResult.mode);
    setAttribute(agentSpan, "hybrid.execution_time_ms", hybridResult.executionTime);
    setAttribute(agentSpan, "hybrid.success", hybridResult.success);

    // Converter e retornar resultado
    return convertHybridToTaskResult(hybridResult, agent, logActivity);
  }

  if (useStreaming) {
    // Fallback para agentes sem versão híbrida - usar streaming tradicional
    const callbacks = createStreamingCallbacks(
      agent.id,
      setStreamingContent,
      setAgents,
      logActivity
    );
    return await processTaskWithStreamingAI(task, agent, callbacks);
  }

  // Fallback para processamento tradicional sem streaming
  return await processTaskWithRealAI(task, agent);
}

/**
 * Converte resultado híbrido para formato AgentTaskResult
 * Reduz complexidade cognitiva ao extrair lógica de conversão complexa
 */
function convertHybridToTaskResult(
  hybridResult: any,
  agent: Agent,
  logActivity: (agentId: string, action: string, result: ActivityResult) => void
): AgentTaskResult {
  const langGraphData = hybridResult.langGraphResult?.data;
  const traditionalOutput = (hybridResult.traditionalResult as Record<string, unknown>)?.output;

  const resultData: Record<string, unknown> =
    (langGraphData && typeof langGraphData === "object"
      ? (langGraphData as Record<string, unknown>)
      : undefined) ||
    (traditionalOutput && typeof traditionalOutput === "object"
      ? (traditionalOutput as Record<string, unknown>)
      : undefined) ||
    {};

  const taskResult = {
    success: hybridResult.success,
    data: resultData,
    message: `Executado via ${hybridResult.mode}`,
    processingTimeMs: hybridResult.executionTime,
    confidence: hybridResult.success ? 0.95 : 0.5,
    tokensUsed: 0, // Híbrido ainda não rastreia tokens
  } satisfies AgentTaskResult;

  // 🔵 AZURE: Track execução híbrida
  trackAgentTask(
    agent.id,
    hybridResult.mode,
    hybridResult.success ? "COMPLETED" : "FAILED",
    hybridResult.executionTime,
    hybridResult.success ? undefined : "Hybrid execution failed"
  );

  logActivity(
    agent.id,
    `Executado via ${hybridResult.mode} (${hybridResult.executionTime}ms)`,
    hybridResult.success ? "success" : "error"
  );

  return taskResult;
}

/**
 * Fetch logs do servidor com timeout
 * Reduz complexidade cognitiva ao extrair lógica de fetch
 */
async function fetchServerLogs(
  setServerLogs: React.Dispatch<React.SetStateAction<Array<AgentActionLog>>>
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch("/api/agents?action=logs", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.logs && Array.isArray(data.logs)) {
        setServerLogs(data.logs);
      }
    }
    // Ignorar silenciosamente erros 401 em desenvolvimento
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch memória jurídica do servidor com timeout
 * Reduz complexidade cognitiva ao extrair lógica de fetch
 */
async function fetchServerMemory(
  setLegalMemory: React.Dispatch<React.SetStateAction<Array<MemoryItem>>>
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch("/api/agents?action=memory", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.memory && Array.isArray(data.memory)) {
        setLegalMemory(data.memory);
      }
    }
    // Ignorar silenciosamente erros 401 em desenvolvimento
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Valida estrutura de agentes armazenados
 * Reduz complexidade cognitiva ao extrair validação aninhada
 */
function validateAndReturnAgents(parsed: unknown): Array<Agent> {
  // Verificar se é array com 15 elementos
  if (!Array.isArray(parsed) || parsed.length !== 15) {
    console.log("[Agents] Estrutura inválida ou quantidade incorreta → reinicializando");
    return initializeAgents();
  }

  // Validar estrutura básica dos agentes
  const hasValidStructure = parsed.every(
    (agent) => agent && typeof agent === "object" && agent.id && agent.name
  );

  if (!hasValidStructure) {
    console.log("[Agents] Estrutura inválida → reinicializando");
    return initializeAgents();
  }

  return parsed;
}

function getInitialAgents(): Array<Agent> {
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
      return validateAndReturnAgents(parsed);
    }
  } catch (e) {
    console.error("[Agents] Erro ao carregar agentes:", e);
  }

  return initializeAgents();
}

export function useAutonomousAgents() {
  useKV<number>("agents-data-version", AGENTS_DATA_VERSION);

  const [agents, setAgents] = useKV<Array<Agent>>("autonomous-agents", getInitialAgents());
  const [taskQueue, setTaskQueue] = useKV<Array<AgentTask>>("agent-task-queue", []);
  const [completedTasks, setCompletedTasks] = useKV<Array<AgentTask>>("completed-agent-tasks", []);
  const [activityLog, setActivityLog] = useKV<
    Array<{
      id: string;
      agentId: string;
      timestamp: string;
      action: string;
      result: ActivityResult;
    }>
  >("agent-activity-log", []);

  // Estado para logs do servidor e memória jurídica
  const [serverLogs, setServerLogs] = useState<Array<AgentActionLog>>([]);
  const [legalMemory, setLegalMemory] = useState<Array<MemoryItem>>([]);

  // Estado para streaming em tempo real
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [useStreaming, setUseStreaming] = useState(true); // Streaming habilitado por padrão

  const processingRef = useRef<Set<string>>(new Set());

  // 🔥 FIX: Flag para prevenir loop infinito
  const isInitializingRef = useRef(false);

  // Garante sempre 15 agentes (com proteção contra loop infinito)
  useEffect(() => {
    // Prevenir loop infinito
    if (isInitializingRef.current) return;

    // Validar apenas se agents existe e não está vazio
    if (!agents || agents.length === 0) {
      console.log("[Agents] Inicializando agentes pela primeira vez");
      isInitializingRef.current = true;
      setAgents(initializeAgents());
      setTimeout(() => {
        isInitializingRef.current = false;
      }, 100);
      return;
    }

    // Se tiver quantidade errada, reinicializar (mas apenas uma vez)
    if (agents.length === 15) return;

    console.log(`[Agents] Quantidade incorreta (${agents.length}) → reinicializando para 15`);
    isInitializingRef.current = true;
    setAgents(initializeAgents());
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
  }, [agents, setAgents]);

  // =============================
  // SYNC COM SERVIDOR (Logs e Memória)
  // =============================
  const fetchServerData = useCallback(async () => {
    try {
      await fetchServerLogs(setServerLogs);
      await fetchServerMemory(setLegalMemory);
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
      } catch (error) {
        failureCount++;
        console.warn("[Agents] Falha ao sincronizar com servidor (poll)", error);
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
    interval = setInterval(pollWithBackoff, 60_000); // 60s

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchServerData]);

  // =============================
  // TASK QUEUE
  // =============================

  // Helper para adicionar tarefa à fila (reduz S2004 nesting)
  const addTaskToQueue = useCallback(
    (current: Array<AgentTask>, task: AgentTask): Array<AgentTask> => {
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
    },
    []
  );

  // ✨ MODIFICADO: addTask agora usa validação
  const addTask = useCallback(
    (task: AgentTask) => {
      setTaskQueue((current) => addTaskToQueue(current || [], task));
    },
    [setTaskQueue, addTaskToQueue]
  );

  // Helper para criar log de atividade (reduz S2004 nesting)
  const createActivityLog = useCallback(
    (agentId: string, action: string, result: ActivityResult = "success") => ({
      id: crypto.randomUUID(),
      agentId,
      timestamp: new Date().toISOString(),
      action,
      result,
    }),
    []
  );

  // Helper para adicionar log à lista (reduz S2004 nesting)
  const addLogToActivityList = useCallback(
    (current: Array<ActivityLogEntry>, log: ActivityLogEntry): Array<ActivityLogEntry> =>
      [log, ...(current || [])].slice(0, 100),
    []
  );

  const logActivity = useCallback(
    (agentId: string, action: string, result: ActivityResult = "success") => {
      setActivityLog((current) => {
        const log = createActivityLog(agentId, action, result);
        return addLogToActivityList(current || [], log);
      });
    },
    [setActivityLog, createActivityLog, addLogToActivityList]
  );

  const shouldSkipAgentProcessing = useCallback(
    (agent: Agent) =>
      processingRef.current.has(agent.id) || !agent.enabled || agent.status === "paused",
    []
  );

  const setAgentIdle = useCallback(
    (agentId: string) => {
      setAgents((current) =>
        updateAgentInList(current || [], agentId, {
          status: "idle",
          currentTask: undefined,
        })
      );
    },
    [setAgents]
  );

  const getNextTaskForProcessing = useCallback(
    (agent: Agent): AgentTask | undefined => {
      const queue = getQueuedTasksForAgent(taskQueue || [], agent.id);
      if (queue.length === 0) {
        setAgentIdle(agent.id);
        return undefined;
      }
      return queue[0];
    },
    [taskQueue, setAgentIdle]
  );

  const pauseForHumanIfNeeded = useCallback(
    (agent: Agent, task: AgentTask): boolean => {
      if (!shouldPauseForHuman(agent, task)) return false;
      setAgents((current) =>
        updateAgentInList(current || [], agent.id, {
          status: "waiting_human",
          currentTask: task,
        })
      );
      return true;
    },
    [setAgents]
  );

  const markTaskAsProcessing = useCallback(
    (agent: Agent, task: AgentTask) => {
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
    },
    [setTaskQueue, setAgents]
  );

  // =============================
  // CORE: PROCESSAMENTO DE TAREFAS
  // =============================
  const processNextTask = useCallback(
    async (agent: Agent) => {
      if (shouldSkipAgentProcessing(agent)) return;

      const task = getNextTaskForProcessing(agent);
      if (!task || pauseForHumanIfNeeded(agent, task)) return;

      processingRef.current.add(agent.id);

      // ✅ Registrar início da métrica
      const startTime = Date.now();

      markTaskAsProcessing(agent, task);

      // 🔍 TRACING: Iniciar span para tarefa do agente (fora do try para uso no catch)
      const agentSpan = startAgentSpan(agent.id, agent.name, {
        attributes: {
          "task.id": task.id,
          "task.type": task.type,
          "task.priority": task.priority,
          "agent.status": agent.status,
        },
      });

      try {
        // Adicionar evento de início
        addEvent(agentSpan, "task.started", {
          "task.data": JSON.stringify(task.data || {}).substring(0, 200),
        });

        const result = await measurePerformance(
          `AgentTask_${task.type}`,
          () =>
            executeAgentTask(
              agent,
              task,
              agentSpan,
              useStreaming,
              logActivity,
              setStreamingContent,
              setAgents
            ),
          { agentId: agent.id, taskType: task.type }
        );

        // ✅ Registrar métrica de sucesso
        const duration = Date.now() - startTime;
        metricsCollector.recordMetric({
          agentId: agent.id,
          timestamp: Date.now(),
          duration,
          success: true,
          tokensUsed: result.tokensUsed || 0,
          taskType: task.type,
        });

        // 🔍 TRACING: Adicionar evento de conclusão
        addEvent(agentSpan, "task.completed", {
          "result.success": result.success,
          "result.confidence": result.confidence || 0,
          processing_time_ms: duration,
          tokens_used: (result as any).tokensUsed || 0,
        });

        // Finalizar span com sucesso
        setAttribute(agentSpan, "task.status", "completed");
        setAttribute(agentSpan, "task.duration_ms", duration);
        if ((result as any).tokensUsed) {
          setAttribute(agentSpan, "task.tokens_used", (result as any).tokensUsed);
        }
        await endSpan(agentSpan, "ok");

        // �🔵 AZURE: Track tarefa concluída
        trackAgentTask(agent.id, task.type, "COMPLETED", duration);

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
        // ✅ Registrar métrica de erro
        const duration = Date.now() - startTime;
        metricsCollector.recordMetric({
          agentId: agent.id,
          timestamp: Date.now(),
          duration,
          success: false,
          taskType: task.type,
          error: err instanceof Error ? err.message : String(err),
        });

        // 🔵 AZURE: Track erro da tarefa
        trackAgentTask(
          agent.id,
          task.type,
          "FAILED",
          duration,
          err instanceof Error ? err.message : String(err)
        );

        // 🔵 AZURE: Track exceção
        trackError(err instanceof Error ? err : new Error(String(err)), {
          component: "useAutonomousAgents",
          agentId: agent.id,
          taskId: task.id,
          severity: "error",
        });

        // 🔍 TRACING: Finalizar span com erro
        const errorMessage = err instanceof Error ? err.message : String(err);
        setAttribute(agentSpan, "task.status", "failed");
        setAttribute(agentSpan, "task.duration_ms", duration);
        setAttribute(agentSpan, "task.error", errorMessage);
        addEvent(agentSpan, "task.error", {
          "error.message": errorMessage,
          "error.type": err instanceof Error ? err.name : "unknown",
        });
        await endSpan(agentSpan, "error", errorMessage);

        // Use extracted helper for failure (S2004 compliance)
        handleTaskFailure(task, err, agent.id, setTaskQueue, logActivity);
      } finally {
        processingRef.current.delete(agent.id);
      }
    },
    [
      getNextTaskForProcessing,
      markTaskAsProcessing,
      pauseForHumanIfNeeded,
      setCompletedTasks,
      logActivity,
      useStreaming,
      shouldSkipAgentProcessing,
    ]
  );

  const processNextTaskRef = useRef(processNextTask);

  useEffect(() => {
    processNextTaskRef.current = processNextTask;
  }, [processNextTask]);

  // =============================
  // LOOP CONTÍNUO DE PROCESSAMENTO DE TAREFAS
  // =============================
  useEffect(() => {
    const processAgentTasks = async () => {
      const enabledAgents = (agents || []).filter(
        (agent) => agent.enabled && agent.status !== "paused"
      );

      for (const agent of enabledAgents) {
        // Chamar processNextTask via ref para evitar dependências do useEffect
        await processNextTaskRef.current(agent);
      }
    };

    // Processar tarefas imediatamente no mount
    processAgentTasks();

    // Processar tarefas periodicamente (a cada 5 segundos)
    const interval = setInterval(processAgentTasks, 5_000);

    return () => clearInterval(interval);
  }, [agents, taskQueue]);

  // =============================
  // LOOP CONTÍNUO DE PROCESSAMENTO
  // =============================

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

  // Atualiza agentes a cada 10s (intervalo reduzido para detecções mais rápidas)
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setAgents((current) => (current || []).map(updateSingleAgentActivity));
    }, 10_000); // 10s

    return () => {
      clearInterval(updateInterval);
    };
  }, [agents, setAgents, updateSingleAgentActivity]);

  // 🔥 FIX: Executa sempre pelo menos uma vez no mount
  useEffect(() => {
    const initialUpdate = async () => {
      setAgents((current) => (current || []).map(updateSingleAgentActivity));
    };

    initialUpdate();
  }, [setAgents, updateSingleAgentActivity]);

  // 🚨 Sistema de Alertas Automáticos - Detecta agentes degradados
  useEffect(() => {
    const checkAgentHealth = async () => {
      const unhealthy = getUnhealthyAgents({
        maxLatencyMs: 5000, // 5 segundos
        maxErrorRate: 10, // 10% de erro
      });

      if (unhealthy.length === 0) return;

      console.warn(
        "[AgentHealth] Agentes degradados detectados:",
        unhealthy.map((a: { agentId: string }) => a.agentId)
      );

      // 🔵 AZURE: Track métricas de performance dos agentes
      unhealthy.forEach((agent: any) => {
        trackAgentPerformance(agent.agentId, {
          tasksCompleted: 0, // Agente degradado
          averageProcessingTime: agent.p95Latency,
          errorRate: agent.errorRate,
        });
      });

      // Notificação visual local
      toast.error(`⚠️ ${unhealthy.length} agente(s) degradado(s)`, {
        description: `Agentes com problemas: ${unhealthy.map((a: { agentId: string }) => a.agentId).join(", ")}`,
        duration: 10_000,
      });
    };

    // Verifica imediatamente no mount
    checkAgentHealth();

    // Verifica a cada 60s
    const interval = setInterval(checkAgentHealth, 60_000);

    return () => clearInterval(interval);
  }, [setAgents]);

  // =============================
  // TOGGLE FUNCTIONS
  // =============================
  const toggleAgent = useCallback(
    (agentId: string) => {
      setAgents((current) =>
        (current || []).map((agent) =>
          agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent
        )
      );
    },
    [setAgents]
  );

  const toggleStreaming = useCallback(() => {
    setUseStreaming((current: boolean) => !current);
  }, []);

  // =============================
  // RETURN HOOK API
  // =============================
  return {
    agents: agents || [],
    taskQueue: taskQueue || [],
    completedTasks: completedTasks || [],
    activityLog: activityLog || [],
    serverLogs,
    legalMemory,
    streamingContent,
    isStreamingEnabled: useStreaming,
    addTask,
    toggleAgent,
    toggleStreaming,
    refreshServerData: fetchServerData,
    setAgents,
  };
}
