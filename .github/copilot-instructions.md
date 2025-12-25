---
# Copilot Instructions for Assistente Jurídico PJe
# This file is automatically loaded by GitHub Copilot
---

# 🚨 OBJETIVO ATUAL: MODO MANUTENÇÃO - PRODUÇÃO ESTÁVEL

> **⚠️ ATENÇÃO MÁXIMA - LEIA ANTES DE QUALQUER AÇÃO**
>
> **O desenvolvimento de novas funcionalidades está ENCERRADO.**
>
> **Todas as features já foram implementadas e estão em produção.**
>
> **O objetivo agora é EXCLUSIVAMENTE manter o sistema funcionando de forma estável.**

## 🎯 Diretrizes de Manutenção

### ✅ O QUE FAZER:

- **Corrigir bugs** que afetem funcionalidades existentes
- **Manter compatibilidade** com todas as integrações (DJEN, DataJud, Google Calendar, etc.)
- **Garantir que os testes passem** - não introduzir regressões
- **Atualizar dependências** apenas quando necessário para segurança ou compatibilidade
- **Monitorar e resolver** erros de produção (Sentry, logs)
- **Manter a documentação** atualizada com correções

### ❌ O QUE NÃO FAZER:

- **NÃO adicionar novas funcionalidades** - o escopo está fechado
- **NÃO refatorar código** que está funcionando - "if it ain't broke, don't fix it"
- **NÃO alterar arquitetura** ou estrutura de pastas
- **NÃO adicionar novos agentes** ou modificar comportamento dos existentes
- **NÃO alterar fluxos de automação** que estão operando corretamente
- **NÃO introduzir novas dependências** sem necessidade crítica
- **NÃO desabilitar funcionalidades** existentes sem autorização explícita do operador
- **NÃO remover features** que estão em produção funcionando corretamente

### 🔧 Critérios para Alterações:

1. **Impacto em produção**: A mudança resolve um problema real em produção?
2. **Risco mínimo**: A alteração é cirúrgica e não afeta outras partes do sistema?
3. **Testes passando**: Todos os testes continuam funcionando após a mudança?
4. **Rollback fácil**: Se der problema, podemos reverter rapidamente?
5. **Manter funcionalidades**: NUNCA desabilite ou remova funcionalidades existentes sem autorização explícita
6. **Compatibilidade Vercel**: Garantir que imports e caminhos funcionem no ambiente serverless do Vercel

### 📊 Prioridade de Correções:

| Prioridade     | Tipo                                | Ação                     |
| -------------- | ----------------------------------- | ------------------------ |
| 🔴 **Crítica** | Sistema fora do ar, perda de dados  | Corrigir IMEDIATAMENTE   |
| 🟠 **Alta**    | Funcionalidade principal quebrada corrigir imediatamente    |
| 🟡 **Média**   | Bug que afeta UX mas tem workaround | Corrigir imediatamente|
| 🟢 **Baixa**   | Melhorias cosméticas, typos, analisar se melhorara o desempenho e assim corrigir |

---

# Copilot Instructions for Assistente Jurídico PJe

Este documento fornece instruções detalhadas para o GitHub Copilot trabalhar efetivamente com o repositório **Assistente Jurídico PJe**.

---

## 📋 Visão Geral do Projeto

**Assistente Jurídico PJe** é um sistema inteligente e completo de gestão jurídica para escritórios de advocacia, construído com React, TypeScript e Vite.

### 🆕 Resumo Operational para Copilot

- **Arquitetura**: Frontend React 19 + TypeScript + Vite em `src/`, backend serverless em `api/` (Vercel Functions). Persistência principal via Upstash Redis/KV (`api/kv.ts`, `src/hooks/use-kv.ts`).
- **Extensão Chrome PJe Sync**: Projeto separado em `chrome-extension-pje/` com Manifest v3, TypeScript, Webpack. Content Script extrai processos do PJe, Background Service Worker sincroniza com `/api/pje-sync`, Popup UI configura API Key. 31 testes, build em `dist/`. Documentação: `chrome-extension-pje/README.md` e `INSTALL.md`.
- **Fluxo de agentes**: DJEN/DataJud/Chrome Extension alimenta `expedientes`, `use-autonomous-agents` cria tarefas para 16 agentes descritos em `src/lib/agents.ts`/`TODOS_OS_16_AGENTES.md`. `redacao-peticoes` usa Gemini 2.5 (`src/lib/gemini-service.ts`) e entrega minutas ao `MinutasManager` com campos `criadoPorAgente`, `confidence`, `templateId`, `status`.
- **Conectividade dos agentes**: Todos os agentes devem manter comunicação por streaming (tempo real) com os serviços centrais; qualquer novo agente precisa expor interface streaming compatível com `use-autonomous-agents`.
- **Editor/Documentos**: `src/components/editor/ProfessionalEditor.tsx` (CKEditor 5) com streaming fluido de IA via `writer.insertText`, suporte a comandos `/ai`, variáveis `{{variavel}}` e HTML rico. Documentação completa em `docs/CKEDITOR5_AI_STREAMING.md` e exemplos em `docs/EXEMPLO_USO_EDITOR_IA.md`. `src/components/MinutasManager.tsx`, `src/lib/document-templates.ts` controlam templates. Alterou template? atualize `replaceTemplateVariables` + `docs/FLUXO_MINUTAS_AUTOMATICAS.md`.
 - **Integrações críticas**: Google OAuth/Calendar (`src/lib/google-calendar-service.ts`), DJEN/DataJud (`src/lib/djen-api.ts`, `src/lib/datajud-api.ts`), PJe via Chrome Extension (`chrome-extension-pje/`, endpoint `/api/pje-sync`), Qdrant (`src/lib/qdrant-service.ts` - optional, cloud), DSPy Bridge (`scripts/dspy_bridge.py` - optional, Railway), Email API (`api/emails.ts`), Todoist apenas via stub `src/lib/todoist-stub.ts` no client (pacote official restrito a `/api`).
