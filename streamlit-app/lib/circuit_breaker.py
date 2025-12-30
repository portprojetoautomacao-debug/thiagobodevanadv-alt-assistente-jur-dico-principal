"""
Circuit Breaker Pattern - Proteção Contra Falhas em Cascata.

Implementa circuit breaker para APIs externas com estados CLOSED, OPEN, HALF_OPEN.
"""

import asyncio
import logging
import time
from enum import Enum
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    """Estados do circuit breaker."""
    CLOSED = "closed"      # Funcionando normalmente
    OPEN = "open"          # Falhas detectadas, bloqueando chamadas
    HALF_OPEN = "half_open"  # Testando se voltou a funcionar


class CircuitBreakerError(Exception):
    """Erro quando circuit está aberto."""
    pass


class CircuitBreaker:
    """
    Circuit Breaker para proteger chamadas a APIs externas.

    Estados:
    - CLOSED: Funcionando normal, permite todas as chamadas
    - OPEN: Falhas detectadas, bloqueia todas as chamadas
    - HALF_OPEN: Teste, permite algumas chamadas para verificar recuperação

    Features:
    - Threshold configurável de falhas
    - Timeout para tentar novamente
    - Métricas de falhas e sucessos
    - Callback para notificações
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception,
        name: str = "default"
    ):
        """
        Args:
            failure_threshold: Número de falhas antes de abrir
            recovery_timeout: Tempo (segundos) antes de tentar HALF_OPEN
            expected_exception: Tipo de exceção que conta como falha
            name: Nome do circuit breaker
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.name = name

        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time: Optional[float] = None
        self._opened_at: Optional[float] = None

        # Estatísticas
        self._stats = {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "rejected_calls": 0,
            "state_changes": 0
        }

    @property
    def state(self) -> CircuitState:
        """Retorna estado atual."""
        return self._state

    def _change_state(self, new_state: CircuitState):
        """Muda o estado do circuit."""
        if new_state != self._state:
            old_state = self._state
            self._state = new_state
            self._stats["state_changes"] += 1

            logger.warning(
                f"🔴 Circuit '{self.name}': {old_state.value} → {new_state.value}"
            )

            if new_state == CircuitState.OPEN:
                self._opened_at = time.time()

    async def call(
        self,
        func: Callable,
        *args,
        fallback: Optional[Callable] = None,
        **kwargs
    ) -> Any:
        """
        Executa função protegida pelo circuit breaker.

        Args:
            func: Função a executar
            *args: Argumentos posicionais
            fallback: Função de fallback se circuit estiver aberto
            **kwargs: Argumentos nomeados

        Returns:
            Resultado da função

        Raises:
            CircuitBreakerError: Se circuit estiver aberto e não houver fallback
        """
        self._stats["total_calls"] += 1

        # Verificar estado
        if self._state == CircuitState.OPEN:
            # Verificar se deve tentar HALF_OPEN
            if self._should_attempt_reset():
                self._change_state(CircuitState.HALF_OPEN)
            else:
                # Ainda aberto, rejeitar
                self._stats["rejected_calls"] += 1

                if fallback:
                    logger.warning(
                        f"⚠️ Circuit '{self.name}' OPEN, usando fallback"
                    )
                    return await self._execute_fallback(fallback, *args, **kwargs)

                raise CircuitBreakerError(
                    f"Circuit breaker '{self.name}' está OPEN. "
                    f"Tentando novamente em {self._time_until_retry():.0f}s"
                )

        # Executar função
        try:
            if asyncio.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)

            # Sucesso
            self._on_success()
            self._stats["successful_calls"] += 1

            return result

        except self.expected_exception as e:
            # Falha
            self._on_failure()
            self._stats["failed_calls"] += 1

            # Se tiver fallback, usar
            if fallback:
                logger.warning(
                    f"⚠️ Falha em '{self.name}', usando fallback: {e}"
                )
                return await self._execute_fallback(fallback, *args, **kwargs)

            raise

    async def _execute_fallback(self, fallback: Callable, *args, **kwargs) -> Any:
        """Executa função de fallback."""
        try:
            if asyncio.iscoroutinefunction(fallback):
                return await fallback(*args, **kwargs)
            else:
                return fallback(*args, **kwargs)
        except Exception as e:
            logger.error(f"❌ Fallback também falhou: {e}")
            raise

    def _on_success(self):
        """Chamado em sucesso."""
        self._failure_count = 0
        self._success_count += 1

        if self._state == CircuitState.HALF_OPEN:
            # Recuperou, fechar circuit
            self._change_state(CircuitState.CLOSED)
            logger.info(f"✅ Circuit '{self.name}' recuperado, voltando a CLOSED")

    def _on_failure(self):
        """Chamado em falha."""
        self._failure_count += 1
        self._last_failure_time = time.time()

        if self._state == CircuitState.HALF_OPEN:
            # Falhou no teste, abrir novamente
            self._change_state(CircuitState.OPEN)

        elif self._state == CircuitState.CLOSED:
            # Verificar se deve abrir
            if self._failure_count >= self.failure_threshold:
                self._change_state(CircuitState.OPEN)
                logger.error(
                    f"🔴 Circuit '{self.name}' OPEN após {self._failure_count} falhas"
                )

    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar reset."""
        if self._opened_at is None:
            return False

        elapsed = time.time() - self._opened_at
        return elapsed >= self.recovery_timeout

    def _time_until_retry(self) -> float:
        """Tempo até próxima tentativa."""
        if self._opened_at is None:
            return 0.0

        elapsed = time.time() - self._opened_at
        remaining = self.recovery_timeout - elapsed
        return max(0.0, remaining)

    def reset(self):
        """Reseta manualmente o circuit breaker."""
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._last_failure_time = None
        self._opened_at = None

        logger.info(f"🔄 Circuit '{self.name}' resetado manualmente")

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas."""
        total = self._stats["total_calls"]
        success_rate = (
            self._stats["successful_calls"] / total
            if total > 0 else 0
        )

        return {
            **self._stats,
            "state": self._state.value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "success_rate": success_rate,
            "time_until_retry": self._time_until_retry()
        }


