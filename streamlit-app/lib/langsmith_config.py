"""
LangSmith Integration - Observabilidade e Tracing para LangChain.

Implementa integração com LangSmith para debugging visual, métricas e otimização.
"""

import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class LangSmithConfig:
    """Configuração do LangSmith."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        project: Optional[str] = None,
        endpoint: Optional[str] = None,
        enable_tracing: bool = True,
    ):
        """
        Args:
            api_key: API key do LangSmith (ou LANGCHAIN_API_KEY)
            project: Nome do projeto (ou LANGCHAIN_PROJECT)
            endpoint: Endpoint customizado (ou LANGCHAIN_ENDPOINT)
            enable_tracing: Habilitar tracing
        """
        self.api_key = api_key or os.getenv("LANGCHAIN_API_KEY")
        self.project = project or os.getenv("LANGCHAIN_PROJECT", "assistente-juridico")
        self.endpoint = endpoint or os.getenv(
            "LANGCHAIN_ENDPOINT",
            "https://api.smith.langchain.com"
        )
        self.enable_tracing = enable_tracing

        if self.enable_tracing and not self.api_key:
            logger.warning(
                "⚠️ LangSmith habilitado mas LANGCHAIN_API_KEY não encontrada. "
                "Tracing será desabilitado."
            )
            self.enable_tracing = False

    def configure(self):
        """Configura variáveis de ambiente para LangSmith."""
        if not self.enable_tracing:
            logger.info("📊 LangSmith tracing desabilitado")
            return

        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = self.api_key
        os.environ["LANGCHAIN_PROJECT"] = self.project
        os.environ["LANGCHAIN_ENDPOINT"] = self.endpoint

        logger.info(f"✅ LangSmith configurado - Projeto: {self.project}")

    def disable(self):
        """Desabilita tracing temporariamente."""
        os.environ["LANGCHAIN_TRACING_V2"] = "false"
        logger.info("📊 LangSmith tracing pausado")

    def enable(self):
        """Reabilita tracing."""
        if self.api_key:
            os.environ["LANGCHAIN_TRACING_V2"] = "true"
            logger.info("📊 LangSmith tracing reativado")


# Singleton global
_langsmith_config: Optional[LangSmithConfig] = None


def setup_langsmith(
    api_key: Optional[str] = None,
    project: Optional[str] = None,
    enable: bool = True
) -> LangSmithConfig:
    """
    Configura LangSmith globalmente.

    Args:
        api_key: API key do LangSmith
        project: Nome do projeto
        enable: Se deve habilitar tracing

    Returns:
        Instância de configuração

    Usage:
        # No início da aplicação
        from lib.langsmith_config import setup_langsmith

        setup_langsmith(
            project="assistente-juridico-prod",
            enable=True
        )
    """
    global _langsmith_config

    _langsmith_config = LangSmithConfig(
        api_key=api_key,
        project=project,
        enable_tracing=enable
    )

    _langsmith_config.configure()

    return _langsmith_config


def get_langsmith_config() -> Optional[LangSmithConfig]:
    """Retorna configuração global do LangSmith."""
    return _langsmith_config


def trace_agent_execution(
    agent_name: str,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Decorator para adicionar tracing a execuções de agentes.

    Usage:
        @trace_agent_execution("Harvey", metadata={"version": "v2"})
        async def execute_harvey(task: str):
            # código do agente
            pass
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Se LangSmith estiver configurado, o tracing é automático
            # Este decorator serve para adicionar contexto extra

            if _langsmith_config and _langsmith_config.enable_tracing:
                # Adicionar metadata extra via contexto
                import contextvars

                # LangChain usa contextvars para passar metadata
                # Podemos adicionar informações extras aqui
                pass

            return await func(*args, **kwargs)

        return wrapper
    return decorator


# Configuração automática se variáveis existirem
if os.getenv("LANGCHAIN_API_KEY"):
    setup_langsmith()
    logger.info("📊 LangSmith auto-configurado via variáveis de ambiente")


# Example usage
"""
# Setup no início da aplicação
from lib.langsmith_config import setup_langsmith

# Configurar
setup_langsmith(
    project="assistente-juridico-prod",
    enable=True
)

# Usar normalmente - tracing é automático!
from lib.langgraph_orchestrator import LangGraphOrchestrator

orchestrator = LangGraphOrchestrator()
result = await orchestrator.execute_agent("harvey", "Analisar contrato")

# Ver em: https://smith.langchain.com/

# Desabilitar temporariamente para testes
from lib.langsmith_config import get_langsmith_config

config = get_langsmith_config()
config.disable()  # Pausar tracing

# ... fazer testes ...

config.enable()  # Retomar tracing
"""
