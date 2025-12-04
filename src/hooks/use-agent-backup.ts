import { useEffect, useCallback, useState } from "react";
import { useKV } from "./use-kv";

/**
 * Hook para backup local dos dados dos agentes IA
 * Usa localStorage do navegador com backup redundante
 *
 * NOTA: Para backup em servidor (cross-device), configure:
 * - Vercel KV (requer plano Pro)
 * - Ou Supabase (free tier disponível)
 */

interface BackupOptions {
  userId: string;
  autoBackupInterval?: number; // minutos (padrão: 5)
  enableAutoBackup?: boolean;
}

const BACKUP_KEY_PREFIX = "agent-backup";

export function useAgentBackup(options: BackupOptions) {
  const { userId, autoBackupInterval = 5, enableAutoBackup = true } = options;

  const [agents] = useKV("autonomous-agents", []);
  const [monitoredLawyers] = useKV("monitored-lawyers", []);
  const [taskQueue] = useKV("agent-task-queue", []);
  const [completedTasks] = useKV("completed-agent-tasks", []);
  const [lastDjenCheck] = useKV("last-djen-check", null);

  // Use state instead of ref for lastBackup to avoid accessing ref during render
  const [lastBackup, setLastBackup] = useState<number>(0);

  // Função para criar backup local
  const createBackup = useCallback(async () => {
    try {
      const backupData = {
        timestamp: Date.now(),
        userId,
        data: {
          agents,
          monitoredLawyers,
          taskQueue,
          completedTasks,
          lastDjenCheck,
        },
      };

      // Salvar no localStorage como backup redundante
      const backupKey = `${BACKUP_KEY_PREFIX}:${userId}:latest`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      // Manter histórico dos últimos 7 backups
      const historyKey = `${BACKUP_KEY_PREFIX}:${userId}:history`;
      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      history.unshift(backupData);

      if (history.length > 7) {
        history.splice(7);
      }

      localStorage.setItem(historyKey, JSON.stringify(history));

      // Salvar timestamp do último backup
      localStorage.setItem(`${BACKUP_KEY_PREFIX}:${userId}:lastBackup`, String(Date.now()));

      setLastBackup(backupData.timestamp);

      console.log("✅ Backup local criado:", new Date(backupData.timestamp).toLocaleString());

      // Validar com servidor (opcional - não bloqueia se falhar)
      try {
        await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, data: backupData.data }),
        });
      } catch {
        console.log("ℹ️ Server validation skipped (offline or unavailable)");
      }

      return { success: true, timestamp: backupData.timestamp };
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error);
      throw error;
    }
  }, [userId, agents, monitoredLawyers, taskQueue, completedTasks, lastDjenCheck]);

  // Função para restaurar backup local
  const restoreBackup = useCallback(async () => {
    try {
      const backupKey = `${BACKUP_KEY_PREFIX}:${userId}:latest`;
      const backupStr = localStorage.getItem(backupKey);

      if (!backupStr) {
        console.log("ℹ️ Nenhum backup local encontrado");
        return null;
      }

      const backup = JSON.parse(backupStr);
      console.log("✅ Backup local restaurado:", new Date(backup.timestamp).toLocaleString());

      return backup;
    } catch (error) {
      console.error("❌ Erro ao restaurar backup:", error);
      throw error;
    }
  }, [userId]);

  // Função para obter histórico local
  const getBackupHistory = useCallback(async () => {
    try {
      const historyKey = `${BACKUP_KEY_PREFIX}:${userId}:history`;
      const historyStr = localStorage.getItem(historyKey);
      const history = historyStr ? JSON.parse(historyStr) : [];

      const lastBackupStr = localStorage.getItem(`${BACKUP_KEY_PREFIX}:${userId}:lastBackup`);
      const lastBackup = lastBackupStr ? Number.parseInt(lastBackupStr, 10) : null;

      return {
        success: true,
        lastBackup,
        backupCount: history.length,
        history,
        storage: "local",
      };
    } catch (error) {
      console.error("❌ Erro ao buscar histórico:", error);
      throw error;
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

  // Não tenta restaurar automaticamente - dados já estão no Spark KV
  // Restauração manual disponível via botão

  return {
    createBackup,
    restoreBackup,
    getBackupHistory,
    lastBackup,
    storageType: "local" as const,
  };
}
