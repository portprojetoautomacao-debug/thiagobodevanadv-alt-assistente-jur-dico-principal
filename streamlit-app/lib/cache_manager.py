"""
Sistema de Cache para LangChain - InMemoryCache e RedisCache.

Implementa caching de embeddings e responses para reduzir latência e custo.
"""

import hashlib
import json
import logging
import os
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union

logger = logging.getLogger(__name__)


class BaseCache(ABC):
    """Interface base para cache."""

    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """Recupera valor do cache."""
        pass

    @abstractmethod
    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Armazena valor no cache."""
        pass

    @abstractmethod
    def delete(self, key: str):
        """Remove valor do cache."""
        pass

    @abstractmethod
    def clear(self):
        """Limpa todo o cache."""
        pass

    def generate_key(self, *args, **kwargs) -> str:
        """Gera chave única baseada em argumentos."""
        content = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()


class InMemoryCache(BaseCache):
    """
    Cache em memória com TTL e LRU eviction.

    Ideal para:
    - Desenvolvimento local
    - Respostas frequentes
    - Cache de curta duração
    """

    def __init__(self, max_size: int = 1000, default_ttl: int = 3600):
        """
        Args:
            max_size: Número máximo de itens no cache
            default_ttl: TTL padrão em segundos (1h default)
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_order: List[str] = []
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}

    def get(self, key: str) -> Optional[Any]:
        """Recupera valor do cache."""
        if key not in self._cache:
            self._stats["misses"] += 1
            return None

        item = self._cache[key]

        # Verificar TTL
        if item["expires_at"] and time.time() > item["expires_at"]:
            self.delete(key)
            self._stats["misses"] += 1
            return None

        # Atualizar ordem de acesso (LRU)
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

        self._stats["hits"] += 1
        logger.debug(f"✅ Cache HIT: {key[:16]}...")
        return item["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Armazena valor no cache."""
        # Eviction se necessário
        if len(self._cache) >= self.max_size and key not in self._cache:
            self._evict_lru()

        ttl = ttl or self.default_ttl
        expires_at = time.time() + ttl if ttl else None

        self._cache[key] = {
            "value": value,
            "expires_at": expires_at,
            "created_at": time.time()
        }

        # Atualizar ordem de acesso
        if key in self._access_order:
            self._access_order.remove(key)
        self._access_order.append(key)

        logger.debug(f"💾 Cache SET: {key[:16]}... (TTL: {ttl}s)")

    def delete(self, key: str):
        """Remove valor do cache."""
        if key in self._cache:
            del self._cache[key]
        if key in self._access_order:
            self._access_order.remove(key)
        logger.debug(f"🗑️ Cache DELETE: {key[:16]}...")

    def clear(self):
        """Limpa todo o cache."""
        count = len(self._cache)
        self._cache.clear()
        self._access_order.clear()
        self._stats = {"hits": 0, "misses": 0, "evictions": 0}
        logger.info(f"🧹 Cache cleared: {count} items removed")

    def _evict_lru(self):
        """Remove item menos recentemente usado."""
        if not self._access_order:
            return

        lru_key = self._access_order.pop(0)
        if lru_key in self._cache:
            del self._cache[lru_key]
            self._stats["evictions"] += 1
            logger.debug(f"♻️ Cache EVICT: {lru_key[:16]}...")

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do cache."""
        total_requests = self._stats["hits"] + self._stats["misses"]
        hit_rate = self._stats["hits"] / total_requests if total_requests > 0 else 0

        return {
            **self._stats,
            "total_requests": total_requests,
            "hit_rate": hit_rate,
            "cache_size": len(self._cache),
            "max_size": self.max_size
        }


class RedisCache(BaseCache):
    """
    Cache com Redis (Upstash compatível).

    Ideal para:
    - Produção
    - Cache compartilhado entre instâncias
    - Persistência de longa duração
    """

    def __init__(
        self,
        redis_url: Optional[str] = None,
        redis_token: Optional[str] = None,
        default_ttl: int = 3600,
        prefix: str = "langchain:"
    ):
        """
        Args:
            redis_url: URL do Redis (ou UPSTASH_REDIS_REST_URL)
            redis_token: Token do Redis (ou UPSTASH_REDIS_REST_TOKEN)
            default_ttl: TTL padrão em segundos
            prefix: Prefixo para todas as chaves
        """
        self.redis_url = redis_url or os.getenv("UPSTASH_REDIS_REST_URL")
        self.redis_token = redis_token or os.getenv("UPSTASH_REDIS_REST_TOKEN")
        self.default_ttl = default_ttl
        self.prefix = prefix
        self._redis = None

        if not self.redis_url or not self.redis_token:
            raise ValueError(
                "Redis URL e token são obrigatórios. "
                "Defina UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN"
            )

        self._init_redis()

    def _init_redis(self):
        """Inicializa conexão Redis."""
        try:
            from upstash_redis import Redis

            self._redis = Redis(
                url=self.redis_url,
                token=self.redis_token
            )

            # Testar conexão
            self._redis.ping()
            logger.info("✅ Redis cache conectado")

        except ImportError:
            logger.error("upstash-redis não instalado. Use: pip install upstash-redis")
            raise
        except Exception as e:
            logger.error(f"Erro ao conectar Redis: {e}")
            raise

    def _make_key(self, key: str) -> str:
        """Adiciona prefixo à chave."""
        return f"{self.prefix}{key}"

    def get(self, key: str) -> Optional[Any]:
        """Recupera valor do cache."""
        try:
            full_key = self._make_key(key)
            value = self._redis.get(full_key)

            if value is None:
                logger.debug(f"❌ Cache MISS: {key[:16]}...")
                return None

            # Deserializar JSON
            logger.debug(f"✅ Cache HIT: {key[:16]}...")
            return json.loads(value)

        except Exception as e:
            logger.error(f"Erro ao recuperar do cache: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None):
        """Armazena valor no cache."""
        try:
            full_key = self._make_key(key)
            ttl = ttl or self.default_ttl

            # Serializar como JSON
            serialized = json.dumps(value)

            self._redis.setex(full_key, ttl, serialized)
            logger.debug(f"💾 Cache SET: {key[:16]}... (TTL: {ttl}s)")

        except Exception as e:
            logger.error(f"Erro ao salvar no cache: {e}")

    def delete(self, key: str):
        """Remove valor do cache."""
        try:
            full_key = self._make_key(key)
            self._redis.delete(full_key)
            logger.debug(f"🗑️ Cache DELETE: {key[:16]}...")

        except Exception as e:
            logger.error(f"Erro ao deletar do cache: {e}")

    def clear(self):
        """Limpa cache com o prefixo."""
        try:
            # Buscar todas as chaves com o prefixo
            pattern = f"{self.prefix}*"
            keys = self._redis.keys(pattern)

            if keys:
                self._redis.delete(*keys)
                logger.info(f"🧹 Redis cache cleared: {len(keys)} keys removed")
            else:
                logger.info("🧹 Redis cache already empty")

        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")


class CacheManager:
    """
    Gerenciador de cache com fallback automático.

    Tenta usar Redis, faz fallback para InMemory se falhar.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.use_redis = os.getenv("ENABLE_REDIS_CACHE", "false").lower() == "true"
        self._cache: BaseCache

        if self.use_redis:
            try:
                self._cache = RedisCache()
                logger.info("✅ Using Redis cache")
            except Exception as e:
                logger.warning(f"⚠️ Redis cache failed, using in-memory: {e}")
                self._cache = InMemoryCache()
                self.use_redis = False
        else:
            self._cache = InMemoryCache()
            logger.info("✅ Using in-memory cache")

        self._initialized = True

    def cache_llm_response(
        self,
        prompt: str,
        model: str,
        temperature: float,
        response: str,
        ttl: int = 3600
    ):
        """Cache de resposta LLM."""
        key = self._cache.generate_key(
            "llm",
            prompt=prompt,
            model=model,
            temperature=temperature
        )
        self._cache.set(key, response, ttl)

    def get_llm_response(
        self,
        prompt: str,
        model: str,
        temperature: float
    ) -> Optional[str]:
        """Recupera resposta LLM do cache."""
        key = self._cache.generate_key(
            "llm",
            prompt=prompt,
            model=model,
            temperature=temperature
        )
        return self._cache.get(key)

    def cache_embeddings(
        self,
        text: str,
        model: str,
        embeddings: List[float],
        ttl: int = 86400  # 24h
    ):
        """Cache de embeddings."""
        key = self._cache.generate_key("embedding", text=text, model=model)
        self._cache.set(key, embeddings, ttl)

    def get_embeddings(
        self,
        text: str,
        model: str
    ) -> Optional[List[float]]:
        """Recupera embeddings do cache."""
        key = self._cache.generate_key("embedding", text=text, model=model)
        return self._cache.get(key)

    def cache_tool_result(
        self,
        tool_name: str,
        tool_input: Dict[str, Any],
        result: Any,
        ttl: int = 1800  # 30 min
    ):
        """Cache de resultado de ferramenta."""
        key = self._cache.generate_key("tool", name=tool_name, input=tool_input)
        self._cache.set(key, result, ttl)

    def get_tool_result(
        self,
        tool_name: str,
        tool_input: Dict[str, Any]
    ) -> Optional[Any]:
        """Recupera resultado de ferramenta do cache."""
        key = self._cache.generate_key("tool", name=tool_name, input=tool_input)
        return self._cache.get(key)

    def clear_all(self):
        """Limpa todo o cache."""
        self._cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas (apenas InMemory)."""
        if isinstance(self._cache, InMemoryCache):
            return self._cache.get_stats()
        return {"type": "redis", "stats": "not available"}
