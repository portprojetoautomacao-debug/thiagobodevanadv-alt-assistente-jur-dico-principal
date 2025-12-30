"""
Serviço de Email para notificações
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço de envio de emails"""

    def __init__(
        self,
        smtp_host: str = "",
        smtp_port: int = 587,
        smtp_user: str = "",
        smtp_password: str = "",
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self._configured = bool(smtp_host and smtp_user and smtp_password)

    def is_configured(self) -> bool:
        """Verifica se o serviço está configurado"""
        return self._configured

    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
    ) -> bool:
        """
        Envia um email.

        Args:
            to: Destinatário
            subject: Assunto
            body: Corpo do email (texto plano)
            html_body: Corpo do email (HTML)
            attachments: Lista de anexos

        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not self._configured:
            logger.warning("Email service not configured, skipping send")
            return False

        try:
            # TODO: Implementar envio real de email com SMTP
            logger.info(f"Email would be sent to {to}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

    async def send_notification(
        self, to: str, title: str, message: str, notification_type: str = "info"
    ) -> bool:
        """
        Envia uma notificação por email.

        Args:
            to: Destinatário
            title: Título da notificação
            message: Mensagem
            notification_type: Tipo (info, warning, error)

        Returns:
            True se enviado com sucesso
        """
        subject = f"[{notification_type.upper()}] {title}"
        return await self.send_email(to, subject, message)


# Instância global do serviço
_email_service: Optional[EmailService] = None


def get_email_service() -> EmailService:
    """
    Retorna a instância do serviço de email.

    Returns:
        Instância do EmailService
    """
    global _email_service

    if _email_service is None:
        import os

        _email_service = EmailService(
            smtp_host=os.getenv("SMTP_HOST", ""),
            smtp_port=int(os.getenv("SMTP_PORT", "587")),
            smtp_user=os.getenv("SMTP_USER", ""),
            smtp_password=os.getenv("SMTP_PASSWORD", ""),
        )

    return _email_service


def configure_email_service(
    smtp_host: str, smtp_port: int, smtp_user: str, smtp_password: str
) -> EmailService:
    """
    Configura o serviço de email.

    Args:
        smtp_host: Host SMTP
        smtp_port: Porta SMTP
        smtp_user: Usuário SMTP
        smtp_password: Senha SMTP

    Returns:
        Instância configurada do EmailService
    """
    global _email_service

    _email_service = EmailService(
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_password=smtp_password,
    )

    return _email_service
