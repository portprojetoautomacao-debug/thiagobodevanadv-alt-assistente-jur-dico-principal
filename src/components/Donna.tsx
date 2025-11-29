import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useKV } from '@/hooks/use-kv'
import { useAIStreaming } from '@/hooks/use-ai-streaming'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
} from '@phosphor-icons/react'
import type { Process, FinancialEntry } from '@/types'

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
  action?: string
}

// AgentTask - estrutura usada pelo sistema de agentes autônomos
interface AgentTask {
  id: string
  agentId: string
  type: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  description: string
  createdAt: string
  completedAt?: string
  result?: string
}

const SAMPLE_QUESTIONS = [
  "Status dos meus processos",
  "Quais são os prazos urgentes?",
  "Resumo financeiro",
  "O que posso fazer?",
]

const QUICK_INSIGHTS = [
  {
    icon: ChartBar,
    title: 'Processos',
    description: 'Ver meus processos',
    query: 'Status dos meus processos',
  },
  {
    icon: Bell,
    title: 'Prazos',
    description: 'Prazos urgentes',
    query: 'Quais são os prazos urgentes?',
  },
  {
    icon: CurrencyCircleDollar,
    title: 'Financeiro',
    description: 'Resumo financeiro',
    query: 'Resumo financeiro',
  },
  {
    icon: Briefcase,
    title: 'Ajuda',
    description: 'O que posso fazer',
    query: 'O que você pode fazer?',
  },
]

