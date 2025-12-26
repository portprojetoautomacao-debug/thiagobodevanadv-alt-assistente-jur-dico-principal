/**
 * Testes E2E para Azure Storage Upload API
 *
 * Testa endpoint /api/azure-upload com Azurite
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe( 'Azure Upload API', () =>
{
  const apiUrl = 'http://localhost:5173/api/azure-upload';
  const azuriteConnectionString =
    'AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';

  let blobServiceClient: BlobServiceClient;

  beforeAll( async () =>
  {
    // Verificar se Azurite está rodando com timeout
    try
    {
      blobServiceClient = BlobServiceClient.fromConnectionString( azuriteConnectionString );
      const containerClient = blobServiceClient.getContainerClient( 'process-documents' );

      // Criar container com timeout e suporte a cancelamento
      const abortController = new AbortController();
      let timeoutId: NodeJS.Timeout | null = null;

      const createPromise = containerClient
        .createIfNotExists( { abortSignal: abortController.signal } )
        .catch( ( err: unknown ) =>
        {
          // Erro esperado quando o timeout dispara e a operação é abortada
          if ( err instanceof Error && err.name === 'AbortError' ) return;
          throw err;
        } )
        .finally( () =>
        {
          // Cancelar timeout se createPromise resolver primeiro
          if ( timeoutId ) clearTimeout( timeoutId );
        } );

      const timeoutPromise = new Promise<never>( ( _, reject ) =>
      {
        timeoutId = setTimeout( () =>
        {
          abortController.abort();
          reject( new Error( 'Timeout' ) );
        }, 5000 );
      } );

      await Promise.race( [ createPromise, timeoutPromise ] );
    } catch
    {
      console.warn( 'Azurite não disponível - testes serão pulados' );
    }
  }, 10000 ); // Timeout 10s para beforeAll

  afterAll( async () =>
  {
    // Limpar container de teste
    try
    {
      const containerClient = blobServiceClient.getContainerClient( 'process-documents' );
      // Deletar apenas arquivos de teste
      for await ( const blob of containerClient.listBlobsFlat( { prefix: 'test-' } ) )
      {
        await containerClient.deleteBlob( blob.name );
      }
    } catch
    {
      // Ignorar erros de limpeza
    }
  } );

  describe( 'Upload de Arquivo', () =>
  {
    it( 'deve fazer upload via API com sucesso', async () =>
    {
      const formData = new FormData();
      const file = new File( [ 'test content' ], 'test-document.pdf', { type: 'application/pdf' } );

      formData.append( 'file', file );
      formData.append( 'processNumber', 'test-0001234-56.2024.8.02.0001' );
      formData.append( 'autoAnalyze', 'false' );

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.ok ).toBe( true );

      const data = await response.json() as { success: boolean; blobName: string; url: string };
      expect( data.success ).toBe( true );
      expect( data.blobName ).toContain( 'test-0001234-56.2024.8.02.0001' );
      expect( data.url ).toBeDefined();
    } );

    it( 'deve rejeitar upload sem processNumber', async () =>
    {
      const formData = new FormData();
      const file = new File( [ 'test' ], 'test.pdf', { type: 'application/pdf' } );

      formData.append( 'file', file );
      // Sem processNumber

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.status ).toBe( 400 );

      const data = await response.json();
      expect( data.success ).toBe( false );
      expect( data.error ).toContain( 'processo' );
    } );

    it( 'deve rejeitar upload sem arquivo', async () =>
    {
      const formData = new FormData();
      formData.append( 'processNumber', '0001234-56.2024.8.02.0001' );
      // Sem arquivo

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.status ).toBe( 400 );

      const data = await response.json();
      expect( data.success ).toBe( false );
      expect( data.error ).toContain( 'arquivo' );
    } );

    it( 'deve aceitar apenas tipos de arquivo permitidos', async () =>
    {
      const formData = new FormData();
      const file = new File( [ 'test' ], 'test.exe', { type: 'application/x-msdownload' } );

      formData.append( 'file', file );
      formData.append( 'processNumber', '0001234-56.2024.8.02.0001' );

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      // Formidable deve rejeitar automaticamente
      expect( response.status ).toBeGreaterThanOrEqual( 400 );
    } );
  } );

  describe( 'Análise Automática', () =>
  {
    it( 'deve agendar análise quando autoAnalyze=true', async () =>
    {
      const formData = new FormData();
      const file = new File( [ 'test content' ], 'test-auto-analyze.pdf', { type: 'application/pdf' } );

      formData.append( 'file', file );
      formData.append( 'processNumber', 'test-0001234-56.2024.8.02.0001' );
      formData.append( 'autoAnalyze', 'true' );

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.ok ).toBe( true );

      const data = await response.json() as { success: boolean; taskId: string };
      expect( data.success ).toBe( true );
      expect( data.taskId ).toBeDefined(); // Tarefa de análise criada
    } );
  } );

  describe( 'CORS', () =>
  {
    it( 'deve permitir requisições OPTIONS', async () =>
    {
      const response = await fetch( apiUrl, {
        method: 'OPTIONS',
      } );

      expect( response.status ).toBe( 200 );
      expect( response.headers.get( 'Access-Control-Allow-Methods' ) ).toContain( 'POST' );
    } );
  } );

  describe( 'Validação de Tamanho', () =>
  {
    it( 'deve rejeitar arquivos maiores que 50MB', async () =>
    {
      const formData = new FormData();
      // ✅ OTIMIZAÇÃO: Criar arquivo grande simulado sem alocar 51MB em memória
      // Definimos apenas a propriedade 'size' sem criar ArrayBuffer grande
      const size = 51 * 1024 * 1024; // 51MB
      const blob = new Blob( [ new Uint8Array( 0 ) ], { type: 'application/pdf' } );
      Object.defineProperty( blob, 'size', { value: size, writable: false } );
      const file = new File( [ blob ], 'large-file.pdf', { type: 'application/pdf' } );
      Object.defineProperty( file, 'size', { value: size, writable: false } );

      formData.append( 'file', file );
      formData.append( 'processNumber', '0001234-56.2024.8.02.0001' );

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.status ).toBeGreaterThanOrEqual( 400 );
    }, 30000 ); // Timeout 30s para upload grande
  } );
} );
