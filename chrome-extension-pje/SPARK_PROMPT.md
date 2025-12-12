

Qual próximo passo prefere?
# Prompt para Spark — Extensão Chrome "PJe Sync - Assistente Jurídico"

Objetivo
- Criar uma extensão Chrome (Manifest V3) chamada "PJe Sync - Assistente Jurídico" que sincroniza processos do PJe (TJMG) com o backend do Assistente Jurídico em tempo real.

Tecnologias e requisitos
- TypeScript (strict), Webpack (v5), Vitest (tests), tsc (typecheck).
- Manifest V3 com Service Worker (background).
- Permissões: storage, alarms, notifications.
- Host permissions: https://*.tjmg.jus.br/* e https://assistente-juridico-github.vercel.app/*
- API: comunicação HTTPS com o backend. Usar header "X-API-Key" (API Key salva em chrome.storage.sync).
- Sem coleta de dados sensíveis (senha, certificado, anexos, PDFs completos ou petições inteiras). A extensão NUNCA deve enviar o conteúdo completo de documentos ou anexos ao backend. Enviar apenas metadados e um snippet truncado (máx. 500 caracteres) com PII removida/redigida (ex.: CPFs e emails substituídos por [REDACTED_*]). Documentar exatamente quais campos são coletados e mostrar isso no popup/README.

Funcionalidades esperadas
1. Content Script (injetado em páginas PJe)
   - Detecta se está no Painel do Advogado / páginas de consulta / detalhes do processo.
   - Observador DOM (MutationObserver) que aciona extrações com debounce (min 5s entre syncs; parâmetros configuráveis).
   - Extratores (módulos) separados:
     - ProcessExtractor: extrai número CNJ, classe, assunto, partes, vara, comarca, último movimento.
     - ExpedienteExtractor: extrai intimações/movimentações.
     - DocumentExtractor: extrai documento atualmente aberto (quando aplicável).
   - Badge visual fixo no canto superior direito (status: ✓ verde, ⟳ amarelo, ✗ vermelho, ! laranja); clique no badge dispara sync.
   - Mensagens runtime para interagir com popup/background (FORCE_SYNC, PING, EXTRACT_DOCUMENT, REPORT_ERROR).

2. Background Service Worker
   - SyncManager que recebe mensagens do content e envia para backend (/api/pje-sync).
   - CrawlerManager com fila, status e endpoints de controle (start/pause/stop/status).
   - Registro de erros no chrome.storage.local (max 50) e tentativa de forward para /api/extension-errors quando houver API Key.
   - Eventos onInstalled para abrir uma página de boas-vindas em primeira instalação.

3. Popup
   - Interface para configurar API Key (armazenar em chrome.storage.sync), visualizar status (conectado/desconectado), estatísticas (nº processos, expedientes hoje, timestamp última sync) e controles do crawler (start/pause/stop).
   - Botão "Sincronizar Agora" que envia FORCE_SYNC para abas do PJe.
   - Feedback visual + toasts curtos.

4. Comportamento de rede e confiabilidade
   - Requisições ao backend com header "X-API-Key".
   - Retry com backoff (3 tentativas), tratamento de 401 (invalidate API Key), tratamento de falhas offline (gravar filas locais e re-tentar em background).
   - Respeitar privacidade: não enviar dados confidenciais (senha, pdfs, petições completas). Documentar o que é coletado.

5. Testes
   - Vitest unit tests cobrindo extractors, content script logic, popup controllers (mínimo 48 testes como no repositório existente).
   - Testes de integração simulando messaging entre popup <-> background <-> content usando jsdom mocks ou mocking de `chrome.*`.
   - Scripts: dev, build, test, test:watch, package (zip do dist).

