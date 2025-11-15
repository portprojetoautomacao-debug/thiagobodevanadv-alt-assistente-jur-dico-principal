import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  PaperPlaneTilt,
  Lightbulb,
  Sparkle,
  User as UserIcon,
  Robot,
  ClipboardText,
  ChartBar,
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
    label: 'Performance',
    icon: ChartBar,
    description: 'Performance da equipe',
  },
  {
    label: 'Processos',
    icon: ClipboardText,
    description: 'Status do acervo',
  },
  {
    label: 'Prazos',
    icon: Calendar,
    description: 'Intimações pendentes',
  },
  {
    label: 'Financeiro',
    icon: CurrencyCircleDollar,
    description: 'Análise financeira',
  },
]

export default function HarveySpecter() {
  const [messages, setMessages] = useKV<Message[]>('harvey-specter-chat', [])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const messagesList = messages || []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messagesList])

  const generateInsights = (query: string): Insight[] => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('equipe')) {
      return [
        {
          type: 'statistics',
          title: 'Performance da Equipe',
          value: '92%',
          description: 'Taxa de conclusão de tarefas',
        },
        {
          type: 'alert',
          title: 'Colaborador Destaque',
          value: 'Marcos Oliveira',
          description: '18 tarefas concluídas este mês',
        },
        {
          type: 'trend',
          title: 'Atenção Necessária',
          value: '8',
          description: 'João Santos - queda de produtividade',
        },
      ]
    }
    
    if (lowerQuery.includes('processo') || lowerQuery.includes('acervo')) {
      return [
        {
          type: 'statistics',
          title: 'Total de Processos',
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

💚 **Resultado:**
• Lucro líquido: R$ 53.250 (61% margem)

⚠️ **Alertas:**
• 5 clientes com pendências há 60+ dias`
    }
    
    if (lowerQuery.includes('cliente')) {
      return `**Top 5 Clientes por Volume de Processos**

1. XYZ Transportadora - 28 processos ativos
2. ABC Comércio - 15 processos ativos
3. ABC Comércio - 15 processos ativos
4. DEF Indústria - 12 processos ativos
5. DEF Indústria - 12 processos ativos

📈 **Insights:**
• XYZ Transportadora: Principal cliente, necessita atenção especial
• João da Silva: 90% taxa de sucesso (excelente relacionamento)`
    }
    
    if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente')) {
      return `**Tarefas Pendentes por Colaborador**

**Marcos Oliveira:**
• 12 tarefas pendentes (todas no prazo)
• Próxima: Elaborar contestação - Processo 0001234

**Maria Silva:**
• 8 tarefas pendentes (todas no prazo)
• Próxima: Revisar petição recursal - Processo 0005678

**João Santos:**
• 23 tarefas pendentes (2 atrasadas)
• URGENTE: Finalizar memorial - atrasado 3 dias`
    }
    
    return `Olá! Sou **Harvey Specter**, seu assistente jurídico inteligente. 

Posso ajudá-lo com análises sobre:

📊 **Relatórios e Indicadores**
• Produtividade da equipe
• Métricas de performance individual
• Status do acervo
• Distribuição por fase processual

📅 **Prazos e Intimações**
• Calendário de audiências
• Prazos fatais urgentes
• Intimações pendentes

💰 **Financeiro**
• Receita e despesas
• Inadimplência
• Análise por cliente

🤝 **Clientes**
• Top clientes por volume
• Histórico de relacionamento
• Taxa de sucesso por cliente

Como posso ajudá-lo hoje?`
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }
    
    setMessages((prev) => [...(prev || []), userMessage])
    setInput('')
    setIsProcessing(true)

    setTimeout(async () => {
      const responseText = await generateResponse(input)
      const insights = generateInsights(input)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        insights,
      }
      
      setMessages((prev) => [...(prev || []), assistantMessage])
      setIsProcessing(false)
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearHistory = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Robot className="w-8 h-8 text-primary" weight="fill" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Harvey Specter</h1>
              <p className="text-sm text-muted-foreground">
                Assistente IA Jurídico - Análise Inteligente
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearHistory}>
            Limpar Histórico
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="inline w-4 h-4 text-amber-500" weight="fill" />
            <span className="text-sm font-medium text-foreground">Análises Rápidas</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {QUICK_INSIGHTS.map((insight) => {
              const Icon = insight.icon
              return (
                <Button
                  key={insight.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => setInput(insight.description)}
                >
                  <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-medium">{insight.label}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messagesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
            <Sparkle className="w-16 h-16 text-primary/50" weight="fill" />
            <h3 className="text-lg font-semibold text-foreground">
              Olá! Sou Harvey Specter
            </h3>
            <p className="text-sm text-muted-foreground">
              Seu assistente jurídico inteligente. Faça uma pergunta ou escolha uma das sugestões abaixo:
            </p>
            <div className="flex flex-col gap-2 w-full mt-4">
              {SAMPLE_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => setInput(question)}
                >
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messagesList.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-4',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Robot className="w-5 h-5 text-primary" weight="fill" />
                  </div>
                )}
                
                <div className={cn(
                  'flex flex-col gap-2 max-w-[80%]',
                  message.role === 'user' && 'items-end'
                )}>
                  <div
                    className={cn(
                      'rounded-lg px-4 py-3 whitespace-pre-wrap',
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-card border border-border'
                    )}
                  >
                    {message.content}
                  </div>
                  
                  {message.insights && message.insights.length > 0 && (
                    <div className="grid gap-2 w-full mt-2">
                      {message.insights.map((insight, idx) => (
                        <Card key={idx} className="p-3 bg-muted/30">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  'text-xs font-semibold uppercase tracking-wide',
                                  insight.type === 'alert' && 'text-destructive',
                                  insight.type === 'statistics' && 'text-primary',
                                  insight.type === 'trend' && 'text-blue-600',
                                  insight.type === 'suggestion' && 'text-amber-600'
                                )}>
                                  {insight.type}
                                </span>
                              </div>
                              <p className="font-semibold text-sm text-foreground">
                                {insight.title}
                                {insight.value && (
                                  <span className="ml-2 text-primary">{insight.value}</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                            </div>
                            {insight.action && (
                              <Button variant="ghost" size="sm" className="flex-shrink-0">
                                {insight.action}
                              </Button>
                            )}
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

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-5 h-5 text-secondary-foreground" weight="fill" />
                  </div>
                )}
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Robot className="w-5 h-5 text-primary" weight="fill" />
                </div>
                <div className="flex gap-1 items-center bg-card border border-border rounded-lg px-4 py-3">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
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
  )
}
