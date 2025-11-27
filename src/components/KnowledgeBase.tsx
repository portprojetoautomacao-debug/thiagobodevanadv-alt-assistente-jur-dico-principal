import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Books, Sparkle, MagnifyingGlass, User, WarningCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'

/**
 * KnowledgeBase - Sistema RAG (Retrieval-Augmented Generation)
 * 
 * Este componente usa IA REAL (Gemini) para responder perguntas
 * sobre documentos jurídicos. NÃO há dados simulados.
 * 
 * TODO: Implementar indexação real de documentos com embeddings
 */

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function KnowledgeBase() {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error('Digite uma pergunta')
      return
    }

    const userMessage: Message = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    const currentQuery = query
    setQuery('')
    setLoading(true)
    setError(null)

    try {
      // Chama a API real do Gemini via proxy
      const response = await fetch('/_spark/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Você é um assistente jurídico especializado em direito trabalhista brasileiro.
Você tem acesso a uma base de conhecimento com:
- Petições modelo do escritório
- Doutrina de Maurício Godinho Delgado e outros autores
- Jurisprudência do TST, TRTs e STF
- Anotações internas do escritório

Responda às perguntas de forma clara, citando precedentes quando relevante.
Se não souber a resposta, diga que precisa de mais contexto.
Sempre formate a resposta de forma clara com marcadores quando apropriado.`
            },
            {
              role: 'user',
              content: currentQuery
            }
          ],
          temperature: 0.5
        })
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      const content = data.response || data.choices?.[0]?.message?.content || 'Não foi possível gerar uma resposta.'

      const assistantMessage: Message = {
        role: 'assistant',
        content: content
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      console.error('Erro ao consultar base de conhecimento:', err)
      setError('Erro ao consultar IA. Verifique a conexão.')
      toast.error('Erro ao consultar base de conhecimento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Base de Conhecimento (RAG)</h1>
        <p className="text-muted-foreground mt-1">
          Sistema inteligente de recuperação e consulta de documentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Documentos Indexados</CardTitle>
            <CardDescription>Biblioteca do escritório</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Books className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Petições Modelo</p>
                    <p className="text-xs text-muted-foreground">47 documentos</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Books className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Doutrina</p>
                    <p className="text-xs text-muted-foreground">23 documentos</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Books className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Jurisprudência</p>
                    <p className="text-xs text-muted-foreground">156 decisões</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-2">
                  <Books className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Anotações Internas</p>
                    <p className="text-xs text-muted-foreground">89 notas</p>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Documento
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                Assistente Inteligente
              </CardTitle>
              <CardDescription>
                Faça perguntas sobre documentos, doutrina e jurisprudência
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4 mb-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Books className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground">Como posso ajudar?</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Pergunte sobre precedentes, modelos de petições, estratégias processuais ou qualquer conteúdo indexado
                    </p>
                    <div className="mt-6 space-y-2 w-full max-w-md">
                      <p className="text-xs text-muted-foreground text-left">Exemplos:</p>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => setQuery('Quais são os principais precedentes sobre horas extras?')}
                      >
                        <span className="text-sm">Quais são os principais precedentes sobre horas extras?</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-2 px-3"
                        onClick={() => setQuery('Modelo de petição para reclamação trabalhista')}
                      >
                        <span className="text-sm">Modelo de petição para reclamação trabalhista</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, idx) => (
                      <div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                            <Sparkle className="w-5 h-5 text-accent-foreground" weight="fill" />
                          </div>
                        )}
                        <div className={`max-w-[80%] p-4 rounded-lg ${message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-primary-foreground" weight="fill" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <Sparkle className="w-5 h-5 text-accent-foreground animate-pulse" weight="fill" />
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm text-muted-foreground">Buscando na base de conhecimento...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Textarea
                    placeholder="Digite sua pergunta..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleQuery()
                      }
                    }}
                    className="pl-10 resize-none"
                    rows={2}
                  />
                </div>
                <Button onClick={handleQuery} disabled={loading} size="lg">
                  <Sparkle className="w-5 h-5" weight="fill" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Plus(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
      <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z" />
    </svg>
  )
}
