import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Clock,
  Stack,
  Brain,
  ListChecks,
  ClockCounterClockwise,
  ArrowsLeftRight,
  Info
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'
import { createAgentTask } from '@/lib/agents'
import type { Agent } from '@/lib/agents'
import HumanAgentCollaboration from '@/components/HumanAgentCollaboration'
import MrsJustinEModal from '@/components/MrsJustinEModal'

const agentIcons: Record<string, any> = {
  'doc-analyzer': FileText,
  'djen-monitor': Gavel,
  'deadline-tracker': Calendar,
  'petition-writer': Sparkle,
  'datajud-query': Database,
  'file-organizer': Stack,
  'mrs-justin-e': Brain,
}

export default function AIAgents() {
  const { 
    agents, 
    taskQueue, 
    completedTasks, 
    activityLog, 
    toggleAgent,
    addTask,
    setAgents 
  } = useAutonomousAgents()
  
  const [showCollaborationDemo, setShowCollaborationDemo] = useState(false)
  const [showMrsJustinEModal, setShowMrsJustinEModal] = useState(false)

  useEffect(() => {
    if (agents.length === 0) {
      setAgents([
        {
          id: 'mrs-justin-e',
          name: 'Mrs. Justin-e',
          description: 'Analiso intimações com 95% de precisão em menos de 1 minuto, economizando 50 horas a cada 150 intimações',
          type: 'analyzer',
          status: 'active',
          enabled: true,
          lastActivity: 'Aguardando intimações para análise',
          tasksCompleted: 150,
          tasksToday: 12,
          autonomyLevel: 95,
          capabilities: [
            'Interpreta intimações',
            'Conta prazos',
            'Orienta Controller',
            'Sugere Tarefas',
            'Sistema D-1, D-2 ou D-n',
            'Prepara Atendimentos',
            'Cria Workflow de Controladoria',
            'Refaz Análise após nova informação'
          ],
          nextScheduledRun: 'Contínuo',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'collaborate',
        },
        {
          id: 'doc-analyzer',
          name: 'Agente de Análise Documental',
          description: 'Analisa automaticamente expedientes, intimações e documentos do PJe 24/7',
          type: 'analyzer',
          status: 'active',
          enabled: true,
          lastActivity: 'Aguardando documentos para análise',
          tasksCompleted: 143,
          tasksToday: 7,
          autonomyLevel: 95,
          capabilities: ['Extração de dados', 'Sumarização', 'Classificação de documentos', 'Detecção de prazos'],
          nextScheduledRun: 'Contínuo',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'collaborate',
        },
        {
          id: 'djen-monitor',
          name: 'Agente de Monitoramento DJEN',
          description: 'Monitora intimações no Diário de Justiça Eletrônico continuamente',
          type: 'monitor',
          status: 'active',
          enabled: true,
          lastActivity: 'Verificando novas intimações',
          tasksCompleted: 89,
          tasksToday: 12,
          autonomyLevel: 100,
          capabilities: ['Busca automática', 'Notificação de intimações', 'Cálculo de prazos', 'Extração de dados'],
          nextScheduledRun: 'A cada hora',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'queue',
        },
        {
          id: 'deadline-tracker',
          name: 'Agente de Gestão de Prazos',
          description: 'Calcula, monitora e alerta sobre prazos processuais críticos automaticamente',
          type: 'calculator',
          status: 'active',
          enabled: true,
          lastActivity: 'Verificando prazos fatais',
          tasksCompleted: 234,
          tasksToday: 18,
          autonomyLevel: 98,
          capabilities: ['Cálculo automático', 'Alertas de vencimento', 'Registro histórico', 'Validação de feriados'],
          nextScheduledRun: 'Diariamente às 08:00',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'collaborate',
        },
        {
          id: 'petition-writer',
          name: 'Agente de Redação Jurídica',
          description: 'Redige minutas de petições e manifestações com base em modelos e contexto processual',
          type: 'writer',
          status: 'idle',
          enabled: true,
          lastActivity: 'Aguardando solicitações',
          tasksCompleted: 67,
          tasksToday: 3,
          autonomyLevel: 85,
          capabilities: ['Redação assistida', 'Padronização de estilo', 'Sugestões contextuais', 'Revisão gramatical'],
          nextScheduledRun: 'Sob demanda',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'collaborate',
        },
        {
          id: 'datajud-query',
          name: 'Agente de Consultas DataJud',
          description: 'Realiza consultas automáticas no DataJud para acompanhamento processual',
          type: 'researcher',
          status: 'idle',
          enabled: false,
          lastActivity: 'Pausado pelo usuário',
          tasksCompleted: 45,
          tasksToday: 0,
          autonomyLevel: 90,
          capabilities: ['Consulta automática', 'Extração de andamentos', 'Consolidação de dados', 'Detecção de mudanças'],
          nextScheduledRun: 'Pausado',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'queue',
        },
        {
          id: 'file-organizer',
          name: 'Agente Organizador de Arquivos',
          description: 'Organiza, categoriza e indexa documentos processuais automaticamente',
          type: 'organizer',
          status: 'active',
          enabled: true,
          lastActivity: 'Organizando documentos',
          tasksCompleted: 312,
          tasksToday: 24,
          autonomyLevel: 92,
          capabilities: ['Categorização automática', 'Indexação', 'Renomeação inteligente', 'Arquivamento'],
          nextScheduledRun: 'Contínuo',
          workQueue: [],
          continuousMode: true,
          humanInteractionMode: 'queue',
        },
      ])
    }
  }, [agents.length, setAgents])

  const handleToggleAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (agent) {
      toggleAgent(agentId)
      toast.success(
        agent.enabled 
          ? `${agent.name} pausado` 
          : `${agent.name} ativado - operando 24/7`
      )
    }
  }

  const totalTasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0)
  const activeAgents = agents.filter(a => a.enabled && a.status !== 'paused').length
  const avgAutonomy = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.autonomyLevel, 0) / agents.length)
    : 0

  const queuedTasks = taskQueue.filter(t => t.status === 'queued').length
  const processingTasks = taskQueue.filter(t => t.status === 'processing').length
  const humanInterventionTasks = taskQueue.filter(t => t.status === 'human_intervention').length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
        <p className="text-muted-foreground mt-1">
          Sistema de agentes trabalhando 24/7 sem intervenção humana
        </p>
      </div>

      <MrsJustinEModal 
        open={showMrsJustinEModal}
        onOpenChange={setShowMrsJustinEModal}
        onActivate={() => {
          const agent = agents.find(a => a.id === 'mrs-justin-e')
          if (agent && !agent.enabled) {
            handleToggleAgent('mrs-justin-e')
          }
          toast.success('Mrs. Justin-e ativada! Pronta para analisar intimações.')
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Lightning className="w-4 h-4 text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}/{agents.length}</div>
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
            <CardTitle className="text-sm font-medium">Fila de Trabalho</CardTitle>
            <ListChecks className="w-4 h-4 text-primary" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedTasks + processingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {processingTasks} em processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nível de Autonomia</CardTitle>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAutonomy}%</div>
            <Progress value={avgAutonomy} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Brain className="w-8 h-8 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-xl">Mrs. Justin-e</CardTitle>
                <CardDescription className="mt-1">
                  Especialista em análise de intimações - 95% de precisão em menos de 1 minuto
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowMrsJustinEModal(true)}>
              <Info className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                <h4 className="font-semibold text-foreground">Super Rápida</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Análise em menos de 1 minuto vs. 8 minutos humanos
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" weight="fill" />
                <h4 className="font-semibold text-foreground">95% Precisa</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Precisão garantida sem esquecer detalhes importantes
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" weight="fill" />
                <h4 className="font-semibold text-foreground">Economiza Tempo</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                50 horas economizadas a cada 150 intimações
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {humanInterventionTasks > 0 && (
        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Warning className="w-5 h-5 text-accent" weight="fill" />
              {humanInterventionTasks} tarefa(s) aguardando conclusão da edição humana
            </CardTitle>
            <CardDescription>
              Os agentes irão retomar automaticamente após 5 minutos sem atividade humana
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="collaboration">
            <ArrowsLeftRight className="w-4 h-4 mr-2" />
            Demo Colaboração
          </TabsTrigger>
          <TabsTrigger value="activity">
            Atividade em Tempo Real
            {activityLog.length > 0 && (
              <Badge variant="secondary" className="ml-2">{activityLog.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="queue">
            Fila de Tarefas
            {(queuedTasks + processingTasks) > 0 && (
              <Badge variant="secondary" className="ml-2">{queuedTasks + processingTasks}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Histórico
            {completedTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaboration" className="space-y-4">
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowsLeftRight className="w-6 h-6 text-accent" weight="bold" />
                  Demonstração de Colaboração Humano-Agente
                </CardTitle>
                <CardDescription>
                  Veja como os agentes detectam e colaboram com intervenções humanas em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Este demo simula como um agente autônomo trabalha continuamente, mas inteligentemente 
                  pausa quando você começa a editar um documento, aguardando você terminar antes de retomar 
                  o trabalho automaticamente.
                </p>
                <Button 
                  onClick={() => setShowCollaborationDemo(!showCollaborationDemo)}
                  variant={showCollaborationDemo ? 'outline' : 'default'}
                >
                  {showCollaborationDemo ? 'Ocultar Demo' : 'Iniciar Demonstração'}
                </Button>
              </CardContent>
            </Card>

            {showCollaborationDemo && (
              <HumanAgentCollaboration
                agentName="Agente de Redação Jurídica"
                taskDescription="minutas de petição"
                onComplete={() => {
                  toast.success('Demo concluída! Veja como a colaboração funciona perfeitamente.')
                  setTimeout(() => setShowCollaborationDemo(false), 3000)
                }}
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Como Funciona a Colaboração</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Cenário 1: Modo Colaborativo</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">1</span>
                        </div>
                        <p>Agente está redigindo uma petição automaticamente</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">2</span>
                        </div>
                        <p>Você abre o documento e começa a editar</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">3</span>
                        </div>
                        <p>Agente detecta a edição e entra em modo de espera</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">4</span>
                        </div>
                        <p>Após 5s sem atividade, agente retoma o trabalho</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Cenário 2: Modo Enfileirar</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">1</span>
                        </div>
                        <p>Agente está monitorando intimações DJEN</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">2</span>
                        </div>
                        <p>Você adiciona filtros personalizados manualmente</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">3</span>
                        </div>
                        <p>Agente adiciona a próxima busca à fila de trabalho</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-accent">4</span>
                        </div>
                        <p>Processa a fila quando você terminar</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Benefícios da Colaboração</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" weight="fill" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Zero Conflitos</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Agente nunca sobrescreve seu trabalho
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" weight="fill" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Continuidade</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Trabalho retoma automaticamente após você
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" weight="fill" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Transparência</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Você sempre sabe o que o agente está fazendo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const Icon = agentIcons[agent.id] || Robot
              return (
                <Card key={agent.id} className={agent.enabled ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : ''}>
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
                        {agent.id === 'mrs-justin-e' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMrsJustinEModal(true)}
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        )}
                        <Switch
                          checked={agent.enabled}
                          onCheckedChange={() => handleToggleAgent(agent.id)}
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
                        agent.status === 'waiting_human' ? 'bg-orange-500 animate-pulse' :
                        agent.status === 'paused' ? 'bg-gray-400' :
                        'bg-blue-400'
                      }`} />
                      <span className="text-sm text-muted-foreground">
                        {agent.lastActivity}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Hoje</p>
                        <p className="text-lg font-semibold text-foreground">{agent.tasksToday}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold text-foreground">{agent.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fila</p>
                        <p className="text-lg font-semibold text-foreground">{agent.workQueue.length}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-muted-foreground">Autonomia</p>
                        <p className="text-xs font-medium">{agent.autonomyLevel}%</p>
                      </div>
                      <Progress value={agent.autonomyLevel} className="h-1.5" />
                    </div>

                    {agent.currentTask && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
                          <Brain className="w-4 h-4 text-primary animate-pulse" weight="fill" />
                          <p className="text-xs font-medium text-foreground">
                            Processando tarefa...
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border">
                      <p className="text-xs font-medium text-foreground mb-2">Modo de Operação:</p>
                      <Badge variant="outline" className="text-xs">
                        {agent.continuousMode ? '24/7 Contínuo' : 'Sob Demanda'}
                      </Badge>
                      <Badge variant="outline" className="text-xs ml-2">
                        {agent.humanInteractionMode === 'collaborate' ? 'Colaborativo' : 
                         agent.humanInteractionMode === 'queue' ? 'Enfileira' : 'Pausa'}
                      </Badge>
                    </div>

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

          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-accent" weight="fill" />
                Como Funcionam os Agentes Autônomos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Operação 24/7 sem intervenção</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os agentes trabalham continuamente, processando documentos, monitorando prazos e executando tarefas mesmo quando você não está usando o sistema
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Colaboração inteligente</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quando você edita um documento ou tarefa, o agente detecta e aguarda você terminar. Após 5 minutos sem atividade, ele retoma automaticamente
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Fila de tarefas prioritizada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tarefas críticas são processadas primeiro. Você pode ver e gerenciar a fila de trabalho de cada agente em tempo real
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Aprendizado e melhoria contínua</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Os agentes registram todas as ações e resultados, permitindo análise de desempenho e otimização contínua do fluxo de trabalho
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividade em Tempo Real</CardTitle>
              <CardDescription>Ações executadas pelos agentes nos últimos minutos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {activityLog.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      As atividades dos agentes aparecerão aqui em tempo real
                    </p>
                  </div>
                ) : (
                  activityLog.map((log) => {
                    const agent = agents.find(a => a.id === log.agentId)
                    const Icon = agent ? agentIcons[agent.id] || Robot : Robot
                    return (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors">
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
                        {log.result === 'error' && (
                          <Warning className="w-4 h-4 text-destructive flex-shrink-0" weight="fill" />
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fila de Tarefas dos Agentes</CardTitle>
              <CardDescription>Tarefas aguardando processamento ou em execução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {taskQueue.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" weight="fill" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa na fila no momento
                    </p>
                  </div>
                ) : (
                  taskQueue.map((task) => {
                    const agent = agents.find(a => a.id === task.agentId)
                    const Icon = agent ? agentIcons[agent.id] || Robot : Robot
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <Badge variant={
                              task.priority === 'critical' ? 'destructive' :
                              task.priority === 'high' ? 'default' :
                              task.priority === 'medium' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Tipo: {task.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Criado: {new Date(task.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={
                          task.status === 'processing' ? 'default' :
                          task.status === 'queued' ? 'secondary' :
                          task.status === 'human_intervention' ? 'outline' : 'secondary'
                        }>
                          {task.status === 'processing' ? 'Processando' :
                           task.status === 'queued' ? 'Na fila' :
                           task.status === 'human_intervention' ? 'Intervenção humana' : task.status}
                        </Badge>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico de Tarefas Concluídas</CardTitle>
              <CardDescription>Últimas {completedTasks.length} tarefas executadas com sucesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <ClockCounterClockwise className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      O histórico de tarefas aparecerá aqui
                    </p>
                  </div>
                ) : (
                  completedTasks.slice(0, 50).map((task) => {
                    const agent = agents.find(a => a.id === task.agentId)
                    const Icon = agent ? agentIcons[agent.id] || Robot : Robot
                    return (
                      <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                        <Icon className="w-4 h-4 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" weight="fill" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <Badge variant="outline" className="text-xs bg-green-100 dark:bg-green-950">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Tipo: {task.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Concluído: {task.completedAt && new Date(task.completedAt).toLocaleString('pt-BR')}
                          </p>
                          {task.completedAt && task.startedAt && (
                            <p className="text-xs text-muted-foreground">
                              Duração: {Math.round((new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 1000)}s
                            </p>
                          )}
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" weight="fill" />
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
