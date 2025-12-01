/**
 * Harvey Specter Chat - Assistente Jurídico Inteligente
 * 
 * Versão otimizada com:
 * - Streaming de IA em tempo real
 * - Renderização de Markdown
 * - Insights clicáveis com navegação
 * - Histórico limitado para performance
 * - Scroll otimizado
 */

import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { useKV } from '@/hooks/use-kv'
import { useAIStreaming } from '@/hooks/use-ai-streaming'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
    PaperPlaneTilt,
    ChartBar,
    Briefcase,
    Bell,
    CurrencyCircleDollar,
    Warning,
    Stop,
    User,
    Robot,
    Trash,
    ArrowRight,
    Sparkle,
    Copy,
    Check,
} from '@phosphor-icons/react'
import type { Process, FinancialEntry, ViewType } from '@/types'

// ============================================
// TIPOS
// ============================================

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    insights?: Insight[]
}

interface Insight {
    type: 'statistics' | 'alert' | 'trend' | 'suggestion' | 'info'
    title: string
    value?: string
    description: string
    action?: ViewType // Navegação para seção do app
}

interface AgentTask {
    id: string
    agentId: string
    type: string
    priority: 'high' | 'medium' | 'low'
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    description: string
    createdAt: string
}

interface HarveySpecterChatProps {
    readonly onNavigate?: (view: ViewType) => void
    readonly maxMessages?: number // Limite de mensagens no histórico
}

// ============================================
// CONSTANTES
// ============================================

const MAX_INPUT_LENGTH = 2000
const DEFAULT_MAX_MESSAGES = 50

const QUICK_ACTIONS = [
    {
        icon: ChartBar,
        title: 'Processos',
        description: 'Status do acervo',
        query: 'Qual o status dos meus processos?',
        color: 'text-blue-500 bg-blue-500/10',
    },
    {
        icon: Bell,
        title: 'Prazos',
        description: 'Urgentes e próximos',
        query: 'Quais são os prazos urgentes?',
        color: 'text-red-500 bg-red-500/10',
    },
    {
        icon: CurrencyCircleDollar,
        title: 'Financeiro',
        description: 'Resumo do mês',
        query: 'Como está o financeiro do escritório?',
        color: 'text-green-500 bg-green-500/10',
    },
    {
        icon: Briefcase,
        title: 'Tarefas',
        description: 'Pendentes e em progresso',
        query: 'Quais tarefas estão pendentes?',
        color: 'text-purple-500 bg-purple-500/10',
    },
]

