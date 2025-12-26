/**
 * Checkpoint Service - Sistema de Pontos de Salvamento para Agentes
 *
 * Permite que agentes salvem seu estado durante execução e recuperem
 * automaticamente em caso de falha, economizando tempo e custos de API.
 *
 * @module checkpoint-service
 */

import { Redis } from "@upstash/redis";

// Cliente Redis Upstash
const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Interface do Checkpoint
 */
export interface Checkpoint {
  /** ID único da execução */
  executionId: string;
  /** ID do agente (harvey, justine, redacao-peticoes, etc.) */
  agentId: string;
  /** Nome amigável do agente */
  agentName: string;
  /** Passo atual (sequencial: 1, 2, 3...) */
  step: number;
  /** Nome descritivo do passo */
  stepName: string;
  /** Estado completo salvo até este ponto */
  state: Record<string, any>;
  /** Timestamp do checkpoint */
  timestamp: Date;
  /** TTL em segundos (padrão: 24h) */
  ttl?: number;
  /** Metadata adicional */
  metadata?: {
    inputTokens?: number;
    outputTokens?: number;
    latency?: number;
    progress?: number;
  };
}

/**
 * Opções para salvar checkpoint
 */
export interface SaveCheckpointOptions {
  /** TTL customizado em segundos (padrão: 86400 = 24h) */
  ttl?: number;
  /** Se deve sobrescrever checkpoint existente */
  overwrite?: boolean;
}

/**
 * Estatísticas de recovery
 */
export interface RecoveryStats {
  executionId: string;
  agentId: string;
  totalSteps: number;
  recoveredFromStep: number;
  timeSaved: number; // em milissegundos
  tokensSaved: number;
  costSaved: number; // em USD
}

// Constantes
const DEFAULT_TTL = 60 * 60 * 24; // 24 horas
const CHECKPOINT_KEY_PREFIX = "checkpoint";
const LAST_STEP_SUFFIX = "last";

/**
 * Salva um checkpoint no Redis
 *
 * @param checkpoint - Dados do checkpoint
 * @param options - Opções de salvamento
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * await saveCheckpoint({
 *   executionId: 'exec-123',
 *   agentId: 'redacao-peticoes',
 *   agentName: 'Redator de Petições',
 *   step: 1,
 *   stepName: 'documents_analyzed',
 *   state: { documentos: [...], analise: {...} },
 *   timestamp: new Date()
 * });
 * ```
 */
export async function saveCheckpoint(
  checkpoint: Checkpoint,
  options: SaveCheckpointOptions = {}
): Promise<void> {
  const ttl = options.ttl || checkpoint.ttl || DEFAULT_TTL;
  const key = buildCheckpointKey(checkpoint.executionId, checkpoint.step);

  try {
    // Verificar se já existe (se não permitir sobrescrever)
    if (!options.overwrite) {
      const existing = await kv.get(key);
      if (existing) {
        console.warn(
          `[Checkpoint] Checkpoint já existe: ${key}. Use overwrite: true para sobrescrever.`
        );
        return;
      }
    }

    // Serializar checkpoint com timestamp como ISO string
    const serializedCheckpoint = {
      ...checkpoint,
      timestamp: checkpoint.timestamp.toISOString(),
      savedAt: new Date().toISOString(),
    };

    // Salvar checkpoint específico
    await kv.set(key, serializedCheckpoint, { ex: ttl });

    // Atualizar referência ao último checkpoint
    const lastStepKey = buildLastStepKey(checkpoint.executionId);
    await kv.set(lastStepKey, checkpoint.step, { ex: ttl });

    // Salvar metadata do agente
    const metaKey = buildMetadataKey(checkpoint.executionId);
    await kv.set(
      metaKey,
      {
        agentId: checkpoint.agentId,
        agentName: checkpoint.agentName,
        totalSteps: checkpoint.step,
        lastUpdated: new Date().toISOString(),
      },
      { ex: ttl }
    );

    console.log(
      `[Checkpoint] Salvo: ${checkpoint.agentId} | Passo ${checkpoint.step} | ${checkpoint.stepName}`
    );
  } catch (error) {
    console.error(`[Checkpoint] Erro ao salvar checkpoint:`, error);
    const err = error as Error;
    throw new Error(`Falha ao salvar checkpoint: ${err.message || "Erro desconhecido"}`);
  }
}

