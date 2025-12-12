/**
 * AI Streaming API Endpoint
 *
 * Endpoint serverless para streaming de respostas de IA
 * Suporta múltiplos provedores: Gemini, OpenAI, Anthropic
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ===========================
// Types
// ===========================

type AIProvider = "gemini" | "openai" | "anthropic";

interface StreamRequest {
  prompt: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  provider?: AIProvider;
}

// ===========================
// Provider Clients
// ===========================

/**
 * Stream com Google Gemini
 */
async function streamWithGemini(
  request: StreamRequest,
  send: (data: unknown) => void,
  signal?: AbortSignal
) {
  const { prompt, temperature = 0.7, model = "gemini-2.5-pro", systemPrompt } = request;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [...(systemPrompt ? [{ text: systemPrompt }] : []), { text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: request.maxTokens || 8192,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Gemini");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Gemini pode vir como SSE (data: {...}) ou NDJSON/array streaming.
      if (line.startsWith("data:")) line = line.slice(5).trim();
      if (!line || line === "[DONE]" || line === "[" || line === "]" || line === ",") continue;

      try {
        const json = JSON.parse(line) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          send({ text });
        }
      } catch {
        // Ignorar linhas que não são JSON válido
      }
    }
  }
}

/**
 * Stream com OpenAI
 */
async function streamWithOpenAI(
  request: StreamRequest,
  send: (data: unknown) => void,
  signal?: AbortSignal
) {
  const { prompt, temperature = 0.7, model = "gpt-4o-mini", systemPrompt } = request;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model,
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt },
      ],
      temperature,
      max_tokens: request.maxTokens || 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from OpenAI");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data: ")) continue;

      const data = line.slice(6);
      if (data === "[DONE]") continue;

      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const text = json.choices?.[0]?.delta?.content;
        if (text) {
          send({ type: "content", text, provider: "openai" });
        }
      } catch {
        // Ignorar linhas inválidas
      }
    }
  }
}

/**
 * Stream com Anthropic Claude
 */
async function streamWithAnthropic(
  request: StreamRequest,
  send: (data: unknown) => void,
  _signal?: AbortSignal
) {
  const { prompt, temperature = 0.7, model = "claude-3-5-sonnet-20241022", systemPrompt } = request;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // ANTHROPIC_API_KEY é validada antes de chegar aqui; forçar string para satisfazer HeadersInit
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: request.maxTokens || 4096,
      temperature,
      system: systemPrompt || undefined,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Anthropic");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data: ")) continue;

      const data = line.slice(6);
      if (data === "[DONE]") continue;

      try {
        const json = JSON.parse(data) as {
          type?: string;
          delta?: { text?: string };
        };

        if (json.type === "content_block_delta" && json.delta?.text) {
          send({ type: "content", text: json.delta.text, provider: "anthropic" });
        }
      } catch {
        // Ignorar linhas inválidas
      }
    }
  }
}

// ===========================
// Main Handler
// ===========================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers (respeita ALLOWED_ORIGINS quando definido)
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
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (allowedOrigins.length === 0) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse request
    const requestData: StreamRequest =
      req.method === "POST"
        ? typeof req.body === "string"
          ? (JSON.parse(req.body) as StreamRequest)
          : (req.body as StreamRequest)
        : {
            prompt: String(req.query.prompt || ""),
            temperature: parseFloat(String(req.query.temperature || "0.7")),
            model: String(req.query.model || ""),
            provider: (req.query.provider as AIProvider | undefined) || undefined,
          };

    if (!requestData.prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // Determinar provider (prioridade: OpenAI > Gemini > Anthropic)
    const provider: AIProvider =
      requestData.provider ||
      (OPENAI_API_KEY
        ? "openai"
        : GEMINI_API_KEY
          ? "gemini"
          : ANTHROPIC_API_KEY
            ? "anthropic"
            : "gemini");

    // Validar API keys
    if (provider === "gemini" && !GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }
    if (provider === "openai" && !OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    }
    if (provider === "anthropic" && !ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
    }

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const abortController = new AbortController();
    req.on("close", () => abortController.abort());

    const send = (data: unknown) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      if (provider === "gemini") {
        await streamWithGemini(requestData, send, abortController.signal);
      } else if (provider === "openai") {
        await streamWithOpenAI(requestData, send);
      } else {
        await streamWithAnthropic(requestData, send);
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      send({ type: "error", error: errorMessage, provider });
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (error) {
    console.error("Stream error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      res.end();
    }
  }
}

// Configuração Vercel
export const config = {
  maxDuration: 60, // 60 segundos para streaming
};
