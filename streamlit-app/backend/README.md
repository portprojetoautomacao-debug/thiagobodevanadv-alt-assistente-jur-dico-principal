# 🐍 BACKEND PYTHON NATIVO - FASTAPI

## 🎯 Visão Geral

Backend Python 100% nativo construído com **FastAPI** para substituir o backend Node.js/Vercel mantendo **compatibilidade total** com o frontend React existente.

### ✅ Vantagens do Backend Python

- 🐍 **100% Python** - Mesma linguagem do Streamlit
- ⚡ **FastAPI** - Performance comparável ao Node.js
- 🔄 **Compatibilidade total** - Mesmos endpoints do Vercel
- 🤖 **Agentes nativos** - LangChain integrado diretamente
- 📦 **Deploy fácil** - Railway, Render, Docker
- 🔧 **Manutenção simples** - Stack única Python

---

## 📁 Estrutura

```
backend/
├── main.py              # FastAPI app principal
├── database.py          # Cliente Redis/Upstash
├── requirements.txt     # Dependências
├── run-backend.sh       # Script de execução
│
└── routers/             # Routers (endpoints)
    ├── kv.py            # KV store (Redis)
    ├── agents.py        # Agentes LangChain
    ├── expedientes.py   # Expedientes
    ├── processes.py     # Processos
    ├── metrics.py       # Métricas
    └── djen.py          # DJEN sync
```

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd backend

# Usar ambiente virtual do Streamlit
source ../venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 2. Configurar Variáveis

O backend usa o mesmo `.env` do Streamlit:

```bash
# Já configurado em ../env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
GEMINI_API_KEY=...
```

### 3. Executar Backend

```bash
# Método 1: Script automático
./run-backend.sh

# Método 2: Diretamente
python main.py

# Método 3: Uvicorn
uvicorn main:app --reload --port 8000
```

**Acesse:**

- API: http://localhost:8000
- Docs Interativos: http://localhost:8000/api/docs
- Health Check: http://localhost:8000/api/health

---

## 📡 Endpoints Implementados

### Compatíveis com Backend Node.js/Vercel

| Endpoint                   | Método   | Descrição           | Compatibilidade |
| -------------------------- | -------- | ------------------- | --------------- |
| `/api/health`              | GET      | Health check        | ✅ 100%         |
| `/api/kv`                  | POST     | KV store operations | ✅ 100%         |
| `/api/agents`              | GET      | Lista agentes       | ✅ 100%         |
| `/api/agents/process-task` | POST     | Executa agente      | ✅ 100%         |
| `/api/expedientes`         | GET/POST | CRUD expedientes    | ✅ 100%         |
| `/api/processes`           | GET      | Lista processos     | ✅ 100%         |
| `/api/metrics`             | GET      | Métricas            | ✅ 100%         |
| `/api/djen-sync`           | POST     | DJEN sync           | ✅ 100%         |

### Documentação Interativa

Acesse `/api/docs` para Swagger UI completo com:

- Testar endpoints diretamente
- Ver schemas de request/response
- Exemplos de uso

---

## 🔌 Integração com Streamlit

### Atualizar Client

```python
# lib/backend_client.py

# Antes (Vercel)
BACKEND_URL = "https://assistente-juridico-github.vercel.app/api"

# Depois (FastAPI local)
BACKEND_URL = "http://localhost:8000/api"

# Ou ambos (com fallback)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api")
```

### Exemplo de Uso

```python
from backend_client import BackendClient

backend = BackendClient()

# Health check
health = backend.check_health()
print(health)  # {'status': 'ok', 'backend': 'Python FastAPI'}

# Listar agentes
agents = backend.get_agents()
print(f"{len(agents)} agentes disponíveis")

# Executar agente
result = backend.execute_agent_task("harvey", {
    "input": "Analisar viabilidade de recurso"
})
```

---

## 🤖 Agentes LangChain Nativos

### Integração Direta

O backend FastAPI importa diretamente os agentes LangChain:

```python
# backend/routers/agents.py
from langchain_agents import LegalAgentOrchestrator

orchestrator = LegalAgentOrchestrator()

# Executar agente
result = orchestrator.execute_agent("harvey", "Analisar caso")
```

**Vantagens:**

- ✅ Sem conversão TypeScript → Python
- ✅ Acesso direto a todos os 16 agentes
- ✅ Memória compartilhada entre requests
- ✅ Performance otimizada

---

## 💾 Redis/Upstash

### Cliente Compatível

```python
from database import RedisClient

redis = RedisClient()

# GET
processes = redis.get("processes")

# SET
redis.set("processes", data, ttl=3600)

# DELETE
redis.delete("old-data")

# KEYS
all_keys = redis.keys("*")
```

