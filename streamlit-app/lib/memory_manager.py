import logging
import os
from typing import Any, Dict

from langchain.memory import ChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory

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

        # Tentar configurar Redis
        redis_url = os.getenv("UPSTASH_REDIS_REST_URL")
        redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")

        if redis_url and redis_token:
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
                return self.UpstashRedisChatMessageHistory(
                    url=self.redis_url,
                    token=self.redis_token,
                    session_id=session_id,
                    ttl=3600,  # 1 hora
                )
            except Exception as e:
                logger.error(f"Erro ao conectar Redis: {e}. Fallback para local.")

        # Fallback ou modo local
        if session_id not in self._local_memory:
            self._local_memory[session_id] = ChatMessageHistory()

        return self._local_memory[session_id]

    def clear_session(self, session_id: str):
        """Limpa histórico da sessão."""
        if self.use_redis:
            try:
                history = self.get_session_history(session_id)
                history.clear()
            except:
                pass

        if session_id in self._local_memory:
            del self._local_memory[session_id]