6. Build e packaging
   - Webpack com output em `dist/` contendo manifest.json, background.js, content.js, popup.js, assets/*.
   - npm scripts:
     - dev: webpack --mode development --watch
     - build: webpack --mode production
     - test: vitest run
     - package: build + zip (pje-sync-v1.0.0.zip)
   - README e INSTALL com instruções de instalação manual (carregar sem compactação) e checklist de testes manuais.

Entradas / Saídas HTTP (exemplos)
- POST /api/pje-sync (X-API-Key)
  body: { source: 'extension', timestamp, processos: [ { numero, numeroFormatado, classe, assunto, parteAutor, parteReu, vara, comarca, ultimoMovimento } ], expedientes: [...] }
  expected: { success: true, saved: X }

- GET /api/status (X-API-Key)
  expected: 200 OK → { status: 'ok', message: 'service online' } → popup mostra "Conectado"

- POST /api/extension-errors (X-API-Key)
  body: ExtensionErrorEvent (id, timestamp, message, stack?, context, extensionVersion)
  expected: { success: true }

Critérios de aceitação (tests + manual)
- Unit tests (Vitest) passam.
- TypeScript sem erros (npx tsc --noEmit).
- Build gera `dist/` com arquivos necessários e `pje-sync-v1.0.0.zip`.
- Manual: ao abrir https://pje.tjmg.jus.br e instalar extensão carregada, badge aparece, clicar "Sincronizar Agora" inicia sync; popup mostra status "Conectado" com API Key válida.
- Notificações: ao detectar intimação nova, enviar notification do Chrome com título e corpo.
- Privacidade: README documenta dados coletados e não coletados.

Outros requisitos e boas práticas
- Estrutura do projeto conforme padrão (src/{content,background,popup,shared}, tests).
- Código modular, bem tipado, com mensagens e logs consistentes (`[PJe Sync] ...`), uso de chrome.runtime.lastError checks.
- Acessibilidade: popup com labels e ARIA where appropriate.
- Compatibilidade: Chrome, Edge, Brave (manifest v3).
- Documentar no README como publicar no Chrome Web Store.

---

CI/CD - Requisitos (adicionar a este projeto):

- GitHub Actions workflow: `.github/workflows/extension-ci.yml`
  - on: [push, pull_request] at branches: [main, develop]
  - matrix: node-version: [18.x], os: [ubuntu-latest]
  - steps:
    - actions/checkout
    - actions/setup-node v3 (node-version)
    - cache yarn/npm (dependências)
    - npm ci
    - npm run typecheck (fail on error)
    - npm run test -- --coverage (collect coverage, fail when threshold not met)
    - npm run build (production build)
    - npm run package (create zip)
    - Upload `pje-sync-v1.0.0.zip` as artifact
    - Optionally: run a lint step if configured in the monorepo root
    - Optionally: run a security tool (npm audit) and code quality (SonarCloud) steps
    - For `pull_request`, run tests only; for `push` on `main`, run release workflow

- Release pipeline: `.github/workflows/extension-release.yml`
  - only on `push` to `main` with tag v*:
    - Build, tests
    - Create GitHub Release
    - Optional: upload artifact to Chrome Web Store using `ChromeWebStore/action` (requires secrets: `CHROME_WEBSTORE_ID` and `CHROME_WEBSTORE_TOKEN`)

- CI Checks & Policies:
  - Build and tests must pass before merge to main
  - Coverage threshold (e.g. 80%) enforced; will fail CI if not reached
  - Use `dependabot` updates for devDependencies only
  - Use caching for npm/yarn modules to speed up runs
  - Add an approval gating policy for releases to Chrome Web Store

- Local test matrix/runner
  - Developers should be able to run `npm ci && npm run validate` for a local pre-merge validation

Exemplos de testes unitários (Vitest)

1) Teste do `ProcessExtractor` (unitário - JSDOM)
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ProcessExtractor } from '../../src/content/extractors/process-extractor';

const SAMPLE_HTML = `
<table>
<tr class="processo-row">
  <td><a class="numero-processo">0012345-67.2024.8.13.0000</a></td>
  <td class="classe">Ação ordinária</td>
  <td class="assunto">Execução fiscal</td>
  <td class="polo-ativo">Fulano</td>
  <td class="polo-passivo">Beltrano</td>
  <td class="orgao-julgador">Vara de Execuções Fiscais - Comarca de Belo Horizonte</td>
</tr>
</table>
`;

describe('ProcessExtractor', () => {
  beforeEach(() => {
    document.body.innerHTML = SAMPLE_HTML;
  });

  it('deve extrair processo corretamente', () => {
    const extractor = new ProcessExtractor();
    const processos = extractor.extractProcessos();
    expect(processos.length).toBeGreaterThan(0);
    const p = processos[0];
    expect(p.numero).toMatch(/\d{20}/);
    expect(p.classe).toContain('Ação');
    expect(p.assunto).toContain('Execução fiscal');
    expect(p.parteAutor).toContain('Fulano');
    expect(p.parteReu).toContain('Beltrano');
    expect(p.vara).toContain('Vara de Execuções Fiscais');
  });
});
```

2) Teste do `PopupController.saveApiKey` (mock fetch e chrome.storage)
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PopupController } from '../../src/popup/popup';

// Mock chrome.storage
globalThis.chrome = {
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({ apiKey: null }),
      set: vi.fn().mockResolvedValue(undefined),
    },
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  tabs: {
    create: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
  },
  runtime: {
    sendMessage: vi.fn().mockImplementation((_m, cb) => cb({ success: true })),
  },
} as any;

describe('PopupController', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="apiKey" />
      <button id="saveApiKey"></button>
      <div id="statusDot"></div>
      <div id="statusText"></div>
    `;
  });

  it('deve salvar apiKey e mostrar sucesso', async () => {
    const popup = new PopupController();
    // Simula preenchimento do campo
    const input = document.getElementById('apiKey') as HTMLInputElement;
    input.value = 'MY_API_KEY';

    // Trigger click
    (document.getElementById('saveApiKey')!).click();

    await new Promise((r) => setTimeout(r, 10)); // espera async

    expect(chrome.storage.sync.set).toHaveBeenCalledWith({ apiKey: 'MY_API_KEY' });
  });
});
```

3) Teste do `content.syncNow` (mock chrome.runtime.sendMessage)
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PJeContentScript } from '../../src/content/content';

// Mock runtime messaging
globalThis.chrome = {
  runtime: {
    sendMessage: vi.fn().mockImplementation((_m, cb) => cb({ success: true })),
  },
} as any;

describe('PJeContentScript', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="painel"></div>'; // Simula painel do PJe
  });

  it('deve enviar FORCE_SYNC quando syncNow for chamado', async () => {
    const content = new PJeContentScript();
    await content['syncNow']();
    expect(chrome.runtime.sendMessage).toHaveBeenCalled();
  });
});
```

Observações sobre os testes
- Use `vitest` com `jsdom` para simular DOM do PJe.
- Mockar `chrome.*` APIs com stubs simples (mocks de storage, runtime, tabs) usando `vi.fn()`.
- Cobrir cenários: páginas de detalhes, painéis, ausência de processos, erros e fallback.

Boas práticas em CI
- Usar cache de dependências
- Executar `npm ci` (ou `npm install`) e `npm run validate` (typecheck + tests + build)
- Obter artefato do build para checks rápidos
- Opcional: executar `playwright`/`puppeteer` E2E para validar a extensão carregada em um browser headless e tirar screenshot de página do PJe com badge visível.

Tarefas finais de entrega
- Fornecer um repositório/branch com todo o código, testes e README.
- Incluir instruções para rodar localmente, rodar testes, e empacotar para upload na Chrome Web Store.
- Incluir checklist de QA manual (instalação, sync, notificações, crawler controls, error forwarding).

---

Exemplos de workflow GitHub Actions (resumo)
- extension-ci.yml:
  - name: Run extension CI
    on: [push, pull_request]
    jobs:
      build:
        runs-on: ubuntu-latest
        strategy:
          matrix:
            node-version: [18.x]
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-node@v4
            with: node-version: ${{ matrix.node-version }}
          - run: npm ci
          - run: npm run typecheck
          - run: npm run test -- --coverage
          - run: npm run build
          - run: npm run package
          - uses: actions/upload-artifact@v4
            with: name: pje-extension
                  path: pje-sync-v1.0.0.zip

- extension-release.yml:
  - name: Release Chrome Extension
    on: push: tags: - 'v*'
    jobs:
      release:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - run: npm ci
          - run: npm run validate
          - run: npm run package
          - run: echo "Create release and publish to Chrome Web Store" # implemente plugin ou action de publicação

---

Mensagem adicional
- "Implemente testes unitários e mocks para as APIs do Chrome; facilite testes com util helpers. Adicione CI (GitHub Actions) com cobertura exigida; garanta que build/package artifact e tests sejam verificados em PRs e push para main."

---

Se quiser, eu posso:
- Gerar o workflow `extension-ci.yml` e `extension-release.yml` diretamente no repositório
- Criar exemplos de testes de unidade (`tests/process-extractor.test.ts`, `tests/popup.test.ts`, `tests/content.test.ts`) e fixtures
- Implementar o script de packaging `npm run package` no `package.json` (já existe, só validar)
- Executar testes localmente e validar `npx tsc --noEmit` e `npm run test` para garantir que tudo passa
