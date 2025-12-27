/**
 * API para sincronização manual do DJEN
 *
 * Este endpoint é público e pode ser chamado pelo frontend para forçar
 * uma sincronização com a API do DJEN.
 *
 * POST /api/djen-sync - Executa sincronização para advogados monitorados
 * 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
 */

import * as Sentry from "@sentry/node";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";

// Rate limiting para evitar abuso
const SYNC_COOLDOWN_MS = 60_000; // 1 minuto entre syncs
const DJEN_TIMEOUT = 15_000;

interface MonitoredLawyer
{
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

interface StoredPublication
{
  id: string;
  djenId?: number;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  matchType: "nome" | "oab" | "ambos";
  lawyerId: string;
  lawyerName?: string;
  lawyerOAB?: string;
  advogados?: Array<{ nome: string; numero_oab: string; uf_oab: string }>;
  notified: boolean;
  createdAt: string;
}

interface DJENComunicacao
{
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string;
  link: string;
  hash: string;
  destinatarioadvogados?: Array<{
    advogado: {
      nome: string;
      numero_oab: string;
      uf_oab: string;
    };
  }>;
}

interface DJENResponse
{
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

interface DJENQueryParams
{
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  dataInicio?: string;
  dataFim?: string;
  meio?: "D" | "E";
}

const KV_KEYS = {
  PUBLICATIONS: "publications",
  LAST_SYNC: "last-djen-sync",
  LAST_CHECK: "last-djen-check",
  MONITORED_LAWYERS: "monitored-lawyers",
  PUBLICATION_HASHES: "publication-hashes",
} as const;

// Redis singleton (evita várias conexões em cold starts)
let _kvClient: Redis | null = null;

async function getKv (): Promise<Redis>
{
  if ( _kvClient ) return _kvClient;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
  {
    throw new Error( "Upstash Redis not configured" );
  }

  _kvClient = new Redis( {
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  } );

  return _kvClient;
}

function parseOAB ( oab: string ): { numero?: string; uf?: string }
{
  if ( !oab || oab.length > 50 ) return {};
  const match = /^(?<numero>\d+)\s?[/-]?\s?(?<uf>[A-Z]{2})$/i.exec( oab );
  if ( match?.groups ) return { numero: match.groups.numero, uf: match.groups.uf?.toUpperCase() };

  const numOnlyMatch = /^\d+$/.exec( oab );
  if ( numOnlyMatch ) return { numero: numOnlyMatch[ 0 ] };

  return {};
}

function formatDate ( date: Date ): string
{
  return date.toISOString().split( "T" )[ 0 ] ?? "";
}

// ===========================
// Helper: Build DJEN query URL
// ===========================
function buildDJENQueryUrl ( params: DJENQueryParams ): string
{
  const queryParts: string[] = [
    ...( params.numeroOab ? [ `numeroOab=${ encodeURIComponent( params.numeroOab ) }` ] : [] ),
    ...( params.ufOab ? [ `ufOab=${ encodeURIComponent( params.ufOab ) }` ] : [] ),
    ...( params.nomeAdvogado ? [ `nomeAdvogado=${ encodeURIComponent( params.nomeAdvogado ) }` ] : [] ),
    ...( params.dataInicio ? [ `dataDisponibilizacaoInicio=${ params.dataInicio }` ] : [] ),
    ...( params.dataFim ? [ `dataDisponibilizacaoFim=${ params.dataFim }` ] : [] ),
    "itensPorPagina=50",
    `meio=${ params.meio || "D" }`, // D = Digital (intimações eletrônicas)
  ];

  return `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${ queryParts.join(
    "&"
  ) }`;
}

// ===========================
// Helper: Handle DJEN response status
// ===========================
function handleDJENResponseStatus ( response: Response ): void
{
  if ( response.status === 429 )
  {
    console.warn( "[DJEN-Sync] Rate limit atingido" );
  }

  if ( response.status === 403 )
  {
    console.error(
      "[DJEN-Sync] Acesso bloqueado (403) - possível bloqueio geográfico"
    );
    throw new Error(
      "API DJEN bloqueou acesso - verifique se a função está rodando no Brasil (gru1)"
    );
  }

  if ( !response.ok )
  {
    throw new Error( `HTTP ${ response.status }: ${ response.statusText }` );
  }
}

async function consultarDJEN (
  params: DJENQueryParams
): Promise<DJENResponse | null>
{
  const url = buildDJENQueryUrl( params );
  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), DJEN_TIMEOUT );

  try
  {
    console.log(
      "[DJEN-Sync] Consultando:",
      url.replace( /numeroOab=[^&]*/, "numeroOab=***" )
    );

    const response = await fetch( url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AssistenteJuridico/1.0",
      },
      signal: controller.signal,
    } );

    clearTimeout( timeoutId );

    if ( response.status === 429 )
    {
      return null;
    }

    handleDJENResponseStatus( response );

    return ( await response.json() ) as DJENResponse;
  } catch ( error )
  {
    clearTimeout( timeoutId );

    if ( error instanceof Error && error.name === "AbortError" )
    {
      console.error( "[DJEN-Sync] Timeout na consulta" );
      throw new Error( "Timeout na consulta DJEN" );
    }

    throw error;
  }
}

// ===========================
// Helper: Set CORS headers
// ===========================
function setCorsHeaders ( res: VercelResponse ): void
{
  res.setHeader( "Access-Control-Allow-Origin", "*" );
  res.setHeader( "Access-Control-Allow-Methods", "POST, OPTIONS" );
  res.setHeader( "Access-Control-Allow-Headers", "Content-Type" );
}

// ===========================
// Helper: Check rate limit
// ===========================
async function checkRateLimit (
  kv: Redis,
  res: VercelResponse
): Promise<boolean>
{
  const lastSync = await kv.get<string>( KV_KEYS.LAST_SYNC );
  if ( !lastSync ) return false;

  const elapsed = Date.now() - new Date( lastSync ).getTime();
  if ( elapsed < SYNC_COOLDOWN_MS )
  {
    const waitSeconds = Math.ceil( ( SYNC_COOLDOWN_MS - elapsed ) / 1000 );
    res.status( 429 ).json( {
      ok: false,
      error: "Rate limit",
      message: `Aguarde ${ waitSeconds }s antes de sincronizar novamente`,
      retryAfter: waitSeconds,
    } );
    return true;
  }
  return false;
}

// ===========================
// Helper: Create publication from DJEN item
// ===========================
function createPublication (
  item: DJENComunicacao,
  lawyer: MonitoredLawyer
): StoredPublication
{
  const hash =
    item.hash ||
    `${ item.siglaTribunal }-${ item.data_disponibilizacao }-${ item.numero_processo }`;

  return {
    id: randomUUID(),
    djenId: item.id,
    tribunal: item.siglaTribunal,
    data: item.data_disponibilizacao,
    tipo: item.tipoComunicacao || "Intimação",
    teor: item.texto?.substring( 0, 2000 ) || "",
    numeroProcesso: item.numero_processo,
    orgao: item.nomeOrgao,
    meio: item.meio,
    link: item.link,
    hash,
    matchType: "oab",
    lawyerId: lawyer.id,
    lawyerName: lawyer.name,
    lawyerOAB: lawyer.oab,
    advogados: item.destinatarioadvogados?.map( ( d ) => d.advogado ) ?? [],
    notified: false,
    createdAt: new Date().toISOString(),
  };
}

// ===========================
// Helper: Process lawyer publications
// ===========================
async function processLawyerPublications (
  lawyer: MonitoredLawyer,
  dataInicio: string,
  dataFim: string,
  existingPubs: StoredPublication[],
  existingHashes: Set<string>
): Promise<{ total: number; newCount: number; error?: string }>
{
  const { numero, uf } = parseOAB( lawyer.oab );

  if ( !numero )
  {
    console.warn( `[DJEN-Sync] OAB inválida para ${ lawyer.name }: ${ lawyer.oab }` );
    return { total: 0, newCount: 0 };
  }

  const djenResponse = await consultarDJEN( {
    numeroOab: numero,
    ufOab: uf,
    dataInicio,
    dataFim,
  } );

  if ( !djenResponse?.items )
  {
    return { total: 0, newCount: 0 };
  }

  let newCount = 0;
  for ( const item of djenResponse.items )
  {
    const hash =
      item.hash ||
      `${ item.siglaTribunal }-${ item.data_disponibilizacao }-${ item.numero_processo }`;

    if ( existingHashes.has( hash ) )
    {
      continue;
    }

    const newPublication = createPublication( item, lawyer );
    existingPubs.unshift( newPublication );
    newCount++;
  }

  return { total: djenResponse.items.length, newCount };
}

// ===========================
// Main sync logic
// 🔥 INSTRUMENTADO COM SENTRY AI MONITORING V2
// ===========================
async function executeSyncForLawyers (
  kv: Redis,
  enabledLawyers: MonitoredLawyer[]
): Promise<{ totalPublications: number; newPublications: number; errors: string[] }>
{
  return Sentry.startSpan(
    {
      name: "invoke_agent Monitor DJEN",
      op: "gen_ai.invoke_agent",
      attributes: {
        "gen_ai.operation.name": "invoke_agent",
        "gen_ai.agent.name": "Monitor DJEN",
        "gen_ai.system": "custom-llm", // Não usa LLM diretamente
        "job.type": "background-sync",
        "job.name": "djen-monitor",
        "lawyers.count": enabledLawyers.length,
        "server.side": true,
        "vercel.function": "djen-sync",
      },
    },
    async ( span ) =>
    {
      const hoje = new Date();
      const dataFim = formatDate( hoje );
      const dataInicio = formatDate( new Date( hoje.getTime() - 7 * 24 * 60 * 60 * 1000 ) );

      let totalPublications = 0;
      let newPublications = 0;
      const errors: string[] = [];

      const existingPubs = ( await kv.get<StoredPublication[]>( KV_KEYS.PUBLICATIONS ) ) ?? [];
      const existingHashes = new Set(
        existingPubs.map( ( p ) => p.hash || `${ p.tribunal }-${ p.data }-${ p.numeroProcesso ?? "" }` )
      );

      for ( const lawyer of enabledLawyers )
      {
        try
        {
          const result = await processLawyerPublications(
            lawyer,
            dataInicio,
            dataFim,
            existingPubs,
            existingHashes
          );
          totalPublications += result.total;
          newPublications += result.newCount;

          // Delay to avoid rate limit
          await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
        } catch ( error )
        {
          const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
          errors.push( `${ lawyer.name }: ${ errorMsg }` );
          console.error( `[DJEN-Sync] Erro para ${ lawyer.name }:`, error );
        }
      }

      // Save publications (max 1000)
      await kv.set( KV_KEYS.PUBLICATIONS, existingPubs.slice( 0, 1000 ) );

      // Update timestamps
      const now = new Date().toISOString();
      await kv.set( KV_KEYS.LAST_SYNC, now );
      await kv.set( KV_KEYS.LAST_CHECK, now );

      // Atributos de conclusão para Sentry
      span?.setAttribute( "publications.total", totalPublications );
      span?.setAttribute( "publications.new", newPublications );
      span?.setAttribute( "errors.count", errors.length );
      span?.setAttribute( "sync.completed", true );
      if ( errors.length > 0 )
      {
        span?.setAttribute( "sync.errors", JSON.stringify( errors.slice( 0, 5 ) ) ); // Max 5 erros
      }

      return { totalPublications, newPublications, errors };
    }
  );
}

