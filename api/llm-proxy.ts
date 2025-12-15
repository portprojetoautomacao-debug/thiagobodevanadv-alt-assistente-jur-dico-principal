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

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "./lib/auth";
import { rateLimitMiddleware } from "./lib/rate-limit";
import { retryWithBackoff } from "./lib/retry";
import { escapeHtml } from "./lib/sanitize";
import { withTimeout } from "./lib/timeout";

// Tipos para mensagens e dados
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMRequest {
  model?: string;
  messages?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  [key: string]: unknown;
}

interface LLMResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _provider?: string;
  [key: string]: unknown;
}

// Configuração dos provedores
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  headers: (apiKey: string) => Record<string, string>;
  transformRequest?: (body: LLMRequest) => unknown;
  transformResponse?: (data: unknown) => LLMResponse;
}

// Mapeamento de modelos entre provedores
const MODEL_MAPPING: Record<string, Record<string, string>> = {
  openai: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4": "gpt-4-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  },
  gemini: {
    "gpt-4o": "gemini-2.5-pro",
    "gpt-4o-mini": "gemini-2.5-pro",
    "gpt-4": "gemini-2.5-pro",
    "gpt-3.5-turbo": "gemini-2.5-pro",
    gemini: "gemini-2.5-pro",
    "gemini-pro": "gemini-2.5-pro",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.5-flash": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.5-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
  },
};

// Transformar request para formato Gemini
function transformToGemini(body: LLMRequest): unknown {
  const messages = body.messages || [];
  const contents = messages
    .filter((m: ChatMessage) => m.role !== "system")
    .map((m: ChatMessage) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  // Adicionar system instruction se existir
  const systemMessage = messages.find((m: ChatMessage) => m.role === "system");

  return {
    contents,
    systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 4096,
    },
  };
}

