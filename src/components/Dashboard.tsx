import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardHeader, CardT
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gavel, CalendarCheck, Clock, CheckCircle } from '@phosphor-icons/react'
import { calcularDiasRestantes, isUrgente, formatarData } from '@/lib/prazos'
  onNavigate: (view: string) =>

    const ativos = process
    
 

      return isUrgente(dias)


  const prazosProximos = useMem
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

          <CardHeader className="f
            <Gavel className="text-primary" size={20} />
          <CardContent>
            <p className="text-xs
        </Card>
        <Card>
            <CardTitle className="text-sm fo
          </Ca
           
          

      

          <CardContent
            <p className="text-xs text-muted-foreground mt-1"
        </Card>
        <Card>

          </CardHeader>
            <div classNam
          </CardContent>
      </div>
      <div classN

          
            {prazosProximos.length === 0 ? (
            ) : (
                {prazosProximos.map(prazo => {
                  const urgente = isUrgente(diasRestantes)
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


























