- **Cron/automação**: Jobs descritos em `api/cron.ts` e `vercel.json` (DJEN monitor, filas de agentes, backup). Novos jobs exigem atualizar ambos + README.
- **Build/Testes**: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`. Extensão Chrome: `cd chrome-extension-pje && npm run build`. Scripts novos precisam refletir em `.github/workflows/*`.
- **Padrões React/UI**: Apenas components funcionais, props `Props`, hooks no topo, alias `@/`. `src/components/ui/` (shadcn) é imutável. Manter lazy-loading/código dividido alinhado com `App.tsx`, skeleton loaders e `aria-label` em botões.
- **Tipos/estado**: `src/types.ts` centraliza `Process`, `Expediente`, `Minuta`. Extensão usa tipos em `chrome-extension-pje/src/shared/types.ts` (`ProcessoPJe`, `Expediente`, `SyncMessage`). Ao adicionar campos, sincronize hooks (`use-processes`, `use-auto-minuta`), APIs (`api/agents.ts`, `api/expedientes.ts`, `api/pje-sync.ts`) e contadores do dashboard.
- **Segurança/Performance**: Nada de segredos no repo; use `src/lib/config.ts` + `.env.example`. Respeite `manualChunks` de `vite.config.ts`, CSP de `vercel.json` e monitoração Sentry (`src/services/error-tracking.ts`). Extensão Chrome: API Key armazenada em Chrome Storage, comunicação HTTPS apenas.
- **Workflow**: Antes de PR, rode lint+testes e reporte resultados; manter `main` verde garante deploy automático Vercel. Para extensão, rode `npm test` em `chrome-extension-pje/`.

### 🔒 REGRA CRÍTICA: Arquivo .env.example É SAGRADO

**NUNCA, em hipótese alguma:**

❌ **NÃO APAGUE** o arquivo `/workspaces/assistente-jur-dico-principal/.env.example`
❌ **NÃO MODIFIQUE** valores, chaves ou estrutura sem autorização explícita
❌ **NÃO REMOVA** seções ou variáveis existentes
❌ **NÃO REORGANIZE** a ordem das seções sem permissão
❌ **NÃO ADICIONE** novas variáveis sem consultar o operador

**Este arquivo é:**
- 📚 **Documentação de referência** para todas as variáveis de ambiente
- 🔑 **Template crítico** para configuração em produção
- 🛡️ **Guia de segurança** com exemplos e links de obtenção de chaves
- 📖 **Fonte única de verdade** para configuração do sistema

**Se precisar adicionar variável:**
1. Consulte o operador ANTES de modificar
2. Documente com comentários claros
3. Inclua link de onde obter a chave
4. Adicione na seção correta (não crie seção nova)
5. Use placeholder genérico (não valores reais)

**Localização:** `/workspaces/assistente-jur-dico-principal/.env.example`

### 🔌 Chrome Extension PJe Sync - Workflow de Desenvolvimento

A extensão Chrome está em `chrome-extension-pje/` com seu próprio package.json e build system:

**Comandos essenciais:**
```bash
cd chrome-extension-pje
npm install              # Instalar dependências
npm run dev              # Build em modo watch
npm run build            # Build production em dist/
npm test                 # Rodar 31 testes unitários
npm run package          # Criar .zip para publicação
```

**Arquitetura:**
- `src/content/` - Content Scripts (injetados em páginas PJe)
- `src/background/` - Service Worker (sincronização com backend)
- `src/popup/` - UI de configuração (API Key, status)
- `src/content/inject/hook-network.ts` - Intercepta XHR/Fetch do PJe
- `src/content/utils/document-sanitizer.ts` - Remove PII antes de enviar

**Privacidade (LGPD):**
- NUNCA enviar PDFs completos ou petições inteiras
- Usar `document-sanitizer.ts` para redação de CPF/Email
- Truncar textos longos (max 500 chars)
- Enviar apenas metadados + snippets sanitizados

**Integração com Backend:**
- Endpoint: `POST /api/pje-sync` com header `X-API-Key`
- Payload: `{ source: 'extension', processos: [...], expedientes: [...] }`
- API Key armazenada em `chrome.storage.sync`

### 🌐 URLs de Produção

- **App Principal (URL OFICIAL)**: https://assistente-juridico-github.vercel.app/
- **App Alternativo (URL ANTIGA - DEPRECADA)**: https://assistente-juridico-github.vercel.app/
- **API Health**: https://assistente-juridico-github.vercel.app/api/health

> ⚠️ **IMPORTANTE**: A URL oficial de produção é **`assistente-juridico-github.vercel.app`**.
> A URL antiga `assistente-juridico-github.vercel.app` está deprecada e deve ser substituída em todo o código.

### 🔧 Git Workflow e Hooks

**Pre-commit e Pre-push Hooks:**
- Hooks ativos em `.git/hooks/pre-commit` e `.git/hooks/pre-push`
- Executam: lint, type-check e testes básicos
- **Para desativar temporariamente** (emergências):
  ```bash
  mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
  mv .git/hooks/pre-push .git/hooks/pre-push.disabled
  # Fazer commit/push
  mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
  mv .git/hooks/pre-push.disabled .git/hooks/pre-push
  ```
- **Bypass único** (não recomendado): `git push --no-verify`

**Branch Strategy:**
- `main` - Produção estável (deploy automático Vercel)
- `feat/*` - Novas features (criar PR para main)
- `fix/*` - Correções de bugs
- `docs/*` - Apenas documentação

**Comandos Git Comuns:**
```bash
git status                                    # Ver mudanças
git add .                                     # Adicionar tudo
git commit -m "feat: descrição"               # Commit semântico
git push origin <branch>                      # Push para remote
git pull --rebase origin main                 # Atualizar da main
```

### 🎯 Objetivo Principal: Automação 100% com Supervisão Humana

O sistema foi projetado para operar de forma **100% automática, 24/7, sem necessidade de intervenção humana constante**, porém oferece ferramentas completas para que operadores humanos possam **revisar, editar e aprovar** todo o trabalho realizado pelos agentes de IA.

#### ⚙️ Filosofia de Automação

- **Zero Touch Operation**: O sistema monitora, analisa, identifica e executa tarefas automaticamente
- **Human-in-the-Loop**: Operadores podem intervir a qualquer momento para revisar ou modificar
- **Transparência Total**: Todas as ações dos agentes são registradas e auditáveis
- **Notificações Inteligentes**: Alertas para itens que requerem atenção ou aprovação humana

#### 🔄 Fluxos de Colaboração Humano-Agente

| Cenário                             | Descrição                                                      | Comportamento do Sistema                                                                                       |
| ----------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Agente conclui → Humano revisa**  | Agente finaliza uma manifestação/petição e notifica o operador | O documento fica em status "Pendente Revisão". Operador pode editar livremente e depois aprovar para protocolo |
| **Humano inicia → Agente continua** | Operador começa a redigir uma petição mas não finaliza         | Agente detecta documento incompleto, continua a redação e notifica quando concluir. Operador revisa e ajusta   |
| **Agente detecta → Humano decide**  | Agente identifica nova intimação com prazo                     | Agente sugere ação (contestar, manifestar, etc.) e prepara minuta. Operador aprova ou altera estratégia        |
| **Revisão colaborativa**            | Múltiplas versões de um documento                              | Sistema mantém histórico de versões. Agente pode sugerir melhorias. Operador tem controle final                |
| **Urgência detectada**              | Prazo crítico identificado (ex: 24h)                           | Agente prioriza automaticamente, prepara resposta e envia notificação urgente ao operador                      |
| **Correção pós-protocolo**          | Erro identificado após agente protocolar                       | Operador pode cancelar/retificar via sistema. Agente aprende com a correção                                    |

#### 🛠️ Ferramentas para Operador Humano

1. **Editor de Documentos Integrado**

   - Editar petições/manifestações criadas pelos agentes
   - Aceitar/rejeitar sugestões de IA
   - Adicionar notas e comentários internos

2. **Painel de Aprovação**

   - Fila de documentos pendentes de revisão
   - Aprovar, rejeitar ou solicitar alterações
   - Marcar como "Auto-aprovar" para tipos específicos

3. **Histórico e Auditoria**

   - Ver todas as ações executadas por agentes
   - Comparar versões de documentos
   - Rastrear quem aprovou cada ação

4. **Configurações de Autonomia**

   - Definir níveis de autonomia por tipo de tarefa
   - Ex: "Monitoramento DJEN = 100% automático, Protocolo = Requer aprovação"
   - Configurar regras de auto-aprovação

5. **Intervenção Manual**
   - Pausar/retomar agentes a qualquer momento
   - Assumir controle de tarefas em andamento
   - Desfazer ações recentes dos agentes

#### 📊 Status de Automação por Funcionalidade

| Funcionalidade             | Nível Automação | Intervenção Humana                 |
| -------------------------- | --------------- | ---------------------------------- |
| Monitoramento DJEN/DataJud | 🟢 100%         | Opcional - revisar publicações     |
| **Sync PJe Tempo Real**    | 🟢 100%         | Opcional - instalar extensão Chrome|
| Análise de intimações      | 🟢 100%         | Opcional - confirmar classificação |
| Cálculo de prazos          | 🟢 100%         | Opcional - ajustar feriados locais |
| Geração de tarefas         | 🟢 100%         | Opcional - editar prioridades      |
| Redação de petições        | 🟢 100%         | Opcional - editar se desejar       |
| Estratégia processual      | 🟢 100%         | Opcional - ajustar estratégia      |
| Protocolo no PJe           | 🟢 100%         | Opcional - validar se desejar      |
| Comunicação com cliente    | 🟢 100%         | Opcional - revisar mensagem        |
| Gestão financeira          | 🟢 100%         | Opcional - aprovar lançamentos     |

> **Nota**: Os níveis de autonomia são configuráveis. O objetivo é permitir operação 100% automática quando desejado, mas sempre com ferramentas de supervisão disponíveis.

---

## 🤖 Sistema Totalmente Automático - Verificação Diária Obrigatória

### ⚡ Recursos Automáticos Configurados

O projeto **Assistente Jurídico PJe** possui um sistema de automação total configurado com os seguintes recursos:

#### 🎯 Inicialização Automática

- **Ao abrir projeto**: `auto-init.sh` executa automaticamente verificando dependências, iniciando servidor dev e testes
- **Tasks automáticas**: `auto-dev` (servidor), `auto-watch` (testes), `auto-monitor` (verificação contínua)
- **Script inteligente**: `/workspaces/assistente-juridico-p/auto-init.sh` - verifica Node.js, npm, TypeScript, instala dependências automaticamente

#### 💾 Salvamento Automático

- **Format on Save**: Prettier formata automaticamente
- **ESLint Auto-fix**: Corrige problemas automaticamente
- **Organize Imports**: Reorganiza imports automaticamente
- **Type Check**: Verificação TypeScript em tempo real

#### 🔄 Desenvolvimento Contínuo

- **Hot Reload**: Servidor Vite recarrega automaticamente
- **Test Watch**: Vitest roda testes automaticamente a cada mudança
- **Linting Contínuo**: ESLint monitora código em tempo real
- **SonarLint**: Análise de qualidade em tempo real

#### 📊 Tasks Disponíveis (25+ automáticas)

- **Desenvolvimento**: `dev`, `build`, `type-check`, `optimize`
- **Qualidade**: `lint`, `lint:fix`, `format`
- **Testes**: `test`, `test:run`, `test:ui`, `test:coverage`, `test:api`, `test:all`, `test:e2e`
- **Workflows**: `full-check`, `build-and-test`, `ci-pipeline`
- **Utilitários**: `clean`, `install`, `kill`, `preview`, `start`

### 🔍 Verificação Diária Obrigatória do Copilot

**IMPORTANTE**: Todo dia útil, ao iniciar qualquer interação com o projeto, o Copilot DEVE executar uma verificação completa dos recursos automáticos:

#### 📋 Checklist Diário de Verificação

**1. Status dos Arquivos de Configuração:**

```bash
# Verificar se arquivos existem e estão atualizados
- .vscode/tasks.json (25+ tasks automáticas)
- .vscode/settings.json (configurações automáticas)
- auto-init.sh (script de inicialização)
- AUTO_MODE_README.md (documentação)
```

**2. Funcionamento das Tasks Automáticas:**

```bash
# Testar tasks críticas
- npm run type-check (verificação TypeScript)
- npm run lint (ESLint)
- npm run test:run (testes unitários)
 - Verificar `DSPY_BRIDGE` (se em uso): `curl -sS "$DSPY_BRIDGE_URL/health"` - deve retornar 200
 - Verificar `QDRANT` (se em uso): `curl -sS "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"` - deve retornar 200
 - Verificar **Vector Size**: confirme que a collection está usando **768 dimensões** (compatível com text-embedding-004/Gemini/OpenAI)
 - Verificar `Email API` e filas: `curl -sS "$VERCEL_URL/api/emails/health"` ou teste de envio de `type=test`
- npm run build (build completo)
```

**3. Configurações do VS Code:**

```json
// Verificar no settings.json
"task.allowAutomaticTasks": "on"
"files.autoSave": "afterDelay"
"editor.formatOnSave": true
"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
```

**4. Status dos Scripts do package.json:**

```json
// Verificar disponibilidade
"dev": "vite" ✅
"build": "tsc && vite build" ✅
"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 150" ✅
"test": "vitest" ✅
"format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"" ✅
```

#### 🚨 Relatório Diário Obligatório

**ANTES de qualquer resposta ou ação**, o Copilot deve gerar um relatório interno:

```
📊 RELATÓRIO DIÁRIO - SISTEMA AUTOMÁTICO
Data: [DATA ATUAL]

✅ ARQUIVOS DE CONFIGURAÇÃO:
- tasks.json: [STATUS] (25+ tasks)
- settings.json: [STATUS] (automação ativada)
- auto-init.sh: [STATUS] (executável)
- AUTO_MODE_README.md: [STATUS] (documentação)

✅ FUNCIONAMENTO DAS TASKS:
- type-check: [STATUS]
- lint: [STATUS]
- test: [STATUS]
- build: [STATUS]

✅ CONFIGURAÇÕES VS CODE:
- Auto-save: [STATUS]
- Format on save: [STATUS]
- ESLint auto-fix: [STATUS]
- Tasks automáticas: [STATUS]

🔧 STATUS GERAL: [OPERACIONAL/NECESSITA ATENÇÃO/CRÍTICO]
```

#### ⚠️ Ações Corretivas Automáticas

**Se algum item falhar na verificação:**

1. **Tasks não funcionam**: Recriar `tasks.json` com configurações padrão
2. **Scripts faltam**: Verificar `package.json` e restaurar scripts
3. **Configurações VS Code**: Aplicar configurações automáticas
4. **Arquivos corrompidos**: Restaurar do backup/git
5. **DSPy Bridge não responde**: Reiniciar serviço Railway ou alertar operador; se deploy local, usar `systemctl restart dspy-bridge.service` (prod) ou `python3 scripts/dspy_bridge.py` para testes locais
6. **Qdrant indisponível**: Verificar logs da instância Qdrant Cloud, chaves e quota; em caso de erro, notificar operador e escalar a instância
   - **ATENÇÃO SOBRE POPULAÇÃO**: NÃO execute automaticamente a população em massa (`npm run qdrant:populate-datajud`) sem autorização humana. Sempre:
     1. Validar a coleção e testar com `npm run qdrant:test`.
     2. Rodar `npm run qdrant:populate:dry-run` primeiro para verificar efeitos (limitar `--max-docs` se preciso).
     3. Somente após validação explícita por um operador, executar `npm run qdrant:populate-datajud` para inserir dados efetivos.
     4. Mantenha `QDRANT_URL` e `QDRANT_API_KEY` em secrets e não commitados.
7. **Email SEND falha**: Verificar `RESEND_API_KEY` e logs do provedor; reprocessar fila se houver backlog; se o provider estiver fora, use stub temporário e avise o operador

**IMPORTANTE**: O Copilot deve informar ao usuário sobre qualquer problema detectado e propor correções automáticas.

### 🎯 Prioridades do Sistema Automático

1. **Manter automação ativa** - Nunca desabilitar recursos automáticos sem justificativa técnica
2. **Verificar diariamente** - Checklist obrigatório antes de qualquer ação
3. **Corrigir automaticamente** - Aplicar correções sem perguntar
4. **Reportar status** - Informar usuário sobre estado do sistema
5. **Documentar mudanças** - Atualizar documentação quando modificar automação

---

## ⚡ Comandos Diários Essenciais

### 🚀 Desenvolvimento Local

```bash
# Iniciar projeto (primeiro uso ou após git pull)
npm install
npm run dev                    # Servidor Vite em http://localhost:5173

# Desenvolvimento paralelo
npm run dev &                  # Servidor em background
npm run test                   # Testes em watch mode

# Verificações rápidas
npm run type-check             # Verificação TypeScript
npm run lint                   # ESLint
npm run test:run               # Testes sem watch

# Build e preview
npm run build                  # Build production em dist/
npm run preview                # Preview do build
```

### 🔍 Debugging e Troubleshooting

```bash
# Limpar cache e rebuildar
rm -rf node_modules/.vite dist .eslintcache
npm install
npm run build

# Ver logs de erro em produção
vercel logs <deployment-url>   # Requer Vercel CLI

# Testar endpoints API localmente
curl http://localhost:5173/api/health
curl -X POST http://localhost:5173/api/pje-sync \
  -H "X-API-Key: test" \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'

# Verificar serviços opcionais
curl -sS "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"
curl -sS "$DSPY_BRIDGE_URL/health"
```

### 📦 Chrome Extension

```bash
cd chrome-extension-pje
npm run build                  # Build em dist/

# Instalar no Chrome:
# 1. chrome://extensions
# 2. Ativar "Modo do desenvolvedor"
# 3. "Carregar sem compactação" → selecionar dist/
```

### 🧪 Testes

```bash
# Frontend
npm run test                   # Watch mode
npm run test:run               # Run once
npm run test:coverage          # Com coverage
npm run test:ui                # UI interativa

# API
npm run test:api               # Testes da API

# E2E
npm run test:e2e               # Playwright headless
npm run test:e2e:headed        # Com browser visível
npm run test:e2e:debug         # Com Playwright Inspector

# Chrome Extension
cd chrome-extension-pje && npm test
```

### 🚨 Troubleshooting Comum

**Erro: "Port 5173 already in use"**
```bash
lsof -ti:5173 | xargs kill -9  # Matar processo na porta
npm run kill                   # Script automático
```

**Erro: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build Vercel falha**
```bash
# Testar build localmente
npm run build
# Se passar, problema é em variáveis de ambiente Vercel
```

**Testes E2E falhando**
```bash
npx playwright install         # Reinstalar browsers
npm run test:e2e:debug         # Debug interativo
```

---

## GitHub MCP Server (local) - Instruções para Copilot

Para aumentar a segurança e fornecer um ponto de integração padronizado para ações no GitHub, este repositório inclui uma configuração de **GitHub MCP Server local** — útil para executar integrações do Copilot de forma controlada no ambiente de desenvolvimento.

Regras e recomendações para o Copilot:

1. Sempre que for necessário acessar ou modificar o repositório (abrir issues, criar/atualizar PRs, executar actions, buscar ou editar arquivos), o Copilot deve preferir o MCP Server local se estiver disponível.
2. Antes de executar ações que escrevem no repositório (ex.: abrir pull request, merge), o Copilot deve verificar se o servidor local está configurado com toolsets apropriados e, em caso de operações sensíveis, pedir confirmação do operador.
3. Execute o MCP local em modo read-only por padrão em ambientes de desenvolvimento ou compartilhados. O operador humano pode autorizar toolsets adicionais quando necessário (`GITHUB_TOOLSETS` e `GITHUB_TOOLS`).

Arquivos de referência no repositório:

- `.vscode/mcp.json` — configuração local do MCP Server para ser usada pelo VS Code (arquivo ignorado no git por segurança).
- `scripts/start-github-mcp.sh` — script para iniciar o MCP via Docker (usa `GITHUB_MCP_PAT`, `GITHUB_HOST`, `GITHUB_TOOLSETS`).
- `docs/MCP_SETUP.md` — Guia com passo-a-passo, comandos e melhores práticas para configurar o MCP local e usar com segurança.
- `.vscode/tasks.json` — task para iniciar facilmente o MCP Server do VS Code (Start GitHub MCP Server (Docker)).

Boas práticas de segurança:

- Nunca solicitar ou armazenar `GITHUB_MCP_PAT` em texto claro no repositório. Use Secret Storage do VS Code ou Secrets/Secrets Manager do host.
- Evite executar containers com PATs em runners públicos; se necessário, use `GITHUB_READ_ONLY=1` e um conjunto mínimo de toolsets para auditoria.
- Registrar (log) ações que envolvem escrita no repositório para fins de auditoria, incluindo quem autorizou a operação.

Se o Copilot não encontrar um MCP Server local configurado e a ação requerer acesso write ao GitHub, ele deve pedir instruções ao operador humano antes de prosseguir (por exemplo, solicitar que o operador inicie o servidor local ou forneça autorização explícita).


---

## Autonomous Agents System

The system includes 7 autonomous AI agents that work continuously:

### Active Agents (4/7 Connected)

- **assistente-juridico-agent**: Main agent with remote development and CI/CD
- **agente-cluster**: Cluster management agent
- **agenterevisor**: Code review agent
- **agenterevisor2**: Second code review agent

### Pending Agents (3/7)

- **agente-desenvolvimento**: Development environment with debug and hot reload
- **agente-qa**: QA environment with automated tests and security
- **agente-producao**: Production environment with HA and backup

### Infrastructure

- **Kubernetes**: Isolated namespaces (desenvolvimento, qa, production)
- **RBAC**: ClusterRoles and ServiceAccounts configured
- **Network Policies**: Isolation between environments
- **GitLab Integration**: Agents connected to GitLab for CI/CD automation

## 🤖 Sistema de 16 Agentes IA

O sistema inclui 16 agentes de IA especializados, cada um com funções específicas para automação jurídica:

### 🌟 Agentes Principais (Ativos 24/7)

#### 1. Harvey Specter (`harvey`)

**Estrategista-chefe do escritório**

- **Função**: Análise estratégica macro, monitoramento de performance, identificação de riscos
- **Capacidades**: strategic-analysis, performance-monitoring, risk-identification, data-analysis
- **Uso**: Visão geral do escritório, recomendações estratégicas

#### 2. Mrs. Justin-e (`justine`)

**Especialista em intimações e prazos**

- **Função**: Análise automática de intimações, identificação de prazos, geração de tarefas
- **Capacidades**: intimation-analysis, deadline-identification, task-generation, priority-assessment
- **Uso**: Processar intimações, criar tarefas com deadlines

#### 3. Análise Documental (`analise-documental`)

**Analisador de documentos 24/7**

- **Função**: Análise automática de expedientes, intimações e documentos do PJe
- **Capacidades**: document-analysis, text-extraction, entity-recognition, classification
- **Uso**: Processar documentos, extrair informações estruturadas

#### 4. Monitor DJEN (`monitor-djen`)

**Monitoramento de publicações**

- **Função**: Monitoramento contínuo do Diário de Justiça Eletrônico Nacional
- **Capacidades**: djen-monitoring, publication-detection, notification, datajud-integration
- **Uso**: Monitorar publicações diárias, detectar intimações novas

#### 5. Gestão de Prazos (`gestao-prazos`)

**Calculadora e gestor de prazos**

- **Função**: Cálculo e acompanhamento de prazos processuais, geração de alertas
- **Capacidades**: deadline-calculation, business-days, holiday-detection, alert-generation
- **Uso**: Calcular prazos, gerar alertas de vencimento

### 🎯 Agentes Especializados (Ativar quando necessário)

#### 6. Redação de Petições (`redacao-peticoes`)

**Redator jurídico profissional**

- **Função**: Criação de petições e documentos jurídicos
- **Capacidades**: document-drafting, legal-writing, template-generation, precedent-integration
- **Uso**: Redigir petições, elaborar recursos

#### 7. Organização de Arquivos (`organizacao-arquivos`)

**Organizador e arquivista digital**

- **Função**: Organização e categorização de documentos
- **Capacidades**: file-organization, categorization, indexing, duplicate-detection
- **Uso**: Organizar documentos por processo, criar índices

#### 8. Pesquisa Jurisprudencial (`pesquisa-juris`)

**Pesquisador de precedentes**

- **Função**: Busca e análise de precedentes e jurisprudências
- **Capacidades**: jurisprudence-search, precedent-analysis, case-law-research, trend-analysis
- **Uso**: Buscar precedentes STF/STJ, fundamentar petições

#### 9. Análise de Risco (`analise-risco`)

**Avaliador de riscos processuais**

- **Função**: Avaliação de riscos processuais e financeiros
- **Capacidades**: risk-assessment, probability-analysis, financial-impact, mitigation-strategies
- **Uso**: Avaliar viabilidade de casos, estimar probabilidade de sucesso

#### 10. Revisão Contratual (`revisao-contratual`)

**Revisor de contratos**

- **Função**: Análise de contratos, identificação de cláusulas problemáticas
- **Capacidades**: contract-analysis, clause-review, compliance-check, risk-identification
- **Uso**: Revisar contratos, identificar cláusulas abusivas

#### 11. Comunicação com Clientes (`comunicacao-clientes`)

**Comunicador profissional**

- **Função**: Geração de comunicações personalizadas para clientes
- **Capacidades**: client-communication, report-generation, language-simplification, personalization
- **Uso**: Explicar andamentos, gerar relatórios periódicos

#### 12. Análise Financial (`financeiro`)

**Analista financeiro**

- **Função**: Monitoramento de faturamento e rentabilidade
- **Capacidades**: financial-monitoring, profitability-analysis, receivables-tracking, metrics-calculation
- **Uso**: Monitorar honorários, analisar rentabilidade por caso

#### 13. Estratégia Processual (`estrategia-processual`)

**Consultor estratégico processual**

- **Função**: Sugestão de estratégias processuais baseadas em dados
- **Capacidades**: strategic-planning, option-analysis, cost-benefit, success-probability
- **Uso**: Definir estratégia processual, analisar custo vs benefício

#### 14. Tradução Jurídica (`traducao-juridica`)

**Tradutor jurídico**

- **Função**: Tradução de termos técnicos jurídicos
- **Capacidades**: legal-translation, term-explanation, glossary-creation, language-adaptation
- **Uso**: Explicar termos técnicos, criar glossários

#### 15. Compliance (`compliance`)

**Auditor de conformidade**

- **Função**: Verificação de conformidade com LGPD e normas
- **Capacidades**: compliance-check, lgpd-verification, ethics-review, regulatory-audit
- **Uso**: Verificar conformidade LGPD, revisar questões éticas

### 📊 Status dos Agentes por Padrão

#### ✅ 9 Agentes Ativos Automaticamente (24/7)

| #   | ID                      | Nome                       | Função                    |
| --- | ----------------------- | -------------------------- | ------------------------- |
| 1   | `harvey`                | Harvey Specter             | Estrategista-chefe        |
| 2   | `justine`               | Mrs. Justin-e              | Análise de intimações     |
| 3   | `analise-documental`    | Analisador de Documentos   | Análise de expedientes    |
| 4   | `monitor-djen`          | Monitor DJEN               | Monitoramento publicações |
| 5   | `gestao-prazos`         | Gestão de Prazos           | Cálculo de prazos         |
| 6   | `redacao-peticoes`      | Redator de Petições        | Criação de documentos     |
| 7   | `pesquisa-juris`        | Pesquisador Jurisprudência | Busca precedentes         |
| 8   | `analise-risco`         | Análise de Risco           | Avaliação de viabilidade  |
| 9   | `estrategia-processual` | Estratégia Processual      | Planejamento estratégico  |

#### ⏸️ 6 Agentes Desativados (Ativar manualmente)

| #   | ID                     | Nome                     | Motivo      |
| --- | ---------------------- | ------------------------ | ----------- |
| 10  | `organizacao-arquivos` | Organizador de Arquivos  | Sob demanda |
| 11  | `revisao-contratual`   | Revisor Contratual       | Sob demanda |
| 12  | `comunicacao-clientes` | Comunicação com Clientes | Sob demanda |
| 13  | `financeiro`           | Análise Financeira       | Sob demanda |
| 14  | `traducao-juridica`    | Tradutor Jurídico        | Sob demanda |
| 15  | `compliance`           | Compliance               | Sob demanda |

> **Nota**: Os 9 agentes ativos formam o **fluxo automático de análise de intimações** - desde a detecção no DJEN até a sugestão de estratégia processual.

---

## 📚 Documentação de Upgrade dos Agentes (Última Atualização: 09/12/2024)

### 🎯 Localização dos Documentos Principais

Todos os documentos relacionados ao último upgrade dos agentes estão localizados em:

**Diretório**: `C:\Users\thiag\source\repos\thiagobodevanadv-alt\Nova pasta\httpsgithub.comthiagobodevanadv-altassistente-jur-dico-principal.git\assistente-jur-dico-principal\docs\`

#### 📋 Documentos Criados em 09/12/2024

| Documento | Arquivo | Descrição |
|-----------|---------|-----------|
| **Resumo Completo do Upgrade** | `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` | Documento consolidado com TODA a informação do upgrade, incluindo arquitetura híbrida TOP 1% mundial |
| **População Automatizada DataJud** | `docs/QDRANT_DATAJUD_AUTOMATION.md` | Guia completo de integração com API DataJud do CNJ e população automática do Qdrant |
| **Status de Conexão Qdrant** | `docs/QDRANT_AGENTS_STATUS.md` | Análise de quais agentes estão conectados ao Qdrant e status da implementação |
| **Configuração Completa Qdrant** | `docs/QDRANT_CONFIG_COMPLETA.md` | Configuração final do cluster Qdrant Cloud com testes realizados |
| **Setup Checklist Qdrant** | `docs/QDRANT_SETUP_CHECKLIST.md` | Checklist passo-a-passo para configuração do Qdrant |

#### 🔧 Arquivos de Código Criados/Modificados

| Arquivo | Tipo | Localização | Descrição |
|---------|------|-------------|-----------|
| **DataJud Service** | Service | `src/lib/datajud-service.ts` | Integração com API pública DataJud (450 linhas) |
| **Gemini Embedding Service** | Service | `src/lib/gemini-embedding-service.ts` | Geração de embeddings com Gemini (250 linhas) |
| **População Qdrant DataJud** | Script | `scripts/populate-qdrant-datajud.ts` | Script automatizado de população (320 linhas) |
| **Agente Pesquisa Juris Qdrant** | Agent | `src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts` | Busca vetorial REAL com Qdrant (350 linhas) |
| **Init Qdrant Collection** | Script | `scripts/init-qdrant-collection.ts` | Inicialização da collection |
| **Test Qdrant Connection** | Script | `scripts/test-qdrant-connection.ts` | Testes de validação da conexão |

#### 🏆 Arquitetura Híbrida TOP 1% Mundial

O upgrade implementou uma **arquitetura híbrida de última geração** combinando:

1. **CrewAI** - Cooperação hierárquica de agentes jurídicos
2. **LangGraph** - Workflows processuais complexos com state machines
3. **DSPy** - Otimização automática de prompts (redução de 90% no uso de tokens)
4. **Microsoft AutoGen** - Execução de código e multi-agent conversations

**Principais Conquistas**:
- ✅ **10x mais rápido** - Respostas em 0.5-2 segundos
- ✅ **80% mais barato** - $0.10 por consulta vs $0.50
- ✅ **95% de precisão** - Validado com casos reais
- ✅ **1000x mais escalável** - Suporta milhares de casos simultâneos
- ✅ **100% seguro** - Compliance total com LGPD/GDPR

#### 📊 Status Atual da Implementação

| Componente | Status | Progresso |
|------------|--------|-----------|
| Cluster Qdrant Cloud | ✅ Operacional | 100% |
| Collection `legal_docs` | ✅ Criada (768 dims) | 100% |
| DataJud Service | ✅ Implementado | 100% |
| Gemini Embedding Service | ✅ Implementado | 100% |
| Script de População | ✅ Implementado | 100% |
| Agente Pesquisa Juris Qdrant | ✅ Implementado | 90% |
| Vetores Populados | ⏳ Pendente | 0% |
| Registro no Sistema | ⏳ Pendente | 0% |
| Integração UI | ⏳ Pendente | 0% |

#### 🚀 Próximos Passos para Ativação Completa

**Tempo estimado**: 2-3 horas

1. **Popular Qdrant** (15 min)
   ```bash
   npm run qdrant:populate-datajud
   npm run qdrant:test
   ```

2. **Registrar Agente no Sistema** (10 min)
   - Adicionar `pesquisa-juris-qdrant` ao `src/lib/agents.ts`

3. **Conectar UI** (20 min)
   - Refatorar `src/components/AILegalResearch.tsx`

4. **Testar End-to-End** (30 min)
   - Validação completa do fluxo

5. **Automação Mrs. Justin-e** (1 hora)
   - Integração automática de pesquisa jurisprudencial

#### 💡 Comandos Úteis para o Copilot

Ao trabalhar com o upgrade dos agentes, use:

```bash
# Ver resumo completo do upgrade
@workspace Abrir docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md

# Verificar status da integração Qdrant
@workspace Abrir docs/QDRANT_AGENTS_STATUS.md

# Entender o fluxo de população automática
@workspace Abrir docs/QDRANT_DATAJUD_AUTOMATION.md

# Verificar configuração atual do Qdrant
@workspace Abrir docs/QDRANT_CONFIG_COMPLETA.md
```

#### 📖 Referências Rápidas

- **Pull Request Original**: Arquitetura Híbrida TOP 1% Mundial com CrewAI + LangGraph + DSPy + AutoGen
- **Repositório**: thiagobodevan-a11y/assistente-juridico-p
- **Branch**: main
- **Data do Upgrade**: 09/12/2024
- **Versão**: 2.0.0

---

### 🔥 **ARQUITETURA HÍBRIDA SUPERIOR - Próxima Geração**

O sistema implementa uma **arquitetura de última geração** que combina os 8 melhores frameworks de IA do mundo:

#### **📐 8 Camadas Integradas**

1. **AutoGen** - Orquestração Multi-Agente com execução de código
2. **LangGraph** - State Machines para workflows processuais complexos
3. **CrewAI** - Times hierárquicos de agentes especializados
4. **DSPy** - Otimização automática de prompts (90% menos tokens)
5. **Semantic Kernel** - Plugins enterprise extensíveis
6. **Byzantine Consensus** - Validação por múltiplos agentes (67% threshold)
7. **Quantum-Inspired** - Otimização paralela de estratégias (128 qubits)
8. **Neuromorphic Computing** - Aprendizado contínuo (1M neurônios)

#### **📊 Ganhos de Performance**

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Tempo de resposta | 5-10s | 0.5-2s | **80% faster** |
| Precisão legal | 75% | 95% | **+26%** |
| Custo por consulta | $0.50 | $0.10 | **80% cheaper** |
| Casos simultâneos | 10 | 1000 | **100x scale** |

#### **🎯 Capacidades Revolucionárias**

**✅ Execução de Código Legal**
- Cálculos trabalhistas/tributários automáticos em Docker sandbox
- Validação de documentos via Python/SQL
- Queries em bases jurídicas
- Geração de relatórios dinâmicos

**✅ Workflows Processuais Complexos**
- State machines com checkpoints e recuperação
- Fluxos condicionais e loops
- Streaming de progresso em tempo real
- 6 estágios: Intake → Analysis → Strategy → Documentation → Review → Filing

**✅ Consenso Bizantino Multi-Agente**
- 3 validadores (AutoGen, CrewAI, Semantic Kernel)
- Threshold 67% (2/3 concordam)
- Weighted voting por expertise
- Tolerância a falhas e respostas incorretas

**✅ Otimização Quântica de Estratégias**
- 128 qubits simulados
- Exploração paralela de milhares de estratégias
- Encontra solução ótima global
- 1000 measurement rounds

**✅ Aprendizado Neuromorphic**
- 1M neurônios + 10M sinapses
- STDP (Spike-Timing Dependent Plasticity)
- Memória associativa de casos
- Energy-efficient learning

#### **🏗️ Exemplo de Arquitetura (TypeScript)**

```typescript
export class HybridAILegalSystem {
  // 1️⃣ AutoGen - Multi-agent orchestration
  private autoGenOrchestrator = new AutoGen.GroupChat({
    agents: [ChiefLegalOfficer, ClientInterface],
    maxRound: 50,
    codeExecutionConfig: { docker: true }
  });

  // 2️⃣ LangGraph - Complex workflows
  private legalWorkflow = new LangGraph.StateGraph({
    nodes: [intake, analysis, strategy, documentation, review, filing],
    edges: [/* conditional flows */]
  });

  // 3️⃣ CrewAI - Specialized teams
  private legalCrew = new CrewAI.Crew({
    agents: [SeniorResearcher, ContractSpecialist, LitigationStrategist],
    process: CrewAI.Process.hierarchical
  });

  // 4️⃣ DSPy - Auto-optimization
  private promptOptimizer = new DSPy.Module({
    signature: "context, question -> legal_answer"
  });

  // 5️⃣ Semantic Kernel - Enterprise plugins
  private semanticKernel = new SemanticKernel.Kernel({
    plugins: [LegalAnalytics, OutcomePredictor, RiskCalculator]
  });

  // 6️⃣ Byzantine Consensus
  private byzantineConsensus = new ByzantineLegalConsensus({
    validators: [autoGen, crewAI, semanticKernel],
    threshold: 0.67
  });

  // 7️⃣ Quantum Optimizer
  private quantumOptimizer = new QuantumInspiredOptimizer({
    qubits: 128,
    measurementRounds: 1000
  });

  // 8️⃣ Neuromorphic Processor
  private neuromorphicProcessor = new NeuromorphicLegalBrain({
    neurons: 1_000_000,
    learningRule: "STDP"
  });

  async processLegalRequest(request: LegalRequest) {
    // 1. AutoGen analysis
    const autoGenResult = await this.autoGenOrchestrator.run(request);

    // 2. LangGraph workflow
    const workflowResult = await this.legalWorkflow.invoke(autoGenResult);

    // 3. CrewAI deep research
    const crewResearch = await this.legalCrew.kickoff(workflowResult);

    // 4. DSPy optimization
    const optimized = await this.promptOptimizer.compile(crewResearch);

    // 5. Semantic Kernel enrichment
    const enriched = await this.semanticKernel.run(optimized);

    // 6. Byzantine consensus
    const consensus = await this.byzantineConsensus.achieve([
      autoGenResult, workflowResult, crewResearch, optimized, enriched
    ]);

    // 7. Quantum optimization
    const quantumOptimized = await this.quantumOptimizer.optimize(consensus);

    // 8. Neuromorphic learning
    await this.neuromorphicProcessor.learn(request, quantumOptimized);

    return quantumOptimized;
  }
}
```

#### **📚 Documentação Completa**

Para detalhes completos da arquitetura híbrida, incluindo:
- Código TypeScript completo
- Comparação detalhada (Atual vs Superior)
- Roadmap de implementação (5-8 semanas)
- Dependências necessárias
- Referências e recursos

**Consulte**: `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` (seção "Arquitetura Híbrida Superior")

#### **🎯 Comandos Úteis para Copilot**

```bash
# Ver arquitetura híbrida completa
@workspace Abrir docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md seção "Arquitetura Híbrida Superior"

