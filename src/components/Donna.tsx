import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkle, 
  PaperPlaneRight, 
  Robot, 
  User as UserIcon,
  ChartBar,
  FileText,
  Calendar,
  CurrencyDollar,
  Lightbulb,
  ClipboardText,
  CheckCircle,
  Warning
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  insights?: Insight[]
}

interface Insight {
  type: 'statistic' | 'alert' | 'suggestion' | 'trend'
  title: string
  description: string
  value?: string | number
  action?: string
}

const SAMPLE_QUESTIONS = [
  "Mostre a performance da equipe neste mês",
  "Quantos processos estão em andamento?",
  "Quais são as próximas intimações?",
  "Análise financeira do trimestre",
  "Tarefas pendentes por colaborador",
  "Clientes com maior volume processual"
]

const QUICK_INSIGHTS = [
  {
    icon: ChartBar,
    label: 'Relatórios',
    description: 'Performance e indicadores'
  },
  {
    icon: FileText,
    label: 'Processos',
    description: 'Status e andamentos'
  },
  {
    icon: Calendar,
    label: 'Prazos',
    description: 'Intimações e deadlines'
  },
  {
    icon: CurrencyDollar,
    label: 'Financeiro',
    description: 'Receitas e despesas'
  }
]

export default function Donna() {
  const [messages, setMessages] = useKV<Message[]>('donna-chat-history', [])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chatMessages = messages || []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const generateInsights = async (query: string): Promise<Insight[]> => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('equipe')) {
      return [
        {
          type: 'statistic',
          title: 'Performance da Equipe',
          description: 'Comparativo mensal de produtividade',
          value: '+23%'
        },
        {
          type: 'trend',
          title: 'Colaborador Destaque',
          description: 'Ana Silva: 45 processos finalizados neste mês',
          value: '45'
        },
        {
          type: 'alert',
          title: 'Atenção',
          description: 'João Santos: apenas 8 tarefas concluídas (abaixo da média)',
          value: '8'
        }
      ]
    }
    
    if (lowerQuery.includes('processo') || lowerQuery.includes('andamento')) {
      return [
        {
          type: 'statistic',
          title: 'Processos Ativos',
          description: 'Total em andamento',
          value: '127'
        },
        {
          type: 'trend',
          title: 'Novos este mês',
          description: 'Crescimento de 15% vs mês anterior',
          value: '+15%'
        },
        {
          type: 'suggestion',
          title: 'Sugestão',
          description: '12 processos aguardando distribuição há mais de 5 dias',
          action: 'Revisar Acervo'
        }
      ]
    }

    if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo')) {
      return [
        {
          type: 'alert',
          title: 'Prazos Críticos',
          description: '3 intimações vencem em 48 horas',
          value: '3'
        },
        {
          type: 'statistic',
          title: 'Intimações Pendentes',
          description: 'Aguardando manifestação',
          value: '18'
        }
      ]
    }

    if (lowerQuery.includes('financ') || lowerQuery.includes('receita') || lowerQuery.includes('despesa')) {
      return [
        {
          type: 'statistic',
          title: 'Receita Mensal',
          description: 'Total recebido em março',
          value: 'R$ 87.450'
        },
        {
          type: 'trend',
          title: 'Crescimento',
          description: 'vs mês anterior',
          value: '+12%'
        },
        {
          type: 'suggestion',
          title: 'Oportunidade',
          description: '5 clientes sem cobranças há 60+ dias',
          action: 'Revisar Financeiro'
        }
      ]
    }

    return [
      {
        type: 'suggestion',
        title: 'Análise Disponível',
        description: 'Posso gerar relatórios detalhados sobre qualquer área',
        action: 'Ver exemplos'
      }
    ]
  }

  const generateResponse = async (userQuery: string): Promise<string> => {
    const lowerQuery = userQuery.toLowerCase()
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('equipe')) {
      return `Analisando a performance da equipe em março de 2024:

**Destaques Positivos:**
• Ana Silva liderou com 45 processos finalizados (+23% vs fevereiro)
• Marcos Oliveira manteve média consistente: 38 processos
• Taxa geral de conclusão aumentou 18% neste trimestre

**Pontos de Atenção:**
• João Santos apresentou queda de produtividade (apenas 8 tarefas concluídas)
• 3 colaboradores com atrasos recorrentes em prazos

**Recomendação:** Realizar reunião individual com colaboradores abaixo da média para identificar possíveis bloqueios ou necessidades de suporte.`
    }

    if (lowerQuery.includes('processo') || lowerQuery.includes('andamento')) {
      return `**Status do Acervo Processual:**

📊 **Visão Geral:**
• 127 processos em andamento
• 23 aguardando distribuição (12 há mais de 5 dias)
• 45 em fase de contestação
• 34 aguardando sentença
• 25 em fase recursal

⚡ **Ações Prioritárias:**
1. Distribuir 12 processos parados há 5+ dias
2. Revisar 7 processos sem movimentação há 30 dias
3. Preparar 5 recursos com prazo em 15 dias

🎯 **Meta do Mês:** Reduzir processos aguardando distribuição em 50%.`
    }

    if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo')) {
      return `**Intimações e Prazos - Situação Atual:**

🚨 **CRÍTICO (48h):**
• Processo 0001234-56.2024.8.13.0024 - Contestação vence em 2 dias
• Processo 0007890-12.2024.8.13.0145 - Recurso vence em 1 dia
• Processo 0003456-78.2024.8.13.0067 - Manifestação vence em 1 dia

⚠️ **Próximos 7 dias:**
• 15 intimações aguardando manifestação
• 8 audiências agendadas
• 4 recursos a preparar

✅ **Sugestão:** Priorizar as 3 intimações críticas hoje. Equipe de suporte pode auxiliar na preparação de minutas.`
    }

    if (lowerQuery.includes('financ') || lowerQuery.includes('receita') || lowerQuery.includes('despesa')) {
      return `**Análise Financeira - Março 2024:**

💰 **Receitas:**
• Total recebido: R$ 87.450
• Honorários contratuais: R$ 62.300
• Honorários êxito: R$ 18.900
• Consultorias: R$ 6.250

📉 **Despesas:**
• Total: R$ 34.200
• Salários/Encargos: R$ 28.500
• Infraestrutura: R$ 3.800
• Marketing: R$ 1.900

📊 **Resultado:**
• Lucro líquido: R$ 53.250 (+12% vs fevereiro)
• Margem: 61%

⚠️ **Alertas:**
• 5 clientes com pendências há 60+ dias (R$ 12.400)
• Recomendação: emitir cobranças amigáveis esta semana`
    }

    if (lowerQuery.includes('cliente') || lowerQuery.includes('volume')) {
      return `**Clientes - Volume Processual:**

🏆 **Top 5 Clientes (por volume):**
1. Empresa XYZ Ltda - 23 processos ativos
2. João da Silva - 18 processos ativos
3. ABC Comércio - 15 processos ativos
4. Maria Santos - 12 processos ativos
5. DEF Indústria - 11 processos ativos

📈 **Insights:**
• Empresa XYZ: 70% dos processos em fase recursal (alta complexidade)
• João da Silva: 90% taxa de êxito histórica
• ABC Comércio: cliente desde 2019, relacionamento estável

💡 **Oportunidade:** 8 clientes inativos há 6+ meses podem ser reengajados com campanha de relacionamento.`
    }

    if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente')) {
      return `**Tarefas Pendentes por Colaborador:**

👤 **Ana Silva:**
• 12 tarefas pendentes (3 vencidas)
• Carga: moderada

👤 **Marcos Oliveira:**
• 8 tarefas pendentes (todas no prazo)
• Carga: ideal

👤 **João Santos:**
• 23 tarefas pendentes (15 vencidas) ⚠️
• Carga: crítica - necessita suporte urgente

**Recomendação:** Redistribuir 10 tarefas de João Santos para equipe disponível. Priorizar tarefas vencidas para evitar impacto em prazos processuais.`
    }

    return `Entendi sua pergunta: "${userQuery}".

Posso ajudá-lo com análises sobre:

📊 **Relatórios e Indicadores**
• Performance da equipe
• Produtividade mensal/trimestral
• Comparativos históricos

⚖️ **Processos**
• Status do acervo
• Andamentos processuais
• Distribuição por fase

📅 **Prazos e Intimações**
• Intimações críticas
• Calendário de audiências
• Alertas de vencimento

💰 **Financeiro**
• Receitas e despesas
• Análise de lucratividade
• Inadimplência

🤝 **Clientes**
• Volume processual
• Histórico de relacionamento
• Oportunidades

Digite uma pergunta específica ou clique em uma das sugestões rápidas.`
  }

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...(prev || []), userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const insights = await generateInsights(input)
      const responseText = await generateResponse(input)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        insights
      }

      setMessages(prev => [...(prev || []), assistantMessage])
    } catch (error) {
      toast.error('Erro ao processar sua pergunta')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInput(question)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const clearHistory = () => {
    setMessages([])
    toast.success('Histórico de conversas limpo')
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkle className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Donn@</h1>
              <p className="text-sm text-muted-foreground">
                Assistente Jurídica Inteligente
              </p>
            </div>
          </div>
          {chatMessages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              Limpar Histórico
            </Button>
          )}
        </div>

        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
          <p className="text-sm text-foreground mb-3">
            <Lightbulb className="inline w-4 h-4 mr-1 text-accent" weight="fill" />
            Mais do que responder perguntas, analiso dados em tempo real e apresento insights estratégicos.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_INSIGHTS.map((insight) => {
              const Icon = insight.icon
              return (
                <div
                  key={insight.label}
                  className="p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors cursor-pointer"
                  onClick={() => handleQuickQuestion(`Mostre ${insight.label.toLowerCase()}`)}
                >
                  <Icon className="w-5 h-5 text-primary mb-1" weight="duotone" />
                  <div className="text-xs font-medium text-foreground">{insight.label}</div>
                  <div className="text-xs text-muted-foreground">{insight.description}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Robot className="w-16 h-16 text-muted-foreground mb-4" weight="duotone" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Como posso ajudar hoje?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Pergunte sobre relatórios, processos, prazos, finanças, clientes ou tarefas. 
              Vou transformar seus dados em insights claros.
            </p>
            <div className="grid gap-2 w-full max-w-lg">
              {SAMPLE_QUESTIONS.map((question) => (
                <Button
                  key={question}
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => handleQuickQuestion(question)}
                >
                  <Sparkle className="w-4 h-4 mr-2 flex-shrink-0" weight="duotone" />
                  <span className="text-sm">{question}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-4",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Sparkle className="w-4 h-4 text-white" weight="fill" />
                  </div>
                )}

                <div className={cn(
                  "max-w-2xl",
                  message.role === 'user' ? 'flex flex-col items-end' : 'flex-1'
                )}>
                  <div
                    className={cn(
                      "rounded-lg p-4",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {message.insights && message.insights.length > 0 && (
                    <div className="mt-3 space-y-2 w-full">
                      {message.insights.map((insight, idx) => (
                        <Card key={idx} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                              insight.type === 'statistic' && 'bg-blue-500/10',
                              insight.type === 'alert' && 'bg-red-500/10',
                              insight.type === 'suggestion' && 'bg-green-500/10',
                              insight.type === 'trend' && 'bg-purple-500/10'
                            )}>
                              {insight.type === 'statistic' && (
                                <ChartBar className="w-4 h-4 text-blue-500" weight="duotone" />
                              )}
                              {insight.type === 'alert' && (
                                <Warning className="w-4 h-4 text-red-500" weight="duotone" />
                              )}
                              {insight.type === 'suggestion' && (
                                <CheckCircle className="w-4 h-4 text-green-500" weight="duotone" />
                              )}
                              {insight.type === 'trend' && (
                                <Sparkle className="w-4 h-4 text-purple-500" weight="duotone" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm text-foreground">
                                  {insight.title}
                                </h4>
                                {insight.value && (
                                  <Badge variant="secondary">{insight.value}</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                              {insight.action && (
                                <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                                  {insight.action}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-4 h-4 text-secondary-foreground" weight="fill" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkle className="w-4 h-4 text-white animate-pulse" weight="fill" />
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-4 bg-card border-t border-border">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pergunte sobre relatórios, processos, prazos, finanças..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="icon"
          >
            <PaperPlaneRight className="w-4 h-4" weight="fill" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Donn@ transforma dados em decisões estratégicas
        </p>
      </div>
    </div>
  )
}
