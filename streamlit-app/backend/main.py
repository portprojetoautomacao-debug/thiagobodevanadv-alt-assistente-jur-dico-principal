"""
BACKEND PYTHON NATIVO - FASTAPI
================================

Backend 100% Python para Streamlit + React.
Substitui backend Node.js/Vercel mantendo compatibilidade total.

Endpoints compatíveis:
- /api/health
- /api/kv (Redis)
- /api/agents
- /api/expedientes
- /api/processes
- /api/metrics
- /api/djen-sync
"""

import sys
from datetime import datetime
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add lib to path
sys.path.append(str(Path(__file__).parent.parent / "lib"))

from config import load_config
from cron_jobs import start_scheduler
from database import RedisClient
from routers import agents, djen, expedientes, intimacoes, kv, metrics, processes

# Configuração
config = load_config()

# Criar app FastAPI
app = FastAPI(
    title="Assistente Jurídico API",
    description="Backend Python nativo para Streamlit + React",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)


@app.on_event("startup")
async def startup_event():
    """Inicialização do servidor."""
    start_scheduler()


# CORS para permitir frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev
        "http://localhost:8501",  # Streamlit
        "https://assistente-juridico-github.vercel.app",  # Produção
        "*",  # Permitir todos em desenvolvimento
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Health check
@app.get("/api/health")
async def health_check():
    """Health check endpoint."""

    # Verificar Redis
    redis_client = RedisClient()
    redis_ok = redis_client.is_connected()

    return {
        "status": "ok" if redis_ok else "degraded",
        "timestamp": datetime.now().isoformat(),
        "environment": "development",
        "version": "2.0.0",
        "backend": "Python FastAPI",
        "redis": "connected" if redis_ok else "disconnected",
        "components": {
            "api": "healthy",
            "redis": "healthy" if redis_ok else "unhealthy",
            "agents": "healthy",
            "ml": "healthy",
        },
    }


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
app.include_router(kv.router, prefix="/api", tags=["KV Store"])
app.include_router(agents.router, prefix="/api", tags=["Agentes"])
app.include_router(expedientes.router, prefix="/api", tags=["Expedientes"])
app.include_router(processes.router, prefix="/api", tags=["Processos"])
app.include_router(metrics.router, prefix="/api", tags=["Métricas"])
app.include_router(djen.router, prefix="/api", tags=["DJEN"])
app.include_router(intimacoes.router, prefix="/api", tags=["Intimações"])

# Importar novos routers
from routers import (
    calendar,
    cron,
    documentos,
    minutas,
    notifications,
    pje,
    prazos,
    tarefas,
)

app.include_router(cron.router, prefix="/api", tags=["Cron Jobs"])
app.include_router(pje.router, prefix="/api", tags=["PJe"])
app.include_router(minutas.router, tags=["Minutas"])  # Já tem prefix no router
app.include_router(calendar.router, tags=["Calendar"])  # Já tem prefix no router
app.include_router(tarefas.router, prefix="/api", tags=["Tarefas"])
app.include_router(prazos.router, prefix="/api", tags=["Prazos"])
app.include_router(documentos.router, prefix="/api", tags=["Documentos"])
app.include_router(notifications.router, prefix="/api", tags=["Notificações"])


# Startup event
@app.on_event("startup")
async def startup_event():
    print("🚀 Assistente Jurídico API iniciando...")
    print(f"📊 Docs: http://localhost:8000/api/docs")
    print(f"❤️  Health: http://localhost:8000/api/health")

    # Testar Redis
    redis_client = RedisClient()
    if redis_client.is_connected():
        print("✅ Redis conectado")
    else:
        print("⚠️  Redis offline (modo fallback)")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("👋 Assistente Jurídico API encerrando...")


# Executar se chamado diretamente
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
