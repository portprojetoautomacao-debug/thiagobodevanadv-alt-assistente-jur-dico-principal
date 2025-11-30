/**
 * Hook para streaming de respostas de IA
 * 
 * Permite receber respostas de IA em tempo real via Server-Sent Events (SSE)
 * 
 * @example
 * const { streamingContent, isStreaming, error, streamChat } = useAIStreaming()
 * 
 * // Iniciar streaming
 * await streamChat([
 *   { role: 'system', content: 'Você é um assistente jurídico.' },
 *   { role: 'user', content: 'Explique o que é uma petição inicial.' }
 * ])
 * 
 * // streamingContent será atualizado em tempo real
 */

import { useState, useCallback, useRef } from 'react'

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface StreamEvent {
    type: 'content' | 'done' | 'error'
    content?: string
    provider?: string
    message?: string
}

interface UseAIStreamingOptions {
    onChunk?: (chunk: string) => void
    onComplete?: (fullContent: string, provider: string) => void
    onError?: (error: string) => void
    model?: string
    temperature?: number
    maxTokens?: number
}

interface UseAIStreamingReturn {
    streamingContent: string
    isStreaming: boolean
    error: string | null
    provider: string | null
    streamChat: (messages: Message[]) => Promise<string>
    cancelStream: () => void
    reset: () => void
}

export function useAIStreaming(options: UseAIStreamingOptions = {}): UseAIStreamingReturn {
    const [streamingContent, setStreamingContent] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [provider, setProvider] = useState<string | null>(null)

    const abortControllerRef = useRef<AbortController | null>(null)
    const contentRef = useRef('')

    const {
        onChunk,
        onComplete,
        onError,
        model = 'gpt-4o-mini',
        temperature = 0.7,
        maxTokens = 2000,
    } = options

    const reset = useCallback(() => {
        setStreamingContent('')
        setError(null)
        setProvider(null)
        contentRef.current = ''
    }, [])

    const cancelStream = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
        setIsStreaming(false)
    }, [])

    const streamChat = useCallback(async (messages: Message[]): Promise<string> => {
        // Cancelar stream anterior se existir
        cancelStream()
        reset()

        setIsStreaming(true)
        contentRef.current = ''

        abortControllerRef.current = new AbortController()

        try {
            const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

            const response = await fetch(`${baseUrl}/api/llm-stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                }),
                signal: abortControllerRef.current.signal,
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const reader = response.body?.getReader()
            if (!reader) {
                throw new Error('Streaming não suportado')
            }

            const decoder = new TextDecoder()
            let buffer = ''

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed?.startsWith('data: ')) continue

                    try {
                        const event: StreamEvent = JSON.parse(trimmed.slice(6))

                        if (event.type === 'content' && event.content) {
                            contentRef.current += event.content
                            setStreamingContent(contentRef.current)
                            onChunk?.(event.content)
                        } else if (event.type === 'done') {
                            setProvider(event.provider || null)
                            onComplete?.(contentRef.current, event.provider || 'unknown')
                        } else if (event.type === 'error') {
                            throw new Error(event.message || 'Erro desconhecido')
                        }
                    } catch (parseError) {
                        // Ignorar linhas inválidas
                    }
                }
            }

            return contentRef.current

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Cancelamento intencional, não é erro
                return contentRef.current
            }

            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
            setError(errorMessage)
            onError?.(errorMessage)
            throw err

        } finally {
            setIsStreaming(false)
            abortControllerRef.current = null
        }
    }, [model, temperature, maxTokens, onChunk, onComplete, onError, cancelStream, reset])

    return {
        streamingContent,
        isStreaming,
        error,
        provider,
        streamChat,
        cancelStream,
        reset,
    }
}

export default useAIStreaming
