/**
 * Kimi K2 Thinking Service
 *
 * Modelo de raciocínio avançado do Azure AI Foundry para análise complexa
 *
 * @see https://learn.microsoft.com/azure/ai-foundry/
 */

interface KimiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  apiVersion: string;
}

interface KimiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const config: KimiConfig = {
  endpoint: import.meta.env.VITE_AZURE_AI_FOUNDRY_ENDPOINT || "",
  apiKey: import.meta.env.VITE_AZURE_AI_FOUNDRY_KEY || "",
  model: import.meta.env.VITE_KIMI_MODEL_NAME || "Kimi-K2-Thinking",
  apiVersion: import.meta.env.VITE_KIMI_API_VERSION || "2024-05-01-preview",
};

/**
 * Envia uma requisição ao Kimi K2 Thinking
 */
export async function sendKimiRequest(
  messages: KimiMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<string> {
  if (!config.endpoint || !config.apiKey) {
    throw new Error(
      "Kimi K2 Thinking não configurado. Configure VITE_AZURE_AI_FOUNDRY_ENDPOINT e VITE_AZURE_AI_FOUNDRY_KEY"
    );
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.apiKey,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 4000,
      top_p: options?.topP ?? 0.95,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi K2 API Error: ${response.status} - ${error}`);
  }

  const data: KimiResponse = await response.json();
  return data.choices[0]?.message?.content || "";
}

/**
 * Análise jurídica complexa com raciocínio step-by-step
 */
export async function analyzeComplexLegalCase(
  caseDescription: string,
  question: string
): Promise<string> {
  const messages: KimiMessage[] = [
    {
      role: "system",
      content: `Você é um assistente jurídico especializado em análise processual complexa.
Use raciocínio passo-a-passo (Chain of Thought) para:
1. Analisar o caso detalhadamente
2. Identificar questões jurídicas relevantes
3. Aplicar precedentes e jurisprudência
4. Fornecer recomendação fundamentada

Sempre estruture sua resposta em etapas claras.`,
    },
    {
      role: "user",
      content: `CASO:\n${caseDescription}\n\nQUESTÃO:\n${question}`,
    },
  ];

  return sendKimiRequest(messages, {
    temperature: 0.3, // Baixa para precisão jurídica
    maxTokens: 8000, // Alto para raciocínio detalhado
  });
}

/**
 * Revisão de código com análise profunda
 */
export async function reviewCode(
  code: string,
  language: string,
  context?: string
): Promise<string> {
  const messages: KimiMessage[] = [
    {
      role: "system",
      content: `Você é um expert em revisão de código com foco em:
- Identificação de bugs e vulnerabilidades
- Otimização de performance
- Conformidade com melhores práticas
- Sugestões de refatoração

Use raciocínio detalhado para explicar cada problema encontrado.`,
    },
    {
      role: "user",
      content: `Revise o seguinte código ${language}:

${context ? `CONTEXTO:\n${context}\n\n` : ""}CÓDIGO:
\`\`\`${language}
${code}
\`\`\`

Forneça análise detalhada com:
1. Problemas identificados
2. Impacto de cada problema
3. Sugestões de correção
4. Código refatorado (se aplicável)`,
    },
  ];

  return sendKimiRequest(messages, {
    temperature: 0.2,
    maxTokens: 6000,
  });
}

/**
 * Geração de estratégia processual com múltiplas opções
 */
export async function generateLegalStrategy(
  processInfo: {
    numero?: string;
    parte?: string;
    assunto?: string;
    situacao?: string;
  },
  goal: string
): Promise<string> {
  const messages: KimiMessage[] = [
    {
      role: "system",
      content: `Você é um estrategista jurídico que analisa casos e sugere múltiplas abordagens.
Para cada estratégia proposta:
1. Explique o raciocínio
2. Liste prós e contras
3. Estime probabilidade de sucesso
4. Identifique riscos
5. Sugira próximos passos`,
    },
    {
      role: "user",
      content: `PROCESSO:
${JSON.stringify(processInfo, null, 2)}

OBJETIVO:
${goal}

Analise o caso e sugira 3 estratégias diferentes, explicando o raciocínio para cada uma.`,
    },
  ];

  return sendKimiRequest(messages, {
    temperature: 0.5,
    maxTokens: 10000,
  });
}

/**
 * Debug de problemas complexos com raciocínio step-by-step
 */
export async function debugIssue(
  errorMessage: string,
  code: string,
  stackTrace?: string
): Promise<string> {
  const messages: KimiMessage[] = [
    {
      role: "system",
      content: `Você é um debugger expert que usa raciocínio metódico para encontrar a causa raiz de problemas.
Processo de debug:
1. Analisar a mensagem de erro
2. Examinar o código relacionado
3. Traçar o fluxo de execução
4. Identificar a causa raiz
5. Propor solução testável`,
    },
    {
      role: "user",
      content: `ERRO:
${errorMessage}

${stackTrace ? `STACK TRACE:\n${stackTrace}\n\n` : ""}CÓDIGO:
${code}

Use raciocínio passo-a-passo para debugar este problema.`,
    },
  ];

  return sendKimiRequest(messages, {
    temperature: 0.1,
    maxTokens: 5000,
  });
}

export const kimiService = {
  sendKimiRequest,
  analyzeComplexLegalCase,
  reviewCode,
  generateLegalStrategy,
  debugIssue,
};
