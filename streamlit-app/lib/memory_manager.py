import logging
import os
import socket
import time
from urllib.parse import urlparse
from typing import Any, Callable, Dict, Optional

from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

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

    def with_message_history(self, runnable, input_messages_key: str = "input", history_messages_key: str = "chat_history"):
        """
        Wrapper para criar RunnableWithMessageHistory com LCEL.

        Uso:
            chain = prompt | llm | output_parser
            chain_with_history = memory_manager.with_message_history(chain)
            result = chain_with_history.invoke(
                {"input": "mensagem"},
                config={"configurable": {"session_id": "user_123"}}
            )

        Args:
            runnable: Cadeia LCEL (prompt | llm | parser)
            input_messages_key: Key para input no dict
            history_messages_key: Key para histórico no dict

        Returns:
            RunnableWithMessageHistory configurado
        """
        return RunnableWithMessageHistory(
            runnable,
            self.get_session_history,
            input_messages_key=input_messages_key,
            history_messages_key=history_messages_key,
        )

    def create_history_aware_retriever(self, retriever, llm, contextualize_q_prompt):
        """
        Cria retriever com consciência de histórico para RAG.

        Args:
            retriever: Vector store retriever
            llm: Modelo de linguagem
            contextualize_q_prompt: Prompt para contextualizar queries

        Returns:
            History-aware retriever
        """
        from langchain.chains import create_history_aware_retriever

        return create_history_aware_retriever(
            llm,
            retriever,
            contextualize_q_prompt
        )

    def get_session_with_ttl(
        self,
        session_id: str,
        ttl_seconds: int = 3600
    ) -> BaseChatMessageHistory:
        """
        Retorna histórico com TTL automático.

        Args:
            session_id: ID da sessão
            ttl_seconds: Tempo de vida em segundos (1h default)

        Returns:
            Histórico da sessão
        """
        history = self.get_session_history(session_id)

        # Registrar tempo de acesso
        if not hasattr(self, '_session_timestamps'):
            self._session_timestamps = {}

        self._session_timestamps[session_id] = time.time()

        return history

    def cleanup_expired_sessions(self, ttl_seconds: int = 3600):
        """
        Remove sessões expiradas da memória local.

        Args:
            ttl_seconds: Tempo de vida das sessões
        """
        if not hasattr(self, '_session_timestamps'):
            return

        now = time.time()
        expired = []

        for session_id, timestamp in self._session_timestamps.items():
            if now - timestamp > ttl_seconds:
                expired.append(session_id)

        for session_id in expired:
            if session_id in self._local_memory:
                del self._local_memory[session_id]
            del self._session_timestamps[session_id]

        if expired:
            logger.info(f"🧹 Limpeza: {len(expired)} sessões expiradas removidas")

    def create_summary_memory(
        self,
        llm,
        max_token_limit: int = 2000
    ):
        """
        Cria memória com sumarização automática.

        Args:
            llm: Modelo para sumarização
            max_token_limit: Limite de tokens antes de sumarizar

        Returns:
            ConversationSummaryBufferMemory

        Usage:
            memory = manager.create_summary_memory(llm, max_token_limit=2000)
            chain = ConversationChain(llm=llm, memory=memory)
        """
        try:
            from langchain.memory import ConversationSummaryBufferMemory

            return ConversationSummaryBufferMemory(
                llm=llm,
                max_token_limit=max_token_limit,
                return_messages=True
            )
        except ImportError:
            logger.warning("ConversationSummaryBufferMemory não disponível")
            return None


