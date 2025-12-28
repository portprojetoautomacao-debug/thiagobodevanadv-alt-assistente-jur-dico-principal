"""
Sistema de Notificações por Email
Envia alertas sobre novas intimações DJEN
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class EmailService:
    """Serviço de envio de emails para notificações."""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.to_emails = os.getenv("NOTIFICATION_EMAILS", "").split(",")

    def enviar_alerta_intimacoes(
        self, intimacoes: List[Dict[str, Any]], tarefas_geradas: int = 0
    ) -> bool:
        """
        Envia email com resumo de novas intimações.

        Args:
            intimacoes: Lista de intimações a notificar
            tarefas_geradas: Número de tarefas criadas automaticamente

        Returns:
            True se enviado com sucesso, False caso contrário
        """
        if not intimacoes:
            logger.info("Sem intimações para notificar")
            return True

        if not self.to_emails or not self.smtp_user:
            logger.warning(
                "⚠️ Configuração de email não encontrada. Pulando notificação."
            )
            return False

        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            # Preparar conteúdo do email
            subject = f"🔔 {len(intimacoes)} Nova(s) Intimação(ões) - PJe"

            # HTML do email
            html_body = self._gerar_html_email(intimacoes, tarefas_geradas)

            # Criar mensagem
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = ", ".join(self.to_emails)

            # Adicionar HTML
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            # Enviar via SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                if self.smtp_password:
                    server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)

            logger.info(f"✅ Email enviado para {len(self.to_emails)} destinatário(s)")
            return True

        except Exception as e:
            logger.error(f"❌ Erro ao enviar email: {e}")
            return False

    def _gerar_html_email(
        self, intimacoes: List[Dict[str, Any]], tarefas_geradas: int
    ) -> str:
        """Gera HTML formatado para o email."""

        intimacoes_html = ""
        for idx, intimacao in enumerate(intimacoes[:10], 1):  # Máximo 10
            intimacoes_html += f"""
            <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #007bff; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; color: #333;">
                    {idx}. {intimacao.get('tipo', 'Intimação')}
                </h3>
                <p style="margin: 5px 0;">
                    <strong>Tribunal:</strong> {intimacao.get('tribunal', 'N/A')}<br>
                    <strong>Processo:</strong> {intimacao.get('numeroProcesso', 'N/A')}<br>
                    <strong>Data:</strong> {intimacao.get('data', 'N/A')}<br>
                    <strong>Órgão:</strong> {intimacao.get('orgao', 'N/A')}
                </p>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
                    {intimacao.get('teor', '')[:200]}...
                </p>
            </div>
            """

        if len(intimacoes) > 10:
            intimacoes_html += f"""
            <div style="padding: 10px; text-align: center; color: #666;">
                ... e mais {len(intimacoes) - 10} intimação(ões)
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                    ⚖️ Assistente Jurídico PJe
                </h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                    Novas Intimações Detectadas
                </p>
            </div>

            <div style="background: white; padding: 30px; border: 1px solid #e1e4e8; border-top: none; border-radius: 0 0 8px 8px;">

                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #155724;">
                        <strong>📊 Resumo:</strong><br>
                        • {len(intimacoes)} nova(s) intimação(ões) capturada(s)<br>
                        • {tarefas_geradas} tarefa(s) criada(s) automaticamente<br>
                        • Data: {datetime.now().strftime('%d/%m/%Y às %H:%M')}
                    </p>
                </div>

                <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
                    Intimações Recebidas
                </h2>

                {intimacoes_html}

                <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px;">
                    <p style="margin: 0; color: #856404;">
                        <strong>⏰ Próximas Ações:</strong><br>
                        • Acesse o sistema para revisar as intimações<br>
                        • Verifique os prazos gerados automaticamente<br>
                        • Aprove ou ajuste as tarefas sugeridas
                    </p>
                </div>

                <div style="margin-top: 20px; text-align: center;">
                    <a href="{os.getenv('APP_URL', 'http://localhost:8501')}"
                       style="display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                        Acessar Sistema
                    </a>
                </div>

            </div>

            <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
                <p>
                    Este é um email automático do Assistente Jurídico PJe.<br>
                    Processado por Mrs. Justin-e • Monitoramento via API DJEN (CNJ)
                </p>
            </div>

        </body>
        </html>
        """

        return html

    def testar_configuracao(self) -> Dict[str, Any]:
        """
        Testa a configuração de email.

        Returns:
            Dict com status e informações da configuração
        """
        status = {
            "configurado": bool(self.smtp_user and self.to_emails),
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "from_email": self.from_email,
            "to_emails": self.to_emails,
            "smtp_user_configurado": bool(self.smtp_user),
            "smtp_password_configurado": bool(self.smtp_password),
        }

        return status


# Singleton
_email_service = None


def get_email_service() -> EmailService:
    """Retorna instância singleton do serviço de email."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service
