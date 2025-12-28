# Deploy no Streamlit Cloud

## 🚀 Como fazer deploy

### 1. Acesse Streamlit Cloud
https://share.streamlit.io/

### 2. Conecte seu repositório GitHub
- Faça login com GitHub
- Autorize Streamlit Cloud

### 3. Configure o deploy
- **Repository:** `portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal`
- **Branch:** `main`
- **Main file:** `streamlit-app/app.py`
- **Python version:** 3.11

### 4. Configure secrets
Em App settings → Secrets, adicione:

```toml
GEMINI_API_KEY = "sua-chave-gemini"
UPSTASH_REDIS_REST_URL = "https://sua-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN = "seu-token-upstash"
```

### 5. Deploy!
Clique em **Deploy** e aguarde ~2 minutos.

## 📋 Arquivos necessários

✅ `streamlit-app/app.py` - Existe
✅ `streamlit-app/requirements.txt` - Existe
✅ `streamlit-app/.streamlit/config.toml` - Criado
✅ `streamlit-app/.streamlit/secrets.toml.example` - Criado

## 🔧 Backend FastAPI

O backend precisa rodar separadamente:

**Opção 1 - Railway:**
```bash
cd streamlit-app
railway init
railway up
```

**Opção 2 - Render:**
- Criar novo Web Service
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

Depois, adicione a URL do backend nas secrets do Streamlit:
```toml
BACKEND_URL = "https://seu-backend.railway.app"
```

## ✅ Deploy Automático

Cada push na `main` faz deploy automático no Streamlit Cloud!

## 🔗 Após deploy

Seu app estará em:
`https://app-name.streamlit.app/`
