/**
 * Execute With Checkpointing - Wrapper para Execução com Pontos de Salvamento
 *
 * Wrapper genérico que adiciona checkpointing a qualquer função de agente,
 * permitindo recovery automático em caso de falha.
 */

import {
  calculateRecoveryStats,
  clearCheckpoints,
  getLastCheckpoint,
  RecoverableError,
  saveCheckpoint,
  type Checkpoint,
} from "./checkpoint-service";

/**
 * Configuração de execução com checkpointing
 */
export interface CheckpointingConfig {
  /** ID único da execução (será gerado se não fornecido) */
  executionId?: string;
  /** ID do agente */
  agentId: string;
  /** Nome amigável do agente */
  agentName: string;
  /** Contexto inicial da execução */
  context: Record<string, any>;
  /** Se deve tentar recuperar de checkpoint anterior */
  autoRecover?: boolean;
  /** Callback chamado quando recovery acontece */
  onRecovery?: (checkpoint: Checkpoint, stats: any) => void;
  /** TTL customizado para checkpoints (segundos) */
  checkpointTTL?: number;
}

/**
 * Resultado de execução com checkpointing
 */
export interface CheckpointedExecutionResult<T> {
  /** Resultado da execução */
  result: T;
  /** ID da execução */
  executionId: string;
  /** Se houve recovery de checkpoint */
  recovered: boolean;
  /** Estatísticas de recovery (se aplicável) */
  recoveryStats?: ReturnType<typeof calculateRecoveryStats>;
}

/**
 * Executa uma função com checkpointing automático
 *
 * @param config - Configuração de checkpointing
 * @param fn - Função geradora a ser executada
 * @returns Promise com resultado e metadados
 *
 * @example
 * ```typescript
 * const result = await executeWithCheckpointing(
 *   {
 *     agentId: 'redacao-peticoes',
 *     agentName: 'Redator de Petições',
 *     context: { expedienteId: '123' }
 *   },
 *   async function* (resumeState) {
 *     let state = resumeState || { step: 0 };
 *
 *     if (state.step < 1) {
 *       state.analise = await analisar();
 *       yield { checkpoint: { step: 1, stepName: 'analyzed', state } };
 *     }
 *
 *     return state.resultado;
 *   }
 * );
 * ```
 */
export async function executeWithCheckpointing<T>(
  config: CheckpointingConfig,
  fn: (resumeState?: any) => AsyncGenerator<any, T>
): Promise<CheckpointedExecutionResult<T>> {
  const executionId = config.executionId || crypto.randomUUID();
  let recovered = false;
  let recoveryStats: any = undefined;

  try {
    // Verificar se existe checkpoint anterior (falha prévia)
    let resumeState: any = undefined;

    if (config.autoRecover !== false) {
      const lastCheckpoint = await getLastCheckpoint(executionId);

      if (lastCheckpoint) {
        console.log(
          `[Checkpointing] Recovery detectado: ${config.agentId} do passo ${lastCheckpoint.step}`
        );

        resumeState = lastCheckpoint.state;
        recovered = true;

        // Calcular estatísticas de recovery
        recoveryStats = calculateRecoveryStats(
          executionId,
          config.agentId,
          lastCheckpoint.step,
          lastCheckpoint.step + 3 // Estimativa de passos restantes
        );

        // Callback de recovery
        if (config.onRecovery) {
          config.onRecovery(lastCheckpoint, recoveryStats);
        }
      }
    }

    // Executar função geradora
    const generator = fn(resumeState);
    let result: T | undefined;

    // Usar while com .next() ao invés de for await of para capturar o return
    let iteration = await generator.next();

    while (!iteration.done) {
      const value = iteration.value;

      // Se o yield retornou um checkpoint, salvar
      if (value && typeof value === "object" && "checkpoint" in value) {
        const checkpointData = value.checkpoint;

        await saveCheckpoint({
          executionId,
          agentId: config.agentId,
          agentName: config.agentName,
          step: checkpointData.step,
          stepName: checkpointData.stepName,
          state: checkpointData.state,
          timestamp: new Date(),
          ttl: config.checkpointTTL,
          metadata: checkpointData.metadata,
        });
      }
      // Não atualizar result aqui - apenas yields de checkpoint passam por aqui

      iteration = await generator.next();
    }

    // Capturar o valor retornado (return) do generator
    result = iteration.value as T;

    // Sucesso! Limpar checkpoints
    await clearCheckpoints(executionId);

    return {
      result: result as T,
      executionId,
      recovered,
      recoveryStats,
    };
  } catch (error) {
    console.error(`[Checkpointing] Falha em ${config.agentId}:`, error);

    // Verificar se há checkpoint salvo
    const lastCheckpoint = await getLastCheckpoint(executionId);

    throw new RecoverableError(
      `Execução falhou. ${lastCheckpoint ? `Recovery disponível do passo ${lastCheckpoint.step}` : "Nenhum checkpoint disponível"}`,
      {
        executionId,
        lastCheckpoint,
        canRecover: !!lastCheckpoint,
      }
    );
  }
}

/**
 * Helper para criar checkpoint durante execução
 *
 * @example
 * ```typescript
 * yield checkpoint(1, 'documents_analyzed', { documentos: [...] });
 * ```
 */
export function checkpoint(
  step: number,
  stepName: string,
  state: Record<string, any>,
  metadata?: Checkpoint["metadata"]
) {
  return {
    checkpoint: {
      step,
      stepName,
      state,
      metadata,
    },
  };
}

/**
 * Helper para verificar se deve executar um passo
 * Útil para pular passos já executados em recovery
 *
 * @example
 * ```typescript
 * if (shouldExecuteStep(state, 1)) {
 *   state.analise = await analisar();
 *   yield checkpoint(1, 'analyzed', state);
 * }
 * ```
 */
export function shouldExecuteStep(state: { step?: number }, targetStep: number): boolean {
  return !state.step || state.step < targetStep;
}