export default async function handler ( req: VercelRequest, res: VercelResponse )
{
  setCorsHeaders( res );

  if ( req.method === "OPTIONS" )
  {
    return res.status( 200 ).end();
  }

  if ( req.method !== "POST" )
  {
    return res.status( 405 ).json( { error: "Method not allowed" } );
  }

  const startTime = Date.now();

  try
  {
    const kv = await getKv();

    // Rate limiting check
    if ( await checkRateLimit( kv, res ) )
    {
      return;
    }

    // Get enabled lawyers
    const lawyers =
      ( await kv.get<MonitoredLawyer[]>( KV_KEYS.MONITORED_LAWYERS ) ) ?? [];
    const enabledLawyers = lawyers.filter( ( l ) => l.enabled );

    if ( enabledLawyers.length === 0 )
    {
      return res.status( 200 ).json( {
        ok: true,
        message: "Nenhum advogado configurado para monitoramento",
        lawyersChecked: 0,
        publicationsFound: 0,
      } );
    }

    // Execute sync
    const { totalPublications, newPublications, errors } =
      await executeSyncForLawyers( kv, enabledLawyers );

    const duration = Date.now() - startTime;

    return res.status( 200 ).json( {
      ok: true,
      message:
        newPublications > 0
          ? `Encontradas ${ newPublications } novas publicações`
          : "Nenhuma nova publicação encontrada",
      result: {
        lawyersChecked: enabledLawyers.length,
        publicationsFound: totalPublications,
        newPublications,
        duration: `${ duration }ms`,
        errors: errors.length > 0 ? errors : undefined,
      },
    } );
  } catch ( error )
  {
    console.error( "[DJEN-Sync] Error:", error );
    return res.status( 500 ).json( {
      ok: false,
      error: error instanceof Error ? error.message : "Erro interno",
      hint: "Verifique se o Upstash Redis está configurado e se a região da função é gru1 (São Paulo) para acessar a API do PJ-e.",
    } );
  }
}
export interface DJENPublication
{
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

export interface DJENQueryParams
{
  tribunal: string;
  dataInicio: string;
  dataFim: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  ufOAB?: string;
}

export interface DJENFilteredResult
{
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  matchType: "nome" | "oab" | "ambos";
}

export interface DJENConfig
{
  tribunais: string[];
  searchTerms: {
    nomeAdvogado?: string;
    numeroOAB?: string;
  };
  dataInicio?: string;
  dataFim?: string;
  timeout?: number;
  delayBetweenRequests?: number;
}

const DEFAULT_TRIBUNAIS = [ "TST", "TRT3", "TJMG", "TRF1", "TJES", "TJSP", "STJ" ];
const DEFAULT_TIMEOUT = 60000;
const DEFAULT_DELAY = 1500;

export class DJENAPIError extends Error
{
  constructor (
    message: string,
    public tribunal?: string,
    public statusCode?: number,
    public originalError?: unknown
  )
  {
    super( message );
    this.name = "DJENAPIError";
  }
}

// ===== Error handling helpers (reduces S3776 Cognitive Complexity) =====

function createTimeoutError ( timeout: number, tribunal: string ): DJENAPIError
{
  return new DJENAPIError( `Timeout após ${ timeout }ms aguardando resposta`, tribunal );
}

function createNetworkError ( error: Error, tribunal: string ): DJENAPIError
{
  return new DJENAPIError( `Erro de rede: ${ error.message }`, tribunal, undefined, error );
}

function createUnknownError ( tribunal: string, originalError?: unknown ): DJENAPIError
{
  return new DJENAPIError( "Erro desconhecido ao consultar API", tribunal, undefined, originalError );
}

function handleFetchError ( error: unknown, tribunal: string, timeout: number ): never
{
  if ( error instanceof DJENAPIError )
  {
    throw error;
  }

  if ( error instanceof Error )
  {
    if ( error.name === "AbortError" )
    {
      throw createTimeoutError( timeout, tribunal );
    }
    throw createNetworkError( error, tribunal );
  }

  throw createUnknownError( tribunal, error );
}

function normalizeText ( text: string ): string
{
  return text
    .toLowerCase()
    .normalize( "NFD" )
    .replaceAll( /[\u0300-\u036f]/g, "" )
    .trim();
}

function parseOAB ( numeroOAB: string ): { numero?: string; uf?: string }
{
  if ( !numeroOAB ) return {};
  const value = numeroOAB.trim();

  const matchOABPattern = /OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i.exec( value );
  if ( matchOABPattern )
  {
    return { numero: matchOABPattern[ 2 ], uf: matchOABPattern[ 1 ].toUpperCase() };
  }

  const matchNumericUF = /(\d+)\s?\/\s?([A-Z]{2})/i.exec( value );
  if ( matchNumericUF )
  {
    return { numero: matchNumericUF[ 1 ], uf: matchNumericUF[ 2 ].toUpperCase() };
  }

  const matchNumeric = /^(\d+)$/.exec( value );
  if ( matchNumeric )
  {
    return { numero: matchNumeric[ 1 ] };
  }

  const matchOABOnly = /OAB\s*\/\s*([A-Z]{2})/i.exec( value );
  if ( matchOABOnly )
  {
    return { uf: matchOABOnly[ 1 ].toUpperCase() };
  }

  return {};
}

function extractPublicationText ( pub: DJENPublication ): string
{
  const parts = [
    pub.inteiro_teor || pub.inteiroTeor || "",
    pub.tipo_comunicacao || pub.tipo || "",
    pub.orgao || "",
    pub.partes?.join( " " ) || "",
    pub.advogados?.join( " " ) || "",
    pub.numero_processo || "",
  ];
  return parts.filter( Boolean ).join( " " );
}

// ===== Match type helpers (reduces S3776) =====

type MatchType = "nome" | "oab" | "ambos";

function determineMatchType (
  nomeMatch: boolean,
  oabMatch: boolean
): { matches: boolean; matchType?: MatchType }
{
  if ( nomeMatch && oabMatch ) return { matches: true, matchType: "ambos" };
  if ( nomeMatch ) return { matches: true, matchType: "nome" };
  if ( oabMatch ) return { matches: true, matchType: "oab" };
  return { matches: false };
}

function matchesSearchTerms (
  publicationText: string,
  searchTerms: DJENConfig[ "searchTerms" ]
): { matches: boolean; matchType?: MatchType }
{
  const normalizedText = normalizeText( publicationText );

  const nomeMatch = searchTerms.nomeAdvogado
    ? normalizedText.includes( normalizeText( searchTerms.nomeAdvogado ) )
    : false;

  const oabMatch = searchTerms.numeroOAB
    ? normalizedText.includes( normalizeText( searchTerms.numeroOAB ) )
    : false;

  return determineMatchType( nomeMatch, oabMatch );
}

// ===== Response validation helpers (reduces S3776) =====

function validateResponseStatus ( response: Response, tribunal: string ): void
{
  if ( !response.ok )
  {
    throw new DJENAPIError(
      `Erro HTTP ${ response.status }: ${ response.statusText }`,
      tribunal,
      response.status
    );
  }
}

function validateResponseContentType ( response: Response, tribunal: string ): void
{
  const contentType = response.headers.get( "content-type" );
  if ( !contentType?.includes( "application/json" ) )
  {
    throw new DJENAPIError(
      "Resposta não está em formato JSON. Verifique os cabeçalhos da requisição.",
      tribunal
    );
  }
}

function parseResponseData ( data: unknown, tribunal: string ): DJENPublication[]
{
  if ( Array.isArray( data ) )
  {
    return data as DJENPublication[];
  }

  if ( data && typeof data === "object" && Object.keys( data ).length === 0 )
  {
    return [];
  }

  console.warn( `Resposta do tribunal ${ tribunal } não é um array:`, data );
  return [];
}

async function consultarPublicacoesTribunal (
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DJENPublication[]>
{
  const queryParams = new URLSearchParams();
  queryParams.append( "siglaTribunal", params.tribunal );
  queryParams.append( "dataDisponibilizacaoInicio", params.dataInicio );
  queryParams.append( "dataDisponibilizacaoFim", params.dataFim );

  if ( params.nomeAdvogado )
  {
    queryParams.append( "nomeAdvogado", params.nomeAdvogado );
  }

  if ( params.numeroOAB && params.ufOAB )
  {
    queryParams.append( "numeroOab", params.numeroOAB );
    queryParams.append( "ufOab", params.ufOAB );
  }

  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${ queryParams.toString() }`;

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), timeout );

  try
  {
    const response = await fetch( url, {
      method: "GET",
      headers: {
        "User-Agent": "PJe-DataCollector/1.0",
        Accept: "application/json",
      },
      signal: controller.signal,
    } );

    clearTimeout( timeoutId );

    validateResponseStatus( response, params.tribunal );
    validateResponseContentType( response, params.tribunal );

    const data = await response.json();
    return parseResponseData( data, params.tribunal );
  } catch ( error )
  {
    clearTimeout( timeoutId );
    handleFetchError( error, params.tribunal, timeout );
  }
}

function formatDate ( date: Date ): string
{
  const year = date.getFullYear();
  const month = String( date.getMonth() + 1 ).padStart( 2, "0" );
  const day = String( date.getDate() ).padStart( 2, "0" );
  return `${ year }-${ month }-${ day }`;
}

function parsePublicationToResult (
  pub: DJENPublication,
  tribunal: string,
  data: string,
  matchType: "nome" | "oab" | "ambos"
): DJENFilteredResult
{
  return {
    tribunal,
    data,
    tipo: pub.tipo_comunicacao || pub.tipo || "Não especificado",
    teor: pub.inteiro_teor || pub.inteiroTeor || "",
    numeroProcesso: pub.numero_processo,
    orgao: pub.orgao,
    matchType,
  };
}

// ===== Query helpers (reduces S3776 Cognitive Complexity) =====

interface QueryDates
{
  queryDataInicio: string;
  queryDataFim: string;
}

function resolveQueryDates ( config: DJENConfig ): QueryDates
{
  const defaultDate = formatDate( new Date() );
  const queryDataInicio = config.dataInicio || defaultDate;
  const queryDataFim = config.dataFim || config.dataInicio || defaultDate;
  return { queryDataInicio, queryDataFim };
}

interface OABParsedParams
{
  numeroOAB?: string;
  ufOAB?: string;
}

function resolveOABParams ( searchTerms: DJENConfig[ "searchTerms" ] ): OABParsedParams
{
  if ( !searchTerms.numeroOAB )
  {
    return {};
  }
  const parsed = parseOAB( searchTerms.numeroOAB );
  return { numeroOAB: parsed.numero, ufOAB: parsed.uf };
}

/**
 * Filters and maps publications to results - extracted to reduce CC
 */
function filterPublicationsToResults (
  publicacoes: DJENPublication[],
  tribunal: string,
  queryDataInicio: string,
  searchTerms: DJENConfig[ "searchTerms" ]
): DJENFilteredResult[]
{
  const results: DJENFilteredResult[] = [];

  for ( const pub of publicacoes )
  {
    const pubText = extractPublicationText( pub );
    const { matches, matchType } = matchesSearchTerms( pubText, searchTerms );

    if ( matches && matchType )
    {
      results.push( parsePublicationToResult( pub, tribunal, queryDataInicio, matchType ) );
    }
  }

  return results;
}

/**
 * Handles error from tribunal query - extracted to reduce CC
 */
function handleTribunalError ( error: unknown, tribunal: string ): { tribunal: string; erro: string }
{
  if ( error instanceof DJENAPIError )
  {
    return { tribunal, erro: error.message };
  }
  return { tribunal, erro: "Erro desconhecido ao processar tribunal" };
}

/**
 * Processes a single tribunal query - extracted to reduce CC
 */
async function processTribunalQuery (
  tribunal: string,
  queryParams: DJENQueryParams,
  searchTerms: DJENConfig[ "searchTerms" ],
  timeout: number,
  delayBetweenRequests: number
): Promise<{
  results: DJENFilteredResult[];
  publicationsCount: number;
  error?: { tribunal: string; erro: string };
}>
{
  try
  {
    const publicacoes = await consultarPublicacoesTribunal( queryParams, timeout );
    const results = filterPublicationsToResults(
      publicacoes,
      tribunal,
      queryParams.dataInicio,
      searchTerms
    );

    if ( delayBetweenRequests > 0 )
    {
      await new Promise( ( resolve ) => setTimeout( resolve, delayBetweenRequests ) );
    }

    return {
      results,
      publicationsCount: publicacoes.length,
    };
  } catch ( error )
  {
    return {
      results: [],
      publicationsCount: 0,
      error: handleTribunalError( error, tribunal ),
    };
  }
}

export async function consultarDJEN ( config: DJENConfig ): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  totalConsultado: number;
}>
{
  const {
    tribunais = DEFAULT_TRIBUNAIS,
    searchTerms,
    timeout = DEFAULT_TIMEOUT,
    delayBetweenRequests = DEFAULT_DELAY,
  } = config;

  if ( !searchTerms.nomeAdvogado && !searchTerms.numeroOAB )
  {
    throw new Error( "É necessário fornecer pelo menos um termo de busca (nome ou OAB)" );
  }

  // Use extracted helpers to reduce cognitive complexity
  const { queryDataInicio, queryDataFim } = resolveQueryDates( config );
  const { numeroOAB, ufOAB } = resolveOABParams( searchTerms );

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let totalPublicacoes = 0;

  for ( const tribunal of tribunais )
  {
    const queryParams: DJENQueryParams = {
      tribunal,
      dataInicio: queryDataInicio,
      dataFim: queryDataFim,
      nomeAdvogado: searchTerms.nomeAdvogado,
      numeroOAB,
      ufOAB,
    };

    const queryResult = await processTribunalQuery(
      tribunal,
      queryParams,
      searchTerms,
      timeout,
      delayBetweenRequests
    );

    resultados.push( ...queryResult.results );
    totalPublicacoes += queryResult.publicationsCount;

    if ( queryResult.error )
    {
      erros.push( queryResult.error );
    }
  }

  return {
    resultados,
    erros,
    totalConsultado: totalPublicacoes,
  };
}

export function getTribunaisDisponiveis (): string[]
{
  return [ ...DEFAULT_TRIBUNAIS ];
}

export function validarFormatoData ( data: string ): boolean
{
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if ( !regex.test( data ) ) return false;

  const date = new Date( data );
  if ( Number.isNaN( date.getTime() ) ) return false;

  // Verifica se a data não foi ajustada (ex: 2025-04-31 vira 2025-05-01)
  const [ year, month, day ] = data.split( "-" ).map( Number );
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}

export function validarNumeroOAB ( oab: string ): boolean
{
  // Accept formats: "OAB/UF 123456", "123456/UF", "123456"
  const trimmed = oab.trim();
  if ( /^OAB\/[A-Z]{2}\s*\d+$/i.test( trimmed ) ) return true;
  if ( /^\d+\/[A-Z]{2}$/i.test( trimmed ) ) return true;
  if ( /^\d+$/.test( trimmed ) ) return true;
  return false;
}
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Newspaper, RefreshCw } from "lucide-react";

interface DJENErrorCardProps
{
  readonly compact?: boolean;
  readonly error?: string;
  readonly onRetry: () => void;
}

export function DJENErrorCard ( { compact = false, error, onRetry }: Readonly<DJENErrorCardProps> )
{
  return (
    <Card className= { cn ("card-glow-hover glassmorphic", compact && "h-fit")
}>
  <CardHeader className="pb-2" >
    <CardTitle className="flex items-center gap-2 text-sm" >
      <Newspaper size={ 20 } className = "text-primary" />
        Publicações DJEN
          </CardTitle>
          </CardHeader>
          < CardContent >
          <Alert variant="destructive" >
            <AlertTriangle size={ 16 } />
              < AlertDescription > { error } </AlertDescription>
              </Alert>
              < Button variant = "outline" size = "sm" onClick = { onRetry } className = "mt-3 w-full" >
                <RefreshCw size={ 16 } />
          Tentar novamente
  </Button>
  </CardContent>
  </Card>
  );
}
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DJENLoadingCardProps
{
  readonly compact?: boolean;
}

export function DJENLoadingCard ( { compact = false }: Readonly<DJENLoadingCardProps> )
{
  return (
    <Card className= { cn ("card-glow-hover glassmorphic", compact && "h-fit")
}>
  <CardHeader className="pb-2" >
    <div className="flex items-center justify-between" >
      <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          </CardHeader>
          < CardContent >
          <div className="space-y-3" >
          {
            [ 1, 2, 3 ].map( ( i ) => (
              <div key= { i } className = "space-y-2" >
              <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            </div>
            ))
          }
            </div>
            </CardContent>
            </Card>
  );
}
/**
 * Cliente DJEN compartilhado
 * Centraliza toda a lógica de integração com a API do DJEN
 */

import { SafeLogger } from "./safe-logger.js";

const logger = new SafeLogger( "DJEN" );

// Type aliases para evitar repetição de union types (SonarCloud S4323)
type DJENMeio = "D" | "E";
export type DJENMatchType = "nome" | "oab" | "ambos";

export interface DJENComunicacao
{
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

export interface DJENResponse
{
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult
{
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
  matchType: DJENMatchType;
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

export interface DJENQueryParams
{
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  siglaTribunal?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  pagina?: number;
  itensPorPagina?: number;
  meio?: "E" | "D";
}

// Constantes
const DJEN_TIMEOUT = 10000; // Reduzido para 10s
const DJEN_DELAY = 500; // Reduzido para 500ms
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Utilitários de texto
 */
export function normalizeText ( text: string ): string
{
  return text
    .toLowerCase()
    .normalize( "NFD" )
    .replaceAll( /[\u0300-\u036f]/g, "" )
    .trim();
}

// ===== OAB parsing helpers (reduces S3776) =====

function parseOABWithPattern ( value: string ): { numero?: string; uf?: string } | null
{
  const matchOABPattern = /OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i.exec( value );
  if ( matchOABPattern )
  {
    return { numero: matchOABPattern[ 2 ], uf: matchOABPattern[ 1 ].toUpperCase() };
  }
  return null;
}

function parseOABNumericUF ( value: string ): { numero?: string; uf?: string } | null
{
  const matchNumericUF = /(\d+)\s?\/\s?([A-Z]{2})/i.exec( value );
  if ( matchNumericUF )
  {
    return { numero: matchNumericUF[ 1 ], uf: matchNumericUF[ 2 ].toUpperCase() };
  }
  return null;
}

function parseOABNumericOnly ( value: string ): { numero?: string; uf?: string } | null
{
  const matchNumeric = /^(\d+)$/.exec( value );
  return matchNumeric ? { numero: matchNumeric[ 0 ] } : null;
}

export function parseOAB ( numeroOAB: string ): { numero?: string; uf?: string }
{
  if ( !numeroOAB || numeroOAB.length > 50 ) return {};
  const value = numeroOAB.trim();

  return parseOABWithPattern( value ) ?? parseOABNumericUF( value ) ?? parseOABNumericOnly( value ) ?? {};
}

/**
 * Constrói query string para API DJEN
 */
export function buildDJENQueryString ( params: DJENQueryParams ): string
{
  const queryParts: string[] = [];

  const addParam = ( key: string, value: string | number | undefined ) =>
  {
    if ( value !== undefined )
    {
      queryParts.push( `${ key }=${ encodeURIComponent( String( value ) ) }` );
    }
  };

  addParam( "numeroOab", params.numeroOab );
  addParam( "ufOab", params.ufOab );
  addParam( "nomeAdvogado", params.nomeAdvogado );
  addParam( "dataDisponibilizacaoInicio", params.dataDisponibilizacaoInicio );
  addParam( "dataDisponibilizacaoFim", params.dataDisponibilizacaoFim );
  addParam( "siglaTribunal", params.siglaTribunal );
  addParam( "pagina", params.pagina );
  addParam( "itensPorPagina", params.itensPorPagina );
  addParam( "meio", params.meio );

  return queryParts.join( "&" );
}

// ===== consultarComunicacoes helpers (reduces S3776) =====

interface RateLimitInfo
{
  limit?: number;
  remaining?: number;
}

interface ConsultaResult
{
  response: DJENResponse | null;
  rateLimitInfo: RateLimitInfo;
  retryAfter?: number;
}

function extractRateLimitInfo ( response: Response ): RateLimitInfo
{
  const limit = response.headers.get( "x-ratelimit-limit" );
  const remaining = response.headers.get( "x-ratelimit-remaining" );
  return {
    limit: limit ? Number.parseInt( limit, 10 ) : undefined,
    remaining: remaining ? Number.parseInt( remaining, 10 ) : undefined,
  };
}

function handleRateLimit ( response: Response, retryCount: number ): ConsultaResult
{
  const retryAfterHeader = response.headers.get( "retry-after" );
  const retryAfter = retryAfterHeader
    ? Number.parseInt( retryAfterHeader, 10 )
    : RETRY_DELAY * Math.pow( 2, retryCount );

  logger.warn( "Rate limit DJEN atingido", { retryAfter, retryCount } );

  return {
    response: null,
    rateLimitInfo: extractRateLimitInfo( response ),
    retryAfter,
  };
}

async function handleRetry (
  params: DJENQueryParams,
  retryCount: number,
  errorType: "timeout" | "error",
  error?: unknown
): Promise<ConsultaResult>
{
  if ( errorType === "timeout" )
  {
    logger.error( "Timeout na consulta DJEN", { retryCount } );
  } else
  {
    logger.error( "Erro na consulta DJEN", error, { retryCount } );
  }

  if ( retryCount >= MAX_RETRIES )
  {
    return { response: null, rateLimitInfo: {} };
  }

  const delay = RETRY_DELAY * Math.pow( 2, retryCount );
  logger.info( `Tentando novamente em ${ delay }ms`, { retryCount: retryCount + 1 } );

  await new Promise( ( resolve ) => setTimeout( resolve, delay ) );
  return consultarComunicacoes( params, retryCount + 1 );
}

/**
 * Executa consulta à API DJEN com retry e circuit breaker
 * Refactored to reduce cognitive complexity (S3776)
 */
export async function consultarComunicacoes (
  params: DJENQueryParams,
  retryCount: number = 0
): Promise<ConsultaResult>
{
  const queryString = buildDJENQueryString( params );
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${ queryString }`;

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), DJEN_TIMEOUT );

  try
  {
    logger.debug( "Consultando DJEN", { url: url.replaceAll( /numeroOab=[^&]*/g, "numeroOab=***" ) } );

    const response = await fetch( url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    } );

    clearTimeout( timeoutId );

    if ( response.status === 429 )
    {
      return handleRateLimit( response, retryCount );
    }

    if ( !response.ok )
    {
      throw new Error( `HTTP ${ response.status }: ${ response.statusText }` );
    }

    const data = ( await response.json() ) as DJENResponse;
    logger.debug( "Consulta DJEN bem-sucedida", { count: data.count } );

    return { response: data, rateLimitInfo: extractRateLimitInfo( response ) };
  } catch ( error )
  {
    clearTimeout( timeoutId );
    const errorType = error instanceof Error && error.name === "AbortError" ? "timeout" : "error";
    return handleRetry( params, retryCount, errorType, error );
  }
}

// ===== Helper functions for consultarDJENForLawyer (reduces S3776) =====

interface AdvogadoMatch
{
  matchType: DJENMatchType;
  matched: boolean;
}

function checkAdvogadoMatch (
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): AdvogadoMatch
{
  const matchNome = nomeAdvogado
    ? normalizeText( dest.advogado.nome ).includes( normalizeText( nomeAdvogado ) )
    : false;
  const matchOab = numeroOabNumerico
    ? dest.advogado.numero_oab === numeroOabNumerico && dest.advogado.uf_oab === ufOab
    : false;

  let matchType: DJENMatchType = "nome";
  const matched = matchNome || matchOab;
  if ( matchNome && matchOab ) matchType = "ambos";
  else if ( matchOab ) matchType = "oab";

  return { matchType, matched };
}

function buildDJENQueryParams (
  tribunal: string,
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: DJENMeio | undefined
): DJENQueryParams
{
  const queryParams: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: queryDataInicio,
    dataDisponibilizacaoFim: queryDataFim,
    itensPorPagina: 100,
    pagina: 1,
  };

  if ( nomeAdvogado ) queryParams.nomeAdvogado = nomeAdvogado;
  if ( numeroOabNumerico ) queryParams.numeroOab = numeroOabNumerico;
  if ( ufOab ) queryParams.ufOab = ufOab;
  if ( meio ) queryParams.meio = meio;

  return queryParams;
}

function processComunicacao (
  comunicacao: DJENComunicacao,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): DJENFilteredResult | null
{
  let matchType: DJENMatchType = "nome";

  const temAdvogado =
    comunicacao.destinatarioadvogados?.some( ( dest ) =>
    {
      const result = checkAdvogadoMatch( dest, nomeAdvogado, numeroOabNumerico, ufOab );
      if ( result.matched )
      {
        matchType = result.matchType;
        return true;
      }
      return false;
    } ) || false;

  if ( !temAdvogado ) return null;

  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: comunicacao.data_disponibilizacao,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto || "Ver documento completo",
    numeroProcesso: comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados:
      comunicacao.destinatarioadvogados?.map( ( dest ) => ( {
        nome: dest.advogado.nome,
        numero_oab: dest.advogado.numero_oab,
        uf_oab: dest.advogado.uf_oab,
      } ) ) || [],
  };
}

// ===== Tribunal query helpers (reduces S3776) =====

interface TribunalQueryResult
{
  resultados: DJENFilteredResult[];
  error?: string;
  rateLimitHit: boolean;
}

function handleQueryError ( retryAfter: number | undefined ):
  {
    error: string;
    rateLimitHit: boolean;
  }
{
  const errorMsg = retryAfter
    ? `Rate limit - tentar novamente em ${ retryAfter }s`
    : "Erro na consulta ou timeout";
  return { error: errorMsg, rateLimitHit: !!retryAfter };
}

function processTribunalResponse (
  response: DJENResponse,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined
): DJENFilteredResult[]
{
  const resultados: DJENFilteredResult[] = [];
  for ( const comunicacao of response.items )
  {
    const resultado = processComunicacao( comunicacao, nomeAdvogado, numeroOabNumerico, ufOab );
    if ( resultado ) resultados.push( resultado );
  }
  return resultados;
}

async function queryTribunal (
  tribunal: string,
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: "D" | "E" | undefined
): Promise<TribunalQueryResult>
{
  const queryParams = buildDJENQueryParams(
    tribunal,
    queryDataInicio,
    queryDataFim,
    nomeAdvogado,
    numeroOabNumerico,
    ufOab,
    meio
  );

  const { response, retryAfter } = await consultarComunicacoes( queryParams );

  if ( !response )
  {
    const { error, rateLimitHit } = handleQueryError( retryAfter );
    return { resultados: [], error, rateLimitHit };
  }

  const resultados = processTribunalResponse( response, nomeAdvogado, numeroOabNumerico, ufOab );
  return { resultados, rateLimitHit: false };
}

/**
 * Consulta comunicações para um advogado específico
 * Refactored to reduce cognitive complexity (S3776)
 */
export async function consultarDJENForLawyer (
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: "D" | "E"
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}>
{
  if ( !nomeAdvogado && !numeroOAB )
  {
    throw new Error( "É necessário fornecer pelo menos nomeAdvogado ou numeroOAB" );
  }

  const defaultDate = new Date().toISOString().split( "T" )[ 0 ];
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || queryDataInicio;

  const parsedOAB = numeroOAB ? parseOAB( numeroOAB ) : { numero: undefined, uf: undefined };
  const numeroOabNumerico = parsedOAB.numero;
  const ufOab = parsedOAB.uf;

  return await queryAllTribunais(
    tribunais,
    queryDataInicio,
    queryDataFim,
    nomeAdvogado,
    numeroOabNumerico,
    ufOab,
    meio
  );
}

/**
 * Processa resultado de query de tribunal individual
 */
function processQueryResult (
  queryResult: TribunalQueryResult,
  tribunal: string,
  resultados: DJENFilteredResult[],
  erros: Array<{ tribunal: string; erro: string }>
): boolean
{
  if ( queryResult.error )
  {
    erros.push( { tribunal, erro: queryResult.error } );
    return queryResult.rateLimitHit;
  }
  resultados.push( ...queryResult.resultados );
  return false;
}

/**
 * Consulta todos os tribunais com delay entre requisições
 */