# Comparar implementação atual vs superior
@workspace Comparar tabela de melhorias em UPGRADE_AGENTES_RESUMO_COMPLETO.md

# Ver roadmap de implementação
@workspace Mostrar roadmap de implementação da arquitetura híbrida
```

---

## Making Changes

### ⚡ Sistema Automático - Regras Específicas para Copilot

**ANTES DE QUALQUER AÇÃO**, o Copilot deve:

1. **Executar verificação diária** dos recursos automáticos
2. **Gerar relatório interno** do status do sistema
3. **Corrigir automaticamente** qualquer problema detectado
4. **Informar ao usuário** sobre o status dos recursos automáticos

#### 🔧 Regras para Modificações no Sistema Automático

- **Nunca desabilitar** recursos automáticos sem justificativa técnica
- **Sempre testar** mudanças nos arquivos de configuração automática
- **Atualizar documentação** quando modificar automação
- **Manter compatibilidade** com tasks existentes
- **Priorizar estabilidade** sobre novas features

### 🔒 Regras específicas para novos serviços opcionais (Qdrant / DSPy / Email)

- **Qdrant**: Não modifique collections/indices diretamente sem aprovação da equipe; prefira aplicar alterações via migrations e documente o impacto de scaling/retention.
- **DSPy Bridge**: Qualquer atualização de imagem ou dependências deve ser testada com `dspy-bridge` em ambiente de staging; atualizações em produção requerem rollback plan e teste de latência.
- **Email API / Email service**: Não altere os provedores de e-mail (resend) sem atualização dos testes e documentação; valide `RESEND_API_KEY` e monitore filas.

#### 📊 Relatórios de Status Automáticos

Quando solicitado ou detectando problemas, o Copilot deve fornecer relatórios como:

```
🚀 STATUS DO SISTEMA AUTOMÁTICO

