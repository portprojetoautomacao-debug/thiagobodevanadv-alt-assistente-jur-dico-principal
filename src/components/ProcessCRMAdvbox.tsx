import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MagnifyingGlass, Funnel, DotsThree, CurrencyDollar, TrendUp, X, Calendar, File, ChatCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, closestCorners } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  processo?: Process
}

interface SortableCardProps {
  card: ProcessCardData
  onOpenDetails: (card: ProcessCardData) => void
}

function SortableCard({ card, onOpenDetails }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-card border-border hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group"
      onClick={() => onOpenDetails(card)}
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
  )
}

export default function ProcessCRMAdvbox() {
  const [processes] = useKV<Process[]>('processes', [])
  const [filter, setFilter] = useState('')
  const [selectedPhase, setSelectedPhase] = useState<string>('Administrativo')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<ProcessCardData | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [processCards, setProcessCards] = useState<ProcessCardData[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Initialize process cards
  useState(() => {
    const cards: ProcessCardData[] = (processes || []).slice(0, 8).map((p, idx) => ({
      id: p.id,
      autor: p.autor || 'Não informado',
      reu: p.reu || 'INSS',
      tipo: p.titulo || 'Auxílio doença Previdenciário',
      numero: p.numeroCNJ,
      valor: 'R$ 5.000,00',
      resultado: Math.random() > 0.5 ? 'Provável' : 'Possível',
      status: ['green', 'yellow', 'red'][Math.floor(Math.random() * 3)] as 'green' | 'yellow' | 'red',
      column: KANBAN_COLUMNS[idx % KANBAN_COLUMNS.length],
      processo: p
    }))
    setProcessCards(cards)
  })

  const getCardsByColumn = (column: string) => {
    return processCards.filter(card => card.column === column)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      return
    }

    const activeCard = processCards.find(c => c.id === active.id)
    const overColumn = over.id as string

    if (activeCard && KANBAN_COLUMNS.includes(overColumn)) {
      setProcessCards(cards =>
        cards.map(card =>
          card.id === active.id
            ? { ...card, column: overColumn }
            : card
        )
      )
      toast.success(`Processo movido para ${overColumn}`)
    }

    setActiveId(null)
  }

  const handleOpenDetails = (card: ProcessCardData) => {
    setSelectedCard(card)
    setDetailsOpen(true)
  }

  const activeCard = processCards.find(c => c.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
          <div className="flex items-start gap-4 min-w-max mb-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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

                  {/* Droppable Area */}
                  <SortableContext
                    items={cards.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                    id={column}
                  >
                    <div className="space-y-3 min-h-[200px] p-2 rounded-lg bg-muted/20 border-2 border-dashed border-transparent hover:border-primary/30 transition-colors">
                      {cards.map(card => (
                        <SortableCard
                          key={card.id}
                          card={card}
                          onOpenDetails={handleOpenDetails}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )
            })}
          </div>
        </div>

        {/* Process Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-xl">Detalhes do Processo</DialogTitle>
                  <DialogDescription>
                    {selectedCard?.numero}
                  </DialogDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setDetailsOpen(false)}>
                  <X size={20} />
                </Button>
              </div>
            </DialogHeader>

            {selectedCard && (
              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
                  <TabsTrigger value="docs">Documentos</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Autor</p>
                      <p className="text-base">{selectedCard.autor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Réu</p>
                      <p className="text-base">{selectedCard.reu}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tipo de Ação</p>
                      <p className="text-base">{selectedCard.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor da Causa</p>
                      <p className="text-base">{selectedCard.valor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Resultado Provável</p>
                      <Badge variant="secondary">{selectedCard.resultado}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          selectedCard.status === 'green' ? 'bg-green-500' :
                          selectedCard.status === 'yellow' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="capitalize">{selectedCard.status}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCard.processo && (
                    <div className="space-y-2 border-t border-border pt-4">
                      <p className="text-sm font-medium text-muted-foreground">Comarca</p>
                      <p className="text-base">{selectedCard.processo.comarca || 'Não informado'}</p>
                      
                      <p className="text-sm font-medium text-muted-foreground mt-3">Vara</p>
                      <p className="text-base">{selectedCard.processo.vara || 'Não informado'}</p>
                      
                      <p className="text-sm font-medium text-muted-foreground mt-3">Data de Distribuição</p>
                      <p className="text-base">{new Date(selectedCard.processo.dataDistribuicao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="timeline" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar size={20} className="text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Processo distribuído</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCard.processo && new Date(selectedCard.processo.dataDistribuicao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <File size={20} className="text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Última movimentação</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCard.processo && new Date(selectedCard.processo.dataUltimaMovimentacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="docs" className="mt-4">
                  <div className="text-center py-8 text-muted-foreground">
                    <File size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum documento anexado</p>
                    <Button className="mt-4" variant="outline">
                      Adicionar Documento
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeCard && (
            <Card className="bg-card border-primary opacity-80 w-[300px]">
              <CardHeader className="p-4 pb-2">
                <h4 className="font-medium text-sm">{activeCard.autor}</h4>
              </CardHeader>
            </Card>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
