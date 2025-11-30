/**
 * Cliente DJEN compartilhado
 * Centraliza toda a lógica de integração com a API do DJEN
 */

import { SafeLogger } from './safe-logger.js';

const logger = new SafeLogger('DJEN');

export interface DJENComunicacao {
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  tipoDocumento: string;
  nomeClasse: string;
  codigoClasse: string;
  numeroComunicacao: number;
  ativo: boolean;
  hash: string;
  datadisponibilizacao: string;
  meiocompleto: string;
  numeroprocessocommascara: string;
  destinatarios: Array<{
    nome: string;
    polo: string;
    comunicacao_id: number;
  }>;
  destinatarioadvogados: Array<{
    id: number;
    comunicacao_id: number;
    advogado_id: number;
    created_at: string;
    updated_at: string;
    advogado: {
      id: number;
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

export interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: 'nome' | 'oab' | 'ambos';
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

export interface DJENQueryParams {
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: 'E' | 'D';
}

// Constantes
const DJEN_TIMEOUT = 10000; // Reduzido para 10s
const DJEN_DELAY = 500; // Reduzido para 500ms
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Utilitários de texto
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').trim();
}

export function parseOAB(numeroOAB: string): { numero?: string; uf?: string } {
  if (!numeroOAB) return {};
  const value = numeroOAB.trim();
  const matchOABPattern = value.match(/OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i);
  if (matchOABPattern) return { numero: matchOABPattern[2], uf: matchOABPattern[1].toUpperCase() };
  const matchNumericUF = value.match(/(\d+)\s*\/\s*([A-Z]{2})/i);
  if (matchNumericUF) return { numero: matchNumericUF[1], uf: matchNumericUF[2].toUpperCase() };
  const matchNumeric = value.match(/^(\d+)$/);
  if (matchNumeric) return { numero: matchNumeric[1] };
  return {};
}

/**
 * Constrói query string para API DJEN
 */
export function buildDJENQueryString(params: DJENQueryParams): string {
  const queryParams: string[] = [];
  if (params.numeroOab) queryParams.push(`numeroOab=${encodeURIComponent(params.numeroOab)}`);
  if (params.ufOab) queryParams.push(`ufOab=${encodeURIComponent(params.ufOab)}`);
  if (params.nomeAdvogado) queryParams.push(`nomeAdvogado=${encodeURIComponent(params.nomeAdvogado)}`);
  if (params.dataDisponibilizacaoInicio) queryParams.push(`dataDisponibilizacaoInicio=${params.dataDisponibilizacaoInicio}`);
  if (params.dataDisponibilizacaoFim) queryParams.push(`dataDisponibilizacaoFim=${params.dataDisponibilizacaoFim}`);
  if (params.siglaTribunal) queryParams.push(`siglaTribunal=${encodeURIComponent(params.siglaTribunal)}`);
  if (params.pagina) queryParams.push(`pagina=${params.pagina}`);
  if (params.itensPorPagina) queryParams.push(`itensPorPagina=${params.itensPorPagina}`);
  if (params.meio) queryParams.push(`meio=${params.meio}`);
  return queryParams.join('&');
}

/**
 * Executa consulta à API DJEN com retry e circuit breaker
 */
export async function consultarComunicacoes(
  params: DJENQueryParams,
  retryCount: number = 0
): Promise<{ response: DJENResponse | null; rateLimitInfo: { limit?: number; remaining?: number }; retryAfter?: number }> {
  const queryString = buildDJENQueryString(params);
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${queryString}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DJEN_TIMEOUT);

  try {
    logger.debug('Consultando DJEN', { url: url.replace(/numeroOab=[^&]*/, 'numeroOab=***') });

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const rateLimitInfo = {
      limit: response.headers.get('x-ratelimit-limit') ? Number.parseInt(response.headers.get('x-ratelimit-limit')!, 10) : undefined,
      remaining: response.headers.get('x-ratelimit-remaining') ? Number.parseInt(response.headers.get('x-ratelimit-remaining')!, 10) : undefined
    };

    // Rate limit atingido
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      logger.warn('Rate limit DJEN atingido', { retryAfter, retryCount });
      return {
        response: null,
        rateLimitInfo,
        retryAfter: retryAfter ? Number.parseInt(retryAfter, 10) : RETRY_DELAY * Math.pow(2, retryCount)
      };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as DJENResponse;
    logger.debug('Consulta DJEN bem-sucedida', { count: data.count });

    return { response: data, rateLimitInfo };

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Timeout na consulta DJEN', { retryCount });
    } else {
      logger.error('Erro na consulta DJEN', error, { retryCount });
    }

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      logger.info(`Tentando novamente em ${delay}ms`, { retryCount: retryCount + 1 });

      await new Promise(resolve => setTimeout(resolve, delay));
      return consultarComunicacoes(params, retryCount + 1);
    }

    return { response: null, rateLimitInfo: {} };
  }
}

// ===== Helper functions for consultarDJENForLawyer (reduces S3776) =====

interface AdvogadoMatch {
  matchType: 'nome' | 'oab' | 'ambos';
  matched: boolean;
}

function checkAdvogadoMatch(
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): AdvogadoMatch {
  const matchNome = nomeAdvogado 
    ? normalizeText(dest.advogado.nome).includes(normalizeText(nomeAdvogado)) 
    : false;
  const matchOab = numeroOabNumerico 
    ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab 
    : false;

  if (matchNome && matchOab) return { matchType: 'ambos', matched: true };
  if (matchOab) return { matchType: 'oab', matched: true };
  if (matchNome) return { matchType: 'nome', matched: true };
  return { matchType: 'nome', matched: false };
}

