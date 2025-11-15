import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Briefcase, 
  CalendarDots, 
  CheckCircle,
  Warning,
  Clock, 
  CheckSquare,
  Brain,
  ArrowRight,
  TrendUp
} from '@phosphor-icons/react'
import type { User, Task, Appointment, Process } from '@/types'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [tasks] = useKV<Task[]>('tasks', [])
  const [appointments] = useKV<Appointment[]>('appointments', [])
  const [processes] = useKV<Process[]>('processes', [])
  const { agents, activityLog, completedTasks } = useAutonomousAgents()

  const pendingTasks = (tasks || []).filter(t => !t.completed)
  const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent')
  const todayAppointments = (appointments || []).filter(a => {
    const today = new Date().toISOString().split('T')[0]
    return a.date === today
  })

  const processStats = {
    aguardando: (processes || []).filter(p => p.status === 'aguardando').length,
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
  }

  const completionRate = (tasks || []).length > 0 
    ? Math.round(((tasks || []).filter(t => t.completed).length / (tasks || []).length) * 100)
    : 0

  const activeAgents = agents.filter(a => a.status === 'active').length
  const totalAgentTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const recentActivities = activityLog.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Seus agentes de IA autônomos estão trabalhando 24/7 para você
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processStats.emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {processStats.aguardando} aguardando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {urgentTasks.length} urgentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compromissos Hoje</CardTitle>
            <CalendarDots className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(appointments || []).length} total este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Tarefas Urgentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa urgente no momento</p>
            ) : (
              <div className="space-y-3">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Warning className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Status dos Agentes IA
            </CardTitle>
            <CardDescription>
              {activeAgents} agentes ativos • {totalAgentTasks} tarefas completadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {agents.slice(0, 3).map((agent) => (
                <div key={agent.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500' : 
                      agent.status === 'idle' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.lastActivity || 'Aguardando'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.tasksCompleted}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-3" size="sm">
                Ver todos os agentes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendUp className="w-5 h-5" />
            Atividade Recente dos Agentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((log) => {
                const agent = agents.find(a => a.id === log.agentId)
                return (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Badge 
                      variant={log.result === 'success' ? 'default' : log.result === 'error' ? 'destructive' : 'secondary'} 
                      className="text-xs"
                    >
                      {agent?.name || 'Agente'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
