"""
Router para Notificações e Configurações de Email
"""

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from lib.email_service import get_email_service
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter()


class EmailConfigRequest(BaseModel):
    """Configuração de email."""

    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    notification_emails: list[EmailStr]


class TestEmailRequest(BaseModel):
    """Request para testar envio de email."""

    to_email: EmailStr


@router.get("/notifications/config")
async def get_email_config():
    """Retorna configuração atual de email (sem senha)."""
    try:
        email_service = get_email_service()
        config = email_service.testar_configuracao()

        # Remover senha da resposta
        config.pop("smtp_password_configurado", None)

        return {"success": True, "config": config}
    except Exception as e:
        logger.error(f"Erro ao buscar config email: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/test")
async def test_email_notification(request: TestEmailRequest):
    """Envia email de teste."""
    try:
        email_service = get_email_service()

        # Email de teste
        test_intimacao = {
            "tribunal": "TJMG",
            "numeroProcesso": "0001234-56.2025.8.13.0001",
            "tipo": "Intimação de Teste",
            "data": "2025-12-27",
            "orgao": "1ª Vara Cível",
            "teor": "Este é um email de teste do sistema de notificações.",
        }

        # Temporariamente alterar destinatário
        original_emails = email_service.to_emails
        email_service.to_emails = [request.to_email]

        success = email_service.enviar_alerta_intimacoes([test_intimacao], 0)

        # Restaurar emails originais
        email_service.to_emails = original_emails

        if success:
            return {
                "success": True,
                "message": f"Email de teste enviado para {request.to_email}",
            }
        else:
            raise HTTPException(status_code=500, detail="Falha ao enviar email")

    except Exception as e:
        logger.error(f"Erro ao enviar email de teste: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/send-manual")
async def send_manual_notification():
    """Envia notificação manual das intimações não processadas."""
    try:
        from lib.djen_processor import processar_intimacoes_pendentes

        result = await processar_intimacoes_pendentes()

        return {
            "success": True,
            "processed": result.get("processed", 0),
            "tasks": result.get("tasks", 0),
            "message": "Notificação enviada",
        }

    except Exception as e:
        logger.error(f"Erro ao enviar notificação manual: {e}")
        raise HTTPException(status_code=500, detail=str(e))
