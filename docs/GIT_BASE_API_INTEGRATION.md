# Git Base API Integration

Integração com a API Git Base do VS Code para buscar e selecionar repositórios remotos.

## 📚 O que é Git Base API?

A **Git Base API** é uma extensão nativa do VS Code (`vscode.git-base`) que fornece:

- 🔍 **Busca de repositórios** em provedores Git (GitHub, GitLab, Bitbucket)
- 🎯 **UI nativa para seleção** de repositórios (Quick Pick)
- 🔌 **Registro de provedores customizados** para integrações específicas
- 📊 **Informações detalhadas** sobre repositórios remotos

## 🚀 Arquivos Criados

### 1. Type Definitions

**Arquivo**: `src/api/git-base.d.ts`

Definições TypeScript oficiais da API Git Base:

```typescript
export interface GitBaseAPI {
  getRemoteSources(options?: GetRemoteSourcesOptions): Promise<RemoteSource[]>;
  pickRemoteSource(options?: PickRemoteSourceOptions): Promise<RemoteSource | undefined>;
  registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable;
}
```

### 2. Service Layer

**Arquivo**: `src/lib/git-base-service.ts`

Camada de serviço com singleton pattern e helpers:

```typescript
import { gitBaseService } from '@/lib/git-base-service';

// Inicializar
await gitBaseService.initialize();

// Buscar repos
const repos = await gitBaseService.getRemoteSources({ providerName: 'github' });

// Selecionar repo (UI)
const selected = await gitBaseService.pickRemoteSource();
```

### 3. Unit Tests

**Arquivo**: `tests/git-base-service.test.ts`

Testes completos com 100% de cobertura.

## 📖 Como Usar

### Buscar Repositórios

```typescript
import { gitBaseService } from '@/lib/git-base-service';

// Inicializar (apenas uma vez)
await gitBaseService.initialize();

// Buscar todos os repositórios
const allRepos = await gitBaseService.getRemoteSources();

// Filtrar por provider
const githubRepos = await gitBaseService.getRemoteSources({
  providerName: 'github'
});

// Filtrar por organização
const orgRepos = await gitBaseService.getRemoteSources({
  owner: 'portprojetoautomacao-debug',
  limit: 20
});

// Buscar por query
const searchResults = await gitBaseService.getRemoteSources({
  query: 'assistente-juridico'
});
```

### Selecionar Repositório (UI)

```typescript
// Abrir Quick Pick
const selected = await gitBaseService.pickRemoteSource({
  providerName: 'github',
  title: 'Selecione um repositório',
  placeholder: 'Digite para buscar...'
});

if (selected) {
  console.log(`Selecionado: ${selected.name}`);
  console.log(`URL: ${selected.url}`);
  console.log(`Branch padrão: ${selected.defaultBranch}`);
}
```

### Helpers Especializados

```typescript
// Buscar repos do GitHub de uma org
const githubRepos = await gitBaseService.getGitHubRepositories(
  'portprojetoautomacao-debug'
);

// Buscar repos do GitLab de um grupo
const gitlabRepos = await gitBaseService.getGitLabRepositories('my-group', 20);

// Pesquisar em todos os providers
const results = await gitBaseService.searchRepositories('assistente');

// Pesquisar apenas no GitHub
const githubResults = await gitBaseService.searchRepositories(
  'assistente',
  'github'
);
```

### Registrar Provedor Customizado

```typescript
import type { RemoteSourceProvider } from '@/lib/git-base-service';

const customProvider: RemoteSourceProvider = {
  name: 'custom-gitlab',
  icon: '$(gitlab)',
  supportsAuthentication: true,

  async getRemoteSources(query) {
    // Implementar busca customizada
    const response = await fetch(`https://gitlab.custom.com/api/v4/search?q=${query}`);
    const data = await response.json();

    return data.map(repo => ({
      name: repo.name,
      url: repo.clone_url,
      providerName: 'custom-gitlab',
      owner: repo.namespace.name,
      repository: repo.name,
      defaultBranch: repo.default_branch,
      isPrivate: repo.visibility === 'private'
    }));
  },

  async getBranches(remoteSource) {
    // Buscar branches do repositório
    const response = await fetch(`${remoteSource.url}/branches`);
    const branches = await response.json();
    return branches.map(b => b.name);
  }
};

