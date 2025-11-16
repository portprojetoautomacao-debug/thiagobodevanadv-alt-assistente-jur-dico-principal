import type { Process } from '@/types'

export async function generateRealisticProcesses(count: number = 10): Promise<Process[]> {
  const prompt = spark.llmPrompt`Você é um especialista em direito processual brasileiro. Gere exatamente ${count} processos jurídicos brasileiros ALTAMENTE REALISTAS e VARIADOS.

  IMPORTANTE: Use dados VERDADEIRAMENTE DIVERSOS e ESPECÍFICOS. Não repita padrões genéricos.
  
  TIPOS DE AÇÃO (variar bastante):
  - Ação de Cobrança, Ação de Despejo, Ação de Indenização por Danos Morais e Materiais
  - Ação de Execução de Título Extrajudicial, Ação de Rescisão Contratual
  - Ação Trabalhista - Horas Extras, Ação Trabalhista - Verbas Rescisórias
  - Ação de Reconhecimento de União Estável, Ação de Divórcio Litigioso
  - Ação de Usucapião Extraordinária, Ação Possessória - Reintegração de Posse
  - Ação de Alimentos, Ação de Inventário e Partilha
  - Ação Declaratória de Inexistência de Débito, Ação Revisional de Contrato
  - Ação de Responsabilidade Civil por Acidente de Trânsito
  - Ação Anulatória de Negócio Jurídico, Embargos à Execução
  
  NOMES DE PESSOAS (criar nomes brasileiros realistas e diversos):
  - Varie entre nomes comuns e menos comuns
  - Use sobrenomes variados (Silva, Santos, Oliveira, Souza, Pereira, Costa, Rodrigues, Almeida, Nascimento, Lima, Araújo, Fernandes, Carvalho, Gomes, Martins, Rocha, Ribeiro, Alves, Monteiro, Mendes, Barros, Freitas, Barbosa, Pinto, Moreira, Cavalcanti, Dias, Castro, Campos, Cardoso)
  
  EMPRESAS (criar nomes realistas de empresas brasileiras):
  - Construtoras: "[Nome] Construções Ltda", "[Nome] Engenharia S.A."
  - Comércio: "[Nome] Comércio de [Produto] Ltda", "Supermercado [Nome]"
  - Serviços: "[Nome] Serviços [Tipo] Ltda", "[Nome] Consultoria Empresarial"
  - Indústria: "Indústria [Nome] de [Produto] S.A."
  - Tecnologia: "[Nome] Tecnologia e Sistemas Ltda"
  
  COMARCAS DE MINAS GERAIS (variar muito):
  Belo Horizonte, Uberlândia, Contagem, Juiz de Fora, Betim, Montes Claros, Ribeirão das Neves, Uberaba, Governador Valadares, Ipatinga, Sete Lagoas, Divinópolis, Santa Luzia, Ibirité, Poços de Caldas, Patos de Minas, Pouso Alegre, Teófilo Otoni, Barbacena, Sabará, Varginha, Conselheiro Lafaiete, Itabira, Araguari, Passos, Vespasiano
  
  VARAS (específicas para cada tipo):
  - Cível: "1ª Vara Cível", "2ª Vara Cível", "3ª Vara Cível", "Vara Cível e Empresarial"
  - Família: "1ª Vara de Família", "2ª Vara de Família e Sucessões"
  - Trabalho: "1ª Vara do Trabalho", "2ª Vara do Trabalho", "Vara do Trabalho de [Cidade]"
  - Fazenda: "1ª Vara da Fazenda Pública", "Vara da Fazenda Pública Municipal"
  
  NÚMEROS CNJ (gerar números únicos e válidos):
  - Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
  - N = número sequencial (7 dígitos, varie de 0000001 a 9999999)
  - DD = dígito verificador (use 00 a 99)
  - AAAA = ano (2023, 2024, 2025)
  - J = segmento judiciário (8=Justiça Estadual, 5=Justiça do Trabalho)
  - TR = tribunal (13=TJMG, 03=TRT3)
  - OOOO = origem (varie de 0001 a 9999)
  
  VALORES (ser realista):
  - Ações pequenas: R$ 2.000 a R$ 15.000
  - Ações médias: R$ 20.000 a R$ 150.000
  - Ações grandes: R$ 200.000 a R$ 5.000.000
  - Algumas ações sem valor definido (use 0 ou omita)
  
  STATUS (distribuir realisticamente):
  - 60% "ativo" (maioria dos processos)
  - 20% "concluido" 
  - 15% "suspenso"
  - 5% "arquivado"
  
  DATAS:
  - Data de distribuição: entre 2023-01-01 e 2025-01-15 (variar bem)
  - Data de última movimentação: mais recente que distribuição (até hoje)
  - Use formato ISO para createdAt/updatedAt
  
  PRAZOS (1-3 por processo, descrições específicas):
  Descrições variadas e realistas:
  - "Apresentar contestação"
  - "Protocolar recurso de apelação"
  - "Apresentar documentos complementares"
  - "Cumprir diligência determinada"
  - "Manifestar sobre laudo pericial"
  - "Apresentar alegações finais"
  - "Indicar rol de testemunhas"
  - "Protocolar embargos de declaração"
  - "Regularizar representação processual"
  - "Comprovar recolhimento de custas"
  
  Prazos realistas:
  - CPC: 5, 10, 15, 20, 30 dias corridos
  - CLT: 5, 8, 15 dias corridos
  
  Datas de prazos:
  - Alguns já vencidos (dataFinal no passado, urgente=true)
  - Alguns próximos de vencer (2-5 dias, urgente=true)
  - Alguns com folga (10-30 dias, urgente=false)
  - Mix de concluídos (30%) e pendentes (70%)
  
  NOTAS (informações ESPECÍFICAS do processo):
  Exemplos realistas:
  - "Processo em fase de instrução. Aguardando juntada de documentos pela parte autora."
  - "Contestação apresentada pelo réu. Processo concluso para saneamento."
  - "Perícia deferida. Aguardando nomeação de perito pelo juízo."
  - "Audiência de conciliação realizada sem acordo. Processo segue para instrução."
  - "Sentença proferida parcialmente procedente. Prazo para recurso em andamento."
  - "Execução iniciada. Citado devedor para pagamento em 3 dias."
  - "Acordo homologado. Aguardando cumprimento das parcelas."
  - "Recurso de apelação distribuído ao TJ. Aguardando inclusão em pauta."
  
  FORMATO DE RETORNO:
  Retorne um objeto JSON com uma propriedade "processos" contendo o array de processos.
  
  {
    "processos": [
      {
        "id": "proc_[UNIQUE_ID]",
        "numeroCNJ": "0000000-00.0000.0.00.0000",
        "titulo": "Ação de [Tipo Específico]",
        "autor": "Nome Completo Realista",
        "reu": "Nome ou Empresa Realista",
        "comarca": "Cidade de MG",
        "vara": "Vara Específica",
        "status": "ativo|suspenso|arquivado|concluido",
        "valor": 50000.00,
        "dataDistribuicao": "YYYY-MM-DD",
        "dataUltimaMovimentacao": "2025-01-18T10:30:00.000Z",
        "notas": "Informação específica e realista sobre o andamento",
        "prazos": [
          {
            "id": "prazo_[UNIQUE_ID]",
            "processId": "proc_[SAME_PROCESS_ID]",
            "descricao": "Descrição específica do prazo",
            "dataInicio": "YYYY-MM-DD",
            "diasCorridos": 15,
            "tipoPrazo": "cpc",
            "dataFinal": "YYYY-MM-DD",
            "concluido": false,
            "urgente": false,
            "createdAt": "2025-01-18T10:30:00.000Z"
          }
        ],
        "createdAt": "2025-01-18T10:30:00.000Z",
        "updatedAt": "2025-01-18T15:45:00.000Z"
      }
    ]
  }
  
  GERE ${count} PROCESSOS COMPLETAMENTE DIFERENTES entre si!`

  try {
    const response = await spark.llm(prompt, "gpt-4o", true)
    const data = JSON.parse(response)
    
    if (!data.processos || !Array.isArray(data.processos)) {
      console.error('Formato inválido retornado pela IA:', data)
      return []
    }
    
    return data.processos
  } catch (error) {
    console.error('Erro ao gerar processos com IA:', error)
    throw new Error('Falha ao gerar processos. Por favor, tente novamente.')
  }
}

export async function initializeWithSampleData(): Promise<Process[]> {
  const { SAMPLE_PROCESSES } = await import('./sample-data')
  return SAMPLE_PROCESSES
}