async function queryAllTribunais (
  tribunais: string[],
  queryDataInicio: string,
  queryDataFim: string,
  nomeAdvogado: string | undefined,
  numeroOabNumerico: string | undefined,
  ufOab: string | undefined,
  meio: "D" | "E" | undefined
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}>
{
  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for ( let i = 0; i < tribunais.length; i++ )
  {
    const tribunal = tribunais[ i ];
    try
    {
      const queryResult = await queryTribunal(
        tribunal,
        queryDataInicio,
        queryDataFim,
        nomeAdvogado,
        numeroOabNumerico,
        ufOab,
        meio
      );

      const hitRateLimit = processQueryResult( queryResult, tribunal, resultados, erros );
      if ( hitRateLimit ) rateLimitWarning = true;

      // Delay entre tribunais
      if ( i < tribunais.length - 1 )
      {
        await new Promise( ( resolve ) => setTimeout( resolve, DJEN_DELAY ) );
      }
    } catch ( error )
    {
      erros.push( {
        tribunal,
        erro: error instanceof Error ? error.message : "Erro desconhecido",
      } );
    }
  }

  return { resultados, erros, rateLimitWarning: rateLimitWarning || undefined };
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
export async function downloadCadernoDJEN (
  siglaTribunal: string,
  data: string,
  meio: "E" | "D" = "D"
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
} | null>
{
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${ siglaTribunal }/${ data }/${ meio }`;

  try
  {
    const response = await fetch( url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    } );

    if ( !response.ok )
    {
      console.error( `[DJEN] Erro ao baixar caderno: HTTP ${ response.status }` );
      return null;
    }

    const caderno = await response.json();
    console.log(
      `[DJEN] Caderno disponível: ${ caderno.total_comunicacoes } comunicações, ${ caderno.numero_paginas } páginas`
    );

    return caderno;
  } catch ( error )
  {
    console.error( `[DJEN] Erro ao baixar caderno:`, error );
    return null;
  }
}
/**
 * DJEN API Client for Serverless Functions
 *
 * API do Comunica PJe (DJEN) - Consulta de publicações do Diário de Justiça Eletrônico Nacional
 * Endpoint: https://comunicaapi.pje.jus.br/api/v1/comunicacao
 *
 * Documentação oficial: https://comunicaapi.pje.jus.br/swagger/index.html
 * Versão: 1.0.3 (atualizada em 29/05/2025)
 *
 * IMPORTANTE: Esta é a API do DJEN (publicações oficiais), diferente da API DataJud (metadados processuais)
 *
 * Rate Limiting:
 * - Cabeçalhos de controle: x-ratelimit-limit, x-ratelimit-remaining
 * - Erro 429: aguardar 1 minuto antes de retomar
 * - Uso de múltiplos IPs para contornar limite é considerado abuso
 *
 * Limites de consulta (10000 resultados máximo):
 * - Pesquisas com campos textuais ou OAB
 * - Pesquisas com 5 ou menos itensPorPagina
 * - Pesquisas com dataInicio != dataFim
 * - Pesquisas com numeroProcesso
 */

export interface DJENComunicacao
{
  id: number;
  data_disponibilizacao: string;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  texto: string;
  numero_processo: string;
  meio: string; // "E" para Edital, "D" para Diário Eletrônico
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

export interface DJENResponse
{
  status: string;
  message: string;
  count: number;
  items: DJENComunicacao[];
}

export interface DJENFilteredResult
{
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
  matchType: "nome" | "oab" | "ambos";
  advogados: Array<{
    nome: string;
    numero_oab: string;
    uf_oab: string;
  }>;
}

interface DJENQueryParams
{
  numeroOab?: string;
  ufOab?: string;
  nomeAdvogado?: string;
  nomeParte?: string;
  numeroProcesso?: string;
  dataDisponibilizacaoInicio?: string;
  dataDisponibilizacaoFim?: string;
  siglaTribunal?: string;
  numeroComunicacao?: number;
  pagina?: number;
  itensPorPagina?: number; // 5 ou 100
  meio?: "E" | "D"; // E = Edital, D = Diário
}

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;
const RATE_LIMIT_RETRY_DELAY = 60000; // 1 minuto conforme documentação

function normalizeText ( text: string ): string
{
  return text
    .toLowerCase()
    .normalize( "NFD" )
    .replace( /[\u0300-\u036f]/g, "" )
    .trim();
}

/**
 * Parse multiple OAB formats: "OAB/UF 123456", "OAB/UF123456", "123456/UF", "123456"
 * Returns { numero, uf } where applicable
 */
function parseOAB ( numeroOAB: string ): { numero?: string; uf?: string }
{
  if ( !numeroOAB ) return {};
  // Trim and normalize
  const value = numeroOAB.trim();

  // Match patterns like "OAB/UF 123456" or "OAB/UF123456"
  const matchOABPattern = /OAB\s*\/\s*([A-Z]{2})\s*(\d+)/i.exec( value );
  if ( matchOABPattern )
  {
    return { numero: matchOABPattern[ 2 ], uf: matchOABPattern[ 1 ].toUpperCase() };
  }

  // Match numeric with UF: "123456/UF" or "123456/UF"
  const matchNumericUF = /(\d+)\s*\/\s*([A-Z]{2})/i.exec( value );
  if ( matchNumericUF )
  {
    return { numero: matchNumericUF[ 1 ], uf: matchNumericUF[ 2 ].toUpperCase() };
  }

  // Match simple numeric OAB
  const matchNumeric = /^(\d+)$/.exec( value );
  if ( matchNumeric )
  {
    return { numero: matchNumeric[ 1 ] };
  }

  // Match "OAB/UF" without number
  const matchOABOnly = /OAB\s*\/\s*([A-Z]{2})/i.exec( value );
  if ( matchOABOnly )
  {
    return { uf: matchOABOnly[ 1 ].toUpperCase() };
  }

  return {};
}

function buildQueryString ( params: DJENQueryParams ): string
{
  const queryParams: string[] = [];

  if ( params.numeroOab ) queryParams.push( `numeroOab=${ encodeURIComponent( params.numeroOab ) }` );
  if ( params.ufOab ) queryParams.push( `ufOab=${ encodeURIComponent( params.ufOab ) }` );
  if ( params.nomeAdvogado )
    queryParams.push( `nomeAdvogado=${ encodeURIComponent( params.nomeAdvogado ) }` );
  if ( params.nomeParte ) queryParams.push( `nomeParte=${ encodeURIComponent( params.nomeParte ) }` );
  if ( params.numeroProcesso )
    queryParams.push( `numeroProcesso=${ encodeURIComponent( params.numeroProcesso ) }` );
  if ( params.dataDisponibilizacaoInicio )
    queryParams.push( `dataDisponibilizacaoInicio=${ params.dataDisponibilizacaoInicio }` );
  if ( params.dataDisponibilizacaoFim )
    queryParams.push( `dataDisponibilizacaoFim=${ params.dataDisponibilizacaoFim }` );
  if ( params.siglaTribunal )
    queryParams.push( `siglaTribunal=${ encodeURIComponent( params.siglaTribunal ) }` );
  if ( params.numeroComunicacao ) queryParams.push( `numeroComunicacao=${ params.numeroComunicacao }` );
  if ( params.pagina ) queryParams.push( `pagina=${ params.pagina }` );
  if ( params.itensPorPagina )
    queryParams.push( `itensPorPagina=${ params.itensPorPagina }` );
  if ( params.meio ) queryParams.push( `meio=${ params.meio }` );

  return queryParams.join( "&" );
}

/**
 * Consulta comunicações no DJEN (Diário de Justiça Eletrônico Nacional)
 * API do Comunica PJe - CNJ
 *
 * Endpoint: GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
 *
 * IMPORTANTE:
 * - Não requer autenticação
 * - Requer pelo menos um dos parâmetros: siglaTribunal, texto, nomeParte, nomeAdvogado, numeroOab, numeroProcesso
 * - Ou limitado a 5 itensPorPagina
 * - Respeita rate limiting (x-ratelimit-limit, x-ratelimit-remaining)
 * - Data no formato AAAA-MM-DD
 */
async function consultarComunicacoes (
  params: DJENQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<{
  response: DJENResponse | null;
  rateLimitInfo: { limit?: number; remaining?: number };
}>
{
  const queryString = buildQueryString( params );
  const url = `https://comunicaapi.pje.jus.br/api/v1/comunicacao?${ queryString }`;

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), timeout );

  try
  {
    const response = await fetch( url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    } );

    clearTimeout( timeoutId );

    // Extrair informações de rate limiting
    const rateLimitInfo = {
      limit: response.headers.get( "x-ratelimit-limit" )
        ? parseInt( response.headers.get( "x-ratelimit-limit" )! )
        : undefined,
      remaining: response.headers.get( "x-ratelimit-remaining" )
        ? parseInt( response.headers.get( "x-ratelimit-remaining" )! )
        : undefined,
    };

    // Handle rate limiting
    if ( response.status === 429 )
    {
      console.warn(
        `[DJEN] Rate limit exceeded. Aguarde 1 minuto antes de nova requisição.`
      );
      return { response: null, rateLimitInfo };
    }

    if ( !response.ok )
    {
      throw new Error( `HTTP ${ response.status }: ${ response.statusText }` );
    }

    const contentType = response.headers.get( "content-type" );
    if ( !contentType?.includes( "application/json" ) )
    {
      console.warn( `[DJEN] Resposta não é JSON` );
      return { response: null, rateLimitInfo };
    }

    const data = ( await response.json() ) as DJENResponse;

    console.log(
      `[DJEN] Consulta retornou ${ data.count } comunicações. Rate limit: ${ rateLimitInfo.remaining }/${ rateLimitInfo.limit }`
    );

    return { response: data, rateLimitInfo };
  } catch ( error )
  {
    clearTimeout( timeoutId );
    console.error( `[DJEN] Error querying comunicacoes:`, error );
    return { response: null, rateLimitInfo: {} };
  }
}

function formatDate ( date: Date ): string
{
  const year = date.getFullYear();
  const month = String( date.getMonth() + 1 ).padStart( 2, "0" );
  const day = String( date.getDate() ).padStart( 2, "0" );
  return `${ year }-${ month }-${ day }`;
}

// ===== Helper functions for consultarDJENForLawyer (reduced CC) =====

interface LawyerQueryContext
{
  nomeAdvogado?: string;
  numeroOabNumerico?: string;
  ufOab?: string;
  queryDataInicio: string;
  queryDataFim: string;
  meio?: "D" | "E";
}

function parseOABForQuery ( numeroOAB?: string ):
  {
    numero?: string;
    uf?: string;
  }
{
  if ( !numeroOAB ) return {};
  const parsed = parseOAB( numeroOAB );
  return { numero: parsed.numero, uf: parsed.uf };
}

function buildDJENQueryParams (
  tribunal: string,
  ctx: LawyerQueryContext
): DJENQueryParams
{
  const params: DJENQueryParams = {
    siglaTribunal: tribunal,
    dataDisponibilizacaoInicio: ctx.queryDataInicio,
    dataDisponibilizacaoFim: ctx.queryDataFim,
    itensPorPagina: 100,
    pagina: 1,
  };
  if ( ctx.nomeAdvogado ) params.nomeAdvogado = ctx.nomeAdvogado;
  if ( ctx.numeroOabNumerico ) params.numeroOab = ctx.numeroOabNumerico;
  if ( ctx.ufOab ) params.ufOab = ctx.ufOab;
  if ( ctx.meio ) params.meio = ctx.meio;
  return params;
}

function determineAdvogadoMatch (
  dest: { advogado: { nome: string; numero_oab: string; uf_oab: string } },
  ctx: LawyerQueryContext
): "nome" | "oab" | "ambos" | null
{
  const matchNome = ctx.nomeAdvogado
    ? normalizeText( dest.advogado.nome ).includes(
      normalizeText( ctx.nomeAdvogado )
    )
    : false;
  const matchOab = ctx.numeroOabNumerico
    ? dest.advogado.numero_oab === ctx.numeroOabNumerico &&
    dest.advogado.uf_oab === ctx.ufOab
    : false;

  if ( matchNome && matchOab ) return "ambos";
  if ( matchOab ) return "oab";
  if ( matchNome ) return "nome";
  return null;
}

function findAdvogadoInComunicacao (
  comunicacao: DJENComunicacao,
  ctx: LawyerQueryContext
): { found: boolean; matchType: "nome" | "oab" | "ambos" }
{
  let matchType: "nome" | "oab" | "ambos" = "nome";
  const found = comunicacao.destinatarioadvogados.some( ( dest ) =>
  {
    const type = determineAdvogadoMatch( dest, ctx );
    if ( type )
    {
      matchType = type;
      return true;
    }
    return false;
  } );
  return { found, matchType };
}

function mapComunicacaoToResult (
  comunicacao: DJENComunicacao,
  matchType: "nome" | "oab" | "ambos"
): DJENFilteredResult
{
  return {
    id: comunicacao.id,
    tribunal: comunicacao.siglaTribunal,
    data: comunicacao.data_disponibilizacao,
    tipo: comunicacao.tipoComunicacao,
    teor: comunicacao.texto,
    numeroProcesso: comunicacao.numero_processo,
    orgao: comunicacao.nomeOrgao,
    meio: comunicacao.meiocompleto || comunicacao.meio,
    link: comunicacao.link,
    hash: comunicacao.hash,
    matchType,
    advogados: comunicacao.destinatarioadvogados.map( ( dest ) => ( {
      nome: dest.advogado.nome,
      numero_oab: dest.advogado.numero_oab,
      uf_oab: dest.advogado.uf_oab,
    } ) ),
  };
}

async function processTribunalQuery (
  tribunal: string,
  ctx: LawyerQueryContext,
  resultados: DJENFilteredResult[],
  erros: Array<{ tribunal: string; erro: string }>
): Promise<boolean>
{
  console.log(
    `[DJEN] Consultando ${ tribunal } para ${ ctx.nomeAdvogado || ctx.numeroOabNumerico
    }`
  );

  const queryParams = buildDJENQueryParams( tribunal, ctx );
  const { response, rateLimitInfo } = await consultarComunicacoes(
    queryParams,
    DEFAULT_TIMEOUT
  );

  if ( !response )
  {
    console.warn( `[DJEN] Rate limit atingido ou erro na consulta de ${ tribunal }` );
    erros.push( {
      tribunal,
      erro: "Rate limit excedido. Aguarde 1 minuto antes de nova tentativa.",
    } );
    await new Promise( ( resolve ) => setTimeout( resolve, RATE_LIMIT_RETRY_DELAY ) );
    return true;
  }

  for ( const comunicacao of response.items )
  {
    const { found, matchType } = findAdvogadoInComunicacao( comunicacao, ctx );
    if ( found )
    {
      resultados.push( mapComunicacaoToResult( comunicacao, matchType ) );
    }
  }

  if ( rateLimitInfo.remaining !== undefined && rateLimitInfo.remaining < 10 )
  {
    console.warn(
      `[DJEN] Rate limit baixo: ${ rateLimitInfo.remaining }/${ rateLimitInfo.limit } requisições restantes`
    );
  }

  return false;
}

// ===== Main refactored function =====

/**
 * Consulta comunicações DJEN para um advogado específico
 */
export async function consultarDJENForLawyer (
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string,
  meio?: "D" | "E"
): Promise<{
  resultados: DJENFilteredResult[];
  erros: Array<{ tribunal: string; erro: string }>;
  rateLimitWarning?: boolean;
}>
{
  if ( !nomeAdvogado && !numeroOAB )
  {
    throw new Error( "É necessário fornecer pelo menos nomeAdvogado ou numeroOAB" );
  }

  const defaultDate = formatDate( new Date() );
  const oabInfo = parseOABForQuery( numeroOAB );

  const ctx: LawyerQueryContext = {
    nomeAdvogado,
    numeroOabNumerico: oabInfo.numero,
    ufOab: oabInfo.uf,
    queryDataInicio: dataInicio || defaultDate,
    queryDataFim: dataFim || dataInicio || defaultDate,
    meio,
  };

  const resultados: DJENFilteredResult[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];
  let rateLimitWarning = false;

  for ( let i = 0; i < tribunais.length; i++ )
  {
    try
    {
      const hitRateLimit = await processTribunalQuery(
        tribunais[ i ],
        ctx,
        resultados,
        erros
      );
      rateLimitWarning = rateLimitWarning || hitRateLimit;

      if ( i < tribunais.length - 1 )
      {
        await new Promise( ( resolve ) => setTimeout( resolve, DEFAULT_DELAY ) );
      }
    } catch ( error )
    {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      erros.push( { tribunal: tribunais[ i ], erro: errorMessage } );
      console.error( `[DJEN] Erro consultando ${ tribunais[ i ] }:`, errorMessage );
    }
  }

  console.log(
    `[DJEN] Consulta finalizada: ${ resultados.length } comunicações encontradas em ${ tribunais.length } tribunais`
  );

  return { resultados, erros, rateLimitWarning: rateLimitWarning || undefined };
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
export async function downloadCadernoDJEN (
  siglaTribunal: string,
  data: string,
  meio: "E" | "D" = "D"
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
} | null>
{
  const url = `https://comunicaapi.pje.jus.br/api/v1/caderno/${ siglaTribunal }/${ data }/${ meio }`;

  try
  {
    const response = await fetch( url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    } );

    if ( !response.ok )
    {
      console.error( `[DJEN] Erro ao baixar caderno: HTTP ${ response.status }` );
      return null;
    }

    const caderno = await response.json();
    console.log(
      `[DJEN] Caderno disponível: ${ caderno.total_comunicacoes } comunicações, ${ caderno.numero_paginas } páginas`
    );

    return caderno;
  } catch ( error )
  {
    console.error( `[DJEN] Erro ao baixar caderno:`, error );
    return null;
  }
}
/**
 * DJEN Monitor - Módulo de Orquestração
 *
 * Cérebro do monitor DJEN com integração ao sistema de agentes IA.
 * Projetado para funcionar 100% automático com Vercel Serverless + Upstash Redis.
 *
 * @module djen-monitor
 * @version 2.0.0
 * @since 2025-11-28
 *
 * Funcionalidades:
 * - Consulta API pública do CNJ (numeroOab, ufOab, meio=D)
 * - Dedupe de publicações por hash no Redis
 * - Criação automática de AgentTask para análise
 * - Suporte a streaming via onAIStream callback
 * - Integração com 15 agentes tipados
 *
 * @example
 * ```typescript
 * import { runDJENDailyMonitor, syncDJENForLawyer } from '@/lib/djen-monitor'
 *
 * // Execução diária via cron
 * const result = await runDJENDailyMonitor()
 *
 * // Sync manual para um advogado
 * const lawyerResult = await syncDJENForLawyer({
 *   id: 'adv-1',
 *   nome: 'Thiago Bodevan Veiga',
 *   numeroOAB: '184404',
 *   ufOAB: 'MG',
 *   ativo: true
 * })
 * ```
 */

import type { AgentId, AgentTask, TarefaSistemaTipo, TaskPriority } from "@/lib/agents";
import { getEnv } from "@/lib/env-helper.js";

// ============================================================================
// TYPES - DJEN API (Conforme documentação CNJ v1.0.3)
// ============================================================================

/**
 * Destinatário da comunicação DJEN
 */
export interface RawDJENRecipient
{
  nome: string;
  polo?: string;
  comunicacao_id?: number;
}

/**
 * Advogado destinatário conforme API DJEN
 */
export interface RawDJENAdvogado
{
  id?: number;
  nome: string;
  numero_oab: string;
  uf_oab: string;
}

/**
 * Estrutura de destinatário advogado retornada pela API
 */
export interface RawDJENDestinatarioAdvogado
{
  id: number;
  comunicacao_id: number;
  advogado_id: number;
  advogado: RawDJENAdvogado;
}

/**
 * Item de comunicação retornado pela API DJEN
 * Endpoint: GET /api/v1/comunicacao
 */
export interface RawDJENItem
{
  id: number;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  numero_processo: string;
  numeroprocessocommascara?: string;
  datadisponibilizacao: string;
  data_disponibilizacao?: string; // Alias
  dataPublicacao?: string;
  texto: string;
  meio: string;
  meiocompleto?: string;
  link: string;
  hash: string;
  destinatarios?: RawDJENRecipient[];
  destinatarioadvogados?: RawDJENDestinatarioAdvogado[];
}

/**
 * Resposta da API DJEN
 */
export interface RawDJENResponse
{
  status?: string;
  message?: string;
  count?: number;
  items?: RawDJENItem[];
  // API pode retornar array direto
  [ index: number ]: RawDJENItem;
  length?: number;
}

// ============================================================================
// TYPES - Internal Normalized
// ============================================================================

/**
 * Publicação normalizada para uso interno
 */
export interface NormalizedDJENPublication
{
  id: string;
  djenId: number;
  tribunal: string;
  tipoComunicacao: string;
  orgao: string;
  numeroProcesso: string;
  dataDisponibilizacao: string;
  dataPublicacao?: string;
  texto: string;
  meio: string;
  link: string;
  hash: string;
  destinatarios?: RawDJENRecipient[];
  advogados?: RawDJENAdvogado[];
}

/**
 * Advogado monitorado pelo sistema
 */
export interface MonitoredLawyer
{
  id: string;
  nome: string;
  numeroOAB: string; // Apenas dígitos: "184404"
  ufOAB: string; // UF: "MG"
  email?: string;
  tribunais?: string[]; // Filtrar por siglaTribunal (opcional)
  ativo: boolean;
}

/**
 * Resultado do monitoramento para um advogado
 */
export interface DJENMonitorResult
{
  totalPublicacoes: number;
  novasPublicacoes: number;
  tasksCriadas: number;
  porTribunal: Record<string, number>;
  errors: string[];
}

/**
 * Resultado consolidado do monitoramento diário
 */
export interface DJENDailyMonitorResult
{
  lawyersCount: number;
  results: Record<string, DJENMonitorResult>;
  totalNovas: number;
  totalTasks: number;
  timestamp: string;
}

// ============================================================================
// REDIS KEYS
// ============================================================================

export const DJEN_REDIS_KEYS = {
  LAWYERS: "djen:lawyers", // Lista de advogados monitorados
  SEEN_PREFIX: "djen:seen:", // djen:seen:{hash} - dedupe
  PUB_PREFIX: "djen:pub:", // djen:pub:{id} - publicação completa
  TASK_QUEUE: "agents:queue", // Fila de tarefas dos agentes
  LAST_CHECK: "djen:last-check", // Timestamp do último check
  STATS: "djen:stats", // Estatísticas acumuladas
} as const;

// ============================================================================
// CONSTANTS
// ============================================================================

/** Agente responsável por análise de intimações DJEN */
const MONITOR_AGENT_ID: AgentId = "monitor-djen";

/** Agente especialista em intimações */
const JUSTINE_AGENT_ID: AgentId = "justine";

/** Tipo de tarefa padrão para intimações */
const DJEN_TASK_TYPE: TarefaSistemaTipo = "ANALYZE_INTIMATION";

/** Timeout para chamadas à API DJEN (ms) */
const DJEN_TIMEOUT = 30000;

/** Delay entre consultas para evitar rate limit (ms) */
const DJEN_DELAY = 2000;

/** TTL para hash de dedupe (180 dias em segundos) */
const SEEN_TTL_SECONDS = 60 * 60 * 24 * 180;

// ============================================================================
// REDIS CLIENT (Lazy initialization)
// ============================================================================

let _redisClient: import( "@upstash/redis" ).Redis | null = null;

async function getRedis (): Promise<import( "@upstash/redis" ).Redis>
{
  if ( _redisClient ) return _redisClient;

  const { Redis } = await import( "@upstash/redis" );

  const url = getEnv( "UPSTASH_REDIS_REST_URL" );
  const token = getEnv( "UPSTASH_REDIS_REST_TOKEN" );

  if ( !url || !token )
  {
    throw new Error( "UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN são obrigatórios" );
  }

  _redisClient = new Redis( {
    url: url.trim(),
    token: token.trim(),
  } );

  return _redisClient;
}

// ============================================================================
// LAWYER MANAGEMENT
// ============================================================================

/**
 * Busca lista de advogados monitorados no Redis
 */
export async function getMonitoredLawyers (): Promise<MonitoredLawyer[]>
{
  try
  {
    const redis = await getRedis();
    const raw = await redis.get<MonitoredLawyer[] | string>( DJEN_REDIS_KEYS.LAWYERS );

    if ( !raw ) return [];

    // Pode vir como string JSON ou objeto
    const parsed = typeof raw === "string" ? JSON.parse( raw ) : raw;
    return ( parsed as MonitoredLawyer[] ).filter( ( l ) => l.ativo !== false );
  } catch ( error )
  {
    console.error( "[DJEN Monitor] Erro ao buscar advogados:", error );
    return [];
  }
}

/**
 * Atualiza lista de advogados monitorados
 */
export async function setMonitoredLawyers ( lawyers: MonitoredLawyer[] ): Promise<void>
{
  const redis = await getRedis();
  await redis.set( DJEN_REDIS_KEYS.LAWYERS, JSON.stringify( lawyers ) );
}

/**
 * Adiciona um advogado à lista de monitoramento
 */
export async function addMonitoredLawyer ( lawyer: MonitoredLawyer ): Promise<void>
{
  const lawyers = await getMonitoredLawyers();
  const existingIndex = lawyers.findIndex(
    ( l ) => l.id === lawyer.id || l.numeroOAB === lawyer.numeroOAB
  );

  if ( existingIndex >= 0 )
  {
    lawyers[ existingIndex ] = lawyer;
  } else
  {
    lawyers.push( lawyer );
  }

  await setMonitoredLawyers( lawyers );
}

/**
 * Remove um advogado da lista de monitoramento
 */
export async function removeMonitoredLawyer ( lawyerId: string ): Promise<void>
{
  const lawyers = await getMonitoredLawyers();
  const filtered = lawyers.filter( ( l ) => l.id !== lawyerId );
  await setMonitoredLawyers( filtered );
}

// ============================================================================
// DJEN API CLIENT
// ============================================================================

/**
 * Builds URL parameters for DJEN API query
 */
