"""
Streaming Avançado com astream_events - LangChain Best Practices.

Implementa streaming granular com controle de backpressure e eventos detalhados.
"""

import asyncio
import logging
from typing import AsyncIterator, Dict, Any, Optional
from enum import Enum

from langchain_core.runnables import Runnable
from langchain_core.messages import BaseMessage

logger = logging.getLogger(__name__)


class StreamEventType(str, Enum):
    """Tipos de eventos de streaming."""
    START = "on_chain_start"
    END = "on_chain_end"
    ERROR = "on_chain_error"
    LLM_START = "on_llm_start"
    LLM_NEW_TOKEN = "on_llm_new_token"
    LLM_END = "on_llm_end"
    TOOL_START = "on_tool_start"
    TOOL_END = "on_tool_end"
    RETRIEVER_START = "on_retriever_start"
    RETRIEVER_END = "on_retriever_end"


class StreamManager:
    """
    Gerenciador de streaming avançado com astream_events.

    Features:
    - Streaming granular com eventos detalhados
    - Controle de backpressure
    - Filtragem de eventos
    - Métricas em tempo real
    """

    def __init__(
        self,
        buffer_size: int = 100,
        enable_metrics: bool = True
    ):
        """
        Args:
            buffer_size: Tamanho do buffer para backpressure
            enable_metrics: Habilitar coleta de métricas
        """
        self.buffer_size = buffer_size
        self.enable_metrics = enable_metrics
        self._metrics: Dict[str, Any] = {}

    async def stream_with_events(
        self,
        runnable: Runnable,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None,
        include_types: Optional[list] = None,
        exclude_types: Optional[list] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream com eventos detalhados usando astream_events.

        Args:
            runnable: Chain ou agente executável
            input_data: Dados de entrada
            config: Configuração opcional
            include_types: Tipos de eventos para incluir
            exclude_types: Tipos de eventos para excluir

        Yields:
            Eventos do streaming
        """
        config = config or {}

        # Inicializar métricas
        if self.enable_metrics:
            self._metrics = {
                "total_tokens": 0,
                "total_events": 0,
                "token_rate": 0,
                "events_by_type": {}
            }

        try:
            # Buffer para controle de backpressure
            buffer = asyncio.Queue(maxsize=self.buffer_size)

            async def producer():
                """Produz eventos do streaming."""
                try:
                    async for event in runnable.astream_events(
                        input_data,
                        config=config,
                        version="v2"  # Usar v2 para eventos mais detalhados
                    ):
                        # Filtrar eventos
                        event_type = event.get("event")

                        if include_types and event_type not in include_types:
                            continue
                        if exclude_types and event_type in exclude_types:
                            continue

                        # Atualizar métricas
                        if self.enable_metrics:
                            self._update_metrics(event)

                        # Adicionar ao buffer
                        await buffer.put(event)

                    # Sinalizar fim
                    await buffer.put(None)

                except Exception as e:
                    logger.error(f"Erro no producer: {e}")
                    await buffer.put({"event": "error", "error": str(e)})
                    await buffer.put(None)

            # Iniciar producer em background
            producer_task = asyncio.create_task(producer())

            # Consumer: yield eventos do buffer
            while True:
                event = await buffer.get()

                if event is None:
                    break

                # Adicionar métricas ao evento se habilitado
                if self.enable_metrics:
                    event["metrics"] = self._get_current_metrics()

                yield event

            # Aguardar producer finalizar
            await producer_task

        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield {
                "event": "error",
                "error": str(e),
                "type": "stream_error"
            }

    async def stream_tokens_only(
        self,
        runnable: Runnable,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[str]:
        """
        Stream apenas tokens (texto), ideal para UI simples.

        Args:
            runnable: Chain ou agente executável
            input_data: Dados de entrada
            config: Configuração opcional

        Yields:
            Tokens de texto
        """
        async for event in self.stream_with_events(
            runnable,
            input_data,
            config,
            include_types=[StreamEventType.LLM_NEW_TOKEN]
        ):
            if event.get("event") == StreamEventType.LLM_NEW_TOKEN:
                data = event.get("data", {})
                chunk = data.get("chunk", {})

                # Extrair texto do chunk
                if hasattr(chunk, "content"):
                    yield chunk.content
                elif isinstance(chunk, dict) and "content" in chunk:
                    yield chunk["content"]
                elif isinstance(chunk, str):
                    yield chunk

    async def stream_with_tool_calls(
        self,
        runnable: Runnable,
        input_data: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream com informações de tool calls para debugging.

        Args:
            runnable: Chain ou agente executável
            input_data: Dados de entrada
            config: Configuração opcional

        Yields:
            Eventos com tool calls e tokens
        """
        async for event in self.stream_with_events(
            runnable,
            input_data,
            config,
            include_types=[
                StreamEventType.LLM_NEW_TOKEN,
                StreamEventType.TOOL_START,
                StreamEventType.TOOL_END
            ]
        ):
            event_type = event.get("event")

            if event_type == StreamEventType.LLM_NEW_TOKEN:
                yield {
                    "type": "token",
                    "content": self._extract_token(event)
                }

            elif event_type == StreamEventType.TOOL_START:
                yield {
                    "type": "tool_start",
                    "tool": event.get("name"),
                    "input": event.get("data", {}).get("input")
                }

            elif event_type == StreamEventType.TOOL_END:
                yield {
                    "type": "tool_end",
                    "tool": event.get("name"),
                    "output": event.get("data", {}).get("output")
                }

    def _extract_token(self, event: Dict[str, Any]) -> str:
        """Extrai token de um evento."""
        data = event.get("data", {})
        chunk = data.get("chunk", {})

        if hasattr(chunk, "content"):
            return chunk.content
        elif isinstance(chunk, dict) and "content" in chunk:
            return chunk["content"]
        elif isinstance(chunk, str):
            return chunk

        return ""

    def _update_metrics(self, event: Dict[str, Any]):
        """Atualiza métricas do streaming."""
        event_type = event.get("event")

        self._metrics["total_events"] += 1

        # Contar por tipo
        if event_type not in self._metrics["events_by_type"]:
            self._metrics["events_by_type"][event_type] = 0
        self._metrics["events_by_type"][event_type] += 1

        # Contar tokens
        if event_type == StreamEventType.LLM_NEW_TOKEN:
            self._metrics["total_tokens"] += 1

    def _get_current_metrics(self) -> Dict[str, Any]:
        """Retorna métricas atuais."""
        return self._metrics.copy()

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas finais."""
        return self._metrics


# Convenience functions

async def stream_response(
    runnable: Runnable,
    input_data: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None
) -> AsyncIterator[str]:
    """
    Helper para streaming simples de texto.

    Usage:
        async for token in stream_response(chain, {"input": "texto"}):
            print(token, end="", flush=True)
    """
    manager = StreamManager(enable_metrics=False)
    async for token in manager.stream_tokens_only(runnable, input_data, config):
        yield token


async def stream_with_status(
    runnable: Runnable,
    input_data: Dict[str, Any],
    config: Optional[Dict[str, Any]] = None
) -> AsyncIterator[Dict[str, Any]]:
    """
    Helper para streaming com status de ferramentas.

    Usage:
        async for event in stream_with_status(agent, {"input": "análise"}):
            if event["type"] == "token":
                print(event["content"])
            elif event["type"] == "tool_start":
                print(f"🔧 Executando: {event['tool']}")
    """
    manager = StreamManager()
    async for event in manager.stream_with_tool_calls(runnable, input_data, config):
        yield event
