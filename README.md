# Assistente Jurídico PJe

> Sistema de gestão jurídica inteligente com IA para escritórios de advocacia

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

- `GUIA_DEPLOY_SIMPLES.md` - **Guia rápido de deploy no Vercel** ⭐
- `VERCEL_DEPLOYMENT.md` - Documentação completa do deploy no Vercel
- `PRD.md` - Documento de requisitos do produto
- `OAUTH_SETUP.md` - Guia de configuração OAuth
- `GOOGLE_CALENDAR_INTEGRATION.md` - Integração Google Calendar
- `SECURITY.md` - Políticas de segurança
- `DJEN_DOCUMENTATION.md` - Integração DJEN
- `PREMONICAO_JURIDICA.md` - Sistema de premonição

## 🎨 Stack Tecnológica

- **Framework**: React 19 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **State**: Spark KV (useKV hook)
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

## 🤖 CI/CD com GitHub Actions

Este projeto utiliza GitHub Actions para automação completa de CI/CD:

**Workflows disponíveis:**
- ✅ **CI**: Build, lint e testes automáticos em cada push/PR
- 🚀 **Deploy**: Deploy automático para Vercel na branch main
- 🔍 **Code Quality**: Análise de código com CodeQL e verificações de segurança
- 📋 **PR Validation**: Validação automática de Pull Requests
- 🏷️ **Release**: Criação automática de releases e tags
- 🌙 **Nightly**: Builds noturnos e verificação de dependências

📖 **Documentação completa**: [GitHub Actions Workflows](.github/WORKFLOWS.md)

**Status badges:**
```markdown
![CI](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/workflows/CI/badge.svg)
![Deploy](https://github.com/thiagobodevan-a11y/assistente-jurdico-p/workflows/Deploy/badge.svg)
```

## 🌐 Deploy

### Vercel (Recomendado) ⭐

**Deploy automático via GitHub Actions:**
- Push na branch `main` → Deploy automático
- Configure os secrets necessários (veja documentação)

**Deploy manual:**
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

**Secrets para GitHub Actions:**
```
VERCEL_TOKEN          # Token do Vercel CLI
VERCEL_ORG_ID         # ID da organização
VERCEL_PROJECT_ID     # ID do projeto
```

📖 **Guias de deploy**: 
- [GitHub Actions](.github/WORKFLOWS.md)
- [Vercel Deploy](GUIA_DEPLOY_SIMPLES.md)
- [Documentação Completa](VERCEL_DEPLOYMENT.md)

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
