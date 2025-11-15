import { useKV } from '@github/spark/hooks'
import type { Process, Prazo } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gavel, CalendarCheck, Clock, CheckCircle } from '@phosphor-icons/react'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'
import { useMemo } from 'react'

interface DashboardProps {
  onNavigate: (view: string) => void
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
    const todosPrazos: (Prazo & { processoTitulo: string })[] = []
    
    processes.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          if (!prazo.concluido) {
            todosPrazos.push({
              ...prazo,
              processoTitulo: process.titulo
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
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [processes])

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos seus processos e prazos</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Gavel className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground mt-1">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando cumprimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <CalendarCheck className="text-accent" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.prazosUrgentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Nos próximos 3 dias</p>
          </CardContent>
        </Card>

        <Card>
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
          <CardHeader>
            <CardTitle>Prazos Próximos</CardTitle>
          </CardHeader>
          <CardContent>
            {prazosProximos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prazo pendente</p>
            ) : (
              <div className="flex flex-col gap-3">
                {prazosProximos.map(prazo => {
                  const diasRestantes = calcularDiasRestantes(prazo.dataFinal)
                  const urgente = isUrgente(diasRestantes)

                  return (
                    <div key={prazo.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prazo.descricao}</p>
                        <p className="text-xs text-muted-foreground truncate">{prazo.processoTitulo}</p>
                        <p className="text-xs text-muted-foreground">{formatarData(prazo.dataFinal)}</p>
                      </div>
                      <Badge variant={urgente ? 'destructive' : 'secondary'} className="shrink-0">
                        {diasRestantes === 0 ? 'Hoje' : diasRestantes === 1 ? 'Amanhã' : `${diasRestantes}d`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Processos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {processosRecentes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">Nenhum processo cadastrado</p>
                <button
                  onClick={() => onNavigate('processos')}
                  className="text-sm text-primary hover:underline"
                >
                  Adicionar primeiro processo
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map(process => (
                  <div
                    key={process.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 -mx-3 px-3 py-2 rounded transition-colors"
                    onClick={() => onNavigate('processos')}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{process.numeroCNJ}</p>
                      <p className="text-xs text-muted-foreground">{process.autor} × {process.reu}</p>
                    </div>
                    <Badge variant={
                      process.status === 'ativo' ? 'default' :
                      process.status === 'concluido' ? 'secondary' : 'outline'
                    }>
                      {process.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
