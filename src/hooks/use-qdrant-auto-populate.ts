/**
 * Hook de População Automática do Qdrant
 * TEMPORARIAMENTE DESABILITADO - EM DESENVOLVIMENTO
 * TODO: Resolver erros de tipo e reativar
 */

import type { Expediente } from "@/types";

export type PopulationStatus = "idle" | "processing" | "success" | "error";

export interface UseQdrantAutoPopulateState {
  status: PopulationStatus;
  result: null;
  error: string | null;
  isProcessing: boolean;
}

export interface UseQdrantAutoPopulateOptions {
  autoPopulate?: boolean;
  enablePrecedents?: boolean;
  minConfidence?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export function useQdrantAutoPopulate(options: UseQdrantAutoPopulateOptions = {}) {
  return {
    state: {
      status: "idle" as PopulationStatus,
      result: null,
      error: null,
      isProcessing: false,
    },
    populate: async (expediente: Expediente) => {
      console.warn("useQdrantAutoPopulate: temporariamente desabilitado");
      return null;
    },
    reset: () => {},
  };
}
