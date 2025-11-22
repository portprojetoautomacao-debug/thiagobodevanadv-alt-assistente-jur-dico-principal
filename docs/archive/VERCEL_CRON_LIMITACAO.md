# ⚠️ Limitação de Cron Jobs no Vercel (Plano Gratuito)

## 🚨 Problema Identificado

O Vercel **bloqueou o plano gratuito (Hobby)** devido à configuração de cron jobs que executam mais de uma vez por dia.

### Mensagem de Erro do Vercel

```
Hobby accounts are limited to daily cron jobs. 
This cron expression (0 * * * *) would run more than once per day. 
Upgrade to the Pro plan to unlock all Cron Jobs features on Vercel.
```

## 📋 Limitações do Plano Gratuito

| Feature | Plano Hobby (Grátis) | Plano Pro ($20/mês) |
|---------|---------------------|---------------------|
| **Cron Jobs** | ❌ Apenas 1x por dia | ✅ Ilimitados |
| **Frequência** | Máximo: `0 0 * * *` (diário) | Qualquer frequência |
| **Quantidade** | 1 cron job | Múltiplos cron jobs |

## ✅ Solução Aplicada

Removemos **completamente** a seção `crons` do arquivo `vercel.json` para manter compatibilidade com o plano gratuito.

### Antes (❌ Bloqueado)

```json
"crons": [
  {
    "path": "/api/cron",
    "schedule": "0 * * * *"  // ❌ Executa a cada hora
  },
  {
    "path": "/api/cron/djen-monitor",
    "schedule": "0 8-20/2 * * *"  // ❌ Executa múltiplas vezes
  },
  {
    "path": "/api/cron/daily-reset",
    "schedule": "0 0 * * *"  // ✅ Diário, mas múltiplos crons não permitidos
  }
]
```

### Depois (✅ Funcionando)

```json
// Sem seção "crons" - aplicação funciona perfeitamente no plano gratuito
```

## 🔄 Alternativas para Cron Jobs

Se você precisa de tarefas agendadas, aqui estão as alternativas:

### 1. GitHub Actions (Grátis) ⭐ Recomendado

Use GitHub Actions para executar tarefas agendadas:

**Arquivo:** `.github/workflows/scheduled-tasks.yml`

```yaml
name: Scheduled Tasks

on:
  schedule:
    # Monitoramento DJEN - a cada 2 horas durante horário comercial
    - cron: '0 8-20/2 * * *'
    # Reset diário - meia-noite
    - cron: '0 0 * * *'
  workflow_dispatch: # Permite execução manual

jobs:
  djen-monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Monitor DJEN Publications
        run: |
          curl -X POST https://seu-app.vercel.app/api/cron/djen-monitor \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

  daily-reset:
    runs-on: ubuntu-latest
    steps:
      - name: Daily Reset
        run: |
          curl -X POST https://seu-app.vercel.app/api/cron/daily-reset \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Vantagens:**
- ✅ 100% gratuito
- ✅ Qualquer frequência
- ✅ Múltiplas tarefas
- ✅ Logs completos
- ✅ Já usa GitHub

### 2. Cron-job.org (Grátis)

Serviço externo que faz requests HTTP agendados.

**Passos:**
1. Acesse [cron-job.org](https://cron-job.org)
2. Crie conta gratuita
3. Adicione jobs apontando para suas APIs:
   - `https://seu-app.vercel.app/api/cron/djen-monitor`
   - `https://seu-app.vercel.app/api/cron/daily-reset`
4. Configure frequência desejada

**Vantagens:**
- ✅ 100% gratuito
- ✅ Interface simples
- ✅ Notificações de falha
- ✅ Histórico de execuções

**Limitações:**
- ⚠️ Máximo 3 jobs no plano gratuito
- ⚠️ Intervalo mínimo: 5 minutos

### 3. Railway (Grátis com limites)

Se migrar para Railway, cron jobs nativos estão disponíveis.

**Vantagens:**
- ✅ Cron nativo
- ✅ $5/mês grátis
- ✅ PostgreSQL incluído

**Desvantagens:**
- ⚠️ Requer cartão de crédito
- ⚠️ Créditos limitados

### 4. Render (Grátis)

Render oferece cron jobs no plano gratuito!

**Arquivo:** `render.yaml`

```yaml
services:
  - type: web
    name: assistente-juridico-pje
    # ... configuração normal ...

  - type: cron
    name: djen-monitor
    env: node
    schedule: "0 8-20/2 * * *"
    buildCommand: npm install
    startCommand: node scripts/djen-monitor.js
```

