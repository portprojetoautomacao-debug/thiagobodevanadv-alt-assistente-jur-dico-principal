"""
Rate Limiter - Controle Inteligente de Taxa por Usuário/Agente.

Implementa rate limiting granular com sliding window e token bucket.
"""

import asyncio
import logging
import time
from collections import defaultdict, deque
from typing import Dict, Optional, Tuple

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Exceção quando rate limit é excedido."""
    pass


class InMemoryRateLimiter:
    """
    Rate limiter em memória com sliding window.

    Features:
    - Por usuário/agente/endpoint
    - Sliding window algorithm
    - Retry-after headers
    - Estatísticas de uso
    """

    def __init__(
        self,
        max_requests: int = 10,
        window_seconds: int = 60,
        burst_size: Optional[int] = None
    ):
        """
        Args:
            max_requests: Máximo de requisições na janela
            window_seconds: Tamanho da janela em segundos
            burst_size: Tamanho do burst (ou max_requests * 1.5)
        """
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.burst_size = burst_size or int(max_requests * 1.5)

        # Armazenar timestamps por key
        self._requests: Dict[str, deque] = defaultdict(lambda: deque())
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

        # Estatísticas
        self._stats = {
            "total_requests": 0,
            "blocked_requests": 0,
            "by_key": defaultdict(lambda: {"allowed": 0, "blocked": 0})
        }

    async def acquire(self, key: str, wait: bool = True) -> bool:
        """
        Tenta adquirir permissão para fazer requisição.

        Args:
            key: Identificador (user_id, agent_id, etc)
            wait: Se True, aguarda até ter permissão

        Returns:
            True se permitido, False se bloqueado (quando wait=False)

        Raises:
            RateLimitExceeded: Se bloqueado e wait=False
        """
        async with self._locks[key]:
            now = time.time()

            # Limpar requisições antigas
            self._clean_old_requests(key, now)

            requests = self._requests[key]

            # Verificar limite
            if len(requests) < self.max_requests:
                requests.append(now)
                self._stats["total_requests"] += 1
                self._stats["by_key"][key]["allowed"] += 1
                return True

            # Limite excedido
            if not wait:
                self._stats["blocked_requests"] += 1
                self._stats["by_key"][key]["blocked"] += 1

                retry_after = self._calculate_retry_after(key, now)
                raise RateLimitExceeded(
                    f"Rate limit excedido para '{key}'. "
                    f"Retry após {retry_after:.1f}s"
                )

            # Aguardar próximo slot
            retry_after = self._calculate_retry_after(key, now)
            logger.warning(
                f"⏰ Rate limit para '{key}': aguardando {retry_after:.1f}s"
            )

            await asyncio.sleep(retry_after)

            # Tentar novamente após aguardar
            return await self.acquire(key, wait=False)

    def _clean_old_requests(self, key: str, now: float):
        """Remove requisições fora da janela."""
        requests = self._requests[key]
        cutoff = now - self.window_seconds

        while requests and requests[0] < cutoff:
            requests.popleft()

    def _calculate_retry_after(self, key: str, now: float) -> float:
        """Calcula tempo até próximo slot disponível."""
        requests = self._requests[key]

        if not requests:
            return 0.0

        oldest = requests[0]
        time_until_expire = (oldest + self.window_seconds) - now

        return max(0.0, time_until_expire)

    def get_remaining(self, key: str) -> int:
        """Retorna requisições restantes na janela."""
        now = time.time()
        self._clean_old_requests(key, now)

        requests = self._requests[key]
        return max(0, self.max_requests - len(requests))

    def get_stats(self, key: Optional[str] = None) -> Dict:
        """Retorna estatísticas de uso."""
        if key:
            return self._stats["by_key"].get(key, {"allowed": 0, "blocked": 0})

        return {
            "total_requests": self._stats["total_requests"],
            "blocked_requests": self._stats["blocked_requests"],
            "block_rate": (
                self._stats["blocked_requests"] / self._stats["total_requests"]
                if self._stats["total_requests"] > 0 else 0
            ),
            "keys": len(self._stats["by_key"])
        }

    def reset(self, key: Optional[str] = None):
        """Reseta limites."""
        if key:
            self._requests[key].clear()
        else:
            self._requests.clear()


class TokenBucketRateLimiter:
    """
    Rate limiter com algoritmo token bucket.

    Permite bursts controlados.
    """

    def __init__(
        self,
        rate: float = 10.0,  # tokens por segundo
        capacity: int = 20,   # capacidade do bucket
    ):
        """
        Args:
            rate: Taxa de reposição de tokens por segundo
            capacity: Capacidade máxima do bucket
        """
        self.rate = rate
        self.capacity = capacity

        self._tokens: Dict[str, float] = defaultdict(lambda: capacity)
        self._last_update: Dict[str, float] = defaultdict(time.time)
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    async def acquire(self, key: str, tokens: int = 1, wait: bool = True) -> bool:
        """
        Tenta adquirir tokens.

        Args:
            key: Identificador
            tokens: Número de tokens necessários
            wait: Se deve aguardar tokens disponíveis

        Returns:
            True se adquirido
        """
        async with self._locks[key]:
            now = time.time()

            # Repor tokens baseado no tempo
            self._refill_tokens(key, now)

            # Verificar se há tokens suficientes
            if self._tokens[key] >= tokens:
                self._tokens[key] -= tokens
                return True

            if not wait:
                raise RateLimitExceeded(
                    f"Tokens insuficientes para '{key}'. "
                    f"Disponível: {self._tokens[key]:.1f}, Necessário: {tokens}"
                )

            # Calcular tempo de espera
            tokens_needed = tokens - self._tokens[key]
            wait_time = tokens_needed / self.rate

            logger.warning(
                f"⏰ Aguardando {wait_time:.1f}s para {tokens} tokens em '{key}'"
            )

            await asyncio.sleep(wait_time)

            return await self.acquire(key, tokens, wait=False)

    def _refill_tokens(self, key: str, now: float):
        """Repõe tokens baseado no tempo decorrido."""
        elapsed = now - self._last_update[key]
        new_tokens = elapsed * self.rate

        self._tokens[key] = min(
            self.capacity,
            self._tokens[key] + new_tokens
        )

        self._last_update[key] = now

    def get_available_tokens(self, key: str) -> float:
        """Retorna tokens disponíveis."""
        now = time.time()
        self._refill_tokens(key, now)
        return self._tokens[key]


# Singleton global por tipo
_rate_limiters: Dict[str, InMemoryRateLimiter] = {}


def get_rate_limiter(name: str = "default") -> InMemoryRateLimiter:
    """
    Retorna rate limiter global.

    Usage:
        limiter = get_rate_limiter("gemini")
        await limiter.acquire("user_123")
    """
    if name not in _rate_limiters:
        # Configuração padrão: 10 req/min
        _rate_limiters[name] = InMemoryRateLimiter(
            max_requests=10,
            window_seconds=60
        )

    return _rate_limiters[name]


def setup_rate_limiter(
    name: str,
    max_requests: int,
    window_seconds: int
) -> InMemoryRateLimiter:
    """
    Configura rate limiter customizado.

    Usage:
        # Gemini: 10 req/min
        setup_rate_limiter("gemini", max_requests=10, window_seconds=60)

        # OpenAI: 60 req/min
        setup_rate_limiter("openai", max_requests=60, window_seconds=60)
    """
    limiter = InMemoryRateLimiter(
        max_requests=max_requests,
        window_seconds=window_seconds
    )

    _rate_limiters[name] = limiter

    logger.info(
        f"✅ Rate limiter '{name}' configurado: "
        f"{max_requests} req/{window_seconds}s"
    )

    return limiter


# Example usage
"""
# Setup
from lib.rate_limiter import setup_rate_limiter, get_rate_limiter

# Configurar para Gemini (10 req/min)
setup_rate_limiter("gemini", max_requests=10, window_seconds=60)

# Usar em agentes
async def execute_with_rate_limit(user_id: str, task: str):
    limiter = get_rate_limiter("gemini")

    # Tenta adquirir permissão (aguarda se necessário)
    await limiter.acquire(f"user:{user_id}")

    # Executar tarefa
    result = await llm.ainvoke(task)

    return result

# Ver estatísticas
limiter = get_rate_limiter("gemini")
stats = limiter.get_stats()
print(f"Total: {stats['total_requests']}")
print(f"Bloqueados: {stats['blocked_requests']}")
print(f"Taxa de bloqueio: {stats['block_rate']:.2%}")

# Stats por usuário
user_stats = limiter.get_stats("user:123")
print(f"Usuário 123: {user_stats}")
"""
