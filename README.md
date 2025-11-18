# Assistente Jurídico PJe

> Sistema de gestão jurídica inteligente com IA para escritórios de advocacia

[![CI](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/workflows/CI/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/actions/workflows/ci.yml)
[![Deploy](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/workflows/Deploy/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/actions/workflows/deploy.yml)
[![Code Quality](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/workflows/Code%20Quality/badge.svg)](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/actions/workflows/code-quality.yml)

## 🔥 ERROS 403? LEIA AQUI PRIMEIRO!

**Se você está vendo erros 403 Forbidden ou "Failed to fetch KV key":**

👉 **[QUICK_FIX_403.md](./QUICK_FIX_403.md)** - Solução em 60 segundos  
👉 **[CORRECAO_RAPIDA_403.md](./CORRECAO_RAPIDA_403.md)** - Guia rápido (10 minutos)  
👉 **[VERCEL_ENV_SETUP.md](./VERCEL_ENV_SETUP.md)** - Guia completo passo a passo

**TL;DR**: Você precisa configurar `GITHUB_TOKEN` e `GITHUB_RUNTIME_PERMANENT_NAME` nas variáveis de ambiente do Vercel. Veja os guias acima.

---

Um sistema completo de gestão para escritórios de advocacia com foco em automação, inteligência artificial, e experiência do usuário profissional.

## 🚀 Características Principais

- **Dashboard Inteligente**: Visão consolidada de processos, tarefas e métricas
- **Gestão de Processos**: Kanban visual com drag & drop
- **IA Assistente (Harvey Specter)**: Chatbot jurídico com contexto processual
- **Agentes IA Autônomos**: 7 agentes especializados trabalhando 24/7
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

📖 **Guia completo de configuração**: Veja `OAUTH_SETUP.md`

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

### Render (Alternativa)

Se preferir usar Render ao invés de Vercel:

1. Configure variáveis de ambiente no dashboard:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_REDIRECT_URI`
   - `VITE_APP_ENV=production`

2. Adicione URI de produção no Google Cloud Console

3. Deploy automático via Git push

**Build & Start:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start` (serves static files on port 10000)

### Outras Plataformas

Compatível com Vercel, Netlify, e qualquer host de SPA.

## 🧹 Começando do Zero?

Se você está explorando e quer começar do zero:

- Simplesmente delete seu Spark
- Tudo será limpo sem deixar rastros

## 📄 Licença

MIT License - Copyright GitHub, Inc.
