# 🎯 Quick Start - Integração Railway + Vercel

**Tempo estimado**: 10 minutos
**Projeto Railway**: gentle-vision (a364e7f2-c234-477b-8dac-918f00f64737)

---

## ⚡ Método 1: Script Automatizado (Recomendado)

```bash
# Execute o script de configuração automática
./scripts/setup-railway-vercel.sh
```

**O script fará:**
1. ✅ Verificar/instalar Railway CLI
2. ✅ Autenticar no Railway (abrirá browser)
3. ✅ Conectar ao projeto gentle-vision
4. ✅ Gerar token seguro (DSPY_API_TOKEN)
5. ✅ Configurar 6 variáveis de ambiente
6. ✅ Fazer deploy automático
7. ✅ Obter URL do Railway
8. ✅ Testar health checks
9. ✅ Gerar instruções para Vercel

---

## 🔧 Método 2: Configuração Manual (Passo a Passo)

### 1. Autenticar Railway

```bash
railway login
# ⚠️ ABRIRÁ BROWSER - Faça login e volte ao terminal
```

### 2. Conectar ao Projeto

```bash
railway link -p a364e7f2-c234-477b-8dac-918f00f64737
railway status
```

### 3. Configurar Variáveis (OBRIGATÓRIAS)

```bash
# Gerar token seguro
DSPY_TOKEN=$(openssl rand -base64 32)

# Configurar Railway
railway variables set DSPY_API_TOKEN="$DSPY_TOKEN"
railway variables set DSPY_PORT=8765
railway variables set ALLOWED_ORIGINS="https://assistente-juridico-github.vercel.app"
railway variables set GEMINI_API_KEY="<sua-key-aqui>"
railway variables set DSPY_LM_MODEL="openai/gpt-3.5-turbo"
railway variables set NODE_ENV="production"

# Verificar
railway variables
```

### 4. Deploy

```bash
railway up
railway logs --tail 100
```

### 5. Obter URL

```bash
railway domain
# Copie a URL gerada (ex: https://gentle-vision.up.railway.app)
```

### 6. Configurar Vercel

**Via Dashboard:**
https://vercel.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/environment-variables

Adicione:
```
DSPY_BRIDGE_URL=<url-railway-copiada>
DSPY_API_TOKEN=<token-gerado-acima>
VITE_DSPY_URL=<url-railway-copiada>
VITE_DSPY_API_TOKEN=<token-gerado-acima>
```

**Via CLI:**
```bash
vercel env add DSPY_BRIDGE_URL production
# Cole a URL Railway quando solicitado

vercel env add DSPY_API_TOKEN production
# Cole o token quando solicitado

# Rebuild
vercel --prod
```

### 7. Testar Integração

```bash
# Railway health
curl https://gentle-vision.up.railway.app/health

# Vercel health
curl https://assistente-juridico-github.vercel.app/api/health

# Integração completa (após configurar Vercel)
curl -X POST https://assistente-juridico-github.vercel.app/api/llm-proxy \
  -H "Content-Type: application/json" \
  -d '{"prompt":"teste","mode":"optimize"}'
```

---

## 🚨 Problemas Comuns

### "Unauthorized" no Railway
```bash
# Refazer login
railway login
railway whoami
```

### Deploy falha
```bash
# Ver logs detalhados
railway logs --tail 100

# Verificar railway.json
cat railway.json

# Redeploy
railway up
```

### Vercel não conecta ao Railway
```bash
# 1. Verificar CORS no Railway
railway variables get ALLOWED_ORIGINS
# Deve conter: https://assistente-juridico-github.vercel.app

# 2. Verificar token
railway variables get DSPY_API_TOKEN
# Deve estar igual no Vercel

# 3. Testar Railway diretamente
curl -H "Authorization: Bearer <seu-token>" <url-railway>/health
```

---

## 📊 Status Atual

**Railway**:
- [x] Projeto criado (gentle-vision)
- [ ] **Login necessário** ← PRÓXIMO PASSO
- [ ] Variáveis configuradas
- [ ] Deploy realizado
- [ ] URL obtida

**Vercel**:
- [x] Deploy ativo
- [ ] **Aguardando URL Railway**
- [ ] Variáveis DSPy pendentes
- [ ] Rebuild necessário

---

## 🎯 Próxima Ação

**Execute agora:**

```bash
./scripts/setup-railway-vercel.sh
```

Ou manualmente:

```bash
railway login
```

---

## 📚 Documentação Completa

- **Guia Completo**: `docs/RAILWAY_VERCEL_INTEGRATION_COMPLETE.md`
- **Railway Docs**: https://docs.railway.app/
- **Vercel Docs**: https://vercel.com/docs

---

**Tempo restante no Railway Free Tier**: 30 dias ou $5.00
**Status**: 🟡 Aguardando autenticação Railway
