import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Clock,
  Robot,
  TrendUp,
  FileText,
  Warning,
  CalendarDots
} from '@phosphor-icons/react'
import type { User, Process, Task, Appointment } from '@/types'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [processes] = useKV<Process[]>('processes', [])
  const [tasks] = useKV<Task[]>('tasks', [])
  const [appointments] = useKV<Appointment[]>('appointments', [])
  const [agents] = useKV<any[]>('agents', [])

  const today = new Date().toISOString().split('T')[0]

  const processStats = {
    total: (processes || []).length,
    emAndamento: (processes || []).filter(p => p.status === 'em-andamento').length,
    concluido: (processes || []).filter(p => p.status === 'concluido').length,
  }

  const taskStats = {
    total: (tasks || []).length,
    completed: (tasks || []).filter(t => t.completed).length,
    pending: (tasks || []).filter(t => !t.completed).length,
  }

  const completionRate = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0

  const activeAgents = (agents || []).filter(a => a.enabled).length

  const urgentTasks = (tasks || []).filter(t => !t.completed && t.priority === 'urgent')
  
  const todayAppointments = (appointments || []).filter(a => a.date === today)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">
          Bem-vindo, {user.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Clock className="w-5 h-5 text-destructive mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.dueDate ? `Vence em ${new Date(task.dueDate).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
                      </p>
                    </div>
                    <Badge variant="destructive">Urgente</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDots className="w-5 h-5 text-primary" />
              Compromissos de Hoje
            </CardTitle>
            <CardDescription>
              {todayAppointments.length} compromissos agendados
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
                {todayAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                    <CalendarDots className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{appointment.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {appointment.time} {appointment.location && `- ${appointment.location}`}
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
