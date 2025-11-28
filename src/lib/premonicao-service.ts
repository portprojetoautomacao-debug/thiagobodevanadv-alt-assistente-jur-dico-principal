import type { PremonicaoJuridica, Process } from '@/types'

export async function generatePremonicaoJuridica(
  cnj: string,
  processData?: Process
): Promise<PremonicaoJuridica> {
  const processInfo = processData
    ? `**Título:** ${processData.titulo}\n**Autor:** ${processData.autor}\n**Réu:** ${processData.reu}\n**Status Atual:** ${processData.status}\n**Comarca:** ${processData.comarca}\n**Vara:** ${processData.vara}\n`
    : ''

  const promptText = `Você é um assistente jurídico especializado em análise preditiva de processos judiciais brasileiros.

Analise o seguinte processo judicial e forneça uma estimativa completa de probabilidade de êxito:

**Processo CNJ:** ${cnj}
${processInfo}

Sua tarefa é retornar um objeto JSON com a seguinte estrutura EXATA (sem markdown, apenas o JSON):

{
  "probabilidade_exito": <número entre 0 e 100>,
  "analise_ia": "<explicação clara e objetiva em 200-500 caracteres sobre a análise do caso, considerando jurisprudência, fatos, e contexto jurídico brasileiro>",
  "estrategias_recomendadas": [
    "<estratégia processual específica 1>",
    "<estratégia processual específica 2>",
    "<estratégia processual específica 3>",
    "<estratégia processual específica 4 (opcional)>"
  ],
  "precedentes_relevantes": [
    {
      "id": "STJ - REsp XXXXX",
      "tribunal": "STJ",
      "numero": "REsp XXXXX",
      "tema": "<tema jurídico relevante>",
      "resumo_relevancia": "<resumo de 120-300 caracteres explicando por que este precedente é relevante para o caso>",
      "link": "https://processo.stj.jus.br/processo/julgamento/eletronico/documento/?num_registro=XXXXX"
    },
    {
      "id": "TRF1 - AC XXXXX",
      "tribunal": "TRF1",
      "numero": "AC XXXXX",
      "tema": "<tema jurídico relevante>",
      "resumo_relevancia": "<resumo de 120-300 caracteres>",
      "link": "https://www.trf1.jus.br/jurisprudencia"
    }
  ]
}

INSTRUÇÕES IMPORTANTES:
1. A probabilidade deve ser realista considerando jurisprudência brasileira
2. A análise deve mencionar pontos fortes E fracos do caso
3. As estratégias devem ser acionáveis e específicas para o direito brasileiro
4. Inclua 2-4 precedentes relevantes de tribunais superiores (STJ, STF, TRF)
5. Os links dos precedentes podem ser genéricos (URLs dos sites dos tribunais)
6. Use linguagem jurídica clara mas acessível
7. Considere prazos processuais e prescrição quando relevante

Retorne APENAS o objeto JSON, sem texto adicional antes ou depois.`

  try {
    console.log('[PremonicaoService] Gerando análise preditiva para:', cnj)

    const response = await fetch('/_spark/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini',
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente jurídico especializado em análise preditiva de processos judiciais brasileiros. Sempre responda apenas com JSON válido, sem markdown, sem comentários e sem texto fora do objeto JSON.',
          },
          {
            role: 'user',
            content: promptText,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('[PremonicaoService] Erro na resposta:', response.status, response.statusText)
      throw new Error(`Erro na API: ${response.status}`)
    }

    const data = await response.json()

    // Cobrir os formatos mais comuns do proxy Spark/Gemini
    const responseText: string =
      data.response?.text ??
      data.response ??
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      data.message?.content ??
      ''

    console.log(
      '[PremonicaoService] Resposta recebida (preview):',
      typeof responseText === 'string' ? responseText.substring(0, 200) : '[non-string]'
    )

    if (!responseText || typeof responseText !== 'string') {
      throw new Error('Resposta vazia ou em formato inesperado da API de IA')
    }

    // Limpar possíveis marcadores de código (```json ... ```)
    const cleaned = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    let parsed: any

    try {
      parsed = JSON.parse(cleaned)
    } catch (parseError) {
      console.error('[PremonicaoService] Erro ao fazer parse direto do JSON:', parseError)

      // Tentar extrair o primeiro bloco JSON da resposta
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0])
        } catch (innerError) {
          console.error('[PremonicaoService] Erro ao fazer parse do JSON extraído:', innerError)
          throw new Error('Resposta não contém JSON válido (parse falhou)')
        }
      } else {
        throw new Error('Resposta não contém JSON reconhecível')
      }
    }

    // Normalização defensiva
    let prob = Number(parsed.probabilidade_exito)
    if (!Number.isFinite(prob)) prob = 50
    prob = Math.min(100, Math.max(0, prob))

    const analise =
      typeof parsed.analise_ia === 'string' && parsed.analise_ia.trim()
        ? parsed.analise_ia.trim()
        : 'Análise não disponível'

    const estrategias: string[] = Array.isArray(parsed.estrategias_recomendadas)
      ? parsed.estrategias_recomendadas.filter((e: unknown) => typeof e === 'string' && e.trim())
      : []

    const precedentes: any[] = Array.isArray(parsed.precedentes_relevantes)
      ? parsed.precedentes_relevantes
      : []

    const result: PremonicaoJuridica = {
      processo_cnj: cnj,
      probabilidade_exito: prob,
      analise_ia: analise,
      estrategias_recomendadas: estrategias,
      precedentes_relevantes: precedentes,
    }

    return result
  } catch (error) {
    console.error('[PremonicaoService] Erro ao gerar premonição:', error)
    throw new Error('Não foi possível gerar a análise preditiva. Tente novamente.')
  }
}