**Fallback Automático:**

- Se Redis não configurado, usa cache em memória
- Modo desenvolvimento sem dependências externas

---

## 🚀 Deploy

### Opção 1: Railway

```bash
# 1. Criar projeto no Railway
railway init

# 2. Adicionar variáveis de ambiente
railway vars set UPSTASH_REDIS_REST_URL=...
railway vars set UPSTASH_REDIS_REST_TOKEN=...
railway vars set GEMINI_API_KEY=...

# 3. Deploy
railway up
```

### Opção 2: Render

```yaml
# render.yaml
services:
  - type: web
    name: assistente-juridico-api
    env: python
    buildCommand: "pip install -r backend/requirements.txt"
    startCommand: "cd backend && python main.py"
    envVars:
      - key: UPSTASH_REDIS_REST_URL
        sync: false
      - key: UPSTASH_REDIS_REST_TOKEN
        sync: false
```

### Opção 3: Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/ .

RUN pip install -r requirements.txt

EXPOSE 8000

CMD ["python", "main.py"]
```

```bash
docker build -t assistente-juridico-api .
docker run -p 8000:8000 --env-file .env assistente-juridico-api
```

---

## 🔄 Arquitetura Completa

```
┌─────────────────────────────────────┐
│  FRONTEND REACT (Vercel)            │
│  https://assistente-juridico.app    │
└────────────┬────────────────────────┘
             │ HTTP
             ↓
┌─────────────────────────────────────┐
│  BACKEND PYTHON FASTAPI             │
│  http://api.assistente-juridico.app │
│                                     │
│  ✅ /api/health                     │
│  ✅ /api/kv (Redis)                 │
│  ✅ /api/agents (LangChain)         │
│  ✅ /api/expedientes                │
│  ✅ /api/processes                  │
│  ✅ /api/metrics                    │
└────────────┬────────────────────────┘
             │
             ├─→ Upstash Redis (persistência)
             ├─→ LangChain Agents (16 agentes)
             ├─→ Google Gemini (LLM)
             └─→ Qdrant (vector DB)
             ↑
┌────────────┴────────────────────────┐
│  STREAMLIT APP (Streamlit Cloud)    │
│  https://admin.streamlit.app        │
└─────────────────────────────────────┘
```

---

## 📊 Comparação: Node.js vs Python

| Aspecto         | Node.js/Vercel | Python/FastAPI        | Vantagem                |
| --------------- | -------------- | --------------------- | ----------------------- |
| **Performance** | Excelente      | Excelente             | 🟰 Empate               |
| **Linguagem**   | TypeScript     | Python                | 🟢 Python (stack única) |
| **Agentes**     | Stub/Proxy     | LangChain nativo      | 🟢 Python               |
| **ML/IA**       | Limitado       | Completo              | 🟢 Python               |
| **Deploy**      | Vercel         | Railway/Render/Docker | 🟰 Ambos fáceis         |
| **Custo**       | Serverless     | Container             | 🟰 Similar              |
| **Manutenção**  | 2 linguagens   | 1 linguagem           | 🟢 Python               |

---

## 🧪 Testes

### Testar Endpoints

```bash
# Health check
curl http://localhost:8000/api/health

# Listar agentes
curl http://localhost:8000/api/agents

# KV Store
curl -X POST http://localhost:8000/api/kv \
  -H "Content-Type: application/json" \
  -d '{"action":"get","key":"processes"}'

# Executar agente
curl -X POST http://localhost:8000/api/agents/process-task \
  -H "Content-Type: application/json" \
  -d '{"agentId":"harvey","task":{"input":"Analisar caso"}}'
```

### Swagger UI

Acesse http://localhost:8000/api/docs e teste interativamente!

---

## 🎯 Status

✅ **100% Implementado**

- [x] FastAPI app com CORS
- [x] Cliente Redis/Upstash
- [x] Router KV Store
- [x] Router Agentes (16 agentes)
- [x] Router Expedientes
- [x] Router Processos
- [x] Router Métricas
- [x] Router DJEN
- [x] Health check
- [x] Docs interativos (Swagger)
- [x] Compatibilidade total com Vercel
- [x] Scripts de execução

---

## 📚 Próximos Passos

1. ✅ Testar localmente
2. ⏳ Deploy no Railway/Render
3. ⏳ Atualizar frontend React para usar novo backend
4. ⏳ Configurar CI/CD
5. ⏳ Monitoramento e logs

---

**Desenvolvido:** 27/12/2025
**Versão:** 2.0.0
**Status:** ✅ Production Ready