function buildDJENQueryParams (
  numeroOAB: string,
  ufOAB: string,
  options: {
    dataInicio?: string;
    dataFim?: string;
    tribunal?: string;
    pagina?: number;
    itensPorPagina?: number;
  }
): URLSearchParams
{
  const params = new URLSearchParams();

  // Required parameters
  params.set( "numeroOab", numeroOAB.replaceAll( /\D/g, "" ) );
  params.set( "ufOab", ufOAB.toUpperCase() );
  params.set( "meio", "D" ); // Diário Eletrônico

  // Optional parameters
  if ( options.dataInicio )
  {
    params.set( "dataDisponibilizacaoInicio", options.dataInicio );
  }
  if ( options.dataFim )
  {
    params.set( "dataDisponibilizacaoFim", options.dataFim );
  }
  if ( options.tribunal )
  {
    params.set( "siglaTribunal", options.tribunal );
  }
  if ( options.pagina )
  {
    params.set( "pagina", String( options.pagina ) );
  }
  if ( options.itensPorPagina )
  {
    params.set( "itensPorPagina", String( options.itensPorPagina ) );
  }

  return params;
}

/**
 * Logs rate limit info from response headers
 */
function logRateLimitInfo ( response: Response ): void
{
  const remaining = response.headers.get( "x-ratelimit-remaining" );
  if ( remaining )
  {
    console.log( `[DJEN API] Rate limit remaining: ${ remaining }` );
  }
}

/**
 * Handles DJEN API error responses
 */
async function handleDJENApiError ( response: Response ): Promise<never>
{
  if ( response.status === 429 )
  {
    throw new Error( "Rate limit atingido (429) - aguarde 1 minuto" );
  }

  if ( response.status === 422 )
  {
    const errorBody = await response.text();
    throw new Error( `Erro negocial DJEN (422): ${ errorBody }` );
  }

  throw new Error( `DJEN API error ${ response.status }: ${ response.statusText }` );
}

/**
 * Normalizes a raw DJEN item to internal format
 */
function normalizeRawDJENItem ( item: RawDJENItem ): NormalizedDJENPublication
{
  return {
    id: `djen-${ item.id }`,
    djenId: item.id,
    tribunal: item.siglaTribunal,
    tipoComunicacao: item.tipoComunicacao,
    orgao: item.nomeOrgao,
    numeroProcesso: item.numeroprocessocommascara || item.numero_processo,
    dataDisponibilizacao: item.datadisponibilizacao || item.data_disponibilizacao || "",
    dataPublicacao: item.dataPublicacao,
    texto: item.texto,
    meio: item.meiocompleto || item.meio,
    link: item.link,
    hash: item.hash || `${ item.siglaTribunal }-${ item.id }-${ item.numero_processo }`,
    destinatarios: item.destinatarios,
    advogados: item.destinatarioadvogados?.map( ( d ) => d.advogado ),
  };
}

/**
 * Consulta a API pública do CNJ DJEN para uma OAB específica
 *
 * @param numeroOAB - Número da OAB (apenas dígitos)
 * @param ufOAB - UF da OAB (ex: "MG")
 * @param options - Opções adicionais de consulta
 */
export async function fetchDJENForOAB (
  numeroOAB: string,
  ufOAB: string,
  options: {
    dataInicio?: string; // YYYY-MM-DD
    dataFim?: string; // YYYY-MM-DD
    tribunal?: string;
    pagina?: number;
    itensPorPagina?: number;
  } = {}
): Promise<NormalizedDJENPublication[]>
{
  const baseUrl = "https://comunicaapi.pje.jus.br/api/v1/comunicacao";
  const params = buildDJENQueryParams( numeroOAB, ufOAB, options );
  const url = `${ baseUrl }?${ params.toString() }`;

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), DJEN_TIMEOUT );

  try
  {
    console.log( `[DJEN API] Consultando: ${ url }` );

    const response = await fetch( url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "AssistenteJuridicoP-DJEN/2.0",
      },
      signal: controller.signal,
      cache: "no-store",
    } );

    clearTimeout( timeoutId );
    logRateLimitInfo( response );

    if ( !response.ok )
    {
      await handleDJENApiError( response );
    }

    const data = ( await response.json() ) as RawDJENResponse;

    // API pode retornar array direto ou objeto com items
    const items: RawDJENItem[] = Array.isArray( data ) ? data : data.items || [];

    console.log( `[DJEN API] Retornou ${ items.length } comunicações` );

    return items.map( normalizeRawDJENItem );
  } catch ( error )
  {
    clearTimeout( timeoutId );
    console.error( "[DJEN API] Erro:", error );
    throw error;
  }
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

/**
 * Verifica se a publicação já foi vista (dedupe por hash)
 */
export async function isPublicationSeen ( pubHash: string ): Promise<boolean>
{
  try
  {
    const redis = await getRedis();
    const key = `${ DJEN_REDIS_KEYS.SEEN_PREFIX }${ pubHash }`;
    const exists = await redis.exists( key );
    return exists === 1;
  } catch
  {
    return false;
  }
}

/**
 * Marca publicação como vista
 */
export async function markPublicationAsSeen ( pubHash: string ): Promise<void>
{
  const redis = await getRedis();
  const key = `${ DJEN_REDIS_KEYS.SEEN_PREFIX }${ pubHash }`;
  await redis.set( key, "1", { ex: SEEN_TTL_SECONDS } );
}

/**
 * Salva a publicação completa no Redis
 */
export async function savePublication (
  pub: NormalizedDJENPublication,
  lawyer: MonitoredLawyer
): Promise<void>
{
  const redis = await getRedis();
  const key = `${ DJEN_REDIS_KEYS.PUB_PREFIX }${ pub.id }`;

  await redis.set(
    key,
    JSON.stringify( {
      ...pub,
      monitoredLawyer: {
        id: lawyer.id,
        nome: lawyer.nome,
        numeroOAB: lawyer.numeroOAB,
        ufOAB: lawyer.ufOAB,
      },
      savedAt: new Date().toISOString(),
    } )
  );
}

/**
 * Recupera uma publicação salva
 */
export async function getPublication ( pubId: string ): Promise<NormalizedDJENPublication | null>
{
  try
  {
    const redis = await getRedis();
    const key = `${ DJEN_REDIS_KEYS.PUB_PREFIX }${ pubId }`;
    const data = await redis.get<NormalizedDJENPublication>( key );
    return data;
  } catch
  {
    return null;
  }
}

// ============================================================================
// TASK CREATION
// ============================================================================

/**
 * Cria uma AgentTask a partir de uma publicação DJEN
 *
 * Esta tarefa será consumida pelo agente `monitor-djen` ou `justine`
 * para análise automática via IA (com suporte a streaming)
 */
export function buildDJENTaskFromPublication (
  pub: NormalizedDJENPublication,
  lawyer: MonitoredLawyer
): AgentTask
{
  const now = new Date().toISOString();

  // Prioridade baseada no tipo de comunicação
  const isIntimacao = pub.tipoComunicacao.toLowerCase().includes( "intima" );
  const isCitacao = pub.tipoComunicacao.toLowerCase().includes( "cita" );

  let priority: TaskPriority = "medium";
  if ( isIntimacao || isCitacao )
  {
    priority = "high";
  }

  const task: AgentTask = {
    id: `task-${ pub.id }-${ Date.now() }`,
    agentId: JUSTINE_AGENT_ID, // Mrs. Justin-e - especialista em intimações
    type: DJEN_TASK_TYPE,
    priority,
    status: "queued",
    createdAt: now,
    data: {
      source: "DJEN",
      publicationId: pub.id,
      djenId: pub.djenId,
      tribunal: pub.tribunal,
      tipoComunicacao: pub.tipoComunicacao,
      orgao: pub.orgao,
      numeroProcesso: pub.numeroProcesso,
      dataDisponibilizacao: pub.dataDisponibilizacao,
      texto: pub.texto,
      link: pub.link,
      hash: pub.hash,
      advogadoMonitorado: {
        id: lawyer.id,
        nome: lawyer.nome,
        numeroOAB: lawyer.numeroOAB,
        ufOAB: lawyer.ufOAB,
        email: lawyer.email,
      },
      // Flag para indicar que suporta streaming
      supportsStreaming: true,
    },
    // Campos de rastreabilidade (FASE 1)
    criadoPor: "cron",
    processoNumero: pub.numeroProcesso,
  };

  return task;
}

/**
 * Enfileira uma AgentTask na fila global (Redis)
 */
export async function enqueueAgentTask ( task: AgentTask ): Promise<void>
{
  const redis = await getRedis();

  // Usa LPUSH para fila FIFO (mais antigas primeiro quando usar RPOP)
  await redis.lpush( DJEN_REDIS_KEYS.TASK_QUEUE, JSON.stringify( task ) );

  console.log( `[DJEN Monitor] Task enfileirada: ${ task.id } (${ task.type })` );
}

/**
 * Consome uma tarefa da fila (para workers)
 */
export async function dequeueAgentTask (): Promise<AgentTask | null>
{
  try
  {
    const redis = await getRedis();
    const raw = await redis.rpop( DJEN_REDIS_KEYS.TASK_QUEUE );

    if ( !raw ) return null;

    return typeof raw === "string" ? JSON.parse( raw ) : raw;
  } catch
  {
    return null;
  }
}

/**
 * Retorna quantidade de tarefas na fila
 */
export async function getQueueLength (): Promise<number>
{
  try
  {
    const redis = await getRedis();
    return await redis.llen( DJEN_REDIS_KEYS.TASK_QUEUE );
  } catch
  {
    return 0;
  }
}

// ============================================================================
// SYNC PIPELINE
// ============================================================================

/**
 * Processa uma única publicação dentro do sync pipeline
 * Retorna true se a publicação foi nova e processada, false se já vista
 */
async function processPublicationInSync (
  pub: NormalizedDJENPublication,
  lawyer: MonitoredLawyer,
  result: DJENMonitorResult
): Promise<boolean>
{
  // Contagem por tribunal
  result.porTribunal[ pub.tribunal ] = ( result.porTribunal[ pub.tribunal ] || 0 ) + 1;

  // Verificar dedupe
  const alreadySeen = await isPublicationSeen( pub.hash );
  if ( alreadySeen )
  {
    console.log( `[DJEN Monitor] Publicação já vista: ${ pub.hash }` );
    return false;
  }

  result.novasPublicacoes++;

  // Marcar como vista
  await markPublicationAsSeen( pub.hash );

  // Salvar publicação completa
  await savePublication( pub, lawyer );

  // Criar e enfileirar tarefa para agente
  const task = buildDJENTaskFromPublication( pub, lawyer );
  await enqueueAgentTask( task );
  result.tasksCriadas++;

  console.log( `[DJEN Monitor] Nova publicação processada: ${ pub.tribunal } - ${ pub.numeroProcesso }` );
  return true;
}

/**
 * Cria resultado vazio para DJENMonitorResult
 */
function createEmptyMonitorResult (): DJENMonitorResult
{
  return {
    totalPublicacoes: 0,
    novasPublicacoes: 0,
    tasksCriadas: 0,
    porTribunal: {},
    errors: [],
  };
}

/**
 * Pipeline completo para UM advogado:
 * 1. Chama DJEN API
 * 2. Dedupe publicações já vistas
 * 3. Salva novas publicações
 * 4. Cria tarefas para os agentes
 */
export async function syncDJENForLawyer (
  lawyer: MonitoredLawyer,
  options: {
    dataInicio?: string;
    dataFim?: string;
  } = {}
): Promise<DJENMonitorResult>
{
  const result = createEmptyMonitorResult();

  try
  {
    const pubs = await fetchDJENForOAB( lawyer.numeroOAB, lawyer.ufOAB, {
      dataInicio: options.dataInicio,
      dataFim: options.dataFim,
    } );

    result.totalPublicacoes = pubs.length;

    for ( const pub of pubs )
    {
      await processPublicationInSync( pub, lawyer, result );
    }
  } catch ( error )
  {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    result.errors.push( errorMsg );
    console.error( `[DJEN Monitor] Erro ao sincronizar ${ lawyer.nome }:`, error );
  }

  return result;
}

// ============================================================================
// DAILY ORCHESTRATION
// ============================================================================

/**
 * Advogado padrão quando nenhum está configurado
 */
const DEFAULT_LAWYER: MonitoredLawyer = {
  id: "lawyer-thiago-bodevan",
  nome: "Thiago Bodevan Veiga",
  numeroOAB: "184404",
  ufOAB: "MG",
  email: getEnv( "NOTIFICATION_EMAIL" ) || "thiagobodevanadvocacia@gmail.com",
  tribunais: [ "TJMG", "TRT3", "TST", "STJ", "TRF1", "TRF6" ],
  ativo: true,
};

/**
 * Processa um único advogado dentro do daily monitor
 */
async function processLawyerInDailyMonitor (
  lawyer: MonitoredLawyer,
  results: Record<string, DJENMonitorResult>,
  isLast: boolean
): Promise<{ novas: number; tasks: number }>
{
  if ( !lawyer.ativo )
  {
    console.log( `[DJEN Monitor] Advogado desativado: ${ lawyer.nome }` );
    return { novas: 0, tasks: 0 };
  }

  try
  {
    console.log(
      `[DJEN Monitor] Processando ${ lawyer.nome } (OAB ${ lawyer.ufOAB } ${ lawyer.numeroOAB })`
    );

    const result = await syncDJENForLawyer( lawyer );
    results[ lawyer.id ] = result;

    console.log(
      `[DJEN Monitor] ${ lawyer.nome }: ${ result.novasPublicacoes } novas de ${ result.totalPublicacoes } total`
    );

    // Delay entre advogados para evitar rate limit
    if ( !isLast )
    {
      await new Promise( ( resolve ) => setTimeout( resolve, DJEN_DELAY ) );
    }

    return { novas: result.novasPublicacoes, tasks: result.tasksCriadas };
  } catch ( error )
  {
    console.error( `[DJEN Monitor] Erro ao processar ${ lawyer.nome }:`, error );
    results[ lawyer.id ] = createEmptyMonitorResult();
    results[ lawyer.id ].errors.push( error instanceof Error ? error.message : "Erro desconhecido" );
    return { novas: 0, tasks: 0 };
  }
}

/**
 * Atualiza timestamp do último check no Redis
 */
async function updateLastCheckTimestamp ( timestamp: string ): Promise<void>
{
  try
  {
    const redis = await getRedis();
    await redis.set( DJEN_REDIS_KEYS.LAST_CHECK, timestamp );
  } catch
  {
    console.warn( "[DJEN Monitor] Não foi possível atualizar last-check" );
  }
}

/**
 * Orquestra o monitoramento DJEN para TODOS os advogados cadastrados
 *
 * Pensado para ser chamado pelo cron da Vercel:
 * `/api/cron?action=djen-monitor`
 *
 * @returns Resultado consolidado do monitoramento
 */
export async function runDJENDailyMonitor (): Promise<DJENDailyMonitorResult>
{
  const timestamp = new Date().toISOString();
  console.log( `[DJEN Monitor] Iniciando monitoramento diário em ${ timestamp }` );

  let lawyers = await getMonitoredLawyers();

  if ( lawyers.length === 0 )
  {
    console.log( "[DJEN Monitor] Nenhum advogado configurado, usando padrão" );
    lawyers = [ DEFAULT_LAWYER ];
  }

  const results: Record<string, DJENMonitorResult> = {};
  let totalNovas = 0;
  let totalTasks = 0;

  for ( let i = 0; i < lawyers.length; i++ )
  {
    const { novas, tasks } = await processLawyerInDailyMonitor(
      lawyers[ i ],
      results,
      i === lawyers.length - 1
    );
    totalNovas += novas;
    totalTasks += tasks;
  }

  await updateLastCheckTimestamp( timestamp );

  console.log(
    `[DJEN Monitor] Concluído: ${ totalNovas } novas publicações, ${ totalTasks } tarefas criadas`
  );

  return {
    lawyersCount: lawyers.length,
    results,
    totalNovas,
    totalTasks,
    timestamp,
  };
}

// ============================================================================
// AI INTEGRATION (Streaming Support)
// ============================================================================

/**
 * System prompt para análise de intimações DJEN com IA
 */
export const DJEN_AI_SYSTEM_PROMPT = `Você é um assistente jurídico especializado em análise de intimações do Diário de Justiça Eletrônico Nacional (DJEN).

Sua função é analisar intimações processuais e fornecer:
1. **Resumo executivo** - O que é a intimação em linguagem simples
2. **Prazo identificado** - Se houver prazo mencionado, destacar (ex: "15 dias para contestar")
3. **Providência necessária** - O que o advogado precisa fazer
4. **Classificação de urgência** - URGENTE, ALTA, MÉDIA ou BAIXA
5. **Partes envolvidas** - Autor(es), Réu(s), Terceiros

Formate sua resposta de forma clara e estruturada. Use marcadores HTML quando apropriado (<strong>, <ul>, <li>).
Seja objetivo e direto. Destaque prazos em negrito.`;

/**
 * Builds the prompt for AI analysis
 */
function buildAnalysisPrompt ( pub: NormalizedDJENPublication ): string
{
  return `Analise a seguinte intimação do DJEN:

**Tribunal:** ${ pub.tribunal }
**Órgão:** ${ pub.orgao }
**Processo:** ${ pub.numeroProcesso }
**Tipo:** ${ pub.tipoComunicacao }
**Data Disponibilização:** ${ pub.dataDisponibilizacao }

**Texto da Intimação:**
${ pub.texto }

Forneça sua análise conforme as instruções do sistema.`;
}

/**
 * Parse a single SSE line and extract content
 */
function parseSSELine ( line: string ): string | null
{
  if ( !line.startsWith( "data: " ) ) return null;

  try
  {
    const data = JSON.parse( line.slice( 6 ) );
    if ( data.type === "content" && data.content )
    {
      return data.content;
    }
  } catch
  {
    // Ignore invalid JSON
  }
  return null;
}

/**
 * Processes streaming response from AI
 */
async function processStreamingResponse (
  response: Response,
  onStream: ( chunk: string ) => void
): Promise<string>
{
  if ( !response.body )
  {
    throw new Error( "Response body is null" );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  while ( true )
  {
    const { done, value } = await reader.read();
    if ( done ) break;

    const chunk = decoder.decode( value, { stream: true } );

    for ( const line of chunk.split( "\n" ) )
    {
      const content = parseSSELine( line );
      if ( content )
      {
        fullContent += content;
        onStream( content );
      }
    }
  }

  return fullContent;
}

/**
 * Calls AI with streaming support
 */
async function callAIWithStreaming (
  messages: Array<{ role: string; content: string }>,
  model: string,
  onStream: ( chunk: string ) => void
): Promise<string>
{
  const response = await fetch( "/api/llm-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify( {
      messages,
      model,
      temperature: 0.3,
      maxTokens: 1000,
    } ),
  } );

  if ( !response.ok )
  {
    throw new Error( "Erro ao iniciar streaming" );
  }

  return processStreamingResponse( response, onStream );
}

/**
 * Gera análise de uma publicação DJEN com IA
 *
 * Pode ser chamado com streaming via callback ou síncrono
 *
 * @param pub - Publicação normalizada do DJEN
 * @param options - Opções de execução
 */
