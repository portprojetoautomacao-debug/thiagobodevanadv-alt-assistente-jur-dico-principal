"""
Router Google Calendar
======================

Endpoints para autenticação e gerenciamento do Google Calendar.
"""

import json
import logging
from typing import Any, Dict, List

from database import RedisClient
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from integrations.google_calendar import GoogleCalendarService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/calendar", tags=["Calendar"])
calendar_service = GoogleCalendarService()
redis_client = RedisClient()

REDIS_KEY_TOKEN = "google_calendar_token"
STREAMLIT_REDIRECT_URL = "http://localhost:8501/Configurações"


@router.get("/auth-url")
async def get_auth_url():
    """Retorna a URL de autenticação do Google"""
    try:
        url = calendar_service.get_auth_url()
        return {"url": url}
    except Exception as e:
        logger.error(f"Erro ao gerar URL de auth: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/callback")
async def auth_callback(code: str):
    """Callback do OAuth2"""
    try:
        # Trocar código por credenciais
        credentials = calendar_service.get_credentials_from_code(code)

        # Salvar no Redis
        redis_client.set(REDIS_KEY_TOKEN, json.dumps(credentials))

        # Redirecionar de volta para o app
        return RedirectResponse(url=STREAMLIT_REDIRECT_URL)
    except Exception as e:
        logger.error(f"Erro no callback de auth: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "Falha na autenticação", "details": str(e)},
        )


@router.get("/status")
async def get_status():
    """Verifica status da conexão"""
    token_data = redis_client.get(REDIS_KEY_TOKEN)
    return {
        "connected": bool(token_data),
        "email": (
            "usuario@exemplo.com" if token_data else None
        ),  # TODO: Extrair email do token
    }


@router.get("/events")
async def list_events():
    """Lista próximos eventos"""
    token_data = redis_client.get(REDIS_KEY_TOKEN)
    if not token_data:
        raise HTTPException(status_code=401, detail="Não conectado ao Google Calendar")

    try:
        token_info = json.loads(token_data)
        events = calendar_service.list_upcoming_events(token_info)
        return events
    except Exception as e:
        logger.error(f"Erro ao listar eventos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect():
    """Remove a conexão"""
    redis_client.delete(REDIS_KEY_TOKEN)
    return {"status": "disconnected"}