✅ OPERACIONAL
- Tasks automáticas: 25/25 funcionando
- Auto-save: Ativado (1s delay)
- Format on save: Ativado
- ESLint auto-fix: Ativado
- TypeScript check: OK
- Testes automáticos: OK

⚠️ ATENÇÃO NECESSÁRIA
- [Item específico que precisa atenção]

🔧 CORREÇÕES APLICADAS
- [Correções realizadas automaticamente]
```

### 🔄 Sugerindo Mudanças de Código

Ao sugerir mudanças no código, o Copilot deve:

1. **Buscar primeiro as funções similares** já existentes usando o Serena MCP Server
2. **Analisar o contexto** da função: parâmetros, tipos, lógica
3. **Manter estilo e convenções** do código existente
4. **Adicionar testes** para nova lógica ou alterações relevantes
5. **Documentar alterações** significativas

---

## 📚 Quick Reference - Arquivos Importantes

### 🔑 Arquivos de Configuração
- `.env.example` - Template de variáveis de ambiente
- `vite.config.ts` - Configuração Vite (chunks, plugins)
- `vercel.json` - Configuração Vercel (rotas, headers, crons)
- `vitest.config.ts` - Configuração testes frontend
- `vitest.config.api.ts` - Configuração testes API
- `playwright.config.ts` - Configuração testes E2E
- `tailwind.config.js` - Configuração Tailwind CSS
- `tsconfig.json` - TypeScript compiler options

### 📝 Documentação Principal
- `README.md` - Visão geral e setup inicial
- `docs/LGPD_COMPLIANCE.md` - Conformidade LGPD
- `docs/FLUXO_MINUTAS_AUTOMATICAS.md` - Fluxo de geração de documentos
- `TODOS_OS_15_AGENTES.md` - Descrição completa dos agentes
- `chrome-extension-pje/SPARK_PROMPT.md` - Especificação da extensão
- `AUTO_MODE_README.md` - Sistema de automação

### 🎯 Arquivos Core
- `src/types.ts` - Tipos TypeScript centralizados
- `src/lib/agents.ts` - Configuração dos 16 agentes
- `src/lib/gemini-service.ts` - Integração Gemini AI
- `src/lib/config.ts` - Configurações globais
- `api/kv.ts` - Upstash Redis/KV client
- `api/agents.ts` - API de agentes
- `api/pje-sync.ts` - Sync com Chrome Extension

### 🧪 Arquivos de Teste
- `tests/` - Testes frontend
- `tests/api/` - Testes da API
- `tests/e2e/` - Testes Playwright
- `chrome-extension-pje/tests/` - Testes da extensão

---

## 🎓 Padrões de Código e Convenções

### TypeScript
```typescript
// ✅ BOM - Componente funcional tipado
interface ProcessListProps {
  processes: Process[];
  onSelect: (id: string) => void;
}

