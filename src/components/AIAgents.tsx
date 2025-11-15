import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Robot, 
  Lightning, 
  CheckCircle, 
  Warning,
  FileText,
  Gavel,
  Calendar,
  Database,
  Sparkle,
  Pause,
  Play
} from '@phosphor-icons/react'
import { toast } from 'sonner'

interface AIAgent {
  id: string
  name: string
  description: string
  icon: any
  status: 'active' | 'idle' | 'processing' | 'paused'
  enabled: boolean
  lastActivity: string
  tasksCompleted: number
  tasksToday: number
  autonomyLevel: number
  nextScheduledRun?: string
  capabilities: string[]
}

interface ActivityLog {
  id: string
  agentId: string
  timestamp: string
  action: string
  result: 'success' | 'warning' | 'error'
}

export default function AIAgents() {
  const [agents, setAgents] = useKV<AIAgent[]>('ai-agents', [
    {
      id: 'doc-analyzer',
      name: 'Agente de Análise Documental',
      description: 'Analisa automaticamente expedientes, intimações e documentos do PJe',
      icon: FileText,
      status: 'active',
      enabled: true,
      lastActivity: 'Analisando novos documentos',
      tasksCompleted: 143,
      tasksToday: 7,
      autonomyLevel: 95,
      nextScheduledRun: '14:00',
      capabilities: ['Extração de dados', 'Sumarização', 'Classificação de documentos']
    },
    {
      id: 'djen-monitor',
      name: 'Agente de Monitoramento DJEN',
      description: 'Monitora intimações no Diário de Justiça Eletrônico 24/7',
      icon: Gavel,
      status: 'active',
      enabled: true,
      lastActivity: 'Verificando intimações recentes',
      tasksCompleted: 89,
      tasksToday: 12,
      autonomyLevel: 100,
      nextScheduledRun: 'A cada hora',
      capabilities: ['Busca automática', 'Notificação de intimações', 'Cálculo de prazos']
    },
    {
      id: 'deadline-tracker',
      name: 'Agente de Gestão de Prazos',
      description: 'Calcula, monitora e alerta sobre prazos processuais críticos',
      icon: Calendar,
      status: 'active',
      enabled: true,
      lastActivity: 'Verificando prazos fatais',
      tasksCompleted: 234,
      tasksToday: 18,
      autonomyLevel: 98,
      nextScheduledRun: 'Diariamente às 08:00',
      capabilities: ['Cálculo automático', 'Alertas de vencimento', 'Registro histórico']
    },
    {
      id: 'petition-writer',
      name: 'Agente de Redação Jurídica',
      description: 'Redige minutas de petições e manifestações com base em modelos',
      icon: Sparkle,
      status: 'idle',
      enabled: true,
      lastActivity: 'Aguardando solicitações',
      tasksCompleted: 67,
      tasksToday: 3,
      autonomyLevel: 85,
      capabilities: ['Redação assistida', 'Padronização de estilo', 'Sugestões contextuais']
    },
    {
      id: 'datajud-query',
      name: 'Agente de Consultas DataJud',
      description: 'Realiza consultas automáticas no DataJud para acompanhamento processual',
      icon: Database,
      status: 'idle',
      enabled: false,
      lastActivity: 'Pausado pelo usuário',
      tasksCompleted: 45,
      tasksToday: 0,
      autonomyLevel: 90,
      nextScheduledRun: 'Pausado',
      capabilities: ['Consulta automática', 'Extração de andamentos', 'Consolidação de dados']
    }
  ])

  const [activityLog, setActivityLog] = useKV<ActivityLog[]>('agent-activity-log', [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((currentAgents) => 
        (currentAgents || []).map(agent => {
          if (agent.enabled && agent.status === 'active' && Math.random() > 0.6) {
            const activities = [
              'Processando novos documentos',
              'Verificando atualizações',
              'Analisando expedientes',
              'Calculando prazos',
              'Monitorando intimações',
              'Consolidando relatórios',
              'Sincronizando dados'
            ]
            
            const newActivity = activities[Math.floor(Math.random() * activities.length)]
            
            if (Math.random() > 0.7) {
              const log: ActivityLog = {
                id: crypto.randomUUID(),
                agentId: agent.id,
                timestamp: new Date().toISOString(),
                action: newActivity,
                result: Math.random() > 0.9 ? 'warning' : 'success'
              }
              setActivityLog((current) => [log, ...(current || [])].slice(0, 50))
            }
            
            return {
              ...agent,
              lastActivity: newActivity,
              tasksToday: agent.tasksToday + (Math.random() > 0.5 ? 1 : 0)
            }
          }
          return agent
        })
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const toggleAgent = (agentId: string) => {
    setAgents((currentAgents) =>
      (currentAgents || []).map(agent => {
        if (agent.id === agentId) {
          const newEnabled = !agent.enabled
          toast.success(
            newEnabled 
              ? `${agent.name} ativado com sucesso` 
              : `${agent.name} pausado`
          )
          return {
            ...agent,
            enabled: newEnabled,
            status: newEnabled ? 'active' : 'paused',
            lastActivity: newEnabled ? 'Iniciando...' : 'Pausado pelo usuário'
          }
        }
        return agent
      })
    )
  }

  const totalTasksToday = (agents || []).reduce((sum, a) => sum + a.tasksToday, 0)
  const activeAgents = (agents || []).filter(a => a.enabled && a.status === 'active').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie e monitore seus assistentes inteligentes operando 24/7
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Lightning className="w-4 h-4 text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}/{(agents || []).length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Operando continuamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Hoje</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Automações executadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível de Autonomia</CardTitle>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((agents || []).reduce((sum, a) => sum + a.autonomyLevel, 0) / (agents || []).length)}%
            </div>
            <Progress 
              value={(agents || []).reduce((sum, a) => sum + a.autonomyLevel, 0) / (agents || []).length} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Agentes Disponíveis</h2>
          {(agents || []).map((agent) => {
            const Icon = agent.icon
            return (
              <Card key={agent.id} className={agent.enabled ? 'border-primary/30' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${agent.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-6 h-6 ${agent.enabled ? 'text-primary' : 'text-muted-foreground'}`} weight="fill" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <CardDescription className="mt-1">{agent.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={() => toggleAgent(agent.id)}
                        id={`agent-${agent.id}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      agent.status === 'active' ? 'bg-green-500 animate-pulse' : 
                      agent.status === 'processing' ? 'bg-yellow-500 animate-pulse' : 
                      agent.status === 'paused' ? 'bg-gray-400' :
                      'bg-blue-400'
                    }`} />
                    <span className="text-sm text-muted-foreground">
                      {agent.lastActivity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Tarefas Hoje</p>
                      <p className="text-lg font-semibold text-foreground">{agent.tasksToday}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold text-foreground">{agent.tasksCompleted}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Autonomia</p>
                      <p className="text-xs font-medium">{agent.autonomyLevel}%</p>
                    </div>
                    <Progress value={agent.autonomyLevel} className="h-1.5" />
                  </div>

                  {agent.nextScheduledRun && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Próxima execução: <span className="font-medium text-foreground">{agent.nextScheduledRun}</span>
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-xs font-medium text-foreground mb-2">Capacidades:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Registro de Atividades</h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas Atividades</CardTitle>
              <CardDescription>Ações executadas pelos agentes em tempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {(activityLog || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    As atividades dos agentes aparecerão aqui
                  </p>
                ) : (
                  (activityLog || []).map((log) => {
                    const agent = (agents || []).find(a => a.id === log.agentId)
                    const Icon = agent?.icon || Robot
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
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

          <Card className="mt-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                Benefícios da Automação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm text-foreground">Operação 24/7 sem intervenção humana</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm text-foreground">Redução de erros manuais e maior precisão</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm text-foreground">Economia de tempo em tarefas repetitivas</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm text-foreground">Monitoramento contínuo de prazos e intimações</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                <p className="text-sm text-foreground">Padronização e qualidade nas entregas</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
