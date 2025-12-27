/**
 * Git Base API Integration
 *
 * Este serviço fornece integração com a API Git Base do VS Code para:
 * - Buscar repositórios remotos de provedores Git (GitHub, GitLab, Bitbucket)
 * - Selecionar repositórios com UI nativa do VS Code
 * - Registrar provedores Git customizados
 *
 * @see https://code.visualstudio.com/api/extension-guides/scm-provider
 * @see src/api/git-base.d.ts
 */

import type {
  GetRemoteSourcesOptions,
  GitBaseAPI,
  GitBaseExtension,
  PickRemoteSourceOptions,
  RemoteSource,
  RemoteSourceProvider,
} from "../api/git-base";

// Types para VS Code (compatível com ambiente não-VS Code)
interface VSCodeExtension<T> {
  readonly isActive: boolean;
  readonly exports: T;
  activate(): Promise<void>;
}

interface VSCodeExtensions {
  getExtension<T>(extensionId: string): VSCodeExtension<T> | undefined;
}

interface VSCodeDisposable {
  dispose(): void;
}

interface VSCodeAPI {
  extensions: VSCodeExtensions;
}

// Helper para obter VS Code API (injetável para testes)
let vscodeApiInstance: VSCodeAPI | null = null;

export function setVSCodeAPI(api: VSCodeAPI | null): void {
  vscodeApiInstance = api;
}

function getVSCodeAPI(): VSCodeAPI | null {
  if (vscodeApiInstance) {
    return vscodeApiInstance;
  }

  // Tentar obter vscode do contexto global (quando rodando em extensão VS Code)
  if (typeof globalThis !== "undefined" && "vscode" in globalThis) {
    return (globalThis as Record<string, unknown>).vscode as VSCodeAPI;
  }

  return null;
}

/**
 * Singleton para acessar Git Base API
 */
class GitBaseService {
  private api: GitBaseAPI | null = null;
  private initialized = false;

  /**
   * Reseta o estado do serviço (útil para testes)
   */
  reset(): void {
    this.api = null;
    this.initialized = false;
  }

  /**
   * Inicializa a conexão com Git Base API
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const vscode = getVSCodeAPI();

      if (!vscode) {
        console.warn("[GitBase] VS Code API não disponível");
        return;
      }

      const extension = vscode.extensions.getExtension<GitBaseExtension>("vscode.git-base");

      if (!extension) {
        console.warn("[GitBase] Extensão vscode.git-base não encontrada");
        return;
      }

      if (!extension.isActive) {
        await extension.activate();
      }

      this.api = extension.exports.getAPI(1);
      this.initialized = true;
      console.log("[GitBase] API inicializada com sucesso");
    } catch (error) {
      console.error("[GitBase] Erro ao inicializar API:", error);
      throw error;
    }
  }

  /**
   * Garante que a API está inicializada antes de usar
   */
  private async ensureInitialized(): Promise<GitBaseAPI> {
    if (!this.api) {
      await this.initialize();
    }

    if (!this.api) {
      throw new Error("Git Base API não está disponível");
    }

    return this.api;
  }

  /**
   * Busca repositórios remotos de provedores Git
   *
   * @example
   * ```typescript
   * // Buscar todos os repositórios
   * const repos = await gitBaseService.getRemoteSources();
   *
   * // Buscar repositórios do GitHub
   * const githubRepos = await gitBaseService.getRemoteSources({
   *   providerName: 'github',
   *   query: 'assistente-juridico'
   * });
   *
   * // Buscar repositórios de uma organização
   * const orgRepos = await gitBaseService.getRemoteSources({
   *   owner: 'portprojetoautomacao-debug',
   *   limit: 20
   * });
   * ```
   */
  async getRemoteSources(options?: GetRemoteSourcesOptions): Promise<RemoteSource[]> {
    const api = await this.ensureInitialized();

    try {
      const sources = await api.getRemoteSources(options);
      console.log(`[GitBase] Encontrados ${sources.length} repositórios remotos`);
      return sources;
    } catch (error) {
      console.error("[GitBase] Erro ao buscar remote sources:", error);
      throw error;
    }
  }

