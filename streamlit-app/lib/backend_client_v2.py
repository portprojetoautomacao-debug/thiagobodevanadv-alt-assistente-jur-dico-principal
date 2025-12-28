"""
Atualização do cliente backend para usar FastAPI local.

Agora suporta dois modos:
1. Backend Vercel (Node.js) - Produção
2. Backend FastAPI (Python) - Desenvolvimento/alternativo
"""

import requests
from typing import Dict, List, Any, Optional
from config import BACKEND_CONFIG
import os

class BackendClient:
    """Cliente para comunicação com backend (Vercel ou FastAPI)."""

    def __init__(self, use_local_backend: bool = False):
        if use_local_backend:
            # Backend FastAPI local
            self.base_url = os.getenv("LOCAL_BACKEND_URL", "http://localhost:8000/api")
            self.backend_type = "FastAPI"
        else:
            # Backend Vercel (padrão)
            self.base_url = BACKEND_CONFIG["url"]
            self.backend_type = "Vercel"

        self.api_key = BACKEND_CONFIG["api_key"]
        self.timeout = BACKEND_CONFIG["timeout"]
        self.session = requests.Session()

        if self.api_key:
            self.session.headers.update({
                "X-API-Key": self.api_key
            })

        print(f"🔌 Backend Client inicializado: {self.backend_type} ({self.base_url})")

    def check_health(self) -> Dict[str, Any]:
        """Verifica saúde do backend."""
        try:
            response = self.session.get(
                f"{self.base_url}/health",
                timeout=5
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "ok",
                    "environment": data.get("environment", "unknown"),
                    "backend": data.get("backend", self.backend_type),
                    "timestamp": data.get("timestamp"),
                    "version": data.get("version", "unknown")
                }
            else:
                return {"status": "error", "code": response.status_code}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # ... (resto do código permanece igual)

    # ============================================
    # KV Store (Redis)
    # ============================================

    def kv_get(self, key: str) -> Optional[Any]:
        """Busca valor no Redis."""
        try:
            response = self.session.post(
                f"{self.base_url}/kv",
                json={"action": "get", "key": key},
                timeout=self.timeout
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("value")
            return None
        except Exception as e:
            print(f"Erro ao buscar {key}: {e}")
            return None

    def kv_set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Salva valor no Redis."""
        try:
            payload = {"action": "set", "key": key, "value": value}
            if ttl:
                payload["ttl"] = ttl

            response = self.session.post(
                f"{self.base_url}/kv",
                json=payload,
                timeout=self.timeout
            )

            return response.status_code == 200
        except Exception as e:
            print(f"Erro ao salvar {key}: {e}")
            return False

    # ============================================
    # Processos
    # ============================================

    def get_processes(self) -> List[Dict[str, Any]]:
        """Busca lista de processos."""
        return self.kv_get("processes") or []

    def save_processes(self, processes: List[Dict[str, Any]]) -> bool:
        """Salva lista de processos."""
        return self.kv_set("processes", processes)

    # ============================================
    # Expedientes
    # ============================================

    def get_expedientes(self) -> List[Dict[str, Any]]:
        """Busca expedientes via API."""
        try:
            response = self.session.get(
                f"{self.base_url}/expedientes",
                timeout=self.timeout
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("expedientes", [])
            return []
        except Exception as e:
            print(f"Erro ao buscar expedientes: {e}")
            return []

    def create_expediente(self, expediente: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria novo expediente."""
        try:
            response = self.session.post(
                f"{self.base_url}/expedientes",
                json=expediente,
                timeout=self.timeout
            )

            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Erro ao criar expediente: {e}")
            return None

    # ============================================
    # Agentes
    # ============================================

    def get_agents(self) -> List[Dict[str, Any]]:
        """Busca lista de agentes."""
        try:
            response = self.session.get(
                f"{self.base_url}/agents",
                timeout=self.timeout
            )

            if response.status_code == 200:
                data = response.json()
                return data.get("agents", [])
            return []
        except Exception as e:
            print(f"Erro ao buscar agentes: {e}")
            return []

    def execute_agent_task(self, agent_id: str, task: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Executa tarefa em um agente."""
        try:
            response = self.session.post(
                f"{self.base_url}/agents/process-task",
                json={"agentId": agent_id, "task": task},
                timeout=60  # Agentes podem demorar
            )

            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            print(f"Erro ao executar agente {agent_id}: {e}")
            return None

    # ============================================
    # Métricas
    # ============================================

    def get_metrics(self) -> Dict[str, Any]:
        """Busca métricas dos agentes."""
        try:
            response = self.session.get(
                f"{self.base_url}/metrics",
                timeout=self.timeout
            )

            if response.status_code == 200:
                return response.json()
            return {}
        except Exception as e:
            print(f"Erro ao buscar métricas: {e}")
            return {}
