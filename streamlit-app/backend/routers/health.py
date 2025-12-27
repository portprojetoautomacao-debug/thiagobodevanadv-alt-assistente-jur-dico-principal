"""
Health Check Router
Endpoint de verificação de saúde do sistema
"""

import os
from datetime import datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    GET /api/health

    Compatível com: api/health.ts
    """
    return {
        "status": "ok",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "assistente-juridico-python",
        "version": "2.0.0",
        "components": {
            "backend": "fastapi",
            "agents": "langchain",
            "database": "redis",
        },
    }
