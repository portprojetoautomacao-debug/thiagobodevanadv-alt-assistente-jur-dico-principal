import type { Process } from '@/types'
import { addDays, format } from 'date-fns'

const hoje = new Date()

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
    dataUltimaMovimentacao: new Date().toISOString(),
    notas: 'Processo em fase de instrução. Aguardando produção de provas.',
    prazos: [
      {
        id: 'prazo-1',
        processId: 'sample-1',
        descricao: 'Apresentar contestação',
        dataInicio: format(addDays(hoje, -10), 'yyyy-MM-dd'),
        diasCorridos: 15,
        tipoPrazo: 'cpc',
        dataFinal: format(addDays(hoje, 3), 'yyyy-MM-dd'),
        concluido: false,
        urgente: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prazo-2',
        processId: 'sample-1',
        descricao: 'Protocolar recurso de apelação',
        dataInicio: format(addDays(hoje, 5), 'yyyy-MM-dd'),
        diasCorridos: 15,
        tipoPrazo: 'cpc',
        dataFinal: format(addDays(hoje, 20), 'yyyy-MM-dd'),
        concluido: false,
        urgente: false,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    dataUltimaMovimentacao: new Date().toISOString(),
    notas: 'Reclamação trabalhista por horas extras não pagas.',
    prazos: [
      {
        id: 'prazo-3',
        processId: 'sample-2',
        descricao: 'Responder petição inicial',
        dataInicio: format(addDays(hoje, -5), 'yyyy-MM-dd'),
        diasCorridos: 5,
        tipoPrazo: 'clt',
        dataFinal: format(hoje, 'yyyy-MM-dd'),
        concluido: false,
        urgente: true,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: '2024-02-20T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    dataUltimaMovimentacao: new Date().toISOString(),
    notas: 'Aguardando sentença do juiz.',
    prazos: [
      {
        id: 'prazo-4',
        processId: 'sample-3',
        descricao: 'Apresentar memoriais finais',
        dataInicio: format(addDays(hoje, -30), 'yyyy-MM-dd'),
        diasCorridos: 10,
        tipoPrazo: 'cpc',
        dataFinal: format(addDays(hoje, -20), 'yyyy-MM-dd'),
        concluido: true,
        urgente: false,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: '2024-03-10T11:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    dataUltimaMovimentacao: new Date().toISOString(),
    notas: 'Processo em fase recursal. Recurso de apelação em análise.',
    prazos: [
      {
        id: 'prazo-5',
        processId: 'sample-4',
        descricao: 'Apresentar contrarrazões de apelação',
        dataInicio: format(addDays(hoje, 2), 'yyyy-MM-dd'),
        diasCorridos: 15,
        tipoPrazo: 'cpc',
        dataFinal: format(addDays(hoje, 17), 'yyyy-MM-dd'),
        concluido: false,
        urgente: false,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: '2023-06-15T14:00:00.000Z',
    updatedAt: new Date().toISOString(),
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
    dataUltimaMovimentacao: new Date().toISOString(),
    notas: 'Divórcio homologado com partilha de bens realizada.',
    prazos: [
      {
        id: 'prazo-6',
        processId: 'sample-5',
        descricao: 'Apresentar documentação patrimonial',
        dataInicio: format(addDays(hoje, -60), 'yyyy-MM-dd'),
        diasCorridos: 10,
        tipoPrazo: 'cpc',
        dataFinal: format(addDays(hoje, -50), 'yyyy-MM-dd'),
        concluido: true,
        urgente: false,
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: '2024-01-05T08:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
]