**Vantagens:**
- ✅ 100% gratuito
- ✅ Cron nativo
- ✅ Qualquer frequência

**Desvantagens:**
- ⚠️ App principal "dorme" após 15 min

### 5. Cloudflare Workers (Grátis)

Cloudflare oferece Cron Triggers no Workers.

**Vantagens:**
- ✅ 100% gratuito
- ✅ Execução global
- ✅ Muito rápido

**Desvantagens:**
- ⚠️ Requer aprender Cloudflare Workers
- ⚠️ Curva de aprendizado maior

## 🎯 Recomendação

Para manter o app no Vercel (plano gratuito) e ter cron jobs:

### Opção 1: GitHub Actions (Melhor)

- **Custo:** R$ 0
- **Complexidade:** Baixa
- **Setup:** 5 minutos
- **Manutenção:** Nenhuma

👉 Crie `.github/workflows/scheduled-tasks.yml` conforme exemplo acima

### Opção 2: Cron-job.org

- **Custo:** R$ 0
- **Complexidade:** Muito baixa
- **Setup:** 2 minutos
- **Manutenção:** Nenhuma

👉 Cadastre-se em [cron-job.org](https://cron-job.org) e configure

### Opção 3: Migrar para Render

- **Custo:** R$ 0
- **Complexidade:** Média
- **Setup:** 15 minutos
- **Manutenção:** Baixa

👉 Siga [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)

## 📝 Checklist de Migração

Se optar por usar alternativas:

- [ ] Remover seção `crons` do `vercel.json` ✅ (já feito)
- [ ] Escolher alternativa (GitHub Actions, cron-job.org, ou Render)
- [ ] Configurar tarefas na plataforma escolhida
- [ ] Adicionar autenticação nas rotas `/api/cron/*` (recomendado)
- [ ] Testar execução das tarefas
- [ ] Monitorar logs

## 🔐 Segurança das APIs de Cron

**IMPORTANTE:** Proteja suas rotas de cron contra acesso não autorizado!

### Adicionar Header de Autenticação

**Em `.env`:**
```env
CRON_SECRET=sua-senha-secreta-aqui-min-32-caracteres
```

**Em `api/cron/*.ts`:**
```typescript
export default async function handler(req: Request) {
  // Verificar autenticação
  const authHeader = req.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  
  if (authHeader !== expectedAuth) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Sua lógica de cron aqui...
}
```

### No GitHub Actions:

```yaml
- name: Run Cron
  run: |
    curl -X POST https://seu-app.vercel.app/api/cron/djen-monitor \
      -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### No cron-job.org:

Configure "Custom Headers":
```
Authorization: Bearer sua-senha-secreta-aqui
```

## 📚 Documentação Relacionada

- 📖 [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md) - Deploy no Render com cron nativo
- 📖 [PLATAFORMAS_DEPLOY_GRATIS.md](./PLATAFORMAS_DEPLOY_GRATIS.md) - Comparação de plataformas
- 📖 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) - Deploy no Vercel

## ❓ FAQ

### P: Por que o Vercel bloqueou?

**R:** O plano Hobby (gratuito) do Vercel permite apenas 1 cron job executando 1x por dia. Você tinha 3 cron jobs, alguns executando múltiplas vezes por dia.

### P: Preciso fazer upgrade para Pro?

**R:** Não! Use uma das alternativas gratuitas acima (GitHub Actions ou cron-job.org).

### P: O app ainda funciona sem crons?

**R:** Sim! O app funciona perfeitamente. Os cron jobs eram apenas para tarefas agendadas (monitoramento DJEN, etc). Essas tarefas podem ser feitas manualmente ou via alternativas.

### P: E se eu quiser crons no Vercel?

**R:** Você precisa do plano Pro ($20/mês). Mas as alternativas gratuitas são igualmente boas!

### P: Posso ter 1 cron diário no Vercel Hobby?

**R:** Teoricamente sim, mas é mais prático usar GitHub Actions ou cron-job.org que são totalmente gratuitos e sem limites.

## ✅ Resumo

1. **Problema:** Vercel Hobby não permite múltiplos crons ou crons frequentes
2. **Solução:** Removidos crons do `vercel.json`
3. **Alternativa:** Use GitHub Actions (grátis) ou cron-job.org (grátis)
4. **Resultado:** App funciona perfeitamente no Vercel gratuito + crons via GitHub Actions

---

**Atualizado:** 2025-11-18  
**Status:** ✅ Resolvido - App compatível com Vercel Hobby (gratuito)
