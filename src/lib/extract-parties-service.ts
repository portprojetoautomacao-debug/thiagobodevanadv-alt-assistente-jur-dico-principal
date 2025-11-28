/**
 * Serviço de Extração de Partes Processuais
 * 
 * Utiliza IA (Gemini) para extrair autor e réu do teor de publicações jurídicas.
 */

export interface ExtractedParties {
    autor: string
    reu: string
    advogadoAutor?: string
    advogadoReu?: string
    raw?: string // Resposta bruta da IA para debug
}

/**
 * Extrai autor e réu do teor de uma publicação jurídica usando IA
 */
export async function extractPartiesFromTeor(teor: string): Promise<ExtractedParties> {
    try {
        const response = await fetch('/_spark/llm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gemini',
                messages: [
                    {
                        role: 'system',
                        content: `Você é um especialista em análise de publicações jurídicas brasileiras.
Analise o texto da publicação e extraia as partes do processo.

Retorne APENAS um JSON válido com a estrutura:
{
  "autor": "Nome do autor/requerente/exequente/embargante (quem propôs a ação)",
  "reu": "Nome do réu/requerido/executado/embargado (contra quem a ação foi proposta)",
  "advogadoAutor": "Nome do advogado do autor (se identificado)",
  "advogadoReu": "Nome do advogado do réu (se identificado)"
}

REGRAS:
- Se não identificar uma parte, use "Não identificado"
- Se houver múltiplas partes, liste separadas por "e outros" ou "e outro(a)"
- Remova títulos como "Dr.", "Dra.", exceto para advogados
- Em execuções: exequente=autor, executado=réu
- Em embargos: embargante=autor, embargado=réu
- Identifique também: apelante/apelado, agravante/agravado, impetrante/impetrado

Responda APENAS com o JSON, sem texto adicional.`
                    },
                    {
                        role: 'user',
                        content: `Extraia as partes deste teor de publicação jurídica:\n\n${teor.substring(0, 3000)}`
                    }
                ],
                temperature: 0.1
            })
        })

        if (!response.ok) {
            console.error('[ExtractParties] Erro HTTP:', response.status)
            return { autor: 'Não identificado', reu: 'Não identificado' }
        }

        const data = await response.json()
        const content = data.response || data.choices?.[0]?.message?.content || ''

        // Parse do JSON - tenta encontrar JSON na resposta
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            return {
                autor: parsed.autor || 'Não identificado',
                reu: parsed.reu || 'Não identificado',
                advogadoAutor: parsed.advogadoAutor,
                advogadoReu: parsed.advogadoReu,
                raw: content
            }
        }

        console.warn('[ExtractParties] Resposta sem JSON válido:', content)
        return { autor: 'Não identificado', reu: 'Não identificado', raw: content }

    } catch (error) {
        console.error('[ExtractParties] Erro ao extrair partes:', error)
        return { autor: 'Não identificado', reu: 'Não identificado' }
    }
}

/**
 * Tenta extrair partes via regex (fallback rápido sem IA)
 */
export function extractPartiesRegex(teor: string): ExtractedParties {
    const autor = { autor: '', reu: '' }

    // Padrões comuns em publicações
    const patterns = {
        // "AUTOR: Nome" ou "Requerente: Nome"
        autor: /(?:autor|requerente|exequente|embargante|apelante|agravante|impetrante)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+?)(?:\s*(?:x|vs?\.?|contra|CPF|CNPJ|RG|\d|,|\.|;|\n|$))/i,
        // "RÉU: Nome" ou "Requerido: Nome"  
        reu: /(?:r[eé]u|requerido|executado|embargado|apelado|agravado|impetrado)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+?)(?:\s*(?:CPF|CNPJ|RG|\d|,|\.|;|\n|$))/i
    }

    const matchAutor = teor.match(patterns.autor)
    const matchReu = teor.match(patterns.reu)

    return {
        autor: matchAutor?.[1]?.trim() || '',
        reu: matchReu?.[1]?.trim() || ''
    }
}

/**
 * Extrai partes com fallback: primeiro tenta regex, se não encontrar, usa IA
 */
export async function extractPartiesWithFallback(teor: string): Promise<ExtractedParties> {
    // Primeiro tenta regex (mais rápido)
    const regexResult = extractPartiesRegex(teor)

    // Se encontrou ambos via regex, retorna direto
    if (regexResult.autor && regexResult.reu) {
        console.log('[ExtractParties] Partes extraídas via regex:', regexResult)
        return regexResult
    }

    // Senão, usa IA
    console.log('[ExtractParties] Regex incompleto, usando IA...')
    return extractPartiesFromTeor(teor)
}
