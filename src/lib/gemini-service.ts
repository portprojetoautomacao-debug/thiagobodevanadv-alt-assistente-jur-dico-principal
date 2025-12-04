/**
 * Gemini Service - Serviço de IA Jurídica
 *
 * Módulo de funções especializadas para tarefas jurídicas usando o Gemini 2.5 Pro.
 * Implementa análise de documentos, geração de petições, cálculo de prazos e mais.
 *
 * IMPORTANTE:
 * - Este módulo deve ser utilizado apenas em ambiente server-side (API routes / server actions),
 *   nunca diretamente no browser, para não expor a API key.
 *
 * @module gemini-service
 * @version 2.1.0
 * @since 2025-11-28
 */

import { withRetry, type RetryConfig } from "@/lib/ai-providers";
import { getGeminiApiKey, isGeminiConfigured, validateGeminiApiKey } from "@/lib/gemini-config";

/**
 * Extract error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro desconhecido ao chamar Gemini";
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Configuração do modelo Gemini */
export interface GeminiConfig {
  /** ID do modelo (default: gemini-2.5-pro) */
  model: string;
  /** Temperatura para geração (0.0 - 1.0, default: 0.7) */
  temperature?: number;
  /** Número máximo de tokens na resposta (default: 4096) */
  maxOutputTokens?: number;
  /** Configuração de retry (opcional) */
  retryConfig?: Partial<RetryConfig>;
}

/** Parte de uma mensagem (texto simples) */
export interface GeminiPart {
  text: string;
}

/** Mensagem no formato Gemini (multi-turn) */
export interface GeminiMessage {
  role: "user" | "model";
  parts: GeminiPart[];
}

/** Resposta padronizada do Gemini */
export interface GeminiResponse {
  /** Texto da resposta (vazio se erro) */
  text: string;
  /** Mensagem de erro (undefined se sucesso) */
  error?: string;
  /** Metadados da resposta */
  metadata?: {
    model: string;
    promptTokens?: number;
    responseTokens?: number;
    totalTokens?: number;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Configuração padrão do Gemini */
const DEFAULT_CONFIG: GeminiConfig = {
  model: "gemini-2.5-pro",
  temperature: 0.7,
  maxOutputTokens: 4096,
};

/** URL base da API Gemini */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1/models";

/** Timeout padrão de requisição (em ms) para evitar funções travadas */
const DEFAULT_TIMEOUT_MS = 25_000;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida formato da API key do Gemini
 * API keys do Gemini começam com "AIza" e têm ~39 caracteres
 */
function validateGeminiApiKeyFormat(apiKey: string | undefined): boolean {
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn("[GeminiService] ⚠️ API key não fornecida");
      console.warn("[GeminiService] Configure VITE_GEMINI_API_KEY no .env.local");
      console.warn("[GeminiService] Obtenha em: https://aistudio.google.com/app/apikey");
    }
    return false;
  }

  if (!apiKey.startsWith("AIza")) {
    console.warn('[GeminiService] ⚠️ Formato de API key inválido - deve começar com "AIza"');
    console.warn("[GeminiService] Verifique VITE_GEMINI_API_KEY no .env.local");
    return false;
  }

  if (apiKey.length < 30) {
    console.warn("[GeminiService] ⚠️ API key muito curta - verifique a configuração");
    return false;
  }

  return true;
}

/**
 * Normaliza a resposta do Gemini numa estrutura GeminiResponse.
 */
function normalizeGeminiResponse(
  data: {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  },
  model: string
): GeminiResponse {
  const rawText =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("\n")
      .trim() || "";

  const metadata = {
    model,
    promptTokens: data?.usageMetadata?.promptTokenCount,
    responseTokens: data?.usageMetadata?.candidatesTokenCount,
    totalTokens: data?.usageMetadata?.totalTokenCount,
  };

  if (!rawText) {
    return {
      text: "",
      error: "Resposta vazia do modelo Gemini",
      metadata,
    };
  }

  return { text: rawText, metadata };
}

/**
 * Gera mensagem de erro mais amigável e loga detalhes no servidor.
 */
