/**
 * Testes para Azure Blob Storage Service
 *
 * Testa integração com Azurite (emulador) e funcionalidades principais
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { describe, expect, it, vi } from 'vitest';

// Mock do serviço para testes
vi.mock( '@azure/storage-blob', () => ( {
  BlobServiceClient: {
    fromConnectionString: vi.fn( () => ( {
      getContainerClient: vi.fn( () => ( {
        createIfNotExists: vi.fn( () => Promise.resolve() ),
        exists: vi.fn( () => Promise.resolve( true ) ),
        getBlockBlobClient: vi.fn( () => ( {
          uploadData: vi.fn( () => Promise.resolve( { requestId: 'test-123' } ) ),
          url: 'https://test.blob.core.windows.net/test/test.pdf',
          download: vi.fn( () => Promise.resolve( {
            readableStreamBody: {
              getReader: () => ( {
                read: () => Promise.resolve( { done: true, value: undefined } )
              } )
            },
            contentType: 'application/pdf'
          } ) ),
          delete: vi.fn( () => Promise.resolve() ),
          setMetadata: vi.fn( () => Promise.resolve() ),
          getProperties: vi.fn( () => Promise.resolve( {
            metadata: { status: 'pending' }
          } ) )
        } ) ),
        listBlobsFlat: vi.fn( () => ( {
          [ Symbol.asyncIterator ]: async function* ()
          {
            yield {
              name: 'test/123_doc.pdf',
              properties: {
                contentLength: 1024,
                contentType: 'application/pdf',
                createdOn: new Date()
              }
            };
          }
        } ) )
      } ) )
    } ) )
  }
} ) );

describe( 'Azure Storage Service', () =>
{
  const azuriteConnectionString =
    'AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';

  describe( 'Configuração', () =>
  {
    // Skip este teste pois depende de Azurite estar rodando em tempo de teste
    it.skip( 'deve usar Azurite quando USE_AZURITE=true', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      // Mock env vars
      vi.stubEnv( 'VITE_USE_AZURITE', 'true' );
      vi.stubEnv( 'MODE', 'development' );

      const service = new AzureBlobStorageService();
      const result = await service.initialize();

      expect( result ).toBe( true );
    } );

    it( 'deve detectar ambiente de produção', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      vi.stubEnv( 'VITE_USE_AZURITE', 'false' );
      vi.stubEnv( 'MODE', 'production' );
      vi.stubEnv( 'VITE_AZURE_STORAGE_CONNECTION_STRING', 'test-connection-string' );

      const service = new AzureBlobStorageService();
      const result = await service.initialize();

      expect( result ).toBe( true );
    } );
  } );

  describe( 'Upload de Arquivos', () =>
  {
    it( 'deve fazer upload de arquivo com sucesso', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const mockFile = new File( [ 'test content' ], 'test.pdf', { type: 'application/pdf' } );
      const result = await service.uploadFile( mockFile, '0001234-56.2024.8.02.0001' );

      expect( result.success ).toBe( true );
      expect( result.blobName ).toContain( '0001234-56.2024.8.02.0001' );
      expect( result.contentType ).toBe( 'application/pdf' );
    } );

    it( 'deve gerar nome único para blob', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const mockFile = new File( [ 'test' ], 'documento.pdf', { type: 'application/pdf' } );
      const result = await service.uploadFile( mockFile, '0001234-56.2024.8.02.0001' );

      // Formato real: 0001234-56.2024.8.02.0001/1234567890123_documento.pdf
      expect( result.blobName ).toMatch( /^0001234-56\.2024\.8\.02\.0001\/\d+_documento\.pdf$/ );
      expect( result.success ).toBe( true );
    } );

    it( 'deve incluir metadata no upload', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const mockFile = new File( [ 'test' ], 'test.pdf', { type: 'application/pdf' } );
      const metadata = { tipo: 'auto_completo', paginas: '1-350' };

      const result = await service.uploadFile( mockFile, '0001234-56.2024.8.02.0001', metadata );

      expect( result.success ).toBe( true );
    } );
  } );

  describe( 'Listagem de Arquivos', () =>
  {
    it( 'deve listar arquivos de um processo', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const docs = await service.listProcessFiles( '0001234-56.2024.8.02.0001' );

      expect( Array.isArray( docs ) ).toBe( true );
      expect( docs.length ).toBeGreaterThan( 0 );
      expect( docs[ 0 ] ).toHaveProperty( 'fileName' );
      expect( docs[ 0 ] ).toHaveProperty( 'processNumber' );
    } );

    it( 'deve retornar array vazio para processo sem arquivos', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      // Mock para retornar vazio ANTES de criar serviço
      const mockEmptyIterator = async function* () { };

      const mockBlockBlobClient = {
        url: 'https://test.blob.core.windows.net/empty/none.pdf',
        uploadData: vi.fn( () => Promise.resolve( { requestId: 'test' } ) ),
        download: vi.fn(),
        delete: vi.fn(),
        setMetadata: vi.fn(),
        getProperties: vi.fn( () => Promise.resolve( { metadata: {} } ) )
      };

      const mockContainerClient = {
        listBlobsFlat: vi.fn( () => ( { [ Symbol.asyncIterator ]: mockEmptyIterator } ) ),
        createIfNotExists: vi.fn( () => Promise.resolve() ),
        exists: vi.fn( () => Promise.resolve( true ) ),
        getBlockBlobClient: vi.fn( () => mockBlockBlobClient )
      };

      const mockBlobServiceClient = {
        getContainerClient: vi.fn( () => mockContainerClient )
      };

      vi.mocked( BlobServiceClient.fromConnectionString ).mockReturnValueOnce( mockBlobServiceClient as any );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const docs = await service.listProcessFiles( '9999999-99.9999.9.99.9999' );
      expect( docs ).toEqual( [] );
    } );
  } );

  describe( 'Download de Arquivos', () =>
  {
    it( 'deve fazer download de arquivo', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const blob = await service.downloadFile( 'test/123_doc.pdf' );

      // Mock retorna blob válido
      expect( blob ).not.toBeNull();
      expect( blob ).toBeInstanceOf( Blob );
    } );
  } );

  describe( 'Operações de Metadata', () =>
  {
    it( 'deve atualizar metadata de blob', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const result = await service.updateMetadata( 'test/123_doc.pdf', {
        status: 'analyzed',
        analyzedAt: new Date().toISOString()
      } );

      expect( result ).toBe( true );
    } );
  } );

  describe( 'Health Check', () =>
  {
    it( 'deve verificar se serviço está saudável', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();
      await service.initialize();

      const healthy = await service.healthCheck();

      expect( healthy ).toBe( true );
    } );
  } );

  describe( 'Tratamento de Erros', () =>
  {
    it( 'deve retornar erro se não conseguir inicializar', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      // Mock sem credenciais
      vi.stubEnv( 'VITE_AZURE_STORAGE_CONNECTION_STRING', '' );
      vi.stubEnv( 'VITE_USE_AZURITE', 'false' );

      const service = new AzureBlobStorageService();
      const result = await service.initialize();

      expect( result ).toBe( false );
    } );

    it( 'deve tratar erro no upload gracefully', async () =>
    {
      const { AzureBlobStorageService } = await import( '@/lib/azure-storage-service' );

      const service = new AzureBlobStorageService();

      // Mock erro
      vi.mocked( BlobServiceClient.fromConnectionString ).mockReturnValueOnce( {
        getContainerClient: vi.fn( () => ( {
          getBlockBlobClient: vi.fn( () => ( {
            uploadData: vi.fn( () => Promise.reject( new Error( 'Network error' ) ) )
          } ) )
        } ) )
      } as any );

      const mockFile = new File( [ 'test' ], 'test.pdf', { type: 'application/pdf' } );
      const result = await service.uploadFile( mockFile, '0001234-56.2024.8.02.0001' );

      expect( result.success ).toBe( false );
      expect( result.error ).toBeDefined();
    } );
  } );
} );
