/**
 * Análise de Expedientes com Checkpointing
 *
 * Implementa análise de expedientes/intimações com checkpointing para permitir
 * recovery automático em caso de falha durante processamento em lote.
 *
 * Workflow: Extração → Classificação → Análise IA → Geração de Tarefas
 */

import {
  checkpoint,
  executeWithCheckpointing,
  shouldExecuteStep,
} from "@/lib/execute-with-checkpointing";
import { callGemini } from "@/lib/gemini-service";
import type { Expediente } from "@/types";

interface AnaliseExpedientesState {
  step: number;
  expedientes?: Expediente[];
  extraidos?: Array<{
    id: string;
    texto: string;
    metadados: {
      tamanho: number;
      tipo: string;
      numeroProcesso?: string;
    };
  }>;
  classificados?: Array<{
    id: string;
    tipo: "intimacao" | "citacao" | "despacho" | "decisao" | "sentenca" | "outro";
    urgencia: "alta" | "media" | "baixa";
    temPrazo: boolean;
  }>;
  analisados?: Array<{
    id: string;
    summary: string;
    priority: "alta" | "media" | "baixa";
    deadline?: {
      days: number;
      type: "úteis" | "corridos";
      endDate: string;
    };
    suggestedActions: string[];
    nextSteps: string[];
  }>;
  tarefas?: Array<{
    agentId: string;
    type: string;
    priority: string;
    data: Record<string, unknown>;
  }>;
}

/**
 * Contexto de entrada para análise de expedientes
 */
interface AnaliseExpedientesContext {
  expedientes: Expediente[];
  batchSize?: number; // Quantos analisar por checkpoint (padrão: 10)
  autoCreateTasks?: boolean; // Se deve criar tarefas automaticamente
}

/**
 * Executa análise em lote de expedientes com checkpointing
 *
 * @example
 * ```typescript
 * const result = await analisarExpedientesComCheckpointing({
 *   expedientes: [exp1, exp2, exp3],
 *   batchSize: 5,
 *   autoCreateTasks: true
 * });
 *
 * console.log(result.recovered); // true se recuperou de falha
 * console.log(result.result.analisados.length); // Quantos foram analisados
 * ```
 */
export async function analisarExpedientesComCheckpointing(context: AnaliseExpedientesContext) {
  return executeWithCheckpointing(
    {
      agentId: "analise-documental",
      agentName: "Analisador de Expedientes",
      context: {
        totalExpedientes: context.expedientes.length,
        batchSize: context.batchSize || 10,
      },
      autoRecover: true,
      onRecovery: (checkpoint, stats) => {
        console.log(`[Recovery] Retomando análise de expedientes do passo ${checkpoint.step}`);
        console.log(`[Recovery] Economizou ${stats.timeSaved}ms e $${stats.costSaved.toFixed(2)}`);
      },
    },
    (resumeState) => workflowAnaliseExpedientes(context, resumeState)
  );
}

/**
 * Generator function que implementa o workflow de análise
 */
