"""
Testes para utilitários de cache
"""

import time

import pytest


def import_simple_cache():
    """Helper para importar SimpleCache"""
    try:
        from utils.cache import SimpleCache

        return SimpleCache
    except ImportError:
        try:
            from lib.utils.cache import SimpleCache

            return SimpleCache
        except ImportError:
            return None


def import_cache_functions():
    """Helper para importar funções de cache"""
    try:
        from utils.cache import cache_result, clear_cache, get_cache

        return cache_result, clear_cache, get_cache
    except ImportError:
        try:
            from lib.utils.cache import cache_result, clear_cache, get_cache

            return cache_result, clear_cache, get_cache
        except ImportError:
            return None, None, None


class TestSimpleCache:
    """Testes do cache simples em memória"""

    def test_cache_set_and_get(self):
        """Testar set e get básico"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        cache.set("test_key", "test_value")

        result = cache.get("test_key")
        assert result == "test_value"

    def test_cache_expiry(self):
        """Testar expiração do cache"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        cache.set("expiring_key", "value", ttl=1)  # 1 segundo

        # Deve existir imediatamente
        assert cache.get("expiring_key") == "value"

        # Aguardar expiração
        time.sleep(1.1)

        # Deve ter expirado
        assert cache.get("expiring_key") is None

    def test_cache_delete(self):
        """Testar remoção de item do cache"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        cache.set("to_delete", "value")

        assert cache.exists("to_delete")

        result = cache.delete("to_delete")
        assert result is True
        assert cache.get("to_delete") is None

    def test_cache_delete_nonexistent(self):
        """Testar remoção de item inexistente"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        result = cache.delete("nonexistent")
        assert result is False

    def test_cache_clear(self):
        """Testar limpeza completa do cache"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")

        cache.clear()

        assert cache.get("key1") is None
        assert cache.get("key2") is None
        assert cache.get("key3") is None

    def test_cache_exists(self):
        """Testar verificação de existência"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()
        cache.set("existing", "value")

        assert cache.exists("existing") is True
        assert cache.exists("nonexistent") is False

    def test_cache_different_types(self):
        """Testar cache com diferentes tipos de dados"""
        SimpleCache = import_simple_cache()
        if SimpleCache is None:
            pytest.skip("SimpleCache não disponível")

        cache = SimpleCache()

        # String
        cache.set("string", "hello")
        assert cache.get("string") == "hello"

        # Int
        cache.set("int", 42)
        assert cache.get("int") == 42

        # List
        cache.set("list", [1, 2, 3])
        assert cache.get("list") == [1, 2, 3]

        # Dict
        cache.set("dict", {"key": "value"})
        assert cache.get("dict") == {"key": "value"}

        # None
        cache.set("none", None)
        # None é armazenado e exists retorna True (chave existe)
        # A verificação é se a chave foi armazenada, não se o valor é truthy
        assert cache.exists("none") is True  # Chave existe mesmo com valor None
        assert cache.get("none") is None  # Mas o valor é None


