import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo, ViewType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gavel, CalendarCheck, Clock, CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'

interface DashboardProps {
  onNavigate: (view: ViewType) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [processes] = useKV<Process[]>('processes', [])

  const stats = useMemo(() => {
    const ativos = processes.filter(p => p.status === 'ativo').length
    const concluidos = processes.filter(p => p.status === 'concluido').length
    
    const todosPrazos = processes.flatMap(p => (p.prazos && Array.isArray(p.prazos)) ? p.prazos : [])
    const prazosPendentes = todosPrazos.filter(p => !p.concluido).length
    const prazosUrgentes = todosPrazos.filter(p => {
      if (p.concluido) return false
      const dias = calcularDiasRestantes(p.dataFinal)
      return isUrgente(dias)
    }).length

    return { ativos, concluidos, prazosPendentes, prazosUrgentes }
  }, [processes])

  const prazosProximos = useMemo(() => {
    const todosPrazos: (Prazo & { processoTitulo: string; processoCNJ: string })[] = []
    
    processes.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          if (!prazo.concluido) {
            todosPrazos.push({
              ...prazo,
              processoTitulo: process.titulo,
              processoCNJ: process.numeroCNJ
            })
          }
        })
      }
    })

    return todosPrazos
      .sort((a, b) => a.dataFinal.localeCompare(b.dataFinal))
      .slice(0, 5)
  }, [processes])

  const processosRecentes = useMemo(() => {
    return [...processes]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5)
  }, [processes])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua gestão processual</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('processos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Gavel className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('prazos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando cumprimento</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('prazos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <CalendarCheck className="text-destructive" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.prazosUrgentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Nos próximos 5 dias</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('processos')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Processos finalizados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Prazos Próximos</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('prazos')}>
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarCheck size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum prazo pendente</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {prazosProximos.map(prazo => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
                  const urgente = isUrgente(diasRestantes)

                  return (
                    <div key={prazo.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prazo.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prazo.processoTitulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {formatarData(prazo.dataFinal)}
                        </p>
                      </div>
                      <Badge variant={urgente ? 'destructive' : 'default'} className="shrink-0">
                        {diasRestantes < 0 ? 'Vencido' : 
                         diasRestantes === 0 ? 'Hoje' : 
                         diasRestantes === 1 ? 'Amanhã' : 
                         `${diasRestantes} dias`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Processos Recentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('processos')}>
              Ver todos
              <ArrowRight size={16} />
            </Button>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Gavel size={48} className="text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum processo cadastrado</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate('processos')}>
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map(process => (
                  <div key={process.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground font-mono">{process.numeroCNJ}</p>
                      <p className="text-xs text-muted-foreground">
                        {process.autor} × {process.reu}
                      </p>
                    </div>
                    <Badge variant={
                      process.status === 'ativo' ? 'default' :
                      process.status === 'concluido' ? 'secondary' :
                      process.status === 'suspenso' ? 'outline' : 'destructive'
                    } className="shrink-0">
                      {process.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {stats.prazosUrgentes > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <CalendarCheck size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-3">
              Você tem {stats.prazosUrgentes} prazo{stats.prazosUrgentes > 1 ? 's' : ''} com vencimento nos próximos 5 dias. 
              Certifique-se de tomar as providências necessárias.
            </p>
            <Button variant="destructive" size="sm" onClick={() => onNavigate('prazos')}>
              Ver Prazos Urgentes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
