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

// Configuração de runtime para Edge (suporta streaming melhor)
export const config = {
    maxDuration: 60,
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
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    // Headers para SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requestedModel = body.model || 'gpt-4o-mini';

    // Helper para enviar SSE
    const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
        // Verificar provedor disponível
        const openaiKey = process.env.OPENAI_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

        if (openaiKey) {
            // ========== OpenAI Streaming ==========
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

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(trimmed.slice(6));
                            const content = json.choices?.[0]?.delta?.content;
                            if (content) {
                                sendEvent({ type: 'content', content });
                            }
                        } catch (e) {
                            // Ignorar linhas inválidas
                        }
                    }
                }
            }

            sendEvent({ type: 'done', provider: 'OpenAI' });

        } else if (geminiKey) {
            // ========== Gemini Streaming ==========
            console.log('[LLM-Stream] Using Gemini streaming');

            const geminiBody = transformToGemini(body);
            // Use requested model if it starts with 'gemini', otherwise default to 2.5-pro
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

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const json = JSON.parse(trimmed.slice(6));
                            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                sendEvent({ type: 'content', content: text });
                            }
                        } catch (e) {
                            // Ignorar linhas inválidas
                        }
                    }
                }
            }

            sendEvent({ type: 'done', provider: 'Gemini' });

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