/**
 * Recupera o último checkpoint de uma execução
 *
 * @param executionId - ID da execução
 * @returns Promise<Checkpoint | null>
 *
 * @example
 * ```typescript
 * const checkpoint = await getLastCheckpoint('exec-123');
 * if (checkpoint) {
 *   console.log(`Retomando do passo ${checkpoint.step}`);
 *   // Continuar execução...
 * }
 * ```
 */
export async function getLastCheckpoint(executionId: string): Promise<Checkpoint | null> {
  try {
    // Buscar número do último passo
    const lastStepKey = buildLastStepKey(executionId);
    const lastStep = await kv.get<number>(lastStepKey);

    if (!lastStep) {
      return null;
    }

    // Buscar checkpoint do último passo
    const checkpointKey = buildCheckpointKey(executionId, lastStep);
    const checkpoint = await kv.get<any>(checkpointKey);

    if (!checkpoint) {
      return null;
    }

    // Deserializar timestamps
    return {
      ...checkpoint,
      timestamp: new Date(checkpoint.timestamp),
    };
  } catch (error) {
    console.error(`[Checkpoint] Erro ao recuperar checkpoint:`, error);
    return null;
  }
}

/**
 * Recupera um checkpoint específico por passo
 *
 * @param executionId - ID da execução
 * @param step - Número do passo
 * @returns Promise<Checkpoint | null>
 */
export async function getCheckpoint(executionId: string, step: number): Promise<Checkpoint | null> {
  try {
    const key = buildCheckpointKey(executionId, step);
    const checkpoint = await kv.get<any>(key);

    if (!checkpoint) {
      return null;
    }

    return {
      ...checkpoint,
      timestamp: new Date(checkpoint.timestamp),
    };
  } catch (error) {
    console.error(`[Checkpoint] Erro ao recuperar checkpoint do passo ${step}:`, error);
    return null;
  }
}

/**
 * Lista todos os checkpoints de uma execução
 *
 * @param executionId - ID da execução
 * @returns Promise<Checkpoint[]>
 */
export async function listCheckpoints(executionId: string): Promise<Checkpoint[]> {
  try {
    const metaKey = buildMetadataKey(executionId);
    const metadata = await kv.get<{ totalSteps: number }>(metaKey);

    if (!metadata) {
      return [];
    }

    const checkpoints: Checkpoint[] = [];

    // Buscar todos os checkpoints sequencialmente
    for (let step = 1; step <= metadata.totalSteps; step++) {
      const checkpoint = await getCheckpoint(executionId, step);
      if (checkpoint) {
        checkpoints.push(checkpoint);
      }
    }

    return checkpoints;
  } catch (error) {
    console.error(`[Checkpoint] Erro ao listar checkpoints:`, error);
    return [];
  }
}

/**
 * Limpa todos os checkpoints de uma execução
 *
 * @param executionId - ID da execução
 * @returns Promise<void>
 *
 * @example
 * ```typescript
 * // Após execução bem-sucedida
 * await clearCheckpoints('exec-123');
 * ```
 */
export async function clearCheckpoints(executionId: string): Promise<void> {
  try {
    // Buscar metadata para saber quantos passos existem
    const metaKey = buildMetadataKey(executionId);
    const metadata = await kv.get<{ totalSteps: number }>(metaKey);

    if (!metadata) {
      return;
    }

    // Deletar todos os checkpoints
    const deletePromises = [];

    for (let step = 1; step <= metadata.totalSteps; step++) {
      const key = buildCheckpointKey(executionId, step);
      deletePromises.push(kv.del(key));
    }

    // Deletar referência ao último passo e metadata
    deletePromises.push(kv.del(buildLastStepKey(executionId)));
    deletePromises.push(kv.del(metaKey));

    await Promise.all(deletePromises);

    console.log(`[Checkpoint] Limpou ${metadata.totalSteps} checkpoints de ${executionId}`);
  } catch (error) {
    console.error(`[Checkpoint] Erro ao limpar checkpoints:`, error);
    const err = error as Error;
    throw new Error(`Falha ao limpar checkpoints: ${err.message || "Erro desconhecido"}`);
  }
}

