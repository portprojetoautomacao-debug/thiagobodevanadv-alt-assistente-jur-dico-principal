import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
  Sparkle, 
import { Separator } from '@/components/ui/separator'
  User as
  Sparkle, 
  Calendar,
  Robot, 
  ClipboardText,
  ChartBar,
} from '@ph
  Calendar,

  type: 'sta
  description: s
  action?: str

  "Mostre a performance da equ
  "Quais são as próximas intimaç
  "Tarefas pendentes por colab

const QUICK_INSIGHT
    icon: Ch
    description: 'Performanc
  {
    label: 'Process
  },
 

  {
    label: 'Financeiro',
  }

  const [messages, setMes
  const [isProces


    if (scrollRef.current)
    }

    const lowerQuery = query.toLowerCa
    if (lowerQuery.includes('perform
        {
          title: 'Performance da Equipe'
 

          title: 'Colabo
   
        {
          title: 'Atençã
          value: '8'
    
   
      return [
          type: 'statis
          description: 'Total em andam
    
   
          descripti
        },
          type: 'suggestion',
    
   
    }
    if (lowerQuery.inclu
        {
   
 

          title: 'Intimações Pend
          value: '18'
      ]

      return [

          descripti
        },
          type: 'trend',
     
        },

          description: '5 clientes sem cobranças há 60+ dias',
        }
    
    return [
        type: 
        d
      }
  }
  const generateResponse = async (userQuery: string): Promise
    
      retu
**Destaqu
• Marcos Oliveira mantev

• João Santos apresentou queda de produtividade (apenas 8 tarefas concl

    }
    if (l

• 127 processos em andament
• 45 em fase de contestação
• 25 em fase recursa
⚡ **Ações
2. Revi

    
    if (lowerQuery.includes('intimaç') || lowerQuery.includes('prazo')) {

• Process
• Processo 0003456-78.2024.8
⚠️ **Próximos 7 dias:**
• 8 audiências agendadas

    }
    if (l

• Total recebido: R$ 87.450
• Honorários êxito: R$ 18.900

• Total: R
• Infraes

• Lucro líquido: R$ 53.250 (

• 5 clientes com pendências há 60+
    }
    if 


3. ABC Comércio - 15 processos ativos
5. DEF Indústr
📈 **Insi
• João da Silva: 90% tax

    }
    if (lowerQuery.i

• 12 tare

• 8 tarefas pendentes (todas no prazo)

• 23 tarefas pendente

    }
    r

📊 **Relatórios e Indicadores**
• Produtividad

• Status do acervo
• Distribuição por fase
📅 **Prazos e Intimações**
• Calendário de audiências

• Receita
• Inadimplência
🤝 **Clientes**
• Histórico de relacionamento

  }
  const h

      id: Date.now().toString(),
      content: input,
    }
    setMe
    set
    t

      const 
      c
        role: 'assistant',
        timestamp: new Date().toISOS
      }
      setMessages(prev => [...
      t
     
  }

  }
  const handleKeyPress = (e: React.KeyboardEve
    
    }


  }
  return (
      <div className="p-6 border-b border-border bg-card"
          <div className="flex items-center gap-3">

            <div>
              <p className="text-sm text-muted-foreground">
              </p>

            <Button variant="outline" size="sm" onClick={clearHistory}>
     

        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
            <Lightbulb className="inline w-4 h

            {QUICK_
              return (
                  key={insight.label}
                  onClick={
                  <Icon 
                  <di

          </div>
      </div>
      <ScrollArea className="flex-1 p-6" ref={scro
          <div className="flex flex-col ite

            </h3>
     

              {SAMPLE_QUESTIONS.map((question) => (
                  key={question}

                >
                  <span className="text-sm">{question}</span>
              ))}
          </div>

              <div
                className={cn(
                  messag
              >

                  </div>


                )}>
                    className={cn(

                
                  >
                  </div>
                  {message.in
                      {m

                
                  
                              
                          
                     

                 
                              )}
             

               
                                  {insight.title}
                                {insight.value && (
     

                              </p>
                                <Button variant

                            </div>
                        </Card>
                    </div>

                    {new Date(message
                      minute: '2-digit


                  <div className="w-8 h-8 rounded-full bg-secondary f
                  </div>
              </div>

              <div className="flex gap-4 justify-start">
     

                    <div className="w-2 h-2 bg-muted-foreground rounded-ful
                    <div className="w-2 h-2 bg-muted

            )}
        )}


        <div className=
            value={input}
            on

          />
            onClick={handleSend}
            size="icon"

        </div>
     

  )







































































































































































































































































































