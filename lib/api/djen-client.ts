/**
 * DJEN API Client for Serverless Functions
 * 
 * API do Comunica PJe (DJEN) - Consulta de publicações do Diário de Justiça Eletrônico Nacional
 * Endpoint: https://comunicaapi.pje.jus.br/api/v1/caderno/{siglaTribunal}/{data}/{meio}
 * 
 * IMPORTANTE: Esta é a API do DJEN (publicações oficiais), diferente da API DataJud (metadados processuais)
 */

export interface DJENPublication {
  tribunal: string;
  data_disponibilizacao: string;
  tipo_comunicacao?: string;
  tipo?: string;
  orgao?: string;
  meio?: string;
  inteiro_teor?: string;
  inteiroTeor?: string;
  numero_processo?: string;
  partes?: string[];
  advogados?: string[];
}

export interface DJENFilteredResult {
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  matchType: 'nome' | 'oab' | 'ambos';
}

interface DJENQueryParams {
  tribunal: string;
  dataInicio: string;
  dataFim: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  ufOAB?: string;
}

const DEFAULT_TIMEOUT = 30000; // Reduced for serverless
const DEFAULT_DELAY = 1000;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extractUFFromOAB(numeroOAB: string): string | undefined {
  const match = numeroOAB.match(/OAB\/([A-Z]{2})/i);
  return match ? match[1].toUpperCase() : undefined;
}

function extractNumeroFromOAB(numeroOAB: string): string | undefined {
  const match = numeroOAB.match(/OAB\/[A-Z]{2}\s*(\d+)/i);
  return match ? match[1] : undefined;
}

function extractPublicationText(pub: DJENPublication): string {
  const parts = [
    pub.inteiro_teor || pub.inteiroTeor || '',
    pub.tipo_comunicacao || pub.tipo || '',
    pub.orgao || '',
    pub.partes?.join(' ') || '',
    pub.advogados?.join(' ') || '',
    pub.numero_processo || ''
  ];
  return parts.filter(Boolean).join(' ');
}

function matchesSearchTerms(
  publicationText: string,
  nomeAdvogado?: string,
  numeroOAB?: string
): { matches: boolean; matchType?: 'nome' | 'oab' | 'ambos' } {
  const normalizedText = normalizeText(publicationText);
  
  const nomeMatch = nomeAdvogado 
    ? normalizedText.includes(normalizeText(nomeAdvogado))
    : false;
  
  const oabMatch = numeroOAB
    ? normalizedText.includes(normalizeText(numeroOAB))
    : false;

  if (nomeMatch && oabMatch) {
    return { matches: true, matchType: 'ambos' };
  } else if (nomeMatch) {
    return { matches: true, matchType: 'nome' };
  } else if (oabMatch) {
    return { matches: true, matchType: 'oab' };
  }
  
  return { matches: false };
}

/**
 * Consulta publicações do DJEN (Diário de Justiça Eletrônico Nacional)
 * API do Comunica PJe - CNJ
 * 
 * Endpoint: GET https://comunicaapi.pje.jus.br/api/v1/caderno/{siglaTribunal}/{data}/{meio}
 * 
 * IMPORTANTE:
 * - Não requer autenticação (API pública)
 * - Requer User-Agent: PJe-DataCollector/1.0
 * - Requer Accept: application/json
 * - Data no formato AAAA-MM-DD
 * - Meio: 'html' ou 'pdf'
 */
async function consultarPublicacoesTribunal(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENPublication[]> {
  // DJEN usa formato: /caderno/{tribunal}/{data}/html
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${params.tribunal}/${params.dataInicio}/html`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'PJe-DataCollector/1.0',  // Obrigatório para API DJEN
        'Accept': 'application/json'            // Para receber JSON estruturado
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn(`[DJEN] Resposta não é JSON para ${params.tribunal}`);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn(`[DJEN] Resposta não é array para ${params.tribunal}`);
      return [];
    }

    return data as DJENPublication[];
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`[DJEN] Error querying ${params.tribunal}:`, error);
    return [];
  }
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function consultarDJENForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
}> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error('É necessário fornecer pelo menos um termo de busca');
  }

  const defaultDate = formatDate(new Date());
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || dataInicio || defaultDate;
  
  let numeroOABParsed: string | undefined;
  let ufOAB: string | undefined;
  
  if (numeroOAB) {
    ufOAB = extractUFFromOAB(numeroOAB);
    numeroOABParsed = extractNumeroFromOAB(numeroOAB);
  }

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];

  for (const tribunal of tribunais) {
    try {
      const publicacoes = await consultarPublicacoesTribunal(
        { 
          tribunal, 
          dataInicio: queryDataInicio, 
          dataFim: queryDataFim,
          nomeAdvogado,
          numeroOAB: numeroOABParsed,
          ufOAB
        },
        DEFAULT_TIMEOUT
      );

      for (const pub of publicacoes) {
        const pubText = extractPublicationText(pub);
        const { matches, matchType } = matchesSearchTerms(pubText, nomeAdvogado, numeroOAB);

        if (matches && matchType) {
          resultados.push({
            tribunal,
            data: queryDataInicio,
            tipo: pub.tipo_comunicacao || pub.tipo || 'Não especificado',
            teor: pub.inteiro_teor || pub.inteiroTeor || '',
            numeroProcesso: pub.numero_processo,
            orgao: pub.orgao,
            matchType
          });
        }
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, DEFAULT_DELAY));
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      erros.push({ tribunal, erro: errorMessage });
    }
  }

  return { resultados, erros };
}
