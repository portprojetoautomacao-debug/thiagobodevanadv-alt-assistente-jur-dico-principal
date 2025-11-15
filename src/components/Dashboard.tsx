import { useKV } from '@github/spark/hooks'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
  CheckCircle,
  Clock, 
  Brain,
  TrendUp
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
          Bem-vindo, {user.name}

        </p>

        <Card>
            <CardTitle className="text-sm font-medium">P
          </CardHeader>
    

          </CardContent>

          <CardHeader className="flex flex-row items-center justify-between space-y
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
   

            </p>
        </Card>
    : 0

  const activeAgents = agents.filter(a => a.status === 'active').length
  const totalAgentTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0)
  const recentActivities = activityLog.slice(0, 5)


    <div className="p-6 space-y-6">
           
          <CardContent>
            <Progress value={com
        </h1>

        <Card>
            
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
                      <p className="text-sm font-medium">{task.titl
          </CardHeader>
                    </d
            <div className="text-2xl font-bold">{processStats.emAndamento}</div>
            )}
              {processStats.aguardando} aguardando
        <Card>
          </CardContent>
              S

            </
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
                      a
                    }`}
                      <p className="text-sm font-medium">{agent.name}</p>
                    </div>
                  <Badge variant="outline" 
                
              ))}
        </Card>

          </Ca
      </div>
      <Card>
          <CardTitle className="flex items-center gap-2">
            Atividade R
          <CardContent>
          {recentActivities.length === 0 ? (
          ) : (
              {recentActivities.map((log) => (
                
                    <p c
               

              
          )}
      </Card>
  )










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

              </div>

          </CardContent>


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
                      <p className="text-xs text-muted-foreground">{agent.currentTask || 'Aguardando'}</p>
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

  )

