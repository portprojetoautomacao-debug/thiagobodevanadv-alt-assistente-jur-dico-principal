import type { Process } from '@/types'

export const SAMPLE_PROCESSES: Process[] = [
  {
    id: 'sample-1',
    numeroCNJ: '0012345-67.2024.8.13.0024',
    titulo: 'Ação de Cobrança - Contrato de Prestação de Serviços',
    autor: 'João da Silva Advogados Ltda.',
    reu: 'Empresa XYZ Construções S.A.',
    comarca: 'Belo Horizonte',
    vara: '1ª Vara Cível',
    status: 'ativo',
    valor: 50000.00,
    dataDistribuicao: '2024-01-15',
    dataUltimaMovimentacao: '2024-11-10T14:30:00.000Z',
    notas: 'Processo em fase de instrução. Aguardando produção de provas.',
    prazos: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-11-10T14:30:00.000Z',
  },
  {
    id: 'sample-2',
    numeroCNJ: '0098765-43.2024.5.03.0001',
    titulo: 'Reclamação Trabalhista - Horas Extras e Verbas Rescisórias',
    autor: 'Maria Santos',
    reu: 'Indústria ABC Ltda.',
    comarca: 'Contagem',
    vara: 'Vara do Trabalho',
    status: 'ativo',
    valor: 25000.00,
    dataDistribuicao: '2024-02-20',
    dataUltimaMovimentacao: '2024-11-12T16:45:00.000Z',
    notas: 'Reclamação trabalhista por horas extras não pagas.',
    prazos: [],
    createdAt: '2024-02-20T09:00:00.000Z',
    updatedAt: '2024-11-12T16:45:00.000Z',
  },
  {
    id: 'sample-3',
    numeroCNJ: '0054321-98.2024.8.13.0702',
    titulo: 'Ação de Despejo por Falta de Pagamento',
    autor: 'Carlos Eduardo Proprietário',
    reu: 'Locatária Comércio Ltda.',
    comarca: 'Uberlândia',
    vara: '2ª Vara Cível',
    status: 'suspenso',
    valor: 15000.00,
    dataDistribuicao: '2024-03-10',
    dataUltimaMovimentacao: '2024-11-08T10:20:00.000Z',
    notas: 'Aguardando sentença do juiz.',
    prazos: [],
    createdAt: '2024-03-10T11:00:00.000Z',
    updatedAt: '2024-11-08T10:20:00.000Z',
  },
  {
    id: 'sample-4',
    numeroCNJ: '0087654-32.2023.8.13.0024',
    titulo: 'Ação Indenizatória - Danos Materiais e Morais',
    autor: 'Paula Fernandes',
    reu: 'Seguradora Proteção S.A.',
    comarca: 'Belo Horizonte',
    vara: '3ª Vara Cível',
    status: 'ativo',
    valor: 100000.00,
    dataDistribuicao: '2023-06-15',
    dataUltimaMovimentacao: '2024-11-05T09:15:00.000Z',
    notas: 'Processo em fase recursal. Recurso de apelação em análise.',
    prazos: [],
    createdAt: '2023-06-15T14:00:00.000Z',
    updatedAt: '2024-11-05T09:15:00.000Z',
  },
  {
    id: 'sample-5',
    numeroCNJ: '0011111-22.2024.8.13.0145',
    titulo: 'Divórcio Consensual com Partilha de Bens',
    autor: 'Ricardo Souza',
    reu: 'Fernanda Souza',
    comarca: 'Juiz de Fora',
    vara: 'Vara de Família',
    status: 'concluido',
    dataDistribuicao: '2024-01-05',
    dataUltimaMovimentacao: '2024-10-30T17:00:00.000Z',
    notas: 'Divórcio homologado com partilha de bens realizada.',
    prazos: [],
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
