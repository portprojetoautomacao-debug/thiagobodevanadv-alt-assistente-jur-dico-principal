"""
Utilitários de cache para o sistema jurídico
"""

import functools
import time
from datetime import datetime, timedelta
from typing import Any, Callable, Optional


class SimpleCache:
    """Cache simples em memória com TTL"""

    def __init__(self):
        self._cache: dict = {}
        self._expiry: dict = {}

    def get(self, key: str) -> Optional[Any]:
        """Obtém valor do cache se não expirado"""
        if key in self._cache:
            if key in self._expiry and datetime.now() > self._expiry[key]:
                del self._cache[key]
                del self._expiry[key]
                return None
            return self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Define valor no cache com TTL em segundos"""
        self._cache[key] = value
        self._expiry[key] = datetime.now() + timedelta(seconds=ttl)

    def delete(self, key: str) -> bool:
        """Remove item do cache"""
        if key in self._cache:
            del self._cache[key]
            if key in self._expiry:
                del self._expiry[key]
            return True
        return False

    def clear(self) -> None:
        """Limpa todo o cache"""
        self._cache.clear()
        self._expiry.clear()

    def exists(self, key: str) -> bool:
        """Verifica se chave existe e não expirou (independente do valor)"""
        # Primeiro verifica se a chave está no cache
        if key not in self._cache:
            return False
        # Verifica expiração
        if key in self._expiry and datetime.now() > self._expiry[key]:
            del self._cache[key]
            del self._expiry[key]
            return False
        # Chave existe e não expirou (mesmo que valor seja None)
        return True


# Instância global do cache
_global_cache = SimpleCache()


def cache_result(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator para cachear resultado de funções

    Args:
        ttl: Time to live em segundos (padrão: 300 = 5 minutos)
        key_prefix: Prefixo opcional para a chave do cache
    """

    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Gera chave única baseada nos argumentos
            cache_key = (
                f"{key_prefix}{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            )

            # Tenta obter do cache
            cached_value = _global_cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Executa função e armazena resultado
            result = func(*args, **kwargs)
            _global_cache.set(cache_key, result, ttl)

            return result

        return wrapper

    return decorator


def get_cache() -> SimpleCache:
    """Retorna instância global do cache"""
    return _global_cache


def clear_cache() -> None:
    """Limpa o cache global"""
    _global_cache.clear()
