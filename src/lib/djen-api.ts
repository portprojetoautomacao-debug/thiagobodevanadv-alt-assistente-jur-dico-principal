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
  dataInicio: string
  dataFim: string
  nomeAdvogado?: string
  numeroOAB?: string
  ufOAB?: string
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
  dataInicio?: string
  dataFim?: string
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

// ===== Error handling helpers (reduces S3776 Cognitive Complexity) =====

function createTimeoutError(timeout: number, tribunal: string): DJENAPIError {
  return new DJENAPIError(
    `Timeout após ${timeout}ms aguardando resposta`,
    tribunal
  )
}

function createNetworkError(error: Error, tribunal: string): DJENAPIError {
  return new DJENAPIError(
    `Erro de rede: ${error.message}`,
    tribunal,
    undefined,
    error
  )
}

function createUnknownError(tribunal: string, originalError?: unknown): DJENAPIError {
  return new DJENAPIError(
    'Erro desconhecido ao consultar API',
    tribunal,
    undefined,
    originalError
  )
}

function handleFetchError(error: unknown, tribunal: string, timeout: number): never {
  if (error instanceof DJENAPIError) {
    throw error
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      throw createTimeoutError(timeout, tribunal)
    }
    throw createNetworkError(error, tribunal)
  }

  throw createUnknownError(tribunal, error)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {}
  const value = numeroOAB.trim()

  const matchOABPattern = value.match(/OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i)
  if (matchOABPattern) {
    return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() }
  }

  const matchNumericUF = value.match(/(\d+)\s*\/\s*([A-Z]{2})/i)
  if (matchNumericUF) {
    return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() }
  }

  const matchNumeric = value.match(/^(\d+)$/)
  if (matchNumeric) {
    return { numero: matchNumeric[1] }
  }

  const matchOABOnly = value.match(/OAB\s*\/\s*([A-Z]{2})/i)
  if (matchOABOnly) {
    return { uf: matchOABOnly[1].toUpperCase() }
  }

  return {}
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

// ===== Match type helpers (reduces S3776) =====

type MatchType = 'nome' | 'oab' | 'ambos'

function determineMatchType(nomeMatch: boolean, oabMatch: boolean): { matches: boolean; matchType?: MatchType } {
  if (nomeMatch && oabMatch) return { matches: true, matchType: 'ambos' }
  if (nomeMatch) return { matches: true, matchType: 'nome' }
  if (oabMatch) return { matches: true, matchType: 'oab' }
  return { matches: false }
}

function matchesSearchTerms(
  publicationText: string,
  searchTerms: DJENConfig['searchTerms']
): { matches: boolean; matchType?: MatchType } {
  const normalizedText = normalizeText(publicationText)

  const nomeMatch = searchTerms.nomeAdvogado
    ? normalizedText.includes(normalizeText(searchTerms.nomeAdvogado))
    : false

  const oabMatch = searchTerms.numeroOAB
    ? normalizedText.includes(normalizeText(searchTerms.numeroOAB))
    : false

  return determineMatchType(nomeMatch, oabMatch)
}

// ===== Response validation helpers (reduces S3776) =====

function validateResponseStatus(response: Response, tribunal: string): void {
  if (!response.ok) {
    throw new DJENAPIError(
      `Erro HTTP ${response.status}: ${response.statusText}`,
      tribunal,
      response.status
    )
  }
}

function validateResponseContentType(response: Response, tribunal: string): void {
  const contentType = response.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    throw new DJENAPIError(
      'Resposta não está em formato JSON. Verifique os cabeçalhos da requisição.',
      tribunal
    )
  }
}

function parseResponseData(data: unknown, tribunal: string): DJENPublication[] {
  if (Array.isArray(data)) {
    return data as DJENPublication[]
  }

  if (data && typeof data === 'object' && Object.keys(data).length === 0) {
    return []
  }

  console.warn(`Resposta do tribunal ${tribunal} não é um array:`, data)
  return []
}

async function consultarPublicacoesTribunal(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENPublication[]> {
  const queryParams = new URLSearchParams()
  queryParams.append('siglaTribunal', params.tribunal)
  queryParams.append('dataDisponibilizacaoInicio', params.dataInicio)
  queryParams.append('dataDisponibilizacaoFim', params.dataFim)

  if (params.nomeAdvogado) {
    queryParams.append('nomeAdvogado', params.nomeAdvogado)
  }

  if (params.numeroOAB && params.ufOAB) {
    queryParams.append('numeroOab', params.numeroOAB)
    queryParams.append('ufOab', params.ufOAB)
  }

  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryParams.toString()}`

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

    validateResponseStatus(response, params.tribunal)
    validateResponseContentType(response, params.tribunal)

    const data = await response.json()
    return parseResponseData(data, params.tribunal)
  } catch (error) {
    clearTimeout(timeoutId)
    handleFetchError(error, params.tribunal, timeout)
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
    dataInicio,
    dataFim,
    timeout = DEFAULT_TIMEOUT,
    delayBetweenRequests = DEFAULT_DELAY
  } = config

  if (!searchTerms.nomeAdvogado && !searchTerms.numeroOAB) {
    throw new Error('É necessário fornecer pelo menos um termo de busca (nome ou OAB)')
  }

  // Use the same date for both inicio and fim if not specified
  const defaultDate = formatDate(new Date())
  const queryDataInicio = dataInicio || defaultDate
  const queryDataFim = dataFim || dataInicio || defaultDate

  // Extract UF and number from OAB if provided
  let numeroOAB: string | undefined
  let ufOAB: string | undefined

  if (searchTerms.numeroOAB) {
    const parsed = parseOAB(searchTerms.numeroOAB)
    ufOAB = parsed.uf
    numeroOAB = parsed.numero
  }

  const resultados: DJENFilteredResult[] = []
  const erros: Array<{ tribunal: string; erro: string }> = []
  let totalPublicacoes = 0

  for (const tribunal of tribunais) {
    try {
      const publicacoes = await consultarPublicacoesTribunal(
        {
          tribunal,
          dataInicio: queryDataInicio,
          dataFim: queryDataFim,
          nomeAdvogado: searchTerms.nomeAdvogado,
          numeroOAB,
          ufOAB
        },
        timeout
      )

      totalPublicacoes += publicacoes.length

      for (const pub of publicacoes) {
        const pubText = extractPublicationText(pub)
        const { matches, matchType } = matchesSearchTerms(pubText, searchTerms)

        if (matches && matchType) {
          resultados.push(parsePublicationToResult(pub, tribunal, queryDataInicio, matchType))
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
  if (isNaN(date.getTime())) return false

  // Verifica se a data não foi ajustada (ex: 2025-04-31 vira 2025-05-01)
  const [year, month, day] = data.split('-').map(Number)
  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

export function validarNumeroOAB(oab: string): boolean {
  // Accept formats: "OAB/UF 123456", "123456/UF", "123456"
  const trimmed = oab.trim()
  if (/^OAB\/[A-Z]{2}\s*\d+$/i.test(trimmed)) return true
  if (/^\d+\/[A-Z]{2}$/i.test(trimmed)) return true
  if (/^\d+$/.test(trimmed)) return true
  return false
}