export function ProcessList({ processes, onSelect }: ProcessListProps) {
  // Hooks no topo
  const [selected, setSelected] = useState<string | null>(null);

  // Lógica
  const handleClick = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  return <div>...</div>;
}

// ❌ EVITAR - Tipos any, componentes de classe
export class ProcessList extends React.Component<any, any> { ... }
```

### Imports
```typescript
// ✅ BOM - Alias @/ para src/
import { Process } from '@/types';
import { useProcesses } from '@/hooks/use-processes';
import { Button } from '@/components/ui/button';

// ❌ EVITAR - Paths relativos longos
import { Process } from '../../../types';
```

### API Routes (Vercel Functions)
```typescript
// ✅ BOM - Validação com Zod, error handling
import { validateProcesses } from './lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const validation = validateProcesses(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    // Processar...
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Agentes IA
```typescript
// ✅ BOM - Streaming com chunks
import { streamGeminiResponse } from '@/lib/gemini-service';

async function* processIntimacao(expediente: Expediente) {
  yield { status: 'analyzing', progress: 0.1 };

  const analysis = await analyzeDocument(expediente);
  yield { status: 'analyzing', progress: 0.5, data: analysis };

  const stream = streamGeminiResponse(prompt);
  for await (const chunk of stream) {
    yield { status: 'generating', chunk };
  }

  yield { status: 'complete', result: minuta };
}
```

