import { useCallback, useEffect, useRef, useState } from "react";
import { useKV } from "./use-kv";

/**
 * Hook para backup dos dados dos agentes IA
 *
 * Arquitetura de Storage:
 * - PRIMÁRIO: Upstash KV (servidor) - 256MB+, persistente, cross-device
 * - CACHE: localStorage (browser) - 5MB limite, apenas cache local
 *
 * O localStorage é usado apenas como cache rápido.
 * Todos os backups são salvos primariamente no servidor (Upstash KV).
 */

interface BackupOptions {
  userId: string;
  autoBackupInterval?: number; // minutos (padrão: 5)
  enableAutoBackup?: boolean;
}

// Constantes de configuração
const BACKUP_KEY_PREFIX = "agent-backup";
const MAX_HISTORY_SIZE = 10; // Máximo de backups no histórico
const MAX_TASKS_IN_BACKUP = 100; // Limitar tarefas para economizar espaço
const LOCAL_CACHE_KEY = "agent-backup-cache"; // Cache local simplificado

// Em Vercel/Serverless, payloads grandes podem falhar com 413 antes mesmo do handler.
// Mantemos uma margem abaixo do limite do endpoint /api/kv.
const BACKUP_RETRY_TASK_LIMITS = [MAX_TASKS_IN_BACKUP, 50, 20, 5] as const;

interface BackupData {
  timestamp: number;
  userId: string;
  data: {
    agents: unknown[];
    monitoredLawyers: unknown[];
    taskQueue: unknown[];
    completedTasks: unknown[];
    lastDjenCheck: unknown;
  };
}

interface BackupHistoryEntry {
  timestamp: number;
  userId: string;
  summary: {
    agentsCount: number;
    taskQueueCount: number;
    completedTasksCount: number;
    lastDjenCheck: unknown;
  };
}

function limitArray<T>(value: unknown, limit: number, fromEnd: boolean = false): T[] {
  if (!Array.isArray(value)) return [];
  const arr = value as T[];
  return fromEnd ? arr.slice(-limit) : arr.slice(0, limit);
}

function buildHistoryEntry(backupData: BackupData): BackupHistoryEntry {
  return {
    timestamp: backupData.timestamp,
    userId: backupData.userId,
    summary: {
      agentsCount: Array.isArray(backupData.data.agents) ? backupData.data.agents.length : 0,
      taskQueueCount: Array.isArray(backupData.data.taskQueue)
        ? backupData.data.taskQueue.length
        : 0,
      completedTasksCount: Array.isArray(backupData.data.completedTasks)
        ? backupData.data.completedTasks.length
        : 0,
      lastDjenCheck: backupData.data.lastDjenCheck,
    },
  };
}

function shrinkAgentsForBackup(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 15).map((a) => {
    if (!a || typeof a !== "object") return a;

    const obj = a as Record<string, unknown>;
    // Evita campos potencialmente enormes (ex.: workQueue/currentTask/serverLogs)
    return {
      id: obj.id,
      name: obj.name,
      type: obj.type,
      status: obj.status,
      enabled: obj.enabled,
      lastActivity: obj.lastActivity,
      continuousMode: obj.continuousMode,
      humanInteractionMode: obj.humanInteractionMode,
      recentFailures: obj.recentFailures,
      lastFailureAt: obj.lastFailureAt,
      nextScheduledRun: obj.nextScheduledRun,
    };
  });
}