const SUGGESTED_QUESTIONS = [
    'Resumo geral do escritório',
    'Processos com prazo esta semana',
    'Margem de lucro do mês',
    'O que você pode fazer?',
]

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// Componente de Markdown simples (sem dependência externa)
const SimpleMarkdown = memo(({ content }: { content: string }) => {
    const formatted = useMemo(() => {
        if (!content) return ''

        return content
            // Headers
            .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
            // Bold
            .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            // Italic
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            // Code inline
            .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 bg-muted rounded text-sm font-mono">$1</code>')
            // Lists
            .replace(/^• (.+)$/gm, '<li class="ml-4">$1</li>')
            .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
            .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p class="mt-2">')
            .replace(/\n/g, '<br/>')
    }, [content])

    return (
        <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p>${formatted}</p>` }}
        />
    )
})
SimpleMarkdown.displayName = 'SimpleMarkdown'

// Botão de copiar mensagem
const CopyButton = memo(({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Erro ao copiar')
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            aria-label="Copiar mensagem"
        >
            {copied ? (
                <Check className="w-3 h-3 text-green-500" />
            ) : (
                <Copy className="w-3 h-3" />
            )}
        </Button>
    )
})
CopyButton.displayName = 'CopyButton'

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function HarveySpecterChat({
    onNavigate,
    maxMessages = DEFAULT_MAX_MESSAGES
}: HarveySpecterChatProps) {
    // Estados
    const [messages, setMessages] = useKV<Message[]>('harvey-messages', [])
    const [input, setInput] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)

    // Refs
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Dados do KV storage
    const [processes] = useKV<Process[]>('processes', [])
    const [financialRecords] = useKV<FinancialEntry[]>('financialEntries', [])
    const [taskQueue] = useKV<AgentTask[]>('agent-task-queue', [])
    const [completedTasks] = useKV<AgentTask[]>('completed-agent-tasks', [])

    // Hook de streaming
    const {
        streamingContent,
        isStreaming,
        streamChat,
        cancelStream,
        reset: resetStreaming,
    } = useAIStreaming({
        onChunk: () => {
            // Scroll suave durante streaming
            requestAnimationFrame(() => {
                if (scrollAreaRef.current) {
                    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
                    if (viewport) {
                        viewport.scrollTop = viewport.scrollHeight
                    }
                }
            })
        },
        onError: (error) => {
            console.error('[Harvey] Erro:', error)
            toast.error('Erro ao processar resposta')
        },
    })

    // ============================================
    // ESTATÍSTICAS REAIS (memoizado)
    // ============================================

    const realStats = useMemo(() => {
        const now = new Date()
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
        const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        const totalProcesses = processes?.length || 0
        const processesByStatus = {
            'Em Andamento': processes?.filter(p => p.status === 'ativo').length || 0,
            'Aguardando': processes?.filter(p => p.status === 'suspenso').length || 0,
            'Concluído': processes?.filter(p => p.status === 'concluido').length || 0,
            'Arquivado': processes?.filter(p => p.status === 'arquivado').length || 0,
        }

        // Prazos urgentes
        const urgentDeadlines = processes?.reduce((count, p) => {
            return count + (p.prazos?.filter(prazo => {
                if (prazo.concluido) return false
                const deadline = new Date(prazo.dataFinal)
                return deadline <= in48h && deadline >= now
            }).length || 0)
        }, 0) || 0

        // Prazos próximos (7 dias)
        const upcomingDeadlines = processes?.reduce((count, p) => {
            return count + (p.prazos?.filter(prazo => {
                if (prazo.concluido) return false
                const deadline = new Date(prazo.dataFinal)
                return deadline <= in7days && deadline >= now
            }).length || 0)
        }, 0) || 0

        // Financeiro
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        const monthlyRecords = financialRecords?.filter(r => {
            const date = new Date(r.date)
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear
        }) || []

        const receita = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
        const despesas = monthlyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
        const margem = receita > 0 ? ((receita - despesas) / receita * 100).toFixed(1) : '0'

        // Tarefas
        const pendingTasks = taskQueue?.filter(t => t.status === 'pending').length || 0
        const inProgressTasks = taskQueue?.filter(t => t.status === 'in_progress').length || 0

        return {
            totalProcesses,
            processesByStatus,
            urgentDeadlines,
            upcomingDeadlines,
            receita,
            despesas,
            margem,
            pendingTasks,
            inProgressTasks,
            hasData: totalProcesses > 0 || (financialRecords?.length ?? 0) > 0 || (taskQueue?.length ?? 0) > 0,
        }
    }, [processes, financialRecords, taskQueue, completedTasks])

    // ============================================
    // FUNÇÕES MEMOIZADAS
    // ============================================

    // Gera insights baseados na query (memoizado)
    const getInsights = useCallback((query: string): Insight[] => {
        const lowerQuery = query.toLowerCase()

        if (!realStats.hasData) {
            return [{
                type: 'info',
                title: 'Sem Dados',
                description: 'Cadastre processos e dados para ver estatísticas.',
                action: 'processos',
            }]
        }

        if (lowerQuery.includes('processo') || lowerQuery.includes('acervo')) {
            const insights: Insight[] = [
                {
                    type: 'statistics',
                    title: 'Total',
                    value: String(realStats.totalProcesses),
                    description: 'processos cadastrados',
                    action: 'processos',
                },
            ]
            if (realStats.urgentDeadlines > 0) {
                insights.push({
                    type: 'alert',
                    title: 'Urgentes',
                    value: String(realStats.urgentDeadlines),
                    description: 'prazos em 48h',
                    action: 'prazos',
                })
            }
            return insights
        }

        if (lowerQuery.includes('prazo') || lowerQuery.includes('urgent')) {
            return [
                {
                    type: 'alert',
                    title: 'Urgentes',
                    value: String(realStats.urgentDeadlines),
                    description: 'nas próximas 48h',
                    action: 'prazos',
                },
                {
                    type: 'statistics',
                    title: '7 dias',
                    value: String(realStats.upcomingDeadlines),
                    description: 'prazos próximos',
                    action: 'agenda',
                },
            ]
        }

        if (lowerQuery.includes('financ') || lowerQuery.includes('receita') || lowerQuery.includes('dinheiro')) {
            return [
                {
                    type: 'statistics',
                    title: 'Receita',
                    value: `R$ ${realStats.receita.toLocaleString('pt-BR')}`,
                    description: 'este mês',
                    action: 'financeiro',
                },
                {
                    type: 'trend',
                    title: 'Margem',
                    value: `${realStats.margem}%`,
                    description: 'lucro líquido',
                    action: 'financeiro',
                },
            ]
        }

        if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente')) {
            return [
                {
                    type: 'statistics',
                    title: 'Pendentes',
                    value: String(realStats.pendingTasks),
                    description: 'tarefas aguardando',
                    action: 'expedientes',
                },
                {
                    type: 'trend',
                    title: 'Em progresso',
                    value: String(realStats.inProgressTasks),
                    description: 'sendo executadas',
                    action: 'expedientes',
                },
            ]
        }

        return [{
            type: 'suggestion',
            title: 'Dica',
            description: 'Pergunte sobre processos, prazos, financeiro ou tarefas',
        }]
    }, [realStats])

    // System prompt (memoizado)
    const buildSystemPrompt = useCallback(() => {
        const contextData = realStats.hasData
            ? `Dados REAIS do escritório:
- ${realStats.totalProcesses} processos (${realStats.processesByStatus['Em Andamento']} ativos)
- ${realStats.urgentDeadlines} prazos urgentes (48h)
- ${realStats.upcomingDeadlines} prazos em 7 dias
- Receita: R$ ${realStats.receita.toLocaleString('pt-BR')}
- Despesas: R$ ${realStats.despesas.toLocaleString('pt-BR')}
- Margem: ${realStats.margem}%
- ${realStats.pendingTasks} tarefas pendentes`
            : 'Sistema sem dados cadastrados.'

        return `Você é Harvey Specter, assistente jurídico inteligente.

${contextData}

Regras:
- Use APENAS dados fornecidos, não invente
- Seja conciso e profissional
- Use markdown para formatação
- Forneça recomendações acionáveis`
    }, [realStats])

    // Função de envio unificada
    const sendMessage = useCallback(async (query: string) => {
        const trimmed = query.trim()
        if (!trimmed || isProcessing || isStreaming) return

        setIsProcessing(true)
        resetStreaming()

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: new Date().toISOString(),
        }

        const assistantId = `assistant-${Date.now()}`
        setStreamingMessageId(assistantId)

        const assistantMessage: Message = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            insights: getInsights(trimmed),
        }

        // Adiciona mensagens e limita histórico
        setMessages(current => {
            const updated = [...(current || []), userMessage, assistantMessage]
            return updated.slice(-maxMessages) // Mantém apenas as últimas N mensagens
        })

        try {
            const systemPrompt = buildSystemPrompt()
            const finalContent = await streamChat([
                { role: 'system', content: systemPrompt },
                { role: 'user', content: trimmed }
            ])

            setMessages(current =>
                (current || []).map(msg =>
                    msg.id === assistantId ? { ...msg, content: finalContent } : msg
                )
            )
        } catch (error) {
            console.error('[Harvey] Erro:', error)
            setMessages(current =>
                (current || []).map(msg =>
                    msg.id === assistantId
                        ? { ...msg, content: 'Desculpe, ocorreu um erro. Tente novamente.' }
                        : msg
                )
            )
            toast.error('Erro ao processar mensagem')
        } finally {
            setIsProcessing(false)
            setStreamingMessageId(null)
        }
    }, [isProcessing, isStreaming, resetStreaming, getInsights, buildSystemPrompt, streamChat, setMessages, maxMessages])

    // Handlers
    const handleSend = useCallback(() => {
        if (!input.trim()) return
        const query = input
        setInput('')
        // Fire and forget - promise is intentionally not awaited
        sendMessage(query).catch(console.error)
    }, [input, sendMessage])

    const handleCancel = useCallback(() => {
        cancelStream()
        setIsProcessing(false)
        if (streamingMessageId) {
            setMessages(current =>
                (current || []).map(msg =>
                    msg.id === streamingMessageId
                        ? { ...msg, content: (streamingContent || '') + '\n\n*[Interrompido]*' }
                        : msg
                )
            )
            setStreamingMessageId(null)
        }
    }, [cancelStream, streamingMessageId, streamingContent, setMessages])

    const handleClear = useCallback(() => {
        setMessages([])
        resetStreaming()
        setStreamingMessageId(null)
        toast.success('Conversa limpa')
    }, [setMessages, resetStreaming])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }, [handleSend])

    const handleInsightClick = useCallback((action?: ViewType) => {
        if (action && onNavigate) {
            onNavigate(action)
        }
    }, [onNavigate])

    // Auto-scroll quando mensagens mudam
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight
            }
        }
    }, [messages])

    // ============================================
    // RENDER
    // ============================================

    const charCount = input.length
    const isOverLimit = charCount > MAX_INPUT_LENGTH

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
                        <Sparkle className="w-5 h-5 text-white" weight="fill" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Harvey Specter</h1>
                        <p className="text-xs text-muted-foreground">Assistente Jurídico IA</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {realStats.urgentDeadlines > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                            {realStats.urgentDeadlines} urgente{realStats.urgentDeadlines > 1 ? 's' : ''}
                        </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleClear} aria-label="Limpar conversa">
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden" ref={scrollAreaRef}>
                <ScrollArea className="h-full">
                    <div className="px-4 py-4 space-y-4">
                        {!messages || messages.length === 0 ? (
                            // Welcome Screen
                            <div className="space-y-6 py-8">
                                <div className="text-center">
                                    <h2 className="text-xl font-semibold mb-2">Olá! Sou o Harvey Specter</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Seu assistente jurídico com dados em tempo real do escritório
                                    </p>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    {QUICK_ACTIONS.map((action) => {
                                        const Icon = action.icon
                                        return (
                                            <Card
                                                key={action.title}
                                                className="p-3 cursor-pointer hover:bg-accent/5 transition-colors"
                                                onClick={() => sendMessage(action.query)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn('p-2 rounded-lg', action.color)}>
                                                        <Icon className="w-4 h-4" weight="fill" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{action.title}</p>
                                                        <p className="text-xs text-muted-foreground">{action.description}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>

                                {/* Suggested Questions */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Sugestões:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {SUGGESTED_QUESTIONS.map((q) => (
                                            <Button
                                                key={q}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs"
                                                onClick={() => sendMessage(q)}
                                            >
                                                {q}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Messages
                            <div className="space-y-4">
                                {messages.map((message) => (
                                    <div key={message.id} className="group">
                                        <div className={cn(
                                            'flex gap-3',
                                            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                        )}>
                                            {/* Avatar */}
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                                message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-linear-to-br from-primary/20 to-accent/20'
                                            )}>
                                                {message.role === 'user'
                                                    ? <User className="w-4 h-4" weight="fill" />
                                                    : <Robot className="w-4 h-4" weight="fill" />
                                                }
                                            </div>

                                            {/* Content */}
                                            <div className={cn(
                                                'flex-1 max-w-[80%]',
                                                message.role === 'user' ? 'text-right' : 'text-left'
                                            )}>
                                                <Card className={cn(
                                                    'p-3 inline-block text-left',
                                                    message.role === 'user'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-card'
                                                )}>
                                                    {/* Streaming ou conteúdo final */}
                                                    {message.id === streamingMessageId && isStreaming ? (
                                                        <div className="text-sm">
                                                            <SimpleMarkdown content={streamingContent || ''} />
                                                            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                                                        </div>
                                                    ) : (message.content ? (
                                                        <div className="text-sm">
                                                            <SimpleMarkdown content={message.content} />
                                                        </div>
                                                    ) : (message.id === streamingMessageId ? (
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                                            <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                                        </div>
                                                    ) : null))}
                                                </Card>

                                                {/* Copy button para assistente */}
                                                {message.role === 'assistant' && message.content && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <CopyButton text={message.content} />
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Insights clicáveis */}
                                                {message.insights && message.insights.length > 0 && message.role === 'assistant' && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {message.insights.map((insight) => (
                                                            <Card
                                                                key={insight.title}
                                                                className={cn(
                                                                    'px-2 py-1.5 inline-flex items-center gap-1.5 text-xs',
                                                                    insight.action && 'cursor-pointer hover:bg-accent/10'
                                                                )}
                                                                onClick={() => handleInsightClick(insight.action)}
                                                            >
                                                                {insight.type === 'alert' && <Bell className="w-3 h-3 text-red-500" />}
                                                                {insight.type === 'statistics' && <ChartBar className="w-3 h-3 text-blue-500" />}
                                                                {insight.type === 'trend' && <ChartBar className="w-3 h-3 text-green-500" />}
                                                                {insight.type === 'suggestion' && <Sparkle className="w-3 h-3 text-purple-500" />}
                                                                {insight.type === 'info' && <Warning className="w-3 h-3 text-amber-500" />}
                                                                <span className="font-medium">{insight.title}</span>
                                                                {insight.value && (
                                                                    <span className="font-bold">{insight.value}</span>
                                                                )}
                                                                {insight.action && <ArrowRight className="w-3 h-3" />}
                                                            </Card>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <Separator />

            {/* Input Area */}
            <div className="p-3 bg-card/50">
                <div className="flex gap-2 items-end">
                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            placeholder="Pergunte sobre processos, prazos, financeiro..."
                            value={input}
                            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT_LENGTH + 100))}
                            onKeyDown={handleKeyDown}
                            disabled={isProcessing || isStreaming}
                            className={cn('pr-16', isOverLimit && 'border-red-500')}
                        />
                        <span className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 text-xs',
                            isOverLimit ? 'text-red-500' : 'text-muted-foreground'
                        )}>
                            {charCount}/{MAX_INPUT_LENGTH}
                        </span>
                    </div>

                    {isStreaming ? (
                        <Button
                            onClick={handleCancel}
                            variant="destructive"
                            size="icon"
                            aria-label="Parar"
                        >
                            <Stop className="w-4 h-4" weight="fill" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isProcessing || isOverLimit}
                            size="icon"
                            aria-label="Enviar"
                        >
                            <PaperPlaneTilt className="w-4 h-4" weight="fill" />
                        </Button>
                    )}
                </div>

                {isStreaming && (
                    <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
                        ✨ Harvey está pensando...
                    </p>
                )}
            </div>
        </div>
    )
}
