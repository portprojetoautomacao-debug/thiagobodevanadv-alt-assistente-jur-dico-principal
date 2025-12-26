/**
 * Git Base API - Testes Unitários
 *
 * Testa integração com vscode.git-base extension
 */

import { gitBaseService, setVSCodeAPI } from '@/lib/git-base-service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RemoteSource, RemoteSourceProvider } from '../src/api/git-base';

describe( 'Git Base Service', () =>
{
  const mockAPI = {
    getRemoteSources: vi.fn(),
    pickRemoteSource: vi.fn(),
    registerRemoteSourceProvider: vi.fn()
  };

  const mockExtension = {
    isActive: true,
    exports: {
      getAPI: vi.fn( () => mockAPI )
    },
    activate: vi.fn()
  };

  const mockVSCodeAPI = {
    extensions: {
      getExtension: vi.fn( () => mockExtension )
    }
  };

  beforeEach( () =>
  {
    vi.clearAllMocks();

    // Reconfigurar o mock sempre antes de cada teste
    mockExtension.isActive = true;
    mockVSCodeAPI.extensions.getExtension = vi.fn( () => mockExtension );

    // Injetar mock da API do VS Code
    setVSCodeAPI( mockVSCodeAPI as never );
  } );

  afterEach( () =>
  {
    vi.restoreAllMocks();
    // Limpar API após cada teste
    setVSCodeAPI( null );
  } );

  describe( 'Inicialização', () =>
  {
    it( 'deve inicializar a API com sucesso', async () =>
    {
      await gitBaseService.initialize();

      expect( mockVSCodeAPI.extensions.getExtension ).toHaveBeenCalledWith( 'vscode.git-base' );
      expect( mockExtension.exports.getAPI ).toHaveBeenCalledWith( 1 );
      expect( gitBaseService.isAvailable() ).toBe( true );
    } );

    it( 'deve ativar extensão se não estiver ativa', async () =>
    {
      // Reset para forçar nova inicialização
      gitBaseService.reset();

      mockExtension.isActive = false;

      await gitBaseService.initialize();

      expect( mockExtension.activate ).toHaveBeenCalled();
    } );

    it( 'deve lidar com extensão não disponível', async () =>
    {
      // Reset para forçar nova inicialização
      gitBaseService.reset();

      mockVSCodeAPI.extensions.getExtension = vi.fn( () => undefined );

      await gitBaseService.initialize();

      expect( gitBaseService.isAvailable() ).toBe( false );
    } );

    it( 'deve lidar com VS Code API não disponível', async () =>
    {
      // Reset para forçar nova inicialização
      gitBaseService.reset();

      setVSCodeAPI( null );

      await gitBaseService.initialize();

      expect( gitBaseService.isAvailable() ).toBe( false );
    } );

    it( 'deve retornar versão da API', () =>
    {
      expect( gitBaseService.getVersion() ).toBe( 1 );
    } );
  } );

  describe( 'getRemoteSources', () =>
  {
    const mockSources: RemoteSource[] = [
      {
        name: 'assistente-juridico-principal',
        url: 'https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal.git',
        providerName: 'github',
        owner: 'portprojetoautomacao-debug',
        repository: 'assistente-juridico-principal',
        defaultBranch: 'main',
        isPrivate: false
      },
      {
        name: 'chrome-extension-pje',
        url: 'https://github.com/org/chrome-extension-pje.git',
        providerName: 'github',
        owner: 'org',
        repository: 'chrome-extension-pje',
        defaultBranch: 'main',
        isPrivate: true
      }
    ];

    beforeEach( async () =>
    {
      await gitBaseService.initialize();
      mockAPI.getRemoteSources.mockResolvedValue( mockSources );
    } );

    it( 'deve buscar todos os repositórios remotos', async () =>
    {
      const sources = await gitBaseService.getRemoteSources();

      expect( sources ).toEqual( mockSources );
      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( undefined );
    } );

    it( 'deve filtrar por provider', async () =>
    {
      await gitBaseService.getRemoteSources( { providerName: 'github' } );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( { providerName: 'github' } );
    } );

    it( 'deve buscar por query', async () =>
    {
      await gitBaseService.getRemoteSources( { query: 'assistente-juridico' } );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( { query: 'assistente-juridico' } );
    } );

    it( 'deve limitar resultados', async () =>
    {
      await gitBaseService.getRemoteSources( { limit: 10 } );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( { limit: 10 } );
    } );

    it( 'deve filtrar por owner', async () =>
    {
      await gitBaseService.getRemoteSources( { owner: 'portprojetoautomacao-debug' } );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( { owner: 'portprojetoautomacao-debug' } );
    } );
  } );

  describe( 'pickRemoteSource', () =>
  {
    const mockSource: RemoteSource = {
      name: 'selected-repo',
      url: 'https://github.com/org/selected-repo.git',
      providerName: 'github'
    };

    beforeEach( async () =>
    {
      await gitBaseService.initialize();
    } );

    it( 'deve abrir seletor e retornar repositório selecionado', async () =>
    {
      mockAPI.pickRemoteSource.mockResolvedValue( mockSource );

      const selected = await gitBaseService.pickRemoteSource();

      expect( selected ).toEqual( mockSource );
      expect( mockAPI.pickRemoteSource ).toHaveBeenCalledWith( undefined );
    } );

    it( 'deve retornar undefined quando usuário cancelar', async () =>
    {
      mockAPI.pickRemoteSource.mockResolvedValue( undefined );

      const selected = await gitBaseService.pickRemoteSource();

      expect( selected ).toBeUndefined();
    } );

    it( 'deve passar opções de filtragem', async () =>
    {
      const options = {
        providerName: 'github',
        title: 'Selecione repositório',
        placeholder: 'Digite para buscar...'
      };

      mockAPI.pickRemoteSource.mockResolvedValue( mockSource );

      await gitBaseService.pickRemoteSource( options );

      expect( mockAPI.pickRemoteSource ).toHaveBeenCalledWith( options );
    } );
  } );

  describe( 'registerRemoteSourceProvider', () =>
  {
    const mockProvider: RemoteSourceProvider = {
      name: 'custom-gitlab',
      icon: '$(gitlab)',
      getRemoteSources: vi.fn( async () => [
        {
          name: 'custom-project',
          url: 'https://gitlab.custom.com/org/project.git',
          providerName: 'custom-gitlab'
        }
      ] )
    };

    const mockDisposable = {
      dispose: vi.fn()
    };

    beforeEach( async () =>
    {
      await gitBaseService.initialize();
      mockAPI.registerRemoteSourceProvider.mockReturnValue( mockDisposable );
    } );

    it( 'deve registrar provedor customizado', async () =>
    {
      const disposable = await gitBaseService.registerRemoteSourceProvider( mockProvider );

      expect( mockAPI.registerRemoteSourceProvider ).toHaveBeenCalledWith( mockProvider );
      expect( disposable ).toEqual( mockDisposable );
    } );

    it( 'deve permitir cleanup do provedor', async () =>
    {
      const disposable = await gitBaseService.registerRemoteSourceProvider( mockProvider );

      disposable.dispose();

      expect( mockDisposable.dispose ).toHaveBeenCalled();
    } );
  } );

  describe( 'Helper Methods', () =>
  {
    beforeEach( async () =>
    {
      await gitBaseService.initialize();
      mockAPI.getRemoteSources.mockResolvedValue( [] );
    } );

    it( 'getGitHubRepositories - deve buscar repos do GitHub', async () =>
    {
      await gitBaseService.getGitHubRepositories( 'portprojetoautomacao-debug' );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( {
        providerName: 'github',
        owner: 'portprojetoautomacao-debug',
        limit: 50
      } );
    } );

    it( 'getGitLabRepositories - deve buscar repos do GitLab', async () =>
    {
      await gitBaseService.getGitLabRepositories( 'my-group', 20 );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( {
        providerName: 'gitlab',
        owner: 'my-group',
        limit: 20
      } );
    } );

    it( 'searchRepositories - deve buscar por query', async () =>
    {
      await gitBaseService.searchRepositories( 'assistente', 'github' );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( {
        query: 'assistente',
        providerName: 'github',
        limit: 100
      } );
    } );

    it( 'searchRepositories - deve buscar em todos os providers', async () =>
    {
      await gitBaseService.searchRepositories( 'juridico' );

      expect( mockAPI.getRemoteSources ).toHaveBeenCalledWith( {
        query: 'juridico',
        providerName: undefined,
        limit: 100
      } );
    } );
  } );

  describe( 'Error Handling', () =>
  {
    it( 'deve lançar erro se API não estiver disponível', async () =>
    {
      // Reset e não reinicializar
      gitBaseService.reset();
      setVSCodeAPI( null );

      await expect(
        gitBaseService.getRemoteSources()
      ).rejects.toThrow( 'Git Base API não está disponível' );
    } );

    it( 'deve propagar erros da API', async () =>
    {
      // Garantir que está inicializado
      await gitBaseService.initialize();

      // Configurar erro na API
      mockAPI.getRemoteSources.mockRejectedValue( new Error( 'Network error' ) );

      await expect(
        gitBaseService.getRemoteSources()
      ).rejects.toThrow( 'Network error' );
    } );
  } );
} );
