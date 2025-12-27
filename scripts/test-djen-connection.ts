#!/usr/bin/env tsx

/**
 * Script de diagnóstico DJEN
 * Testa conectividade com a API DJEN do CNJ
 *
 * Uso: npx tsx scripts/test-djen-connection.ts
 */

const DJEN_API_URL = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';

// Dados do advogado Thiago Bodevan Veiga
const ADVOGADO = {
  nome: 'Thiago Bodevan Veiga',
  numeroOAB: '184404',
  ufOAB: 'MG'
};

interface DJENComunicacao
{
  id: number;
  siglaTribunal: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  numero_processo: string;
  data_disponibilizacao: string;
  texto: string;
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

async function testDJENConnection ()
{
  console.log( '🔍 DIAGNÓSTICO DJEN - Thiago Bodevan Veiga (OAB/MG 184.404)\n' );
  console.log( '━'.repeat( 70 ) );

  // Teste 1: Data atual
  console.log( '\n📅 Teste 1: Consulta últimos 30 dias' );
  const dataFim = new Date().toISOString().split( 'T' )[ 0 ];
  const dataInicio = new Date( Date.now() - 30 * 24 * 60 * 60 * 1000 ).toISOString().split( 'T' )[ 0 ];

  await testQuery( {
    numeroOab: ADVOGADO.numeroOAB,
    ufOab: ADVOGADO.ufOAB,
    dataDisponibilizacaoInicio: dataInicio,
    dataDisponibilizacaoFim: dataFim,
    itensPorPagina: 100,
    meio: 'D' // Apenas digital
  }, 'Últimos 30 dias' );

  // Teste 2: Apenas número OAB
  console.log( '\n📅 Teste 2: Consulta apenas com OAB (sem filtro de data)' );
  await testQuery( {
    numeroOab: ADVOGADO.numeroOAB,
    ufOab: ADVOGADO.ufOAB,
    itensPorPagina: 10
  }, 'Sem filtro de data' );

  // Teste 3: Com tribunal específico
  console.log( '\n📅 Teste 3: Consulta TJMG específico' );
  await testQuery( {
    numeroOab: ADVOGADO.numeroOAB,
    ufOab: ADVOGADO.ufOAB,
    siglaTribunal: 'TJMG',
    itensPorPagina: 10
  }, 'TJMG' );

  // Teste 4: Com nome do advogado
  console.log( '\n📅 Teste 4: Consulta com nome do advogado' );
  await testQuery( {
    nomeAdvogado: 'Thiago Bodevan',
    ufOab: ADVOGADO.ufOAB,
    itensPorPagina: 10
  }, 'Nome do advogado' );

  console.log( '\n' + '━'.repeat( 70 ) );
  console.log( '✅ Diagnóstico concluído\n' );
}

async function testQuery ( params: Record<string, string | number>, label: string )
{
  const queryString = Object.entries( params )
    .map( ( [ key, value ] ) => `${ key }=${ encodeURIComponent( String( value ) ) }` )
    .join( '&' );

  const url = `${ DJEN_API_URL }?${ queryString }`;

  console.log( `\n🔗 URL: ${ url }` );
  console.log( `⏱️  Timeout: 15s` );

  const controller = new AbortController();
  const timeoutId = setTimeout( () => controller.abort(), 15000 );

  try
  {
    const startTime = Date.now();

    const response = await fetch( url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PJe-DataCollector/1.0'  // Header obrigatório conforme doc CNJ
      },
      signal: controller.signal
    } );

    clearTimeout( timeoutId );
    const duration = Date.now() - startTime;

    console.log( `📊 Status: ${ response.status } ${ response.statusText }` );
    console.log( `⏱️  Tempo: ${ duration }ms` );

    // Rate limit headers
    const rateLimit = response.headers.get( 'x-ratelimit-limit' );
    const rateLimitRemaining = response.headers.get( 'x-ratelimit-remaining' );
    if ( rateLimit )
    {
      console.log( `🚦 Rate Limit: ${ rateLimitRemaining }/${ rateLimit }` );
    }

    if ( !response.ok )
    {
      const errorText = await response.text();
      console.error( `❌ Erro: ${ errorText.substring( 0, 200 ) }` );
      return;
    }

    const data = await response.json() as DJENResponse;

    console.log( `✅ Sucesso: ${ data.count || 0 } publicações encontradas` );

    if ( data.items && data.items.length > 0 )
    {
      console.log( `\n📄 Primeiras publicações:` );
      data.items.slice( 0, 3 ).forEach( ( pub, idx ) =>
      {
        console.log( `\n  ${ idx + 1 }. ${ pub.siglaTribunal } - ${ pub.tipoComunicacao }` );
        console.log( `     Processo: ${ pub.numero_processo }` );
        console.log( `     Data: ${ pub.data_disponibilizacao }` );
        console.log( `     Órgão: ${ pub.nomeOrgao }` );

        if ( pub.destinatarioadvogados && pub.destinatarioadvogados.length > 0 )
        {
          const advs = pub.destinatarioadvogados.map( d =>
            `${ d.advogado.nome } (OAB/${ d.advogado.uf_oab } ${ d.advogado.numero_oab })`
          ).join( ', ' );
          console.log( `     Advogados: ${ advs }` );
        }
      } );
    }

  } catch ( error )
  {
    clearTimeout( timeoutId );

    if ( error instanceof Error )
    {
      if ( error.name === 'AbortError' )
      {
        console.error( '❌ TIMEOUT: Requisição excedeu 15 segundos' );
      } else
      {
        console.error( `❌ Erro de rede: ${ error.message }` );
      }
    } else
    {
      console.error( '❌ Erro desconhecido:', error );
    }
  }
}

// Executar testes
testDJENConnection().catch( console.error );