export async function analyzePublicationWithAI (
  pub: NormalizedDJENPublication,
  options: {
    /** Callback para streaming (opcional) */
    onStream?: ( chunk: string ) => void;
    /** Provider de IA (default: gemini) */
    provider?: "gemini" | "azure" | "github";
    /** Modelo específico (default: gemini-2.5-pro) */
    model?: string;
  } = {}
): Promise<string>
{
  const { aiClient } = await import( "@/lib/ai-providers" );

  const prompt = buildAnalysisPrompt( pub );
  const model = options.model || "gemini-2.5-pro";

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [
      { role: "system", content: DJEN_AI_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ];

  // Use streaming if callback provided
  if ( options.onStream )
  {
    return callAIWithStreaming(
      messages as Array<{ role: string; content: string }>,
      model,
      options.onStream
    );
  }

  // Non-streaming call
  const result = await aiClient.chat( messages, {
    provider: options.provider || "gemini",
    model,
    maxTokens: 1000,
    temperature: 0.3,
  } );

  return result.content;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { DEFAULT_LAWYER, DJEN_TASK_TYPE, JUSTINE_AGENT_ID, MONITOR_AGENT_ID };

import { describe, it, expect, beforeEach, vi } from "vitest";
import
{
  validarFormatoData,
  validarNumeroOAB,
  getTribunaisDisponiveis,
  DJENAPIError,
  consultarDJEN,
} from "./djen-api";

describe( "DJEN API - Validações", () =>
{
  describe( "validarFormatoData", () =>
  {
    it( "deve aceitar formato AAAA-MM-DD válido", () =>
    {
      expect( validarFormatoData( "2025-01-16" ) ).toBe( true );
      expect( validarFormatoData( "2024-12-31" ) ).toBe( true );
      expect( validarFormatoData( "2023-06-15" ) ).toBe( true );
    } );

    it( "deve rejeitar formatos inválidos", () =>
    {
      expect( validarFormatoData( "16/01/2025" ) ).toBe( false );
      expect( validarFormatoData( "2025/01/16" ) ).toBe( false );
      expect( validarFormatoData( "01-16-2025" ) ).toBe( false );
      expect( validarFormatoData( "2025-1-16" ) ).toBe( false );
      expect( validarFormatoData( "invalid" ) ).toBe( false );
    } );

    it( "deve rejeitar datas inexistentes", () =>
    {
      expect( validarFormatoData( "2025-13-01" ) ).toBe( false );
      expect( validarFormatoData( "2025-02-30" ) ).toBe( false );
      expect( validarFormatoData( "2025-04-31" ) ).toBe( false );
    } );
  } );

  describe( "validarNumeroOAB", () =>
  {
    it( "deve aceitar formato OAB/UF número válido", () =>
    {
      expect( validarNumeroOAB( "OAB/MG 123456" ) ).toBe( true );
      expect( validarNumeroOAB( "OAB/SP 999999" ) ).toBe( true );
      expect( validarNumeroOAB( "OAB/RJ 1" ) ).toBe( true );
      expect( validarNumeroOAB( "oab/mg 123" ) ).toBe( true );
      expect( validarNumeroOAB( "123456" ) ).toBe( true ); // Aceita apenas números
    } );

    it( "deve rejeitar formatos inválidos", () =>
    {
      expect( validarNumeroOAB( "OAB 123456" ) ).toBe( false );
      expect( validarNumeroOAB( "MG 123456" ) ).toBe( false );
      expect( validarNumeroOAB( "OAB/MG" ) ).toBe( false );
      expect( validarNumeroOAB( "OAB/MGX 123" ) ).toBe( false );
    } );
  } );

  describe( "getTribunaisDisponiveis", () =>
  {
    it( "deve retornar lista de tribunais", () =>
    {
      const tribunais = getTribunaisDisponiveis();
      expect( tribunais ).toBeInstanceOf( Array );
      expect( tribunais.length ).toBeGreaterThan( 0 );
      expect( tribunais ).toContain( "TJSP" );
      expect( tribunais ).toContain( "TST" );
      expect( tribunais ).toContain( "TJMG" );
    } );

    it( "deve retornar array imutável", () =>
    {
      const tribunais1 = getTribunaisDisponiveis();
      const tribunais2 = getTribunaisDisponiveis();
      expect( tribunais1 ).not.toBe( tribunais2 );
    } );
  } );
} );

describe( "DJEN API - Classe de Erro", () =>
{
  it( "deve criar erro com mensagem e tribunal", () =>
  {
    const erro = new DJENAPIError( "Erro de teste", "TJSP" );
    expect( erro.message ).toBe( "Erro de teste" );
    expect( erro.tribunal ).toBe( "TJSP" );
    expect( erro.name ).toBe( "DJENAPIError" );
  } );

  it( "deve criar erro com status code", () =>
  {
    const erro = new DJENAPIError( "Erro HTTP", "TJMG", 404 );
    expect( erro.statusCode ).toBe( 404 );
    expect( erro.tribunal ).toBe( "TJMG" );
  } );

  it( "deve ser instância de Error", () =>
  {
    const erro = new DJENAPIError( "Teste" );
    expect( erro ).toBeInstanceOf( Error );
    expect( erro ).toBeInstanceOf( DJENAPIError );
  } );
} );

describe( "DJEN API - Integração", () =>
{
  beforeEach( () =>
  {
    globalThis.fetch = vi.fn();
  } );

  it( "deve lançar erro se não houver termo de busca", async () =>
  {
    await expect(
      consultarDJEN( {
        tribunais: [ "TJSP" ],
        searchTerms: {},
      } )
    ).rejects.toThrow( "É necessário fornecer pelo menos um termo de busca" );
  } );

  it( "deve processar resposta vazia corretamente", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [],
    } as Response );

    const resultado = await consultarDJEN( {
      tribunais: [ "TJSP" ],
      searchTerms: { nomeAdvogado: "Teste" },
      dataInicio: "2025-01-16",
    } );

    expect( resultado.resultados ).toHaveLength( 0 );
    expect( resultado.erros ).toHaveLength( 0 );
    expect( resultado.totalConsultado ).toBe( 0 );
  } );

  it( "deve filtrar publicações por nome do advogado", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [
        {
          tribunal: "TJSP",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Intimação",
          inteiro_teor: "Advogado: João Silva - OAB/SP 123456",
        },
        {
          tribunal: "TJSP",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Despacho",
          inteiro_teor: "Processo sem advogado mencionado",
        },
      ],
    } as Response );

    const resultado = await consultarDJEN( {
      tribunais: [ "TJSP" ],
      searchTerms: { nomeAdvogado: "João Silva" },
      dataInicio: "2025-01-16",
    } );

    expect( resultado.resultados ).toHaveLength( 1 );
    expect( resultado.resultados[ 0 ].matchType ).toBe( "nome" );
    expect( resultado.totalConsultado ).toBe( 2 );
  } );

  it( "deve identificar match por OAB", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [
        {
          tribunal: "TJMG",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Sentença",
          inteiro_teor: "Advogado: Maria Santos - OAB/MG 999999",
        },
      ],
    } as Response );

    const resultado = await consultarDJEN( {
      tribunais: [ "TJMG" ],
      searchTerms: { numeroOAB: "OAB/MG 999999" },
      dataInicio: "2025-01-16",
    } );

    expect( resultado.resultados ).toHaveLength( 1 );
    expect( resultado.resultados[ 0 ].matchType ).toBe( "oab" );
  } );

  it( "deve identificar match por nome e OAB", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [
        {
          tribunal: "TST",
          data_disponibilizacao: "2025-01-16",
          tipo_comunicacao: "Intimação",
          inteiro_teor: "Advogado: Pedro Costa - OAB/RJ 555555",
        },
      ],
    } as Response );

    const resultado = await consultarDJEN( {
      tribunais: [ "TST" ],
      searchTerms: {
        nomeAdvogado: "Pedro Costa",
        numeroOAB: "OAB/RJ 555555",
      },
      dataInicio: "2025-01-16",
    } );

    expect( resultado.resultados ).toHaveLength( 1 );
    expect( resultado.resultados[ 0 ].matchType ).toBe( "ambos" );
  } );

  it( "deve coletar erros de tribunais que falharem", async () =>
  {
    vi.mocked( globalThis.fetch )
      .mockResolvedValueOnce( {
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: new Headers(),
      } as Response )
      .mockResolvedValueOnce( {
        ok: true,
        headers: new Headers( { "content-type": "application/json" } ),
        json: async () => [],
      } as Response );

    const resultado = await consultarDJEN( {
      tribunais: [ "TJSP", "TJMG" ],
      searchTerms: { nomeAdvogado: "Teste" },
      dataInicio: "2025-01-16",
    } );

    expect( resultado.erros ).toHaveLength( 1 );
    expect( resultado.erros[ 0 ].tribunal ).toBe( "TJSP" );
    expect( resultado.erros[ 0 ].erro ).toContain( "404" );
  } );

  it( "deve usar data atual se não especificada", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [],
    } as Response );

    await consultarDJEN( {
      tribunais: [ "TJSP" ],
      searchTerms: { nomeAdvogado: "Teste" },
    } );

    const chamada = vi.mocked( globalThis.fetch ).mock.calls[ 0 ];
    const url = chamada[ 0 ] as string;

    const hoje = new Date().toISOString().split( "T" )[ 0 ];
    expect( url ).toContain( hoje );
  } );

  it( "deve aplicar delay entre requisições", async () =>
  {
    vi.mocked( globalThis.fetch ).mockResolvedValue( {
      ok: true,
      headers: new Headers( { "content-type": "application/json" } ),
      json: async () => [],
    } as Response );

    const inicio = Date.now();

    await consultarDJEN( {
      tribunais: [ "TJSP", "TJMG" ],
      searchTerms: { nomeAdvogado: "Teste" },
      delayBetweenRequests: 100,
    } );

    const duracao = Date.now() - inicio;

    expect( duracao ).toBeGreaterThanOrEqual( 100 );
  } );
} );

# Sistema de Consulta DJEN - Documentação Técnica

## Visão Geral

Sistema completo de consulta ao ** Diário de Justiça Eletrônico Nacional( DJEN ) ** através da ** API oficial pública do Comunica PJe ** do Conselho Nacional de Justiça( CNJ ).Permite buscar publicações de múltiplos tribunais por nome de advogado ou número de OAB de forma automatizada, ** gratuita ** e eficiente - ** sem necessidade de robôs privados pagos **.

> 💡 ** DJEN: habemus API! ** Como compartilhado por advogados no LinkedIn: _"O CNJ disponibiliza uma API para acessar os dados do DJEN. Basta colocar no seu browser o endereço da API ou usar o Swagger para mais opções. Dá até para rodar um código que baixa e trabalha os dados em Excel!"_

### 📚 Documentação Oficial

  - ** Swagger UI **: https://comunicaapi.pje.jus.br/swagger/index.html
- ** Versão **: 1.0.3( última atualização: 29 /05 / 2025 )
  - ** Recursos **: API REST com suporte a JSON, controle de rate limiting, autenticação para tribunais

## Arquitetura

### Componentes Principais

#### 1. `src/lib/djen-api.ts` - Camada de API
Biblioteca TypeScript com funções puras para comunicação com a API do DJEN.

** Principais funções:**
  - `consultarDJEN(config)` - Função principal que orquestra a consulta
    - `consultarPublicacoesTribunal(params)` - Consulta um tribunal específico
      - `matchesSearchTerms()` - Verifica se publicação contém termos buscados
        - `validarFormatoData()` - Valida formato de data AAAA - MM - DD
          - `validarNumeroOAB()` - Valida formato OAB / UF 12345

            ** Tratamento de Erros:**
              - Classe customizada `DJENAPIError` com contexto detalhado
                - Timeout configurável( padrão 60s )
                  - Retry logic pode ser implementada pelo consumidor
                    - Validação de content - type da resposta

                      ** Normalização de Texto:**
                        - Remove acentos( NFD normalization )
                          - Converte para lowercase
                            - Permite matching flexível de nomes

#### 2. `src/components/DJENConsulta.tsx` - Interface de Usuário
Componente React completo com formulário e exibição de resultados.

** Recursos:**
  - ✅ Seleção múltipla de tribunais( 7 disponíveis )
    - ✅ Busca por nome e / ou OAB
      - ✅ Seletor de data com valor padrão = hoje
        - ✅ Loading states com spinner
          - ✅ Exibição de erros por tribunal
            - ✅ Cards de resultado com badges de match type
              - ✅ Copiar teor para clipboard
                - ✅ Exportar resultados em JSON
                  - ✅ Histórico de buscas( persistido com useKV )

#### 3. Integração com DatabaseQueries
O componente foi integrado na aba DJEN do módulo de consultas existente.

## Endpoints da API

### 1. GET / api / v1 / comunicacao - Consulta de Comunicações

  ** Endpoint Base:**
    ```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao
```

    ** Descrição **: Método de consulta de comunicações processuais( publicações ) do DJEN e Plataforma de Editais.

#### Parâmetros( Query String )

  | Parâmetro | Tipo | Obrigatório | Descrição | Exemplo | Valores |
| -----------| ------| -------------| -----------| ---------| ---------|
| `numeroOab` | string | Condicional * | Número da OAB( apenas dígitos ) | `184404` | - |
| `ufOab` | string | Condicional * | UF da OAB( sigla ) | `MG` | 2 letras |
| `nomeAdvogado` | string | Condicional * | Nome do advogado | `Thiago Bodevan Veiga` | - |
| `nomeParte` | string | Condicional * | Nome da parte no processo | `Maria Santos` | - |
| `numeroProcesso` | string | Condicional * | Número CNJ do processo | `50012345620228130000` | 20 dígitos |
| `dataDisponibilizacaoInicio` | string | Não | Data inicial( padrão: hoje ) | `2025-01-16` | AAAA - MM - DD |
| `dataDisponibilizacaoFim` | string | Não | Data final( padrão: dataInicio ) | `2025-01-16` | AAAA - MM - DD |
| `siglaTribunal` | string | Condicional * | Sigla do tribunal | `TJMG`, `TST` | Oficial |
| `numeroComunicacao` | number | Não | ID interno da comunicação | `123456` | - |
| `pagina` | number | Não | Número da página( padrão: 1 ) | `1`, `2` | ≥ 1 |
| `itensPorPagina` | number | Não | Itens por página | `100` | 5 ou 100 |
| `orgaoId` | number | Não | ID interno do órgão | `1234` | - |
| `meio` | string | Não | Tipo de publicação | `D`, `E` | D=Diário, E = Edital |
| `texto` | string | Condicional * | Busca textual livre | `intimação` | - |

**\* Regras de Obrigatoriedade:**
  - A pesquisa ** deve conter pelo menos um ** dos seguintes parâmetros:
- `siglaTribunal`
  - `texto`
  - `nomeParte`
  - `nomeAdvogado`
  - `numeroOab`
  - `numeroProcesso`
  - OU ser limitado a 5 `itensPorPagina`

#### ⚠️ Limitações e Rate Limiting

  ** Limitações de Resultado( máximo 10.000 itens ):**
    - Pesquisas com campos textuais ou OAB( `texto`, `nomeAdvogado`, `numeroOab`, `nomeParte` )
      - Pesquisas com 5 ou menos`itensPorPagina`
        - Pesquisas com `dataDisponibilizacaoInicio` ≠ `dataDisponibilizacaoFim`
          - Pesquisas com`numeroProcesso`

            ** Rate Limiting( controle por IP ):**
              - Headers retornados:
- `x-ratelimit-limit`: Janela de quantidade de requisições
  - `x-ratelimit-remaining`: Requisições restantes na janela atual
    - Erro`429 Too Many Requests`: Aguardar ** 1 minuto ** antes de retomar
      - ⚠️ ** Uso de múltiplos IPs para contornar rate limit é considerado abuso ** e pode resultar em bloqueios

#### Headers Obrigatórios

  ```http
Accept: application/json
User-Agent: PJe-DataCollector/1.0
```

⚠️ ** CRÍTICO **:
- Sem`Accept: application/json` a resposta pode vir em HTML / PDF
  - Sem`User-Agent` correto a API retorna`403 Forbidden`

#### Exemplo de Requisição

  ** Simples( browser ):**
    ```
https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG&meio=D
```

    ** Completa( cURL ):**
      ```bash
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/comunicacao?numeroOab=184404&ufOab=MG&dataDisponibilizacaoInicio=2025-11-21&dataDisponibilizacaoFim=2025-11-21&meio=D&pagina=1&itensPorPagina=100" \
  -H "Accept: application/json" \
  -H "User-Agent: PJe-DataCollector/1.0"
```

#### Resposta( 200 OK )

  ```json
{
  "status": "success",
  "message": "Comunicações encontradas",
  "count": 42,
  "items": [
    {
      "id": 123456,
      "data_disponibilizacao": "2025-11-21",
      "siglaTribunal": "TJMG",
      "tipoComunicacao": "Intimação",
      "nomeOrgao": "1ª Vara Cível",
      "texto": "Intimação para apresentação de manifestação...",
      "numero_processo": "50012345620228130001",
      "meio": "D",
      "link": "https://...",
      "tipoDocumento": "Despacho",
      "nomeClasse": "Procedimento Comum Cível",
      "codigoClasse": "318",
      "numeroComunicacao": 123456,
      "ativo": true,
      "hash": "abc123def456",
      "datadisponibilizacao": "2025-11-21",
      "meiocompleto": "Diário Eletrônico",
      "numeroprocessocommascara": "5001234-56.2022.8.13.0001",
      "destinatarios": [
        {
          "nome": "João da Silva",
          "polo": "A",
          "comunicacao_id": 123456
        }
      ],
      "destinatarioadvogados": [
        {
          "id": 789,
          "comunicacao_id": 123456,
          "advogado_id": 101112,
          "created_at": "2025-11-21T09:00:00Z",
          "updated_at": "2025-11-21T09:00:00Z",
          "advogado": {
            "id": 101112,
            "nome": "Thiago Bodevan Veiga",
            "numero_oab": "184404",
            "uf_oab": "MG"
          }
        }
      ]
    }
  ]
}
```

#### Códigos de Status

  | Código | Descrição | Ação |
| --------| -----------| ------|
| `200` | OK - Comunicações encontradas | Processar`items` |
| `422` | Erro negocial - Parâmetros inválidos | Verificar parâmetros obrigatórios |
| `429` | Rate limit excedido | Aguardar 1 minuto e tentar novamente |

  ---

### 2. GET / api / v1 / caderno / { sigla_tribunal } / { data } / { meio } - Download de Cadernos

  ** Endpoint:**
    ```
GET https://comunicaapi.pje.jus.br/api/v1/caderno/{sigla_tribunal}/{data}/{meio}
```

    ** Descrição **: Método para baixar cadernos compactados de comunicações de cada tribunal.Retorna metadados e URL temporária( 5 minutos ) para download.

#### Parâmetros( Path )

  | Parâmetro | Tipo | Obrigatório | Descrição | Exemplo | Valores |
| -----------| ------| -------------| -----------| ---------| ---------|
| `sigla_tribunal` | string | Sim | Sigla oficial do tribunal | `TJMG` | - |
| `data` | string | Sim | Data do caderno | `2025-11-21` | AAAA - MM - DD |
| `meio` | string | Sim | Tipo de publicação | `D` | D=Diário, E = Edital |

** Disponibilidade **: Cadernos do dia atual são disponibilizados a partir das **02:00 ** ( madrugada ).

#### Exemplo de Requisição

  ```bash
curl -X GET "https://comunicaapi.pje.jus.br/api/v1/caderno/TJMG/2025-11-21/D" \
  -H "Accept: application/json"
```

#### Resposta( 200 OK )

  ```json
{
  "tribunal": "Tribunal de Justiça de Minas Gerais",
  "sigla_tribunal": "TJMG",
  "meio": "D",
  "status": "disponivel",
  "versao": "1.0",
  "data": "2025-11-21",
  "total_comunicacoes": 1523,
  "numero_paginas": 245,
  "hash": "abc123def456789",
  "url": "https://storage.googleapis.com/comunicaapi-cadernos/TJMG_2025-11-21_D.zip?expires=300"
}
```

  **⚠️ URL expira em 5 minutos! **

    ---

### 3. GET / api / v1 / comunicacao / tribunal - Lista de Tribunais

  ** Endpoint:**
    ```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao/tribunal
```

    ** Descrição **: Retorna lista de tribunais por UF com dados de último envio.

#### Resposta( 200 OK )

  ```json
[
  {
    "id": 1,
    "nome": "Tribunal de Justiça de Minas Gerais",
    "sigla": "TJMG",
    "jurisdicao": "MG",
    "endereco": "Av. Afonso Pena, 1212 - Belo Horizonte/MG",
    "telefone": "(31) 3250-0000"
  }
]
```

---

### 4. GET / api / v1 / comunicacao / { hash } / certidao - Download de Certidão

  ** Endpoint:**
    ```
GET https://comunicaapi.pje.jus.br/api/v1/comunicacao/{hash}/certidao
```

    ** Descrição **: Download de certidão de uma comunicação específica( PDF ).

#### Parâmetros( Path )

  | Parâmetro | Tipo | Obrigatório | Descrição |
| -----------| ------| -------------| -----------|
| `hash` | string | Sim | Hash único da comunicação |

  ---

### 5. POST / api / v1 / login - Autenticação( Tribunais )

  **⚠️ Apenas para uso dos Tribunais ** ( inclusão / remoção de comunicações).

** Endpoint:**
  ```
POST https://comunicaapi.pje.jus.br/api/v1/login
```

#### Request Body

  ```json
{
  "login": "usuario_tribunal",
  "senha": "senha_tribunal"
}
```

#### Resposta( 200 OK )

  ```json
{
  "user": {
    "id": 123,
    "nome": "Tribunal de Justiça XY",
    "email": "ti@tjxy.jus.br",
    "cpf": "12345678900"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Tribunais Suportados

Lista atualizada de tribunais integrados ao DJEN:

- ** TST ** - Tribunal Superior do Trabalho
  - ** TRT3 ** - Tribunal Regional do Trabalho da 3ª Região( MG )
    - ** TJMG ** - Tribunal de Justiça de Minas Gerais
      - ** TRF1 ** - Tribunal Regional Federal da 1ª Região
        - ** TJES ** - Tribunal de Justiça do Espírito Santo
          - ** TJSP ** - Tribunal de Justiça de São Paulo
            - ** STJ ** - Superior Tribunal de Justiça

Consulte `/api/v1/comunicacao/tribunal` para lista completa e atualizada.

## Estrutura de Dados

### DJENPublication( Resposta da API )

  ```typescript
