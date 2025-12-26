/**
 * Heavy Processor Integration Hook
 *
 * Hook para integrar o HeavyProcessorClient com use-autonomous-agents
 * Mantém streaming para ProfessionalEditor e respeita Hybrid Agents Integration
 *
 * MODO MANUTENÇÃO: Não modifica lógica existente, apenas adiciona fallback
 */

import {
  getHeavyProcessorClient,
  shouldUseHeavyProcessor,
} from "@/services/heavy-processor-client";
import type { Expediente } from "@/types";
import { useCallback, useEffect, useState } from "react";

export interface HeavyProcessorIntegration {
  isAvailable: boolean;
  isProcessing: boolean;
  processExpedientes: (expedientes: Expediente[]) => Promise<void>;
  cancel: () => void;
}

export function useHeavyProcessorIntegration(
  onChunk?: (expedienteId: string, chunk: string) => void,
  onComplete?: (results: any[]) => void,
  onError?: (error: Error) => void
): HeavyProcessorIntegration {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const client = getHeavyProcessorClient();

  // Verifica disponibilidade do serviço ao montar
  useEffect(() => {
    client.isAvailable().then(setIsAvailable);
  }, []);

  const processExpedientes = useCallback(
    async (expedientes: Expediente[]) => {
      if (!isAvailable || !shouldUseHeavyProcessor(expedientes)) {
        throw new Error("Heavy Processor não disponível ou não necessário");
      }

      setIsProcessing(true);

      try {
        // Processa com streaming se callback fornecido
        if (onChunk) {
          const stream = client.processWithStreaming({
            expedientes,
            operation: "bulk-analysis",
            options: { parallel: true },
          });

          const results: any[] = [];

          for await (const chunk of stream) {
            if (chunk.status === "processing" && chunk.chunk) {
              onChunk(chunk.expedienteId, chunk.chunk);
            } else if (chunk.status === "completed") {
              results.push(chunk);
            } else if (chunk.status === "error") {
              console.error(`Erro no expediente ${chunk.expedienteId}`);
            }
          }

          onComplete?.(results);
        } else {
          // Processa em lote sem streaming
          const response = await client.processBatch({
            expedientes,
            operation: "bulk-analysis",
            options: { parallel: true },
          });

          if (!response.success) {
            throw new Error(response.error || "Erro no processamento");
          }

          onComplete?.(response.results);
        }
      } catch (error) {
        onError?.(error as Error);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [isAvailable, onChunk, onComplete, onError]
  );

  const cancel = useCallback(() => {
    client.cancelProcessing();
    setIsProcessing(false);
  }, []);

  return {
    isAvailable,
    isProcessing,
    processExpedientes,
    cancel,
  };
}
