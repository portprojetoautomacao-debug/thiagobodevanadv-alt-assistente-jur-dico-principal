import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Robot, 
  Lightning, 
  CheckCircle, 
  Calendar,
  Database,
  Brain,
  Clock,
  ChartLine,
  Info,
  FileText,
  Gavel,
  Sparkle,
  ListChecks,
  WarningCircle,
  ArrowsLeftRight,
  ChatCircle,
  CloudArrowUp,
  ClockCounterClockwise
} from '@phosphor-icons/react'
import { useAutonomousAgents } from '@/hooks/use-autonomous-agents'
import { useAgentBackup } from '@/hooks/use-agent-backup'
import { useKV } from '@/hooks/use-kv'
import AgentMetrics from '@/components/AgentMetrics'
import HumanAgentCollaboration from '@/components/HumanAgentCollaboration'
import AgentStatusFloater from '@/components/AgentStatusFloater'
import MrsJustinEModal from '@/components/MrsJustinEModal'
import AgentOrchestrationPanel from '@/components/AgentOrchestrationPanel'
import { toast } from 'sonner'
import type { Agent } from '@/lib/agents'
import type { ViewType, User } from '@/types'
import type { IconProps } from '@phosphor-icons/react'

const agentIcons: Record<string, React.ComponentType<IconProps>> = {
  'djen-monitor': Database,
  'agent-djen-monitor': Database,
  'mrs-justin-e': Brain,
  'petition-writer': Gavel,
  'agent-legal-writer': Gavel,
  'file-organizer': FileText,
  'harvey-specter': Sparkle,
  'doc-analyzer': FileText,
  'agent-document-analyzer': FileText,
  'deadline-tracker': Calendar,
  'agent-deadline-calculator': Calendar,
  'datajud-query': Database,
  'precedent-researcher': Database,
  'agent-jurisprudence-researcher': Database,
  'risk-analyst': WarningCircle,
  'contract-reviewer': FileText,
  'client-communicator': ChatCircle,
  'billing-analyst': ChartLine,
  'strategy-advisor': Brain,
  'agent-strategic-advisor': Brain,
  'legal-translator': ArrowsLeftRight,
  'compliance-checker': CheckCircle,
  'agent-calendar-sync': Calendar,
}

interface AIAgentsProps {
  onNavigate?: (view: ViewType) => void
}

