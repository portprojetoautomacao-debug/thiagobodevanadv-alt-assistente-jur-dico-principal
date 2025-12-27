/**
 * AI Streaming Service
 *
 * Serviço para consumir streams de IA do backend
 * Suporta SSE (Server-Sent Events) e chunked responses
 */

export interface AIStreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface AIStreamRequest {
  prompt: string;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  systemPrompt?: string;
  provider?: "gemini" | "openai" | "anthropic";
}

/**
 * Stream de IA usando fetch com ReadableStream
 */
export async function streamAIFromBackend(
  prompt: string,
  callbacks: AIStreamCallbacks,
  options: Omit<AIStreamRequest, "prompt"> & {
    /** Permite usar outro endpoint (ex.: /api/llm-stream) */
    endpoint?: string;
    /** AbortController para cancelar streaming */
    signal?: AbortSignal;
    /** Headers adicionais */
    headers?: Record<string, string>;
  } = {}
): Promise<void> {
  const { onChunk, onComplete, onError } = callbacks;

  try {
    const endpoint = options.endpoint || "/api/ai/stream";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: JSON.stringify({
        prompt,
        temperature: options.temperature ?? 0.7,
        model: options.model ?? "gemini-2.5-pro",
        maxTokens: options.maxTokens,
        systemPrompt: options.systemPrompt,
        provider: options.provider,
      } as AIStreamRequest),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body não disponível para streaming");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let done = false;
    let buffer = "";

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        // Decodifica chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Processa linhas completas (SSE format)
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Última linha incompleta fica no buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: "

            if (data === "[DONE]") {
              done = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);

              // Suporte para diferentes formatos de resposta
              const text =
                parsed.text ||
                parsed.content ||
                parsed.delta?.content ||
                (parsed.type === "content" ? parsed.text : "");

              const errorFromEvent =
                parsed.error || (parsed.type === "error" ? parsed.error : undefined);

              if (errorFromEvent) {
                throw new Error(String(errorFromEvent));
              }

              if (text) {
                onChunk(text);
              }
            } catch {
              // Se não for JSON, trata como texto puro
              if (data.trim()) {
                onChunk(data);
              }
            }
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Stream de IA usando EventSource (SSE nativo)
 */
export function streamAIWithEventSource(prompt: string, callbacks: AIStreamCallbacks): void {
  const { onChunk, onComplete, onError } = callbacks;

  // Encode prompt para URL
  const params = new URLSearchParams({
    prompt,
    temperature: "0.7",
    model: "gemini-2.0-flash-exp",
  });

  const eventSource = new EventSource(`/api/ai/stream?${params.toString()}`);

  eventSource.onmessage = (event) => {
    if (event.data === "[DONE]") {
      eventSource.close();
      onComplete();
      return;
    }

    try {
      const parsed = JSON.parse(event.data);
      const text = parsed.text || parsed.content || parsed.delta?.content || "";

      if (text) {
        onChunk(text);
      }
    } catch {
      // Texto puro
      if (event.data.trim()) {
        onChunk(event.data);
      }
    }
  };

  eventSource.onerror = (_error) => {
    eventSource.close();
    onError(new Error("Erro no EventSource de streaming"));
  };
}

/**
 * Wrapper genérico para diferentes tipos de streaming
 */
export async function streamAI(
  request: AIStreamRequest,
  callbacks: AIStreamCallbacks,
  options: {
    method?: "fetch" | "sse";
    endpoint?: string;
  } = {}
): Promise<void> {
  const { method = "fetch", endpoint = "/api/ai/stream" } = options;

  if (method === "sse") {
    streamAIWithEventSource(request.prompt, callbacks);
  } else {
    await streamAIFromBackend(request.prompt, callbacks, {
      temperature: request.temperature,
      model: request.model,
      maxTokens: request.maxTokens,
      systemPrompt: request.systemPrompt,
      provider: request.provider,
      endpoint,
    });
  }
}

/**
 * Helper para processar comando rápido de IA
 */
export async function executeAIQuickCommand(
  command: string,
  selectedText: string,
  callbacks: AIStreamCallbacks
): Promise<void> {
  const prompts: Record<string, string> = {
    continue: `Continue escrevendo o texto de forma natural e profissional:\n\n${selectedText}`,
    expand: `Expanda e desenvolva o seguinte texto de forma mais detalhada:\n\n${selectedText}`,
    review: `Revise e melhore a redação do seguinte texto mantendo o significado:\n\n${selectedText}`,
    formalize: `Reescreva o seguinte texto em linguagem jurídica formal:\n\n${selectedText}`,
    summarize: `Resuma o seguinte texto de forma concisa:\n\n${selectedText}`,
    translate: `Traduza o seguinte texto para linguagem simples, mantendo o significado jurídico:\n\n${selectedText}`,
  };

  const prompt = prompts[command] || selectedText;

  await streamAIFromBackend(prompt, callbacks);
}