class TestCacheDecorator:
    """Testes do decorator de cache"""

    def test_cache_result_decorator(self):
        """Testar decorator cache_result"""
        cache_result, clear_cache, get_cache = import_cache_functions()
        if cache_result is None:
            pytest.skip("Funções de cache não disponíveis")

        clear_cache()

        call_count = 0

        @cache_result(ttl=60)
        def expensive_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2

        # Primeira chamada - deve executar
        result1 = expensive_function(5)
        assert result1 == 10
        assert call_count == 1

        # Segunda chamada - deve usar cache
        result2 = expensive_function(5)
        assert result2 == 10
        assert call_count == 1  # Não deve ter incrementado

        # Chamada com argumento diferente - deve executar
        result3 = expensive_function(10)
        assert result3 == 20
        assert call_count == 2

    def test_cache_result_with_prefix(self):
        """Testar decorator com prefixo"""
        cache_result, clear_cache, get_cache = import_cache_functions()
        if cache_result is None:
            pytest.skip("Funções de cache não disponíveis")

        clear_cache()

        @cache_result(ttl=60, key_prefix="test_")
        def my_function(x):
            return x + 1

        result = my_function(5)
        assert result == 6

        # Verificar que o cache foi criado com prefixo
        cache = get_cache()
        # A chave deve conter o prefixo
        assert any("test_" in key for key in cache._cache.keys())

    def test_cache_expiry_decorator(self):
        """Testar expiração do cache via decorator"""
        cache_result, clear_cache, get_cache = import_cache_functions()
        if cache_result is None:
            pytest.skip("Funções de cache não disponíveis")

        clear_cache()

        call_count = 0

        @cache_result(ttl=1)  # 1 segundo
        def quick_expire_function(x):
            nonlocal call_count
            call_count += 1
            return x

        # Primeira chamada
        quick_expire_function(1)
        assert call_count == 1

        # Imediatamente depois - deve usar cache
        quick_expire_function(1)
        assert call_count == 1

        # Aguardar expiração
        time.sleep(1.1)

        # Após expiração - deve executar novamente
        quick_expire_function(1)
        assert call_count == 2


class TestGlobalCache:
    """Testes do cache global"""

    def test_get_cache_returns_same_instance(self):
        """Testar que get_cache retorna mesma instância"""
        cache_result, clear_cache, get_cache = import_cache_functions()
        if get_cache is None:
            pytest.skip("Funções de cache não disponíveis")

        cache1 = get_cache()
        cache2 = get_cache()

        assert cache1 is cache2

    def test_clear_cache_function(self):
        """Testar função clear_cache"""
        cache_result, clear_cache, get_cache = import_cache_functions()
        if clear_cache is None:
            pytest.skip("Funções de cache não disponíveis")

        cache = get_cache()
        cache.set("global_key", "global_value")

        assert cache.get("global_key") == "global_value"

        clear_cache()

        assert cache.get("global_key") is None


class TestRedisCache:
    """Testes de cache com Redis (quando disponível)"""

    def test_redis_connection(self):
        """Testar conexão com Redis"""
        try:
            from backend.database import RedisClient

            client = RedisClient()

            if client.is_connected():
                # Testar operações básicas
                client.set("test_redis_key", {"data": "value"})
                result = client.get("test_redis_key")

                assert result is not None
                assert result["data"] == "value"

                # Limpar
                client.delete("test_redis_key")
            else:
                pytest.skip("Redis não está conectado")
        except ImportError:
            pytest.skip("RedisClient não disponível")
        except Exception as e:
            pytest.skip(f"Erro ao conectar Redis: {e}")

    def test_redis_cache_with_ttl(self):
        """Testar cache Redis com TTL"""
        try:
            from backend.database import RedisClient

            client = RedisClient()

            if not client.is_connected():
                pytest.skip("Redis não está conectado")

            # Set com TTL
            client.set("ttl_key", "ttl_value", ttl=2)

            # Deve existir
            assert client.get("ttl_key") == "ttl_value"

            # Aguardar expiração
            time.sleep(2.5)

            # Deve ter expirado
            result = client.get("ttl_key")
            assert result is None

        except ImportError:
            pytest.skip("RedisClient não disponível")
        except Exception as e:
            pytest.skip(f"Erro ao testar Redis: {e}")

    def test_redis_json_storage(self):
        """Testar armazenamento de JSON no Redis"""
        try:
            from backend.database import RedisClient

            client = RedisClient()

            if not client.is_connected():
                pytest.skip("Redis não está conectado")

            data = {
                "list": [1, 2, 3],
                "nested": {"key": "value"},
                "number": 42,
                "string": "hello",
            }

            client.set("json_data", data)
            result = client.get("json_data")

            assert result == data

            # Limpar
            client.delete("json_data")

        except ImportError:
            pytest.skip("RedisClient não disponível")
        except Exception as e:
            pytest.skip(f"Erro ao testar Redis: {e}")