---

## ⚠️ Erros Comuns e Soluções

### 1. "Module not found: Can't resolve '@/...'"
**Causa:** Alias `@/` não configurado no tsconfig ou Vite
**Solução:** Verificar `tsconfig.json` e `vite.config.ts` têm o alias configurado

### 2. "Type 'X' is not assignable to type 'Y'"
**Causa:** Tipos desalinhados entre frontend e API
**Solução:** Sincronizar `src/types.ts` com `api/lib/validation.ts`

### 3. Chrome Extension não sincroniza
**Causa:** API Key inválida ou backend offline
**Solução:** Verificar popup da extensão, reconfigurar API Key, testar `POST /api/pje-sync`

### 4. Testes E2E timeout
**Causa:** Seletores mudaram ou app lento
**Solução:** Usar `await page.waitForLoadState('networkidle')`, atualizar seletores

### 5. Build Vercel falha com "Cannot find module"
**Causa:** Dependência em devDependencies ou import dinâmico quebrado
**Solução:** Mover deps para dependencies, verificar imports dinâmicos

### 6. Gemini API rate limit
**Causa:** Muitas requests simultâneas
**Solução:** Implementar retry com backoff, usar cache Redis

---

## Comunicação e Idioma (Português)

- Responda sempre em Português do Brasil (pt-BR) nas mensagens de resposta, instruções, comentários e planos — tanto no Copilot Chat quanto nas operações de revisão e sugestões automáticas.
- Use linguagem clara, objetiva e direta. Se for necessário usar termos técnicos em inglês, explique-os em português entre parênteses.
- Ao apresentar passos (ex.: rodar build, executar lint, corrigir erros), forneça instruções passo a passo em português.
- Para mensagens de commit sugeridas ou descrições de PR, gere o texto em português e, opcionalmente, inclua uma tradução curta em inglês somente se solicitado.

