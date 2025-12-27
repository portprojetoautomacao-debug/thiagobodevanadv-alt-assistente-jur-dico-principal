/**
 * Helper para integração com Heavy Processor
 *
 * Adiciona lógica de fallback para processamento pesado em use-autonomous-agents
 * Mantém compatibilidade total com código existente (MODO MANUTENÇÃO)
 *
 * USO:
 * import { tryHeavyProcessorFallback } from '@/lib/heavy-processor-helper';
 *
 * // No processNextTask, antes do processamento normal:
 * const shouldUseFallback = await tryHeavyProcessorFallback(task, expedientes, onChunk);
 * if (shouldUseFallback) return; // Heavy processor lidou com a tarefa
 */

import type { AgentTask } from "@/lib/agents";
import {
  getHeavyProcessorClient,
  shouldUseHeavyProcessor,
} from "@/services/heavy-processor-client";
import type { Expediente } from "@/types";

export interface FallbackOptions {
  onChunk?: (expedienteId: string, chunk: string) => void;
  onComplete?: (results: any[]) => void;
  onError?: (error: Error) => void;
  updateTaskStatus?: (taskId: string, status: string) => void;
}

/**
 * Tenta usar Heavy Processor como fallback para processamento pesado
 *
 * @returns true se Heavy Processor lidou com a tarefa, false caso contrário
 */
export async function tryHeavyProcessorFallback(
  task: AgentTask,
  expedientes: Expediente[],
  options: FallbackOptions = {}
): Promise<boolean> {
  const client = getHeavyProcessorClient();

  // Verifica se deve usar Heavy Processor
  const shouldUse = shouldUseHeavyProcessor(expedientes);
  if (!shouldUse) {
    return false;
  }

  // Verifica se serviço está disponível
  const isAvailable = await client.isAvailable();
  if (!isAvailable) {
    console.warn("[Heavy Processor] Serviço indisponível, usando processamento local");
    return false;
  }

  console.log(`[Heavy Processor] Delegando tarefa ${task.id} para microserviço Java`);
  options.updateTaskStatus?.(task.id, "processing-external");

  try {
    // Processa com streaming se callback fornecido
    if (options.onChunk) {
      const stream = client.processWithStreaming({
        expedientes,
        operation: "bulk-analysis",
        options: {
          parallel: true,
          priority: task.priority === "critical" || task.priority === "high" ? "high" : "normal",
        },
      });

      const results: any[] = [];

      for await (const chunk of stream) {
        if (chunk.status === "processing" && chunk.chunk) {
          // Repassa chunk para o streaming do editor
          options.onChunk(chunk.expedienteId, chunk.chunk);
        } else if (chunk.status === "completed") {
          results.push(chunk);
        } else if (chunk.status === "error") {
          console.error(`[Heavy Processor] Erro no expediente ${chunk.expedienteId}`);
        }
      }

      options.onComplete?.(results);
      options.updateTaskStatus?.(task.id, "completed");

      console.log(`[Heavy Processor] Tarefa ${task.id} concluída com sucesso`);
      return true;
    } else {
      // Processa em lote sem streaming
      const response = await client.processBatch({
        expedientes,
        operation: "bulk-analysis",
        options: {
          parallel: true,
          priority: task.priority === "critical" || task.priority === "high" ? "high" : "normal",
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Erro no processamento");
      }

      options.onComplete?.(response.results);
      options.updateTaskStatus?.(task.id, "completed");

      console.log(
        `[Heavy Processor] Tarefa ${task.id} concluída: ${response.results.length} resultados em ${response.executionTimeMs}ms`
      );
      return true;
    }
  } catch (error) {
    console.error(`[Heavy Processor] Erro ao processar tarefa ${task.id}:`, error);
    options.onError?.(error as Error);
    options.updateTaskStatus?.(task.id, "failed");

    // Retorna false para que processamento local seja tentado
    return false;
  }
}

/**
 * Wrapper para integração com Hybrid Agents
 *
 * Verifica se Heavy Processor deve ser usado antes de executar
 * agentes LangGraph ou tradicionais
 */
export async function executeWithHeavyProcessorFallback(
  task: AgentTask,
  expedientes: Expediente[],
  hybridExecutor: () => Promise<any>,
  fallbackOptions: FallbackOptions = {}
): Promise<any> {
  // Tenta Heavy Processor primeiro
  const usedFallback = await tryHeavyProcessorFallback(task, expedientes, fallbackOptions);

  if (usedFallback) {
    return { mode: "heavy-processor", success: true };
  }

  // Se Heavy Processor não lidou, executa normalmente
  return await hybridExecutor();
}
