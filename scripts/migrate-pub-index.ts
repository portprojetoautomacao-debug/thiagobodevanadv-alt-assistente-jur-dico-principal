#!/usr/bin/env tsx
/**
 * Script de migração para popular o índice djen:pub:index
 * com IDs de publicações existentes no Redis.
 *
 * Uso: npx tsx scripts/migrate-pub-index.ts
 */

import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if ( !redisUrl || !redisToken )
{
  console.error( "❌ UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN são obrigatórios" );
  process.exit( 1 );
}

const redis = new Redis( { url: redisUrl, token: redisToken } );

async function migrate ()
{
  console.log( "🔍 Buscando publicações existentes..." );

  // ÚLTIMA vez que usamos KEYS - só para migração
  const keys = await redis.keys( "djen:pub:*" );

  // Filtrar apenas keys de publicação (não o próprio índice)
  const pubKeys = keys.filter( k => k !== "djen:pub:index" );

  if ( pubKeys.length === 0 )
  {
    console.log( "✅ Nenhuma publicação encontrada. Migração não necessária." );
    return;
  }

  console.log( `📦 Encontradas ${ pubKeys.length } publicações` );

  // Extrair IDs (remover prefixo "djen:pub:")
  const pubIds = pubKeys.map( k => k.replace( "djen:pub:", "" ) );

  console.log( "💾 Populando índice djen:pub:index..." );

  // Adicionar todos os IDs ao SET (idempotente)
  if ( pubIds.length > 0 )
  {
    await redis.sadd( "djen:pub:index", ...pubIds );
  }

  // Verificar resultado
  const indexSize = await redis.scard( "djen:pub:index" );

  console.log( `✅ Migração concluída!` );
  console.log( `   - Publicações processadas: ${ pubKeys.length }` );
  console.log( `   - IDs no índice: ${ indexSize }` );
  console.log( `\n🚀 O sistema agora usará SMEMBERS (rápido) ao invés de KEYS (lento)` );
}

migrate()
  .then( () => process.exit( 0 ) )
  .catch( ( error ) =>
  {
    console.error( "❌ Erro na migração:", error );
    process.exit( 1 );
  } );