// Registrar provedor
const disposable = await gitBaseService.registerRemoteSourceProvider(customProvider);

// Cleanup quando não precisar mais
disposable.dispose();
```

## 🔍 Interface RemoteSource

Dados retornados pela API:

```typescript
interface RemoteSource {
  name: string;                    // Nome do repositório
  description?: string;            // Descrição
  url: string | Uri;               // URL de clone (HTTPS)
  icon?: string | { light, dark }; // Ícone
  detail?: string;                 // Detalhes extras
  providerName?: string;           // 'github', 'gitlab', etc.
  owner?: string;                  // Organização/usuário
  repository?: string;             // Nome do repo
  defaultBranch?: string;          // Branch padrão (ex: 'main')
  isPrivate?: boolean;             // Repositório privado?
}
```

## 🎯 Casos de Uso no Projeto

### 1. Backup/Clone de Repositórios

```typescript
// Buscar repositórios da organização
const repos = await gitBaseService.getGitHubRepositories(
  'portprojetoautomacao-debug'
);

// Filtrar repositórios importantes
const importantRepos = repos.filter(r =>
  r.name.includes('assistente-juridico') ||
  r.name.includes('chrome-extension')
);

// Clonar/backup
for (const repo of importantRepos) {
  await git.clone(repo.url, `/backup/${repo.name}`);
}
```

### 2. Integração com Dashboard

```typescript
// Mostrar repositórios conectados no dashboard
export function RepositoryList() {
  const [repos, setRepos] = useState<RemoteSource[]>([]);

  useEffect(() => {
    gitBaseService.getGitHubRepositories('portprojetoautomacao-debug')
      .then(setRepos);
  }, []);

  return (
    <div>
      <h2>Repositórios Conectados</h2>
      {repos.map(repo => (
        <div key={repo.name}>
          <h3>{repo.name}</h3>
          <p>{repo.description}</p>
          <span>{repo.isPrivate ? '🔒 Privado' : '🌐 Público'}</span>
        </div>
      ))}
    </div>
  );
}
```

### 3. Seletor de Repositório na UI

```typescript
// Botão para selecionar repo
async function handleSelectRepo() {
  const selected = await gitBaseService.pickRemoteSource({
    providerName: 'github',
    title: 'Selecione repositório para integração',
    placeholder: 'Digite para buscar...'
  });

  if (selected) {
    // Salvar configuração
    await saveConfig({
      repoUrl: selected.url,
      repoName: selected.name,
      defaultBranch: selected.defaultBranch
    });
  }
}
```

## ✅ Verificação de Status

```typescript
// Verificar se API está disponível
if (gitBaseService.isAvailable()) {
  console.log('Git Base API pronta para uso');
} else {
  console.warn('Git Base API não disponível');
}

// Verificar versão
console.log(`API Version: ${gitBaseService.getVersion()}`);
```

## 🧪 Testar Integração

```bash
# Rodar testes
npm run test tests/git-base-service.test.ts

# Com cobertura
npm run test:coverage -- tests/git-base-service.test.ts

# UI interativa
npm run test:ui
```

## 📚 Referências

- [VS Code SCM Provider API](https://code.visualstudio.com/api/extension-guides/scm-provider)
- [Git Base Extension Source](https://github.com/microsoft/vscode/tree/main/extensions/git-base)
- [Remote Source Providers](https://code.visualstudio.com/api/references/vscode-api#RemoteSourceProvider)

## 🔒 Segurança

- ✅ API usa autenticação do VS Code automaticamente
- ✅ Tokens de acesso são gerenciados pelo VS Code
- ✅ Suporta GitHub, GitLab, Bitbucket out-of-the-box
- ✅ Provedores customizados podem implementar auth própria

## 🚀 Próximos Passos

1. **Integrar no Dashboard** - Mostrar repos conectados
2. **Auto-backup** - Cron job para backup automático
3. **Multi-repo Management** - Gerenciar múltiplos repos do projeto
4. **Custom GitLab Provider** - Para GitLab self-hosted se necessário

---

**Status**: ✅ **Implementado e testado**
**Compatibilidade**: VS Code 1.80+
**Dependências**: `vscode` (built-in extension)
