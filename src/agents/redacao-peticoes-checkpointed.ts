/**
 * Exemplo: Redação de Petições com Checkpointing
 *
 * Implementação do agente redacao-peticoes usando checkpointing para
 * permitir recovery automático em caso de falha durante a redação.
 *
 * Este é um exemplo de referência para implementar checkpointing em outros agentes.
 */

import {
  checkpoint,
  executeWithCheckpointing,
  shouldExecuteStep,
} from "@/lib/execute-with-checkpointing";
import type { Expediente } from "@/types";
import { callGemini } from "@/lib/gemini-service";

/**
 * Estado do workflow de redação de petição
 */
interface PeticaoWorkflowState {
  step: number;
  documentos?: {
    tipo: string;
    conteudo: string;
    relevancia: number;
  }[];
  fundamentacao?: {
    fatos: string[];
    direito: string[];
    precedentes: string[];
  };
  precedentes?: {
    tribunal: string;
    numero: string;
    ementa: string;
    relevancia: number;
  }[];
  peticaoRascunho?: string;
  peticaoFormatada?: string;
}

/**
 * Contexto de entrada para redação de petição
 */
interface PeticaoContext {
  expediente: Expediente;
  tipoDocumento: "contestacao" | "recurso" | "peticao_intermediaria" | "inicial";
  urgente?: boolean;
}

/**
 * Executa workflow completo de redação de petição com checkpointing
 *
 * @example
 * ```typescript
 * const result = await redigiPeticaoComCheckpointing({
 *   expediente: expediente,
 *   tipoDocumento: 'contestacao'
 * });
 *
 * console.log(result.recovered); // true se recuperou de falha
 * console.log(result.result); // Petição final
 * ```
 */
export async function redigiPeticaoComCheckpointing(context: PeticaoContext) {
  return executeWithCheckpointing(
    {
      agentId: "redacao-peticoes",
      agentName: "Redator de Petições",
      context: {
        expedienteId: context.expediente.id,
        numeroProcesso: context.expediente.numeroProcesso,
        tipoDocumento: context.tipoDocumento,
      },
      autoRecover: true,
      onRecovery: (checkpoint, stats) => {
        console.log(`[Recovery] Economizou ${stats.timeSaved}ms e $${stats.costSaved.toFixed(2)}`);
      },
    },
    // Generator function que implementa o workflow
    async function* (resumeState?: any) {
      return yield* workflowRedigiPeticao(context, resumeState);
    }
  );
}

/**
 * Generator function que implementa o workflow de redação
 * Cada yield com checkpoint salva o estado automaticamente
 */
