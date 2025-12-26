/**
 * OpenTelemetry OTLP Traces Endpoint
 *
 * Recebe traces do browser e processa/armazena para análise
 * Compatível com OTLP HTTP Protocol
 *
 * Endpoint: POST /api/v1/traces
 */

import { Redis } from '@upstash/redis';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface TraceData
{
  resourceSpans?: unknown[];
  [ key: string ]: unknown;
}

interface StoredTrace
{
  id: string;
  timestamp: string;
  data: TraceData;
  size: number;
  environment: string;
  serviceName?: string;
}

// Singleton Redis
let _kvClient: Redis | null = null;

function getKv (): Redis | null
{
  if ( _kvClient ) return _kvClient;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if ( !url || !token )
  {
    console.warn( '[Traces API] Upstash Redis não configurado - traces não serão persistidos' );
    return null;
  }

  _kvClient = new Redis( { url, token } );
  return _kvClient;
}

/**
 * Extrai informações úteis do trace
 */
function extractTraceInfo ( data: TraceData ): { serviceName?: string; spanCount: number }
{
  try
  {
    const resourceSpans = data.resourceSpans || [];
    const spanCount: number = Array.isArray( resourceSpans )
      ? resourceSpans.reduce( ( acc: number, rs: any ) =>
      {
        const scopeSpans = rs?.scopeSpans || [];
        return acc + scopeSpans.reduce( ( acc2: number, ss: any ) =>
        {
          const spans = ss?.spans || [];
          return acc2 + ( Array.isArray( spans ) ? spans.length : 0 );
        }, 0 );
      }, 0 )
      : 0;

    const serviceName = Array.isArray( resourceSpans ) && resourceSpans[ 0 ]
      ? ( resourceSpans[ 0 ] as any )?.resource?.attributes?.find(
        ( attr: any ) => attr?.key === 'service.name'
      )?.value?.stringValue
      : undefined;

    return { serviceName, spanCount };
  } catch
  {
    return { spanCount: 0 };
  }
}

/**
 * Handler principal
 */
export default async function handler ( req: VercelRequest, res: VercelResponse )
{
  // CORS
  res.setHeader( 'Access-Control-Allow-Origin', '*' );
  res.setHeader( 'Access-Control-Allow-Methods', 'POST, OPTIONS' );
  res.setHeader( 'Access-Control-Allow-Headers', 'Content-Type, Authorization' );

  if ( req.method === 'OPTIONS' )
  {
    return res.status( 204 ).end();
  }

  if ( req.method !== 'POST' )
  {
    return res.status( 405 ).json( { error: 'Method not allowed' } );
  }

  try
  {
    let traceData: TraceData;
    if ( typeof req.body === 'string' )
    {
      try
      {
        traceData = JSON.parse( req.body );
      } catch ( parseError )
      {
        console.error( '[Traces API] ❌ JSON inválido no trace data:', parseError );
        return res.status( 400 ).json( {
          error: 'Invalid JSON in trace data',
          message: parseError instanceof Error ? parseError.message : String( parseError ),
        } );
      }
    } else
    {
      traceData = req.body as TraceData;
    }
    const { serviceName, spanCount } = extractTraceInfo( traceData );

    const trace: StoredTrace = {
      id: `trace-${ Date.now() }-${ crypto.randomUUID() }`,
      timestamp: new Date().toISOString(),
      data: traceData,
      size: JSON.stringify( traceData ).length,
      environment: process.env.VERCEL_ENV || 'development',
      serviceName,
    };

    // Persistir no Redis se disponível (TTL 24h)
    const kv = getKv();
    if ( kv )
    {
      await kv.setex( `trace:${ trace.id }`, 86400, JSON.stringify( trace ) );
      console.log( `[Traces API] ✅ Trace persistido: ${ trace.id } (${ spanCount } spans)` );
    } else
    {
      console.log( `[Traces API] ℹ️ Trace recebido: ${ trace.id } (${ spanCount } spans) - não persistido` );
    }

    // Retornar sucesso (OTLP protocol)
    return res.status( 200 ).json( {
      partialSuccess: {},
    } );
  } catch ( error )
  {
    console.error( '[Traces API] ❌ Erro ao processar trace:', error );
    return res.status( 500 ).json( {
      error: 'Failed to process trace',
      message: error instanceof Error ? error.message : String( error ),
    } );
  }
}
