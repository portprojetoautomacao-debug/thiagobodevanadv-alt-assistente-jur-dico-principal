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

export function processTaskWithAI(task: AgentTask, agent: Agent): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      switch (task.type) {
        case 'analyze_document':
          resolve({
            summary: 'Documento analisado com sucesso',
            extractedData: task.data,
            suggestedActions: ['Responder intimação', 'Anexar documentos'],
          })
          break
        case 'monitor_djen':
          resolve({
            newIntimations: [],
            checked: true,
            timestamp: new Date().toISOString(),
          })
          break
        case 'calculate_deadline':
          resolve({
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            reasoning: ['15 dias úteis', 'Desconsiderados feriados', 'Vencimento confirmado'],
          })
          break
        case 'draft_petition':
          resolve({
            draft: 'Minuta de petição gerada automaticamente',
            confidence: 0.87,
          })
          break
        default:
          resolve({ completed: true })
      }
    }, 2000 + Math.random() * 3000)
  })
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
