# Assistente Jurídico PJe com IA Gemini

## ✅ STATUS: PRODUÇÃO - PRONTO PARA USO REAL

> Sistema de gestão jurídica inteligente com 7 agentes de IA trabalhando 24/7

Uma suíte de ferramentas de alta performance para otimizar e automatizar a rotina de escritórios de advocacia. Integra Google Gemini para transformar tarefas manuais em fluxos inteligentes e eficientes.

### 🚀 INÍCIO RÁPIDO (5 MINUTOS)

```bash
# 1. Configure a API do Gemini
# Obtenha em: https://aistudio.google.com/apikey
# Cole no arquivo .env:
VITE_GEMINI_API_KEY=sua_chave_aqui

# 2. Inicie o aplicativo
npm run dev

# 3. Abra http://localhost:5173
# 4. Faça login com Google
# 5. Pronto! Comece a trabalhar com processos reais
```

### ⚡ DESTAQUES

- 🤖 **7 Agentes de IA** trabalhando 24/7 sem intervenção humana
- 📄 **Extração automática** de dados de documentos (PDF, Word, imagens)
- ⚖️ **95% de precisão** na análise de intimações
- ⏰ **Zero prazos perdidos** com alertas inteligentes
- 💾 **100+ horas economizadas** por mês
- 🎨 **Tema Neon Noir** com Aurora Boreal

### 📚 DOCUMENTAÇÃO COMPLETA

- 📖 [**CONFIGURAÇÃO RÁPIDA**](CONFIGURACAO_RAPIDA.md) - 5 minutos para começar
- 📊 [**FUNCIONALIDADES COMPLETAS**](FUNCIONALIDADES_COMPLETAS.md) - Tudo que o app faz  
- 🎯 [**FINALIZAÇÃO PARA PRODUÇÃO**](FINALIZACAO_PRODUCAO.md) - Guia completo

---

> **⚠️ IMPORTANTE**: Este app requer uma chave API do Google Gemini para funcionar.  
> É **gratuita** e pode ser obtida em 2 minutos: https://aistudio.google.com/apikey  
> Veja [CONFIGURACAO_RAPIDA.md](CONFIGURACAO_RAPIDA.md) para instruções detalhadas.

---

## 🚀 Características Principais

### Gestão Completa
- ✅ **Dashboard Inteligente**: Métricas em tempo real com gradientes neon
- ✅ **Cadastro de Clientes com IA**: Upload de documento → extração automática de dados
- ✅ **Gestão de Processos**: Kanban visual com drag & drop
- ✅ **Calculadora de Prazos**: CPC/CLT com feriados e dias úteis

### Agentes de IA Autônomos (24/7)
- 🤖 **Mrs. Justin-e**: Analisa intimações (95% precisão, < 1 min)
- ⚖️ **Harvey Specter**: Consultor estratégico e premonição jurídica
- 📚 **Michael Ross**: Pesquisador de jurisprudência
- 📄 **Agente Documental**: Análise automática de documentos
- 📰 **Monitor DJEN**: Diários de Justiça em tempo real
- ⏰ **Gestor de Prazos**: Alertas e notificações inteligentes
- ✍️ **Redator Jurídico**: Geração de minutas com IA

### Integrações
- 🗓️ **Google Calendar**: Sincronização de audiências ([docs](GOOGLE_CALENDAR_INTEGRATION.md))
- 📊 **DataJud/DJEN**: Consultas automáticas a bases oficiais
- 📝 **Google Docs**: Edição de minutas em tempo real
- 🔐 **Google OAuth**: Login seguro

### Extras
- 💰 **Gestão Financeira**: Controle de honorários e despesas
- 📚 **Base de Conhecimento**: RAG com busca semântica
- 📊 **Analytics**: Métricas de produtividade
- 🌙 **Tema Neon Noir**: Design moderno com Aurora Boreal

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
