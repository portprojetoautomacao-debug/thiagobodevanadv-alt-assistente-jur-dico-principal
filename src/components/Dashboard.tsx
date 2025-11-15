import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/butto
import { Progress } from '@/components/ui/progr
  CheckCircle,
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Clock, 
  ArrowR
import typ

  user: User

  const [tasks] = useKV<Task[]
  const [processes] = useKV<Process[]>('processes', [])
  const { agents, activityLog } = useAutonomousAgents()

    const today = new Date
  })
 

    total: (processes || []).length

    pending: (tasks || []).filter(t => !t.completed).length,
    total: (tasks || []).length
  
  const { agents, activityLog } = useAutonomousAgents()

  const urgentTasks = (tasks || []).filter(t => !t.completed && t.priority === 'high')
  const todayAppointments = (appointments || []).filter(a => {
    const today = new Date().toLocaleDateString('pt-BR')
    return new Date(a.date).toLocaleDateString('pt-BR') === today
  })

  const processStats = {
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    aguardando: (processes || []).filter(p => p.status === 'aguardando').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
    total: (processes || []).length
  }

  const taskStats = {
    pending: (tasks || []).filter(t => !t.completed).length,
    completed: (tasks || []).filter(t => t.completed).length,
    total: (tasks || []).length
  }

  const completionPercentage = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
       

        </Card>
        <Card>
            <CardTitle className="text-sm font-med

  return (
              {(appointments || [])
      <div>
        <h1 className="text-3xl font-bold">
          Bem-vindo, {user.name}
            <
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo das suas atividades
        </p>


            <CardTitle className="flex items-center gap-2">
              
          </CardHeader>
            {urgentTasks.length === 0 ? (
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
                {urgent
          <CardContent>
                      <p className="text-sm font-medium">{task.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
                    </div>
            </p>
            )}
        </Card>

        <Card>
              Status dos Agentes IA
            <CardDescription>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {taskStats.completed} concluídas
            </p>
          </CardContent>
               

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromissos Hoje</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
      <Card>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(appointments || []).length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>










              <div className="space-y-3">










                ))}

            )}

        </Card>






















                      <p className="text-xs text-muted-foreground">{agent.currentTask ? agent.currentTask.type : 'Aguardando'}</p>



















































    </div>

}
