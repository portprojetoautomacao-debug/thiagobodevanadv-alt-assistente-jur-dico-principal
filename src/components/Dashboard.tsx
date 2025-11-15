import { useKV } from '@github/spark/hooks'
import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  CheckCircle, 
  Warning, 
  Sparkle,
  CalendarDots,
  ListChecks,
  Briefcase,
  Robot,
  Lightning,
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
    total: (processes || []).length,
    aguardando: (processes || []).filter(p => p.status === 'aguardando').length,
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
  }

  const completionRate = (tasks || []).length > 0 
    ? Math.round(((tasks || []).filter(t => t.completed).length / (tasks || []).length) * 100)
    : 0
  
  const activeAgents = agents.filter(a => a.enabled && a.status !== 'paused').length
  const totalAgentTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const todayAgentTasks = agents.reduce((sum, a) => sum + a.tasksToday, 0)
  const recentActivities = activityLog.slice(0, 5)
  const tasksCompletedLast24h = completedTasks.filter(t => {
    const taskTime = new Date(t.completedAt || t.createdAt).getTime()
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    return taskTime > oneDayAgo
  }).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeAgents} agentes de IA trabalhando 24/7 para você • {todayAgentTasks} tarefas hoje
        </p>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Robot className="w-6 h-6 text-primary" weight="fill" />
                Sistema de Agentes Autônomos 24/7
              </CardTitle>
              <CardDescription>Operando continuamente sem intervenção humana</CardDescription>
            </div>
            <Badge variant="outline" className="bg-green-500/10 border-green-500 text-green-700 dark:text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
              {activeAgents} Ativos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
              <Lightning className="w-8 h-8 text-accent" weight="fill" />
              <div>
                <p className="text-2xl font-bold text-foreground">{todayAgentTasks}</p>
                <p className="text-sm text-muted-foreground">Tarefas Hoje</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
              <CheckSquare className="w-8 h-8 text-green-600" weight="fill" />
              <div>
                <p className="text-2xl font-bold text-foreground">{tasksCompletedLast24h}</p>
                <p className="text-sm text-muted-foreground">Últimas 24h</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border/50">
              <TrendUp className="w-8 h-8 text-primary" weight="fill" />
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAgentTasks}</p>
                <p className="text-sm text-muted-foreground">Total Executadas</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {agents.slice(0, 4).map((agent) => (
              <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-border/50 hover:border-primary/30 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  agent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                  agent.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 
                  agent.status === 'waiting_human' ? 'bg-orange-500 animate-pulse' :
                  'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.lastActivity}</p>
                </div>
                <div className="flex items-center gap-2">
                  {agent.currentTask && (
                    <Brain className="w-4 h-4 text-primary animate-pulse" weight="fill" />
                  )}
                  <Badge variant={agent.enabled && agent.status !== 'paused' ? 'default' : 'secondary'} className="flex-shrink-0">
                    {agent.enabled && agent.status !== 'paused' ? 'Operando' : 'Pausado'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {agents.length > 4 && (
            <Button variant="ghost" className="w-full mt-3" size="sm">
              Ver todos os {agents.length} agentes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {processStats.emAndamento} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <ListChecks className="w-4 h-4 text-muted-foreground" />
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
              Prazos Fatais
            </CardTitle>
            <CardDescription>Próximos prazos que requerem atenção</CardDescription>
          </CardHeader>
          <CardContent>
            {urgentTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum prazo fatal no momento
              </p>
            ) : (
              <div className="space-y-3">
                {urgentTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                    <Warning className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Vencimento: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Badge variant="destructive" className="flex-shrink-0">Urgente</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkle className="w-5 h-5" weight="fill" />
              Atividade Recente da IA
            </CardTitle>
            <CardDescription>Últimas ações dos agentes autônomos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aguardando atividade dos agentes...
                </p>
              ) : (
                recentActivities.map((log) => {
                  const agent = agents.find(a => a.id === log.agentId)
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                      <Sparkle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" weight="fill" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.action}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.timestamp).toLocaleString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                      {log.result === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" weight="fill" />
                      )}
                      {log.result === 'warning' && (
                        <Warning className="w-4 h-4 text-yellow-600 flex-shrink-0" weight="fill" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDots className="w-5 h-5" />
              Compromissos de Hoje
            </CardTitle>
            <CardDescription>Agenda do dia {new Date().toLocaleDateString('pt-BR')}</CardDescription>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum compromisso agendado para hoje
              </p>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <CalendarDots className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{apt.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{apt.time}</p>
                    </div>
                    <Badge>{apt.type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Tarefas Pendentes
            </CardTitle>
            <CardDescription>Itens que requerem sua atenção</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" weight="fill" />
                <p className="text-sm text-muted-foreground">
                  Todas as tarefas concluídas!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    <Badge variant={
                      task.priority === 'urgent' ? 'destructive' :
                      task.priority === 'high' ? 'default' : 'secondary'
                    }>
                      {task.priority}
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
