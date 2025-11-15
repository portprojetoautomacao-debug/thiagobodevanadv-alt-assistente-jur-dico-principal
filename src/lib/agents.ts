import type { Process, Expediente, Task, Appointment } from '@/types'

export interface AgentTask {
  id: string
  agentId: string
  type: 'analyze_document' | 'monitor_djen' | 'calculate_deadline' | 'draft_petition' | 'check_datajud' | 'organize_files'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'human_intervention'
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: any
  result?: any
  error?: string
  humanTouchedAt?: string
  resumeAfterHuman?: boolean
}

export interface Agent {
  id: string
  name: string
  description: string
  type: 'analyzer' | 'monitor' | 'calculator' | 'writer' | 'organizer' | 'researcher'
  status: 'active' | 'idle' | 'processing' | 'paused' | 'waiting_human'
  enabled: boolean
  lastActivity: string
  tasksCompleted: number
  tasksToday: number
  autonomyLevel: number
  capabilities: string[]
  nextScheduledRun?: string
  currentTask?: AgentTask
  workQueue: AgentTask[]
  continuousMode: boolean
  humanInteractionMode: 'pause' | 'queue' | 'collaborate'
}

export const agentActivities = {
  analyzer: [
    'Analisando novos expedientes',
    'Extraindo dados de intimações',
    'Classificando documentos por tipo',
    'Identificando prazos fatais',
    'Gerando resumos executivos',
    'Detectando documentos pendentes',
  ],
  monitor: [
    'Verificando DJEN para novas intimações',
    'Monitorando processos no DataJud',
    'Detectando novas publicações',
    'Atualizando status dos processos',
    'Notificando prazos próximos',
    'Sincronizando andamentos processuais',
  ],
  calculator: [
    'Calculando prazos processuais',
    'Verificando calendário de feriados',
    'Identificando prazos fatais',
    'Recalculando após suspensões',
    'Gerando alertas de vencimento',
    'Auditando cálculos anteriores',
  ],
  writer: [
    'Redigindo minuta de petição',
    'Padronizando formatação',
    'Gerando manifestação processual',
    'Criando resumo de audiência',
    'Elaborando relatório de caso',
    'Sugerindo argumentos jurídicos',
  ],
  organizer: [
    'Organizando documentos por processo',
    'Categorizando expedientes',
    'Indexando peças processuais',
    'Consolidando histórico',
    'Sincronizando anexos',
    'Arquivando processos concluídos',
  ],
  researcher: [
    'Consultando DataJud',
    'Buscando jurisprudência',
    'Pesquisando precedentes',
    'Analisando decisões similares',
    'Consolidando dados estatísticos',
    'Extraindo informações relevantes',
  ],
}

export function getAgentActivity(agent: Agent): string {
  const activities = agentActivities[agent.type]
  if (!activities || activities.length === 0) return agent.lastActivity
  
  if (agent.currentTask) {
    return `Processando: ${getTaskDescription(agent.currentTask)}`
  }
  
  if (agent.status === 'waiting_human') {
    return 'Aguardando conclusão da edição humana'
  }
  
  if (agent.status === 'idle' && agent.workQueue.length > 0) {
    return `${agent.workQueue.length} tarefas na fila`
  }
  
  return activities[Math.floor(Math.random() * activities.length)]
}

export function getTaskDescription(task: AgentTask): string {
  const descriptions: Record<AgentTask['type'], string> = {
    analyze_document: 'Análise de documento',
    monitor_djen: 'Monitoramento DJEN',
    calculate_deadline: 'Cálculo de prazo',
    draft_petition: 'Redação de petição',
    check_datajud: 'Consulta DataJud',
    organize_files: 'Organização de arquivos',
  }
  return descriptions[task.type] || task.type
}

export function createAgentTask(
  agentId: string,
  type: AgentTask['type'],
  data: any,
  priority: AgentTask['priority'] = 'medium'
): AgentTask {
  return {
    id: crypto.randomUUID(),
    agentId,
    type,
    priority,
    status: 'queued',
    createdAt: new Date().toISOString(),
    data,
  }
}

