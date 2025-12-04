/**
 * Serviço de Extração de Partes Processuais
 *
 * Usa IA (Gemini 2.5 Pro por padrão) para extrair autor e réu do teor de publicações jurídicas.
 * Pode ser apontado para qualquer endpoint de LLM via variável de ambiente.
 */

export interface ExtractedParties {
  autor: string;
  reu: string;
  advogadoAutor?: string;
  advogadoReu?: string;
  raw?: string; // Resposta bruta da IA para debug
}

// Endpoint e modelo configuráveis via .env (com defaults seguros)
const PARTIES_LLM_ENDPOINT = String(
  import.meta.env.VITE_LLM_ENDPOINT || import.meta.env.VITE_GEMINI_LLM_ENDPOINT || "/api/llm-proxy"
); // endpoint principal do Gemini 2.5 Pro

const PARTIES_LLM_MODEL =
  import.meta.env.VITE_LLM_MODEL || import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-pro";

/**
 * Extrai autor e réu do teor de uma publicação jurídica usando IA
 */
export async function extractPartiesFromTeor(teor: string): Promise<ExtractedParties> {
  try {
    const response = await fetch(PARTIES_LLM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: PARTIES_LLM_MODEL,
        messages: [
          {
            role: "system",
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

Responda APENAS com o JSON, sem texto adicional.`,
          },
          {
            role: "user",
            content: `Extraia as partes deste teor de publicação jurídica:\n\n${teor.substring(
              0,
              3000
            )}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("[ExtractParties] Erro HTTP:", response.status, PARTIES_LLM_ENDPOINT);
      return { autor: "Não identificado", reu: "Não identificado" };
    }

    const data = await response.json();

    // Tenta cobrir formatos de resposta típicos:
    // - data.response (gateways customizados)
    // - data.choices[0].message.content (OpenAI-like / GitHub Models)
    // - data.candidates[0].content.parts[].text (Gemini puro)
    let content: string = "";

    if (typeof data.response === "string") {
      content = data.response;
    } else if (Array.isArray(data.choices)) {
      content = data.choices?.[0]?.message?.content || "";
    } else if (Array.isArray(data.candidates)) {
      const parts = data.candidates[0]?.content?.parts || [];
      content = parts
        .map((p: { text?: string } | string) => {
          if (typeof p === "string") return p;
          return p?.text || "";
        })
        .join("\n");
    } else if (typeof data === "string") {
      content = data;
    }

    // Parse do JSON - tenta encontrar JSON na resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          autor: parsed.autor || "Não identificado",
          reu: parsed.reu || "Não identificado",
          advogadoAutor: parsed.advogadoAutor,
          advogadoReu: parsed.advogadoReu,
          raw: content,
        };
      } catch (e) {
        console.warn("[ExtractParties] Falha ao fazer parse do JSON da IA:", e);
      }
    }

    console.warn("[ExtractParties] Resposta sem JSON válido:", content);
    return { autor: "Não identificado", reu: "Não identificado", raw: content };
  } catch (error) {
    console.error("[ExtractParties] Erro ao extrair partes:", error);
    return { autor: "Não identificado", reu: "Não identificado" };
  }
}

/**
 * Tenta extrair partes via regex (fallback rápido sem IA)
 */
export function extractPartiesRegex(teor: string): ExtractedParties {
  // Padrões comuns em publicações (S5869: removido duplicatas, S5843: simplificado complexidade)
  const patterns = {
    // "AUTOR: Nome" ou "Requerente: Nome"
    // Simplificado: removido alguns alternadores desnecessários para reduzir complexidade
    autor:
      /(?:autor|requerente|exequente|embargante|apelante|agravante|impetrante)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+?)(?:\s*(?:x|vs?\.?|contra|CPF|CNPJ|RG|\d|[,;.\n]|$))/i,
    // "RÉU: Nome" ou "Requerido: Nome"
    reu: /(?:r[eé]u|requerido|executado|embargado|apelado|agravado|impetrado)[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+?)(?:\s*(?:CPF|CNPJ|RG|\d|[,;.\n]|$))/i,
  };

  const matchAutor = teor.match(patterns.autor);
  const matchReu = teor.match(patterns.reu);

  return {
    autor: matchAutor?.[1]?.trim() || "",
    reu: matchReu?.[1]?.trim() || "",
  };
}

/**
 * Extrai partes com fallback: primeiro tenta regex, se não encontrar, usa IA
 */
export async function extractPartiesWithFallback(teor: string): Promise<ExtractedParties> {
  // Primeiro tenta regex (mais rápido, sem custo de IA)
  const regexResult = extractPartiesRegex(teor);

  // Se encontrou ambos via regex, retorna direto
  if (regexResult.autor && regexResult.reu) {
    console.log("[ExtractParties] Partes extraídas via regex:", regexResult);
    return regexResult;
  }

  // Senão, usa IA (Gemini 2.5 Pro ou o modelo configurado)
  console.log("[ExtractParties] Regex incompleto, usando IA em", PARTIES_LLM_ENDPOINT);
  return extractPartiesFromTeor(teor);
}
