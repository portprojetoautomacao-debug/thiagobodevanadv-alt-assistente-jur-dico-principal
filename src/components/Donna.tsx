import { useState, useRef, useEffect } from 'react'
import { useKV } from '@/hooks/use-kv'
import * as spark from '@github/spark/llm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  PaperPlaneTilt,
  ChartBar,
  Briefcase,
  Bell,
  CurrencyCircleDollar,
  Users,
  Calendar,
} from '@phosphor-icons/react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  insights?: Insight[]
}

interface Insight {
  type: 'statistics' | 'alert' | 'trend' | 'suggestion'
  title: string
  value?: string
  description: string
  action?: string
}

const SAMPLE_QUESTIONS = [
  "Mostre a performance da equipe",
  "Quais são as próximas intimações?",
  "Tarefas pendentes por colaborador",
  "Análise financeira do mês",
]

const QUICK_INSIGHTS = [
  {
    icon: ChartBar,
    title: 'Performance',
    description: 'Performance da equipe',
    query: 'Mostre a performance da equipe',
  },
  {
    icon: Briefcase,
    title: 'Processos',
    description: 'Status do acervo',
    query: 'Status dos processos',
  },
  {
    icon: Bell,
    title: 'Prazos',
    description: 'Intimações urgentes',
    query: 'Quais são as próximas intimações?',
  },
  {
    icon: CurrencyCircleDollar,
    title: 'Financeiro',
    description: 'Análise financeira',
    query: 'Análise financeira do mês',
  },
]

