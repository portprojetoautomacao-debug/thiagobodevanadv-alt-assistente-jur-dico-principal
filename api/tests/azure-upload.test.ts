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
    // Verificar se Azurite está rodando
    try
    {
      blobServiceClient = BlobServiceClient.fromConnectionString( azuriteConnectionString );
      const containerClient = blobServiceClient.getContainerClient( 'process-documents' );
      await containerClient.createIfNotExists();
    } catch ( error )
    {
      console.warn( 'Azurite não disponível - testes serão pulados' );
    }
  } );

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
    } catch ( error )
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

      const data = await response.json();
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

      const data = await response.json();
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
    it.skip( 'deve rejeitar arquivos maiores que 50MB', async () =>
    {
      // TESTE DESABILITADO: Cria arquivo de 51MB que trava o processo
      // Para testar limite de tamanho, use integração real com Azure
      const formData = new FormData();
      // Criar arquivo grande (simulado)
      const largeContent = new Array( 51 * 1024 * 1024 ).fill( 'a' ).join( '' );
      const file = new File( [ largeContent ], 'large-file.pdf', { type: 'application/pdf' } );

      formData.append( 'file', file );
      formData.append( 'processNumber', '0001234-56.2024.8.02.0001' );

      const response = await fetch( apiUrl, {
        method: 'POST',
        body: formData,
      } );

      expect( response.status ).toBeGreaterThanOrEqual( 400 );
    } );
  } );
} );
