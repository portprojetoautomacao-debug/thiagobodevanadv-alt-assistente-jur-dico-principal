#!/usr/bin/env node
/**
 * Monitor de Deployments Vercel
 *
 * Monitora logs e status dos deployments em tempo real
 *
 * Uso:
 *   npm run vercel:logs [deployment-url]
 *   npm run vercel:status [deployment-url]
 *   npm run vercel:watch
 */

import { Vercel } from '@vercel/sdk';

const vercel = new Vercel( {
  bearerToken: process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN,
} );

const DEFAULT_DEPLOYMENT_URL = 'assistente-juridico-github.vercel.app';

/**
 * Obtém logs e status de um deployment específico
 */
async function getLogsAndStatus ( deploymentUrl?: string )
{
  const idOrUrl = deploymentUrl || DEFAULT_DEPLOYMENT_URL;

  try
  {
    console.log( `🔍 Buscando logs para: ${ idOrUrl }\n` );

    // Get deployment logs
    const logsResponse = await vercel.deployments.getDeploymentEvents( {
      idOrUrl,
    } );

    if ( Array.isArray( logsResponse ) )
    {
      // Get deployment ID and status
      if ( logsResponse.length > 0 && 'deploymentId' in logsResponse[ 0 ] )
      {
        const deploymentID = logsResponse[ 0 ].deploymentId;
        const deploymentStatus = await vercel.deployments.getDeployment( {
          idOrUrl: deploymentID,
        } );

        console.log( `📦 Deployment ID: ${ deploymentID }` );
        console.log( `📊 Status: ${ deploymentStatus.status }` );
        console.log( `🌍 URL: ${ deploymentStatus.url }` );
        console.log( `⏰ Criado: ${ new Date( deploymentStatus.createdAt ).toLocaleString( 'pt-BR' ) }` );
        console.log( `\n📋 Logs:\n` );
      }

      // Display logs with log type, timestamp and text
      for ( const item of logsResponse )
      {
        if ( 'text' in item && item.text )
        {
          const timestamp = new Date( item.created ).toLocaleTimeString( 'pt-BR' );
          const type = item.type?.toUpperCase() || 'LOG';
          console.log( `[${ timestamp }] ${ type }: ${ item.text }` );
        }
      }

      console.log( `\n✅ Total de ${ logsResponse.length } eventos encontrados` );
    } else
    {
      console.log( '⚠️ Nenhum log encontrado' );
    }
  } catch ( error )
  {
    console.error( '❌ Erro ao buscar logs:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

/**
 * Obtém apenas o status do deployment
 */
async function getDeploymentStatus ( deploymentUrl?: string )
{
  const idOrUrl = deploymentUrl || DEFAULT_DEPLOYMENT_URL;

  try
  {
    console.log( `🔍 Verificando status: ${ idOrUrl }\n` );

    const deployment = await vercel.deployments.getDeployment( { idOrUrl } );

    console.log( `📦 Deployment ID: ${ deployment.id }` );
    console.log( `📊 Status: ${ deployment.status }` );
    console.log( `🌍 URL: ${ deployment.url }` );
    console.log( `🏷️ Alias: ${ deployment.alias?.join( ', ' ) || 'N/A' }` );
    console.log( `⏰ Criado: ${ new Date( deployment.createdAt ).toLocaleString( 'pt-BR' ) }` );
    console.log( `🔄 Última atualização: ${ new Date( deployment.ready || deployment.createdAt ).toLocaleString( 'pt-BR' ) }` );
    console.log( `🌿 Branch: ${ deployment.meta?.githubCommitRef || 'N/A' }` );
    console.log( `💬 Commit: ${ deployment.meta?.githubCommitMessage || 'N/A' }` );

    // Status badge
    const statusEmoji = {
      'READY': '✅',
      'ERROR': '❌',
      'BUILDING': '🔨',
      'QUEUED': '⏳',
      'CANCELED': '🚫',
    }[ deployment.status ] || '❓';

    console.log( `\n${ statusEmoji } Deployment está ${ deployment.status }` );
  } catch ( error )
  {
    console.error( '❌ Erro ao verificar status:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

/**
 * Lista deployments recentes
 */
async function listRecentDeployments ()
{
  try
  {
    console.log( '📋 Listando deployments recentes...\n' );

    const response = await vercel.deployments.getDeployments( {
      limit: 10,
      projectId: process.env.VERCEL_PROJECT_ID,
    } );

    if ( 'deployments' in response && Array.isArray( response.deployments ) )
    {
      console.log( `Total: ${ response.deployments.length } deployments\n` );

      for ( const deployment of response.deployments )
      {
        const statusEmoji = {
          'READY': '✅',
          'ERROR': '❌',
          'BUILDING': '🔨',
          'QUEUED': '⏳',
          'CANCELED': '🚫',
        }[ deployment.state ] || '❓';

        console.log( `${ statusEmoji } ${ deployment.url }` );
        console.log( `   ID: ${ deployment.uid }` );
        console.log( `   Status: ${ deployment.state }` );
        console.log( `   Criado: ${ new Date( deployment.created ).toLocaleString( 'pt-BR' ) }` );
        console.log( '' );
      }
    }
  } catch ( error )
  {
    console.error( '❌ Erro ao listar deployments:' );
    console.error(
      error instanceof Error ? error.message : String( error ),
    );
    process.exit( 1 );
  }
}

// CLI Interface
const command = process.argv[ 2 ] || 'logs';
const deploymentUrl = process.argv[ 3 ];

( async () =>
{
  if ( !process.env.VERCEL_TOKEN && !process.env.VERCEL_API_TOKEN )
  {
    console.error( '❌ Erro: VERCEL_TOKEN ou VERCEL_API_TOKEN não configurado' );
    console.error( 'Configure com: export VERCEL_TOKEN=seu_token_aqui' );
    process.exit( 1 );
  }

  switch ( command )
  {
    case 'logs':
      await getLogsAndStatus( deploymentUrl );
      break;
    case 'status':
      await getDeploymentStatus( deploymentUrl );
      break;
    case 'list':
      await listRecentDeployments();
      break;
    default:
      console.log( 'Uso:' );
      console.log( '  npm run vercel:logs [url]    - Ver logs do deployment' );
      console.log( '  npm run vercel:status [url]  - Ver status do deployment' );
      console.log( '  npm run vercel:list          - Listar deployments recentes' );
      process.exit( 1 );
  }
} )();
