/**
 * Vercel Serverless Function - LLM Streaming Proxy
 * 
 * Suporta streaming de respostas de IA:
 * 1. OpenAI GPT (streaming nativo)
 * 2. Google Gemini (streaming nativo)
 * 
 * Retorna Server-Sent Events (SSE) para streaming em tempo real
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Tipos para mensagens e dados
interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface LLMRequest {
    model?: string;
    messages?: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    [key: string]: unknown;
}

// Tipo para evento SSE
interface SSEEvent {
    type: string;
    content?: string;
    provider?: string;
    message?: string;
}

// Configuração de runtime para Edge (suporta streaming melhor)
export const config = {
    maxDuration: 60,
};

// Transformar request para formato Gemini
function transformToGemini(body: LLMRequest): unknown {
    const messages = body.messages || [];
    const contents = messages
        .filter((m: ChatMessage) => m.role !== 'system')
        .map((m: ChatMessage) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    const systemMessage = messages.find((m: ChatMessage) => m.role === 'system');

    return {
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
            temperature: body.temperature || 0.7,
            maxOutputTokens: body.max_tokens || 4096,
        }
    };
}

/**
 * Configura headers CORS para a resposta
 */
function setupCorsHeaders(res: VercelResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Configura headers SSE para streaming
 */
function setupSSEHeaders(res: VercelResponse): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
}

/**
 * Cria função para enviar eventos SSE
 */
function createEventSender(res: VercelResponse): (data: SSEEvent) => void {
    return (data: SSEEvent) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
}

/**
 * Processa linha de streaming da OpenAI
 */
function processOpenAILine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'data: [DONE]') return null;

    if (!trimmed.startsWith('data: ')) return null;

    try {
        const json = JSON.parse(trimmed.slice(6));
        return json.choices?.[0]?.delta?.content || null;
    } catch {
        return null;
    }
}

/**
 * Processa linha de streaming do Gemini
 */
function processGeminiLine(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (!trimmed.startsWith('data: ')) return null;

    try {
        const json = JSON.parse(trimmed.slice(6));
        return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
        return null;
    }
}

/**
 * Processa stream de resposta genérico
 */
async function processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    lineProcessor: (line: string) => string | null,
    sendEvent: (data: SSEEvent) => void
): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            const content = lineProcessor(line);
            if (content) {
                sendEvent({ type: 'content', content });
            }
        }
    }
}

/**
 * Executa streaming com OpenAI
 */
async function streamOpenAI(
    body: LLMRequest,
    openaiKey: string,
    requestedModel: string,
    sendEvent: (data: SSEEvent) => void
): Promise<void> {
    console.log('[LLM-Stream] Using OpenAI streaming');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
            ...body,
            model: requestedModel.includes('gemini') ? 'gpt-4o-mini' : requestedModel,
            stream: true,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    await processStream(reader, processOpenAILine, sendEvent);
    sendEvent({ type: 'done', provider: 'OpenAI' });
}

/**
 * Executa streaming com Gemini
 */
async function streamGemini(
    body: LLMRequest,
    geminiKey: string,
    requestedModel: string,
    sendEvent: (data: SSEEvent) => void
): Promise<void> {
    console.log('[LLM-Stream] Using Gemini streaming');

    const geminiBody = transformToGemini(body);
    const model = requestedModel.startsWith('gemini') ? requestedModel : 'gemini-2.5-pro';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${geminiKey}&alt=sse`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiBody),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No reader available');

    await processStream(reader, processGeminiLine, sendEvent);
    sendEvent({ type: 'done', provider: 'Gemini' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    setupCorsHeaders(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Headers para SSE
    setupSSEHeaders(res);

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requestedModel = body.model || 'gpt-4o-mini';

    // Helper para enviar SSE
    const sendEvent = createEventSender(res);

    try {
        // Verificar provedor disponível
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

        if (openaiKey) {
            await streamOpenAI(body, openaiKey, requestedModel, sendEvent);
        } else if (geminiKey) {
            await streamGemini(body, geminiKey, requestedModel, sendEvent);
        } else {
            throw new Error('No LLM provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY');
        }

    } catch (error) {
        console.error('[LLM-Stream] Error:', error);
        sendEvent({
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    } finally {
        res.end();
    }
}
