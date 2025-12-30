import logging
import os
import socket
from urllib.parse import urlparse
from typing import Any, Dict

from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory

logger = logging.getLogger(__name__)


class MemoryManager:
    """Gerenciador de memória para agentes."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MemoryManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._local_memory: Dict[str, BaseChatMessageHistory] = {}
        self.use_redis = False

        # Tentar configurar Redis apenas se explicitamente habilitado
        redis_url = os.getenv("UPSTASH_REDIS_REST_URL")
        redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
        redis_enabled = os.getenv("ENABLE_UPSTASH_CHAT_HISTORY", "false").lower() == "true"

        if redis_enabled and redis_url and redis_token:
            try:
                from langchain_community.chat_message_histories import (
                    UpstashRedisChatMessageHistory,
                )

                self.UpstashRedisChatMessageHistory = UpstashRedisChatMessageHistory
                self.redis_url = redis_url
                self.redis_token = redis_token
                self.use_redis = True
                logger.info("✅ MemoryManager: Redis configurado")
            except ImportError:
                logger.warning(
                    "⚠️ MemoryManager: langchain_community não suporta UpstashRedis ou dependência faltando. Usando memória local."
                )

        self._initialized = True

    def get_session_history(self, session_id: str) -> BaseChatMessageHistory:
        """Retorna o histórico de mensagens para uma sessão."""

        if self.use_redis:
            try:
                history = self.UpstashRedisChatMessageHistory(
                    url=self.redis_url,
                    token=self.redis_token,
                    session_id=session_id,
                    ttl=3600,  # 1 hora
                )
                # Sanidade: se URL for inválida/placeholder, desabilitar redis
                try:
                    host = urlparse(self.redis_url).hostname
                    if host:
                        socket.gethostbyname(host)
                except Exception as e:
                    logger.warning(
                        f"⚠️ Redis Upstash parece inacessível (DNS). Fallback local: {e}"
                    )
                    self.use_redis = False
                    raise

                # Tocar em .messages para validar conectividade; fallback se falhar
                _ = history.messages  # noqa: F841
                return history
            except Exception as e:
                logger.error(f"Erro ao conectar Redis: {e}. Fallback para local.")
                self.use_redis = False

        # Fallback ou modo local
        if session_id not in self._local_memory:
            self._local_memory[session_id] = InMemoryChatMessageHistory()

        return self._local_memory[session_id]

    def clear_session(self, session_id: str):
        """Limpa histórico da sessão."""
        if self.use_redis:
            try:
                history = self.get_session_history(session_id)
                history.clear()
            except Exception:
                pass

        if session_id in self._local_memory:
            del self._local_memory[session_id]
