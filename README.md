# Assistente Jurídico PJe

> Sistema de gestão jurídica inteligente com IA para escritórios de advocacia

## Status do Projeto

### GitHub Actions
[![CI](https://github.com/thiagobodevan-a11y/assistente-juridico-p/workflows/CI/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions/workflows/ci.yml)
[![Deploy](https://github.com/thiagobodevan-a11y/assistente-juridico-p/workflows/Deploy/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions/workflows/deploy.yml)
[![Code Quality](https://github.com/thiagobodevan-a11y/assistente-juridico-p/workflows/Code%20Quality/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions/workflows/code-quality.yml)
[![Security Scan](https://github.com/thiagobodevan-a11y/assistente-juridico-p/workflows/Security%20Scan/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions/workflows/security-scan.yml)
[![E2E Tests](https://github.com/thiagobodevan-a11y/assistente-juridico-p/workflows/Playwright%20E2E%20Tests/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/actions/workflows/e2e.yml)

### Project Info
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/thiagobodevan-a11y/assistente-juridico-p/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)

### GitLab CI/CD
[![GitLab Pipeline](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/badges/main/pipeline.svg)](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines)
[![GitLab Coverage](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/badges/main/coverage.svg)](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/graphs/main/charts)
[![GitLab Release](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/badges/release.svg)](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/releases)
[![GitLab SAST](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/badges/main/sast.svg)](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/security/dashboard)
[![GitLab Dependency Scanning](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/badges/main/dependency_scanning.svg)](https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/security/dashboard)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

## 💾 CONFIGURAÇÃO DE BANCO DE DADOS (UPSTASH)

**O Vercel KV foi descontinuado. Use o Upstash Redis:**

👉 **[UPSTASH_SETUP.md](./docs/UPSTASH_SETUP.md)** - Guia passo a passo para configurar o banco de dados Redis.

## 🦊 INTEGRAÇÃO GITLAB WORKFLOW NO VS CODE

**Configure o GitLab Workflow para CI/CD direto no VS Code:**

👉 **[GITLAB_QUICK_START.md](./GITLAB_QUICK_START.md)** - ⚡ Guia rápido (3 passos)  
👉 **[docs/GITLAB_VSCODE_GUIA.md](./docs/GITLAB_VSCODE_GUIA.md)** - 📚 Guia completo  
👉 **[docs/GITLAB_TROUBLESHOOTING.md](./docs/GITLAB_TROUBLESHOOTING.md)** - 🔧 Solução de problemas

**TL;DR**: Execute `./verify-gitlab-setup.sh` para verificar, depois `./add-gitlab-account.sh` e siga as instruções. Nunca use OAuth, sempre use PAT (Personal Access Token).

**Recursos disponíveis:**
- ✅ Ver status do pipeline na barra inferior do VS Code
- ✅ Criar/cancelar/retentar pipelines com um clique
- ✅ Ver logs de jobs CI/CD na sidebar
- ✅ Validar `.gitlab-ci.yml` antes de commitar
- ✅ Autocompletar variáveis CI/CD

## 🚀 PROBLEMAS COM DEPLOY? COMECE AQUI!

**Se você teve problemas ao fazer o deploy na Vercel:**

👉 **[GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)** - ⚡ Solução em 3 passos (5 min) ⭐  
👉 **[VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md)** - Checklist completo de variáveis  
👉 **[RESOLUCAO_DEPLOY.md](./RESOLUCAO_DEPLOY.md)** - Análise detalhada do problema

**TL;DR**: O build funciona! Você só precisa configurar 2 variáveis de ambiente na Vercel: `GITHUB_RUNTIME_PERMANENT_NAME` e `GITHUB_TOKEN`. Execute `./verificar-deploy.sh` para verificar tudo antes do deploy.

## 🔥 ERROS 403 OU PROBLEMAS DE CALLBACK? LEIA AQUI PRIMEIRO!

**Se você está vendo erros 403 Forbidden, "Failed to fetch KV key", ou problemas com GitHub App Callback URL:**

👉 **[CONFIGURACAO_GITHUB_APP_E_SPARK.md](./CONFIGURACAO_GITHUB_APP_E_SPARK.md)** - 🆕 Guia completo (25 min) ⭐  
👉 **[QUICK_FIX_403.md](./QUICK_FIX_403.md)** - Solução em 60 segundos  
👉 **[CORRECAO_RAPIDA_403.md](./CORRECAO_RAPIDA_403.md)** - Guia rápido (10 minutos)  
👉 **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Guia completo passo a passo

**TL;DR**: Você precisa configurar `GITHUB_TOKEN` e `GITHUB_RUNTIME_PERMANENT_NAME` nas variáveis de ambiente do Vercel + configurar Callback URL no GitHub App. Veja os guias acima.

## 🔑 CONFIGURAÇÃO OAUTH PARA VERCEL

**Se você está configurando o aplicativo no Vercel pela primeira vez:**

👉 **[CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md)** - Guia rápido com URLs prontas  
👉 **[VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md)** - Guia completo passo a passo

**TL;DR**: Configure o Google OAuth com as URLs corretas do Vercel em "Authorized JavaScript origins" no Google Cloud Console.

## 🚨 AVISO CRÍTICO - DEPLOYMENT VERCEL

**⚠️ LEIA [`REGRAS_VERCEL_DEPLOYMENT.md`](./REGRAS_VERCEL_DEPLOYMENT.md) ANTES DE ALTERAR O `vercel.json`**

**REGRA FUNDAMENTAL**: Se `rewrites`, `redirects`, `headers`, `cleanUrls` ou `trailingSlash` estão sendo usados, então `routes` NÃO PODE estar presente.

❌ **NUNCA faça isso** (quebra o deploy):
```json
{
  "rewrites": [...],
  "routes": [...]     // ← ERRO FATAL!
}
```

✅ **Configuração atual funciona** - não altere sem ler as regras completas.

---

Um sistema completo de gestão para escritórios de advocacia com foco em automação, inteligência artificial, e experiência do usuário profissional.

## 🚀 Características Principais

- **Dashboard Inteligente**: Visão consolidada de processos, tarefas e métricas
- **Gestão de Processos**: Kanban visual com drag & drop
- **IA Assistente (Harvey Specter)**: Chatbot jurídico com contexto processual
- **Agentes IA Autônomos**: 15 agentes especializados trabalhando 24/7
- **Integração DJEN/DataJud**: Monitoramento automático de publicações
- **Google Calendar**: Sincronização bidirecional de eventos ([documentação completa](GOOGLE_CALENDAR_INTEGRATION.md))
- **Gestão Financeira**: Controle completo de honorários e despesas
- **Calculadora de Prazos**: Cálculo preciso com feriados e dias úteis

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Google Cloud (para OAuth)

## ⚙️ Configuração Inicial

### 1. Clone e Instale

```bash
git clone <repository-url>
cd assistente-juridico-pje
npm install
```

### 2. Configure OAuth (Obrigatório)

Este aplicativo requer credenciais Google OAuth para autenticação.

**⚠️ IMPORTANTE: Nunca commit credenciais no Git!**

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite .env e adicione suas credenciais
# VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui
# VITE_REDIRECT_URI=http://localhost:5173
```

📖 **Guias de configuração:**
- **Para desenvolvimento local:** Veja [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- **Para deploy no Vercel:** Veja [VERCEL_OAUTH_SETUP.md](./VERCEL_OAUTH_SETUP.md) ou [CONFIGURACAO_RAPIDA_VERCEL.md](./CONFIGURACAO_RAPIDA_VERCEL.md)

### 3. Execute o Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 🔐 Segurança

Este projeto implementa boas práticas de segurança:

- ✅ Credenciais OAuth via variáveis de ambiente
- ✅ Nunca expõe client secrets no código
- ✅ `.env` no `.gitignore`
- ✅ Validação de configuração na inicialização

**Nunca:**
- ❌ Faça commit de credenciais no Git
- ❌ Compartilhe client secrets em chat/email
- ❌ Use credenciais de produção em desenvolvimento

Veja `SECURITY.md` para mais informações.

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── ProcessCRM.tsx   # Gestão Kanban
│   ├── AIAgents.tsx     # Painel de agentes
│   ├── GoogleAuth.tsx   # Autenticação Google
│   └── ...
├── hooks/
│   └── use-autonomous-agents.ts
├── lib/
│   ├── config.ts        # Configuração centralizada
│   └── utils.ts
└── index.css            # Tema e estilos
```

## 📖 Documentação

### Guias Essenciais
- 🚀 `GITHUB_ACTIONS_DEPLOY_GUIDE.md` - **Guia completo de CI/CD e Deploy Automático** ⭐
- 🚀 `GUIA_DEPLOY_SIMPLES.md` - **Guia rápido de deploy no Vercel**
- 🤖 `GITHUB_COPILOT_AGENT.md` - **Configuração do GitHub Copilot agent**
- 🔧 `CORRECAO_403_VERCEL_JSON.md` - **Correção definitiva dos erros 403** ✅ 🆕
- 🔧 `MIGRACAO_VERCEL_KV.md` - **Migração para Vercel KV (código e hooks)** 🆕

### CI/CD e Deploy
- 🔑 `CONFIGURACAO_VERCEL_TOKEN.md` - **Configuração do token Vercel para deploy automático** 🆕 ⭐
- 📋 `GITHUB_SECRETS_CHECKLIST.md` - **Checklist rápido para configurar secrets** 🆕 ⭐
- `GITHUB_ACTIONS_DEPLOY_GUIDE.md` - Guia completo de CI/CD
- `GITHUB_ACTIONS_CONFIGURADO.md` - Setup inicial do GitHub Actions
- `GITHUB_ACTIONS_CORRECOES.md` - Correções e melhorias aplicadas
- `VERCEL_DEPLOYMENT.md` - Documentação completa do deploy no Vercel
- `DEPLOYMENT_FIX_COMPLETE.md` - Solução de problemas de deployment
- `VERCEL_KV_SETUP.md` - Configuração do Vercel KV storage

### Funcionalidades
- `GOOGLE_CALENDAR_INTEGRATION.md` - Integração Google Calendar
- `DJEN_DOCUMENTATION.md` - Integração DJEN/DataJud
- `PREMONICAO_JURIDICA.md` - Sistema de premonição jurídica
- `MULTI_SOURCE_PUBLICATIONS.md` - Publicações multi-fonte

### Configuração
- `OAUTH_SETUP.md` - Guia de configuração OAuth
- `PRD.md` - Documento de requisitos do produto
- `SECURITY.md` - Políticas de segurança
- `QUICKSTART.md` - Início rápido

## 🎨 Stack Tecnológica

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **State**: Custom KV hook + Vercel KV (localStorage em dev)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **AI**: Spark LLM (GPT-4)
- **Animation**: Framer Motion

## 🚧 Desenvolvimento

### Acesso Demo

Para desenvolvimento rápido, use as contas demo:

- **Admin**: `admin / admin123`
- **Demo**: `demo / demo`
- **Teste**: `usuario / 123456`

### Comandos Úteis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview do build
npm run lint         # Lint código
```

## 🌐 Deploy

### 🚀 COMECE AQUI: Escolha Sua Plataforma

**Não sabe qual plataforma usar?**

👉 **[ESCOLHA_PLATAFORMA_DEPLOY.md](./ESCOLHA_PLATAFORMA_DEPLOY.md)** - ⚡ Decisão em 30 segundos ⭐

**TL;DR:**
- **Vercel**: Melhor performance, já configurado
- **Render**: 100% grátis, sem cartão (com sleep)
- **Netlify**: CDN global, super rápido
- **Railway**: $5/mês grátis + PostgreSQL

📊 [Ver comparação completa](./PLATAFORMAS_DEPLOY_GRATIS.md)

---

### ⚡ Deploy Automático (GitHub Actions + Vercel)

Este projeto possui **deploy automático** configurado com GitHub Actions:

✅ **Deploy em Produção**: Automático ao fazer merge na branch `main`  
✅ **Deploy Preview**: Automático em cada Pull Request  
✅ **Deploy Manual**: Via workflow_dispatch no GitHub Actions

**Para configurar:**
1. Configure os secrets necessários no GitHub (Settings → Secrets → Actions)
2. Conecte o repositório ao Vercel
3. Pronto! Deploys automáticos em cada push

📖 **Guia completo**: Veja `GITHUB_ACTIONS_DEPLOY_GUIDE.md` para instruções detalhadas

### Vercel (Recomendado) ⭐

**Deploy com 1 clique:**
1. Conecte sua conta do GitHub ao [Vercel](https://vercel.com)
2. Importe este repositório
3. Configure as variáveis de ambiente (veja abaixo)
4. Deploy!

**Variáveis de ambiente necessárias:**
```
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
GITHUB_TOKEN=seu_token_github
VITE_GOOGLE_CLIENT_ID=seu_client_id
VITE_GOOGLE_API_KEY=sua_api_key
VITE_REDIRECT_URI=https://seu-app.vercel.app
VITE_APP_ENV=production
```

**⚠️ IMPORTANTE: Configure o Vercel KV Storage**

Para evitar erros 403 no armazenamento, você **deve** configurar o Vercel KV:

1. No Vercel Dashboard: **Storage** → **Create Database** → **KV**
2. Nome: `assistente-juridico-kv`
3. Região: São Paulo (GRU) ou mais próxima
4. **Connect Project** → Selecione seu projeto
5. Ambientes: Production, Preview, Development

As variáveis `KV_REST_API_URL`, `KV_REST_API_TOKEN` e `KV_REST_API_READ_ONLY_TOKEN` serão automaticamente injetadas pelo Vercel.

📖 **Guia de correção 403**: Ver `CORRECAO_403_VERCEL_JSON.md` para detalhes completos

📖 **Guias de deploy**: 
- `GITHUB_ACTIONS_DEPLOY_GUIDE.md` - Deploy automático (recomendado)
- `GUIA_DEPLOY_SIMPLES.md` - Deploy manual
- `VERCEL_DEPLOYMENT.md` - Documentação completa
- `VERSIONAMENTO.md` - Guia de versionamento e releases

## 🏷️ Versionamento e Releases

Este projeto segue o [Versionamento Semântico](https://semver.org/lang/pt-BR/) e possui **releases automáticas** via GitHub Actions.

**Versão Atual:** `v1.0.0` 🎉

### Como fazer uma nova release

```bash
# 1. Atualize o CHANGELOG.md
# 2. Atualize a versão no package.json
npm version [major|minor|patch]

# 3. Faça push da tag (isso aciona deploy automático!)
git push origin main
git push origin v1.x.x
```

O GitHub Actions automaticamente:
- ✅ Executa testes e build
- ✅ Cria GitHub Release com notas do CHANGELOG
- ✅ Faz deploy para produção no Vercel
- ✅ Gera arquivo ZIP da aplicação

📖 **Guia completo**: Veja [`VERSIONAMENTO.md`](./VERSIONAMENTO.md) para detalhes

### Histórico de Versões

- **v1.0.0** (2025-11-18) - Primeira versão estável oficial
  - Dashboard inteligente com 15 agentes IA autônomos
  - Integrações DJEN/DataJud e Google Calendar
  - Sistema completo de gestão jurídica
  - Ver [CHANGELOG.md](./CHANGELOG.md) para detalhes completos


### 🌐 Outras Plataformas Gratuitas

Além do Vercel, você pode usar outras plataformas 100% gratuitas:

#### Render (100% Gratuito)

Deploy automático com `render.yaml` já configurado!

👉 **[GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)** - Guia completo passo a passo (15 min) ⭐

**TL;DR:**
- Conecte ao GitHub
- Configure variáveis de ambiente
- Deploy automático a cada push
- ⚠️ App "dorme" após 15 min de inatividade

#### Netlify (Recomendado para Sites Estáticos)

Deploy super rápido com CDN global!

👉 **[GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)** - Guia completo com CLI e interface

**TL;DR:**
- Arquivo `netlify.toml` já configurado
- SSL automático
- Preview de PRs
- 100 GB/mês de banda grátis

#### Railway ($5/mês grátis)

Melhor se precisar de PostgreSQL grátis!

👉 **[GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)** - Guia completo

**TL;DR:**
- $5/mês em créditos grátis
- PostgreSQL incluído
- App sempre ativo (sem sleep)
- Requer cartão (não cobra)

#### 📊 Comparação de Plataformas

Não sabe qual escolher? Veja a comparação completa:

👉 **[PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md)** - Comparação detalhada ⭐

Inclui: Vercel, Render, Netlify, Railway, Fly.io, Cloudflare Pages

### Compatibilidade

Este app é compatível com qualquer plataforma que suporte aplicações React/Vite:
- ✅ Vercel (recomendado)
- ✅ Render
- ✅ Netlify
- ✅ Railway
- ✅ Fly.io
- ✅ Cloudflare Pages
- ✅ GitHub Pages (com algumas limitações)
- ✅ Qualquer host de SPA

## 🧹 Começando do Zero?

Se você está explorando e quer começar do zero:

- Simplesmente delete seu Spark
- Tudo será limpo sem deixar rastros

## 📄 Licença

MIT License - Copyright GitHub, Inc.
