"""
Testes E2E para Streamlit App (usando requests, sem Selenium)
Equivalente a tests/e2e/basic.spec.ts

Para rodar os testes com o backend:
1. Inicie o backend: cd streamlit-app/backend && python main.py
2. Inicie o Streamlit: cd streamlit-app && streamlit run app.py
3. Execute: pytest tests/test_e2e.py -v
"""

import os

import logging

import pytest
import requests

# URLs configuráveis via variáveis de ambiente
STREAMLIT_URL = os.getenv("STREAMLIT_URL", "http://localhost:8501")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

logger = logging.getLogger(__name__)


def is_service_available(url: str, timeout: int = 2) -> bool:
    """Verifica se um serviço está disponível"""
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code < 500
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"Service unavailable at {url}: Connection error - {e}")
        return False
    except requests.exceptions.Timeout as e:
        logger.warning(f"Service unavailable at {url}: Timeout - {e}")
        return False
    except requests.exceptions.RequestException as e:
        logger.warning(f"Service unavailable at {url}: Request error - {e}")
        return False


class TestStreamlitE2E:
    """Testes E2E do aplicativo Streamlit usando HTTP"""

    @pytest.fixture
    def streamlit_url(self):
        """URL base do Streamlit"""
        return STREAMLIT_URL

    @pytest.fixture
    def backend_url(self):
        """URL base do backend FastAPI"""
        return BACKEND_URL

    def test_streamlit_app_esta_rodando(self, streamlit_url):
        """Testar se app Streamlit está rodando"""
        if not is_service_available(streamlit_url):
            pytest.skip(f"Streamlit não está rodando em {streamlit_url}")

        response = requests.get(streamlit_url, timeout=5)
        assert response.status_code == 200
        assert (
            "streamlit" in response.text.lower()
            or "assistente" in response.text.lower()
        )

    def test_backend_esta_rodando(self, backend_url):
        """Testar se backend FastAPI está rodando"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip(f"Backend não está rodando em {backend_url}")

        response = requests.get(f"{backend_url}/api/health", timeout=5)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["ok", "healthy", "degraded"]

    def test_backend_api_docs(self, backend_url):
        """Testar se documentação da API está disponível"""
        if not is_service_available(f"{backend_url}/api/docs"):
            pytest.skip("Backend não está rodando")

        response = requests.get(f"{backend_url}/api/docs", timeout=5)
        assert response.status_code == 200
        assert "swagger" in response.text.lower() or "openapi" in response.text.lower()

    def test_backend_listar_processos(self, backend_url):
        """Testar endpoint de listagem de processos"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip("Backend não está rodando")

        response = requests.get(f"{backend_url}/api/processos", timeout=5)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list) or "processos" in data

    def test_backend_listar_agentes(self, backend_url):
        """Testar endpoint de listagem de agentes"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip("Backend não está rodando")

        response = requests.get(f"{backend_url}/api/agentes", timeout=5)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Deve ter pelo menos os 9 agentes ativos
        if len(data) > 0:
            assert len(data) >= 9

    def test_backend_criar_processo(self, backend_url):
        """Testar criação de processo via API"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip("Backend não está rodando")

        processo_novo = {
            "numero_cnj": "0009999-99.2024.8.02.0001",
            "titulo": "Teste E2E - Processo",
            "autor": "João Teste",
            "reu": "Empresa Teste LTDA",
            "tipo": "trabalhista",
            "status": "ativo",
        }

        response = requests.post(
            f"{backend_url}/api/processos", json=processo_novo, timeout=10
        )

        # Aceita 200 ou 201
        assert response.status_code in [200, 201]
        data = response.json()
        assert "id" in data or "numero_cnj" in data


class TestIntegracaoCompleta:
    """Testes de integração end-to-end"""

    @pytest.fixture
    def backend_url(self):
        """URL do backend"""
        return BACKEND_URL

    def test_fluxo_completo_processo(self, backend_url):
        """Testar fluxo completo: criar processo, listar, buscar"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip("Backend não está rodando")

        # 1. Criar processo
        processo = {
            "numero_cnj": "0007777-77.2024.8.02.0001",
            "titulo": "Fluxo Completo E2E",
            "autor": "Teste Autor",
            "reu": "Teste Réu",
            "tipo": "trabalhista",
            "status": "ativo",
        }

        create_response = requests.post(
            f"{backend_url}/api/processos", json=processo, timeout=10
        )

        assert create_response.status_code in [200, 201]
        processo_criado = create_response.json()
        processo_id = processo_criado.get("id") or processo_criado.get("numero_cnj")

        # 2. Listar processos
        list_response = requests.get(f"{backend_url}/api/processos", timeout=5)
        assert list_response.status_code == 200

        # 3. Buscar processo específico
        if processo_id:
            get_response = requests.get(
                f"{backend_url}/api/processos/{processo_id}", timeout=5
            )
            # Aceita 200 (encontrado) ou 404 (ainda não implementado busca por ID)
            assert get_response.status_code in [200, 404, 501]

    def test_fluxo_executar_agente(self, backend_url):
        """Testar execução de agente end-to-end"""
        if not is_service_available(f"{backend_url}/api/health"):
            pytest.skip("Backend não está rodando")

        payload = {
            "agente_id": "harvey",
            "input": "Análise estratégica de teste E2E",
            "config": {},
        }

        response = requests.post(
            f"{backend_url}/api/agentes/executar", json=payload, timeout=30
        )

        # Aceita sucesso ou 501 (não implementado)
        assert response.status_code in [200, 501]

        if response.status_code == 200:
            data = response.json()
            assert "output" in data or "result" in data


class TestPerformance:
    """Testes de performance básicos"""

    def test_tempo_resposta_health(self):
        """Testar tempo de resposta do health check"""
        if not is_service_available(f"{BACKEND_URL}/api/health"):
            pytest.skip("Backend não está rodando")

        import time

        start = time.time()
        response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
        elapsed = time.time() - start

        assert response.status_code == 200
        # Deve responder em menos de 1 segundo
        assert elapsed < 1.0

    def test_multiplas_requisicoes_simultaneas(self):
        """Testar múltiplas requisições simultâneas"""
        if not is_service_available(f"{BACKEND_URL}/api/health"):
            pytest.skip("Backend não está rodando")

        import concurrent.futures

        def fazer_requisicao():
            response = requests.get(f"{BACKEND_URL}/api/health", timeout=5)
            return response.status_code == 200

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(fazer_requisicao) for _ in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]

        # Todas as requisições devem ter sucesso
        assert all(results)
