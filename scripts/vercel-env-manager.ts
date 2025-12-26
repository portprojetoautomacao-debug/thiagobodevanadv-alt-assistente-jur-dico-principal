#!/usr/bin/env node
/**
 * Gerenciador de Variáveis de Ambiente Vercel
 *
 * Gerencia variáveis de ambiente do projeto via SDK
 *
 * Uso:
 *   npm run vercel:env:list
 *   npm run vercel:env:add KEY VALUE [production|preview|development]
 *   npm run vercel:env:remove KEY
 */

import { Vercel } from '@vercel/sdk';

const vercel = new Vercel( {
  bearerToken: process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN,
} );

const PROJECT_NAME = 'assistente-juridico-github';
const PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'prj_QAipUzUpx9undwOmKouuxBwpCyJ8';

/**
 * Lista todas as variáveis de ambiente do projeto
 */
async function listEnvVars ()
{
  try
  {
    console.log( `📋 Variáveis de ambiente do projeto: ${ PROJECT_NAME }\n` );

    const envs = await vercel.projects.filterProjectEnvs( {
      idOrName: PROJECT_ID,
    } );

    if ( 'envs' in envs && Array.isArray( envs.envs ) )
    {
      if ( envs.envs.length === 0 )
      {
        console.log( '⚠️ Nenhuma variável de ambiente encontrada' );
        return;
      }

      console.log( `Total: ${ envs.envs.length } variáveis\n` );

      // Agrupar por ambiente
      const byTarget: Record<string, any[]> = {
        production: [],
        preview: [],
        development: [],
      };

      for ( const env of envs.envs )
      {
        const targets = env.target || [];
        for ( const target of targets )
        {
          if ( byTarget[ target ] )
          {
            byTarget[ target ].push( env );
          }
        }
      }

      // Exibir por ambiente
      for ( const [ target, vars ] of Object.entries( byTarget ) )
      {
        if ( vars.length > 0 )
        {
          const emoji = {
            production: '🟢',
            preview: '🟡',
            development: '🔵',
          }[ target ] || '⚪';

          console.log( `${ emoji } ${ target.toUpperCase() }` );
          console.log( '─'.repeat( 50 ) );

          for ( const env of vars )
          {
            const typeIcon = {
              encrypted: '🔒',
              plain: '📝',
              sensitive: '🔐',
              system: '⚙️',
            }[ env.type ] || '❓';

            console.log( `  ${ typeIcon } ${ env.key }` );
            console.log( `     Tipo: ${ env.type }` );
            console.log( `     ID: ${ env.id }` );
            if ( env.comment )
            {
              console.log( `     Comentário: ${ env.comment }` );
            }
            console.log( '' );
          }
        }
      }
    }
  } catch ( error )
  {
    console.error( '❌ Erro ao listar variáveis:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

/**
 * Adiciona ou atualiza uma variável de ambiente
 */
async function addEnvVar (
  key: string,
  value: string,
  targets: string[] = [ 'production', 'preview', 'development' ],
  type: 'encrypted' | 'plain' | 'sensitive' = 'encrypted',
)
{
  try
  {
    console.log( `➕ Adicionando variável: ${ key }` );
    console.log( `   Ambientes: ${ targets.join( ', ' ) }` );
    console.log( `   Tipo: ${ type }\n` );

    const response = await vercel.projects.createProjectEnv( {
      idOrName: PROJECT_ID,
      upsert: 'true', // Atualiza se já existe
      requestBody: {
        key,
        value,
        target: targets as any,
        type,
        comment: `Adicionado via vercel-env-manager em ${ new Date().toLocaleString( 'pt-BR' ) }`,
      },
    } );

    console.log( '✅ Variável adicionada com sucesso!' );
    console.log( `   ID: ${ response.created[ 0 ]?.id || 'N/A' }` );
  } catch ( error )
  {
    console.error( '❌ Erro ao adicionar variável:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

/**
 * Remove uma variável de ambiente (todas as instâncias)
 */
async function removeEnvVar ( key: string )
{
  try
  {
    console.log( `🗑️ Removendo variável: ${ key } (todas as instâncias)\n` );

    // Primeiro, buscar todas as instâncias da variável
    const envs = await vercel.projects.filterProjectEnvs( {
      idOrName: PROJECT_ID,
    } );

    if ( 'envs' in envs && Array.isArray( envs.envs ) )
    {
      const envVars = envs.envs.filter( ( env ) => env.key === key );

      if ( envVars.length === 0 )
      {
        console.log( '⚠️ Variável não encontrada' );
        return;
      }

      console.log( `   Encontradas ${ envVars.length } instâncias` );

      // Remover todas as instâncias
      let removed = 0;
      for ( const envVar of envVars )
      {
        await vercel.projects.removeProjectEnv( {
          idOrName: PROJECT_ID,
          id: envVar.id,
        } );
        removed++;
        console.log( `   ✓ Removida instância ${ removed }/${ envVars.length } (ID: ${ envVar.id })` );
      }

      console.log( `\n✅ ${ removed } instâncias removidas com sucesso!` );
    }
  } catch ( error )
  {
    console.error( '❌ Erro ao remover variável:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

/**
 * Sincroniza variáveis de .env.local para Vercel
 */
async function syncFromLocal ()
{
  try
  {
    const fs = await import( 'fs' );
    const path = await import( 'path' );

    const envPath = path.join( process.cwd(), '.env.local' );

    if ( !fs.existsSync( envPath ) )
    {
      console.log( '⚠️ Arquivo .env.local não encontrado' );
      return;
    }

    console.log( '🔄 Sincronizando variáveis de .env.local...\n' );

    const content = fs.readFileSync( envPath, 'utf-8' );
    const lines = content.split( '\n' );

    let added = 0;
    for ( const line of lines )
    {
      const trimmed = line.trim();

      // Ignorar comentários e linhas vazias
      if ( !trimmed || trimmed.startsWith( '#' ) ) continue;

      const [ key, ...valueParts ] = trimmed.split( '=' );
      const value = valueParts.join( '=' ).trim();

      if ( key && value )
      {
        console.log( `  ➕ ${ key }` );

        await vercel.projects.createProjectEnv( {
          idOrName: PROJECT_ID,
          upsert: 'true',
          requestBody: {
            key: key.trim(),
            value: value.replace( /^["']|["']$/g, '' ), // Remove aspas
            target: [ 'production', 'preview', 'development' ] as any,
            type: 'encrypted',
            comment: 'Sincronizado de .env.local',
          },
        } );

        added++;
      }
    }

    console.log( `\n✅ ${ added } variáveis sincronizadas!` );
  } catch ( error )
  {
    console.error( '❌ Erro ao sincronizar:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

// CLI Interface
const command = process.argv[ 2 ] || 'list';
const args = process.argv.slice( 3 );

( async () =>
{
  if ( !process.env.VERCEL_TOKEN && !process.env.VERCEL_API_TOKEN )
  {
    console.error( '❌ Erro: VERCEL_TOKEN não configurado' );
    console.error( 'Configure com: export VERCEL_TOKEN=seu_token_aqui' );
    process.exit( 1 );
  }

  switch ( command )
  {
    case 'list':
      await listEnvVars();
      break;

    case 'add':
      if ( args.length < 2 )
      {
        console.error( 'Uso: npm run vercel:env:add KEY VALUE [targets]' );
        console.error( 'Targets: production,preview,development (separados por vírgula)' );
        process.exit( 1 );
      }
      const targets = args[ 2 ] ? args[ 2 ].split( ',' ) : [ 'production', 'preview', 'development' ];
      await addEnvVar( args[ 0 ], args[ 1 ], targets );
      break;

    case 'remove':
      if ( args.length < 1 )
      {
        console.error( 'Uso: npm run vercel:env:remove KEY' );
        process.exit( 1 );
      }
      await removeEnvVar( args[ 0 ] );
      break;

    case 'sync':
      await syncFromLocal();
      break;

    default:
      console.log( 'Comandos disponíveis:' );
      console.log( '  list            - Listar variáveis de ambiente' );
      console.log( '  add KEY VALUE   - Adicionar/atualizar variável' );
      console.log( '  remove KEY      - Remover variável' );
      console.log( '  sync            - Sincronizar de .env.local' );
      process.exit( 1 );
  }
} )();