export default function AIAgents({ onNavigate }: AIAgentsProps) {
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
  
  const [user] = useKV<User | null>('user', null)
  const userId = user?.email || 'default-user'
  
  // Sistema de backup automático
  const { createBackup, restoreBackup } = useAgentBackup({
    userId,
    autoBackupInterval: 5, // Backup a cada 5 minutos
    enableAutoBackup: true
  })
  
  const [showMrsJustinEModal, setShowMrsJustinEModal] = useState(false)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'saving' | 'restoring'>('idle')
  const [useV2Architecture, setUseV2Architecture] = useState(true) // Nova arquitetura ativada por padrão

  // Manual backup handler
  const handleManualBackup = async () => {
    setBackupStatus('saving')
    try {
      await createBackup()
      toast.success('Backup criado com sucesso', {
        description: 'Seus dados foram salvos no servidor'
      })
    } catch (_error) {
      console.error('Erro ao criar backup:', _error)
      toast.error('Erro ao criar backup', {
        description: 'Tente novamente mais tarde'
      })
    } finally {
      setBackupStatus('idle')
    }
  }

  // Manual restore handler
  const handleManualRestore = async () => {
    setBackupStatus('restoring')
    try {
      const backup = await restoreBackup()
      if (backup) {
        toast.success('Dados restaurados com sucesso', {
          description: `Backup de ${new Date(backup.timestamp).toLocaleString()}`
        })
      } else {
        toast.info('Nenhum backup encontrado')
      }
    } catch (_error) {
      console.error('Erro ao restaurar backup:', _error)
      toast.error('Erro ao restaurar backup')
    } finally {
      setBackupStatus('idle')
    }
  }

  useEffect(() => {
    const initialAgents: Agent[] = [
      {
        id: 'harvey-specter',
        name: 'Harvey Specter',
        description: 'Assistente jurídico inteligente que analisa performance, processos, prazos e finanças com insights estratégicos',
        type: 'strategic',
        status: 'active',
        enabled: true,
        lastActivity: 'Pronto para análises estratégicas',
        tasksCompleted: 312,
        tasksToday: 18,
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
        tasksCompleted: 178,
        tasksToday: 15,
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
        tasksCompleted: 167,
        tasksToday: 9,
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
        tasksCompleted: 256,
        tasksToday: 21,
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
        tasksCompleted: 213,
        tasksToday: 17,
        autonomyLevel: 98,
        capabilities: ['Cálculo automático', 'Alertas de vencimento', 'Calendário processual', 'Análise de urgências'],
        nextScheduledRun: 'A cada hora',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
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
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
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
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'precedent-researcher',
        name: 'Agente de Pesquisa Jurisprudencial',
        description: 'Busca e analisa precedentes e jurisprudências relevantes automaticamente',
        type: 'researcher',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 42,
        tasksToday: 0,
        autonomyLevel: 90,
        capabilities: ['Pesquisa em tribunais superiores', 'Análise de relevância', 'Consolidação de teses', 'Extração de ementas'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'risk-analyst',
        name: 'Agente de Análise de Risco',
        description: 'Avalia riscos processuais, financeiros e estratégicos de cada caso',
        type: 'analyzer',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 38,
        tasksToday: 0,
        autonomyLevel: 87,
        capabilities: ['Análise de viabilidade', 'Probabilidade de êxito', 'Avaliação financeira', 'Identificação de riscos'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'contract-reviewer',
        name: 'Agente de Revisão Contratual',
        description: 'Analisa contratos identificando cláusulas problemáticas e riscos',
        type: 'analyzer',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 29,
        tasksToday: 0,
        autonomyLevel: 91,
        capabilities: ['Análise de cláusulas', 'Verificação de compliance', 'Detecção de ambiguidades', 'Sugestões de melhoria'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'client-communicator',
        name: 'Agente de Comunicação com Clientes',
        description: 'Gera comunicações personalizadas e relatórios para clientes',
        type: 'communicator',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 156,
        tasksToday: 0,
        autonomyLevel: 84,
        capabilities: ['Relatórios de andamento', 'E-mails personalizados', 'Alertas de prazos', 'Follow-ups automáticos'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'billing-analyst',
        name: 'Agente de Análise Financeira',
        description: 'Monitora faturamento, recebimentos e análises de rentabilidade',
        type: 'strategic',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 87,
        tasksToday: 0,
        autonomyLevel: 93,
        capabilities: ['Análise de faturamento', 'Controle de recebíveis', 'Projeções financeiras', 'Alertas de inadimplência'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'strategy-advisor',
        name: 'Agente de Estratégia Processual',
        description: 'Sugere estratégias processuais baseadas em análise de dados e precedentes',
        type: 'strategic',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 63,
        tasksToday: 0,
        autonomyLevel: 89,
        capabilities: ['Análise estratégica', 'Probabilidade de sucesso', 'Alternativas processuais', 'Gestão de recursos'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'legal-translator',
        name: 'Agente de Tradução Jurídica',
        description: 'Traduz termos técnicos para linguagem simples e vice-versa',
        type: 'translator',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 71,
        tasksToday: 0,
        autonomyLevel: 86,
        capabilities: ['Simplificação de linguagem', 'Glossário técnico', 'Adaptação de público', 'Clareza comunicativa'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      },
      {
        id: 'compliance-checker',
        name: 'Agente de Compliance',
        description: 'Verifica conformidade com legislações e normas regulatórias',
        type: 'compliance',
        status: 'idle',
        enabled: false,
        lastActivity: 'Aguardando ativação',
        tasksCompleted: 45,
        tasksToday: 0,
        autonomyLevel: 94,
        capabilities: ['Verificação LGPD', 'Código de Ética OAB', 'Normas regulatórias', 'Auditorias automáticas'],
        nextScheduledRun: 'Sob demanda',
        workQueue: [],
        continuousMode: false,
        humanInteractionMode: 'collaborate',
      }
    ]

    // Check for missing agents and add them
    const missingAgents = initialAgents.filter(
      initAgent => !agents.some(existingAgent => 
        existingAgent.id === initAgent.id || existingAgent.name === initAgent.name
      )
    )

    if (missingAgents.length > 0) {
      console.log('Adding missing agents:', missingAgents.map(a => a.name))
      setAgents(prev => [...(prev || []), ...missingAgents])
    }
  }, [agents, setAgents])

  const totalTasksToday = agents.reduce((sum, a) => sum + a.tasksToday, 0)

  const activeAgents = agents.filter(a => a.enabled).length
  const queuedTasks = taskQueue.filter(t => t.status === 'queued').length
  const processingTasks = taskQueue.filter(t => t.status === 'processing').length
  const humanInterventionTasks = taskQueue.filter(t => t.status === 'human_intervention').length

  const handleToggleAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return null
    toggleAgent(agentId)
    toast.success(agent.enabled 
      ? `${agent.name} desativado` 
      : `${agent.name} ativado`
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Agentes de IA Autônomos</h1>
        <p className="text-muted-foreground mt-2">
          Equipe de inteligência artificial trabalhando 24/7 para automatizar tarefas jurídicas
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
          setShowMrsJustinEModal(false)
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Robot className="w-4 h-4 text-primary" weight="fill" />
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
            <Clock className="w-4 h-4 text-accent" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queuedTasks + processingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeAgents === 0 ? 'Nenhum agente ativo' : `${activeAgents} trabalhando agora`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup Local</CardTitle>
            <CloudArrowUp className="w-4 h-4 text-blue-600" weight="fill" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-green-600">Ativo</div>
                <p className="text-xs text-muted-foreground mt-1">
                  A cada 5 min
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualBackup}
                  disabled={backupStatus === 'saving'}
                  title="Salvar backup agora"
                >
                  <CloudArrowUp className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleManualRestore}
                  disabled={backupStatus === 'restoring'}
                  title="Ver histórico de backups"
                >
                  <ClockCounterClockwise className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkle className="w-8 h-8 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-xl">Harvey Specter</CardTitle>
                <CardDescription className="mt-1">
                  Seu assistente jurídico estratégico com análises completas do escritório
                </CardDescription>
              </div>
            </div>
            <Button onClick={() => onNavigate?.('assistente')}>
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
                <Brain className="w-8 h-8 text-primary" weight="fill" />
              </div>
              <div>
                <CardTitle className="text-xl">Mrs. Justin-e</CardTitle>
                <CardDescription className="mt-1">
                  Especialista em análise de intimações com 95% de precisão
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
            <div className="bg-background/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Lightning className="w-5 h-5 text-accent" weight="fill" />
                <h4 className="font-semibold text-foreground">Análise Rápida</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Menos de 1 minuto por intimação
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {humanInterventionTasks > 0 && (
        <Card className="border-accent bg-accent/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <WarningCircle className="w-5 h-5 text-accent" weight="fill" />
              <CardTitle className="text-base">Intervenção Humana Necessária</CardTitle>
            </div>
            <CardDescription>
              {humanInterventionTasks} tarefa(s) aguardando conclusão da edição humana
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Modo de Demonstração Automática</CardTitle>
              <CardDescription>
                Gera tarefas automaticamente para demonstrar o funcionamento contínuo dos agentes
              </CardDescription>
            </div>
            <Switch
              checked={autoGenerateEnabled}
              onCheckedChange={toggleAutoGenerate}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {autoGenerateEnabled 
              ? 'Agentes ativos receberão tarefas de demonstração a cada 2 minutos. Mais rápido e eficiente.'
              : 'Ative para que os agentes recebam tarefas de demonstração automaticamente e vejam o sistema em ação.'}
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
          <TabsTrigger value="orchestration">
            <Robot className="w-4 h-4 mr-2" />
            Orquestração V2
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            <ArrowsLeftRight className="w-4 h-4 mr-2" />
            Demo Colaboração
          </TabsTrigger>
          <TabsTrigger value="activity">
            <ListChecks className="w-4 h-4 mr-2" />
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
                        checked={agent.enabled}
                        onCheckedChange={() => handleToggleAgent(agent.id)}
                      />
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Capacidades:</span>
                        <Badge variant={agent.enabled ? 'default' : 'secondary'} className="text-xs">
                          {agent.enabled ? 'Ativo' : 'Pausado'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities?.slice(0, 4).map((cap, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                        {agent.capabilities && agent.capabilities.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.capabilities.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground text-xs">Última atividade:</span>
                      <span className="text-foreground text-xs">{agent.lastActivity}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-foreground">{agent.tasksToday}</div>
                        <div className="text-xs text-muted-foreground">Hoje</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{agent.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground">{agent.autonomyLevel}%</div>
                        <div className="text-xs text-muted-foreground">Autonomia</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <AgentMetrics
            agents={agents}
            completedTasks={completedTasks}
            activityLog={activityLog}
          />
        </TabsContent>

        <TabsContent value="orchestration" className="space-y-4">
          {useV2Architecture ? (
            <AgentOrchestrationPanel />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Arquitetura V2 - ReAct + Circuit Breakers</CardTitle>
                <CardDescription>
                  Painel de orquestração com observabilidade completa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">Ativar Arquitetura V2</h4>
                    <p className="text-sm text-muted-foreground">
                      Nova arquitetura com ReAct Pattern, Circuit Breakers, Traces e Orquestração
                    </p>
                  </div>
                  <Switch
                    checked={useV2Architecture}
                    onCheckedChange={setUseV2Architecture}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-4">
          <HumanAgentCollaboration 
            agentName="Mrs. Justin-e"
            taskDescription="Análise de intimação judicial"
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma atividade registrada ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityLog.map((log) => {
                      const agent = agents.find(a => a.id === log.agentId)
                      const IconComponent = agentIcons[log.agentId] || Robot
                      
                      return (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                          <IconComponent className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{log.action}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(log.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
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
                {taskQueue.length === 0 ? (
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
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Criada em: {new Date(task.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <Badge 
                            variant={
                              task.status === 'processing' ? 'default' :
                              task.status === 'queued' ? 'secondary' :
                              'destructive'
                            }
                            className="flex-shrink-0"
                          >
                            {task.status}
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

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Tarefas Concluídas</CardTitle>
              <CardDescription>
                Tarefas processadas com sucesso pelos agentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {completedTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhuma tarefa concluída ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {completedTasks.map((task) => {
                      const agent = agents.find(a => a.id === task.agentId)
                      const IconComponent = agentIcons[task.agentId] || Robot
                      
                      return (
                        <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                          <IconComponent className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" weight="fill" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{agent?.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{task.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Concluída em: {task.completedAt ? new Date(task.completedAt).toLocaleString('pt-BR') : '-'}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="default" className="text-xs bg-green-600">
                                Concluído
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {task.completedAt && new Date(task.completedAt).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AgentStatusFloater />
    </div>
  )
}
