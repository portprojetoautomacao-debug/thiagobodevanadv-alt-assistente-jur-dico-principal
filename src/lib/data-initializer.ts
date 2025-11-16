import type { Process } from '@/types'

export async function generateRealisticProcesses(count: number = 10): Promise<Process[]> {
  const prompt = spark.llmPrompt`Gere exatamente ${count} processos jurídicos brasileiros realistas e variados. 
  
  Cada processo deve ter:
  - Número CNJ válido no formato 0000000-00.0000.0.00.0000
  - Título descritivo do tipo de ação
  - Nomes realistas de autores e réus (pessoas ou empresas)
  - Comarcas e varas de Minas Gerais variadas
  - Status variado (ativo, suspenso, arquivado, concluido)
  - Valores monetários variados (alguns processos sem valor)
  - Datas de distribuição nos últimos 2 anos
  - 1-3 prazos por processo com descrições realistas
  - Notas com informações sobre o andamento processual
  
  Para cada prazo:
  - Descrição específica (ex: "Apresentar contestação", "Protocolar recurso")
  - Data inicial e final realistas
  - Dias corridos entre 5 e 30 dias
  - Tipo de prazo: "cpc" ou "clt"
  - Status de conclusão e urgência variados
  
  Retorne um objeto JSON com uma propriedade "processos" contendo o array de processos.
  
  Formato de cada processo:
  {
    "id": "UNIQUE_ID",
    "numeroCNJ": "0000000-00.0000.0.00.0000",
    "titulo": "Tipo de Ação",
    "autor": "Nome do Autor",
    "reu": "Nome do Réu",
    "comarca": "Cidade MG",
    "vara": "Vara Específica",
    "status": "ativo|suspenso|arquivado|concluido",
    "valor": 0,
    "dataDistribuicao": "YYYY-MM-DD",
    "dataUltimaMovimentacao": "ISO_DATE",
    "notas": "Informações sobre o processo",
    "prazos": [
      {
        "id": "UNIQUE_ID",
        "processId": "PROCESS_ID",
        "descricao": "Descrição do prazo",
        "dataInicio": "YYYY-MM-DD",
        "diasCorridos": 15,
        "tipoPrazo": "cpc|clt",
        "dataFinal": "YYYY-MM-DD",
        "concluido": false,
        "urgente": false,
        "createdAt": "ISO_DATE"
      }
    ],
    "createdAt": "ISO_DATE",
    "updatedAt": "ISO_DATE"
  }`

  const response = await spark.llm(prompt, "gpt-4o", true)
  const data = JSON.parse(response)
  
  return data.processos || []
}

export async function initializeWithSampleData(): Promise<Process[]> {
  const { SAMPLE_PROCESSES } = await import('./sample-data')
  return SAMPLE_PROCESSES
}