  /**
   * Abre um seletor de repositórios (Quick Pick UI)
   *
   * @example
   * ```typescript
   * // Selecionar qualquer repositório
   * const selected = await gitBaseService.pickRemoteSource();
   *
   * // Selecionar repositório do GitHub
   * const githubRepo = await gitBaseService.pickRemoteSource({
   *   providerName: 'github',
   *   title: 'Selecione um repositório GitHub',
   *   placeholder: 'Digite para buscar...'
   * });
   *
   * if (githubRepo) {
   *   console.log(`Selecionado: ${githubRepo.name}`);
   *   console.log(`URL: ${githubRepo.url}`);
   * }
   * ```
   */
  async pickRemoteSource(options?: PickRemoteSourceOptions): Promise<RemoteSource | undefined> {
    const api = await this.ensureInitialized();

    try {
      const selected = await api.pickRemoteSource(options);

      if (selected) {
        console.log(`[GitBase] Repositório selecionado: ${selected.name}`);
      } else {
        console.log("[GitBase] Seleção cancelada pelo usuário");
      }

      return selected;
    } catch (error) {
      console.error("[GitBase] Erro ao selecionar remote source:", error);
      throw error;
    }
  }

  /**
   * Registra um provedor Git customizado
   *
   * @example
   * ```typescript
   * const customProvider: RemoteSourceProvider = {
   *   name: 'custom-gitlab',
   *   icon: '$(gitlab)',
   *   async getRemoteSources(query) {
   *     // Implementar busca customizada
   *     return [
   *       {
   *         name: 'my-project',
   *         url: 'https://gitlab.custom.com/org/my-project.git',
   *         providerName: 'custom-gitlab'
   *       }
   *     ];
   *   }
   * };
   *
   * const disposable = await gitBaseService.registerRemoteSourceProvider(customProvider);
   *
   * // Cleanup quando não precisar mais
   * disposable.dispose();
   * ```
   */
  async registerRemoteSourceProvider(provider: RemoteSourceProvider): Promise<VSCodeDisposable> {
    const api = await this.ensureInitialized();

    try {
      const disposable = api.registerRemoteSourceProvider(provider);
      console.log(`[GitBase] Provedor registrado: ${provider.name}`);
      return disposable;
    } catch (error) {
      console.error("[GitBase] Erro ao registrar provedor:", error);
      throw error;
    }
  }

  /**
   * Helper: Buscar repositórios do GitHub por organização
   */
  async getGitHubRepositories(owner: string, limit = 50): Promise<RemoteSource[]> {
    return this.getRemoteSources({
      providerName: "github",
      owner,
      limit,
    });
  }

  /**
   * Helper: Buscar repositórios do GitLab por grupo
   */
  async getGitLabRepositories(owner: string, limit = 50): Promise<RemoteSource[]> {
    return this.getRemoteSources({
      providerName: "gitlab",
      owner,
      limit,
    });
  }

  /**
   * Helper: Buscar repositórios contendo uma query
   */
  async searchRepositories(query: string, providerName?: string): Promise<RemoteSource[]> {
    return this.getRemoteSources({
      query,
      providerName,
      limit: 100,
    });
  }

  /**
   * Verificar se a API está disponível
   */
  isAvailable(): boolean {
    return this.initialized && this.api !== null;
  }

  /**
   * Obter versão da API
   */
  getVersion(): number {
    return 1; // API version
  }
}

// Exportar singleton
export const gitBaseService = new GitBaseService();

// Exportar tipos
export type {
  GetRemoteSourcesOptions,
  GitBaseAPI,
  GitBaseExtension,
  PickRemoteSourceOptions,
  RemoteSource,
  RemoteSourceProvider,
};
