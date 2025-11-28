/**
 * Gemini Service - Serviço de IA Jurídica
 * 
 * Módulo de funções especializadas para tarefas jurídicas usando o Gemini 2.5 Pro.
 * Implementa análise de documentos, geração de petições, cálculo de prazos e mais.
 * 
 * @module gemini-service
 * @version 2.0.0
 * @since 2025-11-28
 * 
 * Funcionalidades:
 * - Análise de documentos jurídicos
 * - Geração de petições e minutas
 * - Cálculo de prazos processuais
 * - Sugestões estratégicas
 * - Resumo de jurisprudência
 * - Respostas a perguntas jurídicas
 * 
 * @example
 * ```typescript
 * import { analyzeDocument, generatePeticao } from '@/lib/gemini-service'
 * 
 * // Analisar documento
 * const analysis = await analyzeDocument(documentoTexto)
 * 
 * // Gerar petição
 * const peticao = await generatePeticao('contestação', detalhes)
 * ```
 */

import { getGeminiApiKey, isGeminiConfigured, validateGeminiApiKey } from '@/lib/gemini-config'
import { withRetry, type RetryConfig } from '@/lib/ai-providers'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Configuração do modelo Gemini */
export interface GeminiConfig {
  /** ID do modelo (default: gemini-2.5-pro) */
  model: string
  /** Temperatura para geração (0.0 - 1.0, default: 0.7) */
  temperature?: number
  /** Número máximo de tokens na resposta (default: 4096) */
  maxOutputTokens?: number
  /** Configuração de retry (opcional) */
  retryConfig?: Partial<RetryConfig>
}

/** Mensagem no formato Gemini */
export interface GeminiMessage {
  role: 'user' | 'model'
  parts: string
}

