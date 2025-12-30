# 🔧 Customizações Avançadas do Agent Server

## Visão Geral

O LangSmith Agent Server permite customizações profundas através de **rotas customizadas**, **middleware** e **lifespan events**. Isso permite adicionar:

- Endpoints HTTP personalizados
- Autenticação customizada
- Logging e métricas
- Integrações com sistemas legados
- Full-stack web apps no mesmo servidor

## 🎯 Casos de Uso

| Customização | Caso de Uso | Exemplo |
|--------------|-------------|---------|
| **Rotas** | Endpoints extras | `/login`, `/webhook`, `/health-custom` |
| **Middleware** | Interceptar requests | Auth, logging, rate limiting |
| **Lifespan** | Setup/teardown | Conexões DB, cache, recursos |

---

## 📍 1. Rotas Customizadas

Adicione endpoints HTTP personalizados ao seu Agent Server.

### Setup Básico

**1. Criar arquivo `webapp.py`:**

```python
# streamlit-app/lib/webapp.py
from fastapi import FastAPI, HTTPException, Header
from typing import Optional

app = FastAPI(
    title="Assistente Jurídico API",
    description="API customizada do assistente jurídico",
    version="1.0.0"
)


@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "message": "Assistente Jurídico API",
        "version": "1.0.0",
        "status": "online"
    }


@app.get("/health")
async def health_check():
    """Health check customizado"""
    return {
        "status": "healthy",
        "service": "legal-assistant",
        "timestamp": "2025-12-30T15:00:00Z"
    }


@app.get("/info")
async def info():
    """Informações sobre o assistente"""
    return {
        "name": "Assistente Jurídico",
        "capabilities": [
            "Análise de contratos",
            "Geração de documentos",
            "Pesquisa jurisprudencial",
            "Cálculo de prazos"
        ],
        "models": ["gpt-4o", "claude-3-5-sonnet"],
        "languages": ["pt-BR"]
    }
```

**2. Configurar `langgraph.json`:**

```json
{
  "dependencies": ["."],
  "graphs": {
    "legal_assistant": "./lib/langgraph_orchestrator.py:graph"
  },
  "env": ".env",
  "http": {
    "app": "./lib/webapp.py:app"
  }
}
```

**3. Testar localmente:**

```bash
# Iniciar servidor
langgraph dev --no-browser

# Testar endpoints
curl http://localhost:2024/
curl http://localhost:2024/health
curl http://localhost:2024/info
```

### Casos de Uso Avançados

#### Endpoint de Login

```python
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta

app = FastAPI()
security = HTTPBearer()

SECRET_KEY = "your-secret-key"  # Em produção: usar variável de ambiente

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@app.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """Autenticar usuário e retornar JWT token"""

    # Validar credenciais (substituir por seu sistema)
    if credentials.username == "advogado" and credentials.password == "senha123":
        # Criar JWT token
        payload = {
            "sub": credentials.username,
            "exp": datetime.utcnow() + timedelta(hours=24),
            "role": "lawyer"
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

        return TokenResponse(access_token=token)

    raise HTTPException(status_code=401, detail="Credenciais inválidas")


async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verificar JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


@app.get("/protected")
async def protected_route(user: dict = Depends(verify_token)):
    """Endpoint protegido"""
    return {
        "message": f"Olá, {user['sub']}!",
        "role": user['role']
    }
```

#### Webhook para Integrações

```python
from fastapi import FastAPI, Request, BackgroundTasks
import httpx

app = FastAPI()


async def process_webhook_async(data: dict):
    """Processar webhook em background"""
    # Lógica de processamento
    print(f"Processando webhook: {data}")

    # Chamar agent server
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:2024/threads",
            json={}
        )
        thread_id = response.json()["thread_id"]

        # Criar run
        await client.post(
            f"http://localhost:2024/threads/{thread_id}/runs",
            json={
                "assistant_id": "legal_assistant",
                "input": {
                    "messages": [{
                        "role": "user",
                        "content": f"Processar notificação: {data}"
                    }]
                }
            }
        )


@app.post("/webhook/djen")
async def djen_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Receber notificações do DJEN"""
    data = await request.json()

    # Validar webhook (opcional)
    if not data.get("process_number"):
        raise HTTPException(status_code=400, detail="Dados inválidos")

    # Processar em background
    background_tasks.add_task(process_webhook_async, data)

    return {"status": "accepted", "message": "Webhook recebido"}


@app.post("/webhook/calendar")
async def calendar_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    """Receber notificações do Google Calendar"""
    data = await request.json()

    background_tasks.add_task(process_webhook_async, data)

    return {"status": "accepted"}
```

#### Upload de Documentos

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from typing import List
import aiofiles
import os