export function useAgentBackup(options: BackupOptions) {
  const { userId, autoBackupInterval = 5, enableAutoBackup = true } = options;

  const [agents] = useKV("autonomous-agents", []);
  const [monitoredLawyers] = useKV("monitored-lawyers", []);
  const [taskQueue] = useKV("agent-task-queue", []);
  const [completedTasks] = useKV("completed-agent-tasks", []);
  const [lastDjenCheck] = useKV("last-djen-check", null);

  // Use state instead of ref for lastBackup to avoid accessing ref during render
  const [lastBackup, setLastBackup] = useState<number>(0);
  const [storageType, setStorageType] = useState<"server" | "local">("server");
  const backupInProgress = useRef(false);

  /**
   * Salva backup no servidor (Upstash KV) - Storage primário
   */
  const saveToServer = useCallback(
    async (backupData: BackupData): Promise<boolean> => {
      try {
        const serverKey = `${BACKUP_KEY_PREFIX}:${userId}:latest`;

        // 1) Salvar o backup completo (latest) com retries reduzindo o tamanho se necessário.
        let latestSaved = false;
        for (const taskLimit of BACKUP_RETRY_TASK_LIMITS) {
          const shrunk: BackupData = {
            ...backupData,
            data: {
              ...backupData.data,
              agents: shrinkAgentsForBackup(backupData.data.agents),
              monitoredLawyers: limitArray(backupData.data.monitoredLawyers, 50, false),
              taskQueue: limitArray(backupData.data.taskQueue, taskLimit, false),
              completedTasks: limitArray(backupData.data.completedTasks, taskLimit, true),
            },
          };

          const response = await fetch("/api/kv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: serverKey,
              value: shrunk,
              // TTL de 30 dias para backups
              ex: 60 * 60 * 24 * 30,
            }),
          });

          if (response.ok) {
            latestSaved = true;
            break;
          }

          // Se o problema for tamanho, tentamos novamente com payload menor.
          if (response.status === 413 || response.status === 400) {
            continue;
          }

          throw new Error(`Server responded with ${response.status}`);
        }

        if (!latestSaved) {
          throw new Error("Server rejected backup payload (too large)");
        }

        // Salvar no histórico do servidor
        const historyKey = `${BACKUP_KEY_PREFIX}:${userId}:history`;

        // IMPORTANTE: histórico não salva backups completos (muito grande).
        // Guardamos apenas metadados compactos para evitar 413.
        const historyResponse = await fetch(`/api/kv?key=${encodeURIComponent(historyKey)}`);
        let history: BackupHistoryEntry[] = [];

        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          history = Array.isArray(historyData.value)
            ? (historyData.value as BackupHistoryEntry[])
            : [];
        }

        const entry = buildHistoryEntry(backupData);

        // Adicionar ao início e limitar tamanho
        history.unshift(entry);
        if (history.length > MAX_HISTORY_SIZE) {
          history = history.slice(0, MAX_HISTORY_SIZE);
        }

        // Se falhar, não derruba o backup principal (latest) — histórico é best-effort.
        await fetch("/api/kv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: historyKey,
            value: history,
            ex: 60 * 60 * 24 * 30,
          }),
        }).catch(() => {
          // silencioso
        });

        if (import.meta.env.DEV) {
          console.log("✅ Backup salvo no servidor (Upstash KV)");
        }
        return true;
      } catch (error) {
        console.warn("⚠️ Falha ao salvar no servidor:", error);
        return false;
      }
    },
    [userId]
  );

  /**
   * Carrega backup do servidor (Upstash KV)
   */
  const loadFromServer = useCallback(async (): Promise<BackupData | null> => {
    try {
      const serverKey = `${BACKUP_KEY_PREFIX}:${userId}:latest`;
      const response = await fetch(`/api/kv?key=${encodeURIComponent(serverKey)}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.value || null;
    } catch (error) {
      console.warn("⚠️ Falha ao carregar do servidor:", error);
      return null;
    }
  }, [userId]);

  /**
   * Salva metadados do backup no cache local (localStorage)
   * Apenas para referência rápida - não salva dados completos
   */
  const saveToLocalCache = useCallback((backupData: BackupData) => {
    try {
      const cacheData = {
        timestamp: backupData.timestamp,
        userId: backupData.userId,
        summary: {
          agentsCount: Array.isArray(backupData.data.agents) ? backupData.data.agents.length : 0,
          taskQueueCount: Array.isArray(backupData.data.taskQueue)
            ? backupData.data.taskQueue.length
            : 0,
          lastDjenCheck: backupData.data.lastDjenCheck,
        },
      };

      setLastBackup(backupData.timestamp);

      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cacheData));
    } catch {
      // Ignorar erros de localStorage - não é crítico
      console.log("ℹ️ Cache local não disponível");
    }
  }, []);

  /**
   * Limpa dados antigos do localStorage para evitar QuotaExceededError
   */
  const cleanLocalStorage = useCallback(() => {
    try {
      // Remover chaves antigas do sistema de backup anterior
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(BACKUP_KEY_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        if (key !== LOCAL_CACHE_KEY) {
          localStorage.removeItem(key);
        }
      });

      // Log de limpeza removido - poluía o console
    } catch {
      // Ignorar erros
    }
  }, []);

  /**
   * Cria backup - Salva no servidor (primário) e cache local (secundário)
   */
  const createBackup = useCallback(async () => {
    // Evitar backups simultâneos
    if (backupInProgress.current) {
      if (import.meta.env.DEV) {
        console.log("ℹ️ Backup já em andamento, ignorando...");
      }
      return { success: false, reason: "backup_in_progress" };
    }

    backupInProgress.current = true;

    try {
      const backupData: BackupData = {
        timestamp: Date.now(),
        userId,
        data: {
          agents,
          monitoredLawyers,
          // Limitar tarefas para economizar espaço
          taskQueue: Array.isArray(taskQueue) ? taskQueue.slice(0, MAX_TASKS_IN_BACKUP) : [],
          completedTasks: Array.isArray(completedTasks)
            ? completedTasks.slice(-MAX_TASKS_IN_BACKUP)
            : [],
          lastDjenCheck,
        },
      };

      // 1. Tentar salvar no servidor (primário)
      const serverSuccess = await saveToServer(backupData);

      if (serverSuccess) {
        setStorageType("server");
        // 2. Salvar cache local (apenas metadados)
        saveToLocalCache(backupData);
        // 3. Limpar dados antigos do localStorage
        cleanLocalStorage();
      } else {
        // Fallback: tentar localStorage se servidor falhar
        console.warn("⚠️ Servidor indisponível, backup local será tentado...");
        setStorageType("local");

        let localStorageSuccess = false;
        try {
          // Salvar dados mínimos no localStorage
          const minimalData = {
            timestamp: backupData.timestamp,
            userId,
            data: {
              agents: agents.slice(0, 15),
              taskQueue: Array.isArray(taskQueue) ? taskQueue.slice(0, 20) : [],
            },
          };
          localStorage.setItem(`${BACKUP_KEY_PREFIX}:fallback`, JSON.stringify(minimalData));
          localStorageSuccess = true;
        } catch (localError) {
          if (localError instanceof DOMException && localError.name === "QuotaExceededError") {
            cleanLocalStorage();
            console.warn("⚠️ localStorage cheio, limpeza realizada");
          }
          console.warn("⚠️ Falha ao salvar no localStorage", localError);
        }

        // Se localStorage também falhou, retornar erro
        if (!localStorageSuccess) {
          return {
            success: false,
            error: new Error("Falha ao salvar backup: servidor indisponível e localStorage falhou"),
          };
        }
      }

      setLastBackup(backupData.timestamp);
      if (import.meta.env.DEV) {
        console.log("✅ Backup criado:", new Date(backupData.timestamp).toLocaleString());
      }

      // Return the actual storage used, not the state variable (which might be stale)
      return {
        success: true,
        timestamp: backupData.timestamp,
        storage: serverSuccess ? "server" : "local",
      };
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      return { success: false, error };
    } finally {
      backupInProgress.current = false;
    }
  }, [
    userId,
    agents,
    monitoredLawyers,
    taskQueue,
    completedTasks,
    lastDjenCheck,
    saveToServer,
    saveToLocalCache,
    cleanLocalStorage,
  ]);

  /**
   * Restaura backup do servidor ou cache local
   */
  const restoreBackup = useCallback(async () => {
    try {
      // 1. Tentar restaurar do servidor primeiro
      const serverBackup = await loadFromServer();

      if (serverBackup) {
        console.log(
          "✅ Backup restaurado do servidor:",
          new Date(serverBackup.timestamp).toLocaleString()
        );
        return serverBackup;
      }

      // 2. Fallback: tentar localStorage
      const fallbackStr = localStorage.getItem(`${BACKUP_KEY_PREFIX}:fallback`);
      if (fallbackStr) {
        const fallback = JSON.parse(fallbackStr);
        console.log(
          "ℹ️ Backup local restaurado (fallback):",
          new Date(fallback.timestamp).toLocaleString()
        );
        return fallback;
      }

      console.log("ℹ️ Nenhum backup encontrado");
      return null;
    } catch (error) {
      console.error("❌ Erro ao restaurar backup:", error);
      throw error;
    }
  }, [loadFromServer]);

  /**
   * Obtém histórico de backups do servidor
   */
  const getBackupHistory = useCallback(async () => {
    try {
      const historyKey = `${BACKUP_KEY_PREFIX}:${userId}:history`;
      const response = await fetch(`/api/kv?key=${encodeURIComponent(historyKey)}`);

      let history: BackupHistoryEntry[] = [];
      if (response.ok) {
        const data = await response.json();
        history = Array.isArray(data.value) ? (data.value as BackupHistoryEntry[]) : [];
      }

      return {
        success: true,
        lastBackup: history[0]?.timestamp || null,
        backupCount: history.length,
        history,
        storage: "server",
        maxCapacity: "256MB+ (Upstash KV)",
      };
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error);
      return {
        success: false,
        lastBackup: null,
        backupCount: 0,
        history: [],
        storage: "server",
        error,
      };
    }
  }, [userId]);

  // Backup automático periódico
  useEffect(() => {
    if (!enableAutoBackup || !userId) return;

    const intervalMs = autoBackupInterval * 60 * 1000;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    // Backup imediato se houver dados e não houver backup recente (via timeout)
    const now = Date.now();
    if (agents.length > 0 && now - lastBackup > intervalMs) {
      // Schedule to avoid synchronous setState in effect
      timeoutId = globalThis.setTimeout(createBackup, 0);
    }

    // Configurar backup periódico
    const timer = setInterval(() => {
      if (agents.length > 0) {
        createBackup();
      }
    }, intervalMs);

    return () => {
      if (timeoutId) {
        globalThis.clearTimeout(timeoutId);
      }
      clearInterval(timer);
    };
  }, [enableAutoBackup, autoBackupInterval, userId, agents, createBackup, lastBackup]);

  // Não tenta restaurar automaticamente - dados já estão no Upstash KV
  // Restauração manual disponível via botão

  return {
    createBackup,
    restoreBackup,
    getBackupHistory,
    lastBackup,
    storageType,
  };
}
