import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Clock,
  Robot,
  TrendUp,
  ArrowRig
import typ

  user: User

  const [tasks] = useKV<Task[]>('tasks', [])


  const toda


    concluido: (processes || []).filter(p => p.status === 'co
  }
  const taskStats = {
    completed: (tasks || []).filter(t => t.completed).length,
  }

    : 0
  const activeAgents = (agents || []).filter(a => a.en
  return (

          Bem-vindo, {us
        <p className="text-muted-foreground mt-1">
        </p>

        <Card>
   

            <div clas
              {processStats.total} processos totais
          </CardContent>

   

          <CardContent>
            <p className="text-xs text-muted-foreground">
       

        <Card>

          
            <div className="text-2x
           
          </CardContent>

          <Ca
            <TrendUp className="w-4 h-4 text-muted
          <CardContent>
            
            


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos em Andamento</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processStats.emAndamento}</div>
            <p className="text-xs text-muted-foreground">
              {processStats.total} processos totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {completionRate}% concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Robot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              de {(agents || []).length} agentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtividade</CardTitle>
            <TrendUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conclusão
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5 text-destructive" />
              Tarefas Urgentes
            </CardTitle>
            <CardDescription>
              {urgentTasks.length} tarefas de alta prioridade
            </CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Nenhuma tarefa urgente</span>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="space-y-3">
                  <div key={appointment.
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mt-1">
                      </p>
                    <Bad
                ))}
            )}
        </Card>
    </div>
}












































