app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    tipo: str = "contrato"
):
    """Upload de documento para análise"""

    # Validar tipo de arquivo
    allowed_extensions = [".pdf", ".docx", ".txt"]
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não permitido. Use: {', '.join(allowed_extensions)}"
        )

    # Salvar arquivo
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)

    # Processar documento (opcional)
    # ... análise do documento ...

    return {
        "filename": file.filename,
        "tipo": tipo,
        "size": len(content),
        "path": file_path,
        "message": "Documento enviado com sucesso"
    }


@app.post("/upload/batch")
async def upload_batch(
    files: List[UploadFile] = File(...)
):
    """Upload de múltiplos documentos"""

    results = []

    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)

        results.append({
            "filename": file.filename,
            "size": len(content),
            "status": "uploaded"
        })

    return {
        "total": len(results),
        "files": results
    }
```

---

## 🛡️ 2. Middleware Customizado

Middleware intercepta todas as requests antes de chegarem aos endpoints.

### Setup Básico

```python
# streamlit-app/lib/webapp.py
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import time
import logging

app = FastAPI()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware para logging de requests"""

    async def dispatch(self, request: Request, call_next):
        # Antes da request
        start_time = time.time()

        logger.info(f"Request: {request.method} {request.url.path}")

        # Processar request
        response = await call_next(request)

        # Depois da request
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        logger.info(f"Response: {response.status_code} ({process_time:.3f}s)")

        return response


class CustomHeaderMiddleware(BaseHTTPMiddleware):
    """Adicionar headers customizados"""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-App-Name"] = "Assistente-Juridico"
        response.headers["X-App-Version"] = "1.0.0"
        response.headers["X-Powered-By"] = "LangSmith"

        return response


# Adicionar middleware (ordem importa!)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(CustomHeaderMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501", "https://seu-dominio.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Ordem do Middleware

Por padrão, middleware customizado roda **antes** da autenticação. Para rodar **depois**, configure:

```json
{
  "http": {
    "app": "./lib/webapp.py:app",
    "middleware_order": "auth_first"
  },
  "auth": {
    "path": "./auth.py:my_auth"
  }
}
```

### Middleware de Rate Limiting

```python
from fastapi import FastAPI, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio

app = FastAPI()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting por IP"""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        # Obter IP do cliente
        client_ip = request.client.host

        async with self.lock:
            # Limpar requests antigas
            now = datetime.now()
            cutoff = now - timedelta(seconds=self.window_seconds)
            self.requests[client_ip] = [
                req_time for req_time in self.requests[client_ip]
                if req_time > cutoff
            ]

            # Verificar limite
            if len(self.requests[client_ip]) >= self.max_requests:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit excedido. Tente novamente em alguns minutos."
                )

            # Adicionar request atual
            self.requests[client_ip].append(now)

        # Processar request
        response = await call_next(request)

        # Adicionar headers informativos
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(
            self.max_requests - len(self.requests[client_ip])
        )

        return response


app.add_middleware(
    RateLimitMiddleware,
    max_requests=100,
    window_seconds=60
)
```

### Middleware de Autenticação

```python
from fastapi import FastAPI, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
import jwt

app = FastAPI()

PUBLIC_ROUTES = ["/", "/health", "/login", "/docs", "/openapi.json"]
SECRET_KEY = "your-secret-key"


class AuthMiddleware(BaseHTTPMiddleware):
    """Autenticação JWT para todas as rotas"""

    async def dispatch(self, request: Request, call_next):
        # Pular rotas públicas
        if request.url.path in PUBLIC_ROUTES:
            return await call_next(request)

        # Verificar header Authorization
        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Token de autenticação não fornecido"
            )

        token = auth_header.split(" ")[1]

        try:
            # Verificar JWT
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

            # Adicionar user ao request state
            request.state.user = payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expirado")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Token inválido")

        # Processar request
        return await call_next(request)


app.add_middleware(AuthMiddleware)
```

---

## ♻️ 3. Lifespan Events

Lifespan events permitem executar código no **startup** e **shutdown** do servidor.

### Setup Básico

```python
# streamlit-app/lib/webapp.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar ciclo de vida do app"""

    # STARTUP
    logger.info("🚀 Iniciando Assistente Jurídico...")

    # Inicializar recursos
    app.state.start_time = datetime.now()
    app.state.request_count = 0

    logger.info("✅ Assistente Jurídico pronto!")

    yield  # App está rodando

    # SHUTDOWN
    logger.info("🛑 Encerrando Assistente Jurídico...")

    # Limpar recursos
    uptime = datetime.now() - app.state.start_time
    logger.info(f"📊 Uptime: {uptime}")
    logger.info(f"📊 Total de requests: {app.state.request_count}")

    logger.info("👋 Assistente Jurídico encerrado!")