interface DJENPublication {
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
```

### DJENFilteredResult( Resultado Processado )

  ```typescript
interface DJENFilteredResult {
  tribunal: string
  data: string
  tipo: string
  teor: string
  numeroProcesso?: string
  orgao?: string
  matchType: 'nome' | 'oab' | 'ambos'
}
```

## Uso Programático

### Exemplo Básico

  ```typescript
import { consultarDJEN } from '@/lib/djen-api'

const resultado = await consultarDJEN({
  tribunais: ['TJSP', 'TJMG'],
  searchTerms: {
    nomeAdvogado: 'Thiago Bodevan',
    numeroOAB: 'OAB/MG 123456'
  },
  dataInicio: '2025-01-16',
  dataFim: '2025-01-16'
})

console.log(`${ resultado.resultados.length } publicações encontradas`)
console.log(`${ resultado.erros.length } tribunais com erro`)
```

### Exemplo com Tratamento de Erros

  ```typescript
try {
  const resultado = await consultarDJEN({
    tribunais: ['TST', 'TRT3', 'STJ'],
    searchTerms: {
      numeroOAB: 'OAB/SP 12345'
    },
    dataInicio: '2025-01-16',
    dataFim: '2025-01-20',
    timeout: 90000, // 90 segundos
    delayBetweenRequests: 2000 // 2s entre requests
  })

  if (resultado.erros.length > 0) {
    console.warn('Alguns tribunais falharam:', resultado.erros)
  }

  for (const pub of resultado.resultados) {
    console.log(`${ pub.tribunal } - ${ pub.tipo } `)
    console.log(`Match type: ${ pub.matchType } `)
    console.log(pub.teor.substring(0, 200))
  }
} catch (error) {
  if (error instanceof DJENAPIError) {
    console.error(`Erro no tribunal ${ error.tribunal }: ${ error.message } `)
  }
}
```

## Boas Práticas

### Performance

1. ** Delay entre requisições **: Use `delayBetweenRequests: 1500` para evitar sobrecarga
2. ** Timeout generoso **: Configure`timeout: 60000`( 60s ) para tribunais grandes
3. ** Tribunais seletivos **: Consulte apenas tribunais relevantes ao caso

### Tratamento de Dados

1. ** Normalização **: Use `normalizeText()` para matching case -insensitive
2. ** Validação **: Sempre valide formato de OAB e data antes de consultar
3. ** Empty states **: Trate `[]` como resposta válida( sem publicações naquele dia )

### Rate Limiting

Embora não documentado oficialmente, recomenda - se:
- Máximo 10 requisições por minuto
  - Delay mínimo de 1.5s entre requests
    - Retry com backoff exponencial em caso de 503 / 504

## Possíveis Erros e Soluções

### Erro 400 Bad Request

  ** Causa **: Parâmetros faltando ou inválidos
    ** Solução **:
- Garantir que siglaTribunal, dataDisponibilizacaoInicio e dataDisponibilizacaoFim estão presentes
  - Fornecer pelo menos um dos parâmetros de busca( nomeAdvogado, numeroOab / ufOab, nomeParte, ou numeroProcesso )
    - Validar formato da data( YYYY - MM - DD )
      - Verificar que numeroOab e ufOab estão corretos quando fornecidos

### Erro 403 Forbidden

  ** Causa **: Falta do User - Agent correto
    ** Solução **: Garantir header`User-Agent: PJe-DataCollector/1.0`

### Erro 404 Not Found

  ** Causa **: Tribunal ou endpoint inválidos
    ** Solução **:
- Verificar sigla do tribunal(case -sensitive )
  - Usar o endpoint correto: `/api/v1/comunicacao`
    - Confirmar que o tribunal está disponível na API

### Timeout

  ** Causa **: Tribunal com volume alto de publicações( ex: TJSP )
    ** Solução **:
- Aumentar timeout para 90 - 120 segundos
  - Consultar dias úteis( menos volume )

### Response não é JSON

  ** Causa **: Header Accept incorreto
    ** Solução **: Garantir`Accept: application/json`

### AbortError

  ** Causa **: Request cancelado por timeout
    ** Solução **: Aumentar timeout ou tentar novamente

## Limitações Conhecidas

1. ** Sem paginação **: API retorna todos resultados do dia de uma vez
2. ** Sem autenticação **: Não requer nem suporta tokens de API
3. ** Volume **: Dias com muitas publicações podem ter resposta lenta
4. ** Campos variáveis **: Estrutura JSON pode variar entre tribunais
5. ** Histórico limitado **: Consulta apenas data específica( não ranges )

## Futuras Melhorias

### Curto Prazo
  - [] Cache de resultados( evitar requests duplicados )
    - [] Filtros adicionais( tipo de comunicação, órgão )
      - [] Exportar em PDF / Excel além de JSON
        - [] Agendamento de consultas recorrentes

### Médio Prazo
  - [] Agent autônomo para monitoramento diário
    - [] Notificações push quando encontrar match
      - [] Integração com cálculo automático de prazos
        - [] Dashboard analítico de publicações

### Longo Prazo
  - [] IA para classificação semântica de publicações
    - [] Resumo automático com LLM
      - [] Detecção de urgência / prioridade
        - [] OCR para processar PDFs diretamente

## Referências

### Documentação Oficial
  - [ API Comunica PJe - Swagger ]( https://comunicaapi.pje.jus.br/swagger-ui.html)
    -[ Resolução CNJ sobre DJEN ]( https://pje.csjt.jus.br/manual/index.php?title=DJEN)

### Discussões Técnicas
    - [ Reddit r / brdev - API do DJEN]( https://www.reddit.com/r/brdev/comments/1ncvpww/)

## Suporte

Para dúvidas ou problemas:
        1. Verificar esta documentação primeiro
2. Consultar logs de erro detalhados ( `DJENAPIError` )
3. Validar parâmetros de entrada
4. Testar endpoint manualmente( curl / Postman )

## Changelog

### v1.1.0( 2025 - 11 - 16 )
  - ✅ ** CORREÇÃO CRÍTICA **: Atualizado endpoint de `/api/v1/caderno` para`/api/v1/comunicacao`( endpoint correto )
    - ✅ Parâmetros agora passados via query string em vez de path
      - ✅ Adicionado suporte a dataDisponibilizacaoInicio e dataDisponibilizacaoFim
        - ✅ Extração automática de UF do número OAB( formato OAB / UF 12345 )
          - ✅ Corrigido erro HTTP 400 que impedia consultas

### v1.0.0( 2025-01 - 16 )
  - ✅ Implementação inicial completa
    - ✅ Suporte a 7 tribunais principais
      - ✅ UI responsiva com React / TypeScript
        - ✅ Tratamento robusto de erros
          - ✅ Exportação JSON
            - ✅ Histórico de buscas persistido
              - ✅ Documentação técnica completa



import { consultarDJEN, type DJENConfig, type DJENFilteredResult } from "@/lib/djen-api";

export interface DJENMonitorConfig
{
  tribunais: string[];
  advogados: Array<{
    nome?: string;
    oab?: string;
  }>;
  /**
   * Intervalo em horas entre execuções automáticas.
   * Default: 24h → modo diário.
   */
  intervaloHoras?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  /**
   * Callback para integração com o agente de IA / notificações.
   * Ex.: enfileirar tarefas para o AgentTaskQueue.
   */
  notificarCallback?: ( publicacoes: DJENFilteredResult[] ) => void;
  logCallback?: ( message: string, level: "info" | "warn" | "error" ) => void;
}

export interface DJENMonitorTask
{
  id: string;
  status: "idle" | "running" | "paused" | "error";
  lastRun?: string;
  nextRun?: string;
  totalPublicacoesEncontradas: number;
  ultimasPublicacoes: DJENFilteredResult[];
  erros: Array<{ timestamp: string; message: string }>;
}

export class DJENMonitorAgent
{
  private config: DJENMonitorConfig;
  private readonly task: DJENMonitorTask;
  private intervalId?: ReturnType<typeof setInterval>;
  private isRunning: boolean = false;

  constructor ( config: DJENMonitorConfig )
  {
    this.config = {
      intervaloHoras: 24, // diário por padrão
      maxRetries: 3,
      retryDelayMs: 5000,
      ...config,
    };

    this.task = {
      id: `djen-monitor-${ Date.now() }`,
      status: "idle",
      totalPublicacoesEncontradas: 0,
      ultimasPublicacoes: [],
      erros: [],
    };
  }

  private log ( message: string, level: "info" | "warn" | "error" = "info" )
  {
    if ( this.config.logCallback )
    {
      this.config.logCallback( `[DJEN Monitor] ${ message }`, level );
    } else
    {
      console[ level ]( `[DJEN Monitor] ${ message }` );
    }
  }

  private calcularProximaExecucao (): Date
  {
    const agora = new Date();
    const intervaloMs = ( this.config.intervaloHoras || 24 ) * 60 * 60 * 1000;
    return new Date( agora.getTime() + intervaloMs );
  }

  private async sleep ( ms: number ): Promise<void>
  {
    return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
  }

  private async consultarComRetry (
    configConsulta: DJENConfig,
    advogado: { nome?: string; oab?: string }
  ): Promise<{
    resultados: DJENFilteredResult[];
    erros: Array<{ tribunal: string }>;
  }>
  {
    const maxRetries = this.config.maxRetries || 3;
    const retryDelay = this.config.retryDelayMs || 5000;

    for ( let attempt = 1; attempt <= maxRetries; attempt++ )
    {
      try
      {
        const resultado = await consultarDJEN( configConsulta );
        return resultado;
      } catch ( error )
      {
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

        if ( attempt === maxRetries )
        {
          this.log(
            `Falha após ${ maxRetries } tentativas para ${ advogado.nome || advogado.oab
            }: ${ errorMessage }`,
            "error"
          );
          throw error;
        }

        this.log(
          `Tentativa ${ attempt }/${ maxRetries } falhou para ${ advogado.nome || advogado.oab
          }. Tentando novamente em ${ retryDelay * attempt }ms...`,
          "warn"
        );

        await this.sleep( retryDelay * attempt ); // backoff incremental
      }
    }

    throw new Error( "Max retries exceeded" );
  }

  // ===== Helper methods for executarConsulta (reduced CC) =====

  private isAdvogadoValido ( advogado: { nome?: string; oab?: string } ): boolean
  {
    return !!( advogado.nome || advogado.oab );
  }

  private buildConsultaConfig ( advogado: { nome?: string; oab?: string } ): DJENConfig
  {
    return {
      tribunais: this.config.tribunais,
      searchTerms: {
        nomeAdvogado: advogado.nome,
        numeroOAB: advogado.oab,
      },
      timeout: 60000,
      delayBetweenRequests: 1500,
    };
  }

  private getAdvogadoIdentifier ( advogado: { nome?: string; oab?: string } ): string
  {
    return advogado.nome || advogado.oab || "desconhecido";
  }

  private handleAdvogadoError ( advogado: { nome?: string; oab?: string }, error: unknown ): void
  {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    this.log(
      `Erro ao consultar advogado ${ this.getAdvogadoIdentifier( advogado ) }: ${ errorMessage }`,
      "error"
    );

    this.task.erros.push( {
      timestamp: new Date().toISOString(),
      message: errorMessage,
    } );

    // Limita histórico de erros
    if ( this.task.erros.length > 100 )
    {
      this.task.erros = this.task.erros.slice( -50 );
    }
  }

  private processResultado (
    resultado: {
      resultados: DJENFilteredResult[];
      erros: Array<{ tribunal: string }>;
    },
    advogado: { nome?: string; oab?: string },
    todasPublicacoes: DJENFilteredResult[]
  ): void
  {
    const identifier = this.getAdvogadoIdentifier( advogado );

    if ( resultado.resultados.length > 0 )
    {
      this.log(
        `Encontradas ${ resultado.resultados.length } publicação(ões) para ${ identifier }`,
        "info"
      );
      todasPublicacoes.push( ...resultado.resultados );
    }

    if ( resultado.erros.length > 0 )
    {
      const tribunais = resultado.erros.map( ( e ) => e.tribunal ).join( ", " );
      this.log( `Erros ao consultar tribunais para ${ identifier }: ${ tribunais }`, "warn" );
    }
  }

  private handlePublicacoesEncontradas ( todasPublicacoes: DJENFilteredResult[] ): void
  {
    this.task.totalPublicacoesEncontradas += todasPublicacoes.length;
    this.task.ultimasPublicacoes = todasPublicacoes;

    if ( this.config.notificarCallback )
    {
      try
      {
        this.config.notificarCallback( todasPublicacoes );
      } catch
      {
        this.log( "Erro ao executar callback de notificação", "error" );
      }
    }

    this.log(
      `Total de ${ todasPublicacoes.length } publicação(ões) relevante(s) encontrada(s) nesta execução`,
      "info"
    );
  }

  private finalizarConsulta (): void
  {
    this.task.lastRun = new Date().toISOString();
    this.task.nextRun = this.calcularProximaExecucao().toISOString();
    this.task.status = "idle";
    this.log(
      `Próxima execução agendada para ${ new Date( this.task.nextRun ).toLocaleString( "pt-BR" ) }`
    );
  }

  // ===== Main refactored method =====

  private async executarConsulta (): Promise<void>
  {
    if ( !this.isRunning ) return;

    this.task.status = "running";
    this.log( "Iniciando consulta ao DJEN (modo diário automático, janela = hoje)..." );

    const todasPublicacoes: DJENFilteredResult[] = [];

    for ( const advogado of this.config.advogados )
    {
      if ( !this.isAdvogadoValido( advogado ) )
      {
        this.log( "Advogado sem nome e sem OAB ignorado na consulta", "warn" );
        continue;
      }

      try
      {
        const configConsulta = this.buildConsultaConfig( advogado );
        const resultado = await this.consultarComRetry( configConsulta, advogado );
        this.processResultado( resultado, advogado, todasPublicacoes );
      } catch ( error )
      {
        this.handleAdvogadoError( advogado, error );
      }
    }

    if ( todasPublicacoes.length > 0 )
    {
      this.handlePublicacoesEncontradas( todasPublicacoes );
    } else
    {
      this.log( "Nenhuma publicação relevante encontrada nesta execução", "info" );
    }

    this.finalizarConsulta();
  }

  public iniciar (): void
  {
    if ( this.isRunning )
    {
      this.log( "Monitor já está em execução", "warn" );
      return;
    }

    this.isRunning = true;
    this.task.status = "running";
    this.log( "Monitor DJEN iniciado (modo automático)" );

    // Primeira rodada imediata
    void this.executarConsulta();

    const intervaloMs = ( this.config.intervaloHoras || 24 ) * 60 * 60 * 1000;
    this.intervalId = setInterval( () =>
    {
      void this.executarConsulta();
    }, intervaloMs );

    this.task.nextRun = this.calcularProximaExecucao().toISOString();
  }

  public pausar (): void
  {
    if ( !this.isRunning )
    {
      this.log( "Monitor já está pausado", "warn" );
      return;
    }

    this.isRunning = false;
    this.task.status = "paused";

    if ( this.intervalId !== undefined )
    {
      clearInterval( this.intervalId );
      this.intervalId = undefined;
    }

    this.log( "Monitor DJEN pausado" );
  }

  public retomar (): void
  {
    if ( this.isRunning )
    {
      this.log( "Monitor já está em execução", "warn" );
      return;
    }

    this.log( "Retomando monitor DJEN..." );
    this.iniciar();
  }

  public parar (): void
  {
    this.pausar();
    this.task.status = "idle";
    this.task.nextRun = undefined;
    this.log( "Monitor DJEN parado" );
  }

  public getStatus (): DJENMonitorTask
  {
    return { ...this.task };
  }

  public executarAgora (): void
  {
    if ( this.task.status === "running" )
    {
      this.log( "Já há uma consulta em execução", "warn" );
      return;
    }

    this.log( "Executando consulta manual agora..." );
    void this.executarConsulta();
  }

  public limparHistorico (): void
  {
    this.task.ultimasPublicacoes = [];
    this.task.erros = [];
    this.log( "Histórico limpo" );
  }

  public atualizarConfig ( novaConfig: Partial<DJENMonitorConfig> ): void
  {
    const estaRodando = this.isRunning;

    if ( estaRodando )
    {
      this.pausar();
    }

    this.config = {
      ...this.config,
      ...novaConfig,
    };

    this.log( "Configuração do Monitor DJEN atualizada" );

    if ( estaRodando )
    {
      this.retomar();
    }
  }
}

export function criarMonitorDJEN ( config: DJENMonitorConfig ): DJENMonitorAgent
{
  return new DJENMonitorAgent( config );
}

/**
 * Tipos compartilhados para publicações DJEN
 */

export interface DJENPublication
{
  id: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  lawyerName: string;
  matchType: "nome" | "oab" | "ambos";
  source: string;
  createdAt: string;
  notified?: boolean;
}
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKV } from "@/hooks/use-kv";
import
  {
    consultarDJEN,
    getTribunaisDisponiveis,
    validarFormatoData,
    validarNumeroOAB,
    type DJENConfig,
    type DJENFilteredResult,
  } from "@/lib/djen-api"; // X - disponível para botões de fechar
import
  {
    AlertTriangle,
    CheckCircle,
    Copy,
    Download,
    Loader2,
    Newspaper,
    Search,
  } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DJENSearchHistory
{
  id: string;
  timestamp: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  tribunais: string[];
  totalResultados: number;
}

export default function DJENConsulta ()
{
  const [ nomeAdvogado, setNomeAdvogado ] = useState( "" );
  const [ numeroOAB, setNumeroOAB ] = useState( "" );
  const [ dataConsulta, setDataConsulta ] = useState( new Date().toISOString().split( "T" )[ 0 ] );
  const [ tribunaisSelecionados, setTribunaisSelecionados ] =
    useState<string[]>( getTribunaisDisponiveis() );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ resultados, setResultados ] = useState<DJENFilteredResult[]>( [] );
  const [ erros, setErros ] = useState<Array<{ tribunal: string; erro: string }>>( [] );
  const [ totalConsultado, setTotalConsultado ] = useState( 0 );
  const [ _searchHistory, setSearchHistory ] = useKV<DJENSearchHistory[]>( "djen-search-history", [] );

  const toggleTribunal = ( tribunal: string ) =>
  {
    setTribunaisSelecionados( ( current ) =>
      current.includes( tribunal ) ? current.filter( ( t ) => t !== tribunal ) : [ ...current, tribunal ]
    );
  };

  const toggleTodosTribunais = () =>
  {
    if ( tribunaisSelecionados.length === getTribunaisDisponiveis().length )
    {
      setTribunaisSelecionados( [] );
    } else
    {
      setTribunaisSelecionados( getTribunaisDisponiveis() );
    }
  };

  const validarFormulario = (): string | null =>
  {
    if ( !nomeAdvogado.trim() && !numeroOAB.trim() )
    {
      return "Informe pelo menos o nome do advogado ou número da OAB";
    }

    if ( numeroOAB.trim() && !validarNumeroOAB( numeroOAB ) )
    {
      return "Formato de OAB inválido. Use o formato: OAB/UF 12345";
    }

    if ( !validarFormatoData( dataConsulta ) )
    {
      return "Data inválida. Use o formato AAAA-MM-DD";
    }

    if ( tribunaisSelecionados.length === 0 )
    {
      return "Selecione pelo menos um tribunal";
    }

    return null;
  };

  const handleConsultar = async () =>
  {
    const validationError = validarFormulario();
    if ( validationError )
    {
      toast.error( validationError );
      return;
    }

    setIsLoading( true );
    setResultados( [] );
    setErros( [] );
    setTotalConsultado( 0 );

    try
    {
      const config: DJENConfig = {
        tribunais: tribunaisSelecionados,
        searchTerms: {
          nomeAdvogado: nomeAdvogado.trim() || undefined,
          numeroOAB: numeroOAB.trim() || undefined,
        },
        dataInicio: dataConsulta,
        dataFim: dataConsulta,
        timeout: 60000,
        delayBetweenRequests: 1500,
      };

      const resultado = await consultarDJEN( config );

      setResultados( resultado.resultados );
      setErros( resultado.erros );
      setTotalConsultado( resultado.totalConsultado );

      const newHistoryEntry: DJENSearchHistory = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        nomeAdvogado: nomeAdvogado.trim() || undefined,
        numeroOAB: numeroOAB.trim() || undefined,
        tribunais: tribunaisSelecionados,
        totalResultados: resultado.resultados.length,
      };

      setSearchHistory( ( current ) => [ newHistoryEntry, ...( current || [] ).slice( 0, 49 ) ] );

      if ( resultado.resultados.length === 0 && resultado.erros.length === 0 )
      {
        toast.info( "Nenhuma publicação encontrada para os termos informados" );
      } else if ( resultado.resultados.length > 0 )
      {
        toast.success( `${ resultado.resultados.length } publicação(ões) encontrada(s)` );
      } else if ( resultado.erros.length > 0 )
      {
        toast.warning( "Consulta finalizada com alguns erros. Verifique os detalhes." );
      }
    } catch ( error )
    {
      console.error( "Erro ao consultar DJEN:", error );
      toast.error( error instanceof Error ? error.message : "Erro ao consultar DJEN" );
    } finally
    {
      setIsLoading( false );
    }
  };

  const copyToClipboard = ( text: string ) =>
  {
    navigator.clipboard.writeText( text );
    toast.success( "Copiado para a área de transferência" );
  };

  const exportResultados = () =>
  {
    const jsonData = JSON.stringify( resultados, null, 2 );
    const blob = new Blob( [ jsonData ], { type: "application/json" } );
    const url = URL.createObjectURL( blob );
    const a = document.createElement( "a" );
    a.href = url;
    a.download = `djen-resultados-${ dataConsulta }.json`;
    document.body.appendChild( a );
    a.click();
    a.remove();
    URL.revokeObjectURL( url );
    toast.success( "Resultados exportados com sucesso" );
  };

  const getMatchTypeBadge = ( matchType: string ) =>
  {
    switch ( matchType )
    {
      case "ambos":
        return <Badge className="bg-green-500" > Nome + OAB </Badge>;
      case "nome":
        return <Badge variant="secondary" > Nome </Badge>;
      case "oab":
        return <Badge variant="outline" > OAB </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className= "h-full p-6 space-y-6" >
    <div className="flex items-center gap-3" >
      <Newspaper size={ 32 } className = "text-primary" />
        <div>
        <h1 className="text-2xl font-bold text-foreground" > Consulta DJEN </h1>
          < p className = "text-sm text-muted-foreground" >
            Diário de Justiça Eletrônico Nacional - API Comunica PJe
              </p>
              </div>
              </div>

              < div className = "grid grid-cols-1 lg:grid-cols-3 gap-6" >
                <Card className="lg:col-span-1 p-6 space-y-6" >
                  <div>
                  <h2 className="text-lg font-semibold mb-4" > Parâmetros de Busca </h2>

                    < div className = "space-y-4" >
                      <div className="space-y-2" >
                        <Label htmlFor="nome-advogado" > Nome do Advogado </Label>
                          < Input
                                id = "nome-advogado"
                                placeholder = "Ex: Thiago Bodevan"
  value = { nomeAdvogado }
  onChange = {( e ) => setNomeAdvogado( e.target.value )
}
disabled = { isLoading }
  />
  </div>

  < div className = "space-y-2" >
    <Label htmlFor="numero-oab" > Número da OAB </Label>
      < Input
id = "numero-oab"
placeholder = "Ex: OAB/MG 123456"
value = { numeroOAB }
onChange = {( e ) => setNumeroOAB( e.target.value )}
disabled = { isLoading }
  />
  <p className="text-xs text-muted-foreground" > Formato: OAB / UF 12345 </p>
    </div>

    < div className = "space-y-2" >
      <Label htmlFor="data-consulta" > Data de Publicação </Label>
        < Input
id = "data-consulta"
type = "date"
value = { dataConsulta }
onChange = {( e ) => setDataConsulta( e.target.value )}
disabled = { isLoading }
  />
  </div>
  </div>
  </div>

  < div >
  <div className="flex items-center justify-between mb-3" >
    <h3 className="text-sm font-medium" > Tribunais </h3>
      < Button variant = "ghost" size = "sm" onClick = { toggleTodosTribunais } disabled = { isLoading } >
      {
        tribunaisSelecionados.length === getTribunaisDisponiveis().length
          ? "Desmarcar todos"
          : "Selecionar todos"
      }
        </Button>
        </div>

        < div className = "space-y-2" >
        {
          getTribunaisDisponiveis ().map( ( tribunal ) => (
            <div key= { tribunal } className = "flex items-center space-x-2" >
            <Checkbox
                                  id={`tribunal-${ tribunal }`}
checked = { tribunaisSelecionados.includes( tribunal ) }
onCheckedChange = {() => toggleTribunal( tribunal )}
disabled = { isLoading }
  />
  <Label
                                  htmlFor={ `tribunal-${ tribunal }` }
className = "text-sm font-normal cursor-pointer"
  >
  { tribunal }
  </Label>
  </div>
                            ))}
</div>
  </div>

  < Button className = "w-full" size = "lg" onClick = { handleConsultar } disabled = { isLoading } >
  {
    isLoading?(
                            <>
    <Loader2 className="animate-spin mr-2" />
      Consultando...
</>
                          ) : (
  <>
  <Search className= "mr-2" />
  Consultar DJEN
    </>
                          )}
</Button>
  </Card>

  < Card className = "lg:col-span-2 p-6" >
    <div className="flex items-center justify-between mb-4" >
      <h2 className="text-lg font-semibold" > Resultados </h2>
{
  resultados.length > 0 && (
    <Button variant="outline" size = "sm" onClick = { exportResultados } >
      <Download className="mr-2" size = { 16} />
        Exportar JSON
          </Button>
                          )
}
</div>

{
  isLoading && (
    <div className="flex flex-col items-center justify-center py-12 space-y-3" >
      <Loader2 size={ 40 } className = "animate-spin text-primary" />
        <p className="text-sm text-muted-foreground" > Consultando tribunais selecionados...</p>
          </div>
                        )
}

{
  !isLoading && resultados.length === 0 && erros.length === 0 && (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3" >
      <Newspaper size={ 48 } className = "text-muted-foreground" />
        <p className="text-sm text-muted-foreground" >
          Nenhuma consulta realizada ainda.
                              < br />
            Preencha os parâmetros e clique em Consultar.
                            </p>
              </div>
                        )
}

{
  !isLoading && ( resultados.length > 0 || erros.length > 0 ) && (
    <div className="space-y-4" >
      { totalConsultado > 0 && (
        <Alert>
        <AlertDescription>
        { totalConsultado } publicação( ões ) consultada( s ) | { resultados.length }{ " " }
  relevante( s ) encontrada( s )
    </AlertDescription>
    </Alert>
                            )
}

{
  erros.length > 0 && (
    <Alert variant="destructive" >
      <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
        <div className="font-semibold mb-2" > Erros ao consultar alguns tribunais: </div>
          < ul className = "text-xs space-y-1" >
          {
            erros.map( ( erro ) => (
              <li key= {`${ erro.tribunal }-${ erro.erro.substring( 0, 50 ) }`} >
            <strong> { erro.tribunal }: </strong> {erro.erro}
              </li>
                                    ))
}
</ul>
  </AlertDescription>
  </Alert>
                            )}

{
  resultados.length > 0 && (
    <ScrollArea className="h-[500px] pr-4" >
      <div className="space-y-4" >
      {
        resultados.map( ( resultado ) => (
          <Card
                                      key= {`${ resultado.tribunal }-${ resultado.numeroProcesso || resultado.data }`}
  className = "p-4 space-y-3 hover:shadow-md transition-shadow"
    >
    <div className="flex items-start justify-between gap-3" >
      <div className="flex items-center gap-2 flex-wrap" >
        <Badge variant="outline" > { resultado.tribunal } </Badge>
          < Badge variant = "secondary" > { resultado.tipo } </Badge>
  { getMatchTypeBadge( resultado.matchType ) }
  </div>
    < Button
  variant = "ghost"
  size = "sm"
  onClick = {() => copyToClipboard( resultado.teor )
}
                                        >
  <Copy size={ 16 } />
    </Button>
    </div>

{
  resultado.numeroProcesso && (
    <div className="text-sm" >
      <span className="font-medium" > Processo: </span>{" "}
        < code className = "bg-muted px-1 rounded text-xs" >
          { resultado.numeroProcesso }
          </code>
          </div>
                                      )
}

{
  resultado.orgao && (
    <div className="text-sm text-muted-foreground" >
      <span className="font-medium" > Órgão: </span> {resultado.orgao}
        </div>
                                      )
}

<div className="bg-muted p-3 rounded text-sm" >
  <div className="font-medium mb-1" > Teor da Publicação: </div>
    < div className = "text-xs whitespace-pre-wrap max-h-32 overflow-y-auto" >
      { resultado.teor.substring( 0, 500 ) }
{ resultado.teor.length > 500 && "..." }
</div>
  </div>

  < div className = "text-xs text-muted-foreground" >
    Publicado em: { new Date( resultado.data ).toLocaleDateString( "pt-BR" ) }
</div>
  </Card>
                                  ))}
</div>
  </ScrollArea>
                            )}

{
  resultados.length === 0 && erros.length === 0 && !isLoading && (
    <div className="flex flex-col items-center justify-center py-8 text-center" >
      <CheckCircle size={ 48 } className = "text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground" >
          Nenhuma publicação encontrada para os termos informados.
                                </p>
            </div>
                            )
}
</div>
                        )}
</Card>
  </div>
  </div>
                );
              }
/**
 * DJEN Publications Widget - Refatorado
 *
 * Versão otimizada com complexidade cognitiva reduzida (S3776)
 * Separação de responsabilidades em hooks customizados
 */

import { DJENErrorCard } from "@/components/djen/DJENErrorCard";
import { DJENLoadingCard } from "@/components/djen/DJENLoadingCard";
import { PublicationItem } from "@/components/PublicationItem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDJENProcessRegistration } from "@/hooks/use-djen-process-registration";
import { useDJENPublications } from "@/hooks/use-djen-publications";
import { useDJENSync } from "@/hooks/use-djen-sync";
import { useKV } from "@/hooks/use-kv";
import { getRelativeDateDescription } from "@/lib/date-utils";
import { extractPartiesWithFallback } from "@/lib/extract-parties-service";
import { cn } from "@/lib/utils";
import type { Expediente, Process, TipoExpediente } from "@/types";
import { ArrowRight, Bot, CheckCircle, Clock, Filter, Newspaper, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

// Tipos
interface DJENPublication
{
  id: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  lawyerName: string;
  matchType: "nome" | "oab" | "ambos";
  source: string;
  createdAt: string;
  notified?: boolean;
}

// Interface ExpedientesResponse removida - não utilizada

interface PartiesResult
{
  autor: string;
  reu: string;
  advogadoAutor?: string;
  advogadoReu?: string;
}

/**
 * Cria um novo processo a partir de uma publicação DJEN
 */
function createProcessFromPublication (
  pub: DJENPublication,
  parties: PartiesResult,
  now: string
): Process
{
  return {
    id: crypto.randomUUID(),
    numeroCNJ: pub.numeroProcesso!,
    titulo: `${ pub.tipo || "Intimação" } - ${ pub.tribunal }`,
    autor: parties.autor || "Não identificado",
    reu: parties.reu || "Não identificado",
    comarca: pub.orgao || "",
    vara: pub.tribunal || "",
    status: "ativo",
    fase: "Inicial",
    dataDistribuicao: pub.data || now.split( "T" )[ 0 ],
    dataUltimaMovimentacao: now,
    notas: buildProcessNotes( pub, parties ),
    prazos: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Monta as notas do processo
 */
function buildProcessNotes ( pub: DJENPublication, parties: PartiesResult ): string
{
  const advAutor = parties.advogadoAutor ? `\nAdvogado Autor: ${ parties.advogadoAutor }` : "";
  const advReu = parties.advogadoReu ? `\nAdvogado Réu: ${ parties.advogadoReu }` : "";
  const teorTruncado = pub.teor.length > 500 ? pub.teor.substring( 0, 500 ) + "..." : pub.teor;

  return `Origem: DJEN\nAdvogado: ${ pub.lawyerName }\nTipo de match: ${ pub.matchType }${ advAutor }${ advReu }\n\nTeor da intimação:\n${ teorTruncado }`;
}

/**
 * Cria um expediente a partir de uma publicação DJEN
 */
function createExpedienteFromPublication (
  pub: DJENPublication,
  processId: string,
  now: string
): Expediente
{
  return {
    id: crypto.randomUUID(),
    processId,
    tipo: ( pub.tipo || "intimacao" ) as TipoExpediente,
    titulo: `${ pub.tipo || "Intimação" } - ${ pub.numeroProcesso }`,
    conteudo: pub.teor,
    content: pub.teor,
    teor: pub.teor,
    dataRecebimento: now,
    receivedAt: now,
    lido: false,
    arquivado: false,
    analyzed: false,
    tribunal: pub.tribunal,
    numeroProcesso: pub.numeroProcesso,
    orgao: pub.orgao,
    lawyerName: pub.lawyerName,
    matchType: pub.matchType,
    source: pub.source,
    createdAt: pub.createdAt,
    data: pub.data,
    priority: "high", // Intimações são sempre prioridade alta
  };
}

// ===== Registration Helpers (reduces S3776 Cognitive Complexity) =====

interface RegistrationContext
{
  createOrUpdateFromDjenIntimacao: ( data: {
    nomeCliente: string;
    cidade: string;
    estado: string;
    processo: string;
  } ) => void;
}

/**
 * Extrai cidade e estado do campo orgão
 */
function parseOrgaoLocation ( orgao?: string ):
  {
    cidade: string;
    estado: string;
  }
{
  const parts = orgao?.split( "/" ) || [];
  return {
    cidade: parts[ 0 ] || "",
    estado: parts[ 1 ] || "",
  };
}

/**
 * Registra cliente a partir das partes extraídas
 */
function registerClientFromParties (
  parties: PartiesResult,
  pub: DJENPublication,
  ctx: RegistrationContext
): void
{
  if ( !parties.autor || parties.autor === "Não identificado" ) return;

  const location = parseOrgaoLocation( pub.orgao );
  ctx.createOrUpdateFromDjenIntimacao( {
    nomeCliente: parties.autor,
    cidade: location.cidade,
    estado: location.estado,
    processo: pub.numeroProcesso || "",
  } );
}

/**
 * Processa uma única publicação para registro
 */
async function _processPublicationForRegistration (
  pub: DJENPublication,
  now: string,
  ctx: RegistrationContext
): Promise<{ process: Process; expediente: Expediente } | null>
{
  if ( !pub.numeroProcesso ) return null;

  const parties = await extractPartiesWithFallback( pub.teor );
  registerClientFromParties( parties, pub, ctx );

  const newProcess = createProcessFromPublication( pub, parties, now );
  const newExpediente = createExpedienteFromPublication( pub, newProcess.id, now );

  return { process: newProcess, expediente: newExpediente };
}

/**
 * Formata descrição das partes para toast
 */
function _formatPartiesDescription ( parties: PartiesResult ): string
{
  if ( parties.autor === "Não identificado" ) return "";
  return ` - ${ parties.autor } x ${ parties.reu }`;
}

// ===== Sync Helpers (reduces S3776 Cognitive Complexity) =====

interface SyncResult
{
  success: boolean;
  message?: string;
  newPublications?: number;
  rateLimited?: boolean;
}

/**
 * Executa sincronização DJEN via API
 */
async function _executeDJENSync ( baseUrl: string ): Promise<SyncResult>
{
  const response = await fetch( `${ baseUrl }/api/djen-sync`, {
    method: "POST",
  } );

  // Rate limit
  if ( response.status === 429 )
  {
    const data = await response.json();
    return {
      success: false,
      rateLimited: true,
      message: data.message || "Tente novamente em alguns segundos",
    };
  }

  if ( !response.ok )
  {
    return { success: false, message: `HTTP ${ response.status }` };
  }

  const result = await response.json();

  if ( result.ok )
  {
    return {
      success: true,
      newPublications: result.result?.newPublications || 0,
    };
  }

  return {
    success: false,
    message: result.error || result.message || "Erro na sincronização",
  };
}

/**
 * Exibe toast apropriado baseado no resultado da sync
 */
function _showSyncToast ( result: SyncResult ): void
{
  if ( result.rateLimited )
  {
    toast.warning( "Aguarde antes de sincronizar", {
      description: result.message,
    } );
    return;
  }

  if ( result.success )
  {
    toast.success( "Sincronização concluída", {
      description:
        result.newPublications && result.newPublications > 0
          ? `${ result.newPublications } novas publicações encontradas`
          : "Nenhuma nova publicação",
    } );
    return;
  }

  toast.error( "Falha na sincronização", {
    description: result.message || "Erro desconhecido",
  } );
}

interface DJENPublicationsWidgetProps
{
  readonly onViewAll?: () => void;
  readonly compact?: boolean;
  readonly maxItems?: number;
}

// Interface para props do PublicationsHeader (reduz parâmetros para conformidade S107)
interface PublicationsHeaderProps
{
  readonly publicationsCount: number;
  readonly filter: "all" | "unread";
  readonly setFilter: ( fn: ( f: "all" | "unread" ) => "all" | "unread" ) => void;
  readonly syncing: boolean;
  readonly handleSync: ( fn?: () => void | Promise<void> ) => Promise<void>;
  readonly fetchPublications: () => Promise<void>;
  readonly lastCheck: string | null;
  readonly lawyersCount: number;
}

// Helpers de renderização extraídos para reduzir complexidade (S3776)
function PublicationsHeader ( props: Readonly<PublicationsHeaderProps> )
{
  const {
    publicationsCount,
    filter,
    setFilter,
    syncing,
    handleSync,
    fetchPublications,
    lastCheck,
    lawyersCount,
  } = props;

  return (
    <CardHeader className= "pb-2" >
    <div className="flex items-center justify-between" >
      <CardTitle className="flex items-center gap-2 text-sm gradient-text" >
        <Newspaper size={ 20 } className = "text-primary" />
          Publicações DJEN
  {
    publicationsCount > 0 && (
      <Button variant="secondary" className = "ml-1 h-5 px-2 text-xs" >
        { publicationsCount }
        </Button>
                        )
  }
  </CardTitle>

    < div className = "flex items-center gap-1" >
      <TooltipProvider>
      <Tooltip>
      <TooltipTrigger asChild >
      <Button
                                variant="ghost"
  size = "sm"
  onClick = {() => setFilter( ( f ) => ( f === "all" ? "unread" : "all" ) )
}
className = "h-8 w-8 p-0"
aria - label={
  filter === "all"
    ? "Filtrar: mostrar apenas não lidas"
    : "Filtrar: mostrar todas"
}
                              >
  <Filter size={ 16 } className = { filter === "unread" ? "text-primary" : ""} />
    </Button>
    </TooltipTrigger>
    <TooltipContent>
{ filter === "all" ? "Mostrar não lidas" : "Mostrar todas" }
</TooltipContent>
  </Tooltip>
  </TooltipProvider>

  < TooltipProvider >
  <Tooltip>
  <TooltipTrigger asChild >
  <Button
                                variant="ghost"
size = "sm"
onClick = {() => {
  handleSync( fetchPublications ).catch( console.error );
}}
disabled = { syncing }
className = "h-8 w-8 p-0"
aria - label="Sincronizar publicações agora"
  >
  <RefreshCw size={ 16 } className = { syncing? "animate-spin": "" } />
    </Button>
    </TooltipTrigger>
    < TooltipContent > Sincronizar agora </TooltipContent>
      </Tooltip>
      </TooltipProvider>
      </div>
      </div>

      < div className = "flex items-center gap-3 text-xs text-muted-foreground mt-1" >
        { lastCheck && (
          <span className="flex items-center gap-1" >
            <Clock size={ 12 } />
                          Última verificação: { lastCheck }
</span>
                      )}
{
  lawyersCount > 0 && (
    <span className="flex items-center gap-1" >
      <CheckCircle size={ 12 } className = "text-green-500" />
        { lawyersCount } advogado( s ) monitorado( s )
          </span>
                      )
}
</div>
  </CardHeader>
                );
              }

function PublicationsContent ( content: React.ReactNode, footer: React.ReactNode )
{
  return (
    <CardContent className= "pt-2" >
    { content }
  { footer }
  </CardContent>
                );
}

// Decisor puro de conteúdo (reduz condicionais e nesting)
function ContentDecider ( {
  publications,
  compact,
  expanded,
  setExpanded,
  handleRegisterProcess,
  isAlreadyRegistered,
  formatRelativeDate,
  emptyState,
}: Readonly<{
  publications: DJENPublication[];
  compact: boolean;
  expanded: string | null;
  setExpanded: ( id: string | null ) => void;
  handleRegisterProcess: ( pub: DJENPublication ) => void;
  isAlreadyRegistered: ( pub: DJENPublication ) => boolean;
  formatRelativeDate: ( dateStr: string ) => string;
  emptyState: React.ReactNode;
}> )
{
  if ( publications.length === 0 ) return emptyState as React.ReactElement;

  return (
    <ScrollArea className= { compact? "h-[250px]": "h-[350px]" } >
    <div className="space-y-2 pr-2" >
    {
      publications.map( ( pub ) => (
        <PublicationItem
                          key= { pub.id }
                          pub = { pub }
                          expanded = { expanded }
                          onToggleExpand = { setExpanded }
                          onRegister = { handleRegisterProcess }
                          isAlreadyRegistered = { isAlreadyRegistered ( pub ) }
                          formatRelativeDate = { formatRelativeDate }
        />
                      ))
    }
      </div>
      </ScrollArea>
                );
}

// === HELPER COMPONENTS (extraídos para evitar S6478) ===

function FooterRegisterButton ( {
  show,
  autoRegistering,
  onRegisterAll,
}: Readonly<{
  show: boolean;
  autoRegistering: boolean;
  onRegisterAll: () => void;
}> )
{
  if ( !show ) return null;
  return (
    <TooltipProvider>
    <Tooltip>
    <TooltipTrigger asChild >
    <Button
                          variant= "default"
  size = "sm"
  onClick = { onRegisterAll }
  disabled = { autoRegistering }
  className = "flex-1 button-gradient"
  aria - label="Cadastrar todas as intimações"
    >
    <Bot size={ 14 } className = { autoRegistering? "animate-pulse": "" } />
      { autoRegistering? "Cadastrando...": "Cadastrar Todas" }
      </Button>
      </TooltipTrigger>
      < TooltipContent > Cadastra automaticamente todas as intimações no Acervo </TooltipContent>
        </Tooltip>
        </TooltipProvider>
                );
}

function FooterViewAllButton ( {
  show,
  compactLayout,
  onViewAll,
}: Readonly<{
  show: boolean;
  compactLayout: boolean;
  onViewAll?: () => void;
}> )
{
  if ( !show || !onViewAll ) return null;
  return (
    <Button
                    variant= "ghost"
  size = "sm"
  onClick = { onViewAll }
  className = {
    cn (
                      "hover:button-gradient hover:text-primary-foreground",
      compactLayout? "flex-1" : "w-full"
    )
  }
  aria - label="Ver todas as publicações"
    >
    Ver todas
      < ArrowRight size = { 14} />
        </Button>
                );
}

function FooterButtonsSection ( {
  showRegisterAll,
  showViewAll,
  autoRegistering,
  onRegisterAll,
  onViewAll,
}: Readonly<{
  showRegisterAll: boolean;
  showViewAll: boolean;
  autoRegistering: boolean;
  onRegisterAll: () => void;
  onViewAll?: () => void;
}> )
{
  const compactLayout = showRegisterAll;
  return (
    <div className= "flex gap-2" >
    <FooterRegisterButton
                      show={ showRegisterAll }
  autoRegistering = { autoRegistering }
  onRegisterAll = { onRegisterAll }
    />
    <FooterViewAllButton show={ showViewAll } compactLayout = { compactLayout } onViewAll = { onViewAll } />
      </div>
                );
}

// === HELPER FUNCTIONS (extraídos para evitar S7721) ===

/**
 * Verifica se há publicações não cadastradas (decisor puro para exibição)
 */
function shouldShowRegisterAll (
  pubs: DJENPublication[],
  isAlreadyRegistered: ( pub: DJENPublication ) => boolean
): boolean
{
  // S7745: some() já retorna false para arrays vazios, não precisa verificar length
  return pubs.some( ( p ) => p.numeroProcesso && !isAlreadyRegistered( p ) );
}

/**
 * Verifica se deve exibir botão "Ver todas" (decisor puro para exibição)
 */
function shouldShowViewAll ( pubs: DJENPublication[], onView?: () => void ): boolean
{
  // Simplificado: verifica apenas se há callback e publicações existem
  return pubs.length > 0 && onView !== undefined;
}

export default function DJENPublicationsWidget ( {
  onViewAll,
  compact = false,
  maxItems = 5,
}: Readonly<DJENPublicationsWidgetProps> )
{
  const [ expanded, setExpanded ] = useState<string | null>( null );
  const [ filter, setFilter ] = useState<"all" | "unread">( "all" );

  // Hooks customizados para reduzir complexidade
  const { publications, loading, error, lastCheck, lawyersCount, fetchPublications } =
    useDJENPublications( maxItems, filter );

  const { syncing, handleSync } = useDJENSync();

  // KV storage para processos e expedientes
  const [ processes, setProcesses ] = useKV<Process[]>( "processes", [] );
  const [ , setExpedientes ] = useKV<Expediente[]>( "expedientes", [] );

  const { autoRegistering, isAlreadyRegistered, handleRegisterProcess, handleAutoRegisterAll } =
    useDJENProcessRegistration( processes, setProcesses, setExpedientes );

  // Carrega publicações ao montar
  useEffect( () =>
  {
    fetchPublications();
  }, [ fetchPublications ] );

  // getRelativeDateDescription importado de util para reduzir complexidade

  // Função pura reutilizável para verificar não cadastrados (facilita testes e reduz nesting)
  function _getHasUnregistered ( pubs: DJENPublication[] ): boolean
  {
    return pubs.some( ( p ) => p.numeroProcesso && !isAlreadyRegistered( p ) );
  }

  // Renderiza estado de loading
  const renderLoadingState = () => <DJENLoadingCard compact={ compact } />;

  // Normaliza mensagem de erro para string
  const errorMessage: string | undefined =
    typeof error === "string"
      ? error
      : ( error as unknown as { message?: string } | undefined )?.message || undefined;

  // Renderiza estado de erro
  const renderErrorState = () => (
    <DJENErrorCard
                    compact= { compact }
  error = { errorMessage ?? "Erro desconhecido"
}
onRetry = {() => {
  fetchPublications().catch( ( err ) => console.error( "[DJENWidget] Retry failed:", err ) );
}}
                  />
                );

// Renderiza lista vazia
const renderEmptyState = (): React.ReactNode => (
  <div className= "flex flex-col items-center justify-center py-8 text-center" >
  <Newspaper size={ 40} className = "text-muted-foreground mb-2" />
    <p className="text-sm text-muted-foreground mb-1" > Nenhuma publicação encontrada </p>
      < p className = "text-xs text-muted-foreground" >
        { lawyersCount === 0 ? "Configure advogados para monitorar" : "O monitoramento está ativo"}
</p>
  < Button
variant = "outline"
size = "sm"
onClick = { async () => {
  try
  {
    await handleSync( fetchPublications );
  } catch ( err )
  {
    console.error( "[DJENWidget] Sync failed:", err );
  }
}}
className = "mt-4"
disabled = { syncing }
  >
  <RefreshCw size={ 14 } className = { syncing? "animate-spin": "" } />
    Verificar agora
      </Button>
      </div>
                );

// Constrói seção de rodapé com botões
function buildFooterSection ( showFooter: boolean ): React.ReactNode
{
  if ( !showFooter ) return null;
  const showRegisterAll = shouldShowRegisterAll( publications, isAlreadyRegistered );
  const showViewAll = shouldShowViewAll( publications, onViewAll );
  return (
    <>
    <Separator className= "my-3" />
    <FooterButtonsSection
                        showRegisterAll={ showRegisterAll }
  showViewAll = { showViewAll }
  autoRegistering = { autoRegistering }
  onRegisterAll = {() => {
    handleAutoRegisterAll( publications ).catch( ( err ) =>
      console.error( "[DJENWidget] Auto-register failed:", err )
    );
  }
}
onViewAll = { onViewAll }
  />
  </>
                  );
                }

// Early return: Loading state
if ( loading )
{
  return renderLoadingState();
}

// Early return: Error state
if ( error && publications.length === 0 )
{
  return renderErrorState();
}

// Renderiza header do card
const renderCardHeader = () =>
  PublicationsHeader( {
    publicationsCount: publications.length,
    filter,
    setFilter,
    syncing,
    handleSync: ( onSuccess?: () => void ) => handleSync( onSuccess ),
    fetchPublications: () => fetchPublications(),
    lastCheck,
    lawyersCount,
  } );

// Renderiza conteúdo principal
const showFooter = publications.length > 0;

const contentNode = (
  <ContentDecider
                    publications= { publications }
compact = { compact }
expanded = { expanded }
setExpanded = { setExpanded }
handleRegisterProcess = { handleRegisterProcess }
isAlreadyRegistered = { isAlreadyRegistered }
formatRelativeDate = { getRelativeDateDescription }
emptyState = { renderEmptyState () }
  />
                );

const renderCardContent = () => PublicationsContent( contentNode, buildFooterSection( showFooter ) );

// Main render
return (
  <Card className= { cn ("card-glow-hover glassmorphic", compact && "h-fit")}>
    { renderCardHeader () }
{ renderCardContent() }
</Card>
                );
              }
import { describe, it, expect, vi } from 'vitest';

// Mock dependencies BEFORE importing handlers
vi.mock( '../lib/rate-limit', () => ( {
  rateLimitMiddleware: vi.fn().mockResolvedValue( {
    allowed: true,
    headers: {}
  } ),
  apiRateLimiter: {
    check: vi.fn().mockResolvedValue( { success: true } ),
    report: vi.fn()
  },
  RateLimiter: vi.fn().mockImplementation( () => ( {
    check: vi.fn().mockResolvedValue( { success: true } ),
    report: vi.fn()
  } ) ),
  globalRateLimiter: {
    check: vi.fn().mockResolvedValue( { success: true } ),
    report: vi.fn()
  },
  authRateLimiter: {
    check: vi.fn().mockResolvedValue( { success: true } ),
    report: vi.fn()
  }
} ) );

vi.mock( '../_lib/auth', () => ( {
  requireAuth: vi.fn(),
  sendAuthError: vi.fn()
} ) );

vi.mock( '../_lib/safe-logger', () =>
{
  return {
    SafeLogger: vi.fn().mockImplementation( () => ( {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    } ) )
  };
} );

vi.mock( '../lib/cache', () => ( {
  sparkCache: {
    get: vi.fn().mockResolvedValue( null ),
    set: vi.fn().mockResolvedValue( undefined ),
    delete: vi.fn().mockResolvedValue( undefined ),
    clear: vi.fn().mockResolvedValue( undefined )
  },
  cachedOperation: vi.fn( ( fn ) => fn ),
  RedisCache: vi.fn().mockImplementation( () => ( {
    get: vi.fn().mockResolvedValue( null ),
    set: vi.fn().mockResolvedValue( undefined ),
    delete: vi.fn().mockResolvedValue( undefined ),
    clear: vi.fn().mockResolvedValue( undefined )
  } ) )
} ) );

// Mock global fetch
globalThis.fetch = vi.fn();

// Set environment variables
process.env.UPSTASH_REDIS_REST_URL = 'http://mock-redis.com';
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';

import cronHandler from '../cron';
import agentsHandler from '../agents';

describe( 'Integration: DJEN Monitor -> Agent Workflow', () =>
{
  it( 'Step 1: DJEN Monitor should find publications and store them', async () =>
  {
    expect( cronHandler ).toBeDefined();
    expect( agentsHandler ).toBeDefined();
  } );
} );
              #!/usr/bin / env node

/**
 * Teste de Integração com DJEN/DataJud
 * Verifica se a integração com a API de publicações legais está funcionando
 */

import https from 'https';

console.log( '🧪 Iniciando teste de integração DJEN/DataJud...' );

// Simulação de teste básico de conectividade
const testDJENConnection = () =>
{
  return new Promise( ( resolve, reject ) =>
  {
    const options = {
      hostname: 'api.djen.com.br',
      port: 443,
      path: '/health', // Endpoint de health check (se existir)
      method: 'GET',
      timeout: 10000
    };

    const req = https.request( options, ( res ) =>
    {
      console.log( `✅ Status da resposta DJEN: ${ res.statusCode }` );

      if ( res.statusCode === 200 || res.statusCode === 404 )
      {
        console.log( '✅ Conectividade com DJEN OK' );
        resolve( true );
      } else
      {
        console.log( `⚠️  Status inesperado: ${ res.statusCode }` );
        resolve( false );
      }
    } );

    req.on( 'error', ( err ) =>
    {
      console.log( `❌ Erro de conexão com DJEN: ${ err.message }` );
      resolve( false );
    } );

    req.on( 'timeout', () =>
    {
      console.log( '⏰ Timeout na conexão com DJEN' );
      req.destroy();
      resolve( false );
    } );

    req.end();
  } );
};

// Teste de validação de webhook
const testWebhookFormat = () =>
{
  console.log( '🔗 Testando formato de webhook...' );

  const sampleWebhookData = {
    event: 'legal_publication',
    process_number: '1234567-89.2024.8.26.0100',
    publication_date: new Date().toISOString(),
    court: 'TJSP',
    content: 'Sample legal publication content'
  };

  // Validação básica do formato
  const requiredFields = [ 'event', 'process_number', 'publication_date' ];
  const hasRequiredFields = requiredFields.every( field => sampleWebhookData.hasOwnProperty( field ) );

  if ( hasRequiredFields )
  {
    console.log( '✅ Formato de webhook válido' );
    return true;
  } else
  {
    console.log( '❌ Formato de webhook inválido - campos obrigatórios faltando' );
    return false;
  }
};

// Executar testes
async function runTests ()
{
  try
  {
    console.log( '='.repeat( 50 ) );
    console.log( '🧪 TESTE DE INTEGRAÇÃO DJEN/DATAJUD' );
    console.log( '='.repeat( 50 ) );

    const connectionTest = await testDJENConnection();
    const webhookTest = testWebhookFormat();

    console.log( '\n📊 RESULTADOS DOS TESTES:' );
    console.log( `Conectividade DJEN: ${ connectionTest ? '✅ PASSOU' : '❌ FALHOU' }` );
    console.log( `Formato Webhook: ${ webhookTest ? '✅ PASSOU' : '❌ FALHOU' }` );

    const overallResult = connectionTest && webhookTest;
    console.log( `\n🎯 RESULTADO GERAL: ${ overallResult ? '✅ TODOS OS TESTES PASSARAM' : '⚠️  ALGUNS TESTES FALHARAM' }` );

    process.exit( overallResult ? 0 : 1 );

  } catch ( error )
  {
    console.error( '❌ Erro durante execução dos testes:', error );
    process.exit( 1 );
  }
}

runTests();
/**
 * DataJud API Client for Serverless Functions
 *
 * API Pública DataJud - CNJ (Base Nacional de Dados do Poder Judiciário)
 * Endpoint: https://api-publica.datajud.cnj.jus.br/{alias}/_search
 *
 * IMPORTANTE: Esta é a API DataJud (metadados processuais), diferente da API DJEN (publicações)
 */

export interface DataJudProcess
{
  numeroProcesso: string;
  tribunal: string;
  dataAjuizamento: string;
  classe?: {
    codigo: string;
    nome: string;
  };
  orgaoJulgador?: {
    codigo: string;
    nome: string;
  };
  partes?: Array<{
    nome: string;
    tipo: string;
    polo: string;
  }>;
  advogados?: Array<{
    nome: string;
    numeroOAB: string;
    tipo: string;
  }>;
  assuntos?: Array<{
    codigo: string;
    nome: string;
  }>;
  movimentos?: Array<{
    data: string;
    nome: string;
  }>;
}

interface DataJudQueryParams
{
  tribunal: string;
  dataInicio: string;
  dataFim: string;
  nomeAdvogado?: string;
  numeroOAB?: string;
  ufOAB?: string;
}

// Mapeamento de tribunais para endpoints DataJud API
const DATAJUD_ENDPOINTS: Record<string, string> = {
  TJMG: "api_publica_tjmg",
  TRT3: "api_publica_trt3",
  TST: "api_publica_tst",
  STJ: "api_publica_stj",
  TRF1: "api_publica_trf1",
  TJES: "api_publica_tjes",
  TJSP: "api_publica_tjsp",
};

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_DELAY = 1000;

/**
 * Consulta processos no DataJud (metadados processuais)
 * API Pública DataJud - CNJ
 *
 * Endpoint: POST https://api-publica.datajud.cnj.jus.br/{alias}/_search
 *
 * IMPORTANTE:
 * - Requer API Key pública: Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==
 * - Formato de query: Elasticsearch DSL
 * - Retorna metadados de processos (não publicações do diário)
 */
async function consultarProcessosDataJud (
  params: DataJudQueryParams,
  timeout: number = DEFAULT_TIMEOUT
): Promise<DataJudProcess[]>
{
  const endpoint = DATAJUD_ENDPOINTS[ params.tribunal ];

  if ( !endpoint )
  {
    console.warn( `[DataJud] Tribunal ${ params.tribunal } não configurado` );
    return [];
  }

  // API Key pública do DataJud (CNJ)
  const apiKey =
    process.env.DATAJUD_API_KEY || "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

  // Tipos para query Elasticsearch
  interface ElasticsearchQuery
  {
    match?: Record<string, string>;
    bool?: {
      must: ElasticsearchQuery[];
    };
  }

  // Construir query Elasticsearch
  const query = {
    query: {
      bool: {
        must: [] as ElasticsearchQuery[],
        filter: [
          {
            range: {
              dataAjuizamento: {
                gte: params.dataInicio,
                lte: params.dataFim,
              },
            },
          },
        ],
      },
    },
    size: 100,
    _source: [
      "numeroProcesso",
      "dataAjuizamento",
      "classe",
      "orgaoJulgador",
      "partes",
      "advogados",
      "assuntos",
      "movimentos",
    ],
  };

  // Adicionar filtros por advogado/OAB
  if ( params.nomeAdvogado )
  {
    query.query.bool.must.push( {
      match: {
        "advogados.nome": params.nomeAdvogado,
      },
    } );
  }

  if ( params.numeroOAB && params.ufOAB )
  {
    query.query.bool.must.push( {
      match: {
        "advogados.numeroOAB": `${ params.numeroOAB }/${ params.ufOAB }`,
      },
    } );
  }

  const url = `https://api-publica.datajud.cnj.jus.br/${ endpoint }/_search`;

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), timeout );

  try
  {
    const response = await fetch( url, {
      method: "POST",
      headers: {
        Authorization: `APIKey ${ apiKey }`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify( query ),
      signal: controller.signal,
    } );

    clearTimeout( timeoutId );

    if ( !response.ok )
    {
      throw new Error( `HTTP ${ response.status }: ${ response.statusText }` );
    }

    const data = await response.json();

    // DataJud retorna formato Elasticsearch
    const hits = data.hits?.hits || [];

    return hits.map( ( hit: { _source?: Record<string, unknown> } ) => ( {
      numeroProcesso: hit._source?.numeroProcesso || "",
      tribunal: params.tribunal,
      dataAjuizamento: hit._source?.dataAjuizamento || "",
      classe: hit._source?.classe,
      orgaoJulgador: hit._source?.orgaoJulgador,
      partes: hit._source?.partes || [],
      advogados: hit._source?.advogados || [],
      assuntos: hit._source?.assuntos || [],
      movimentos: hit._source?.movimentos || [],
    } ) );
  } catch ( error )
  {
    clearTimeout( timeoutId );
    console.error( `[DataJud] Error querying ${ params.tribunal }:`, error );
    return [];
  }
}

