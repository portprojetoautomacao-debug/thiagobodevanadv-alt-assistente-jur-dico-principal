import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MagnifyingGlass, Funnel, DotsThree, CurrencyDollar, TrendUp } from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { Process } from '@/types'

const PROCESS_PHASES = [
  'Marketing',
  'Negociação',
  'Consultoria',
  'Administrativo',
  'Judicial',
  'Recursal',
  'Execução',
  'Financeiro',
  'Arquivamento'
]

const KANBAN_COLUMNS = [
  'Aguardando Decisão do Órgão',
  'Aguardando Decisão do INSS',
  'Cobrança',
  'Aguardando Documentação'
]

interface ProcessCardData {
  id: string
  autor: string
  reu: string
  tipo: string
  numero: string
  valor: string
  resultado: string
  status: 'green' | 'yellow' | 'red'
  column: string
}

export default function ProcessCRMAdvbox() {
  const [processes] = useKV<Process[]>('processes', [])
  const [filter, setFilter] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('Administrativo')
  
  // Transform processes into Kanban cards
  const processCards: ProcessCardData[] = (processes || []).slice(0, 8).map((p, idx) => ({
    id: p.id,
    autor: p.autor || 'Não informado',
    reu: p.reu || 'INSS',
    tipo: p.titulo || 'Auxílio doença Previdenciário',
    numero: p.numeroCNJ,
    valor: 'R$ 5.000,00',
    resultado: Math.random() > 0.5 ? 'Provável' : 'Possível',
    status: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)] as 'green' | 'yellow' | 'red',
    column: KANBAN_COLUMNS[idx % KANBAN_COLUMNS.length]
  }))

  const getCardsByColumn = (column: string) => {
    return processCards.filter(card => card.column === column)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Buscar por nome, cpf, cnj, e-mail, tag ou pasta"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-[400px] bg-background"
            />
            <Button variant="ghost" size="icon">
              <MagnifyingGlass size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Funnel size={16} className="mr-1" />
              Filtros
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              + NOVO PROCESSO
            </Button>
          </div>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PROCESS_PHASES.map(phase => (
            <Button
              key={phase}
              variant={selectedPhase === phase ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPhase(phase)}
              className={selectedPhase === phase ? 'bg-primary text-primary-foreground' : ''}
            >
              {phase}
            </Button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 p-4 overflow-x-auto">
        <div className="flex items-start gap-4 min-w-max">
          {/* Column Header Info */}
          <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background z-10 pb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">{processCards.length} Processos</span>
              <span>•</span>
              <span>R$ {(processCards.length * 5000).toLocaleString('pt-BR')}</span>
              <span>•</span>
              <span>0 Estagnados</span>
            </div>
            <Button variant="outline" size="sm">
              Mover etapas em massa
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-4 min-w-max">
          {KANBAN_COLUMNS.map(column => {
            const cards = getCardsByColumn(column)
            return (
              <div key={column} className="w-[300px] flex-shrink-0">
                {/* Column Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between p-3 bg-card rounded-t-lg border border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="font-medium text-sm">{column}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {cards.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {cards.map(card => (
                    <Card 
                      key={card.id} 
                      className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(card.status)}`}></div>
                              <span className="text-xs text-muted-foreground">
                                {card.numero.substring(0, 20)}...
                              </span>
                            </div>
                            <h4 className="font-medium text-sm mb-1">
                              {card.autor}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {card.reu}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                            <DotsThree size={16} />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>{card.tipo}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm">
                              <CurrencyDollar size={14} className="text-primary" />
                              <span className="font-medium">{card.valor}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <TrendUp size={12} className="text-green-500" />
                              <span className="text-green-500">{card.resultado}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