> Nota: O VS Code já carrega este arquivo por padrão (configuração "GitHub > Copilot > Copilot Chat: Use Instruction Files"). O front matter `applyTo: "**"` garante que Chat, Coding Agent e Code Review consumam estas instruções sem qualquer ação adicional.

---

## 📚 Referências e Repositórios de Inspiração

**IMPORTANTE**: Ao trabalhar com este projeto, consulte SEMPRE as seguintes referências para manter a originalidade do sistema e garantir o uso correto das tecnologias:

### 🎯 Repositório Principal

| Repositório | URL | Propósito |
|-------------|-----|-----------|
| **assistente-juridico-p** | https://github.com/thiagobodevan-a11y/assistente-juridico-p | Repositório alvo - Sistema jurídico completo |

### 🤖 Frameworks de Agentes e Orquestração

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Microsoft AutoGen** | https://github.com/microsoft/autogen | Orquestração multi-agent, execução de código por agentes, GroupChat |
| **LangChain** | https://github.com/langchain-ai/langchain | Workflows, LangGraph, tool-calling, memória de agentes |
| **Semantic Kernel** | https://github.com/microsoft/semantic-kernel | Planners enterprise, plugins extensíveis |
| **CrewAI** | https://github.com/joaomdmoura/crewai | Coordenação de crews/teams, delegação hierárquica |
| **DSPy** | https://github.com/stanfordnlp/dspy | Otimização/compilação automática de prompts |
| **Griptape** | https://github.com/griptape-ai/griptape | Execução de ferramentas/agents |
| **Auto-GPT** | https://github.com/Significant-Gravitas/Auto-GPT | Agentes autônomos, execução de tarefas |

### 🔍 RAG e Recuperação de Informações

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Haystack** | https://github.com/deepset-ai/haystack | RAG, pipelines de recuperação de documentos jurídicos |

### 📊 Vector Databases

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Qdrant** | https://github.com/qdrant/qdrant | Vector DB escalável - **USADO ATUALMENTE** para pesquisa jurisprudencial |
| **Chroma** | https://github.com/chroma-core/chroma | Vector DB alternativa |
| **Weaviate** | https://github.com/semi-technologies/weaviate | Vector DB com schemas |
| **Pinecone** | https://www.pinecone.io/ | Vector DB gerenciado (alternativa cloud) |

### 🛠️ Utilitários e Ferramentas

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Lemur** | https://github.com/AssemblyAI/lemur | Pipelines ML |
| **LiteLLM** | https://github.com/BerriAI/litellm | Clientes LLM leves, multi-provider |
| **Superagent** | https://github.com/superagent-ai/superagent | Abordagens emergentes de agentes |

### 🎯 Como Usar Estas Referências

#### **Para Implementação de Agentes:**
```bash
# Consultar AutoGen para orquestração
@workspace Verificar padrão AutoGen em https://github.com/microsoft/autogen

# Consultar CrewAI para delegação
@workspace Verificar padrão CrewAI em https://github.com/joaomdmoura/crewai

# Consultar DSPy para otimização de prompts
@workspace Verificar padrão DSPy em https://github.com/stanfordnlp/dspy
```

#### **Para Trabalho com Qdrant:**
```bash
# Consultar documentação oficial do Qdrant
@workspace Verificar padrão Qdrant em https://github.com/qdrant/qdrant

# Verificar implementação atual
@workspace Abrir src/lib/qdrant-service.ts
@workspace Abrir docs/QDRANT_SETUP_CHECKLIST.md
```

#### **Para Workflows com LangGraph:**
```bash
# Consultar LangChain/LangGraph
@workspace Verificar padrão LangGraph em https://github.com/langchain-ai/langchain

# Verificar implementação atual
@workspace Abrir src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts
```

### ⚠️ Regras de Uso das Referências

1. **SEMPRE consulte** a documentação oficial antes de implementar novos padrões
2. **MANTENHA consistência** com os padrões já estabelecidos no projeto
3. **NÃO copie código** diretamente - adapte para o contexto jurídico brasileiro
4. **DOCUMENTE** qualquer padrão novo inspirado nas referências
5. **TESTE** implementações baseadas em referências externas
6. **CITE** a fonte quando usar padrões específicos de um framework

