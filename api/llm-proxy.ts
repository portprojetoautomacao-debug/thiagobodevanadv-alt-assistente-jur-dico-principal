/**
 * Vercel Serverless Function - LLM Proxy
 * 
 * Suporta múltiplos provedores de IA:
 * 1. OpenAI GPT (recomendado) - OPENAI_API_KEY
 * 2. Google Gemini - GEMINI_API_KEY
 * 3. GitHub Models (gratuito) - GITHUB_TOKEN
 * 
 * Prioridade: OpenAI > Gemini > GitHub Models
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Configuração dos provedores
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest?: (body: any) => any;
  transformResponse?: (data: any) => any;
}

// Mapeamento de modelos entre provedores
const MODEL_MAPPING: Record<string, Record<string, string>> = {
  openai: {
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'gpt-4': 'gpt-4-turbo',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
  },
  gemini: {
    'gpt-4o': 'gemini-1.5-pro',
    'gpt-4o-mini': 'gemini-1.5-flash',
    'gpt-4': 'gemini-1.5-pro',
    'gpt-3.5-turbo': 'gemini-1.5-flash',
  }
};

// Transformar request para formato Gemini
function transformToGemini(body: any): any {
  const messages = body.messages || [];
  const contents = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // Adicionar system instruction se existir
  const systemMessage = messages.find((m: any) => m.role === 'system');

  return {
    contents,
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 4096,
    }
  };
}

// Transformar resposta Gemini para formato OpenAI
function transformFromGemini(data: any): any {
  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || '';

  return {
    id: `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gemini-1.5-pro',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: text,
      },
      finish_reason: candidate?.finishReason?.toLowerCase() || 'stop',
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    }
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  // Configurar provedores (ordem de prioridade)
  const providers: ProviderConfig[] = [
    // 1. OpenAI (prioridade máxima)
    {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY,
      headers: (key) => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      }),
    },
    // 2. Google Gemini (aceita GEMINI_API_KEY ou VITE_GOOGLE_API_KEY)
    {
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
      apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY,
      headers: () => ({
        'Content-Type': 'application/json',
      }),
      transformRequest: transformToGemini,
      transformResponse: transformFromGemini,
    },
  ];

  // Encontrar provedor disponível
  const provider = providers.find(p => p.apiKey);

  if (!provider) {
    console.error('No LLM provider configured');
    res.status(500).json({
      error: 'No LLM provider configured',
      message: 'Configure uma das seguintes variáveis no Vercel:',
      options: [
        { name: 'OPENAI_API_KEY', description: 'API key da OpenAI (recomendado)', url: 'https://platform.openai.com/api-keys' },
        { name: 'GEMINI_API_KEY', description: 'API key do Google Gemini (gratuito)', url: 'https://aistudio.google.com/app/apikey' },
      ]
    });
    return;
  }

  console.log(`Using LLM provider: ${provider.name}`);

  try {
    let body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requestedModel = body.model || 'gpt-4o';

    // Construir URL e body baseado no provedor
    let targetUrl = provider.baseUrl;
    let requestBody = body;

    if (provider.name === 'Gemini') {
      // Mapear modelo e construir URL específica do Gemini
      const geminiModel = MODEL_MAPPING.gemini[requestedModel] || 'gemini-1.5-flash';
      targetUrl = `${provider.baseUrl}/${geminiModel}:generateContent?key=${provider.apiKey}`;
      requestBody = provider.transformRequest!(body);
    } else if (provider.name === 'OpenAI') {
      // Mapear modelo OpenAI
      body.model = MODEL_MAPPING.openai[requestedModel] || requestedModel;
      requestBody = body;
    }

    // Fazer requisição
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: provider.headers(provider.apiKey!),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider.name} API error:`, errorText);
      throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
    }

    let data = await response.json();

    // Transformar resposta se necessário
    if (provider.transformResponse) {
      data = provider.transformResponse(data);
    }

    // Adicionar metadata sobre o provedor usado
    data._provider = provider.name;

    res.status(200).json(data);

  } catch (error) {
    console.error('LLM proxy error:', error);
    res.status(500).json({
      error: 'Failed to process LLM request',
      message: error instanceof Error ? error.message : 'Unknown error',
      provider: provider.name,
    });
  }
}
