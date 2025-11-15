import { useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Process, Prazo, ViewType } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calcularDiasRestantes, isUrgente, fo
interface DashboardProps {
}


    const ativos = processes.filter(p 
 

        process.prazos.forEach(prazo => {
            ...prazo,

      }

    const concluidos = processes.filter(p => p.status === 'concluido').length
    
    const todosPrazos: (Prazo & { processoTitulo: string })[] = []
    processes.forEach(process => {
      if (process.prazos && Array.isArray(process.prazos)) {
        process.prazos.forEach(prazo => {
          todosPrazos.push({
            ...prazo,
            processoTitulo: process.titulo
          })
        })
      }
    })

    const prazosPendentes = todosPrazos.filter(p => !p.concluido).length
    const prazosUrgentes = todosPrazos.filter(p => {
      if (p.concluido) return false
      const dias = calcularDiasRestantes(p.dataFinal)
      .sort((a, b) => b.upda
  }, [process

      <div className="flex flex-col gap-2">
        <p classN

        <Card>
            <CardTitle class
          </CardHeader>
            <div className="text-3xl font-bold">{stats.ativos
          </CardCo


            <CheckCircle className="text-pr
          <CardContent>
            <p className="text-xs text-muted-foreground mt-1"
        </Card>
        <Card>

          
            <div className="text-3xl font-bold">{sta
          </CardContent>

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            

              {stats.prazosUrgentes}
            <p
        </Card>

        <Card>
            <CardTitle>
              Ver todos
            </Button>
          <CardContent>
              <div class
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processos Concluídos</CardTitle>
            <CheckCircle className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Pendentes</CardTitle>
            <Clock className="text-primary" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.prazosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Não concluídos</p>
          </CardContent>
        </Card>

        <Card className={stats.prazosUrgentes > 0 ? 'border-destructive' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prazos Urgentes</CardTitle>
            <Warning className={stats.prazosUrgentes > 0 ? 'text-destructive' : 'text-primary'} size={20} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.prazosUrgentes > 0 ? 'text-destructive' : ''}`}>
              {stats.prazosUrgentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 5 dias</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Próximos Prazos</CardTitle>
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
                          {formatarData(prazo.dataFinal)}
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
                <Button size="sm" className="mt-3" onClick={() => onNavigate('processos')}>
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map(process => (
                  <div key={process.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {process.numeroCNJ}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        process.status === 'ativo' ? 'default' :
                        process.status === 'concluido' ? 'secondary' :
                        process.status === 'suspenso' ? 'outline' : 'destructive'
                      } 
                      className="shrink-0"
                    >
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
              <Warning size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Você tem {stats.prazosUrgentes} prazo{stats.prazosUrgentes > 1 ? 's' : ''} vencendo nos próximos 5 dias.
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
                          {formatarData(prazo.dataFinal)}
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
                <Button size="sm" className="mt-3" onClick={() => onNavigate('processos')}>
                  Adicionar Processo
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {processosRecentes.map(process => (
                  <div key={process.id} className="flex items-start justify-between gap-3 pb-3 border-b last:border-0">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{process.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {process.numeroCNJ}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        process.status === 'ativo' ? 'default' :
                        process.status === 'concluido' ? 'secondary' :
                        process.status === 'suspenso' ? 'outline' : 'destructive'
                      } 
                      className="shrink-0"
                    >
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
              <Warning size={24} />
              Atenção: Prazos Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Você tem {stats.prazosUrgentes} prazo{stats.prazosUrgentes > 1 ? 's' : ''} vencendo nos próximos 5 dias.
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