async function* workflowAnaliseExpedientes(
  context: AnaliseExpedientesContext,
  _resumeState?: unknown
) {
  const state: AnaliseExpedientesState = {
    step: 0,
    expedientes: context.expedientes,
  };

  const batchSize = context.batchSize || 10;

  // ============================================================================
  // PASSO 1: Extração de Texto e Metadados (1-2 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 1)) {
    console.log("[Análise] Passo 1/4: Extraindo texto e metadados...");

    state.extraidos = await extrairTextoeMetadados(state.expedientes!);
    state.step = 1;

    // 📌 CHECKPOINT 1
    yield checkpoint(1, "texto_metadados_extraidos", state, {
      progress: 0.25,
      inputTokens: 100,
      outputTokens: 500,
    });
  }

  // ============================================================================
  // PASSO 2: Classificação Automática (2-3 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 2)) {
    console.log("[Análise] Passo 2/4: Classificando expedientes...");

    state.classificados = await classificarExpedientes(state.extraidos!);
    state.step = 2;

    // 📌 CHECKPOINT 2
    yield checkpoint(2, "expedientes_classificados", state, {
      progress: 0.5,
      inputTokens: 500,
      outputTokens: 800,
    });
  }

  // ============================================================================
  // PASSO 3: Análise com IA em Lotes (5-10 minutos) - MAIS DEMORADO
  // ============================================================================
  if (shouldExecuteStep(state, 3)) {
    console.log("[Análise] Passo 3/4: Analisando com IA (lotes)...");

    state.analisados = [];
    const totalBatches = Math.ceil(state.classificados!.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batch = state.classificados!.slice(i * batchSize, (i + 1) * batchSize);

      // Analisar lote com Gemini
      const analisadosLote = await analisarLoteComGemini(
        batch,
        state.extraidos!,
        state.expedientes!
      );

      state.analisados.push(...analisadosLote);

      // Checkpoint a cada lote processado
      if ((i + 1) % 2 === 0 || i === totalBatches - 1) {
        yield checkpoint(3, `lote_${i + 1}_analisado`, state, {
          progress: 0.5 + (0.35 * (i + 1)) / totalBatches,
          inputTokens: batch.length * 1000,
          outputTokens: batch.length * 1500,
        });
      }

      // Yield para streaming de progresso
      yield {
        status: "analyzing_batch",
        batch: i + 1,
        total: totalBatches,
        progress: (i + 1) / totalBatches,
      };
    }

    state.step = 3;
  }

  // ============================================================================
  // PASSO 4: Geração de Tarefas para Agentes (1 minuto)
  // ============================================================================
  if (shouldExecuteStep(state, 4)) {
    console.log("[Análise] Passo 4/4: Gerando tarefas para agentes...");

    if (context.autoCreateTasks) {
      state.tarefas = gerarTarefasParaAgentes(state.analisados!, state.expedientes!);
    } else {
      state.tarefas = [];
    }

    state.step = 4;

    // 📌 CHECKPOINT 4 (final)
    yield checkpoint(4, "tarefas_geradas", state, {
      progress: 1.0,
    });
  }

  // Retornar resultado final
  return {
    totalAnalisados: state.analisados!.length,
    analisados: state.analisados!,
    tarefasCriadas: state.tarefas!.length,
    tarefas: state.tarefas!,
    estatisticas: {
      alta: state.analisados!.filter((a) => a.priority === "alta").length,
      media: state.analisados!.filter((a) => a.priority === "media").length,
      baixa: state.analisados!.filter((a) => a.priority === "baixa").length,
      comPrazo: state.analisados!.filter((a) => a.deadline).length,
    },
  };
}

// ============================================================================
// Funções Auxiliares do Workflow
// ============================================================================

async function extrairTextoeMetadados(expedientes: Expediente[]) {
  // Extrair texto e metadados de cada expediente
  return expedientes.map((exp) => ({
    id: exp.id,
    texto: exp.content || exp.teor || exp.conteudo || "",
    metadados: {
      tamanho: (exp.content || exp.teor || exp.conteudo || "").length,
      tipo: exp.type || exp.tipo || "outro",
      numeroProcesso: exp.numeroProcesso,
    },
  }));
}

async function classificarExpedientes(extraidos: Array<{ id: string; texto: string }>) {
  // Classificar tipo e urgência baseado em palavras-chave
  return extraidos.map((ext) => {
    const textoLower = ext.texto.toLowerCase();

    // Detectar tipo
    let tipo: "intimacao" | "citacao" | "despacho" | "decisao" | "sentenca" | "outro" = "outro";
    if (textoLower.includes("intimaç") || textoLower.includes("publicad")) tipo = "intimacao";
    else if (textoLower.includes("citaç")) tipo = "citacao";
    else if (textoLower.includes("despacho")) tipo = "despacho";
    else if (textoLower.includes("decisão") || textoLower.includes("decisao")) tipo = "decisao";
    else if (textoLower.includes("sentença") || textoLower.includes("sentenca")) tipo = "sentenca";

    // Detectar urgência
    let urgencia: "alta" | "media" | "baixa" = "media";
    if (
      textoLower.includes("urgente") ||
      textoLower.includes("prazo") ||
      textoLower.includes("sentença")
    ) {
      urgencia = "alta";
    } else if (textoLower.includes("informaç") || textoLower.includes("ciência")) {
      urgencia = "baixa";
    }

    // Detectar prazo
    const temPrazo = /\d+\s*dias?/i.test(ext.texto) || textoLower.includes("prazo");

    return {
      id: ext.id,
      tipo,
      urgencia,
      temPrazo,
    };
  });
}

