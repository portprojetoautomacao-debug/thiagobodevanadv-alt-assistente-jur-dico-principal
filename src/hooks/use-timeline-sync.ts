/**
 * Hook para sincronização em tempo real da Timeline Processual
 * Monitora expedientes vindos da extensão Chrome PJe
 */

import { createProcessTimeline } from "@/lib/process-timeline-utils";
import type { Expediente, ProcessEvent } from "@/types";
import { useCallback, useEffect, useState } from "react";
import { useKV } from "./use-kv";

interface TimelineSyncOptions {
  processId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // ms
}

export function useTimelineSync(options: TimelineSyncOptions = {}) {
  const {
    processId,
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
  } = options;

  const [expedientes] = useKV<Expediente[]>("expedientes", []);
  const [events, setEvents] = useState<ProcessEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [newEventsCount, setNewEventsCount] = useState(0);

  // Filtra e transforma expedientes em eventos de timeline
  // NÃO incluir states nas dependências para evitar loops infinitos
  const refreshTimeline = useCallback(() => {
    if (!expedientes || expedientes.length === 0) {
      setEvents([]);
      return;
    }

    // Filtra expedientes do processo atual (se especificado)
    const filtered = processId
      ? expedientes.filter((exp) => {
          // Tenta múltiplos formatos de número de processo
          const expNumber = exp.numeroProcesso || exp.processId || "";
          return (
            expNumber === processId ||
            expNumber.replaceAll(/\D/g, "") === processId.replaceAll(/\D/g, "")
          );
        })
      : expedientes;

    // Converte para ProcessEvent[]
    const timeline = createProcessTimeline(filtered, []);

    // Detecta novos eventos usando functional update para evitar dependência
    setEvents((prevEvents) => {
      const newCount = timeline.length;
      const prevCount = prevEvents.length;

      if (newCount > prevCount) {
        setNewEventsCount(newCount - prevCount);
      }

      setLastUpdate(new Date());

      return timeline;
    });
  }, [expedientes, processId]);

  // Refresh inicial - executa apenas quando expedientes ou processId mudam
  useEffect(() => {
    refreshTimeline();
  }, [expedientes, processId]);

  // Auto-refresh periódico - separado do refresh inicial
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshTimeline, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshTimeline]);

  // Marca notificação de novos eventos como lida
  const markAsRead = useCallback(() => {
    setNewEventsCount(0);
  }, []);

  return {
    events, // ProcessEvent[] para usar no ProcessTimelineViewer
    expedientes: processId
      ? expedientes.filter((exp) => {
          const expNumber = exp.numeroProcesso || exp.processId || "";
          return (
            expNumber === processId ||
            expNumber.replaceAll(/\D/g, "") === processId.replaceAll(/\D/g, "")
          );
        })
      : expedientes,
    lastUpdate,
    newEventsCount,
    markAsRead,
    refresh: refreshTimeline,
  };
}
