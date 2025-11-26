# Assistente Jurídico PJe

Sistema inteligente de gestão jurídica com IA integrada para **Thiago Bodevan Veiga - OAB/MG 184.404**.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Configuração do Advogado](#-configuração-do-advogado)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Endpoints da API](#-endpoints-da-api)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Sistema DJEN/DataJud](#-sistema-djendatajud)
- [Sistema de Notificações](#-sistema-de-notificações)
- [Cron Jobs](#-cron-jobs)
- [Como Reconstruir](#-como-reconstruir)
- [Comandos Úteis](#-comandos-úteis)

---

## 🎯 Visão Geral

Sistema completo de gestão jurídica com:

- 🤖 **IA Jurídica**: Chatbot Harvey Specter com GPT-4
- 📋 **CRM Jurídico**: Kanban para gestão de processos
- 📅 **Calculadora de Prazos**: Automação de prazos processuais
- 🔗 **Google Calendar**: Sincronização automática de prazos
- 📊 **DJEN/DataJud**: Monitoramento automático de publicações
- 💰 **Gestão Financeira**: Controle de custos e honorários
- ⚡ **7 Agentes Autônomos**: Trabalhando 24/7
- 📧 **Notificações**: Email e webhooks (Slack/Discord/Teams)

---

## 👤 Configuração do Advogado

### Dados Cadastrados

| Campo | Valor |
|-------|-------|
| **Nome** | Thiago Bodevan Veiga |
| **OAB** | 184.404 |
| **UF** | MG (Minas Gerais) |
| **Email** | thiagobodevan@gmail.com |
| **Tribunais Monitorados** | TJMG, TRF1, TST, TRT3 |
| **Status** | ✅ Ativo |

### Comando para Recadastrar

```bash
curl -X POST "https://assistente-juridico-github.vercel.app/api/lawyers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thiago Bodevan Veiga",
    "oab": "184404",
    "oabUF": "MG",
    "email": "thiagobodevan@gmail.com",
    "enabled": true,
    "tribunals": ["TJMG", "TRF1", "TST", "TRT3"]
  }'
```

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Frontend** | React + TypeScript | 19 |
| **Build Tool** | Vite | 6 |
| **Styling** | Tailwind CSS | v4 |
| **UI Components** | shadcn/ui + Radix UI | v4 |
| **Icons** | Phosphor Icons + Lucide | - |
| **State** | Spark KV (useKV hook) | - |
| **Forms** | React Hook Form + Zod | - |
| **AI** | Spark LLM (GPT-4) | - |
| **Database** | Upstash Redis (KV) | - |
| **Deployment** | Vercel | - |
| **Email** | Resend API | - |

### Estrutura de Pastas

```
assistente-juridico-p/
├── api/                    # Serverless Functions (Vercel)
│   ├── cron.ts            # Cron jobs (DJEN monitor, reset diário)
│   ├── notifications.ts   # Sistema de notificações
│   ├── lawyers.ts         # CRUD advogados monitorados
│   ├── expedientes.ts     # Publicações DJEN
│   ├── llm-proxy.ts       # Proxy para Spark LLM
│   ├── kv.ts              # Proxy para Spark KV
│   └── status.ts          # Health check
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # shadcn/ui (não modificar)
│   │   ├── Dashboard.tsx # Dashboard principal
│   │   ├── DJENPublicationsWidget.tsx # Widget publicações
│   │   ├── ProcessCRM.tsx # Kanban processos
│   │   ├── AIAgents.tsx  # Painel de agentes IA
│   │   └── ...
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilitários
│   │   └── config.ts     # Configuração centralizada
│   ├── types.ts          # Tipos TypeScript
│   └── App.tsx           # Componente principal
├── vercel.json           # Configuração Vercel + Crons
└── .env                  # Variáveis de ambiente (local)
```

---

## 🔌 Endpoints da API

### Base URL
```
https://assistente-juridico-github.vercel.app/api
```

### Advogados Monitorados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/lawyers` | Lista todos os advogados |
| `POST` | `/lawyers` | Adiciona novo advogado |
| `PUT` | `/lawyers?id={id}` | Atualiza advogado |
| `DELETE` | `/lawyers?id={id}` | Remove advogado |

**Exemplo - Adicionar Advogado:**
```bash
curl -X POST "https://assistente-juridico-github.vercel.app/api/lawyers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nome Completo",
    "oab": "123456",
    "oabUF": "MG",
    "email": "email@exemplo.com",
    "enabled": true,
    "tribunals": ["TJMG", "TRF1"]
  }'
```

### Publicações DJEN

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/expedientes` | Lista publicações capturadas |
| `GET` | `/expedientes?lawyerId={id}` | Publicações de um advogado |

**Exemplo:**
```bash
curl "https://assistente-juridico-github.vercel.app/api/expedientes"
```

### Notificações

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/notifications` | Lista notificações pendentes |
| `POST` | `/notifications/send` | Envia notificação manual |
| `POST` | `/notifications/webhook` | Configura webhook |

**Exemplo - Enviar Notificação:**
```bash
curl -X POST "https://assistente-juridico-github.vercel.app/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "custom",
    "title": "Teste de Notificação",
    "message": "Esta é uma mensagem de teste",
    "priority": "normal"
  }'
```

### Cron Jobs (Protegidos)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/cron?action=djen-monitor` | Executa monitoramento DJEN |
| `POST` | `/cron?action=daily-reset` | Reset diário de contadores |

> ⚠️ Estes endpoints são protegidos e só podem ser chamados pelo Vercel Cron ou com `CRON_SECRET`.

### Status/Health Check

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/status` | Health check do sistema |

**Exemplo:**
```bash
curl "https://assistente-juridico-github.vercel.app/api/status"
```

---

## 🔐 Variáveis de Ambiente

### Obrigatórias (Vercel)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `UPSTASH_REDIS_REST_URL` | URL do Redis Upstash | `https://xyz.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Token do Redis | `AXxx...` |
| `NOTIFICATION_EMAIL` | Email padrão para notificações | `thiagobodevan@gmail.com` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |

### Opcionais

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `RESEND_API_KEY` | API Key do Resend para emails | `re_xxx` |
| `SLACK_WEBHOOK_URL` | Webhook do Slack | `https://hooks.slack.com/...` |
| `DISCORD_WEBHOOK_URL` | Webhook do Discord | `https://discord.com/api/webhooks/...` |
| `GITHUB_TOKEN` | Token GitHub para integrações | `ghp_xxx` |
| `CRON_SECRET` | Secret para proteger cron jobs | `random-string` |

### Configurar no Vercel

```bash
# Via CLI
vercel env add NOTIFICATION_EMAIL production
# Digite: thiagobodevan@gmail.com

# Listar todas
vercel env ls
```

### Configurar Localmente (.env)

```env
VITE_GOOGLE_CLIENT_ID=572929400457-xxx.apps.googleusercontent.com
VITE_REDIRECT_URI=http://localhost:5173
VITE_APP_ENV=development
NOTIFICATION_EMAIL=thiagobodevan@gmail.com
```

---

## 📊 Sistema DJEN/DataJud

### Como Funciona

1. **Cron Job** roda às **09:00 UTC** (06:00 BRT)
2. Consulta a API DJEN para cada advogado monitorado
3. Filtra publicações por **nome** e **número OAB**
4. Armazena novas publicações no Redis
5. Dispara notificações (email/webhook)
6. Exibe no Dashboard via `DJENPublicationsWidget`

### API DJEN

```
Base URL: https://comunicaapi.pje.jus.br/api/v1/comunicacao
```

**Parâmetros de Busca:**
- `numeroOab`: Número da OAB (ex: `184404`)
- `ufOab`: Estado da OAB (ex: `MG`)
- `nomeAdvogado`: Nome completo ou parcial
- `siglaTribunal`: Tribunal específico (ex: `TJMG`)

### Tribunais Suportados

| Sigla | Nome |
|-------|------|
| TJMG | Tribunal de Justiça de Minas Gerais |
| TRF1 | Tribunal Regional Federal da 1ª Região |
| TST | Tribunal Superior do Trabalho |
| TRT3 | Tribunal Regional do Trabalho da 3ª Região |
| STJ | Superior Tribunal de Justiça |
| STF | Supremo Tribunal Federal |

### Estrutura de Publicação Armazenada

```typescript
interface StoredPublication {
  id: string;
  djenId?: number;
  tribunal: string;           // Ex: "TJMG"
  data: string;               // Data da publicação
  tipo: string;               // Tipo de comunicação
  teor: string;               // Conteúdo/texto
  numeroProcesso?: string;    // Número CNJ
  orgao?: string;             // Órgão emissor
  meio?: string;              // Meio de publicação
  link?: string;              // Link para o documento
  hash?: string;              // Hash para deduplicação
  matchType: 'nome' | 'oab' | 'ambos';
  lawyerId: string;
  lawyerName?: string;
  lawyerOAB?: string;
  notified: boolean;
  createdAt: string;
}
```

---

## 📧 Sistema de Notificações

### Canais Suportados

| Canal | Configuração | Status |
|-------|--------------|--------|
| **Email** | `RESEND_API_KEY` + `NOTIFICATION_EMAIL` | ⚠️ Configurar Resend |
| **Slack** | Webhook URL | ✅ Pronto |
| **Discord** | Webhook URL | ✅ Pronto |
| **Microsoft Teams** | Webhook URL | ✅ Pronto |
| **Webhook Genérico** | URL + Secret opcional | ✅ Pronto |

### Configurar Email (Resend)

1. Criar conta em [resend.com](https://resend.com)
2. Criar API Key
3. Adicionar no Vercel:
```bash
vercel env add RESEND_API_KEY production
# Cole: re_xxxxxxxxx
```

### Configurar Webhook Slack

1. Criar Incoming Webhook no Slack
2. Chamar API para registrar:
```bash
curl -X POST "https://assistente-juridico-github.vercel.app/api/notifications/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Jurídico",
    "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
    "type": "slack",
    "enabled": true,
    "events": ["new_publication", "deadline_reminder"]
  }'
```

### Prioridades de Notificação

| Prioridade | Descrição | Emoji |
|------------|-----------|-------|
| `low` | Informativo | ℹ️ |
| `normal` | Padrão | 📢 |
| `high` | Importante | ⚠️ |
| `urgent` | Urgente | 🚨 |

---

## ⏰ Cron Jobs

### Configuração (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron?action=djen-monitor",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron?action=daily-reset",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Horários

| Job | Schedule | Horário UTC | Horário BRT |
|-----|----------|-------------|-------------|
| **DJEN Monitor** | `0 9 * * *` | 09:00 | 06:00 |
| **Daily Reset** | `0 0 * * *` | 00:00 | 21:00 (dia anterior) |

### O que cada Job faz

**DJEN Monitor:**
1. Carrega lista de advogados monitorados
2. Para cada advogado ativo:
   - Consulta API DJEN por nome e OAB
   - Filtra por tribunais configurados
   - Verifica duplicatas via hash SHA256
   - Armazena novas publicações
   - Dispara notificações
3. Atualiza timestamp da última verificação

**Daily Reset:**
1. Reseta contadores diários dos agentes
2. Limpa cache expirado
3. Arquiva tarefas antigas

---

## 🔧 Como Reconstruir

### 1. Clonar Repositório

```bash
git clone https://github.com/thiagobodevan-a11y/assistente-juridico-p.git
cd assistente-juridico-p
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis Locais

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 4. Rodar Localmente

```bash
npm run dev
# Acesse: http://localhost:5173
```

### 5. Deploy no Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 6. Configurar Variáveis no Vercel

```bash
# Redis Upstash (obrigatório)
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Notificações
vercel env add NOTIFICATION_EMAIL production
# Digite: thiagobodevan@gmail.com

# Email (opcional)
vercel env add RESEND_API_KEY production
```

### 7. Cadastrar Advogado

```bash
curl -X POST "https://SEU-DOMINIO.vercel.app/api/lawyers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thiago Bodevan Veiga",
    "oab": "184404",
    "oabUF": "MG",
    "email": "thiagobodevan@gmail.com",
    "enabled": true,
    "tribunals": ["TJMG", "TRF1", "TST", "TRT3"]
  }'
```

### 8. Verificar Status

```bash
# Health check
curl "https://SEU-DOMINIO.vercel.app/api/status"

# Advogados cadastrados
curl "https://SEU-DOMINIO.vercel.app/api/lawyers"

# Publicações
curl "https://SEU-DOMINIO.vercel.app/api/expedientes"
```

---

## 💻 Comandos Úteis

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Vercel CLI

```bash
# Login
vercel login

# Deploy preview
vercel

# Deploy produção
vercel --prod

# Ver logs
vercel logs

# Listar variáveis
vercel env ls

# Adicionar variável
vercel env add NOME_VAR production
```

### Monitoramento

```bash
# Status do sistema
curl "https://assistente-juridico-github.vercel.app/api/status"

# Advogados monitorados
curl "https://assistente-juridico-github.vercel.app/api/lawyers"

# Publicações capturadas
curl "https://assistente-juridico-github.vercel.app/api/expedientes"

# Notificações pendentes
curl "https://assistente-juridico-github.vercel.app/api/notifications"
```

### Git

```bash
# Commit e push
git add -A && git commit -m "descrição" && git push

# Ver status
git status

# Ver logs
git log --oneline -10
```

---

## 🔑 Chaves de Armazenamento (Redis)

| Chave | Descrição |
|-------|-----------|
| `monitored-lawyers` | Lista de advogados monitorados |
| `publications:{lawyerId}` | Publicações por advogado |
| `publication-hashes:{lawyerId}` | Hashes para deduplicação |
| `notification-queue` | Fila de notificações |
| `notification-settings` | Configurações de notificação |
| `configured-webhooks` | Webhooks configurados |
| `last-djen-check` | Timestamp última verificação |
| `autonomous-agents` | Estado dos agentes IA |
| `completed-agent-tasks` | Tarefas completadas |
| `djen-cache` | Cache de consultas DJEN |

---

## 📞 Suporte

- **Repositório**: https://github.com/thiagobodevan-a11y/assistente-juridico-p
- **Deploy**: https://assistente-juridico-github.vercel.app
- **Advogado**: Thiago Bodevan Veiga - OAB/MG 184.404
- **Email**: thiagobodevan@gmail.com

---

## 📄 Licença

MIT License - Veja [LICENSE](LICENSE) para detalhes.

---

*Última atualização: 26 de Novembro de 2025*