async function* workflowRedigiPeticao(context: PeticaoContext, resumeState?: any) {
  const state: PeticaoWorkflowState = resumeState || { step: 0 };

  // ============================================================================
  // PASSO 1: Análise de Documentos (2-3 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 1)) {
    console.log("[Redação] Passo 1/5: Analisando documentos...");

    state.documentos = await analisarDocumentos(context.expediente);
    state.step = 1;

    // 📌 CHECKPOINT 1
    yield checkpoint(1, "documents_analyzed", state, {
      progress: 0.2,
      inputTokens: 500,
      outputTokens: 1500,
    });
  }

  // ============================================================================
  // PASSO 2: Construção de Fundamentação (3-4 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 2)) {
    console.log("[Redação] Passo 2/5: Construindo fundamentação...");

    state.fundamentacao = await construirFundamentacao(state.documentos!, context.tipoDocumento);
    state.step = 2;

    // 📌 CHECKPOINT 2
    yield checkpoint(2, "fundamentacao_construida", state, {
      progress: 0.4,
      inputTokens: 2000,
      outputTokens: 3000,
    });
  }

  // ============================================================================
  // PASSO 3: Pesquisa de Precedentes (4-6 minutos) - MAIS DEMORADO
  // ============================================================================
  if (shouldExecuteStep(state, 3)) {
    console.log("[Redação] Passo 3/5: Pesquisando precedentes...");

    state.precedentes = await pesquisarPrecedentes(state.fundamentacao!, context.tipoDocumento);
    state.step = 3;

    // 📌 CHECKPOINT 3 (crítico - antes do passo mais caro)
    yield checkpoint(3, "precedentes_encontrados", state, {
      progress: 0.6,
      inputTokens: 3000,
      outputTokens: 2000,
    });
  }

  // ============================================================================
  // PASSO 4: Redação com IA (5-8 minutos) - MAIS CARO
  // ============================================================================
  if (shouldExecuteStep(state, 4)) {
    console.log("[Redação] Passo 4/5: Redigindo petição com IA...");

    const prompt = construirPromptPeticao(
      state.documentos!,
      state.fundamentacao!,
      state.precedentes!,
      context
    );

    // Chamar Gemini

    const response = await callGemini(prompt, {
      model: "gemini-2.0-flash-exp",

      temperature: 0.7,

      maxOutputTokens: 8000,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const peticaoCompleta = response.text;

    state.peticaoRascunho = peticaoCompleta;
    state.step = 4;

    // 📌 CHECKPOINT 4 (após geração cara)
    yield checkpoint(4, "peticao_rascunho_concluido", state, {
      progress: 0.85,
      inputTokens: 4000,
      outputTokens: 6000,
    });
  }

  // ============================================================================
  // PASSO 5: Formatação Final (1-2 minutos)
  // ============================================================================
  if (shouldExecuteStep(state, 5)) {
    console.log("[Redação] Passo 5/5: Formatando documento...");

    state.peticaoFormatada = await formatarPeticao(
      state.peticaoRascunho!,
      context.expediente,
      context.tipoDocumento
    );
    state.step = 5;

    // Checkpoint final (opcional, será limpo logo após)
    yield checkpoint(5, "peticao_formatada", state, {
      progress: 1.0,
    });
  }

  // Retornar resultado final
  return {
    peticao: state.peticaoFormatada!,
    metadata: {
      documentosAnalisados: state.documentos!.length,
      precedentesEncontrados: state.precedentes!.length,
      passosConcluidos: 5,
    },
  };
}

// ============================================================================
// Funções Auxiliares do Workflow
// ============================================================================

async function analisarDocumentos(expediente: Expediente) {
  // Simular análise de documentos
  // Na implementação real, usar Gemini ou outro serviço
  await new Promise((resolve) => setTimeout(resolve, 100)); // Simular latência

  return [
    {
      tipo: "intimacao",
      conteudo: expediente.conteudo || "",
      relevancia: 0.9,
    },
    {
      tipo: "processo",
      conteudo: `Processo ${expediente.numeroProcesso}`,
      relevancia: 1.0,
    },
  ];
}

async function construirFundamentacao(documentos: any[], tipoDocumento: string) {
  // Simular construção de fundamentação
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    fatos: [
      "Intimação recebida em " + new Date().toLocaleDateString("pt-BR"),
      "Prazo de resposta identificado",
    ],
    direito: ["CPC Art. 335 - Contestação", "Súmula 381 STJ"],
    precedentes: ["Precedente relevante identificado"],
  };
}

async function pesquisarPrecedentes(fundamentacao: any, tipoDocumento: string) {
  // Simular pesquisa de precedentes
  // Na implementação real, usar Qdrant ou DataJud API
  await new Promise((resolve) => setTimeout(resolve, 200));

  return [
    {
      tribunal: "STJ",
      numero: "REsp 1234567",
      ementa: "Ementa do precedente...",
      relevancia: 0.95,
    },
  ];
}

function construirPromptPeticao(
  documentos: any[],
  fundamentacao: any,
  precedentes: any[],
  context: PeticaoContext
): string {
  return `Você é um advogado especializado em ${context.tipoDocumento}.

Contexto do Processo:
- Número: ${context.expediente.numeroProcesso}
- Tipo de Documento: ${context.tipoDocumento}
- Urgente: ${context.urgente ? "Sim" : "Não"}

Documentos Analisados:
${documentos.map((d) => `- ${d.tipo}: ${d.conteudo.slice(0, 200)}...`).join("\n")}

Fundamentação Jurídica:
Fatos: ${fundamentacao.fatos.join(", ")}
Base Legal: ${fundamentacao.direito.join(", ")}

Precedentes Relevantes:
${precedentes.map((p) => `- ${p.tribunal} - ${p.numero}: ${p.ementa.slice(0, 100)}...`).join("\n")}

Redija uma ${context.tipoDocumento} completa, profissional e persuasiva, incluindo:
1. Identificação das partes
2. Exposição dos fatos
3. Fundamentação jurídica detalhada
4. Citação dos precedentes
5. Pedidos claros e objetivos

Formato: Documento jurídico formal em português brasileiro.`;
}

async function formatarPeticao(
  rascunho: string,
  expediente: Expediente,
  tipoDocumento: string
): Promise<string> {
  // Simular formatação
  await new Promise((resolve) => setTimeout(resolve, 50));

  // Na implementação real, aplicar template HTML/PDF
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${tipoDocumento.toUpperCase()} - ${expediente.numeroProcesso}</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 2cm; }
    h1 { text-align: center; font-size: 14pt; }
    p { text-align: justify; text-indent: 2cm; }
  </style>
</head>
<body>
  <h1>${tipoDocumento.toUpperCase()}</h1>
  ${rascunho}
  <p style="text-align: right; margin-top: 3cm;">
    ___________________________<br>
    Advogado(a)<br>
    OAB/XX 123456
  </p>
</body>
</html>
  `.trim();
}
