/**
 * DJEN API Client for Serverless Functions
 * 
 * This is a simplified version of the DJEN API client that works
 * in Vercel serverless functions without importing from src/
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

// Mapeamento de tribunais para endpoints DataJud API
const DATAJUD_ENDPOINTS: Record<string, string> = {
  'TJMG': 'api_publica_tjmg',
  'TRT3': 'api_publica_trt3',
  'TST': 'api_publica_tst',
  'STJ': 'api_publica_stj',
  'TRF1': 'api_publica_trf1',
};

async function consultarPublicacoesTribunal(
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENPublication[]> {
  const endpoint = DATAJUD_ENDPOINTS[params.tribunal];
  
  if (!endpoint) {
    console.warn(`[DJEN] Tribunal ${params.tribunal} não configurado no DataJud`);
    return [];
  }

  // API Key pública do DataJud (CNJ)
  const apiKey = process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
  
  // Construir query DataJud
  const query = {
    query: {
      bool: {
        must: [] as any[],
        filter: [
          {
            range: {
              dataAjuizamento: {
                gte: params.dataInicio,
                lte: params.dataFim
              }
            }
          }
        ]
      }
    },
    size: 100
  };

  // Adicionar filtros por advogado/OAB
  if (params.nomeAdvogado) {
    query.query.bool.must.push({
      match: {
        'advogados.nome': params.nomeAdvogado
      }
    });
  }

  if (params.numeroOAB && params.ufOAB) {
    query.query.bool.must.push({
      match: {
        'advogados.numeroOAB': `${params.numeroOAB}/${params.ufOAB}`
      }
    });
  }

  const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // DataJud retorna formato Elasticsearch
    const hits = data.hits?.hits || [];
    
    return hits.map((hit: any) => ({
      tribunal: params.tribunal,
      data_disponibilizacao: hit._source?.dataAjuizamento || params.dataInicio,
      tipo_comunicacao: hit._source?.classe?.nome || 'Não especificado',
      orgao: hit._source?.orgaoJulgador?.nome || '',
      inteiro_teor: JSON.stringify(hit._source).substring(0, 500),
      numero_processo: hit._source?.numeroProcesso || '',
      partes: hit._source?.partes?.map((p: any) => p.nome) || [],
      advogados: hit._source?.advogados?.map((a: any) => a.nome) || [],
    }));
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