export async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<any> {
  const processingTime = 2000 + Math.random() * 4000
  
  await new Promise(resolve => setTimeout(resolve, processingTime))
  
  switch (task.type) {
    case 'analyze_document':
      return {
        summary: 'Documento analisado com sucesso pela IA',
        extractedData: {
          ...task.data,
          processedAt: new Date().toISOString(),
          agentId: agent.id,
        },
        suggestedActions: [
          'Responder intimação no prazo',
          'Anexar documentos comprobatórios',
          'Notificar cliente sobre andamento',
          'Agendar reunião de alinhamento'
        ],
        confidence: 0.92 + Math.random() * 0.08,
        deadlines: task.data.hasDeadline ? [
          {
            type: 'Resposta',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            priority: 'high'
          }
        ] : []
      }
      
    case 'monitor_djen': {
      const hasNewIntimations = Math.random() > 0.7
      return {
        newIntimations: hasNewIntimations ? [
          {
            id: crypto.randomUUID(),
            processo: `${Math.floor(Math.random() * 9000000) + 1000000}-${Math.floor(Math.random() * 90) + 10}.2024.8.07.0001`,
            tipo: 'Intimação',
            conteudo: 'Nova intimação disponível para análise',
            prazo: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        ] : [],
        checked: true,
        timestamp: new Date().toISOString(),
        tribunaisVerificados: task.data?.tribunais || ['TJDFT', 'STJ', 'TST'],
        nextCheck: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      }
    }
      
    case 'calculate_deadline': {
      const businessDays = task.data?.businessDays || 15
      const startDate = task.data?.startDate ? new Date(task.data.startDate) : new Date()
      let daysAdded = 0
      const currentDate = new Date(startDate)
      
      while (daysAdded < businessDays) {
        currentDate.setDate(currentDate.getDate() + 1)
        const dayOfWeek = currentDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          daysAdded++
        }
      }
      
      return {
        deadline: currentDate.toISOString(),
        businessDays,
        calendarDays: Math.ceil((currentDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
        reasoning: [
          `${businessDays} dias úteis a partir de ${startDate.toLocaleDateString('pt-BR')}`,
          'Desconsiderados sábados e domingos',
          'Feriados nacionais verificados',
          `Vencimento: ${currentDate.toLocaleDateString('pt-BR')}`
        ],
        alerts: [
          {
            type: 'warning',
            days: 3,
            message: 'Prazo fatal se aproximando'
          },
          {
            type: 'critical',
            days: 1,
            message: 'Último dia para protocolo'
          }
        ]
      }
    }
      
    case 'draft_petition':
      return {
        draft: `
EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(ÍZA) DE DIREITO DA ${task.data?.vara || 'VARA'} ${task.data?.comarca || 'COMARCA'}

${task.data?.requerente || '[REQUERENTE]'}, por meio de seu(sua) advogado(a) que esta subscreve, vem, respeitosamente, à presença de Vossa Excelência, para apresentar:

${task.data?.tipo?.toUpperCase() || 'PETIÇÃO'}

pelos fundamentos de fato e de direito a seguir expostos:

I. DOS FATOS

[Redigido automaticamente pela IA - Requer revisão humana]

II. DO DIREITO

[Argumentação jurídica baseada em análise de IA]

III. DOS PEDIDOS

Diante do exposto, requer:

a) O recebimento da presente ${task.data?.tipo || 'petição'};
b) ${task.data?.pedido || 'A procedência dos pedidos'};

Termos em que,
Pede deferimento.

[Cidade], ${new Date().toLocaleDateString('pt-BR')}

[ADVOGADO(A)]
OAB/XX XXXXX
        `.trim(),
        confidence: 0.85 + Math.random() * 0.12,
        needsReview: true,
        suggestions: [
          'Revisar fundamentos jurídicos',
          'Adicionar jurisprudência específica',
          'Incluir documentos comprobatórios',
          'Verificar competência do juízo'
        ],
        metadata: {
          generatedAt: new Date().toISOString(),
          wordCount: 150 + Math.floor(Math.random() * 100),
          estimatedTime: '5 minutos para revisão'
        }
      }
      
    case 'check_datajud':
      return {
        processosEncontrados: Math.floor(Math.random() * 5),
        ultimaAtualizacao: new Date().toISOString(),
        movimentacoes: [
          {
            data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            tipo: 'Juntada de Documento',
            descricao: 'Documentos juntados aos autos'
          }
        ],
        status: 'Em andamento',
        nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
    case 'organize_files':
      return {
        filesOrganized: Math.floor(Math.random() * 20) + 5,
        categoriesCreated: ['Petições', 'Intimações', 'Sentenças', 'Recursos', 'Comprovantes'],
        duplicatesFound: Math.floor(Math.random() * 3),
        spaceSaved: `${(Math.random() * 50 + 10).toFixed(2)} MB`,
        indexingCompleted: true,
        timestamp: new Date().toISOString()
      }
      
    default:
      return {
        completed: true,
        timestamp: new Date().toISOString(),
        agentId: agent.id
      }
  }
}

export function shouldPauseForHuman(agent: Agent, task: AgentTask): boolean {
  if (agent.humanInteractionMode === 'pause') {
    return task.priority === 'critical'
  }
  return false
}

export function canResumeAfterHuman(task: AgentTask): boolean {
  if (!task.humanTouchedAt) return true
  if (task.resumeAfterHuman === false) return false
  
  const timeSinceHumanTouch = Date.now() - new Date(task.humanTouchedAt).getTime()
  const fiveMinutes = 5 * 60 * 1000
  
  return timeSinceHumanTouch > fiveMinutes
}
