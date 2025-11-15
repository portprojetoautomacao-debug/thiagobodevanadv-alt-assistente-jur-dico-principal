import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
  Curren
  Calendar,

  id: stri
  content: string
  insigh

  type: 'st
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
    description:
  description: string
  action?: string
}

const SAMPLE_QUESTIONS = [
  "Mostre a performance da equipe",
  "Quais são as próximas intimações?",
  "Tarefas pendentes por colaborador",
  "Análise financeira do mês",
 

const QUICK_INSIGHTS = [
  {
  const [input, setInput]
    icon: ChartBar,
    description: 'Performance da equipe',
    
   
          description: 
      ]
    
    
   
          value: '12
        },
          type: 'trend',
    
   
          type: 'suggest
          description: 'Prioriz
      ]
    
 

          value: '3',
        },
          type: 'statistics',
          value: '18',
        },
  
    if (lowerQuery.includes('financ')

          title: 'R
          description: 'Tota
        {
     
          descriptio

          title: 'Inadimplência',
        },
    
    return [
        type: 
        d
    ]

    const lowerQuery = 
    if (lowerQuery.includes('performance') || lowerQue

• Marcos 
• João Santos apresentou
**Recomendações:**
2. Investigar possíveis bloqueios c
    }
    if (lo

• 45 em fase de contesta
• 57 aguardando sentença
⚡ **Ações Prioritária
2. Revisar 8 processos sem movimentação há 30+ dias`
    
      r
⚠️ **
• Pr
⚠️ **Próximos 7 dias:**
• 15 prazos pa
    
      return `**Análise Finan
📊 **Receita:**
• Honorários êxito: R$ 
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

                A
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

                
• XYZ Transportadora: Principal cliente, necessita atenção especial
• João da Silva: 90% taxa de sucesso (excelente relacionamento)`
    }
    
    if (lowerQuery.includes('tarefa') || lowerQuery.includes('pendente')) {
      return `**Tarefas Pendentes por Colaborador**

            placehol
            onChange={(e) => setInput(e
            disabled={isProcessing}

            onCl
            size="icon"
            <PaperPlaneTilt className="w-5 h-5" weight

    </div>
}






















































































































































































































































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
