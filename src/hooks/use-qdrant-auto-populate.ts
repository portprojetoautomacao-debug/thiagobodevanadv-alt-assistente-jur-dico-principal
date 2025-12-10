/**
 * Hook de População Automática do Qdrant
 *
 * Este hook integra a população automática do Qdrant com o fluxo
 * de análise de intimações. Pode ser usado por:
 * - Mrs. Justin-e Agent (análise de intimações)
 * - Monitor DJEN (novas publicações)
 * - PJe Sync (chrome extension)
 *
 * Características:
 * - Execução assíncrona (não bloqueia fluxo principal)
 * - Retry automático com backoff
 * - Telemetria completa (Sentry)
 * - Cache de resultados
 *
 * @module use-qdrant-auto-populate
 */

import { useState, useCallback, useEffect } from "react";
import { QdrantAutoPopulator } from "./qdrant-auto-populator";
import { temaExtractor } from "./tema-extractor";
import { geminiEmbeddingService } from "./gemini-embedding-service";
import { dataJudService } from "./datajud-service";
import { createQdrantService } from "./qdrant-service";
import type { Expediente } from "@/types";
import type { PopulationResult } from "./qdrant-auto-populator";

/**
 * Status da população
 */
export type PopulationStatus = "idle" | "processing" | "success" | "error";

/**
 * Estado do hook
 */
export interface UseQdrantAutoPopulateState {
  status: PopulationStatus;
  result: PopulationResult | null;
  error: string | null;
  isProcessing: boolean;
}

/**
 * Opções do hook
 */
export interface UseQdrantAutoPopulateOptions {
  /**
   * Se deve popular automaticamente ao receber nova intimação
   * @default true
   */
  autoPopulate?: boolean;

  /**
   * Se deve buscar precedentes no DataJud
   * @default true
   */
  enablePrecedents?: boolean;

  /**
   * Confiança mínima para popular (0.0 - 1.0)
   * @default 0.7
   */
  minConfidence?: number;

  /**
   * Callback chamado quando população é concluída com sucesso
   */
  onSuccess?: (result: PopulationResult) => void;

  /**
   * Callback chamado quando ocorre erro
   */
  onError?: (error: Error) => void;
}

