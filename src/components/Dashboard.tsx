import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, Ca
import { Badge } from '@/components/ui/badge'
  CheckCircle,
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  Robot,
  FileText,
  TrendUp,
  AlertCircle,
  user
} from '@phosphor-icons/react'
import type { User, Task, Process, Appointment } from '@/types'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks] = useKV<Task[]>('tasks', [])
  const [processes] = useKV<Process[]>('processes', [])
  const [appointments] = useKV<Appointment[]>('appointments', [])
  const { agents, activityLog } = useAutonomousAgents()

  const urgentTasks = (tasks || []).filter(t => !t.completed && t.priority === 'high')
    completed: (tasks || []).filter(t => t.completed).length,
    const today = new Date().toLocaleDateString('pt-BR')

  })

  const processStats = {
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    aguardando: (processes || []).filter(p => p.status === 'aguardando').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
    total: (processes || []).length
  }

  const taskStats = {
    pending: (tasks || []).filter(t => !t.completed).length,
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid
    total: (tasks || []).length
   

          <CardContent>
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
       

  const activeAgents = (agents || []).filter(a => a.enabled).length

  return (
    <div className="p-6 space-y-6">
          <
        <h1 className="text-3xl font-bold">
            <p className="text-x
        </h1>
          </CardContent>
          Aqui está um resumo das suas atividades
        <Car
            

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos em Andamento</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
                    <Wa
                      <
                        <p className="text-xs text-muted-foreground mt-1">
                        </p>
                    </div>
                
                  </div>
              <


          <CardHeader>
              <Robot className="w-5 h-5" />
            </CardTitle>
              {activeAg
          </CardHeader>
            <div className="space-y-3">
                <div key={agent.id} className="flex items-cent
                    <div className={`w-2 h-2 r
                
                    </di
               

              
          </CardContent>
      </div>
      <div className="grid grid-cols-1 gap-6">
          <CardHeader>
              <Clock cl
            </CardTitle>
              {todayAppointments.length} agendados
          </CardHeader>
            {tod
                <CheckCi
              <

              
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mt-1">
                      </p>
                    <Ba
                ))}
            )}
        </Card>
    </div>
}























                    <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Vence em: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Status dos Agentes IA
            </CardTitle>
            <CardDescription>
              {activeAgents} de {(agents || []).length} ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(agents || []).slice(0, 5).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${agent.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.currentTask ? agent.currentTask.type : 'Aguardando'}</p>
                    </div>
                  </div>
                  <Badge variant={agent.enabled ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Compromissos de Hoje
            </CardTitle>
            <CardDescription>
              {todayAppointments.length} agendados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Nenhum compromisso hoje</span>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {appointment.time} - {appointment.location || 'Local não especificado'}
                      </p>
                    </div>
                    <Badge>{appointment.type}</Badge>
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