# Global registry
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: int = 60
) -> CircuitBreaker:
    """
    Retorna circuit breaker global por nome.

    Usage:
        cb = get_circuit_breaker("api_externa", failure_threshold=3)
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout
        )
        logger.info(
            f"✅ Circuit breaker '{name}' criado "
            f"(threshold: {failure_threshold}, timeout: {recovery_timeout}s)"
        )

    return _circuit_breakers[name]


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: int = 60,
    fallback: Optional[Callable] = None
):
    """
    Decorator para proteger funções com circuit breaker.

    Usage:
        @circuit_breaker("api_externa", failure_threshold=3)
        async def call_external_api():
            # código que pode falhar
            pass
    """
    def decorator(func: Callable) -> Callable:
        cb = get_circuit_breaker(name, failure_threshold, recovery_timeout)

        async def wrapper(*args, **kwargs):
            return await cb.call(func, *args, fallback=fallback, **kwargs)

        return wrapper

    return decorator


# Example usage
"""
from lib.circuit_breaker import get_circuit_breaker, circuit_breaker

# 1. Uso direto
cb = get_circuit_breaker("djen_api", failure_threshold=3, recovery_timeout=30)

async def buscar_djen():
    # Lógica que pode falhar
    response = await http_client.get("https://djen.gov.br/...")
    return response

# Proteger chamada
try:
    resultado = await cb.call(buscar_djen)
except CircuitBreakerError:
    # Circuit está aberto
    resultado = usar_cache()

# 2. Uso com fallback
async def fallback_cache():
    return load_from_cache()

resultado = await cb.call(buscar_djen, fallback=fallback_cache)

# 3. Como decorator
@circuit_breaker("gemini_api", failure_threshold=5, recovery_timeout=60)
async def call_gemini(prompt: str):
    response = await llm.ainvoke(prompt)
    return response

# Usar normalmente
resultado = await call_gemini("Analise isto")

# 4. Monitorar
stats = cb.get_stats()
print(f"Estado: {stats['state']}")
print(f"Taxa de sucesso: {stats['success_rate']:.1%}")
print(f"Rejeitadas: {stats['rejected_calls']}")

# 5. Reset manual
cb.reset()
"""
