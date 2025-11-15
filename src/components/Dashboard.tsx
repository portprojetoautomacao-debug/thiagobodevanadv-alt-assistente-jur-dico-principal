import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  TrendUp,
  Warning,
  Robot,
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
    : 0

  const activeAgents = (agents || []).filter(a => a.enabled).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-muted-foreground mt-2">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos em Andamento</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processStats.emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {processStats.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <Warning className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {taskStats.completed} concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromissos Hoje</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning className="w-5 h-5" />
              Tarefas Urgentes
            </CardTitle>
            <CardDescription>
              Requer atenção imediata
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
                  <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Warning className="w-5 h-5 text-destructive mt-0.5" />
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
              <Robot className="w-5 h-5" />
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