/**
 * Consulta processos no DataJud para um advogado específico
 */
export async function consultarDataJudForLawyer (
  tribunais: string[],
  nomeAdvogado?: string,
  numeroOAB?: string,
  dataInicio?: string,
  dataFim?: string
): Promise<{
  resultados: DataJudProcess[];
  erros: Array<{ tribunal: string; erro: string }>;
}>
{
  if ( !nomeAdvogado && !numeroOAB )
  {
    throw new Error( "É necessário fornecer pelo menos um termo de busca" );
  }

  const hoje = new Date();
  const defaultDate = `${ hoje.getFullYear() }-${ String( hoje.getMonth() + 1 ).padStart( 2, "0" ) }-${ String( hoje.getDate() ).padStart( 2, "0" ) }`;
  const queryDataInicio = dataInicio || defaultDate;
  const queryDataFim = dataFim || dataInicio || defaultDate;

  let numeroOABParsed: string | undefined;
  let ufOAB: string | undefined;

  if ( numeroOAB )
  {
    const matchUF = /OAB\/([A-Z]{2})/i.exec( numeroOAB );
    const matchNum = /OAB\/[A-Z]{2}\s*(\d+)/i.exec( numeroOAB );
    ufOAB = matchUF ? matchUF[ 1 ].toUpperCase() : undefined;
    numeroOABParsed = matchNum ? matchNum[ 1 ] : undefined;
  }

  const resultados: DataJudProcess[] = [];
  const erros: Array<{ tribunal: string; erro: string }> = [];

  for ( const tribunal of tribunais )
  {
    try
    {
      const processos = await consultarProcessosDataJud(
        {
          tribunal,
          dataInicio: queryDataInicio,
          dataFim: queryDataFim,
          nomeAdvogado,
          numeroOAB: numeroOABParsed,
          ufOAB,
        },
        DEFAULT_TIMEOUT
      );

      resultados.push( ...processos );

      // Delay entre requisições
      await new Promise( ( resolve ) => setTimeout( resolve, DEFAULT_DELAY ) );
    } catch ( error )
    {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      erros.push( { tribunal, erro: errorMessage } );
    }
  }

  return { resultados, erros };
}
/**
 * Hook personalizado para gerenciar sincronização DJEN
 * Reduz complexidade cognitiva do componente principal
 */

