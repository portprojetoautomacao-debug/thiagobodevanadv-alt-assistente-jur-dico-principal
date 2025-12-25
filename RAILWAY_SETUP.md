# 🚂 Railway Setup - DSPy Bridge Deploy

## ✅ Arquivos Configurados

- ✅ `railway.json` - Configuração de build e deploy
- ✅ `railway.toml` - Configuração alternativa (TOML)
- ✅ `requirements.txt` - Dependências Python
- ✅ `scripts/dspy_bridge.py` - Serviço DSPy

## �� Deploy Manual via Dashboard Railway

### Passo 1: Conectar Repositório

1. Acesse: https://railway.app/new
2. Clique em **"Deploy from GitHub repo"**
3. Selecione: `portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal`
4. Branch: `main`

### Passo 2: Configurar Variáveis de Ambiente

No Railway Dashboard, vá em **Variables** e adicione:

```bash
# Token de autenticação (OBRIGATÓRIO)
DSPY_API_TOKEN=<gere-um-token-seguro>

# Origens CORS permitidas
ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app,https://assistente-juridico-github.vercel.app

# Porta (Railway define automaticamente, mas podemos fixar)
PORT=8765

# Python unbuffered (para logs em tempo real)
PYTHONUNBUFFERED=1

# Gemini API Key (para DSPy usar)
GEMINI_API_KEY=${{shared.GEMINI_API_KEY}}
```

**💡 Para gerar DSPY_API_TOKEN seguro:**

```bash
openssl rand -hex 32
```

Ou use: https://generate-secret.vercel.app/32

### Passo 3: Configurar Build

O Railway detecta automaticamente `railway.json` ou `railway.toml`.

**Configuração atual:**
- Builder: NIXPACKS (detecta Python automaticamente)
- Build Command: `pip install -r requirements.txt`
- Start Command: `python3 scripts/dspy_bridge.py`
- Health Check: `/health` (timeout 100s)
- Restart Policy: ON_FAILURE (max 10 retries)

### Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. Railway vai gerar uma URL: `https://seu-app.up.railway.app`

### Passo 5: Testar

```bash
# Health check
curl https://seu-app.up.railway.app/health

# Resposta esperada:
{
  "status": "healthy",
  "service": "dspy-bridge",
  "version": "1.0.0"
}
```

### Passo 6: Adicionar no Vercel

Copie a URL do Railway e adicione no **Vercel Dashboard** > **Environment Variables**:

```bash
DSPY_BRIDGE_URL=https://seu-app.up.railway.app
DSPY_API_TOKEN=<mesmo-token-do-railway>
```

Depois, faça **Redeploy** no Vercel.

---

## 🔐 Segurança

- ✅ Token JWT para autenticação
- ✅ CORS restrito às origens Vercel
- ✅ HTTPS obrigatório
- ✅ Health check configurado
- ✅ Restart automático em caso de falha

## 📊 Limites Free Tier

Railway Free:
- ✅ 500 horas/mês de execução
- ✅ 512 MB RAM
- ✅ 1 GB armazenamento
- ✅ US$ 5,00 de crédito/mês

**Estimativa de uso:**
- DSPy Bridge ocioso: ~10 MB RAM
- Sob carga: ~100-200 MB RAM
- Uso mensal: ~200-300 horas (sob demanda)

**Custo estimado: $0/mês** (dentro do free tier) 🎉

---

## 🐛 Troubleshooting

### Build falha?

Verifique se `requirements.txt` existe e está correto:

```txt
dspy-ai>=2.4.0
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
python-dotenv>=1.0.0
```

### Service não inicia?

Verifique logs no Railway Dashboard:
```
Settings > Logs
```

### Health check falha?

Aumente timeout em `railway.json`:
```json
"healthcheckTimeout": 300
```

### CORS error?

Verifique `ALLOWED_ORIGINS` no Railway:
```bash
ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
```

---

## 📚 Documentação

- Railway Docs: https://docs.railway.app/
- DSPy Docs: https://dspy-docs.vercel.app/
- FastAPI Docs: https://fastapi.tiangolo.com/