// Transformar resposta Gemini para formato OpenAI
function transformFromGemini(data: unknown): LLMResponse {
  const geminiData = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const candidate = geminiData.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";

  return {
    id: `gemini-${Date.now()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "gemini-2.5-pro",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || "stop",
      },
    ],
    usage: {
      prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiData.usageMetadata?.totalTokenCount || 0,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS - restrict to ALLOWED_ORIGINS list
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers && (req.headers["origin"] as string | undefined)) || "";
  if (origin && allowedOrigins.length > 0) {
    if (!allowedOrigins.includes(origin)) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (allowedOrigins.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Only POST is supported." });
    return;
  }

  // Require LLM proxy API key in non-development environments unless explicitly allowed
  // Security: Avoid open LLM proxy in production
  // ✅ CORREÇÃO: Detectar localhost/127.0.0.1 como desenvolvimento
  const isLocalhost = req.headers.host?.includes("localhost") || 
                      req.headers.host?.includes("127.0.0.1") ||
                      req.headers.host?.includes("[::1]");
  const isDev = process.env.NODE_ENV === "development" || isLocalhost;
  const allowPublic = process.env.LLM_PROXY_ALLOW_PUBLIC === "true";
  
  if (!isDev && !allowPublic) {
    // Always require API key in production by default
    if (!requireApiKey(req, res, "LLM_PROXY_API_KEY")) return;
  }

  // rate limit middleware
  const clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown";
  const rl = await rateLimitMiddleware(clientIP);
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      Math.max(
        1,
        Math.ceil((Number(rl.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
      ).toString()
    );
    return res.status(429).json({ error: rl.error || "Rate limit exceeded" });
  }

  // Configurar provedores (ordem de prioridade)
  const providers: ProviderConfig[] = [
    // 1. OpenAI (prioridade máxima)
    {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      headers: (key) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      }),
    },
    // 2. Google Gemini (aceita GEMINI_API_KEY ou VITE_GEMINI_API_KEY)
    // ✅ CORREÇÃO: Prioriza VITE_GEMINI_API_KEY para funcionar em desenvolvimento local
    {
      name: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      apiKey:
        process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
      headers: () => ({
        "Content-Type": "application/json",
      }),
      transformRequest: transformToGemini,
      transformResponse: transformFromGemini,
    },
  ];

  // Encontrar provedor disponível
  const provider = providers.find((p) => p.apiKey);

  // Simple in-memory cache to reduce duplicate LLM calls during hot reload / repeated requests
  // Important: This cache is ephemeral (serverless) and intended for short TTL caching only
  const CACHE_TTL_MS = 5 * 1000; // 5s short-term cache
  const cacheKeyBase = JSON.stringify({ body: req.body, origin, clientIP });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - simple global cache variable for serverless lifecycle reuse
  (globalThis as Record<string, unknown>).__LLM_PROXY_CACHE =
    (globalThis as Record<string, unknown>).__LLM_PROXY_CACHE ||
    new Map<string, { expiresAt: number; data: unknown }>();
  const globalCache: Map<string, { expiresAt: number; data: unknown }> = (
    globalThis as Record<string, unknown>
  ).__LLM_PROXY_CACHE as Map<string, { expiresAt: number; data: unknown }>;

  const cacheKey = `${provider?.name ?? "unknown"}:${cacheKeyBase}`;
  const cached = globalCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return res.status(200).json(cached.data as LLMResponse);
  }

  // Circuit breaker (in-memory) to avoid repeated failed calls to the same provider
  // Note: Serverless memory is ephemeral; consider Redis/KV for cluster-wide circuit breaker
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (globalThis as Record<string, unknown>).__LLM_PROXY_CIRCUIT =
    (globalThis as Record<string, unknown>).__LLM_PROXY_CIRCUIT ||
    new Map<string, { failures: number; openedUntil?: number }>();
  const circuit = (globalThis as Record<string, unknown>).__LLM_PROXY_CIRCUIT as Map<
    string,
    { failures: number; openedUntil?: number }
  >;
  const providerCircuit = circuit.get(provider?.name ?? "unknown") || { failures: 0 };
  if (providerCircuit.openedUntil && providerCircuit.openedUntil > Date.now()) {
    // Circuit open
    return res
      .status(503)
      .json({ error: "LLM provider temporarily unavailable (circuit open). Try later." });
  }

  if (!provider) {
    const isVercel = Boolean(process.env.VERCEL_ENV);
    const isDev = process.env.NODE_ENV === "development";

    console.error("No LLM provider configured");

    // Em desenvolvimento, retornamos um fallback no formato OpenAI para evitar
    // que o frontend quebre (e para orientar a configuração da chave).
    if (!isVercel && isDev) {
      const fallbackPayload = {
        summary:
          "⚠️ IA não configurada: defina OPENAI_API_KEY ou GEMINI_API_KEY para habilitar a análise automática.",
        documentType: "Intimação",
        priority: "média",
        deadline: { days: 15, type: "úteis", endDate: "Verificar" },
        suggestedActions: ["Configurar OPENAI_API_KEY ou GEMINI_API_KEY", "Reexecutar a análise"],
        nextSteps: ["Abrir configurações", "Adicionar chave de API", "Tentar novamente"],
      };

      const content = `\n\n\`\`\`json\n${JSON.stringify(fallbackPayload, null, 2)}\n\`\`\``;

      return res.status(200).json({
        id: `unconfigured-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "unconfigured",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        _provider: "none",
        _warning: "No LLM provider configured",
      } satisfies LLMResponse);
    }

    // Em produção (Vercel), falhar explicitamente para evitar comportamento silencioso.
    return res.status(503).json({
      error: "No LLM provider configured",
      message: "Configure uma das seguintes variáveis no ambiente:",
      options: [
        {
          name: "OPENAI_API_KEY",
          description: "API key da OpenAI (recomendado)",
          url: "https://platform.openai.com/api-keys",
        },
        {
          name: "GEMINI_API_KEY",
          description: "API key do Google Gemini",
          url: "https://aistudio.google.com/app/apikey",
        },
      ],
    });
  }

  console.log(`Using LLM provider: ${provider.name}`);

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // Simple validation using Zod
    const ChatMessageSchema = z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string().min(1).max(20000),
    });
    const LLMRequestSchema = z.object({
      model: z.string().optional(),
      messages: z.array(ChatMessageSchema).optional(),
      temperature: z.number().optional(),
      max_tokens: z.number().optional(),
    });
    const parsed = LLMRequestSchema.safeParse(body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Invalid request body", details: parsed.error.format() });
    }

    // sanitize message contents
    if (parsed.data.messages) {
      parsed.data.messages.forEach((m) => {
        m.content = escapeHtml(m.content);
      });
    }

    // Modelo padrão baseado no provedor
    const defaultModel = provider.name === "OpenAI" ? "gpt-4o-mini" : "gemini-2.5-pro";
    const requestedModel = body.model || defaultModel;

    // Construir URL e body baseado no provedor
    let targetUrl = provider.baseUrl;
    let requestBody = body;

    if (provider.name === "Gemini") {
      // Mapear modelo e construir URL específica do Gemini
      const geminiModel = MODEL_MAPPING.gemini[requestedModel] || "gemini-2.5-pro";
      console.log(`[Gemini] Modelo solicitado: ${requestedModel} → ${geminiModel}`);
      targetUrl = `${provider.baseUrl}/${geminiModel}:generateContent?key=${provider.apiKey}`;
      requestBody = provider.transformRequest!(body);
    } else if (provider.name === "OpenAI") {
      // Mapear modelo OpenAI
      body.model = MODEL_MAPPING.openai[requestedModel] || requestedModel;
      requestBody = body;
    }

    // Fazer requisição
    // Make request with timeout + retry
    const fetchFn = async () => {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: provider.headers(provider.apiKey!),
        body: JSON.stringify(requestBody),
      });
      if (!response.ok) {
        const errorText = await response.text();
        // ✅ FIX: Log detalhado para debug de erros 429/500
        console.error(`[${provider.name}] HTTP ${response.status}:`, {
          url: targetUrl.replace(/key=[^&]+/, 'key=***'),
          status: response.status,
          error: errorText.substring(0, 500)
        });
        
        // ✅ FIX: Tratamento específico para 429 (Rate Limit)
        if (response.status === 429) {
          throw new Error(`${provider.name} Rate Limit: ${errorText.substring(0, 200)}`);
        }
        
        throw new Error(`${provider.name} API error: ${response.status} - ${errorText}`);
      }
      return response.json();
    };

    // ✅ FIX: Reduzir retries para evitar timeout em cascata
    const data = await retryWithBackoff(() => withTimeout(45000, fetchFn()), 2, 1000);

    // Response status has already been checked inside fetchFn

    // data already set from retryWithBackoff

    // Transformar resposta se necessário
    let transformed = data;
    if (provider.transformResponse) transformed = provider.transformResponse(data);

    // Adicionar metadata sobre o provedor usado
    transformed._provider = provider.name;

    // Update circuit status: success => reset
    if (providerCircuit.failures && providerCircuit.failures > 0) {
      circuit.set(provider.name, { failures: 0 });
    }

    // Store in short-term cache
    globalCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: transformed });

    res.status(200).json(transformed);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[LLM Proxy] Error:", {
      provider: provider?.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack?.substring(0, 300) : undefined
    });
    
    // Update circuit failure count
    const name = provider?.name || "unknown";
    const st = circuit.get(name) || { failures: 0 };
    st.failures = (st.failures || 0) + 1;
    
    // ✅ FIX: Circuit breaker mais agressivo para Rate Limit
    const FAILURE_THRESHOLD = errorMessage.includes("Rate Limit") ? 2 : 5;
    const OPEN_TIME_MS = errorMessage.includes("Rate Limit") ? 120_000 : 60_000; // 2min para rate limit
    
    if (st.failures >= FAILURE_THRESHOLD) {
      st.openedUntil = Date.now() + OPEN_TIME_MS;
      console.warn(`[LLM Proxy] Circuit breaker ABERTO para ${name} (${st.failures} falhas)`);
    }
    circuit.set(name, st);
    
    // ✅ FIX: Retornar 429 se for rate limit, 500 caso contrário
    const statusCode = errorMessage.includes("Rate Limit") ? 429 : 500;
    
    res.status(statusCode).json({
      error: "Failed to process LLM request",
      message: errorMessage,
      provider: provider.name,
      circuitOpen: st.openedUntil ? st.openedUntil > Date.now() : false,
    });
  }
}