function buildDJENQueryParams(
  tribunal: string,
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: 'D' | 'E' | undefined
): DJENQueryParams {
  const queryParams: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: queryDataInicio,
    dataDisponibilizacaoFim: queryDataFim,
    itensPorPagina: 100,
    pagina: 1
  };

  if (nomeAdvogado) queryParams.nomeAdvogado = nomeAdvogado;
  if (numeroOabNumerico) queryParams.numeroOab = numeroOabNumerico;
  if (ufOab) queryParams.ufOab = ufOab;
  if (meio) queryParams.meio = meio;

  return queryParams;
}

function processComunicacao(
  comunicacao: DJENComunicacao,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): DJENFilteredResult | null {
  let matchType: 'nome' | 'oab' | 'ambos' = 'nome';
  
  const temAdvogado = comunicacao.destinatarioadvogados?.some(dest => {
    const result = checkAdvogadoMatch(dest, nomeAdvogado, numeroOabNumerico, ufOab);
    if (result.matched) {
      matchType = result.matchType;
      return true;
    }
    return false;
  }) || false;

  if (!temAdvogado) return null;

  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: comunicacao.data_disponibilizacao,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto || 'Ver documento completo',
    numeroProcesso: comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados: comunicacao.destinatarioadvogados?.map(dest => ({
      nome: dest.advogado.nome,
      numero_oab: dest.advogado.numero_oab,
      uf_oab: dest.advogado.uf_oab
    })) || []
  };
}

/**
 * Consulta comunicações para um advogado específico
 * Refactored to reduce cognitive complexity (S3776)
 */
export async function consultarDJENForLawyer(
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: 'D' | 'E'
): Promise<{ resultados: DJENFilteredResult[]; erros: Array<{ tribunal: string; erro: string }>; rateLimitWarning?: boolean }> {
  if (!nomeAdvogado && !numeroOAB) {
    throw new Error('É necessário fornecer pelo menos nomeAdvogado ou numeroOAB');
  }

  const defaultDate = new Date().toISOString().split('T')[0];
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio;

  let numeroOabNumerico: string | undefined;
  let ufOab: string | undefined;
  if (numeroOAB) {
    const parsed = parseOAB(numeroOAB);
    numeroOabNumerico = parsed.numero;
    ufOab = parsed.uf;
  }

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for (const tribunal of tribunais) {
    try {
      const queryParams = buildDJENQueryParams(
        tribunal, queryDataInicio, queryDataFim, 
        nomeAdvogado, numeroOabNumerico, ufOab, meio
      );

      const { response, rateLimitInfo: _rateLimitInfo, retryAfter } = await consultarComunicacoes(queryParams);

      if (!response) {
        const errorMsg = retryAfter 
          ? `Rate limit - tentar novamente em ${retryAfter}s` 
          : 'Erro na consulta ou timeout';
        if (retryAfter) rateLimitWarning = true;
        erros.push({ tribunal, erro: errorMsg });
        continue;
      }

      for (const comunicacao of response.items) {
        const resultado = processComunicacao(comunicacao, nomeAdvogado, numeroOabNumerico, ufOab);
        if (resultado) resultados.push(resultado);
      }

      // Delay entre tribunais
      if (tribunais.indexOf(tribunal) < tribunais.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DJEN_DELAY));
      }

    } catch (error) {
      erros.push({
        tribunal,
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  return { resultados, erros, rateLimitWarning: rateLimitWarning ? true : undefined };
}

export interface DJENResponse {
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult {
  id: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso: string;
  orgao: string;
  meio: string;
  link: string;
  hash: string;
  matchType: 'nome' | 'oab' | 'ambos';
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}







/**
 * Download de caderno completo do DJEN (arquivo compactado)
 * Endpoint: GET /api/v1/caderno/{sigla_tribunal}/{data}/{meio}
 * 
 * ATENÇÃO: Este endpoint retorna metadados e URL temporária (5 minutos) para download
 * Os cadernos do dia atual são disponibilizados a partir das 02:00
 * 
 * @param siglaTribunal - Sigla do tribunal (ex: 'TJMG', 'TRT3')
 * @param data - Data no formato AAAA-MM-DD
 * @param meio - 'E' para Edital, 'D' para Diário Eletrônico
 */
export async function downloadCadernoDJEN(
  siglaTribunal: string,
  data: string,
  meio: 'E' | 'D' = 'D'
): Promise<{
  tribunal: string;
  sigla_tribunal: string;
  meio: string;
  status: string;
  versao: string;
  data: string;
  total_comunicacoes: number;
  numero_paginas: number;
  hash: string;
  url: string; // URL temporária válida por 5 minutos
} | null> {
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${siglaTribunal}/${data}/${meio}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`[DJEN] Erro ao baixar caderno: HTTP ${response.status}`);
      return null;
    }

    const caderno = await response.json();
    console.log(`[DJEN] Caderno disponível: ${caderno.total_comunicacoes} comunicações, ${caderno.numero_paginas} páginas`);

    return caderno;
  } catch (error) {
    console.error(`[DJEN] Erro ao baixar caderno:`, error);
    return null;
  }
}
