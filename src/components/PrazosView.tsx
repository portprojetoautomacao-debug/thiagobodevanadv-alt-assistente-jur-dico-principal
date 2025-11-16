import { useMemo, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarCheck, CheckCircle, Clock } from '@phosphor-icons/react'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'
import { toast } from 'sonner'

export default function PrazosView() {
  const [processes, setProcesses] = useKV<Process[]>('processes', [])
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'urgentes' | 'concluidos'>('pendentes')

  const prazosComProcesso = useMemo(() => {
    const lista: (Prazo & { processo: Process })[] = []
    
    processes.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          lista.push({ ...prazo, processo: process })
        })
      }
    })

    return lista.sort((a, b) => a.dataFinal.localeCompare(b.dataFinal))
  }, [processes])

  const filteredPrazos = useMemo(() => {
    return prazosComProcesso.filter(prazo => {
      const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
      
      if (filter === 'pendentes') return !prazo.concluido
      if (filter === 'concluidos') return prazo.concluido
      if (filter === 'urgentes') return !prazo.concluido && isUrgente(diasRestantes)
      return true
    })
  }, [prazosComProcesso, filter])

  const stats = useMemo(() => {
    const pendentes = prazosComProcesso.filter(p => !p.concluido).length
    const concluidos = prazosComProcesso.filter(p => p.concluido).length
    const urgentes = prazosComProcesso.filter(p => {
      if (p.concluido) return false
      const dias = calcularDiasRestantes(p.dataFinal)
      return isUrgente(dias)
    }).length

    return { pendentes, concluidos, urgentes }
  }, [prazosComProcesso])

  const handleToggleConcluido = (prazo: Prazo & { processo: Process }) => {
    setProcesses(current => 
      current.map(process => {
        if (process.id === prazo.processId) {
          return {
            ...process,
            prazos: process.prazos.map(p => 
              p.id === prazo.id ? { ...p, concluido: !p.concluido } : p
            ),
            updatedAt: new Date().toISOString()
          }
        }
        return process
      })
    )
    
    toast.success(prazo.concluido ? 'Prazo marcado como pendente' : 'Prazo concluído')
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Prazos</h1>
        <p className="text-muted-foreground">Gerencie todos os seus prazos processuais</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('pendentes')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendentes}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('urgentes')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <CalendarCheck className="text-accent" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.urgentes}</div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('concluidos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.concluidos}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
          <TabsTrigger value="urgentes">Urgentes</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {filteredPrazos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CalendarCheck size={64} className="text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum prazo encontrado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {filter === 'pendentes' && 'Todos os prazos estão concluídos!'}
                  {filter === 'urgentes' && 'Nenhum prazo urgente no momento'}
                  {filter === 'concluidos' && 'Nenhum prazo concluído ainda'}
                  {filter === 'todos' && 'Adicione prazos aos seus processos'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredPrazos.map(prazo => {
                const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
                const urgente = isUrgente(diasRestantes) && !prazo.concluido

                return (
                  <Card key={prazo.id} className={urgente ? 'border-accent' : ''}>
                    <CardContent className="flex items-start gap-4 p-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="font-semibold truncate">{prazo.descricao}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {prazo.processo.titulo} - {prazo.processo.numeroCNJ}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {prazo.concluido ? (
                              <Badge variant="secondary">Concluído</Badge>
                            ) : (
                              <>
                                <Badge variant={urgente ? 'destructive' : 'default'}>
                                  {diasRestantes < 0 ? 'Vencido' : 
                                   diasRestantes === 0 ? 'Hoje' : 
                                   diasRestantes === 1 ? 'Amanhã' : 
                                   `${diasRestantes} dias`}
                                </Badge>
                                {urgente && <Badge variant="outline" className="text-xs">Urgente</Badge>}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Data Início</span>
                            <span>{formatarData(prazo.dataInicio)}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Data Final</span>
                            <span className={urgente && !prazo.concluido ? 'text-accent font-semibold' : ''}>
                              {formatarData(prazo.dataFinal)}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Prazo</span>
                            <span>{prazo.diasCorridos} dias ({prazo.tipoPrazo.toUpperCase()})</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            variant={prazo.concluido ? 'outline' : 'default'}
                            onClick={() => handleToggleConcluido(prazo)}
                          >
                            <CheckCircle size={16} />
                            {prazo.concluido ? 'Reabrir' : 'Marcar como Concluído'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
