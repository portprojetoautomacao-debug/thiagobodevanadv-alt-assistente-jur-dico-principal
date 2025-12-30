"""
LangSmith Integration - Observabilidade e Tracing Avançado.

Integra LangSmith para tracing automático de agentes e chains.
"""

import logging
import os
from typing import Any, Dict, Optional
from functools import wraps

logger = logging.getLogger(__name__)


class LangSmithTracer:
    """
    Gerenciador de tracing com LangSmith.

    Features:
    - Tracing automático de chains
    - Métricas de performance
    - Debugging visual
    - Anotações customizadas
    """

    def __init__(
        self,
        project_name: Optional[str] = None,
        api_key: Optional[str] = None,
        endpoint: Optional[str] = None,
        enabled: bool = True
    ):
        """
        Args:
            project_name: Nome do projeto no LangSmith
            api_key: API key do LangSmith
            endpoint: Endpoint customizado
            enabled: Se o tracing está habilitado
        """
        self.enabled = enabled and os.getenv("ENABLE_LANGSMITH", "false").lower() == "true"

        if not self.enabled:
            logger.info("📊 LangSmith tracing desabilitado")
            return

        self.project_name = project_name or os.getenv("LANGSMITH_PROJECT", "assistente-juridico")
        self.api_key = api_key or os.getenv("LANGSMITH_API_KEY")
        self.endpoint = endpoint or os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")

        if not self.api_key:
            logger.warning("⚠️ LANGSMITH_API_KEY não encontrada, tracing desabilitado")
            self.enabled = False
            return

        # Configurar variáveis de ambiente para LangSmith
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_PROJECT"] = self.project_name
        os.environ["LANGCHAIN_API_KEY"] = self.api_key
        os.environ["LANGCHAIN_ENDPOINT"] = self.endpoint

        logger.info(f"✅ LangSmith tracing habilitado (projeto: {self.project_name})")

    def trace_agent(self, func):
        """
        Decorator para traçar execução de agentes.

        Usage:
            @tracer.trace_agent
            async def execute(self, task, context):
                ...
        """
        if not self.enabled:
            return func

        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                from langsmith import traceable
                traced_func = traceable(name=func.__name__)(func)
                return await traced_func(*args, **kwargs)
            except ImportError:
                logger.warning("langsmith não instalado, usando função sem tracing")
                return await func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Erro no tracing: {e}")
                return await func(*args, **kwargs)

        return wrapper

    def add_metadata(self, metadata: Dict[str, Any]):
        """Adiciona metadata ao trace atual."""
        if not self.enabled:
            return

        try:
            from langsmith import get_current_run_tree

            run = get_current_run_tree()
            if run:
                run.metadata.update(metadata)
        except Exception as e:
            logger.debug(f"Não foi possível adicionar metadata: {e}")

    def add_tags(self, tags: list):
        """Adiciona tags ao trace atual."""
        if not self.enabled:
            return

        try:
            from langsmith import get_current_run_tree

            run = get_current_run_tree()
            if run:
                run.tags.extend(tags)
        except Exception as e:
            logger.debug(f"Não foi possível adicionar tags: {e}")


# Singleton global
_global_tracer: Optional[LangSmithTracer] = None


def get_tracer() -> LangSmithTracer:
    """Retorna tracer global."""
    global _global_tracer

    if _global_tracer is None:
        _global_tracer = LangSmithTracer()

    return _global_tracer


def enable_tracing(
    project_name: Optional[str] = None,
    api_key: Optional[str] = None
) -> LangSmithTracer:
    """
    Habilita tracing globalmente.

    Usage:
        tracer = enable_tracing(project_name="meu-projeto")
    """
    global _global_tracer
    _global_tracer = LangSmithTracer(
        project_name=project_name,
        api_key=api_key,
        enabled=True
    )
    return _global_tracer


def disable_tracing():
    """Desabilita tracing globalmente."""
    global _global_tracer
    _global_tracer = LangSmithTracer(enabled=False)


# Decorator conveniente
def trace(func):
    """
    Decorator simples para tracing.

    Usage:
        @trace
        async def my_function():
            ...
    """
    tracer = get_tracer()
    return tracer.trace_agent(func)


# Context manager para tracing temporário
class TracingContext:
    """Context manager para habilitar tracing temporariamente."""

    def __init__(self, project_name: str = "temp-project", **kwargs):
        self.project_name = project_name
        self.kwargs = kwargs
        self.original_tracer = None

    def __enter__(self):
        global _global_tracer
        self.original_tracer = _global_tracer
        _global_tracer = LangSmithTracer(
            project_name=self.project_name,
            enabled=True,
            **self.kwargs
        )
        return _global_tracer

    def __exit__(self, exc_type, exc_val, exc_tb):
        global _global_tracer
        _global_tracer = self.original_tracer


# Example usage
"""
# Configurar tracing no início do app
from lib.langsmith_integration import enable_tracing

tracer = enable_tracing(project_name="assistente-juridico")

# Usar decorator em agentes
from lib.langsmith_integration import trace

class MyAgent(BaseAgent):
    @trace
    async def execute(self, task, context):
        # Automaticamente traced
        result = await self.llm.ainvoke(task)
        return {"response": result.content}

# Adicionar metadata customizada
tracer.add_metadata({
    "user_id": "123",
    "session_id": "abc",
    "agent_version": "1.0"
})

# Context manager temporário
from lib.langsmith_integration import TracingContext

with TracingContext("debug-session"):
    # Código com tracing habilitado
    result = await agent.execute(task)
"""
