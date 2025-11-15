import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
import { Button } from '@/components/ui/button'
  Warning
  Clock, 
  CheckSquare,
  ArrowRigh
} from '@p
import { useAut
interface Das
}
export d
  const [app
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
    <div className="p-6 space-y-6">
    aguardando: (processes || []).filter(p => p.status === 'aguardando').length,
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
  }

  const completionRate = (tasks || []).length > 0 
    ? Math.round(((tasks || []).filter(t => t.completed).length / (tasks || []).length) * 100)
       
  
  const activeAgents = aiAgents.filter(a => a.status === 'active').length
  const totalAgentTasks = aiAgents.reduce((sum, a) => sum + a.tasksCompleted, 0)

  return (
              <span className="w-2 
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Bem-vindo, {user.name}
          <di
        <p className="text-muted-foreground mt-1">
          Seus agentes de IA autônomos estão trabalhando 24/7 para você
        </p>
            

                  </Badge>
              </div>
          </div>
            <Button variant="ghost" className="w-full mt-3" size="sm
              <ArrowRight className
          )}
      </Card>
      <div className=
          <CardHeader
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          <CardContent>
            <p className="text-xs text-muted-foreground mt-1">
            </p>
        </Card>
        <Card>
            <CardTit
          </CardHe
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
              {urgentTasks.length} urgentes
          </CardCon

          <CardHeader className="flex flex-row items-center justify-between space-y
            <Calenda
          <CardCon
            <p c
            </p>
        </Card>
        <Card>
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
          </CardHeader>
            <div className="text-2xl font-bold">{completionRate}%</div>
          </CardContent>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardHeader>
              <Clock cla
            </CardTi
          </Car
            {urg
                Nenhum
            )

                    <Warning className="w-5 h-5 text-destructive flex-shrink
              
                        <p className="text-xs text-muted-foreground mt-1">
                        </p>
                    </div>
                  </div
              </div>
          </CardContent>

          <CardHeader>
              <S
            </CardTitle>
          </Car

              
                </p>
                recentActivities.map((log) => {
                  return (
                      <
                       
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
              </div>
              <div className="space-y-3">
                  <div key={task.id} classN
                      <p cl
                        
                        </p>
                    </d
                      t
                    }>
                    </Badge>
                ))}
            )}
        </Card>
    </div>
}


























































































































