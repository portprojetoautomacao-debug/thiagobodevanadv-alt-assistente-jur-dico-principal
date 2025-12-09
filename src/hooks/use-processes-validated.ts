/**
 * Hook otimizado para gestão de processos com validação Zod
 * Substitui lógica duplicada e adiciona validação consistente
 */

import { useCallback } from "react";
import { toast } from "sonner";
import { useKV } from "./use-kv";
import { processSchema, validateProcess, type ProcessValidated } from "@/schemas/process.schema";
import type { Process } from "@/types";

export function useProcessesValidated() {
  const [processes, setProcesses] = useKV<Process[]>("processes", []);

  // Adicionar processo com validação
  const addProcess = useCallback(
    (processData: Omit<Process, "id" | "createdAt" | "updatedAt" | "dataDistribuicao" | "dataUltimaMovimentacao">) => {
      const now = new Date().toISOString();
      const newProcess = {
        ...processData,
        id: crypto.randomUUID(),
        dataDistribuicao: now,
        dataUltimaMovimentacao: now,
        createdAt: now,
        updatedAt: now,
      };

      const validation = validateProcess(newProcess);
      if (!validation.isValid) {
        console.error("Validação falhou:", validation.errors);
        toast.error("Dados do processo inválidos. Verifique os campos obrigatórios.");
        return null;
      }

      setProcesses((prev) => [...prev, validation.data as Process]);
      toast.success("Processo adicionado com sucesso!");
      return validation.data as Process;
    },
    [setProcesses]
  );

  // Atualizar processo com validação
  const updateProcess = useCallback(
    (id: string, updates: Partial<Process>) => {
      let updated: Process | null = null;

      setProcesses((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            const updatedProcess = {
              ...p,
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            const validation = validateProcess(updatedProcess);
            if (!validation.isValid) {
              console.error("Validação falhou:", validation.errors);
              toast.error("Dados inválidos. Atualização cancelada.");
              return p; // Retorna processo original sem modificar
            }

            updated = validation.data as Process;
            toast.success("Processo atualizado!");
            return updated;
          }
          return p;
        })
      );

      return updated;
    },
    [setProcesses]
  );

  // Remover processo
  const deleteProcess = useCallback(
    (id: string) => {
      setProcesses((prev) => prev.filter((p) => p.id !== id));
      toast.success("Processo removido!");
    },
    [setProcesses]
  );

  // Buscar processo por ID
  const getProcessById = useCallback(
    (id: string) => {
      return processes.find((p) => p.id === id);
    },
    [processes]
  );

  // Buscar processos por status
  const getProcessesByStatus = useCallback(
    (status: Process["status"]) => {
      return processes.filter((p) => p.status === status);
    },
    [processes]
  );

  // Processos urgentes (com prazos próximos)
  const getUrgentProcesses = useCallback(() => {
    const now = new Date();
    const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    return processes.filter((p) =>
      p.prazos?.some((prazo) => {
        if (prazo.concluido) return false;
        const deadline = new Date(prazo.dataFinal);
        return deadline <= in5Days && deadline >= now;
      })
    );
  }, [processes]);

  return {
    processes,
    setProcesses,
    addProcess,
    updateProcess,
    deleteProcess,
    getProcessById,
    getProcessesByStatus,
    getUrgentProcesses,
  };
}