export default function HarveySpecter() {
  const [messages, setMessages] = useKV<Message[]>('harvey-messages', [])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Hook de streaming de IA
  const {
    streamingContent,
    isStreaming,
    streamChat,
    cancelStream,
    reset: resetStreaming
  } = useAIStreaming({
    onChunk: () => {
      // Scroll para baixo a cada chunk
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    },
    onComplete: (fullContent, provider) => {
      console.log(`[Harvey] Streaming completo via ${provider}`)
    },
    onError: (error) => {
      console.error('[Harvey] Erro no streaming:', error)
      toast.error('Erro ao processar resposta')
    }
  })

  // Buscar dados REAIS do KV storage (usando as MESMAS chaves dos outros componentes)
  const [processes] = useKV<Process[]>('processes', [])
  const [financialRecords] = useKV<FinancialEntry[]>('financialEntries', [])  // CORRIGIDO: era 'financial-records'
  const [taskQueue] = useKV<AgentTask[]>('agent-task-queue', [])  // CORRIGIDO: era 'tasks'
  const [completedTasks] = useKV<AgentTask[]>('completed-agent-tasks', [])

  // Calcular estatísticas REAIS
  const realStats = useMemo(() => {
    const now = new Date()
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Processos
    const totalProcesses = processes?.length || 0
    const processesByStatus = {
      'Em Andamento': processes?.filter(p => p.status === 'ativo').length || 0,
      'Aguardando': processes?.filter(p => p.status === 'suspenso').length || 0,
      'Concluído': processes?.filter(p => p.status === 'concluido').length || 0,
      'Arquivado': processes?.filter(p => p.status === 'arquivado').length || 0,
    }

    // Prazos urgentes (próximas 48h) - baseado nos prazos dos processos
    const urgentDeadlines = processes?.reduce((count, p) => {
      const urgentPrazos = p.prazos?.filter(prazo => {
        if (prazo.concluido) return false
        const deadline = new Date(prazo.dataFinal)
        return deadline <= in48h && deadline >= now
      }).length || 0
      return count + urgentPrazos
    }, 0) || 0

    // Prazos próximos (7 dias)
    const upcomingDeadlines = processes?.reduce((count, p) => {
      const upcomingPrazos = p.prazos?.filter(prazo => {
        if (prazo.concluido) return false
        const deadline = new Date(prazo.dataFinal)
        return deadline <= in7days && deadline >= now
      }).length || 0
      return count + upcomingPrazos
    }, 0) || 0

    // Financeiro - CORRIGIDO: usar 'income'/'expense' (tipo real do FinancialEntry)
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthlyRecords = financialRecords?.filter(r => {
      const date = new Date(r.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    }) || []

    const receita = monthlyRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0)
    const despesas = monthlyRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0)
    const margem = receita > 0 ? ((receita - despesas) / receita * 100).toFixed(1) : '0'

    // Tarefas dos Agentes - CORRIGIDO: usar taskQueue e completedTasks
    const pendingTasks = taskQueue?.filter(t => t.status === 'pending').length || 0
    const inProgressTasks = taskQueue?.filter(t => t.status === 'in_progress').length || 0
    const totalCompletedTasks = completedTasks?.length || 0

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
      totalCompletedTasks,
      hasData: totalProcesses > 0 || financialRecords?.length > 0 || taskQueue?.length > 0 || completedTasks?.length > 0,
    }
  }, [processes, financialRecords, taskQueue, completedTasks])

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  const getInsights = (query: string): Insight[] => {
    const lowerQuery = query.toLowerCase()

    // Aviso se não há dados
    if (!realStats.hasData) {
      return [
        {
          type: 'info',
          title: 'Sem Dados Cadastrados',
          description: 'Cadastre processos, financeiro ou tarefas para ver estatísticas reais.',
        },
      ]
    }

    if (lowerQuery.includes('processo') || lowerQuery.includes('acervo') || lowerQuery.includes('status')) {
      const insights: Insight[] = [
        {
          type: 'statistics',
          title: 'Processos Ativos',
          value: String(realStats.totalProcesses),
          description: 'Total cadastrado no sistema',
        },
      ]

      if (realStats.processesByStatus['Em Andamento'] > 0) {
        insights.push({
          type: 'trend',
          title: 'Em Andamento',
          value: String(realStats.processesByStatus['Em Andamento']),
          description: 'Processos ativos',
        })
      }

      if (realStats.urgentDeadlines > 0) {
        insights.push({
          type: 'alert',
          title: 'Prazos Urgentes',
          value: String(realStats.urgentDeadlines),
          description: 'Nas próximas 48h',
        })
      }

      return insights
    }

    if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo') || lowerQuery.includes('urgent')) {
      return [
        {
          type: 'alert',
          title: 'Prazos Urgentes',
          value: String(realStats.urgentDeadlines),
          description: 'Nas próximas 48h',
        },
        {
          type: 'statistics',
          title: 'Próximos 7 dias',
          value: String(realStats.upcomingDeadlines),
          description: 'Total de prazos',
        },
      ]
    }

    if (lowerQuery.includes('financ') || lowerQuery.includes('receita') || lowerQuery.includes('despesa')) {
      return [
        {
          type: 'statistics',
          title: 'Receita do Mês',
          value: `R$ ${realStats.receita.toLocaleString('pt-BR')}`,
          description: 'Total recebido',
        },
        {
          type: 'trend',
          title: 'Despesas',
          value: `R$ ${realStats.despesas.toLocaleString('pt-BR')}`,
          description: 'Total de custos',
        },
        {
          type: 'statistics',
          title: 'Margem',
          value: `${realStats.margem}%`,
          description: 'Lucro líquido',
        },
      ]
    }

    if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente') || lowerQuery.includes('equipe')) {
      return [
        {
          type: 'statistics',
          title: 'Tarefas Pendentes',
          value: String(realStats.pendingTasks),
          description: 'Aguardando execução',
        },
        {
          type: 'trend',
          title: 'Em Progresso',
          value: String(realStats.inProgressTasks),
          description: 'Sendo executadas',
        },
      ]
    }

    return [
      {
        type: 'suggestion',
        title: 'Experimente Perguntar',
        description: 'Status dos processos, Prazos urgentes, Resumo financeiro, ou Tarefas pendentes',
      },
    ]
  }

  // Unused function
  // const generateResponse = async (userQuery: string): Promise<string> => {
  //   try {
  //     // Construir contexto com dados REAIS
  //     const contextData = realStats.hasData
  //       ? `Contexto REAL do escritório (dados do sistema):
  // - ${realStats.totalProcesses} processos cadastrados
  //   - Em Andamento: ${realStats.processesByStatus['Em Andamento']}
  //   - Aguardando: ${realStats.processesByStatus['Aguardando']}
  //   - Concluídos: ${realStats.processesByStatus['Concluído']}
  //   - Arquivados: ${realStats.processesByStatus['Arquivado']}
  // - ${realStats.urgentDeadlines} prazos urgentes (próximas 48h)
  // - ${realStats.upcomingDeadlines} prazos nos próximos 7 dias
  // - Receita do mês: R$ ${realStats.receita.toLocaleString('pt-BR')}
  // - Despesas do mês: R$ ${realStats.despesas.toLocaleString('pt-BR')}
  // - Margem: ${realStats.margem}%
  // - ${realStats.pendingTasks} tarefas pendentes
  // - ${realStats.inProgressTasks} tarefas em progresso`
  //       : `Contexto: O sistema ainda não possui dados cadastrados. O usuário precisa cadastrar processos, registros financeiros e tarefas para ter informações reais.`

  //     const systemPrompt = `Você é Harvey Specter, um assistente jurídico inteligente e estratégico de um escritório de advocacia.

  // ${contextData}

  // IMPORTANTE: 
  // - Use APENAS os dados fornecidos acima. NÃO invente dados.
  // - Se não houver dados, informe que o usuário precisa cadastrar informações.
  // - Seja honesto sobre a situação real do sistema.
  // - Responda de forma profissional, objetiva e com insights estratégicos baseados nos dados REAIS.
  // - Use markdown para formatação. Seja direto e forneça recomendações acionáveis quando relevante.`

  //     // Chamada via fetch para /_spark/llm (proxy para Gemini/OpenAI)
  //     const controller = new AbortController()
  //     const timeout = setTimeout(() => controller.abort(), 25000)

  //     try {
  //       const response = await fetch('/_spark/llm', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({
  //           model: 'gpt-4o-mini',
  //           messages: [
  //             { role: 'system', content: systemPrompt },
  //             { role: 'user', content: userQuery }
  //           ],
  //           temperature: 0.7,
  //           max_tokens: 2000
  //         }),
  //         signal: controller.signal
  //       })

  //       clearTimeout(timeout)

  //       if (!response.ok) {
  //         throw new Error(`LLM API error: ${response.status}`)
  //       }

  //       const data = await response.json()
  //       const content = data.choices?.[0]?.message?.content

  //       if (!content) {
  //         throw new Error('Empty response from LLM')
  //       }

  //       return content
  //     } finally {
  //       clearTimeout(timeout)
  //     }
  //   } catch (error) {
  //     console.error('LLM Error:', error)      // Fallback com dados REAIS
  //     const lowerQuery = userQuery.toLowerCase()

  //     if (!realStats.hasData) {
  //       return `**Sistema sem dados cadastrados**

  // Ainda não há processos, registros financeiros ou tarefas cadastrados no sistema.

  // **Para começar:**
  // 1. Acesse **Acervo (CRM)** para cadastrar processos
  // 2. Use **Financeiro** para registrar receitas e despesas
  // 3. Gerencie tarefas em **Expedientes**

  // Assim que houver dados, poderei fornecer análises e insights reais sobre seu escritório.`
  //     }

  //     if (lowerQuery.includes('processo') || lowerQuery.includes('acervo') || lowerQuery.includes('status')) {
  //       return `**Status dos Processos**

  // 📊 **Total cadastrado:** ${realStats.totalProcesses} processos

  // **Por status:**
  // • Em Andamento: ${realStats.processesByStatus['Em Andamento']}
  // • Aguardando: ${realStats.processesByStatus['Aguardando']}
  // • Concluídos: ${realStats.processesByStatus['Concluído']}
  // • Arquivados: ${realStats.processesByStatus['Arquivado']}

  // ${realStats.urgentDeadlines > 0 ? `⚠️ **Atenção:** ${realStats.urgentDeadlines} processo(s) com prazo nas próximas 48h` : '✅ Nenhum prazo urgente nas próximas 48h'}`
  //     }

  //     if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo') || lowerQuery.includes('urgent')) {
  //       return `**Prazos e Deadlines**

  // ${realStats.urgentDeadlines > 0
  //           ? `⚠️ **URGENTE:** ${realStats.urgentDeadlines} prazo(s) nas próximas 48h`
  //           : '✅ Nenhum prazo urgente nas próximas 48h'}

  // 📅 **Próximos 7 dias:** ${realStats.upcomingDeadlines} prazo(s)

  // ${realStats.urgentDeadlines > 0
  //           ? '**Recomendação:** Acesse o CRM para verificar os processos com prazos urgentes.'
  //           : 'Situação tranquila em relação a prazos.'}`
  //     }

  //     if (lowerQuery.includes('financ') || lowerQuery.includes('receita') || lowerQuery.includes('despesa')) {
  //       const lucro = realStats.receita - realStats.despesas
  //       return `**Resumo Financeiro - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}**

  // 📊 **Receita:** R$ ${realStats.receita.toLocaleString('pt-BR')}
  // 💰 **Despesas:** R$ ${realStats.despesas.toLocaleString('pt-BR')}
  // 💎 **Lucro:** R$ ${lucro.toLocaleString('pt-BR')} (${realStats.margem}% margem)

  // ${realStats.receita === 0 && realStats.despesas === 0
  //           ? '⚠️ Nenhum registro financeiro neste mês. Cadastre receitas e despesas em **Financeiro**.'
  //           : lucro > 0 ? '✅ Resultado positivo no mês.' : '⚠️ Despesas maiores que receitas.'}`
  //     }

  //     if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente') || lowerQuery.includes('equipe')) {
  //       return `**Tarefas**

  // 📋 **Pendentes:** ${realStats.pendingTasks}
  // 🔄 **Em progresso:** ${realStats.inProgressTasks}

  // ${realStats.pendingTasks + realStats.inProgressTasks === 0
  //           ? 'Nenhuma tarefa cadastrada. Use **Expedientes** para gerenciar tarefas.'
  //           : 'Acesse **Expedientes** para gerenciar suas tarefas.'}`
  //     }

  //     if (lowerQuery.includes('ajuda') || lowerQuery.includes('fazer') || lowerQuery.includes('oi') || lowerQuery.includes('olá')) {
  //       return `Olá! Sou o Harvey Specter, seu assistente jurídico. 

  // **Posso ajudar com:**
  // • Status dos seus processos cadastrados
  // • Alertas de prazos urgentes
  // • Resumo financeiro do mês
  // • Visão geral de tarefas

  // **Dica:** Quanto mais dados você cadastrar no sistema, mais úteis serão minhas análises!

  // O que você gostaria de saber?`
  //     }

  //     return `Olá! Sou o Harvey Specter, seu assistente jurídico.

  // **Seu escritório agora:**
  // • ${realStats.totalProcesses} processos cadastrados
  // • ${realStats.urgentDeadlines} prazos urgentes
  // • Receita do mês: R$ ${realStats.receita.toLocaleString('pt-BR')}

  // Como posso ajudar?`
  //   }
  // }

  // Constrói o system prompt com contexto real
  const buildSystemPrompt = useCallback(() => {
    const contextData = realStats.hasData
      ? `Contexto REAL do escritório (dados do sistema):
- ${realStats.totalProcesses} processos cadastrados
  - Em Andamento: ${realStats.processesByStatus['Em Andamento']}
  - Aguardando: ${realStats.processesByStatus['Aguardando']}
  - Concluídos: ${realStats.processesByStatus['Concluído']}
  - Arquivados: ${realStats.processesByStatus['Arquivado']}
- ${realStats.urgentDeadlines} prazos urgentes (próximas 48h)
- ${realStats.upcomingDeadlines} prazos nos próximos 7 dias
- Receita do mês: R$ ${realStats.receita.toLocaleString('pt-BR')}
- Despesas do mês: R$ ${realStats.despesas.toLocaleString('pt-BR')}
- Margem: ${realStats.margem}%
- ${realStats.pendingTasks} tarefas pendentes
- ${realStats.inProgressTasks} tarefas em progresso`
      : `Contexto: O sistema ainda não possui dados cadastrados.`

    return `Você é Harvey Specter, um assistente jurídico inteligente e estratégico.

${contextData}

IMPORTANTE:
- Use APENAS os dados fornecidos acima. NÃO invente dados.
- Seja honesto sobre a situação real do sistema.
- Responda de forma profissional e objetiva.
- Use markdown para formatação.`
  }, [realStats])

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isStreaming) return

    const query = input.trim()
    setInput('')
    setIsProcessing(true)
    resetStreaming()

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }

    // Adiciona mensagem do usuário
    setMessages((currentMessages) => [...(currentMessages || []), userMessage])

    // Cria mensagem do assistente para streaming
    const assistantId = `assistant-${Date.now()}`
    setStreamingMessageId(assistantId)

    const streamingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '', // Será preenchido pelo streaming
      timestamp: new Date().toISOString(),
      insights: getInsights(query),
    }

    setMessages((currentMessages) => [...(currentMessages || []), streamingMessage])

    try {
      const systemPrompt = buildSystemPrompt()

      const finalContent = await streamChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ])

      // Atualiza a mensagem com o conteúdo final
      setMessages((currentMessages) =>
        (currentMessages || []).map(msg =>
          msg.id === assistantId
            ? { ...msg, content: finalContent }
            : msg
        )
      )

    } catch (error) {
      console.error('Error sending message:', error)

      // Atualiza com mensagem de erro
      setMessages((currentMessages) =>
        (currentMessages || []).map(msg =>
          msg.id === assistantId
            ? { ...msg, content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.' }
            : msg
        )
      )
      toast.error('Erro ao processar mensagem')
    } finally {
      setIsProcessing(false)
      setStreamingMessageId(null)
    }
  }

  // Cancelar streaming
  const handleCancelStream = useCallback(() => {
    cancelStream()
    setIsProcessing(false)

    if (streamingMessageId) {
      // Mantém o conteúdo parcial já recebido
      setMessages((currentMessages) =>
        (currentMessages || []).map(msg =>
          msg.id === streamingMessageId
            ? { ...msg, content: streamingContent + '\n\n*[Resposta interrompida]*' }
            : msg
        )
      )
      setStreamingMessageId(null)
    }
  }, [cancelStream, streamingMessageId, streamingContent, setMessages])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = async (question: string) => {
    if (isProcessing || isStreaming) return

    setIsProcessing(true)
    resetStreaming()

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    }

    setMessages((currentMessages) => [...(currentMessages || []), userMessage])

    // Cria mensagem do assistente para streaming
    const assistantId = `assistant-${Date.now()}`
    setStreamingMessageId(assistantId)

    const streamingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      insights: getInsights(question),
    }

    setMessages((currentMessages) => [...(currentMessages || []), streamingMessage])

    try {
      const systemPrompt = buildSystemPrompt()

      const finalContent = await streamChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ])

      setMessages((currentMessages) =>
        (currentMessages || []).map(msg =>
          msg.id === assistantId
            ? { ...msg, content: finalContent }
            : msg
        )
      )

    } catch (error) {
      console.error('Error sending message:', error)

      setMessages((currentMessages) =>
        (currentMessages || []).map(msg =>
          msg.id === assistantId
            ? { ...msg, content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }
            : msg
        )
      )
      toast.error('Erro ao processar mensagem')
    } finally {
      setIsProcessing(false)
      setStreamingMessageId(null)
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'statistics':
        return <ChartBar className="w-5 h-5" weight="fill" />
      case 'alert':
        return <Bell className="w-5 h-5" weight="fill" />
      case 'trend':
        return <ChartBar className="w-5 h-5" weight="fill" />
      case 'suggestion':
        return <Briefcase className="w-5 h-5" weight="fill" />
      case 'info':
        return <Warning className="w-5 h-5" weight="fill" />
      default:
        return <ChartBar className="w-5 h-5" weight="fill" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'statistics':
        return 'text-primary bg-primary/10'
      case 'alert':
        return 'text-destructive bg-destructive/10'
      case 'trend':
        return 'text-accent bg-accent/10'
      case 'suggestion':
        return 'text-secondary bg-secondary/10'
      case 'info':
        return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
      default:
        return 'text-primary bg-primary/10'
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Harvey Specter</h1>
            <p className="text-sm text-muted-foreground">Seu assistente jurídico inteligente</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMessages([])}
          >
            Limpar Conversa
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden" ref={scrollRef}>
          <ScrollArea className="h-full px-6 py-4">
            {!messages || messages.length === 0 ? (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Bem-vindo ao Harvey Specter
                  </h2>
                  <p className="text-muted-foreground">
                    Seu assistente jurídico inteligente para gestão completa do escritório
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {QUICK_INSIGHTS.map((insight, index) => {
                    const Icon = insight.icon
                    return (
                      <Card
                        key={index}
                        className="p-4 hover:bg-accent/5 cursor-pointer transition-colors"
                        onClick={() => handleQuickQuestion(insight.query)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" weight="fill" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{insight.title}</h3>
                            <p className="text-sm text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Perguntas Sugeridas:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_QUESTIONS.map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickQuestion(question)}
                        className="text-sm"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {(messages || []).map((message) => (
                  <div
                    key={message.id}
                  >
                    <Card
                      className={cn(
                        'p-4',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card'
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {/* Mostra streaming content se esta é a mensagem sendo streamada */}
                        {message.id === streamingMessageId && isStreaming
                          ? (streamingContent || '▋')
                          : message.content || (message.id === streamingMessageId ? '▋' : '')}
                        {/* Cursor piscante durante streaming */}
                        {message.id === streamingMessageId && isStreaming && (
                          <span className="animate-pulse">▋</span>
                        )}
                      </div>
                    </Card>

                    {message.insights && message.insights.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                        {message.insights.map((insight, idx) => (
                          <Card
                            key={idx}
                            className="p-3 bg-card border"
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn('p-1.5 rounded-md', getInsightColor(insight.type))}>
                                {getInsightIcon(insight.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <h4 className="text-xs font-semibold text-foreground">
                                    {insight.title}
                                  </h4>
                                  {insight.value && (
                                    <span className="text-sm font-bold text-foreground">
                                      {insight.value}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    <span className="text-xs text-muted-foreground px-2">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}

                {isProcessing && (
                  <div className="flex gap-3">
                    <Card className="p-4 bg-card">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator />

        <div className="p-4 bg-card">
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte sobre processos, prazos, financeiro, equipe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing || isStreaming}
              className="flex-1"
            />
            {isStreaming ? (
              <Button
                onClick={handleCancelStream}
                variant="destructive"
                size="icon"
                aria-label="Parar resposta"
                title="Parar resposta"
              >
                <Stop className="w-5 h-5" weight="fill" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                size="icon"
                aria-label="Enviar mensagem"
              >
                <PaperPlaneTilt className="w-5 h-5" weight="fill" />
              </Button>
            )}
          </div>
          {isStreaming && (
            <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
              🤖 Harvey está pensando...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
