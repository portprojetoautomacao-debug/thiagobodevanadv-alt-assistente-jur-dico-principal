/**
 * Monitor DJEN com Checkpointing
 *
 * Implementa monitoramento do Diário de Justiça Eletrônico Nacional com
 * checkpointing para permitir recovery automático em caso de falha durante
 * consulta de múltiplos tribunais.
 *
 * Workflow: Configuração → Consulta Tribunais → Filtro → Notificação
 */

import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from "@/lib/djen-api";
import {
  checkpoint,
  executeWithCheckpointing,
  shouldExecuteStep,
} from "@/lib/execute-with-checkpointing";

/**
 * Estado do workflow de monitor DJEN
 */
interface MonitorDJENState {
  step: number;
  config?: {
    tribunais: string[];
    advogados: Array<{ nome?: string; oab?: string }>;
    dataInicio: string;
    dataFim: string;
  };
  resultadosPorTribunal?: Array<{
    tribunal: string;
    sucesso: boolean;
    publicacoes: DJENFilteredResult[];
    erro?: string;
  }>;
  publicacoesFiltradas?: DJENFilteredResult[];
  notificacoesEnviadas?: boolean;
}

/**
 * Contexto de entrada para monitor DJEN
 */
interface MonitorDJENContext {
  tribunais: string[];
  advogados: Array<{
    nome?: string;
    oab?: string;
  }>;
  dataInicio?: Date;
  dataFim?: Date;
  notificarCallback?: (publicacoes: DJENFilteredResult[]) => void;
  maxRetries?: number;
}

/**
 * Executa monitoramento DJEN com checkpointing
 *
 * @example
 * ```typescript
 * const result = await monitorarDJENComCheckpointing({
 *   tribunais: ['TJSP', 'TJRJ', 'STJ'],
 *   advogados: [
 *     { nome: 'João Silva', oab: 'SP123456' },
 *     { nome: 'Maria Santos', oab: 'RJ654321' }
 *   ],
 *   notificarCallback: (pubs) => {
 *     console.log(`${pubs.length} publicações encontradas`);
 *   }
 * });
 *
 * console.log(result.recovered); // true se recuperou de falha
 * console.log(result.result.totalPublicacoes); // Total encontrado
 * ```
 */
export async function monitorarDJENComCheckpointing(context: MonitorDJENContext) {
  return executeWithCheckpointing(
    {
      agentId: "monitor-djen",
      agentName: "Monitor DJEN",
      context: {
        totalTribunais: context.tribunais.length,
        totalAdvogados: context.advogados.length,
      },
      autoRecover: true,
      onRecovery: (checkpoint, stats) => {
        console.log(`[Recovery] Retomando monitoramento DJEN do passo ${checkpoint.step}`);
        console.log(`[Recovery] Economizou ${stats.timeSaved}ms`);
      },
    },
    (resumeState) => workflowMonitorDJEN(context, resumeState)
  );
}

/**
 * Generator function que implementa o workflow de monitoramento
 */
