export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'lawyer' | 'assistant'
}

export interface Process {
  id: string
  cnj: string
  title: string
  parties: {
    plaintiff: string
    defendant: string
  }
  status: 'aguardando' | 'em-andamento' | 'concluido' | 'arquivado'
  stage: string
  lawyer: string
  createdAt: string
  updatedAt: string
  nextDeadline?: string
}

export interface Expediente {
  id: string
  processId: string
  type: string
  content: string
  receivedAt: string
  deadline?: string
  analyzed: boolean
  summary?: string
  suggestedAction?: string
  pendingDocs?: string[]
  draftPetition?: string
}

export interface Appointment {
  id: string
  title: string
  description?: string
  type: 'hearing' | 'meeting' | 'deadline' | 'other'
  date: string
  time: string
  processId?: string
  location?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  processId?: string
  dueDate?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: string
}

export interface FinancialEntry {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
  processId?: string
}

export interface DeadlineCalculation {
  baseDate: string
  deadlineType: string
  procedureType: 'CPC' | 'CLT'
  days: number
  finalDate: string
  reasoning: string[]
  holidays: string[]
}

export interface KnowledgeDocument {
  id: string
  title: string
  content: string
  type: 'petition' | 'doctrine' | 'note' | 'jurisprudence'
  tags: string[]
  uploadedAt: string
}

export interface AIAnalysis {
  id: string
  type: 'expediente' | 'document' | 'audio' | 'calculation'
  input: string
  output: string
  timestamp: string
  status: 'processing' | 'completed' | 'error'
}

export interface Precedente {
  id: string
  tribunal: string
  numero: string
  tema: string
  resumo_relevancia: string
  link: string
}

export interface PremonicaoJuridica {
  processo_cnj: string
  probabilidade_exito: number
  analise_ia: string
  estrategias_recomendadas: string[]
  precedentes_relevantes: Precedente[]
}

export interface Minuta {
  id: string
  titulo: string
  processId?: string
  tipo: 'peticao' | 'contrato' | 'parecer' | 'recurso' | 'outro'
  conteudo: string
  googleDocsId?: string
  googleDocsUrl?: string
  status: 'rascunho' | 'em-revisao' | 'finalizada' | 'arquivada'
  criadoEm: string
  atualizadoEm: string
  ultimaSincronizacao?: string
  autor: string
}