/**
 * Hook React para população automática do Qdrant
 *
 * @example
 * ```tsx
 * function IntimacaoCard({ intimacao }) {
 *   const { populate, status, result } = useQdrantAutoPopulate({
 *     onSuccess: (result) => {
 *       toast.success(`Tema: ${result.temas.temaPrimario}`);
 *     }
 *   });
 *
 *   useEffect(() => {
 *     if (intimacao.novo) {
 *       populate(intimacao);
 *     }
 *   }, [intimacao]);
 *
 *   return (
 *     <div>
 *       {status === 'processing' && <Spinner />}
 *       {result && <TemasBadge temas={result.temas} />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQdrantAutoPopulate(options: UseQdrantAutoPopulateOptions = {}) {
  const {
    autoPopulate = true,
    enablePrecedents = true,
    minConfidence = 0.7,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<UseQdrantAutoPopulateState>({
    status: "idle",
    result: null,
    error: null,
    isProcessing: false,
  });

  // Instância do auto-populator (singleton)
  const [populator] = useState(() => {
    const qdrantConfig = {
      url: import.meta.env.QDRANT_URL || "",
      apiKey: import.meta.env.QDRANT_API_KEY || "",
      collectionName: import.meta.env.QDRANT_COLLECTION_NAME || "legal_docs",
    };

    const qdrant = createQdrantService(qdrantConfig);
    if (!qdrant) {
      console.warn("[useQdrantAutoPopulate] Qdrant não configurado");
      return null;
    }

    return new QdrantAutoPopulator(qdrant, dataJudService, temaExtractor, geminiEmbeddingService, {
      enablePrecedentSearch: enablePrecedents,
      minConfidence,
    });
  });

  /**
   * Função principal de população
   */
  const populate = useCallback(
    async (intimacao: Expediente): Promise<PopulationResult | null> => {
      if (!populator) {
        const error = "Qdrant não configurado";
        setState({
          status: "error",
          result: null,
          error,
          isProcessing: false,
        });
        onError?.(new Error(error));
        return null;
      }

      // Validação básica
      if (!intimacao.numeroProcesso) {
        const error = "Número do processo não informado";
        setState({
          status: "error",
          result: null,
          error,
          isProcessing: false,
        });
        onError?.(new Error(error));
        return null;
      }

      setState({
        status: "processing",
        result: null,
        error: null,
        isProcessing: true,
      });

      try {
        console.log(`[useQdrantAutoPopulate] Populando: ${intimacao.numeroProcesso}`);

        const result = await populator.populateFromIntimacao(intimacao);

        if (result.success) {
          setState({
            status: "success",
            result,
            error: null,
            isProcessing: false,
          });

          onSuccess?.(result);

          console.log(
            `[useQdrantAutoPopulate] ? Sucesso: ${result.qdrantId} (${result.duration}ms)`
          );
        } else {
          setState({
            status: "error",
            result,
            error: result.error || "Erro desconhecido",
            isProcessing: false,
          });

          onError?.(new Error(result.error || "Erro desconhecido"));

          console.error(`[useQdrantAutoPopulate] ? Falha: ${result.error}`);
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        setState({
          status: "error",
          result: null,
          error: errorMessage,
          isProcessing: false,
        });

        onError?.(error instanceof Error ? error : new Error(errorMessage));

        console.error("[useQdrantAutoPopulate] ? Exceção:", error);

        return null;
      }
    },
    [populator, enablePrecedents, minConfidence, onSuccess, onError]
  );

  /**
   * Reseta o estado
   */
  const reset = useCallback(() => {
    setState({
      status: "idle",
      result: null,
      error: null,
      isProcessing: false,
    });
  }, []);

  return {
    ...state,
    populate,
    reset,
    isConfigured: !!populator,
  };
}

/**
 * Hook simplificado para uso com array de intimações
 *
 * @example
 * ```tsx
 * function IntimacoesList({ intimacoes }) {
 *   const { populateAll, results, isProcessing } = useQdrantBatchPopulate();
 *
 *   const handlePopulateAll = async () => {
 *     await populateAll(intimacoes.filter(i => i.novo));
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handlePopulateAll} disabled={isProcessing}>
 *         Popular {intimacoes.length} intimações
 *       </button>
 *       {results.map(r => <ResultCard key={r.qdrantId} result={r} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQdrantBatchPopulate(options: UseQdrantAutoPopulateOptions = {}) {
  const [results, setResults] = useState<PopulationResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const { populate } = useQdrantAutoPopulate(options);

  /**
   * Popula múltiplas intimações em batch
   */
  const populateAll = useCallback(
    async (intimacoes: Expediente[]): Promise<PopulationResult[]> => {
      setIsProcessing(true);
      setProgress({ current: 0, total: intimacoes.length });
      setResults([]);

      const batchResults: PopulationResult[] = [];

      // Processa em lotes de 5 para não sobrecarregar
      const batchSize = 5;
      for (let i = 0; i < intimacoes.length; i += batchSize) {
        const batch = intimacoes.slice(i, i + batchSize);

        const batchPromises = batch.map((intimacao) => populate(intimacao));
        const batchRes = await Promise.all(batchPromises);

        batchResults.push(...batchRes.filter((r): r is PopulationResult => r !== null));

        setProgress({
          current: Math.min(i + batchSize, intimacoes.length),
          total: intimacoes.length,
        });

        // Delay entre lotes (2s)
        if (i + batchSize < intimacoes.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setResults(batchResults);
      setIsProcessing(false);

      return batchResults;
    },
    [populate]
  );

  return {
    populateAll,
    results,
    isProcessing,
    progress,
    reset: () => {
      setResults([]);
      setProgress({ current: 0, total: 0 });
    },
  };
}
