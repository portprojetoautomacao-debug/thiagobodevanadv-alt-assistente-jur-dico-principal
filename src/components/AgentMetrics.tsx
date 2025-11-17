import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendUp, 
  Clock, 
  CheckCircle, 
  Lightning,
  ChartLine,
  Timer
} from '@phosphor-icons/react'
import type { Agent, AgentTask } from '@/lib/agents'

interface AgentMetricsProps {
  agents: Agent[]
  completedTasks: AgentTask[]
  activityLog: Array<{
    id: string
    agentId: string
    timestamp: string
    action: string
    result: 'success' | 'warning' | 'error'
  }>
}

export default function AgentMetrics({ agents, completedTasks, activityLog }: AgentMetricsProps) {
  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const totalToday = agents.reduce((sum, a) => sum + a.tasksToday, 0)
  const averageAutonomy = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.autonomyLevel, 0) / agents.length)
    : 0

  const successRate = activityLog.length > 0
    ? Math.round((activityLog.filter(log => log.result === 'success').length / activityLog.length) * 100)
    : 0

  const estimatedTimeSaved = totalTasks * 10
  const hoursPerTask = 10 / 60
  const totalHoursSaved = (totalTasks * hoursPerTask).toFixed(1)

  const getTasksLast24Hours = () => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return completedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) > last24h
    ).length
  }

  const getAverageProcessingTime = () => {
    const tasksWithTime = completedTasks.filter(
      task => task.startedAt && task.completedAt
    )

    if (tasksWithTime.length === 0) return 0

    const totalTime = tasksWithTime.reduce((sum, task) => {
      const start = new Date(task.startedAt!).getTime()
      const end = new Date(task.completedAt!).getTime()
      return sum + (end - start)
    }, 0)

    return Math.round(totalTime / tasksWithTime.length / 1000)
  }

  const tasks24h = getTasksLast24Hours()
  const avgProcessingTime = getAverageProcessingTime()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{successRate}%</div>
            <Progress value={successRate} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {activityLog.filter(log => log.result === 'success').length} de {activityLog.length} ações bem-sucedidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" weight="fill" />
              Tempo Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{avgProcessingTime}s</div>
            <p className="text-xs text-muted-foreground">
              Tempo médio de processamento por tarefa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightning className="w-4 h-4 text-accent" weight="fill" />
              Produtividade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-2">{tasks24h}</div>
            <p className="text-xs text-muted-foreground">
              Tarefas completadas nas últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Timer className="w-5 h-5 text-green-600" weight="fill" />
            Economia de Tempo
          </CardTitle>
          <CardDescription>
            Tempo economizado pela automação dos agentes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Minutos economizados</p>
              <p className="text-2xl font-bold text-green-600">{estimatedTimeSaved}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Horas totais</p>
              <p className="text-2xl font-bold text-green-600">{totalHoursSaved}h</p>
            </div>
          </div>
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              Baseado em 10 minutos por tarefa se feita manualmente por humanos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ChartLine className="w-5 h-5 text-primary" weight="fill" />
            Desempenho por Agente
          </CardTitle>
          <CardDescription>
            Estatísticas individuais de cada agente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {agents.map((agent) => {
            const agentTasks = completedTasks.filter(t => t.agentId === agent.id)
            const agentLogs = activityLog.filter(l => l.agentId === agent.id)
            const agentSuccessRate = agentLogs.length > 0
              ? Math.round((agentLogs.filter(l => l.result === 'success').length / agentLogs.length) * 100)
              : 0

            return (
              <div key={agent.id} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{agent.name}</h4>
                    {agent.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-900">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendUp className="w-3 h-3 text-green-600" weight="fill" />
                    <span className="text-xs font-medium text-green-600">{agentSuccessRate}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Hoje</p>
                    <p className="font-semibold text-foreground">{agent.tasksToday}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-foreground">{agent.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Autonomia</p>
                    <p className="font-semibold text-foreground">{agent.autonomyLevel}%</p>
                  </div>
                </div>
                <Progress value={agent.autonomyLevel} className="h-1 mt-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
