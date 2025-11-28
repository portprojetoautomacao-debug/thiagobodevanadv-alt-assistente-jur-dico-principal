import { getGeminiApiKey, isGeminiConfigured } from '@/lib/gemini-config'

export interface GeminiConfig {
  model: string
  temperature?: number
  maxOutputTokens?: number
}

export interface GeminiMessage {
  role: 'user' | 'model'
  parts: string
}

export interface GeminiResponse {
  text: string
  error?: string
}

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-2.5-pro',
  temperature: 0.7,
  maxOutputTokens: 4096,
}

export async function callGemini(
  prompt: string,
  config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  if (!isGeminiConfigured()) {
    return {
      text: '',
      error:
        'API do Gemini não configurada. Configure VITE_GEMINI_API_KEY no arquivo .env',
    }
  }

  const apiKey = getGeminiApiKey()
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${finalConfig.model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
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

    // Junta todos os parts.text do primeiro candidato
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('\n')
        .trim() || ''

    return { text }
  } catch (error) {
    console.error('Erro na chamada do Gemini:', error)
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Erro desconhecido ao chamar Gemini',
    }
  }
}

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
