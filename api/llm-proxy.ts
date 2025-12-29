/**
 * Vercel Serverless Function - LLM Proxy
 *
 * Suporta múltiplos provedores de IA:
 * 1. OpenAI GPT (recomendado) - OPENAI_API_KEY
 * 2. Google Gemini - GEMINI_API_KEY
 * 3. GitHub Models (gratuito) - GITHUB_TOKEN
 *
 * Prioridade: OpenAI > Gemini > GitHub Models
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "./lib/auth.js";
import { rateLimitMiddleware } from "./lib/rate-limit.js";
import { retryWithBackoff } from "./lib/retry.js";
import { escapeHtml } from "./lib/sanitize.js";
import { withTimeout } from "./lib/timeout.js";

// Tipos para mensagens e dados
interface ChatMessage
{
  role: "system" | "user" | "assistant";
  content: string;
}

interface LLMRequest
{
  model?: string;
  messages?: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  [ key: string ]: unknown;
}

interface LLMResponse
{
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  _provider?: string;
  [ key: string ]: unknown;
}

// Configuração dos provedores
interface ProviderConfig
{
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  headers: ( apiKey: string ) => Record<string, string>;
  transformRequest?: ( body: LLMRequest ) => unknown;
  transformResponse?: ( data: unknown ) => LLMResponse;
}

// Mapeamento de modelos entre provedores
const MODEL_MAPPING: Record<string, Record<string, string>> = {
  openai: {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "gpt-4": "gpt-4-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
  },
  gemini: {
    "gpt-4o": "gemini-2.5-pro",
    "gpt-4o-mini": "gemini-2.5-pro",
    "gpt-4": "gemini-2.5-pro",
    "gpt-3.5-turbo": "gemini-2.5-pro",
    gemini: "gemini-2.5-pro",
    "gemini-pro": "gemini-2.5-pro",
    "gemini-1.5-pro": "gemini-2.5-pro",
    "gemini-1.5-flash": "gemini-2.5-pro",
    "gemini-2.0-flash": "gemini-2.5-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
  },
};

// Transformar request para formato Gemini
function transformToGemini ( body: LLMRequest ): unknown
{
  const messages = body.messages || [];
  const contents = messages
    .filter( ( m: ChatMessage ) => m.role !== "system" )
    .map( ( m: ChatMessage ) => ( {
      role: m.role === "assistant" ? "model" : "user",
      parts: [ { text: m.content } ],
    } ) );

  // Adicionar system instruction se existir
  const systemMessage = messages.find( ( m: ChatMessage ) => m.role === "system" );

  return {
    contents,
    systemInstruction: systemMessage ? { parts: [ { text: systemMessage.content } ] } : undefined,
    generationConfig: {
      temperature: body.temperature || 0.7,
      maxOutputTokens: body.max_tokens || 4096,
    },
  };
}

// Transformar resposta Gemini para formato OpenAI
function transformFromGemini ( data: unknown ): LLMResponse
{
  const geminiData = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    };
  };

  const candidate = geminiData.candidates?.[ 0 ];
  const text = candidate?.content?.parts?.[ 0 ]?.text || "";

  return {
    id: `gemini-${ Date.now() }`,
    object: "chat.completion",
    created: Math.floor( Date.now() / 1000 ),
    model: "gemini-2.5-pro",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: text,
        },
        finish_reason: candidate?.finishReason?.toLowerCase() || "stop",
      },
    ],
    usage: {
      prompt_tokens: geminiData.usageMetadata?.promptTokenCount || 0,
      completion_tokens: geminiData.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: geminiData.usageMetadata?.totalTokenCount || 0,
    },
  };
}

type CacheEntry = { expiresAt: number; data: unknown };
type CircuitEntry = { failures: number; openedUntil?: number };

const CACHE_TTL_MS = 5 * 1000; // 5s short-term cache

const ChatMessageSchema = z.object( {
  role: z.enum( [ "system", "user", "assistant" ] ),
  content: z.string().min( 1 ).max( 20000 ),
} );

// Mantém campos extras (passthrough) porque o frontend pode enviar flags adicionais
// e este proxy deve ser transparente.
const LLMRequestSchema = z
  .object( {
    model: z.string().optional(),
    messages: z.array( ChatMessageSchema ).optional(),
    temperature: z.number().optional(),
    max_tokens: z.number().optional(),
  } )
  .passthrough();

function parseAllowedOrigins (): string[]
{
  return ( process.env.ALLOWED_ORIGINS ?? "" )
    .split( "," )
    .map( ( x ) => x.trim() )
    .filter( Boolean );
}

function applyCors ( req: VercelRequest, res: VercelResponse ): { origin: string }
{
  const allowedOrigins = parseAllowedOrigins();
  const origin = ( req.headers && ( req.headers[ "origin" ] as string | undefined ) ) || "";

  // CORS - restrict to ALLOWED_ORIGINS list
  if ( origin && allowedOrigins.length > 0 )
  {
    if ( !allowedOrigins.includes( origin ) )
    {
      // Mantém o comportamento: responder 403 quando origin não for permitido
      res.status( 403 ).json( { error: "Origin not allowed" } );
      return { origin };
    }
    res.setHeader( "Access-Control-Allow-Origin", origin );
  } else if ( allowedOrigins.length === 0 )
  {
    res.setHeader( "Access-Control-Allow-Origin", "*" );
  }

  res.setHeader( "Access-Control-Allow-Methods", "POST, OPTIONS" );
  res.setHeader( "Access-Control-Allow-Headers", "Content-Type, Authorization" );

  return { origin };
}

function ensureMethodOrRespond ( req: VercelRequest, res: VercelResponse ): boolean
{
  if ( req.method === "OPTIONS" )
  {
    res.status( 200 ).end();
    return false;
  }

  if ( req.method !== "POST" )
  {
    res.status( 405 ).json( { error: "Method not allowed. Only POST is supported." } );
    return false;
  }

  return true;
}

function requireProxyApiKeyIfNeeded ( req: VercelRequest, res: VercelResponse ): boolean
{
  // LLM Proxy API Key opcional - permite uso público se LLM_PROXY_ALLOW_PUBLIC=true
  if ( process.env.LLM_PROXY_ALLOW_PUBLIC === "true" )
  {
    return true;
  }

  const authResult = requireApiKey( req, res, "LLM_PROXY_API_KEY" );
  return Boolean( authResult );
}

function getClientIp ( req: VercelRequest ): string
{
  return (
    ( req.headers[ "x-forwarded-for" ] as string | undefined ) ||
    ( req.headers[ "x-real-ip" ] as string | undefined ) ||
    "unknown"
  );
}

async function applyRateLimitOrRespond (
  res: VercelResponse,
  clientIP: string
): Promise<boolean>
{
  const rl = await rateLimitMiddleware( clientIP );
  Object.entries( rl.headers || {} ).forEach( ( [ k, v ] ) => res.setHeader( k, v ) );

  if ( rl.allowed )
  {
    return true;
  }

  res.setHeader(
    "Retry-After",
    Math.max( 1, Math.ceil( ( Number( rl.headers[ "X-RateLimit-Reset" ] ) - Date.now() ) / 1000 ) )
      .toString()
  );
  res.status( 429 ).json( { error: rl.error || "Rate limit exceeded" } );
  return false;
}

function buildProviders (): ProviderConfig[]
{
  return [
    // 1. OpenAI (prioridade máxima)
    {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      apiKey: process.env.OPENAI_API_KEY,
      headers: ( key ) => ( {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ key }`,
      } ),
    },
    // 2. Google Gemini
    {
      name: "Gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/models",
      apiKey:
        process.env.VITE_GEMINI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY,
      headers: () => ( {
        "Content-Type": "application/json",
      } ),
      transformRequest: transformToGemini,
      transformResponse: transformFromGemini,
    },
  ];
}

function hasAnyProviderKey ( providers: ProviderConfig[] ): boolean
{
  return providers.some( ( p ) => p.apiKey && p.apiKey.trim().length > 0 );
}

function selectProvider ( providers: ProviderConfig[] ): ProviderConfig | undefined
{
  return providers.find( ( p ) => p.apiKey && p.apiKey.trim().length > 0 );
}

function getGlobalCache (): Map<string, CacheEntry>
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - simple global cache variable for serverless lifecycle reuse
  ( globalThis as Record<string, unknown> ).__LLM_PROXY_CACHE =
    ( globalThis as Record<string, unknown> ).__LLM_PROXY_CACHE || new Map<string, CacheEntry>();

  return ( globalThis as Record<string, unknown> ).__LLM_PROXY_CACHE as Map<string, CacheEntry>;
}

function getGlobalCircuit (): Map<string, CircuitEntry>
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ( globalThis as Record<string, unknown> ).__LLM_PROXY_CIRCUIT =
    ( globalThis as Record<string, unknown> ).__LLM_PROXY_CIRCUIT ||
    new Map<string, CircuitEntry>();

  return ( globalThis as Record<string, unknown> ).__LLM_PROXY_CIRCUIT as Map<string, CircuitEntry>;
}

function tryServeFromCache (
  res: VercelResponse,
  cache: Map<string, CacheEntry>,
  cacheKey: string
): boolean
{
  const cached = cache.get( cacheKey );
  if ( cached && cached.expiresAt > Date.now() )
  {
    res.status( 200 ).json( cached.data as LLMResponse );
    return true;
  }
  return false;
}

function isCircuitOpen ( entry: CircuitEntry ): boolean
{
  return Boolean( entry.openedUntil && entry.openedUntil > Date.now() );
}

function respondNoProviderConfigured ( req: VercelRequest, res: VercelResponse ): void
{
  const isVercel = Boolean( process.env.VERCEL_ENV );
  const isDev = process.env.NODE_ENV === "development";

  console.error( "No LLM provider configured" );

  // Em desenvolvimento, retornamos um fallback no formato OpenAI para evitar
  // que o frontend quebre (e para orientar a configuração da chave).
  if ( !isVercel && isDev )
  {
    const fallbackPayload = {
      summary:
        "⚠️ IA não configurada: defina OPENAI_API_KEY ou GEMINI_API_KEY para habilitar a análise automática.",
      documentType: "Intimação",
      priority: "média",
      deadline: { days: 15, type: "úteis", endDate: "Verificar" },
      suggestedActions: [ "Configurar OPENAI_API_KEY ou GEMINI_API_KEY", "Reexecutar a análise" ],
      nextSteps: [ "Abrir configurações", "Adicionar chave de API", "Tentar novamente" ],
    };

    const content = `\n\n\`\`\`json\n${ JSON.stringify( fallbackPayload, null, 2 ) }\n\`\`\``;

    res.status( 200 ).json( {
      id: `unconfigured-${ Date.now() }`,
      object: "chat.completion",
      created: Math.floor( Date.now() / 1000 ),
      model: "unconfigured",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      _provider: "none",
      _warning: "No LLM provider configured",
    } satisfies LLMResponse );
    return;
  }

  // Em produção (Vercel), falhar explicitamente para evitar comportamento silencioso.
  res.status( 503 ).json( {
    error: "No LLM provider configured",
    message: "Configure uma das seguintes variáveis no ambiente:",
    options: [
      {
        name: "OPENAI_API_KEY",
        description: "API key da OpenAI (recomendado)",
        url: "https://platform.openai.com/api-keys",
      },
      {
        name: "GEMINI_API_KEY",
        description: "API key do Google Gemini",
        url: "https://aistudio.google.com/app/apikey",
      },
    ],
  } );
}

function parseAndValidateBodyOrRespond (
  req: VercelRequest,
  res: VercelResponse
): LLMRequest | null
{
  const raw = typeof req.body === "string" ? JSON.parse( req.body ) : req.body;
  const parsed = LLMRequestSchema.safeParse( raw );
  if ( !parsed.success )
  {
    res.status( 400 ).json( { error: "Invalid request body", details: parsed.error.format() } );
    return null;
  }
  return parsed.data as LLMRequest;
}

function sanitizeRequestMessages ( body: LLMRequest ): void
{
  if ( !body.messages ) return;
  body.messages.forEach( ( m ) =>
  {
    m.content = escapeHtml( m.content );
  } );
}

function buildProviderCall (
  provider: ProviderConfig,
  body: LLMRequest
): { targetUrl: string; requestBody: unknown; requestedModel: string }
{
  const defaultModel = provider.name === "OpenAI" ? "gpt-4o-mini" : "gemini-2.5-pro";
  const requestedModel = body.model || defaultModel;

  if ( provider.name === "Gemini" )
  {
    const geminiModel = MODEL_MAPPING.gemini[ requestedModel ] || "gemini-2.5-pro";
    console.log( `[Gemini] Modelo solicitado: ${ requestedModel } → ${ geminiModel }` );
    return {
      targetUrl: `${ provider.baseUrl }/${ geminiModel }:generateContent?key=${ provider.apiKey }`,
      requestBody: provider.transformRequest!( body ),
      requestedModel,
    };
  }

  // OpenAI
  const mapped = MODEL_MAPPING.openai[ requestedModel ] || requestedModel;
  return {
    targetUrl: provider.baseUrl,
    requestBody: { ...body, model: mapped },
    requestedModel,
  };
}

async function fetchProviderJson (
  provider: ProviderConfig,
  targetUrl: string,
  requestBody: unknown
): Promise<unknown>
{
  const response = await fetch( targetUrl, {
    method: "POST",
    headers: provider.headers( provider.apiKey! ),
    body: JSON.stringify( requestBody ),
  } );

  if ( response.ok )
  {
    return response.json();
  }

  const errorText = await response.text();
  // ✅ FIX: Log detalhado para debug de erros 429/500
  console.error( `[${ provider.name }] HTTP ${ response.status }:`, {
    url: targetUrl.replace( /key=[^&]+/, "key=***" ),
    status: response.status,
    error: errorText.substring( 0, 500 ),
  } );

  // ✅ FIX: Tratamento específico para 429 (Rate Limit)
  if ( response.status === 429 )
  {
    throw new Error( `${ provider.name } Rate Limit: ${ errorText.substring( 0, 200 ) }` );
  }

  throw new Error( `${ provider.name } API error: ${ response.status } - ${ errorText }` );
}

function recordCircuitSuccess (
  circuit: Map<string, CircuitEntry>,
  providerName: string,
  current: CircuitEntry
): void
{
  if ( current.failures && current.failures > 0 )
  {
    circuit.set( providerName, { failures: 0 } );
  }
}

function recordCircuitFailure (
  circuit: Map<string, CircuitEntry>,
  providerName: string,
  errorMessage: string
): CircuitEntry
{
  const st = circuit.get( providerName ) || { failures: 0 };
  st.failures = ( st.failures || 0 ) + 1;

  // ✅ FIX: Circuit breaker mais agressivo para Rate Limit
  const isRateLimit = errorMessage.includes( "Rate Limit" );
  const FAILURE_THRESHOLD = isRateLimit ? 2 : 5;
  const OPEN_TIME_MS = isRateLimit ? 120_000 : 60_000; // 2min para rate limit

  if ( st.failures >= FAILURE_THRESHOLD )
  {
    st.openedUntil = Date.now() + OPEN_TIME_MS;
    console.warn( `[LLM Proxy] Circuit breaker ABERTO para ${ providerName } (${ st.failures } falhas)` );
  }

  circuit.set( providerName, st );
  return st;
}

function respondProxyError (
  res: VercelResponse,
  providerName: string,
  errorMessage: string,
  circuitState: CircuitEntry
): void
{
  const isRateLimit = errorMessage.includes( "Rate Limit" );
  res.status( isRateLimit ? 429 : 500 ).json( {
    error: "Failed to process LLM request",
    message: errorMessage,
    provider: providerName,
    circuitOpen: circuitState.openedUntil ? circuitState.openedUntil > Date.now() : false,
  } );
}

export default async function handler ( req: VercelRequest, res: VercelResponse )
{
  const { origin } = applyCors( req, res );
  // Se applyCors já respondeu 403, não continua
  if ( res.headersSent ) return;

  if ( !ensureMethodOrRespond( req, res ) ) return;
  if ( !requireProxyApiKeyIfNeeded( req, res ) ) return;

  const clientIP = getClientIp( req );
  if ( !( await applyRateLimitOrRespond( res, clientIP ) ) ) return;

  const providers = buildProviders();
  if ( !hasAnyProviderKey( providers ) )
  {
    console.error( "[LLM Proxy] ERRO: Nenhuma API key configurada para provedores LLM" );
    res.status( 500 ).json( {
      error: "No LLM API keys configured",
      message: "Configure OPENAI_API_KEY, GEMINI_API_KEY ou GITHUB_TOKEN nas variáveis de ambiente",
      providers: providers.map( ( p ) => ( { name: p.name, hasKey: !!p.apiKey } ) ),
    } );
    return;
  }

  const provider = selectProvider( providers );
  if ( !provider )
  {
    respondNoProviderConfigured( req, res );
    return;
  }

  const cache = getGlobalCache();
  const circuit = getGlobalCircuit();

  const cacheKeyBase = JSON.stringify( { body: req.body, origin, clientIP } );
  const cacheKey = `${ provider.name }:${ cacheKeyBase }`;
  if ( tryServeFromCache( res, cache, cacheKey ) ) return;

  const providerCircuit = circuit.get( provider.name ) || { failures: 0 };
  if ( isCircuitOpen( providerCircuit ) )
  {
    res
      .status( 503 )
      .json( { error: "LLM provider temporarily unavailable (circuit open). Try later." } );
    return;
  }

  console.log( `Using LLM provider: ${ provider.name }` );

  try
  {
    const body = parseAndValidateBodyOrRespond( req, res );
    if ( !body ) return;

    sanitizeRequestMessages( body );

    const { targetUrl, requestBody } = buildProviderCall( provider, body );
    const fetchFn = async () => fetchProviderJson( provider, targetUrl, requestBody );

    // ✅ FIX: Reduzir retries para evitar timeout em cascata
    const data = await retryWithBackoff( () => withTimeout( 45000, fetchFn() ), 2, 1000 );

    const transformed = provider.transformResponse ? provider.transformResponse( data ) : ( data as any );
    ( transformed as any )._provider = provider.name;

    recordCircuitSuccess( circuit, provider.name, providerCircuit );
    cache.set( cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: transformed } );

    res.status( 200 ).json( transformed );
  } catch ( error )
  {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error( "[LLM Proxy] Error:", {
      provider: provider?.name,
      error: errorMessage,
      stack: error instanceof Error ? error.stack?.substring( 0, 300 ) : undefined,
    } );

    const circuit = getGlobalCircuit();
    const name = provider?.name || "unknown";
    const st = recordCircuitFailure( circuit, name, errorMessage );
    respondProxyError( res, provider.name, errorMessage, st );
  }
}
