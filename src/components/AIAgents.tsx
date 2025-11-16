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
  Brain,
  Clock,
  ChartLine,
  ChartLine,
  Info,ht,
} from '@phosphor-icons/react'
  ListChecks,usAgents } from '@/hooks/use-autonomous-agents'
  FileTextrom '@/components/AgentMetrics'
import HumanAgentCollaboration from '@/components/HumanAgentCollaboration'
import AgentStatusFloater from '@/components/AgentStatusFloater'
import AgentMetrics from '@/components/AgentMetrics'

const agentIcons: Record<string, React.ComponentType<any>> = {
import AgentStatusFloater from '@/components/AgentStatusFloater'
import { toast } from 'sonner',
import type { Agent } from '@/lib/agents'
t,
const agentIcons: Record<string, React.ComponentType<any>> = {
  'djen-monitor': Database,
  'mrs-justin-e': Brain,
  'petition-writer': Gavel,
  'file-organizer': FileText,
  'harvey-specter': Sparkle,
  'doc-analyzer': FileText,
}
}

interface AIAgentsProps {
  onNavigate?: (view: string) => void
    taskQueue,
    completedTasks,
export default function AIAgents({ onNavigate = () => {} }: AIAgentsProps) {
  const {bled,
    agents,
    taskQueue,
    completedTasks,
  } = useAutonomousAgents()
  const [showCollaborationDemo, setShowCollaborationDemo] = useState(false)
  const [showMrsJustinEModal, setShowMrsJustinEModal] = useState(false)
  if (agents.length === 0) {
    setAgents,nt[] = [
      {
        name: 'Harvey Specter',
        description: 'Assistente jurídico inteligente que analisa performance, processos, prazos e finanças com insights estratégicos',
        type: 'strategic',
  if (agents.length === 0) {
    const initialAgents: Agent[] = [
      {ronto para análises estratégicas',
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
        workQueue: [],menos de 1 minuto, economizando 50 horas a cada 150 intimações',
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {ity: 'Aguardando intimações para análise',
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
        workQueue: [],timações e documentos do PJe 24/7',
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {ity: 'Aguardando documentos para análise',
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
        workQueue: [],stiça Eletrônico Nacional',
        continuousMode: true,
        humanInteractionMode: 'collaborate',
      },
      {ity: 'Verificando novas publicações',
        id: 'djen-monitor',
        name: 'Agente de Monitoramento DJEN',
        description: 'Monitora automaticamente o Diário de Justiça Eletrônico Nacional',
        type: 'monitor',ncia'],
        status: 'active',
        enabled: true,
        lastActivity: 'Verificando novas publicações',
        tasksCompleted: 231,
        tasksToday: 18,
        autonomyLevel: 92,
        capabilities: ['Monitoramento 24/7', 'Detecção de publicações', 'Alertas em tempo real', 'Análise de relevância'],
        nextScheduledRun: 'Contínuo',
        workQueue: [],omaticamente',
        continuousMode: true,
        humanInteractionMode: 'alert',
      },
      {ity: 'Verificando prazos próximos',
        id: 'deadline-tracker',
        name: 'Agente de Gestão de Prazos',
        description: 'Calcula e acompanha prazos processuais automaticamente',
        type: 'scheduler',
        status: 'active',
        enabled: true,
        lastActivity: 'Verificando prazos próximos',
        tasksCompleted: 189,
        tasksToday: 14,
        autonomyLevel: 98,
        capabilities: ['Cálculo automático', 'Alertas de vencimento', 'Calendário processual', 'Análise de urgências'],
        nextScheduledRun: 'A cada hora',
        workQueue: [],os',
        continuousMode: true,
        humanInteractionMode: 'alert',
      },
      {ity: 'Aguardando ativação',
        id: 'petition-writer',
        name: 'Agente de Redação de Petições',
        description: 'Auxilia na criação de petições e documentos jurídicos',
        type: 'writer',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 67,
        tasksToday: 0,
        autonomyLevel: 85,
        capabilities: ['Redação assistida', 'Modelos jurisprudenciais', 'Revisão gramatical', 'Formatação automática'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],mentos do escritório',
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {ity: 'Aguardando ativação',
        id: 'file-organizer',
        name: 'Agente de Organização de Arquivos',
        description: 'Organiza e categoriza automaticamente documentos do escritório',
        type: 'organizer',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 54,
        tasksToday: 0,
        autonomyLevel: 88,
        capabilities: ['Classificação automática', 'Renomeação inteligente', 'Detecção de duplicatas', 'Indexação'],
        nextScheduledRun: 'Diariamente',
        workQueue: [],
        continuousMode: false,ength
        humanInteractionMode: 'autonomous',
      }
    ]d(agents.reduce((sum, a) => sum + a.autonomyLevel, 0) / agents.length)
    setAgents(initialAgents)
  }
tus === 'queued').length
  const activeAgents = agents.filter(a => a.enabled).length
  const totalTasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0)
  const avgAutonomy = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + a.autonomyLevel, 0) / agents.length)
    : 0
a => a.id === agentId)
  const queuedTasks = taskQueue.filter(t => t.status === 'queued').length
  const processingTasks = taskQueue.filter(t => t.status === 'processing').length
  const humanInterventionTasks = taskQueue.filter(t => t.status === 'human_intervention').length

        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
    toggleAgent(agentId)
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
        </p>

      <MrsJustinEModal 
        open={showMrsJustinEModal}
          : `${agent.name} ativado`
        onActivate={() => {
          const agent = agents.find(a => a.id === 'mrs-justin-e')
          if (agent && !agent.enabled) {
            handleToggleAgent('mrs-justin-e')
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}/{agents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Operando continuamente
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
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
                <Sparkle className="w-8 h-8 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-xl">Harvey Specter</CardTitle>
                <CardDescription className="mt-1">
                  Assistente jurídico inteligente - Análises estratégicas e insights em tempo real
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => onNavigate('assistente')}>
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
                <h4 className="font-semibold text-foreground">Análises Inteligentes</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Performance, processos, prazos e finanças em um só lugar
              </p>
            </div>
                <Sparkle className="w-8 h-8 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-xl">Harvey Specter</CardTitle>
                <CardDescription className="mt-1">
                  Assistente jurídico inteligente - Análises estratégicas e insights em tempo real
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => onNavigate('assistente')}>
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
                <h4 className="font-semibold text-foreground">Análises Inteligentes</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Performance, processos, prazos e finanças em um só lugar
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-primary" weight="fill" />
                <h4 className="font-semibold text-foreground">Insights Estratégicos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Identifica padrões e sugere otimizações
              </p>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="w-5 h-5 text-accent" weight="fill" />
                <h4 className="font-semibold text-foreground">Respostas Rápidas</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Análises complexas em questão de segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
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

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Geração Automática de Tarefas</CardTitle>
              <CardDescription>
                Simula tarefas reais para demonstrar o funcionamento 24/7 dos agentes
              </CardDescription>
            </div>
            <Switch
              checked={autoGenerateEnabled}
              onCheckedChange={toggleAutoGenerate}
              id="auto-generate-tasks"
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {autoGenerateEnabled 
              ? 'Os agentes estão recebendo tarefas automaticamente a cada 3 minutos para demonstração.' 
              : 'Ative para que os agentes recebam tarefas de demonstração automaticamente.'}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="metrics">
            <ChartLine className="w-4 h-4 mr-2" />
            Métricas
          </TabsTrigger>
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

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const IconComponent = agentIcons[agent.id] || Robot
              const statusColor = agent.enabled 
                ? agent.status === 'processing' 
                  ? 'text-accent' 
                  : 'text-green-600'
                : 'text-muted-foreground'

              return (
                <Card key={agent.id} className={agent.enabled ? 'border-primary/30' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${agent.enabled ? 'bg-primary/10' : 'bg-muted'}`}>
                          <IconComponent className={`w-6 h-6 ${statusColor}`} weight="fill" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{agent.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {agent.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const IconComponent = agentIcons[agent.id] || Robot
              const statusColor = agent.enabled 
                ? agent.status === 'processing' 
                  ? 'text-accent' stify-between text-sm">
                  : 'text-green-600'e="text-muted-foreground">Status:</span>
                : 'text-muted-foreground'
d ? 'Ativo' : 'Pausado'}
                            <Badge variant="outline">
                <Card key={agent.id} className={agent.enabled ? 'border-primary/30' : ''}>
                            </Badge>
                          </div>
                      <div className="flex items-start gap-3">
                      )
                          <IconComponent className={`w-6 h-6 ${statusColor}`} weight="fill" />
                  </div>
                        <div>
              </ScrollArea>
                          <CardDescription className="text-xs mt-1">
                            {agent.description}
                          </CardDescription>

        <TabsContent value="completed" className="space-y-4">
                      <Switch
                        checked={agent.enabled}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                      />
                      const agent = agents.find(a => a.id === task.agentId)
                      const IconComponent = agentIcons[task.agentId] || Robot
                      
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={agent.enabled ? 'default' : 'secondary'}>
                        {agent.enabled ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Última atividade:</span> : '-'}
                      <span className="text-foreground text-xs">{agent.lastActivity}</span>
                            Completa
                    <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                      )
                        <div className="text-lg font-bold text-foreground">{agent.tasksToday}</div>
                        <div className="text-xs text-muted-foreground">Hoje</div>
                )}
              </ScrollArea>
                        <div className="text-lg font-bold text-foreground">{agent.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
        </TabsContent>
      </Tabs>
                        <div className="text-lg font-bold text-foreground">{agent.autonomyLevel}%</div>
                        <div className="text-xs text-muted-foreground">Autonomia</div>
    </div>
  )
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">                        <span>Capacidades:</span>                      <div className="flex flex-wrap gap-1">                        {agent.capabilities.slice(0, 4).map((cap, idx) => (                          <Badge key={idx} variant="outline" className="text-xs">                            {cap}                          </Badge>                        ))}                        {agent.capabilities.length > 4 && (                          <Badge variant="outline" className="text-xs">                            +{agent.capabilities.length - 4}                        )}        </TabsContent>        <TabsContent value="metrics" className="space-y-4">          <AgentMetrics             agents={agents}            completedTasks={completedTasks}            activityLog={activityLog}          />        </TabsContent>        <TabsContent value="collaboration" className="space-y-4">          <HumanAgentCollaboration />              <CardTitle>Registro de Atividades</CardTitle>              <CardDescription>                Acompanhe em tempo real todas as ações dos agentes
              </CardDescription>
              <ScrollArea className="h-[400px]">                  <div className="text-center py-8 text-muted-foreground">                    Nenhuma atividade registrada ainda                  </div>                ) : (                  <div className="space-y-2">                    {activityLog.map((log) => {                      const agent = agents.find(a => a.id === log.agentId)                      const IconComponent = agentIcons[log.agentId] || Robot                                            return (                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">                          <IconComponent className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />                          <div className="flex-1 min-w-0">                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>                            <p className="text-xs text-muted-foreground mt-1">{log.action}</p>                            <p className="text-xs text-muted-foreground mt-1">                              {new Date(log.timestamp).toLocaleString('pt-BR')}                            </p>                          </div>                          <Badge                             variant={                              log.result === 'success' ? 'default' :                               log.result === 'warning' ? 'secondary' :                               'destructive'                            }                            className="flex-shrink-0"                          >                            {log.result}                          </Badge>                        </div>                      )                    })}                  </div>
              </ScrollArea>              <CardTitle>Fila de Tarefas</CardTitle>              <CardDescription>                Tarefas aguardando processamento pelos agentes
              </CardDescription>
              <ScrollArea className="h-[400px]">                  <div className="text-center py-8 text-muted-foreground">                    Nenhuma tarefa na fila                  <div className="space-y-2">                    {taskQueue.map((task) => {                      const agent = agents.find(a => a.id === task.agentId)                      const IconComponent = agentIcons[task.agentId] || Robot                                            return (                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">                          <IconComponent className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>                            <p className="text-xs text-muted-foreground mt-1">                              Criada em: {new Date(task.createdAt).toLocaleString('pt-BR')}                            </p>                          <div className="flex flex-col gap-1 items-end flex-shrink-0">                            <Badge variant={                              task.priority === 'critical' ? 'destructive' :                              task.priority === 'high' ? 'default' :                              'secondary'                            }>                              {task.priority}                            </Badge>                            <Badge variant="outline">                              {task.status}                            </Badge>                          </div>                        </div>                      )                    })}                  </div>              </ScrollArea>              <CardTitle>Histórico de Tarefas Completadas</CardTitle>              <CardDescription>                Últimas 100 tarefas concluídas pelos agentes
              </CardDescription>
              <ScrollArea className="h-[400px]">                  <div className="text-center py-8 text-muted-foreground">                    Nenhuma tarefa completada ainda                  <div className="space-y-2">                    {completedTasks.map((task) => {                      const agent = agents.find(a => a.id === task.agentId)                      const IconComponent = agentIcons[task.agentId] || Robot                                            return (                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">                          <IconComponent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>                            <p className="text-xs text-muted-foreground mt-1">                              Concluída em: {task.completedAt ? new Date(task.completedAt).toLocaleString('pt-BR') : '-'}                            </p>
                          <Badge variant="default" className="flex-shrink-0 bg-green-600">                            Completa                          </Badge>                      )                    })}                  </div>              </ScrollArea>
      <AgentStatusFloater agents={agents} />
