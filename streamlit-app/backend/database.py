"""
Cliente Redis/Upstash para persistência de dados.

Compatível com backend Node.js/Vercel original.
"""

import os
import json
from typing import Any, Optional
import requests
from pathlib import Path

# Carregar .env do diretório backend
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"📝 Carregando .env de: {env_path}")
except Exception as e:
    print(f"⚠️  Erro ao carregar .env: {e}")

class RedisClient:
    """Cliente Redis usando Upstash REST API."""

    def __init__(self):
        self.url = os.getenv("UPSTASH_REDIS_REST_URL", "")
        self.token = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

        # Verificar se deve usar mock
        use_mock = os.getenv("USE_REDIS_MOCK", "false").lower() == "true"

        if use_mock:
            print("🧪 Usando Redis Mock para desenvolvimento")
            self.enabled = False
            self.memory_cache = {}
            return

        self.enabled = bool(self.url and self.token)

        if self.enabled:
            # Testar conexão
            try:
                response = requests.get(
                    f"{self.url}/ping",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=5
                )
                if response.status_code == 200:
                    print(f"✅ Redis conectado: {self.url[:40]}...")
                else:
                    print(f"⚠️  Redis configurado mas não respondendo (status: {response.status_code})")
                    self.enabled = False
            except Exception as e:
                print(f"⚠️  Redis não acessível: {str(e)[:80]}")
                print("   Usando fallback em memória para desenvolvimento")
                self.enabled = False
            print(f"   UPSTASH_REDIS_REST_TOKEN: {'✓' if self.token else '✗'}")

        self.memory_cache = {}

    def is_connected(self) -> bool:
        """Verifica se Redis está conectado."""
        if not self.enabled:
            return False

        try:
            response = requests.get(
                f"{self.url}/ping",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

    def get(self, key: str) -> Optional[Any]:
        """Busca valor no Redis."""
        if not self.enabled:
            return self.memory_cache.get(key)

        try:
            response = requests.get(
                f"{self.url}/get/{key}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("result")

                if result:
                    # Tentar parsear JSON
                    try:
                        return json.loads(result)
                    except:
                        return result

            return None
        except Exception as e:
            print(f"Erro ao buscar {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Salva valor no Redis."""
        if not self.enabled:
            self.memory_cache[key] = value
            return True

        try:
            # Serializar valor
            if isinstance(value, (dict, list)):
                value_str = json.dumps(value)
            else:
                value_str = str(value)

            # Preparar comando
            if ttl:
                url = f"{self.url}/setex/{key}/{ttl}"
            else:
                url = f"{self.url}/set/{key}"

            response = requests.post(
                url,
                headers={"Authorization": f"Bearer {self.token}"},
                data=value_str
            )

            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao salvar {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Deleta chave do Redis."""
        if not self.enabled:
            if key in self.memory_cache:
                del self.memory_cache[key]
            return True

        try:
            response = requests.delete(
                f"{self.url}/del/{key}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao deletar {key}: {e}")
            return False

    def keys(self, pattern: str = "*") -> list:
        """Lista chaves que correspondem ao padrão."""
        if not self.enabled:
            import fnmatch
            return [k for k in self.memory_cache.keys() if fnmatch.fnmatch(k, pattern)]

        try:
            response = requests.get(
                f"{self.url}/keys/{pattern}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("result", [])

            return []
        except Exception as e:
            print(f"Erro ao listar chaves: {e}")
            return []

    def exists(self, key: str) -> bool:
        """Verifica se chave existe."""
        if not self.enabled:
            return key in self.memory_cache

        try:
            response = requests.get(
                f"{self.url}/exists/{key}",
                headers={"Authorization": f"Bearer {self.token}"}
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("result", 0) == 1

            return False
        except:
            return False
