import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import type { ChatMessage, Process } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ChatCircle, PaperPlaneRight, Sparkle } from '@phosphor-icons/react'
import { toast } from 'sonner'

export default function AssistenteIA() {
  const [messages, setMessages] = useKV<ChatMessage[]>('chat_history', [])
  const [processes] = useKV<Process[]>('processes', [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(current => [...current, userMessage])
    setInput('')
    setLoading(true)

    try {
      const context = {
        totalProcessos: processes.length,
        processosAtivos: processes.filter(p => p.status === 'ativo').length,
        processosConcluidos: processes.filter(p => p.status === 'concluido').length,
        todosPrazos: processes.flatMap(p => p.prazos || []),
        prazosPendentes: processes.flatMap(p => p.prazos || []).filter(p => !p.concluido).length
      }

      const prompt = spark.llmPrompt`Você é um assistente jurídico especializado em direito processual brasileiro. 

Contexto do usuário:
- Total de processos: ${context.totalProcessos}
- Processos ativos: ${context.processosAtivos}
- Processos concluídos: ${context.processosConcluidos}
- Prazos pendentes: ${context.prazosPendentes}

Pergunta do usuário: ${input.trim()}

Forneça uma resposta útil, precisa e profissional. Se a pergunta for sobre cálculo de prazos, análise processual ou orientação jurídica, use seus conhecimentos sobre o CPC, CPP e CLT. Seja conciso mas completo.`

      const response = await spark.llm(prompt, 'gpt-4o')

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }

      setMessages(current => [...current, assistantMessage])
    } catch (error) {
      toast.error('Erro ao processar mensagem', {
        description: 'Tente novamente em alguns instantes'
      })
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = () => {
    setClearDialogOpen(true)
  }

  const confirmClearHistory = () => {
    setMessages([])
    toast.success('Histórico limpo')
    setClearDialogOpen(false)
  }

  const suggestions = [
    'Como funciona o cálculo de prazos no CPC?',
    'Explique a diferença entre prazos em dias úteis e dias corridos',
    'Quais são os prazos para contestação?',
    'Como organizar melhor meus processos?'
  ]

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Assistente Jurídico IA</h1>
          <p className="text-muted-foreground">Tire dúvidas sobre processos e prazos</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" onClick={handleClearHistory}>
            Limpar Histórico
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col max-h-[calc(100vh-280px)]">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkle className="text-primary" size={24} />
            Consultor Jurídico
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="flex flex-col items-center gap-3">
                <ChatCircle size={64} className="text-muted-foreground" />
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">Como posso ajudar?</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Faça perguntas sobre cálculo de prazos, análise de processos ou tire dúvidas sobre procedimentos jurídicos
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-2xl">
                <p className="text-xs text-muted-foreground font-medium mb-1">Sugestões:</p>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(suggestion)}
                    className="text-left text-sm p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-muted">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Digite sua pergunta..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          className="flex-1 resize-none"
          rows={2}
          disabled={loading}
        />
        <Button type="submit" disabled={!input.trim() || loading} size="lg">
          <PaperPlaneRight size={20} />
        </Button>
      </form>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearHistory}>Limpar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
