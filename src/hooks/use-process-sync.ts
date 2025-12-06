/**
 * Hook para sincronização automática de contadores do processo
 * Atualiza expedientes, intimações, minutas vinculados a cada processo
 */

import { useKV } from "@/hooks/use-kv";
import type { Expediente, Minuta, Process } from "@/types";
import { useCallback, useEffect, useMemo } from "react";

interface ProcessStats {
  expedientes: number;
  intimacoes: number;
  minutas: number;
  documentos: number;
  lastExpediente?: string;
  lastMinuta?: string;
}

/**
 * Normaliza número de processo removendo caracteres não numéricos
 */
function normalizeProcessNumber(numero: string | undefined): string {
  if (!numero) return "";
  return numero.replace(/\D/g, "");
}

/**
 * Verifica se dois números de processo são equivalentes
 */
function processNumbersMatch(num1: string | undefined, num2: string | undefined): boolean {
  if (!num1 || !num2) return false;
  return normalizeProcessNumber(num1) === normalizeProcessNumber(num2);
}

export function useProcessSync() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);
  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const [minutas] = useKV<Minuta[]>("minutas", []);

  /**
   * Encontra o ID do processo baseado no número CNJ
   */
  const findProcessIdByNumber = useCallback(
    (numeroProcesso: string | undefined): string | undefined => {
      if (!numeroProcesso) return undefined;
      const processo = (processes || []).find((p) =>
        processNumbersMatch(p.numeroCNJ, numeroProcesso)
      );
      return processo?.id;
    },
    [processes]
  );

  /**
   * Calcula estatísticas de cada processo baseado nos expedientes e minutas
   */
  const processStats = useMemo(() => {
    const stats = new Map<string, ProcessStats>();

    // Inicializar stats para todos os processos
    (processes || []).forEach((p) => {
      stats.set(p.id, {
        expedientes: 0,
        intimacoes: 0,
        minutas: 0,
        documentos: 0,
      });
    });

    // Contar expedientes por processo
    (expedientes || []).forEach((exp) => {
      // Tentar vincular pelo processId ou pelo numeroProcesso
      let processId = exp.processId;
      if (!processId && exp.numeroProcesso) {
        processId = findProcessIdByNumber(exp.numeroProcesso);
      }

      if (processId && stats.has(processId)) {
        const current = stats.get(processId)!;
        current.expedientes++;
        current.documentos++;

        // Contar intimações especificamente
        if (exp.tipo === "intimacao" || exp.type === "intimacao") {
          current.intimacoes++;
        }

        // Atualizar data do último expediente
        const expDate = exp.dataRecebimento || exp.receivedAt || exp.createdAt;
        if (expDate && (!current.lastExpediente || expDate > current.lastExpediente)) {
          current.lastExpediente = expDate;
        }

        stats.set(processId, current);
      }
    });

    // Contar minutas por processo
    (minutas || []).forEach((min) => {
      if (min.processId && stats.has(min.processId)) {
        const current = stats.get(min.processId)!;
        current.minutas++;
        current.documentos++;

        // Atualizar data da última minuta
        if (min.criadoEm && (!current.lastMinuta || min.criadoEm > current.lastMinuta)) {
          current.lastMinuta = min.criadoEm;
        }

        stats.set(min.processId, current);
      }
    });

    return stats;
  }, [processes, expedientes, minutas, findProcessIdByNumber]);

  /**
   * Sincroniza os contadores nos processos
   * Retorna true se houve alteração
   */
  const syncProcessStats = useCallback((): boolean => {
    if (!processes || processes.length === 0) return false;

    let hasChanges = false;
    const now = new Date().toISOString();

    const updated = processes.map((p) => {
      const stats = processStats.get(p.id);
      if (!stats) return p;

      // Verificar se houve mudança nos contadores
      const changed =
        p.expedientesCount !== stats.expedientes ||
        p.intimacoesCount !== stats.intimacoes ||
        p.minutasCount !== stats.minutas ||
        p.documentosCount !== stats.documentos ||
        p.lastExpedienteAt !== stats.lastExpediente ||
        p.lastMinutaAt !== stats.lastMinuta;

      if (changed) {
        hasChanges = true;
        return {
          ...p,
          expedientesCount: stats.expedientes,
          intimacoesCount: stats.intimacoes,
          minutasCount: stats.minutas,
          documentosCount: stats.documentos,
          lastExpedienteAt: stats.lastExpediente,
          lastMinutaAt: stats.lastMinuta,
          updatedAt: now,
        };
      }

      return p;
    });

    if (hasChanges) {
      setProcesses(updated);
    }

    return hasChanges;
  }, [processes, processStats, setProcesses]);

  /**
   * Obtém estatísticas de um processo específico
   */
  const getProcessStats = useCallback(
    (processId: string): ProcessStats | undefined => {
      return processStats.get(processId);
    },
    [processStats]
  );

  /**
   * Obtém expedientes vinculados a um processo
   */
  const getExpedientesForProcess = useCallback(
    (processId: string): Expediente[] => {
      const processo = (processes || []).find((p) => p.id === processId);
      if (!processo) return [];

      return (expedientes || []).filter(
        (exp) =>
          exp.processId === processId || processNumbersMatch(exp.numeroProcesso, processo.numeroCNJ)
      );
    },
    [processes, expedientes]
  );

  /**
   * Obtém minutas vinculadas a um processo
   */
  const getMinutasForProcess = useCallback(
    (processId: string): Minuta[] => {
      return (minutas || []).filter((min) => min.processId === processId);
    },
    [minutas]
  );

  /**
   * Vincula automaticamente um expediente a um processo pelo número CNJ
   */
  const autoLinkExpediente = useCallback(
    (expediente: Expediente): Expediente => {
      // Se já tem processId, retorna sem alteração
      if (expediente.processId) return expediente;

      // Buscar processo pelo número
      const processId = findProcessIdByNumber(expediente.numeroProcesso);
      if (processId) {
        return { ...expediente, processId };
      }

      return expediente;
    },
    [findProcessIdByNumber]
  );

  /**
   * Efeito para escutar eventos de atualização
   */
  useEffect(() => {
    const handleProcessUpdate = () => {
      syncProcessStats();
    };

    window.addEventListener("process-update-needed", handleProcessUpdate);
    window.addEventListener("expediente-added", handleProcessUpdate);
    window.addEventListener("minuta-added", handleProcessUpdate);

    return () => {
      window.removeEventListener("process-update-needed", handleProcessUpdate);
      window.removeEventListener("expediente-added", handleProcessUpdate);
      window.removeEventListener("minuta-added", handleProcessUpdate);
    };
  }, [syncProcessStats]);

  return {
    processStats,
    syncProcessStats,
    getProcessStats,
    getExpedientesForProcess,
    getMinutasForProcess,
    autoLinkExpediente,
    findProcessIdByNumber,
  };
}