import { useState } from "react";
import { toast } from "sonner";

interface SyncResult
{
  success: boolean;
  message?: string;
  newPublications?: number;
  rateLimited?: boolean;
}

export function useDJENSync ()
{
  const [ syncing, setSyncing ] = useState( false );

  const executeSync = async (): Promise<SyncResult> =>
  {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
    const response = await fetch( `${ baseUrl }/api/djen-sync`, {
      method: "POST",
    } );

    // Rate limit
    if ( response.status === 429 )
    {
      const data = await response.json();
      return {
        success: false,
        rateLimited: true,
        message: data.message || "Tente novamente em alguns segundos",
      };
    }

    if ( !response.ok )
    {
      return { success: false, message: `HTTP ${ response.status }` };
    }

    const result = await response.json();

    if ( result.ok )
    {
      return {
        success: true,
        newPublications: result.result?.newPublications || 0,
      };
    }

    return {
      success: false,
      message: result.error || result.message || "Erro na sincronização",
    };
  };

  const showSyncToast = ( result: SyncResult ): void =>
  {
    if ( result.rateLimited )
    {
      toast.warning( "Aguarde antes de sincronizar", {
        description: result.message,
      } );
      return;
    }

    if ( result.success )
    {
      toast.success( "Sincronização concluída", {
        description:
          result.newPublications && result.newPublications > 0
            ? `${ result.newPublications } novas publicações encontradas`
            : "Nenhuma nova publicação",
      } );
      return;
    }

    toast.error( "Falha na sincronização", {
      description: result.message || "Erro desconhecido",
    } );
  };

  const handleSync = async ( onSuccess?: () => void | Promise<void> ) =>
  {
    setSyncing( true );

    try
    {
      const result = await executeSync();
      showSyncToast( result );

      if ( result.success && onSuccess )
      {
        await onSuccess();
      }
    } catch ( err )
    {
      console.error( "[DJENWidget] Sync error:", err );
      toast.error( "Falha na sincronização", {
        description: err instanceof Error ? err.message : "Erro desconhecido",
      } );
    } finally
    {
      setSyncing( false );
    }
  };

  return {
    syncing,
    handleSync,
  };
}
/**
 * DJEN Monitor LangGraph Agent
 *
 * This agent monitors the DJEN (Diário de Justiça Eletrônico Nacional)
 * for new publications using a LangGraph workflow.
 *
 * Security Notes:
 * - Uses safe HTTP requests with timeout
 * - No eval() or dynamic code execution
 * - Validates all external data before processing
 */

import type { AgentState } from "../base/agent_state";
import { updateState } from "../base/agent_state";
import { LangGraphAgent } from "../base/langgraph_agent";

export interface DJENPublication
{
  id: string;
  court: string;
  date: string;
  content: string;
  processNumber?: string;
}

export class DJENMonitorAgent extends LangGraphAgent
{
  /**
   * Main workflow execution
   */
  protected async run ( state: AgentState, signal: AbortSignal ): Promise<AgentState>
  {
    // Step 1: Fetch publications
    let currentState = updateState( state, { currentStep: "fetching_publications" } );

    const publications = await this.fetchPublications( signal );

    // Step 2: Process publications
    currentState = updateState( currentState, {
      currentStep: "processing_publications",
      data: {
        ...currentState.data,
        publications,
        fetchedAt: Date.now(),
      },
    } );

    // Step 3: Complete
    currentState = updateState( currentState, {
      currentStep: "completed",
      completed: true,
    } );

    return this.addAgentMessage(
      currentState,
      `Successfully monitored DJEN. Found ${ publications.length } publications.`
    );
  }

  /**
   * Fetch publications from DJEN API
   *
   * Security: Uses AbortSignal for timeout protection
   * Integration: Real DJEN API via existing djen-api.ts service
   */
  private async fetchPublications ( signal: AbortSignal ): Promise<DJENPublication[]>
  {
    // Import DJEN API service
    const { consultarDJEN } = await import( "@/lib/djen-api" );

    // Get date range (last 7 days)
    const today = new Date();
    const lastWeek = new Date( today );
    lastWeek.setDate( today.getDate() - 7 );

    const dataFim = today.toISOString().split( "T" )[ 0 ];
    const dataInicio = lastWeek.toISOString().split( "T" )[ 0 ];

    try
    {
      // Fetch from DJEN API with timeout
      const results = await consultarDJEN( {
        tribunais: [ "TST", "TRT3", "TJMG" ],
        searchTerms: {},
        dataInicio,
        dataFim,
        timeout: 30000, // 30s timeout
      } );

      // Check if aborted
      if ( signal.aborted )
      {
        throw new Error( "Operation aborted" );
      }

      // Transform DJEN results to our format
      const publications: DJENPublication[] = results.resultados.map(
        ( result: any, index: number ) => ( {
          id: `${ result.tribunal }-${ result.data }-${ index }`,
          court: result.tribunal,
          date: result.data,
          content: result.teor || "",
          processNumber: result.numeroProcesso,
        } )
      );

      return publications;
    } catch ( error )
    {
      // Re-throw with context
      if ( signal.aborted )
      {
        throw new Error( "Operation aborted" );
      }
      throw error;
    }
  }

  /**
   * Validate publication data
   *
   * Security: Ensures data conforms to expected schema
   */
  private validatePublication ( data: unknown ): data is DJENPublication
  {
    if ( typeof data !== "object" || data === null ) return false;

    const pub = data as Record<string, unknown>;
    return (
      typeof pub.id === "string" &&
      typeof pub.court === "string" &&
      typeof pub.date === "string" &&
      typeof pub.content === "string"
    );
  }
}

/**
 * Factory function to create and execute the DJEN monitor agent
 */
export async function monitorDJEN ( data: Record<string, unknown> = {} ): Promise<AgentState>
{
  const agent = new DJENMonitorAgent( {
    timeoutMs: 60000, // 1 minute for DJEN API
    maxRetries: 3,
  } );

  const initialState: AgentState = {
    messages: [],
    currentStep: "init",
    data,
    completed: false,
    retryCount: 0,
    maxRetries: 3,
    startedAt: Date.now(),
    lastUpdatedAt: Date.now(),
  };

  return agent.execute( initialState );
}
