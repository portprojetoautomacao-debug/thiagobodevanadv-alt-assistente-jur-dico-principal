import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
  Robot, 
  CheckCircle, 
  FileText,
  Calenda
  Robot, 
  Lightning, 
  CheckCircle, 
  Warning,
  FileText,
  Gavel,
  Calendar,
  Database,
import Age
const ag
  'djen-
  'petit
  'file-organ
  'harvey-specter': Spar

  const
    taskQue
    activityLog,
    toggleAgent,
    toggleAutoGenerate,
  } = useAutonomousAgents()
  const [showCollaborationDemo, setShowCo

    if (agents.length === 0) {
        {

          type: 'strategic',
          enabled: true,
          tasksCompleted
          autonomyLevel: 98,
            'Análise de Perfo
            'Monitoramento d
            'Gestão de Equ
            'Alertas Int
          ],
 

        {
          
          ty
          enabl
          tasksCompl
    activityLog,
            'Interpreta 
    toggleAgent,
            
    toggleAutoGenerate,
          ],
  } = useAutonomousAgents()
  
        {
          name: 'Agente de Análise Documental',

          enabled: 
          tasksCompleted: 143,
          autonom
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
          name: 'Agente de Gest
          humanInteractionMode: 'collaborate',
          
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
  const handleToggleAgent = (agentId: s
    if (agent) {
      toast.success(
          ? `${agent.name} pausado` 
      )
  }
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
            <CardTitle classN
          </CardHeader>
            <div className="text-2xl font-bold">{activeAgents}/{agents.length}</div>
              Operando con
          </CardContent>

          <CardHeader className="flex flex-row items-ce
            <CheckCircle clas
          <CardContent>
            <p className="tex
            </p>
        </Card>
        <Card>
            <CardTitle classNam
          </CardHeader>
          
         
          </CardContent>

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Robot className=
          <CardContent>
            <Progress va
        </Card>

        <CardHeader>
            <div className="
                <Sparkle className="w-8 h-8 text-primary" weight="fill" />
              <div>
                <CardDes
                </CardDescripti
            </div>
          
         
        </CardHeader>
          <div className="grid grid-cols-1 md
              <div className="flex items-center gap-2 mb-2">
                <h4 class
              <p classNam
              </p>
            <div className="bg-background/50 round
                <Brain classN
              </div>
                Identifica p
            </div>
              <div className="flex items-c
                <h4 clas
              <p className="tex
              </p>
          
      </C
      <Card className="bg-grad
          <div className="flex items-start jus
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              </div>
                <CardTitl
                  Especia
              </div>
            <Button onClick={
              Ver Detalh
          </div>
        <CardContent>
            <div className="bg-backgro
                <Sparkle
              </div>
                Análise em menos de 1 mi
          
         
                <h4 className="
              <p className="text-sm text-muted-fo
              </p>
            <div className="
                <Clock clas
              </div>
                50 horas economizadas a cada 150 
            </div>
        </CardContent>

        <Card className="border-accent bg-accent/5">
            <CardTitle className="flex 
              {humanInte
            <CardDescription>
            </CardDescription>
        </

     
            <div>

              </CardDescription>
            <Switch
              on
            />
        </CardHeader
          <p className
              ? 'Os agentes estão re
          </p>
      <
     
   

          </TabsTrigger>
            <ArrowsLeftRight className="w-4 h-4 mr-2" />
          </TabsTrigger>
            Atividade em Tempo Real
       

            Fila de Tarefas
              <Badge variant="secondary" className="ml-2">{queuedTasks + processi
          </TabsTrigger>

          
          </TabsTrigger>

          <AgentMetrics 
            completedTasks={completedTasks}
          />

          <d

                  <Arro
                </CardTitle>
                  Veja como os agentes detect
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

        <TabsContent value="metrics" className="space-y-4">
          <AgentMetrics 
            agents={agents}
            completedTasks={completedTasks}
            activityLog={activityLog}
          />
        </TabsContent>

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




































































































































































































































































































































































































































