app = FastAPI(lifespan=lifespan)
```

### Conexões de Banco de Dados

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import redis.asyncio as redis

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar conexões de BD"""

    # STARTUP - PostgreSQL
    engine = create_async_engine(
        "postgresql+asyncpg://user:pass@localhost/legal_db",
        echo=True,
        pool_size=20,
        max_overflow=10
    )

    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    app.state.db_session = async_session

    # STARTUP - Redis
    redis_client = redis.from_url(
        "redis://localhost:6379/0",
        encoding="utf-8",
        decode_responses=True
    )

    app.state.redis = redis_client

    logger.info("✅ Conexões de BD estabelecidas")

    yield  # App rodando

    # SHUTDOWN - Limpar conexões
    await engine.dispose()
    await redis_client.close()

    logger.info("✅ Conexões de BD fechadas")


app = FastAPI(lifespan=lifespan)


# Usar nas rotas
@app.get("/db-health")
async def db_health(request: Request):
    """Verificar saúde das conexões"""

    # Testar PostgreSQL
    async with request.app.state.db_session() as session:
        result = await session.execute("SELECT 1")
        pg_ok = result.scalar() == 1

    # Testar Redis
    redis_ok = await request.app.state.redis.ping()

    return {
        "postgres": "healthy" if pg_ok else "unhealthy",
        "redis": "healthy" if redis_ok else "unhealthy"
    }
```

### Cache e Workers

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncio
from concurrent.futures import ThreadPoolExecutor

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar cache e workers"""

    # STARTUP - Cache
    cache = {}
    app.state.cache = cache

    # STARTUP - Thread pool para operações bloqueantes
    executor = ThreadPoolExecutor(max_workers=10)
    app.state.executor = executor

    # STARTUP - Background task
    async def cleanup_task():
        while True:
            await asyncio.sleep(3600)  # A cada hora
            # Limpar cache antigo
            logger.info("🧹 Limpando cache...")
            app.state.cache.clear()

    cleanup_handle = asyncio.create_task(cleanup_task())

    logger.info("✅ Cache e workers inicializados")

    yield  # App rodando

    # SHUTDOWN
    cleanup_handle.cancel()
    executor.shutdown(wait=True)

    logger.info("✅ Cache e workers encerrados")


app = FastAPI(lifespan=lifespan)
```

---

## 📦 Exemplo Completo Integrado

```python
# streamlit-app/lib/webapp.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware
import logging
import time
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()


# ============================================================================
# LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerenciar ciclo de vida"""

    # STARTUP
    logger.info("🚀 Iniciando Assistente Jurídico...")
    app.state.start_time = datetime.now()
    app.state.request_count = 0

    yield

    # SHUTDOWN
    uptime = datetime.now() - app.state.start_time
    logger.info(f"⏱️  Uptime: {uptime}")
    logger.info(f"📊 Requests: {app.state.request_count}")
    logger.info("👋 Assistente Jurídico encerrado!")


# ============================================================================
# APP
# ============================================================================

app = FastAPI(
    title="Assistente Jurídico API",
    description="API do assistente jurídico com customizações",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

class MetricsMiddleware(BaseHTTPMiddleware):
    """Coletar métricas"""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.3f}"

        # Incrementar contador
        request.app.state.request_count += 1

        return response


app.add_middleware(MetricsMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# ROTAS
# ============================================================================

@app.get("/")
async def root():
    """Endpoint raiz"""
    return {
        "name": "Assistente Jurídico API",
        "version": "1.0.0",
        "status": "online"
    }


@app.get("/metrics")
async def metrics(request: Request):
    """Métricas do servidor"""
    uptime = datetime.now() - request.app.state.start_time

    return {
        "uptime_seconds": uptime.total_seconds(),
        "total_requests": request.app.state.request_count,
        "requests_per_second": request.app.state.request_count / uptime.total_seconds()
    }


@app.get("/protected")
async def protected(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Rota protegida"""
    return {
        "message": "Acesso autorizado",
        "token": credentials.credentials[:10] + "..."
    }
```

---

## 🚀 Deploy

```bash
# Testar localmente
langgraph dev --no-browser

# Endpoints disponíveis:
# http://localhost:2024/
# http://localhost:2024/metrics
# http://localhost:2024/protected
# http://localhost:2024/docs (Swagger)

# Deploy em produção
# (seguir guia de deployment normal)
```

---

## 📚 Referências

- [Custom Routes](https://docs.langchain.com/langsmith/custom-routes)
- [Custom Middleware](https://docs.langchain.com/langsmith/custom-middleware)
- [Custom Lifespan](https://docs.langchain.com/langsmith/custom-lifespan)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

**Criado em**: 30 de dezembro de 2025
**Versão**: 1.0
**Veja também**: [AGENT_SERVER_SCALE_CONFIG.md](AGENT_SERVER_SCALE_CONFIG.md), [STUDIO_GUIDE.md](STUDIO_GUIDE.md)