async function analisarLoteComGemini(
  batch: Array<{ id: string; tipo: string; urgencia: string }>,
  extraidos: Array<{ id: string; texto: string }>,
  expedientes: Expediente[]
) {
  const analisados = [];

  for (const item of batch) {
    const extraido = extraidos.find((e) => e.id === item.id);
    const expediente = expedientes.find((e) => e.id === item.id);

    if (!extraido || !expediente) continue;

    // Construir prompt para Gemini
    const prompt = `Você é Mrs. Justin-e, especialista em análise de intimações judiciais brasileiras.

Analise a intimação abaixo e retorne um JSON com:
{
  "summary": "Resumo claro em 2-3 frases",
  "priority": "alta" | "media" | "baixa",
  "deadline": {
    "days": número de dias,
    "type": "úteis" | "corridos",
    "endDate": "DD/MM/2025"
  },
  "suggestedActions": ["Ação específica solicitada"],
  "nextSteps": ["Próximos passos"]
}

PROCESSO: ${expediente.numeroProcesso || "Não informado"}
TIPO DETECTADO: ${item.tipo}
URGÊNCIA DETECTADA: ${item.urgencia}

CONTEÚDO:
${extraido.texto.slice(0, 2000)}

Responda APENAS com o JSON válido.`;

    try {
      // Chamar Gemini
      const response = await callGemini(prompt, {
        model: "gemini-2.0-flash-exp",
        temperature: 0.3,
        maxOutputTokens: 1500,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Parse do JSON
      const responseText = response.text;
      const jsonText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const analysis = JSON.parse(jsonText);

      analisados.push({
        id: item.id,
        summary: analysis.summary || "Análise concluída",
        priority: analysis.priority || item.urgencia,
        deadline: analysis.deadline,
        suggestedActions: analysis.suggestedActions || [],
        nextSteps: analysis.nextSteps || [],
      });
    } catch (error) {
      console.error(`[Análise] Erro ao analisar ${item.id}:`, error);

      // Fallback: análise básica
      analisados.push({
        id: item.id,
        summary: `${item.tipo} detectada - Aguardando análise manual`,
        priority: item.urgencia as "alta" | "media" | "baixa",
        deadline: (item as { temPrazo?: boolean }).temPrazo
          ? { days: 15, type: "úteis", endDate: "Verificar" }
          : undefined,
        suggestedActions: ["Verificar manualmente"],
        nextSteps: ["Analisar documento"],
      });
    }

    // Pequeno delay entre análises para evitar rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return analisados;
}

function gerarTarefasParaAgentes(
  analisados: Array<{
    id: string;
    priority: string;
    deadline?: { days: number; type: string; endDate: string };
    suggestedActions: string[];
  }>,
  expedientes: Expediente[]
) {
  const tarefas = [];

  for (const analise of analisados) {
    const expediente = expedientes.find((e) => e.id === analise.id);
    if (!expediente) continue;

    // 1. Mrs. Justin-e - Gestão de prazo
    if (analise.deadline) {
      tarefas.push({
        agentId: "justine",
        type: "DEADLINE_MANAGEMENT",
        priority: analise.priority,
        data: {
          expedienteId: analise.id,
          deadline: analise.deadline,
          processNumber: expediente.numeroProcesso,
        },
      });
    }

    // 2. Redação de petições - se há ação sugerida
    if (analise.suggestedActions.length > 0) {
      tarefas.push({
        agentId: "redacao-peticoes",
        type: "DRAFT_PETITION",
        priority: analise.priority,
        data: {
          expedienteId: analise.id,
          suggestedActions: analise.suggestedActions,
          processNumber: expediente.numeroProcesso,
        },
      });
    }

    // 3. Estratégia processual - para casos de alta prioridade
    if (analise.priority === "alta") {
      tarefas.push({
        agentId: "estrategia-processual",
        type: "CASE_STRATEGY",
        priority: "high",
        data: {
          expedienteId: analise.id,
          processNumber: expediente.numeroProcesso,
        },
      });
    }
  }

  return tarefas;
}
