"""
BACKEND PYTHON NATIVO - FASTAPI
================================

Backend 100% Python para Streamlit.

Endpoints:
- /api/health
- /api/kv (Redis)
- /api/agents
- /api/expedientes
- /api/processes
- /api/metrics
- /api/djen-sync
"""

import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add lib to path
sys.path.append(str(Path(__file__).parent.parent / "lib"))

# Add backend to path to fix imports
sys.path.append(str(Path(__file__).parent))

from config import load_config

from backend.cron_jobs import start_scheduler, stop_scheduler
from backend.database import RedisClient
from backend.routers import (
    agents,
    calendar,
    cron,
    djen,
    documentos,
    expedientes,
    health,
    intimacoes,
    kv,
    metrics,
    minutas,
    notifications,
    pje,
    prazos,
    processes,
    tarefas,
)

# Configuração
config = load_config()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Assistente Jurídico API iniciando...")
    print("📊 Docs: http://localhost:8000/api/docs")
    print("❤️  Health: http://localhost:8000/api/health")

    # Iniciar scheduler
    start_scheduler()

    # Testar Redis
    try:
        redis_client = RedisClient()
        if redis_client.is_connected():
            print("✅ Redis conectado")
        else:
            print("⚠️  Redis offline (modo fallback)")
    except Exception as e:
        print(f"⚠️  Falha ao checar Redis: {e}")

    yield

    # Shutdown
    stop_scheduler()
    print("👋 Assistente Jurídico API encerrando...")


# Criar app FastAPI
app = FastAPI(
    title="Assistente Jurídico API",
    description="Backend Python nativo para Streamlit",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)


def _parse_bool_env(name: str, default: bool = False) -> bool:
    raw = (os.getenv(name) or "").strip().lower()
    if raw in {"1", "true", "yes", "y", "on"}:
        return True
    if raw in {"0", "false", "no", "n", "off"}:
        return False
    return default


def _get_allowed_origins() -> list[str]:
    # Segurança por padrão: permitir apenas origens locais.
    # Para desenvolvimento, pode liberar via BACKEND_CORS_ALLOW_ALL=true.
    if _parse_bool_env("BACKEND_CORS_ALLOW_ALL", default=False):
        return ["*"]

    env_list = (os.getenv("BACKEND_CORS_ALLOW_ORIGINS") or "").strip()
    if env_list:
        return [o.strip() for o in env_list.split(",") if o.strip()]

    return [
        "http://localhost:8501",
        "http://127.0.0.1:8501",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


BACKEND_API_KEY = (os.getenv("BACKEND_API_KEY") or os.getenv("API_KEY") or "").strip()

ALLOWED_ORIGINS = _get_allowed_origins()


def _should_skip_auth(request: Request) -> bool:
    # Permitir preflight de CORS
    if request.method.upper() == "OPTIONS":
        return True

    path = request.url.path
    # Health/root/docs devem continuar acessíveis para diagnósticos locais.
    if path in {"/", "/api/health"}:
        return True
    if path.startswith("/api/docs") or path.startswith("/api/redoc"):
        return True
    if path.startswith("/openapi.json"):
        return True

    return False


# CORS para permitir frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Observação: credenciais + "*" não é compatível com a especificação.
    allow_credentials=("*" not in ALLOWED_ORIGINS),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def api_key_auth(request: Request, call_next):
    # Auth é opcional: se BACKEND_API_KEY não estiver setada, mantém comportamento atual.
    if not BACKEND_API_KEY or _should_skip_auth(request):
        return await call_next(request)

    provided = (request.headers.get("x-api-key") or "").strip()
    if provided != BACKEND_API_KEY:
        return JSONResponse(
            status_code=401,
            content={"error": "Unauthorized", "message": "Missing/invalid API key"},
        )

    return await call_next(request)


# Middleware de logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()

    # Processar request
    response = await call_next(request)

    # Calcular duração
    duration = (datetime.now() - start_time).total_seconds()

    # Log
    print(
        f"[{request.method}] {request.url.path} - {response.status_code} - {duration:.3f}s"
    )

    return response


# Middleware de erro global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Erro global: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "path": request.url.path,
        },
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Assistente Jurídico API - Python Backend",
        "version": "2.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
    }


# Incluir routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(kv.router, prefix="/api", tags=["KV Store"])
app.include_router(agents.router, prefix="/api", tags=["Agentes"])
app.include_router(expedientes.router, prefix="/api", tags=["Expedientes"])
app.include_router(processes.router, prefix="/api", tags=["Processos"])
app.include_router(metrics.router, prefix="/api", tags=["Métricas"])
app.include_router(djen.router, prefix="/api", tags=["DJEN"])
app.include_router(intimacoes.router, prefix="/api", tags=["Intimações"])
app.include_router(cron.router, prefix="/api", tags=["Cron Jobs"])
app.include_router(pje.router, prefix="/api", tags=["PJe"])
app.include_router(minutas.router, tags=["Minutas"])
app.include_router(calendar.router, tags=["Calendar"])
app.include_router(tarefas.router, prefix="/api", tags=["Tarefas"])
app.include_router(prazos.router, prefix="/api", tags=["Prazos"])
app.include_router(documentos.router, prefix="/api", tags=["Documentos"])
app.include_router(notifications.router, prefix="/api", tags=["Notificações"])


# Executar se chamado diretamente
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
