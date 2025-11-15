export interface Process {
  id: string
  numeroCNJ: string
  titulo: string
  autor: string
  reu: string
  comarca: string
  vara: string
  status: 'ativo' | 'suspenso' | 'arquivado' | 'concluido'
  valor?: number
  dataDistribuicao: string
  dataUltimaMovimentacao: string
  notas?: string
  prazos: Prazo[]
  createdAt: string
  updatedAt: string
}

export interface Prazo {
  id: string
  processId: string
  descricao: string
  dataInicio: string
  diasCorridos: number
  tipoPrazo: 'cpc' | 'clt'
  dataFinal: string
  concluido: boolean
  urgente: boolean
  createdAt: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface Feriado {
  data: string
  nome: string
  tipo: 'nacional' | 'estadual' | 'municipal'
}

export type ViewType = 'dashboard' | 'processos' | 'prazos' | 'calculadora' | 'assistente'
