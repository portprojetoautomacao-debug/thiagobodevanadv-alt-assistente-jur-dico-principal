# 🚀 GUIA DE DEPLOY - ASSISTENTE JURÍDICO PJE

Instruções para deploy em produção do sistema 100% Python.

---

## 📋 PRÉ-REQUISITOS

### Contas Necessárias

- [ ] **Railway** - Deploy backend FastAPI
- [ ] **Streamlit Cloud** - Deploy frontend
- [ ] **Upstash** - Redis gerenciado
- [ ] **Google Cloud** - Gemini API
- [ ] **Domínio** (opcional) - DNS customizado

### Variáveis de Ambiente

Criar arquivo `.env.production` com:

```bash
# LLM
GEMINI_API_KEY=your-key-here

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# PJe (Automação)
PJE_CPF=
PJE_SENHA=
PJE_TRIBUNAL=TJAL

# OAB (DJEN)
OAB_NUMERO=12345
OAB_UF=AL

# Backend URL
BACKEND_API_URL=https://your-backend.railway.app

# Opcional
QDRANT_URL=
QDRANT_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 🚂 DEPLOY BACKEND (RAILWAY)

### Passo 1: Criar Projeto Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Criar projeto
cd streamlit-app/backend
railway init
```

### Passo 2: Configurar Build

Criar `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Passo 3: Adicionar Variáveis

```bash
railway variables set GEMINI_API_KEY=your-key
railway variables set UPSTASH_REDIS_REST_URL=https://...
railway variables set UPSTASH_REDIS_REST_TOKEN=...
```

### Passo 4: Deploy

```bash
railway up
```

### Passo 5: Verificar

```bash
# Obter URL
railway domain

# Testar
curl https://your-backend.railway.app/health
```

---

## ☁️ DEPLOY FRONTEND (STREAMLIT CLOUD)

### Passo 1: Preparar Repositório

```bash
# Commit final
git add .
git commit -m "feat: preparar para deploy streamlit"
git push origin main
```

### Passo 2: Streamlit Cloud

1. Acesse [share.streamlit.io](https://share.streamlit.io)
2. Conecte repositório GitHub
3. Selecione:
   - Branch: `main`
   - Main file: `streamlit-app/app.py`
4. Configure variáveis de ambiente (secrets)

### Passo 3: Secrets

Criar `.streamlit/secrets.toml`:

```toml
GEMINI_API_KEY = "your-key"
UPSTASH_REDIS_REST_URL = "https://..."
UPSTASH_REDIS_REST_TOKEN = "..."
BACKEND_API_URL = "https://your-backend.railway.app"
```

### Passo 4: Deploy

- Clicar em "Deploy"
- Aguardar build (2-3 minutos)

### Passo 5: Verificar

- URL: `https://your-app.streamlit.app`
- Testar funcionalidades

---

## 🌐 CONFIGURAR DOMÍNIO CUSTOMIZADO

### Backend (Railway)

```bash
# Adicionar domínio
railway domain add api.seu-dominio.com

# Configurar DNS
# CNAME: api -> your-app.railway.app
```

### Frontend (Streamlit)

No painel Streamlit Cloud:
1. Settings → Custom domains
2. Adicionar: `app.seu-dominio.com`
3. Configurar DNS:
   - CNAME: `app` → `your-app.streamlit.app`

---

## 🔒 CONFIGURAR SSL/TLS

### Railway

SSL automático (Let's Encrypt) ✅

### Streamlit Cloud

SSL automático (Let's Encrypt) ✅

---

## 📊 CONFIGURAR MONITORAMENTO

### Uptime Monitoring

**UptimeRobot** (gratuito):

1. [uptimerobot.com](https://uptimerobot.com)
2. Adicionar monitores:
   - Backend: `https://api.seu-dominio.com/health`
   - Frontend: `https://app.seu-dominio.com`
3. Alertas via email/Telegram

### Error Tracking

**Sentry** (gratuito até 5k eventos/mês):

```bash
pip install sentry-sdk
```

```python
# backend/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=1.0,
)
```

### Logs

**Railway Logs:**
```bash
railway logs
```

**Streamlit Logs:**
- Painel Streamlit Cloud → Logs

---

## 🧪 TESTES EM PRODUÇÃO

### 1. Health Checks

```bash
# Backend
curl https://api.seu-dominio.com/health

# Frontend
curl https://app.seu-dominio.com
```

### 2. Funcionalidades Core

- [ ] Login/autenticação
- [ ] Listagem de processos
- [ ] Busca DataJud
- [ ] Predições ML
- [ ] Cron jobs rodando

### 3. Performance

```bash
# Latência backend
time curl https://api.seu-dominio.com/api/processes

# Streamlit load time
# Usar: https://pagespeed.web.dev
```

---

## 🔄 CI/CD (OPCIONAL)

### GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Run tests
        run: |
          cd streamlit-app
          pip install -r requirements.txt
          ./run-tests.sh

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy Railway
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Streamlit redeploy
        run: |
          curl -X POST ${{ secrets.STREAMLIT_WEBHOOK_URL }}
```

---

## 📋 CHECKLIST DE DEPLOY

### Pré-Deploy

- [x] Todos os testes passando
- [x] Dependências atualizadas
- [x] Variáveis de ambiente documentadas
- [ ] Secrets configurados
- [ ] Backups configurados

### Deploy Backend

- [ ] Railway projeto criado
- [ ] Variáveis configuradas
- [ ] Deploy realizado
- [ ] Health check OK
- [ ] Logs funcionando

### Deploy Frontend

- [ ] Streamlit Cloud conectado
- [ ] Secrets configurados
- [ ] Deploy realizado
- [ ] App acessível
- [ ] Integração com backend OK

### Pós-Deploy

- [ ] Domínio customizado configurado
- [ ] SSL/TLS ativo
- [ ] Monitoramento configurado
- [ ] Testes em produção OK
- [ ] Documentação atualizada
- [ ] Sistema antigo desligado

---

## 🆘 TROUBLESHOOTING

### Erro: "Module not found"

```bash
# Verificar requirements.txt
pip install -r requirements.txt

# Railway
railway logs | grep "ModuleNotFoundError"
```

### Erro: "Connection refused"

```bash
# Verificar variáveis
railway variables

# Verificar Redis
redis-cli -u $UPSTASH_REDIS_REST_URL ping
```

### Erro: "Memory limit exceeded"

Railway free tier: 512MB RAM

**Solução:** Upgrade plano ou otimizar:
```python
# Limitar threads
import os
os.environ['OMP_NUM_THREADS'] = '1'
```

### App Lento

**Causas comuns:**
- Cold start (Railway)
- Modelos ML não carregados
- Redis não conectado

**Solução:**
```python
# Cache modelos
@st.cache_resource
def load_models():
    return SuccessPredictor.carregar()
```

---

## 📚 RECURSOS

- [Railway Docs](https://docs.railway.app)
- [Streamlit Cloud Docs](https://docs.streamlit.io/streamlit-community-cloud)
- [Upstash Docs](https://docs.upstash.com)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

## 🎯 PRÓXIMOS PASSOS

Após deploy bem-sucedido:

1. **Monitoramento contínuo** (1 semana)
2. **Feedback de usuários**
3. **Otimizações de performance**
4. **Adicionar features**
5. **Documentação de uso**
6. **Desligar sistema antigo** ✅

---

**Última atualização:** 27/12/2025
**Versão:** 1.0.0
**Status:** ⏸️ Pronto para deploy
