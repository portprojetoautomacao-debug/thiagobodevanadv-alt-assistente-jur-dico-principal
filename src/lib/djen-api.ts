export interface DJENPublication {
  tribunal: string
  data_disponibilizacao: string
  tipo_comunicacao?: string
  tipo?: string
  orgao?: string
  meio?: string
  inteiro_teor?: string
  inteiroTeor?: string
  numero_processo?: string
  partes?: string[]
  advogados?: string[]
}

export interface DJENQueryParams {
  tribunal: string
  data: string
  meio: 'html' | 'pdf'
}

export interface DJENFilteredResult {
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  matchType: 'nome' | 'oab' | 'ambos'
}

export interface DJENConfig {
  tribunais: string[]
  searchTerms: {
    nomeAdvogado?: string
    numeroOAB?: string
  }
  data?: string
  meio?: 'html' | 'pdf'
  timeout?: number
  delayBetweenRequests?: number
}

const DEFAULT_TRIBUNAIS = ['TST', 'TRT3', 'TJMG', 'TRF1', 'TJES', 'TJSP', 'STJ']
const DEFAULT_TIMEOUT = 60000
const DEFAULT_DELAY = 1500

export class DJENAPIError extends Error {
  constructor(
    message: string,
    public tribunal?: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'DJENAPIError'
  }
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function extractPublicationText(pub: DJENPublication): string {
  const parts = [
    pub.inteiro_teor || pub.inteiroTeor || '',
    pub.tipo_comunicacao || pub.tipo || '',
    pub.orgao || '',
    pub.partes?.join(' ') || '',
    pub.advogados?.join(' ') || '',
    pub.numero_processo || ''
  ]
  return parts.filter(Boolean).join(' ')
}

function matchesSearchTerms(
  publicationText: string,
  searchTerms: DJENConfig['searchTerms']
): { matches: boolean; matchType?: 'nome' | 'oab' | 'ambos' } {
  const normalizedText = normalizeText(publicationText)
  
  const nomeMatch = searchTerms.nomeAdvogado 
    ? normalizedText.includes(normalizeText(searchTerms.nomeAdvogado))
    : false
  
  const oabMatch = searchTerms.numeroOAB
    ? normalizedText.includes(normalizeText(searchTerms.numeroOAB))
    : false

  if (nomeMatch && oabMatch) {
    return { matches: true, matchType: 'ambos' }
  } else if (nomeMatch) {
    return { matches: true, matchType: 'nome' }
  } else if (oabMatch) {
    return { matches: true, matchType: 'oab' }
  }
  
  return { matches: false }
}

async function consultarPublicacoesTribunal(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENPublication[]> {
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${params.tribunal}/${params.data}/${params.meio}`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'PJe-DataCollector/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new DJENAPIError(
        `Erro HTTP ${response.status}: ${response.statusText}`,
        params.tribunal,
        response.status
      )
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      throw new DJENAPIError(
        'Resposta não está em formato JSON. Verifique os cabeçalhos da requisição.',
        params.tribunal
      )
    }

    const data = await response.json()
    
    if (!Array.isArray(data)) {
      if (data && typeof data === 'object' && Object.keys(data).length === 0) {
        return []
      }
      console.warn(`Resposta do tribunal ${params.tribunal} não é um array:`, data)
      return []
    }

    return data as DJENPublication[]
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof DJENAPIError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new DJENAPIError(
          `Timeout após ${timeout}ms aguardando resposta`,
          params.tribunal
        )
      }
      
      throw new DJENAPIError(
        `Erro de rede: ${error.message}`,
        params.tribunal,
        undefined,
        error
      )
    }

    throw new DJENAPIError(
      'Erro desconhecido ao consultar API',
      params.tribunal,
      undefined,
      error
    )
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parsePublicationToResult(
  pub: DJENPublication,
  tribunal: string,
  data: string,
  matchType: 'nome' | 'oab' | 'ambos'
): DJENFilteredResult {
  return {
    tribunal,
    data,
    tipo: pub.tipo_comunicacao || pub.tipo || 'Não especificado',
    teor: pub.inteiro_teor || pub.inteiroTeor || '',
    numeroProcesso: pub.numero_processo,
    orgao: pub.orgao,
    matchType
  }
}

export async function consultarDJEN(config: DJENConfig): Promise<{
  resultados: DJENFilteredResult[]
  erros: Array<{ tribunal: string; erro: string }>
  totalConsultado: number
}> {
  const {
    tribunais = DEFAULT_TRIBUNAIS,
    searchTerms,
    data,
    meio = 'html',
    timeout = DEFAULT_TIMEOUT,
    delayBetweenRequests = DEFAULT_DELAY
  } = config

  if (!searchTerms.nomeAdvogado && !searchTerms.numeroOAB) {
    throw new Error('É necessário fornecer pelo menos um termo de busca (nome ou OAB)')
  }

  const dataConsulta = data || formatDate(new Date())

  const resultados: DJENFilteredResult[] = []
  const erros: Array<{ tribunal: string; erro: string }> = []
  let totalPublicacoes = 0

  for (const tribunal of tribunais) {
    try {
      const publicacoes = await consultarPublicacoesTribunal(
        { tribunal, data: dataConsulta, meio },
        timeout
      )

      totalPublicacoes += publicacoes.length

      for (const pub of publicacoes) {
        const pubText = extractPublicationText(pub)
        const { matches, matchType } = matchesSearchTerms(pubText, searchTerms)

        if (matches && matchType) {
          resultados.push(parsePublicationToResult(pub, tribunal, dataConsulta, matchType))
        }
      }

      if (delayBetweenRequests > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests))
      }
    } catch (error) {
      if (error instanceof DJENAPIError) {
        erros.push({
          tribunal,
          erro: error.message
        })
      } else {
        erros.push({
          tribunal,
          erro: 'Erro desconhecido ao processar tribunal'
        })
      }
    }
  }

  return {
    resultados,
    erros,
    totalConsultado: totalPublicacoes
  }
}

export function getTribunaisDisponiveis(): string[] {
  return [...DEFAULT_TRIBUNAIS]
}

export function validarFormatoData(data: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(data)) return false
  
  const date = new Date(data)
  return !isNaN(date.getTime())
}

export function validarNumeroOAB(oab: string): boolean {
  const regex = /^OAB\/[A-Z]{2}\s*\d+$/i
  return regex.test(oab.trim())
}