### 📖 Documentação Oficial Relevante

| Framework | Documentação |
|-----------|--------------|
| **AutoGen** | https://microsoft.github.io/autogen/ |
| **LangChain** | https://python.langchain.com/docs/ |
| **LangGraph** | https://langchain-ai.github.io/langgraph/ |
| **CrewAI** | https://docs.crewai.com/ |
| **DSPy** | https://dspy-docs.vercel.app/ |
| **Semantic Kernel** | https://learn.microsoft.com/semantic-kernel/ |
| **Qdrant** | https://qdrant.tech/documentation/ |
| **Haystack** | https://docs.haystack.deepset.ai/ |

### 🎯 Mapa de Dependências do Projeto

```
Assistente Jurídico PJe
├── Orquestração
│   ├── AutoGen (GroupChat, code execution)
│   ├── CrewAI (hierarchical teams)
│   └── Semantic Kernel (enterprise plugins)
├── Workflows
│   └── LangGraph (state machines)
├── Otimização
│   └── DSPy (prompt compilation)
├── Vector Search
│   └── Qdrant ⭐ (jurisprudência, precedentes)
├── RAG
│   └── Haystack (document retrieval)
└── LLM Providers
    ├── Gemini 2.5 Pro ⭐ (principal)
    └── LiteLLM (fallback multi-provider)
```

### 🔄 Quando Consultar Cada Referência

| Cenário | Repositório a Consultar | Documentação Local |
|---------|-------------------------|-------------------|
| Criar novo agente | AutoGen, CrewAI | `src/lib/agents.ts`, `TODOS_OS_15_AGENTES.md` |
| Workflow complexo | LangChain/LangGraph | `src/agents/*/pesquisa_graph*.ts` |
| Busca vetorial | Qdrant | `docs/QDRANT_*.md` |
| Otimizar prompts | DSPy | `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` |
| RAG jurídico | Haystack | `src/lib/datajud-service.ts` |
| Multi-LLM | LiteLLM | `src/lib/gemini-service.ts` |

---

## 🎓 Boas Práticas ao Usar Referências

1. **Leia a documentação oficial** antes de implementar
2. **Adapte ao contexto jurídico brasileiro** - não copie cegamente
3. **Mantenha consistência** com padrões já estabelecidos
4. **Documente decisões arquiteturais** inspiradas em referências
5. **Teste localmente** antes de integrar
6. **Cite fontes** em comentários quando usar padrões específicos

### 💡 Exemplo de Citação em Código

```typescript
/**
 * Implementação baseada em AutoGen GroupChat pattern
 * @see https://github.com/microsoft/autogen
 * @see docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md
 */
export class LegalAgentOrchestrator {
  // ...implementation
}
```
# Configuração Vercel + GitHub

Este documento descreve apenas as configurações essenciais ativas para integração Vercel + GitHub.

## ✅ Configurações Ativas (vercel.json)

### 1. GitHub Integration

```json
"github": {
  "silent": true,              // Silencia comentários do bot Vercel em PRs
  "autoJobCancellation": true, // Cancela builds antigos automaticamente
  "deployment": true           // Habilita deployments via GitHub
}
```

**O que isso faz:**
- **silent**: Remove comentários repetitivos do bot Vercel em Pull Requests (reduz ruído)
- **autoJobCancellation**: Quando você faz múltiplos pushes seguidos, cancela builds antigos e mantém só o mais recente (economia de tempo/recursos)
- **deployment**: Mantém integração completa com GitHub (cada push = deploy automático)

### 2. Deploy Automático

- ✅ **Production**: Push na `main` → Deploy em `https://assistente-juridico-github.vercel.app/`
- ✅ **Preview**: Pull Request → URL única de preview (ex: `https://assistente-juridico-pr-123.vercel.app/`)
- ✅ **Rollback**: Reverter commit = rollback automático instantâneo

### 3. Variáveis de Ambiente Git

Estas variáveis são **auto-injetadas pelo Vercel** em cada deploy (não precisa configurar):

| Variável | Exemplo | Uso |
|----------|---------|-----|
| `VERCEL_GIT_PROVIDER` | `github` | Identificar provedor Git |
| `VERCEL_GIT_REPO_SLUG` | `assistente-jur-dico-principal` | Nome do repositório |
| `VERCEL_GIT_REPO_OWNER` | `thiagobodevanadv-alt` | Organização/usuário |
| `VERCEL_GIT_COMMIT_REF` | `main` ou `feat/nova-funcionalidade` | Branch atual |
| `VERCEL_GIT_COMMIT_SHA` | `fa1eade47b73...` | SHA do commit |
| `VERCEL_GIT_COMMIT_MESSAGE` | `fix: correção de bug` | Mensagem do commit |
| `VERCEL_GIT_COMMIT_AUTHOR_LOGIN` | `thiagobo` | Username GitHub |
| `VERCEL_GIT_PULL_REQUEST_ID` | `42` | Número do PR (se aplicável) |

**Como usar no código:**
```typescript
// Em qualquer serverless function (api/)
export default async function handler(req, res) {
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  const isProd = branch === 'main';

  if (!isProd) {
    console.log(`Preview deploy from branch: ${branch}`);
  }

  res.json({ branch, isProd });
}
```

## 🔒 Proteção de Forks

**Ativo por padrão** - PRs de forks externos exigem aprovação manual antes de deploy.

Protege contra:
- Vazamento de variáveis de ambiente (secrets)
- Execução de código malicioso
- Roubo do token OIDC

Para desativar (não recomendado): `Projeto → Settings → Security → Git Fork Protection`

## 📦 Cron Jobs Configurados

Crons executam em **horário de Brasília (GMT-3)**:

| Job | Horário | Frequência |
|-----|---------|------------|
| DJEN Monitor | 12:00, 20:00 | 2x/dia |
| DataJud Monitor | 16:00 | 1x/dia |
| Backup | 03:00 | 1x/dia |
| Process Agent Queue | A cada 15min | 96x/dia |
| Notifications | A cada 5min | 288x/dia |
| Calendar Sync | A cada 2h | 12x/dia |
| Deadline Alerts | 11:55 | 1x/dia |
| Watchdog | A cada 30min | 48x/dia |

## 🚀 Comandos Úteis

```bash
# Ver logs de produção
vercel logs https://assistente-juridico-github.vercel.app

# Ver logs de um PR específico
vercel logs https://assistente-juridico-pr-123.vercel.app

# Listar deployments
vercel ls

# Promover preview para produção
vercel promote <deployment-url>

# Rollback para deploy anterior
vercel rollback
```

## 📊 Permissões GitHub Concedidas

O Vercel possui as seguintes permissões no repositório:

### Repositório
- ✅ **Administration**: Criar repositórios de templates
- ✅ **Checks**: Adicionar verificações de build
- ✅ **Contents**: Ler/escrever código (templates)
- ✅ **Deployments**: Sincronizar status
- ✅ **Pull Requests**: Criar comentários e atualizações
- ✅ **Issues**: Interagir com PRs (GitHub requer ambos)
- ✅ **Metadata**: Ler metadados básicos
- ✅ **Webhooks**: Receber eventos Git
- ✅ **Commit Statuses**: Sincronizar status de commits

### Organização
- ✅ **Members** (read): Melhor UX de onboarding

### Usuário
- ✅ **Email addresses** (read): Associar email à conta

## 🔧 Troubleshooting

### Problema: "Repositório não aparece na lista"
**Solução**: Verifique se você tem permissão de **Colaborador** no repositório.

### Problema: "Deploy falha mas local funciona"
**Solução**: Verifique variáveis de ambiente no Vercel Dashboard (`Settings → Environment Variables`)

### Problema: "Comentários do bot Vercel aparecendo"
**Solução**: Já configurado `"silent": true` - comentários estão desabilitados.

### Problema: "Build cancelado automaticamente"
**Solução**: Comportamento esperado com `autoJobCancellation: true` - apenas o commit mais recente é buildado.

## 📚 Referências

- [Documentação Vercel + GitHub](https://vercel.com/docs/deployments/git/vercel-for-github)
- [Variáveis de Ambiente Git](https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables)
- [Configuração Git](https://vercel.com/docs/projects/project-configuration#git-configuration)

---

**Última atualização**: 24/12/2025
