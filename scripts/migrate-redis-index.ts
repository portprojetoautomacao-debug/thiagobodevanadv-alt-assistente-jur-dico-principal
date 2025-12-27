#!/usr/bin/env tsx
/**
 * Script de Migração: População do índice Redis
 *
 * Popula o SET djen:pub:index com IDs de todas as publicações existentes
 * que usam o padrão djen:pub:*
 *
 * IMPORTANTE: Este script usa KEYS uma única vez para migração.
 * Após executado, não será mais necessário usar KEYS no código de produção.
 *
 * Uso:
 *   npx tsx scripts/migrate-redis-index.ts
 *   npx tsx scripts/migrate-redis-index.ts --dry-run  # Apenas visualizar
 */

import { Redis } from "@upstash/redis";

const DJEN_REDIS_KEYS = {
  PUB_PREFIX: "djen:pub:",
  PUB_INDEX: "djen:pub:index",
} as const;

async function migrate ( dryRun = false )
{
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if ( !redisUrl || !redisToken )
  {
    console.error( "❌ ERRO: Variáveis UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN não configuradas" );
    process.exit( 1 );
  }

  const redis = new Redis( { url: redisUrl, token: redisToken } );

  console.log( "🔍 Buscando publicações existentes...\n" );
  console.warn( "⚠️  Este script usa KEYS (operação cara) uma única vez para migração." );
  console.warn( "    Após executado, o sistema usará SMEMBERS (muito mais rápido).\n" );

  // Usar KEYS uma única vez para migração
  const keys = await redis.keys( `${ DJEN_REDIS_KEYS.PUB_PREFIX }*` ) as string[];

  if ( keys.length === 0 )
  {
    console.log( "✅ Nenhuma publicação encontrada. Índice já está vazio ou não há dados." );
    return;
  }

  // Extrair IDs das chaves
  const publicationIds = keys
    .map( key => key.replace( DJEN_REDIS_KEYS.PUB_PREFIX, "" ) )
    .filter( id => id !== "index" ); // Ignorar a própria chave do índice

  console.log( `📊 Encontradas ${ publicationIds.length } publicações:\n` );
  publicationIds.slice( 0, 5 ).forEach( ( id, i ) =>
  {
    console.log( `   ${ i + 1 }. ${ id }` );
  } );
  if ( publicationIds.length > 5 )
  {
    console.log( `   ... e mais ${ publicationIds.length - 5 } publicações\n` );
  }

  if ( dryRun )
  {
    console.log( "\n🔵 DRY-RUN: Nenhuma alteração será feita." );
    console.log( `\n📝 Comando que seria executado:` );
    console.log( `   SADD ${ DJEN_REDIS_KEYS.PUB_INDEX } ${ publicationIds.join( " " ) }` );
    return;
  }

  console.log( "\n⚙️  Populando índice Redis..." );

  // Verificar quantos IDs já estão no índice
  const existingIds = await redis.smembers( DJEN_REDIS_KEYS.PUB_INDEX ) as string[];
  const newIds = publicationIds.filter( id => !existingIds.includes( id ) );

  if ( newIds.length === 0 )
  {
    console.log( "✅ Índice já está atualizado! Nenhum ID novo para adicionar." );
    return;
  }

  console.log( `   • IDs existentes no índice: ${ existingIds.length }` );
  console.log( `   • IDs novos a adicionar: ${ newIds.length }` );

  // Adicionar IDs ao índice em lotes (evitar request muito grande)
  const BATCH_SIZE = 100;
  let added = 0;

  for ( let i = 0; i < newIds.length; i += BATCH_SIZE )
  {
    const batch = newIds.slice( i, i + BATCH_SIZE );
    // @ts-expect-error - Upstash Redis sadd aceita array via spread operator
    await redis.sadd( DJEN_REDIS_KEYS.PUB_INDEX, ...batch );
    added += batch.length;
    console.log( `   ✓ Adicionados ${ added }/${ newIds.length } IDs...` );
  }

  // Verificar resultado final
  const finalCount = await redis.scard( DJEN_REDIS_KEYS.PUB_INDEX );

  console.log( "\n✅ Migração concluída com sucesso!" );
  console.log( `   • Total de IDs no índice: ${ finalCount }` );
  console.log( `   • IDs adicionados nesta migração: ${ newIds.length }\n` );
  console.log( "💡 Dica: O código agora usa SMEMBERS ao invés de KEYS para listar publicações." );
  console.log( "   Isso melhora drasticamente a performance em produção!\n" );
}

// Parse argumentos
const args = process.argv.slice( 2 );
const dryRun = args.includes( "--dry-run" ) || args.includes( "-d" );

if ( args.includes( "--help" ) || args.includes( "-h" ) )
{
  console.log( `
Script de Migração: Índice Redis DJEN

Uso:
  npx tsx scripts/migrate-redis-index.ts [opções]

Opções:
  --dry-run, -d    Visualizar alterações sem executar
  --help, -h       Mostrar esta ajuda

Exemplos:
  npx tsx scripts/migrate-redis-index.ts
  npx tsx scripts/migrate-redis-index.ts --dry-run
`);
  process.exit( 0 );
}

migrate( dryRun ).catch( error =>
{
  console.error( "\n❌ Erro durante migração:", error );
  process.exit( 1 );
} );
