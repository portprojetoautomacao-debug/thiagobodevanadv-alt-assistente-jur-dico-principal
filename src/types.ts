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

export interface PremonicaoJuridica {
  processo_cnj: string
  probabilidade_exito: number
  analise_ia: string
  estrategias_recomendadas: string[]
  precedentes_relevantes: {
    id: string
    tribunal: string
    numero: string
    tema: string
    resumo_relevancia: string
    link: string
  }[]
}

export interface Minuta {
  id: string
  titulo: string
  processId?: string
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'outro'
  conteudo: string
  status: 'rascunho' | 'em-revisao' | 'finalizada' | 'arquivada'
  criadoEm: string
  atualizadoEm: string
  autor: string
  googleDocsId?: string
  googleDocsUrl?: string
  ultimaSincronizacao?: string
}

export interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

export interface Expediente {
  id: string
  processId: string
  tipo: 'intimacao' | 'citacao' | 'documento' | 'outro'
  type?: string
  titulo: string
  conteudo: string
  content?: string
  dataRecebimento: string
  receivedAt?: string
  prazoFatal?: string
  deadline?: string
  lido: boolean
  arquivado: boolean
  analyzed?: boolean
  tags?: string[]
  summary?: string
  suggestedAction?: string
  pendingDocs?: string[]
  draftPetition?: string
}

export interface Appointment {
  id: string
  title: string
  description?: string
  date: string
  time: string
  duration: number
  processId?: string
  location?: string
  type: 'audiencia' | 'reuniao' | 'prazo' | 'outro'
  reminders?: number[]
  googleEventId?: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'advogado' | 'assistente'
  avatarUrl?: string
}

export interface Cliente {
  id: string
  nome: string
  cpfCnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  tipo: 'fisica' | 'juridica'
  status: 'ativo' | 'inativo'
  observacoes?: string
  createdAt: string
  updatedAt: string
}

export type ViewType = 'dashboard' | 'processos' | 'prazos' | 'calculadora' | 'assistente' | 'agentes' | 'minutas' | 'financeiro' | 'conhecimento' | 'crm' | 'consultas'
