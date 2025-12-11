# 🔧 CORREÇÃO URGENTE - Railway Deployment Failed

## 🚨 Problema Identificado

O Railway está conectado ao **GitHub** e recebe **TODAS as variáveis do repositório**, incluindo:

```
❌ Builder: Dockerfile (frontend React + nginx)
❌ Start: python3 scripts/dspy_bridge.py (backend Python)
❌ Variáveis FRONTEND (VITE_*, DJEN_*, etc.) sendo injetadas no backend
🔴 Erro: "The executable `python3` could not be found"
```

**Causa Raiz**:
1. Railway sincroniza variáveis do GitHub Secrets automaticamente
2. Variáveis do **Vercel** (frontend) estão sendo injetadas no **Railway** (backend)
3. Builder configurado para `Dockerfile` (frontend) mas comando executa Python
4. Conflito entre configuração manual e `railway.toml`

---

## ✅ SOLUÇÃO - Passo a Passo (5 minutos)

### 1️⃣ Corrigir Builder no Railway Dashboard

Acesse: https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139

**Settings → Deploy → Builder**:

```diff
- Builder: Dockerfile
+ Builder: NIXPACKS
```

### 2️⃣ Corrigir Build Command

**Settings → Build → Build command**:

```diff
- Build command: npm ci && npm run build
+ Build command: (deixar vazio - NIXPACKS detecta automaticamente)
```

### 3️⃣ Verificar Start Command

**Settings → Deploy → Start command**:

```
✅ Start command: python3 scripts/dspy_bridge.py
```

(Este está correto, manter)

### 4️⃣ REMOVER Variáveis Frontend Incorretas

**⚠️ CRÍTICO**: Railway está recebendo variáveis do GitHub que são do **Vercel**!

**Settings → Variables** - **DELETE** estas variáveis (vieram do GitHub):

```bash
❌ VITE_REDIRECT_URI=https://assistente-juridico-pje.onrender.com
❌ VITE_APP_ENV=production
❌ DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ
❌ GITHUB_API_URL=https://api.github.com
❌ NODE_VERSION=20

# TODAS as variáveis com prefixo VITE_*
❌ VITE_*

# Outras variáveis de frontend
❌ RESEND_API_KEY (se existir)
❌ GOOGLE_CLIENT_ID (se existir)
❌ GOOGLE_CLIENT_SECRET (se existir)
```

**Por que remover?**
- Railway sincroniza com GitHub Secrets automaticamente
- Variáveis do Vercel (frontend) foram injetadas no Railway (backend)
- DSPy Bridge (Python) não usa variáveis `VITE_*`
- Causa conflitos e deployment failures

### 5️⃣ Manter APENAS estas Variáveis

**Settings → Variables** - Manter/verificar:

```bash
✅ DSPY_API_TOKEN=IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
✅ ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
✅ DSPY_PORT=8765
✅ NODE_ENV=production
✅ PYTHON_VERSION=3.11
✅ DSPY_LM_MODEL=openai/gpt-3.5-turbo
```

### 6️⃣ Adicionar Variáveis Faltantes (se não existirem)

```bash
DSPY_PORT=8765
NODE_ENV=production
PYTHON_VERSION=3.11
DSPY_LM_MODEL=openai/gpt-3.5-turbo
```

### 7️⃣ Forçar Novo Deploy

Após fazer as alterações:

1. Clique em **"Deploy"** (botão superior direito)
2. Ou faça push para o repositório GitHub conectado

---

## 📊 Configuração Correta Final

### Build Settings
```
Builder: NIXPACKS
Build command: (vazio)
```

### Deploy Settings
```
Start command: python3 scripts/dspy_bridge.py
Region: us-west2
Replicas: 1
Healthcheck path: /health
Healthcheck timeout: 30
```

### Variables (7 total)
```bash
DSPY_API_TOKEN=IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
DSPY_PORT=8765
NODE_ENV=production
PYTHON_VERSION=3.11
DSPY_LM_MODEL=openai/gpt-3.5-turbo
```

---

## 🔍 Por que o Erro Ocorreu?

1. **Builder Dockerfile**: Cria container com **nginx** (frontend)
2. **Start Python**: Tenta executar `python3` que **não existe** no container nginx
3. **Variáveis erradas**: Frontend vars no backend service

### O que Railway deve fazer:

```
✅ NIXPACKS detecta Python (scripts/dspy_bridge.py)
✅ Instala Python 3.11 + dependências (requirements.txt)
✅ Executa python3 scripts/dspy_bridge.py
✅ Expõe porta 8765
✅ Health check em /health
```

---

## 🧪 Validação Pós-Deploy

Após novo deploy com sucesso:

```bash
# 1. Verificar variáveis
railway variables

# Deve mostrar APENAS:
# - DSPY_API_TOKEN
# - ALLOWED_ORIGINS
# - DSPY_PORT
# - NODE_ENV
# - PYTHON_VERSION
# - DSPY_LM_MODEL

# 2. Testar health endpoint
curl https://assistente-juridico-pje-production-2d98.up.railway.app/health

# Esperado:
# {"status":"healthy","service":"dspy-bridge"}

# 3. Verificar logs
railway logs --tail 50

# Esperado:
# INFO:     Started server process
# INFO:     Uvicorn running on http://0.0.0.0:8765
```

---

## 📚 Arquitetura Correta

| Plataforma | Hospeda | Builder | Start Command |
|------------|---------|---------|---------------|
| **Vercel** | Frontend React + API Functions | Next.js/Vite | (automático) |
| **Railway** | DSPy Bridge (Python FastAPI) | NIXPACKS | `python3 scripts/dspy_bridge.py` |

### Separação de Responsabilidades:

- ✅ **Vercel**: `assistente-juridico-github.vercel.app`
  - Frontend React
  - API serverless (/api/*)
  - Variáveis: `VITE_*`, `DJEN_TRIBUNAIS`, etc.

- ✅ **Railway**: `assistente-juridico-pje-production-2d98.up.railway.app`
  - DSPy Bridge Python
  - FastAPI service
  - Variáveis: `DSPY_*`, `ALLOWED_ORIGINS`

---

## 🚨 Checklist de Correção

- [ ] Builder alterado para `NIXPACKS`
- [ ] Build command limpo (vazio)
- [ ] Start command mantido: `python3 scripts/dspy_bridge.py`
- [ ] Variáveis `VITE_*` removidas
- [ ] Variáveis `DSPY_*` configuradas
- [ ] `ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app`
- [ ] Deploy realizado
- [ ] Health check retorna 200 OK
- [ ] Logs mostram Uvicorn rodando

---

## 💡 Alternativa: Desconectar do GitHub

Se Railway continuar usando Dockerfile:

1. **Settings → General → Source**
2. Desconectar do GitHub
3. Fazer deploy manual via CLI:
   ```bash
   railway up --service assistente-juridico-pje
   ```

Isso força Railway a usar `railway.toml` corretamente.

---

**⚡ Prioridade: CRÍTICA - Corrigir imediatamente!**

O DSPy Bridge não funcionará enquanto Railway tentar executar Python em container nginx.
