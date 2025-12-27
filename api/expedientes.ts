import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Redis configuration
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export default async function handler ( req: VercelRequest, res: VercelResponse )
{
  // Enable CORS
  res.setHeader( 'Access-Control-Allow-Credentials', 'true' );
  res.setHeader( 'Access-Control-Allow-Origin', '*' );
  res.setHeader( 'Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT' );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if ( req.method === 'OPTIONS' )
  {
    res.status( 200 ).end();
    return;
  }

  if ( !redisUrl || !redisToken )
  {
    console.error( "Redis credentials missing" );
    return res.status( 500 ).json( {
      success: false,
      message: "Redis configuration missing",
      expedientes: [],
      count: 0,
      lastCheck: null,
      lawyersConfigured: 0
    } );
  }

  const redis = new Redis( { url: redisUrl, token: redisToken } );

  try
  {
    const limit = Number( req.query.limit ) || 20;

    // Fetch publication IDs from index SET (O(1) instead of O(N) with KEYS)
    const publicationIds = await redis.smembers( "djen:pub:index" ) as string[];

    // Fallback: se índice estiver vazio, tente popular executando migrate-redis-index
    if ( !publicationIds || publicationIds.length === 0 )
    {
      console.warn( "[EXPEDIENTES] Índice Redis vazio. Execute 'npm run redis:migrate-index' para popular." );
    }

    const keys = Array.isArray( publicationIds ) ? publicationIds.map( id => `djen:pub:${ id }` ) : [];

    let expedientes: Record<string, unknown>[] = [];

    if ( keys.length > 0 )
    {
      // Fetch values in chunks to avoid stack overflow with large arrays
      // Upstash REST API limits mget size, chunk to max 1000 keys per request
      const CHUNK_SIZE = 500;
      const values: unknown[] = [];

      for ( let i = 0; i < keys.length; i += CHUNK_SIZE )
      {
        const chunk = keys.slice( i, i + CHUNK_SIZE );
        const chunkValues = await redis.mget( ...chunk );
        values.push( ...chunkValues );
      }

      expedientes = values
        .filter( v => v !== null )
        .map( ( v: unknown ) => ( typeof v === 'string' ? JSON.parse( v ) : v ) as Record<string, unknown> );
    }

    // Sort by date descending (newest first)
    // Prefer dataDisponibilizacao, fallback to savedAt/createdAt
    expedientes.sort( ( a, b ) =>
    {
      const dateA = new Date( ( a.dataDisponibilizacao as string ) || ( a.savedAt as string ) || ( a.createdAt as string ) || 0 ).getTime();
      const dateB = new Date( ( b.dataDisponibilizacao as string ) || ( b.savedAt as string ) || ( b.createdAt as string ) || 0 ).getTime();
      return dateB - dateA;
    } );

    // Apply limit
    const pagedExpedientes = expedientes.slice( 0, limit );

    // Fetch metadata
    const lastCheck = await redis.get<string>( "djen:last-check" );
    const lawyersRaw = await redis.get<unknown>( "djen:lawyers" );

    let lawyersConfigured = 0;
    if ( lawyersRaw )
    {
      const lawyers = typeof lawyersRaw === 'string' ? JSON.parse( lawyersRaw ) : lawyersRaw;
      lawyersConfigured = Array.isArray( lawyers ) ? lawyers.length : 0;
    }

    return res.status( 200 ).json( {
      success: true,
      expedientes: pagedExpedientes,
      count: expedientes.length,
      lastCheck: lastCheck || null,
      lawyersConfigured,
      message: "Dados recuperados com sucesso"
    } );

  } catch ( error )
  {
    console.error( "Error fetching expedientes:", error );
    return res.status( 500 ).json( {
      success: false,
      message: "Erro interno ao buscar expedientes",
      error: error instanceof Error ? error.message : String( error ),
      expedientes: [],
      count: 0,
      lastCheck: null,
      lawyersConfigured: 0
    } );
  }
}