/**
 * Calcula estatísticas de recovery
 *
 * @param executionId - ID da execução
 * @param recoveredFromStep - Passo do qual foi recuperado
 * @param totalSteps - Total de passos do workflow
 * @param avgStepTime - Tempo médio por passo (ms)
 * @param avgStepTokens - Tokens médios por passo
 * @returns RecoveryStats
 */
export function calculateRecoveryStats(
  executionId: string,
  agentId: string,
  recoveredFromStep: number,
  totalSteps: number,
  avgStepTime: number = 60000, // 1 minuto padrão
  avgStepTokens: number = 2000
): RecoveryStats {
  const stepsSkipped = recoveredFromStep;
  const timeSaved = stepsSkipped * avgStepTime;
  const tokensSaved = stepsSkipped * avgStepTokens;

  // Custo estimado Gemini 2.5 Pro: $3 per 1M input + $9 per 1M output
  // Aproximação: 60% input, 40% output
  const inputCost = ((tokensSaved * 0.6) / 1_000_000) * 3;
  const outputCost = ((tokensSaved * 0.4) / 1_000_000) * 9;
  const costSaved = inputCost + outputCost;

  return {
    executionId,
    agentId,
    totalSteps,
    recoveredFromStep,
    timeSaved,
    tokensSaved,
    costSaved,
  };
}

/**
 * Verifica se uma execução tem checkpoints pendentes
 *
 * @param executionId - ID da execução
 * @returns Promise<boolean>
 */
export async function hasCheckpoints(executionId: string): Promise<boolean> {
  try {
    const lastStepKey = buildLastStepKey(executionId);
    const lastStep = await kv.get<number>(lastStepKey);
    return lastStep !== null;
  } catch (error) {
    console.error(`[Checkpoint] Erro ao verificar checkpoints:`, error);
    return false;
  }
}

/**
 * Obtém informações resumidas sobre checkpoints pendentes
 *
 * @param executionId - ID da execução
 * @returns Promise com resumo ou null
 */
export async function getCheckpointSummary(executionId: string): Promise<{
  agentId: string;
  agentName: string;
  lastStep: number;
  totalSteps: number;
  lastUpdated: Date;
  progress: number;
} | null> {
  try {
    const metaKey = buildMetadataKey(executionId);
    const metadata = await kv.get<any>(metaKey);

    if (!metadata) {
      return null;
    }

    const lastStepKey = buildLastStepKey(executionId);
    const lastStep = await kv.get<number>(lastStepKey);

    if (!lastStep) {
      return null;
    }

    return {
      agentId: metadata.agentId,
      agentName: metadata.agentName,
      lastStep,
      totalSteps: metadata.totalSteps,
      lastUpdated: new Date(metadata.lastUpdated),
      progress: (lastStep / metadata.totalSteps) * 100,
    };
  } catch (error) {
    console.error(`[Checkpoint] Erro ao obter resumo:`, error);
    return null;
  }
}

// Funções auxiliares para construir chaves do Redis

function buildCheckpointKey(executionId: string, step: number): string {
  return `${CHECKPOINT_KEY_PREFIX}:${executionId}:${step}`;
}

function buildLastStepKey(executionId: string): string {
  return `${CHECKPOINT_KEY_PREFIX}:${executionId}:${LAST_STEP_SUFFIX}`;
}

function buildMetadataKey(executionId: string): string {
  return `${CHECKPOINT_KEY_PREFIX}:${executionId}:meta`;
}

/**
 * Classe auxiliar para erros recuperáveis
 */
export class RecoverableError extends Error {
  constructor(
    message: string,
    public readonly context: {
      executionId: string;
      lastCheckpoint?: Checkpoint | null;
      canRecover: boolean;
    }
  ) {
    super(message);
    this.name = "RecoverableError";
  }
}