async function* workflowMonitorDJEN(context: MonitorDJENContext, resumeState?: any) {
  const state: MonitorDJENState = { step: 0 };

  const hoje = new Date();
  const dataInicio = context.dataInicio || new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
  const dataFim = context.dataFim || hoje;

  // ============================================================================
  // PASSO 1: Preparação de Configuração (< 1 minuto)
  // ============================================================================
  if (shouldExecuteStep(state, 1)) {
    console.log("[DJEN] Passo 1/4: Preparando configuração...");

    state.config = {
      tribunais: context.tribunais,
      advogados: context.advogados,
      dataInicio: dataInicio.toISOString().split("T")[0],
      dataFim: dataFim.toISOString().split("T")[0],
    };
    state.step = 1;

    // 📌 CHECKPOINT 1
    yield checkpoint(1, "config_preparada", state, {
      progress: 0.1,
    });
  }

  // ============================================================================
  // PASSO 2: Consulta de Tribunais (5-15 minutos) - MAIS DEMORADO
  // ============================================================================
  if (shouldExecuteStep(state, 2)) {
    console.log("[DJEN] Passo 2/4: Consultando tribunais...");

    state.resultadosPorTribunal = [];
    const totalTribunais = state.config!.tribunais.length;

    for (let i = 0; i < totalTribunais; i++) {
      const tribunal = state.config!.tribunais[i];

      try {
        console.log(`[DJEN] Consultando ${tribunal} (${i + 1}/${totalTribunais})...`);

        // Consultar cada advogado neste tribunal
        const publicacoesTribunal: DJENFilteredResult[] = [];

        for (const advogado of state.config!.advogados) {
          const resultado = await consultarTribunalComRetry(
            tribunal,
            advogado,
            state.config!.dataInicio,
            state.config!.dataFim,
            context.maxRetries || 3
          );

          publicacoesTribunal.push(...resultado);
        }

        state.resultadosPorTribunal.push({
          tribunal,
          sucesso: true,
          publicacoes: publicacoesTribunal,
        });

        console.log(`[DJEN] ${tribunal}: ${publicacoesTribunal.length} publicações encontradas`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

        console.error(`[DJEN] Erro ao consultar ${tribunal}:`, errorMessage);

        state.resultadosPorTribunal.push({
          tribunal,
          sucesso: false,
          publicacoes: [],
          erro: errorMessage,
        });
      }

      // Checkpoint a cada 3 tribunais consultados ou no último
      if ((i + 1) % 3 === 0 || i === totalTribunais - 1) {
        yield checkpoint(2, `tribunal_${i + 1}_consultado`, state, {
          progress: 0.1 + (0.6 * (i + 1)) / totalTribunais,
        });
      }

      // Yield para streaming de progresso
      yield {
        status: "consulting_tribunal",
        tribunal,
        current: i + 1,
        total: totalTribunais,
        progress: (i + 1) / totalTribunais,
      };

      // Delay entre tribunais para evitar sobrecarga
      if (i < totalTribunais - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    state.step = 2;
  }

  // ============================================================================
  // PASSO 3: Filtro e Deduplicação (1-2 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 3)) {
    console.log("[DJEN] Passo 3/4: Filtrando e deduplicando...");

    // Consolidar todas as publicações
    const todasPublicacoes = state
      .resultadosPorTribunal!.filter((r) => r.sucesso)
      .flatMap((r) => r.publicacoes);

    // Deduplic por processo + data
    const deduplicadas = deduplicarPublicacoes(todasPublicacoes);

    // Filtrar relevantes (opcional - pode adicionar filtros adicionais)
    state.publicacoesFiltradas = deduplicadas.filter((pub) => {
      // Filtro básico: deve ter número de processo
      return pub.numeroProcesso && pub.numeroProcesso.length > 0;
    });

    console.log(
      `[DJEN] ${state.publicacoesFiltradas.length} publicações após filtro (de ${todasPublicacoes.length} originais)`
    );

    state.step = 3;

    // 📌 CHECKPOINT 3
    yield checkpoint(3, "publicacoes_filtradas", state, {
      progress: 0.8,
      metadata: {
        totalPublicacoes: state.publicacoesFiltradas.length,
      },
    });
  }

  // ============================================================================
  // PASSO 4: Notificação e Integração (< 1 minuto)
  // ============================================================================
  if (shouldExecuteStep(state, 4)) {
    console.log("[DJEN] Passo 4/4: Enviando notificações...");

    if (context.notificarCallback && state.publicacoesFiltradas!.length > 0) {
      try {
        context.notificarCallback(state.publicacoesFiltradas!);
        state.notificacoesEnviadas = true;
      } catch (error) {
        console.error("[DJEN] Erro ao enviar notificações:", error);
        state.notificacoesEnviadas = false;
      }
    } else {
      state.notificacoesEnviadas = false;
    }

    state.step = 4;

    // 📌 CHECKPOINT 4 (final)
    yield checkpoint(4, "notificacoes_enviadas", state, {
      progress: 1.0,
    });
  }

  // Retornar resultado final
  return {
    totalPublicacoes: state.publicacoesFiltradas!.length,
    publicacoes: state.publicacoesFiltradas!,
    tribunaisConsultados: state.resultadosPorTribunal!.length,
    tribunaisComSucesso: state.resultadosPorTribunal!.filter((r) => r.sucesso).length,
    tribunaisComErro: state.resultadosPorTribunal!.filter((r) => !r.sucesso).length,
    erros: state
      .resultadosPorTribunal!.filter((r) => !r.sucesso)
      .map((r) => ({ tribunal: r.tribunal, erro: r.erro! })),
    notificacoesEnviadas: state.notificacoesEnviadas || false,
    estatisticas: {
      porTribunal: state.resultadosPorTribunal!.map((r) => ({
        tribunal: r.tribunal,
        sucesso: r.sucesso,
        totalPublicacoes: r.publicacoes.length,
      })),
    },
  };
}

// ============================================================================
// Funções Auxiliares do Workflow
// ============================================================================

async function consultarTribunalComRetry(
  tribunal: string,
  advogado: { nome?: string; oab?: string },
  dataInicio: string,
  dataFim: string,
  maxRetries: number
): Promise<DJENFilteredResult[]> {
  const retryDelay = 5000; // 5 segundos

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config: DJENConfig = {
        tribunais: [tribunal],
        nomeAdvogado: advogado.nome,
        oabAdvogado: advogado.oab,
        dataInicio,
        dataFim,
        maxRetries: 1, // Já estamos fazendo retry aqui
      };

      const resultado = await consultarDJEN(config);

      return resultado.resultados;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

      if (attempt === maxRetries) {
        console.error(`[DJEN] Falha após ${maxRetries} tentativas para ${tribunal}:`, errorMessage);
        throw error;
      }

      console.warn(
        `[DJEN] Tentativa ${attempt}/${maxRetries} falhou para ${tribunal}. Aguardando ${retryDelay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  return [];
}

function deduplicarPublicacoes(publicacoes: DJENFilteredResult[]): DJENFilteredResult[] {
  const mapa = new Map<string, DJENFilteredResult>();

  for (const pub of publicacoes) {
    // Chave única: numeroProcesso + data + tribunal
    const chave = `${pub.numeroProcesso}_${pub.data}_${pub.tribunal}`;

    // Manter apenas a primeira ocorrência
    if (!mapa.has(chave)) {
      mapa.set(chave, pub);
    }
  }

  return Array.from(mapa.values());
}

/**
 * Função auxiliar para agendar próxima execução
 *
 * @example
 * ```typescript
 * // Agendar para executar a cada 24 horas
 * agendarProximaExecucao(async () => {
 *   await monitorarDJENComCheckpointing({...});
 * }, 24);
 * ```
 */
export function agendarProximaExecucao(
  executarCallback: () => Promise<void>,
  intervaloHoras: number = 24
) {
  const intervaloMs = intervaloHoras * 60 * 60 * 1000;

  // Executar imediatamente
  executarCallback().catch((error) => {
    console.error("[DJEN Scheduler] Erro na execução:", error);
  });

  // Agendar próximas execuções
  return setInterval(() => {
    executarCallback().catch((error) => {
      console.error("[DJEN Scheduler] Erro na execução agendada:", error);
    });
  }, intervaloMs);
}

/**
 * Função auxiliar para cancelar agendamento
 */
export function cancelarAgendamento(intervalId: ReturnType<typeof setInterval>) {
  clearInterval(intervalId);
  console.log("[DJEN Scheduler] Agendamento cancelado");
}