/** Resposta padronizada do Gemini */
export interface GeminiResponse {
  /** Texto da resposta (vazio se erro) */
  text: string
  /** Mensagem de erro (undefined se sucesso) */
  error?: string
  /** Metadados da resposta */
  metadata?: {
    model: string
    promptTokens?: number
    responseTokens?: number
    totalTokens?: number
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Configuração padrão do Gemini */
const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-2.5-pro',
  temperature: 0.7,
  maxOutputTokens: 4096,
}

/** URL base da API Gemini */
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1/models'

// ============================================================================
// CORE FUNCTION
// ============================================================================

/**
 * Função principal para chamar a API do Gemini.
 * Implementa retry automático e tratamento robusto de erros.
 * 
 * @param prompt - Texto do prompt a ser enviado
 * @param config - Configurações opcionais (model, temperature, maxOutputTokens)
 * @returns Resposta com texto ou erro
 * 
 * @example
 * ```typescript
 * const response = await callGemini('Analise este contrato...', {
 *   temperature: 0.3,
 *   maxOutputTokens: 2048
 * })
 * 
 * if (response.error) {
 *   console.error('Erro:', response.error)
 * } else {
 *   console.log('Resposta:', response.text)
 * }
 * ```
 */
export async function callGemini(
  prompt: string,
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  // Validação de configuração
  if (!isGeminiConfigured()) {
    return {
      text: '',
      error:
        'API do Gemini não configurada. ' +
        'Configure VITE_GEMINI_API_KEY no arquivo .env',
    }
  }

  // Obtém e valida API key
  let apiKey: string
  try {
    apiKey = getGeminiApiKey()
    if (!validateGeminiApiKey(apiKey)) {
      return {
        text: '',
        error: 'API key do Gemini parece estar em formato inválido',
      }
    }
  } catch (error) {
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Erro ao obter API key',
    }
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Função interna para a chamada (será usada com retry)
  const makeRequest = async (): Promise<GeminiResponse> => {
    const response = await fetch(
      `${GEMINI_API_BASE}/${finalConfig.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: finalConfig.temperature,
            maxOutputTokens: finalConfig.maxOutputTokens,
          },
        }),
      }
    )

    if (!response.ok) {
      let errorMessage = 'Erro ao chamar API do Gemini'

      try {
        const errorBody = await response.json()
        errorMessage =
          errorBody.error?.message ||
          `${errorMessage} (HTTP ${response.status}: ${response.statusText})`
      } catch {
        const text = await response.text()
        if (text) {
          errorMessage = `${errorMessage} (HTTP ${response.status}): ${text}`
        } else {
          errorMessage = `${errorMessage} (HTTP ${response.status}: ${response.statusText})`
        }
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Extrai texto de todos os parts do primeiro candidato
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('\n')
        .trim() || ''

    // Extrai metadados se disponíveis
    const metadata = {
      model: finalConfig.model,
      promptTokens: data?.usageMetadata?.promptTokenCount,
      responseTokens: data?.usageMetadata?.candidatesTokenCount,
      totalTokens: data?.usageMetadata?.totalTokenCount,
    }

    return { text, metadata }
  }

  // Executa com retry
  try {
    return await withRetry(makeRequest, config.retryConfig)
  } catch (error) {
    console.error('[GeminiService] Erro na chamada:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido ao chamar Gemini',
    }
  }
}

// ============================================================================
// SPECIALIZED LEGAL FUNCTIONS
// ============================================================================

/**
 * Analisa um documento jurídico e retorna um resumo estruturado.
 * Ideal para análise de contratos, petições, decisões, etc.
 * 
 * @param documentText - Texto do documento a ser analisado
 * @returns Análise estruturada com tipo, partes, assunto, prazos e ações
 * 
 * @example
 * ```typescript
 * const analysis = await analyzeDocument(contratoTexto)
 * console.log(analysis.text)
 * // Output: "1. Tipo: Contrato de Prestação de Serviços..."
 * ```
 */
export async function analyzeDocument(documentText: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado. Analise o seguinte documento e forneça um resumo estruturado:

Documento:
${documentText}

Por favor, forneça:
1. Tipo de documento
2. Partes envolvidas
3. Assunto principal
4. Prazos mencionados (se houver)
5. Principais pontos de atenção
6. Sugestões de ação

Responda de forma clara e objetiva.`

  return callGemini(prompt, { temperature: 0.3 })
}

/**
 * Gera uma minuta de petição com base no tipo e detalhes fornecidos.
 * Segue as melhores práticas jurídicas brasileiras e o CPC.
 * 
 * @param tipo - Tipo de petição (contestação, recurso, inicial, etc.)
 * @param detalhes - Detalhes do caso para fundamentar a petição
 * @returns Minuta completa da petição
 * 
 * @example
 * ```typescript
 * const peticao = await generatePeticao('contestação', 
 *   'Ação de cobrança indevida. Cliente nunca contratou o serviço...')
 * ```
 */
export async function generatePeticao(
  tipo: string,
  detalhes: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em redação de peças processuais. 

Tipo de petição: ${tipo}
Detalhes: ${detalhes}

Por favor, elabore uma minuta de ${tipo} seguindo as melhores práticas jurídicas brasileiras, incluindo:
- Cabeçalho apropriado
- Fundamentação jurídica
- Pedidos claros e objetivos
- Fecho adequado

A minuta deve estar em conformidade com o CPC e a legislação vigente.`

  return callGemini(prompt, { temperature: 0.5, maxOutputTokens: 4096 })
}

/**
 * Analisa e calcula prazos processuais com base na legislação brasileira.
 * Considera dias úteis vs corridos e peculiaridades do tipo de processo.
 * 
 * @param publicationDate - Data de publicação da intimação (formato: DD/MM/YYYY)
 * @param deadlineDays - Número de dias do prazo
 * @param context - Contexto adicional (tipo de processo, vara, etc.)
 * @returns Análise completa do prazo com data final estimada
 * 
 * @example
 * ```typescript
 * const prazo = await calculateDeadline('15/11/2025', 15, 
 *   'Contestação em ação de cobrança, vara cível')
 * ```
 */
export async function calculateDeadline(
  publicationDate: string,
  deadlineDays: number,
  context: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em prazos processuais.

Data de publicação: ${publicationDate}
Prazo em dias: ${deadlineDays}
Contexto: ${context}

Por favor, analise:
1. Qual é o prazo correto aplicável ao caso?
2. A contagem deve ser em dias corridos ou úteis?
3. Há alguma peculiaridade do prazo neste tipo de processo?
4. Qual seria a data final estimada?
5. Há prazos intermediários importantes?

Baseie sua resposta no CPC/2015 e na legislação vigente.`

  return callGemini(prompt, { temperature: 0.2 })
}

/**
 * Sugere estratégias processuais para um caso jurídico.
 * Analisa pontos fortes/fracos, riscos e recomendações.
 * 
 * @param caseDescription - Descrição completa do caso
 * @returns Análise estratégica com recomendações
 * 
 * @example
 * ```typescript
 * const estrategia = await suggestStrategy(
 *   'Cliente busca indenização por danos morais após negativação indevida...'
 * )
 * ```
 */
export async function suggestStrategy(caseDescription: string): Promise<GeminiResponse> {
  const prompt = `Você é um estrategista jurídico especializado. Analise o seguinte caso e sugira estratégias:

Descrição do caso:
${caseDescription}

Por favor, forneça:
1. Análise da situação atual
2. Pontos fortes e fracos da posição
3. Possíveis estratégias processuais
4. Riscos e oportunidades
5. Recomendações de próximos passos
6. Jurisprudência ou precedentes relevantes que devem ser pesquisados

Responda de forma estratégica e prática.`

  return callGemini(prompt, { temperature: 0.6 })
}

/**
 * Resume e analisa jurisprudência (acórdãos e decisões).
 * Extrai tese jurídica, fundamentos e aplicabilidade.
 * 
 * @param jurisprudenceText - Texto do acórdão ou decisão
 * @returns Resumo estruturado da jurisprudência
 * 
 * @example
 * ```typescript
 * const resumo = await summarizeJurisprudence(acordaoSTJ)
 * ```
 */
export async function summarizeJurisprudence(
  jurisprudenceText: string
): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado em análise de jurisprudência. Analise o seguinte acórdão ou decisão:

${jurisprudenceText}

Por favor, forneça:
1. Resumo do caso
2. Tese jurídica principal
3. Fundamentos legais utilizados
4. Resultado do julgamento
5. Aplicabilidade a casos similares
6. Palavras-chave para indexação

Seja conciso mas completo.`

  return callGemini(prompt, { temperature: 0.3 })
}

/**
 * Responde perguntas jurídicas com fundamentação legal.
 * Baseado no ordenamento jurídico brasileiro.
 * 
 * @param question - Pergunta jurídica a ser respondida
 * @returns Resposta fundamentada com legislação e jurisprudência
 * 
 * @example
 * ```typescript
 * const resposta = await answerLegalQuestion(
 *   'Qual o prazo para contestação em ação monitória?'
 * )
 * ```
 */
export async function answerLegalQuestion(question: string): Promise<GeminiResponse> {
  const prompt = `Você é um assistente jurídico especializado. Responda à seguinte pergunta jurídica de forma clara e fundamentada:

Pergunta: ${question}

Por favor, forneça:
1. Resposta direta e objetiva
2. Fundamentação legal (leis, artigos, etc.)
3. Jurisprudência relevante (se aplicável)
4. Observações práticas
5. Ressalvas importantes

Base sua resposta no ordenamento jurídico brasileiro.`

  return callGemini(prompt, { temperature: 0.4 })
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Re-exporta funções de configuração para conveniência
 */
export { isGeminiConfigured, validateGeminiApiKey } from '@/lib/gemini-config'
