import type { Process } from '@/types'

export const SAMPLE_PROCESSES: Process[] = [
  {
    id: 'sample-1',
    cnj: '0012345-67.2024.8.13.0024',
    title: 'Ação de Cobrança - Contrato de Prestação de Serviços',
    parties: {
      plaintiff: 'João da Silva Advogados Ltda.',
      defendant: 'Empresa XYZ Construções S.A.',
    },
    status: 'em-andamento',
    stage: 'Instrução',
    lawyer: 'Dr. João da Silva',
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-11-10T14:30:00.000Z',
    nextDeadline: '2024-12-01',
  },
  {
    id: 'sample-2',
    cnj: '0098765-43.2024.5.03.0001',
    title: 'Reclamação Trabalhista - Horas Extras e Verbas Rescisórias',
    parties: {
      plaintiff: 'Maria Santos',
      defendant: 'Indústria ABC Ltda.',
    },
    status: 'em-andamento',
    stage: 'Inicial',
    lawyer: 'Dra. Ana Paula',
    createdAt: '2024-02-20T09:00:00.000Z',
    updatedAt: '2024-11-12T16:45:00.000Z',
    nextDeadline: '2024-11-25',
  },
  {
    id: 'sample-3',
    cnj: '0054321-98.2024.8.13.0702',
    title: 'Ação de Despejo por Falta de Pagamento',
    parties: {
      plaintiff: 'Carlos Eduardo Proprietário',
      defendant: 'Locatária Comércio Ltda.',
    },
    status: 'aguardando',
    stage: 'Sentença',
    lawyer: 'Dr. Roberto Alves',
    createdAt: '2024-03-10T11:00:00.000Z',
    updatedAt: '2024-11-08T10:20:00.000Z',
  },
  {
    id: 'sample-4',
    cnj: '0087654-32.2023.8.13.0024',
    title: 'Ação Indenizatória - Danos Materiais e Morais',
    parties: {
      plaintiff: 'Paula Fernandes',
      defendant: 'Seguradora Proteção S.A.',
    },
    status: 'em-andamento',
    stage: 'Recurso',
    lawyer: 'Dr. João da Silva',
    createdAt: '2023-06-15T14:00:00.000Z',
    updatedAt: '2024-11-05T09:15:00.000Z',
    nextDeadline: '2024-11-30',
  },
  {
    id: 'sample-5',
    cnj: '0011111-22.2024.8.13.0145',
    title: 'Divórcio Consensual com Partilha de Bens',
    parties: {
      plaintiff: 'Ricardo Souza',
      defendant: 'Fernanda Souza',
    },
    status: 'concluido',
    stage: 'Execução',
    lawyer: 'Dra. Ana Paula',
    createdAt: '2024-01-05T08:00:00.000Z',
    updatedAt: '2024-10-30T17:00:00.000Z',
  },
]

export async function initializeSampleData() {
  try {
    const existingProcesses = await spark.kv.get<Process[]>('processes')
    
    if (!existingProcesses || existingProcesses.length === 0) {
      await spark.kv.set('processes', SAMPLE_PROCESSES)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error initializing sample data:', error)
    return false
  }
}