function buildGeminiError(
  error: unknown,
  context?: { endpoint?: string; model?: string }
): GeminiResponse {
  // Log completo no servidor (sem dados sensíveis do usuário)
  console.error("[GeminiService] Erro na chamada", {
    error,
    endpoint: context?.endpoint,
    model: context?.model,
  });

  const message = getErrorMessage(error);

  return {
    text: "",
    error: message,
  };
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Função principal para chamar a API do Gemini com um único prompt de texto.
 * Implementa:
 * - validação de configuração
 * - timeout de requisição
 * - retry automático (via withRetry)
 *
 * @param prompt - Texto do prompt a ser enviado
 * @param config - Configurações opcionais (model, temperature, maxOutputTokens, retryConfig)
 */
export async function callGemini(
  prompt: string,
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  // Validação de configuração básica
  if (!isGeminiConfigured()) {
    return {
      text: "",
      error:
        "API do Gemini não configurada. Configure VITE_GEMINI_API_KEY (ou equivalente) no ambiente do servidor.",
    };
  }

  // Obtém e valida API key
  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();

    // ✅ Validar formato da API key
    if (!validateGeminiApiKeyFormat(apiKey)) {
      return {
        text: "",
        error: "API key do Gemini em formato inválido. Deve começar com 'AIza'",
      };
    }
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : "Erro ao obter API key do Gemini",
    };
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const endpoint = `${GEMINI_API_BASE}/${finalConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const makeRequest = async (): Promise<GeminiResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: finalConfig.temperature,
            maxOutputTokens: finalConfig.maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao chamar API do Gemini";

        try {
          const errorBody = await response.json();
          errorMessage =
            errorBody.error?.message ||
            `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
        } catch {
          const text = await response.text();
          if (text) {
            errorMessage = `${errorMessage} (HTTP ${response.status}): ${text}`;
          } else {
            errorMessage = `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return normalizeGeminiResponse(data, finalConfig.model);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await withRetry(makeRequest, finalConfig.retryConfig);
  } catch (error) {
    return buildGeminiError(error, { endpoint, model: finalConfig.model });
  }
}

/**
 * Versão avançada: aceita um array de mensagens GeminiMessage (multi-turn).
 * Útil para chat jurídico com histórico.
 *
 * @param messages - Mensagens no formato Gemini (role + parts.text)
 * @param config - Configurações opcionais
 */
export async function callGeminiWithMessages(
  messages: GeminiMessage[],
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  if (!isGeminiConfigured()) {
    return {
      text: "",
      error:
        "API do Gemini não configurada. Configure VITE_GEMINI_API_KEY (ou equivalente) no ambiente do servidor.",
    };
  }

  let apiKey: string;
  try {
    apiKey = getGeminiApiKey();
    if (!validateGeminiApiKey(apiKey)) {
      return {
        text: "",
        error: "API key do Gemini parece estar em formato inválido",
      };
    }
  } catch (error) {
    return {
      text: "",
      error: error instanceof Error ? error.message : "Erro ao obter API key do Gemini",
    };
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const endpoint = `${GEMINI_API_BASE}/${finalConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const makeRequest = async (): Promise<GeminiResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role,
            parts: m.parts.map((p) => ({ text: p.text })),
          })),
          generationConfig: {
            temperature: finalConfig.temperature,
            maxOutputTokens: finalConfig.maxOutputTokens,
          },
        }),
      });

      if (!response.ok) {
        let errorMessage = "Erro ao chamar API do Gemini";

        try {
          const errorBody = await response.json();
          errorMessage =
            errorBody.error?.message ||
            `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
        } catch {
          const text = await response.text();
          if (text) {
            errorMessage = `${errorMessage} (HTTP ${response.status}): ${text}`;
          } else {
            errorMessage = `${errorMessage} (HTTP ${response.status}: ${response.statusText})`;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return normalizeGeminiResponse(data, finalConfig.model);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    return await withRetry(makeRequest, finalConfig.retryConfig);
  } catch (error) {
    return buildGeminiError(error, { endpoint, model: finalConfig.model });
  }
}

// ============================================================================
// SPECIALIZED LEGAL FUNCTIONS
// ============================================================================

/**
 * Analisa um documento jurídico e retorna um resumo estruturado.
 * Ideal para análise de contratos, petições, decisões, etc.
 */
export async function analyzeDocument(documentText: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado. Analise o seguinte documento e forneça um resumo estruturado:

Documento:
${documentText}

Por favor, forneça:
1. Tipo de documento
2. Partes envolvidas (se identificáveis)
3. Assunto principal
4. Prazos mencionados (se houver)
5. Principais pontos de atenção (riscos, cláusulas sensíveis, etc.)
6. Sugestões de ação prática para o advogado

Responda de forma clara, objetiva e em português jurídico, mas acessível.`;

  return callGemini(prompt, { temperature: 0.3 });
}

/**
 * Gera uma minuta de petição com base no tipo e detalhes fornecidos.
 * Segue as melhores práticas jurídicas brasileiras e o CPC.
 */
export async function generatePeticao(tipo: string, detalhes: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em redação de peças processuais brasileiras.

Tipo de petição: ${tipo}
Detalhes do caso:
${detalhes}

Elabore uma minuta de ${tipo} seguindo as melhores práticas, incluindo:
- Endereçamento adequado ao juízo
- Qualificação das partes (de forma genérica se não houver dados)
- Exposição dos fatos
- Fundamentação jurídica (leis, princípios e, se possível, referências jurisprudenciais sem inventar números de processo)
- Pedidos claros e objetivos
- Fecho com local, data e assinatura do advogado (placeholder)

A peça deve estar em conformidade com o CPC/2015 e a legislação vigente.`;

  return callGemini(prompt, { temperature: 0.5, maxOutputTokens: 4096 });
}

/**
 * Analisa e calcula prazos processuais com base na legislação brasileira.
 * Considera dias úteis vs corridos e peculiaridades do tipo de processo.
 */
export async function calculateDeadline(
  publicationDate: string,
  deadlineDays: number,
  context: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em prazos processuais no Brasil.

Data de publicação da intimação: ${publicationDate}
Prazo em dias indicado: ${deadlineDays}
Contexto do caso: ${context}

Analise e responda:
1. Se o prazo informado está correto para esse tipo de situação.
2. Se a contagem é em dias corridos ou úteis, indicando o fundamento (ex.: CPC, CLT etc.).
3. Se há regras especiais aplicáveis (ex.: Justiça do Trabalho, Juizados Especiais, Fazenda Pública).
4. Qual seria a data final estimada, explicando a lógica da contagem.
5. Algum alerta prático (ex.: feriados locais, necessidade de conferir calendário do tribunal).

Não invente feriados específicos; apenas alerte que eles podem impactar a contagem.`;

  return callGemini(prompt, { temperature: 0.2 });
}

/**
 * Sugere estratégias processuais para um caso jurídico.
 * Analisa pontos fortes/fracos, riscos e recomendações.
 */
export async function suggestStrategy(caseDescription: string): Promise<GeminiResponse> {
  const prompt = `Você é um estrategista jurídico. Analise o seguinte caso e sugira estratégias:

Descrição do caso:
${caseDescription}

Por favor, forneça:
1. Análise objetiva da situação (cenário jurídico).
2. Pontos fortes e fracos da posição do cliente.
3. Possíveis estratégias processuais e extrajudiciais.
4. Riscos relevantes e como mitigá-los.
5. Recomendações de próximos passos práticos.
6. Linhas de jurisprudência ou temas que vale a pena pesquisar (sem inventar números de processo).

Responda como se estivesse orientando um advogado que atua no dia a dia do foro.`;

  return callGemini(prompt, { temperature: 0.6 });
}

/**
 * Resume e analisa jurisprudência (acórdãos e decisões).
 * Extrai tese jurídica, fundamentos e aplicabilidade.
 */
export async function summarizeJurisprudence(jurisprudenceText: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em análise de jurisprudência. Analise o seguinte acórdão/decisão:

${jurisprudenceText}

Forneça:
1. Resumo do caso concreto.
2. Tese jurídica principal firmada.
3. Fundamentos legais (artigos de lei, princípios) utilizados.
4. Resultado do julgamento (procedente, improcedente, parcial, etc.).
5. Em quais tipos de casos essa decisão é particularmente útil.
6. Palavras-chave para indexação (em formato de lista).`;

  return callGemini(prompt, { temperature: 0.3 });
}

/**
 * Responde perguntas jurídicas com fundamentação legal.
 * Baseado no ordenamento jurídico brasileiro.
 */
export async function answerLegalQuestion(question: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado no ordenamento brasileiro. Responda à pergunta a seguir:

Pergunta:
${question}

Responda em 5 blocos:
1. Resposta direta e objetiva (sim/não/depende + explicação curta).
2. Fundamentação legal (leis, artigos, dispositivos relevantes).
3. Entendimento predominante na jurisprudência (sem inventar números de processos).
4. Observações práticas para atuação do advogado.
5. Riscos, exceções ou controvérsias relevantes.`;

  return callGemini(prompt, { temperature: 0.4 });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Re-exporta funções de configuração para conveniência
 */
export { isGeminiConfigured, validateGeminiApiKey } from "@/lib/gemini-config";
