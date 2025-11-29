/**
 * LLM Client - Real API Implementation (Gemini 2.5 Pro)
 * 
 * This module provides a unified interface for LLM operations using Gemini 2.5 Pro.
 * All calls go to the backend proxy at /_spark/llm → /api/llm-proxy → Gemini API.
 * 
 * NO SIMULATIONS - All calls go to real AI APIs.
 */

const LLM_PROXY_URL = '/_spark/llm'

export interface LLMMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface LLMOptions {
    temperature?: number
    maxTokens?: number
    model?: string
}

/**
 * Call LLM API and get a text response
 */
export async function llm(
    prompt: string,
    model: string = 'gpt-4o',
    jsonMode: boolean = false
): Promise<string> {
    const messages: LLMMessage[] = [
        { role: 'user', content: prompt }
    ]

    const response = await callLLMProxy(messages, {
        model,
        temperature: jsonMode ? 0 : 0.7
    })

    if (jsonMode) {
        // Parse and re-stringify to ensure valid JSON
        try {
            const parsed = JSON.parse(response)
            return JSON.stringify(parsed)
        } catch {
            // If not valid JSON, return as-is
            return response
        }
    }

    return response
}

/**
 * Generate text using LLM
 */
export async function generateText(
    prompt: string,
    options: LLMOptions = {}
): Promise<string> {
    const messages: LLMMessage[] = [
        { role: 'user', content: prompt }
    ]

    return callLLMProxy(messages, options)
}

/**
 * Generate JSON using LLM
 */
export async function generateJSON<T = unknown>(
    prompt: string,
    options: LLMOptions = {}
): Promise<T> {
    const systemPrompt = 'You are a helpful assistant that always responds with valid JSON. Never include explanations outside the JSON structure.'

    const messages: LLMMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `${prompt}\n\nRespond with valid JSON only.` }
    ]

    const response = await callLLMProxy(messages, {
        ...options,
        temperature: 0 // Lower temperature for more consistent JSON
    })

    try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T
        }
        return JSON.parse(response) as T
    } catch (error) {
        console.error('Failed to parse JSON response:', response)
        throw new Error(`Invalid JSON response from LLM: ${error}`)
    }
}

/**
 * Stream text from LLM (falls back to non-streaming for now)
 */
export async function* streamText(
    prompt: string,
    options: LLMOptions = {}
): AsyncGenerator<string, void, unknown> {
    // For now, we don't have streaming support in the proxy
    // So we'll simulate streaming by returning the full response in chunks
    const response = await generateText(prompt, options)

    // Yield the response in chunks to simulate streaming
    const chunkSize = 10
    for (let i = 0; i < response.length; i += chunkSize) {
        yield response.slice(i, i + chunkSize)
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10))
    }
}

/**
 * Chat with LLM using message history
 */
export async function chat(
    messages: LLMMessage[],
    options: LLMOptions = {}
): Promise<string> {
    return callLLMProxy(messages, options)
}

/**
 * Internal function to call the LLM proxy
 */
async function callLLMProxy(
    messages: LLMMessage[],
    options: LLMOptions = {}
): Promise<string> {
    try {
        const response = await fetch(LLM_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages,
                model: options.model || 'gpt-4o',
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens || 2000
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`LLM API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()

        // Handle different response formats
        if (data.response) {
            return data.response
        }
        if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content
        }
        if (data.text) {
            return data.text
        }
        if (typeof data === 'string') {
            return data
        }

        throw new Error('Unexpected response format from LLM API')
    } catch (error) {
        console.error('LLM API call failed:', error)
        throw error
    }
}

// Export as spark-compatible namespace
export const spark = {
    llm,
    generateText,
    generateJSON,
    streamText
}

export default spark
