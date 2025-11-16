import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Robot, 
  Lightning, 
  CheckCircle, 
  Warning,
  Calendar,
  Database,
  Brain,
  Clock,
  ChartLine,
  Info,
  FileText,
  Gavel,
  Sparkle,
  ArrowsLeftRight,
  ListChecks
} from '@phosphor-icons/react'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'
import AgentMetrics from '@/components/AgentMetrics'
import HumanAgentCollaboration from '@/components/HumanAgentCollaboration'
import AgentStatusFloater from '@/components/AgentStatusFloater'
import MrsJustinEModal from '@/components/MrsJustinEModal'
import { toast } from 'sonner'
import type { Agent } from '@/lib/agents'

const agentIcons: Record<string, React.ComponentType<any>> = {
  'djen-monitor': Database,
  'mrs-justin-e': Brain,
  'petition-writer': Gavel,
  'file-organizer': FileText,
  'harvey-specter': Sparkle,
  'doc-analyzer': FileText,
  'deadline-tracker': Calendar,
  'datajud-query': Database,
}

interface AIAgentsProps {
  onNavigate?: (view: string) => void
}

export default function AIAgents({ onNavigate = () => {} }: AIAgentsProps) {
  const {
    agents,
    taskQueue,
    completedTasks,
    activityLog,
    autoGenerateEnabled,
    toggleAgent,
    toggleAutoGenerate,
    setAgents,
  } = useAutonomousAgents()
  
  const [showCollaborationDemo, setShowCollaborationDemo] = useState(false)
  const [showMrsJustinEModal, setShowMrsJustinEModal] = useState(false)

  if (agents.length === 0) {
    const initialAgents: Agent[] = [
      {
        id: 'harvey-specter',
        name: 'Harvey Specter',
        description: 'Assistente jurídico inteligente que analisa performance, processos, prazos e finanças com insights estratégicos',
        type: 'strategic',
        status: 'active',
        enabled: true,
        lastActivity: 'Pronto para análises estratégicas',
        tasksCompleted: 287,
        tasksToday: 15,
        autonomyLevel: 98,
        capabilities: [
          'Análise de Performance',
          'Insights Estratégicos',
          'Monitoramento de KPIs',
          'Análise Financeira',
          'Gestão de Equipe',
          'Previsões e Tendências',
          'Alertas Inteligentes',
          'Relatórios Executivos'
        ],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
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
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
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
        description: 'Monitora automaticamente o Diário de Justiça Eletrônico Nacional',
        type: 'monitor',
        status: 'active',
        enabled: true,
        lastActivity: 'Verificando novas publicações',
        tasksCompleted: 231,
        tasksToday: 18,
        autonomyLevel: 92,
        capabilities: ['Monitoramento 24/7', 'Detecção de publicações', 'Alertas em tempo real', 'Análise de relevância'],
        nextScheduledRun: 'Contínuo',
        workQueue: [],
        continuousMode: true,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'deadline-tracker',
        name: 'Agente de Gestão de Prazos',
        description: 'Calcula e acompanha prazos processuais automaticamente',
        type: 'calculator',
        status: 'active',
        enabled: true,
        lastActivity: 'Verificando prazos próximos',
        tasksCompleted: 189,
        tasksToday: 14,
        autonomyLevel: 98,
        capabilities: ['Cálculo automático', 'Alertas de vencimento', 'Calendário processual', 'Análise de urgências'],
        nextScheduledRun: 'A cada hora',
        id: 'petition-writer',
        name: 'Agente de Redação de Petições',
        description: 'Auxilia na criação de petições e documentos jurídicos',
      },
      {
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 67,
        type: 'writer',
        status: 'idle',
        capabilities: ['Redação assistida', 'Modelos jurisprudenciais', 'Revisão gramatical', 'Formatação automática'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        tasksToday: 0,
        autonomyLevel: 85,
      },
      {
        id: 'file-organizer',
        continuousMode: false,
        humanInteractionMode: 'collaborate',
        type: 'organizer',
        status: 'idle',
        enabled: false,
        name: 'Agente de Organização de Arquivos',
        description: 'Organiza e categoriza automaticamente documentos do escritório',
        tasksToday: 0,
        autonomyLevel: 88,
        capabilities: ['Classificação automática', 'Renomeação inteligente', 'Detecção de duplicatas', 'Indexação'],
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 54,
        tasksToday: 0,
        autonomyLevel: 88,
        capabilities: ['Classificação automática', 'Renomeação inteligente', 'Detecção de duplicatas', 'Indexação'],
    ]
    setAgents(initialAgents)
  }
        humanInteractionMode: 'collaborate',
      }
  const totalTasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0)
  const avgAutonomy = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.autonomyLevel, 0) / agents.length)

  const activeAgents = agents.filter(a => a.enabled).length
  const queuedTasks = taskQueue.filter(t => t.status === 'queued').length
  const processingTasks = taskQueue.filter(t => t.status === 'processing').length
  const humanInterventionTasks = taskQueue.filter(t => t.status === 'human_intervention').length
    : 0

    const agent = agents.find(a => a.id === agentId)
    toggleAgent(agentId)
    toast.success(agent?.enabled 
 `${agent.name} desativado` 
      : `${agent.name} ativado`
  }
    toggleAgent(agentId)
    toast.success(agent?.enabled 
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
        </p>
    )
  }
      <MrsJustinEModal 
  return (
    <div className="p-6 space-y-6">
        onActivate={() => {
        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
          if (agent && !agent.enabled) {
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
          }
      </div>

      <MrsJustinEModal 
        open={showMrsJustinEModal}
        onClose={() => setShowMrsJustinEModal(false)}
        onActivate={() => {
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            handleToggleAgent('mrs-justin-e')imary" weight="fill" />
          </CardHeader>
          setShowMrsJustinEModal(false)
        }}
      />

            </p>
          </CardContent>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
          </CardHeader>
          <CardContent>
            <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
            <p className="text-xs text-muted-foreground mt-1">
              Operando continuamente
            <div className="text-2xl font-bold">{totalTasksToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
        </Card>
            </p>
          </CardContent>
        </Card>

            <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
          </CardHeader>lex-row items-center justify-between space-y-0 pb-2">
          <CardContent>medium">Fila de Trabalho</CardTitle>
            <div className="text-2xl font-bold">{totalTasksToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Automações executadas
            </p>
          </CardContent>
              {processingTasks} em processamento

          </CardContent>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fila de Trabalho</CardTitle>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardContent>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
            <p className="text-xs text-muted-foreground mt-1">
              {processingTasks} em processamento
            </p>
            <Progress value={avgAutonomy} className="mt-2" />
        </Card>
        </Card>
      </div>

            <CardTitle className="text-sm font-medium">Nível de Autonomia</CardTitle>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Progress value={avgAutonomy} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            </div>
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Info className="w-4 h-4 mr-2" />
              Abrir Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ChartLine className="w-5 h-5 text-accent" weight="fill" />
              <Info className="w-4 h-4 mr-2" />lises Inteligentes</h4>
              Abrir Chat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <ChartLine className="w-5 h-5 text-accent" weight="fill" />
                <h4 className="font-semibold text-foreground">Análises Inteligentes</h4>
              <p className="text-sm text-muted-foreground">
              <p className="text-sm text-muted-foreground">
                Performance, processos, prazos e finanças em um só lugar
              </p>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="w-5 h-5 text-accent" weight="fill" />
                <Brain className="w-5 h-5 text-primary" weight="fill" />
                <h4 className="font-semibold text-foreground">Insights Estratégicos</h4>
              </div>text-muted-foreground">
              <p className="text-sm text-muted-foreground">
                Identifica padrões e sugere otimizações
              </p>
            </div>
        </CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="w-5 h-5 text-accent" weight="fill" />
                <h4 className="font-semibold text-foreground">Respostas Rápidas</h4>
              </div>
          <div className="flex items-start justify-between">
                Análises complexas em questão de segundos
              </p>
                <Brain className="w-8 h-8 text-primary" weight="fill" />
              </div>
        </CardContent>
                <CardTitle className="text-xl">Mrs. Justin-e</CardTitle>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/30">
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => setShowMrsJustinEModal(true)}>
              <Info className="w-4 h-4 mr-2" />
              Saiba Mais
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border">
            </div>
            <Button onClick={() => setShowMrsJustinEModal(true)}>
                <h4 className="font-semibold text-foreground">95% Precisa</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Precisão garantida sem esquecer detalhes importantes
              </p>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-primary" weight="fill" />
                <h4 className="font-semibold text-foreground">Economiza Tempo</h4>
              </div>
              <p className="text-sm text-muted-foreground">

                Precisão garantida sem esquecer detalhes importantes
        <Card className="border-accent bg-accent/5">
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <Warning className="w-5 h-5 text-accent" weight="fill" />
              {humanInterventionTasks} tarefa(s) aguardando conclusão da edição humana
                <h4 className="font-semibold text-foreground">Economiza Tempo</h4>
            <CardDescription>
              <p className="text-sm text-muted-foreground"> humana
                50 horas economizadas a cada 150 intimações
              </p>
        </Card>
      )}
              <div className="flex items-center gap-2 mb-2">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
              </div>fy-between">
              <p className="text-sm text-muted-foreground">
              <CardTitle className="text-base">Geração Automática de Tarefas</CardTitle>
              </p>
                Simula tarefas reais para demonstrar o funcionamento 24/7 dos agentes
              </CardDescription>
            </div>
      </Card>
              checked={autoGenerateEnabled}
              onCheckedChange={toggleAutoGenerate}
        <Card className="border-accent bg-accent/5">
            />
          </div>
        </CardHeader>
        <CardContent>
            </CardTitle>
            <CardDescription>
              Os agentes irão retomar automaticamente após 5 minutos sem atividade humana
              : 'Ative para que os agentes recebam tarefas de demonstração automaticamente.'}
          </p>
        </Card>
      )}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
            <div>">
            <ChartLine className="w-4 h-4 mr-2" />
              <CardDescription>
                Simula tarefas reais para demonstrar o funcionamento 24/7 dos agentes
          <TabsTrigger value="collaboration">
            <ArrowsLeftRight className="w-4 h-4 mr-2" />
            Demo Colaboração
          </TabsTrigger>
          <TabsTrigger value="activity">
            Atividade em Tempo Real
            />gth > 0 && (
              <Badge variant="secondary" className="ml-2">{activityLog.length}</Badge>
        </CardHeader>
          </TabsTrigger>
          <TabsTrigger value="queue">
            {autoGenerateEnabled 
            {(queuedTasks + processingTasks) > 0 && (
              : 'Ative para que os agentes recebam tarefas de demonstração automaticamente.'}
          </p>
        </CardContent>
          <TabsTrigger value="completed">

      <Tabs defaultValue="agents" className="space-y-4">
              <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="metrics">
        </TabsList>

          </TabsTrigger>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const IconComponent = agentIcons[agent.id] || Robot
          </TabsTrigger>
                ? agent.status === 'processing' 
                  ? 'text-accent' 
                  : 'text-green-600'
                : 'text-muted-foreground'

              return (
                <Card key={agent.id} className={agent.enabled ? 'border-primary/30' : ''}>
            Fila de Tarefas
            {(queuedTasks + processingTasks) > 0 && (
                      <div className="flex items-start gap-3">
            )} rounded-lg ${agent.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
          </TabsTrigger>l" />
          <TabsTrigger value="completed">
            Histórico
            {completedTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2">{completedTasks.length}</Badge>
            )}gent.description}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {agent.id)}
              const IconComponent = agentIcons[agent.id] || Robot
              const statusColor = agent.enabled 
                ? agent.status === 'processing' 
                  ? 'text-accent' 
                  : 'text-green-600'-sm">
                : 'text-muted-foreground'
variant={agent.enabled ? 'default' : 'secondary'}>
              return ( : 'Pausado'}
                <Card key={agent.id} className={agent.enabled ? 'border-primary/30' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${agent.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <IconComponent className={`w-6 h-6 ${statusColor}`} weight="fill" />
                        </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{agent.tasksToday}</div>
                          <CardDescription className="text-xs mt-1">
                            {agent.description}
                          </CardDescription>
                        <div className="text-lg font-bold text-foreground">{agent.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={() => handleToggleAgent(agent.id)}>
                      />ext-muted-foreground">Autonomia</div>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Capacidades:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 4).map((cap, idx) => (
                    </div> className="text-xs">
                    <div className="flex items-center justify-between text-sm">
                          </Badge>
                      <span className="text-foreground text-xs">{agent.lastActivity}</span>
                    </div>&& (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                        <div className="text-lg font-bold text-foreground">{agent.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{agent.autonomyLevel}%</div>
                        <div className="text-xs text-muted-foreground">Autonomia</div>

        <TabsContent value="metrics" className="space-y-4">
                    <div className="pt-2">
            agents={agents}
            completedTasks={completedTasks}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 4).map((cap, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade registrada ainda
                  </div>
                ) : (
            agents={agents}
                    {activityLog.map((log) => {
                      const agent = agents.find(a => a.id === log.agentId)
          />
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <HumanAgentCollaboration />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Atividades</CardTitle>
                          </div>
                          <Badge
                            variant={
                              log.result === 'success' ? 'default' : 
                              log.result === 'warning' ? 'secondary' : 
                              'destructive'
                            }
                            className="flex-shrink-0"
                          >
                            {log.result}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fila de Tarefas</CardTitle>
              <CardDescription>
                Tarefas aguardando processamento pelos agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                            }
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa na fila
                  </div>
                ) : (
                  <div className="space-y-2">
                    {taskQueue.map((task) => {
                      const agent = agents.find(a => a.id === task.agentId)
                      const IconComponent = agentIcons[task.agentId] || Robot
                      
                      return (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                          <IconComponent className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
        </TabsContent>-w-0">
                        <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Tarefas Completadas</CardTitle>
              <CardDescription>
                Últimas 100 tarefas concluídas pelos agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa completada ainda
                  </div>
                      return (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                          <IconComponent className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criada em: {new Date(task.createdAt).toLocaleString('pt-BR')}
                          <IconComponent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Concluída em: {task.completedAt ? new Date(task.completedAt).toLocaleString('pt-BR') : '-'}
                            </p>
                          </div>
                          <Badge variant="default" className="flex-shrink-0 bg-green-600">
                            Completa
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                      )
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgentStatusFloater agents={agents} />
    </div>
  )
}
            </CardHeader>            <CardContent>
              <ScrollArea className="h-[400px]">
                {completedTasks.length === 0 ? (
                      return (                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                          <IconComponent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Concluída em: {task.completedAt ? new Date(task.completedAt).toLocaleString('pt-BR') : '-'}
                            </p>
  )