export default function HarveySpecter() {
  const [messages, setMessages] = useKV<Message[]>('harvey-messages', [])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getInsights = (query: string): Insight[] => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('equipe')) {
      return [
        {
          type: 'statistics',
          title: 'Tarefas Concluídas',
          value: '40',
          description: 'Total na semana',
        },
        {
          type: 'trend',
          title: 'Melhor Desempenho',
          value: '18',
          description: 'Marcos Oliveira',
        },
        {
          type: 'alert',
          title: 'Atenção Necessária',
          value: '8',
          description: 'João Santos abaixo da meta',
        },
      ]
    }
    
    if (lowerQuery.includes('processo') || lowerQuery.includes('acervo')) {
      return [
        {
          type: 'statistics',
          title: 'Processos Ativos',
          value: '127',
          description: 'Total em andamento',
        },
        {
          type: 'trend',
          title: 'Em Contestação',
          value: '45',
          description: 'Processos aguardando contestação',
        },
        {
          type: 'suggestion',
          title: 'Ação Sugerida',
          description: 'Priorizar 12 processos próximos ao prazo',
        },
      ]
    }
    
    if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo')) {
      return [
        {
          type: 'alert',
          title: 'Prazos Urgentes',
          value: '3',
          description: 'Prazos fatais nas próximas 48h',
        },
        {
          type: 'statistics',
          title: 'Intimações Pendentes',
          value: '18',
          description: 'Total aguardando análise',
        },
      ]
    }
    
    if (lowerQuery.includes('financ') || lowerQuery.includes('receita')) {
      return [
        {
          type: 'statistics',
          title: 'Receita do Mês',
          value: 'R$ 87.450',
          description: 'Total recebido em honorários',
        },
        {
          type: 'trend',
          title: 'Despesas',
          value: 'R$ 34.200',
          description: 'Total de custos operacionais',
        },
        {
          type: 'alert',
          title: 'Inadimplência',
          description: '5 clientes sem cobranças há 60+ dias',
        },
      ]
    }
    
    return [
      {
        type: 'suggestion',
        title: 'Experimente Perguntar',
        description: 'Performance da equipe, Status de processos, Prazos urgentes, ou Análise financeira',
      },
    ]
  }

  const generateResponse = async (userQuery: string): Promise<string> => {
    try {
      const prompt = spark.llmPrompt`Você é Harvey Specter, um assistente jurídico inteligente e estratégico de um escritório de advocacia.

Contexto do escritório:
- 127 processos ativos (45 em contestação, 25 em recurso, 57 aguardando sentença)
- Equipe: Marcos Oliveira (18 tarefas/semana), Maria Silva (14 tarefas/semana), João Santos (8 tarefas/semana)
- 3 prazos urgentes nas próximas 48h
- 18 intimações pendentes de análise
- Receita mensal: R$ 87.450 | Despesas: R$ 34.200 | Margem: 61%
- 5 clientes com inadimplência 60+ dias

Pergunta do usuário: ${userQuery}

Responda de forma profissional, objetiva e com insights estratégicos. Use markdown para formatação e emojis quando apropriado. Seja direto e forneça recomendações acionáveis quando relevante.`

      const response = await Promise.race([
        spark.llm(prompt, 'gpt-4o-mini'),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 25000)
        )
      ])

      return response
    } catch (error) {
      console.error('LLM Error:', error)
      
      const lowerQuery = userQuery.toLowerCase()
      
      if (lowerQuery.includes('performance') || lowerQuery.includes('equipe')) {
        return `**Análise de Performance da Equipe - ${new Date().toLocaleDateString('pt-BR')}**

**Destaques:**
• Marcos Oliveira manteve excelência com 18 tarefas concluídas (vs. média de 12)
• Maria Silva equilibrada com 14 tarefas (dentro da meta)
• João Santos apresentou queda de produtividade (apenas 8 tarefas concluídas)

**Recomendações:**
1. Reconhecer publicamente o desempenho de Marcos
2. Investigar possíveis bloqueios com João Santos
3. Redistribuir carga se necessário`
      }
      
      if (lowerQuery.includes('processo') || lowerQuery.includes('acervo')) {
        return `**Status do Acervo de Processos**

• 127 processos em andamento
• 45 em fase de contestação
• 25 em fase recursal
• 57 aguardando sentença

⚡ **Ações Prioritárias:**
1. 12 processos com prazos críticos (< 7 dias)
2. Revisar 8 processos sem movimentação há 30+ dias`
      }
      
      if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo')) {
        return `**Prazos e Intimações - Visão Geral**

⚠️ **URGENTE - Próximas 48h:**
• Processo 0001234-56.2024.8.02.0001 - Contestação (vence amanhã)
• Processo 0003456-78.2024.8.02.0001 - Recurso (vence em 2 dias)

⚠️ **Próximos 7 dias:**
• 8 audiências agendadas
• 15 prazos para manifestação`
      }
      
      if (lowerQuery.includes('financ') || lowerQuery.includes('receita')) {
        return `**Análise Financeira - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}**

📊 **Receita:**
• Total recebido: R$ 87.450
• Honorários êxito: R$ 18.900
• Honorários contratuais: R$ 68.550

💰 **Despesas:**
• Total: R$ 34.200
• Infraestrutura: R$ 12.800
• Pessoal: R$ 21.400

💎 **Resultado:**
• Lucro líquido: R$ 53.250 (61% margem)

⚠️ **Alertas:**
• 5 clientes com pendências há 60+ dias`
      }
      
      if (lowerQuery.includes('cliente')) {
        return `**Top 5 Clientes por Volume de Processos**

1. XYZ Transportadora - 28 processos ativos
2. ABC Comércio - 15 processos ativos
3. João da Silva - 13 processos ativos
4. DEF Indústria - 12 processos ativos
5. GHI Serviços - 9 processos ativos

**Observações:**
• XYZ Transportadora: Principal cliente, necessita atenção especial
• João da Silva: 90% taxa de sucesso (excelente relacionamento)`
      }
      
      if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente')) {
        return `**Tarefas Pendentes por Colaborador**

**Marcos Oliveira:**
• 5 contestações aguardando redação
• 2 recursos para revisar
• 3 audiências para preparar

**Maria Silva:**
• 4 petições iniciais para elaborar
• 6 intimações para analisar
• 1 acordo para negociar

**João Santos:**
• 3 pesquisas jurídicas pendentes
• 2 pareceres para finalizar
• 4 processos para atualizar`
      }
      
      return `Olá! Sou o Harvey Specter, seu assistente jurídico inteligente. 

Posso ajudar você com:
• Análise de performance da equipe
• Status e gerenciamento de processos
• Monitoramento de prazos e intimações
• Relatórios financeiros
• Gestão de tarefas e colaboradores

O que você gostaria de saber?`
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const query = input.trim()
    setInput('')
    setIsProcessing(true)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }

    try {
      setMessages((currentMessages) => [...(currentMessages || []), userMessage])
      
      const responseContent = await generateResponse(query)
      const insights = getInsights(query)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
        insights: insights,
      }

      setMessages((currentMessages) => [...(currentMessages || []), assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      const isTimeout = error instanceof Error && error.message === 'Timeout'
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: isTimeout 
          ? '⚠️ A requisição demorou mais que o esperado. Gerando resposta com dados locais...\n\nPor favor, tente uma pergunta mais específica ou reformule sua questão.'
          : 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date().toISOString(),
      }
      
      setMessages((currentMessages) => [...(currentMessages || []), errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = async (question: string) => {
    if (isProcessing) return
    setInput(question)
    await new Promise(resolve => setTimeout(resolve, 150))
    await handleSend()
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
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
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
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[80%] space-y-2',
                      message.role === 'user' ? 'items-end' : 'items-start'
                    )}
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
                        {message.content}
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

        <Separator />
        
        <div className="p-4 bg-card">
          <div className="flex gap-2">
            <Input
              placeholder="Pergunte sobre processos, prazos, financeiro, equipe..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              size="icon"
            >
              <PaperPlaneTilt className="w-5 h-5" weight="fill" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
