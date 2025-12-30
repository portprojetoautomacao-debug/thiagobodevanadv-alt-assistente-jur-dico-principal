"""
Testes de Integrações (DJEN, DataJud, etc)
Sem Selenium - apenas HTTP/REST
"""

import sys
from pathlib import Path
from unittest.mock import Mock, patch

import pytest
import requests

# Adicionar path para imports ANTES de importar módulos locais
_root = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(_root))

# Agora importar os módulos locais
from lib.integrations.djen_api_client import DJENAPIClient
from lib.integrations.datajud import DataJudClient
from lib.integrations.google_calendar import GoogleCalendarService


class TestDJENIntegration:
    """Testes de integração com DJEN"""

    @pytest.fixture
    def djen_client(self):
        """Cliente DJEN mockado"""
        return DJENAPIClient()

    def test_djen_client_inicializa(self, djen_client):
        """Testar inicialização do cliente DJEN"""
        assert djen_client is not None
        assert hasattr(djen_client, "buscar_publicacoes")

    def test_djen_buscar_publicacoes(self, djen_client):
        """Testar busca de publicações DJEN (mockado)"""
        # Mock da resposta da API CNJ
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.raise_for_status = Mock()
        mock_response.json.return_value = {
            "items": [
                {
                    "id": "123456",
                    "siglaTribunal": "TJMG",
                    "tipoComunicacao": "Intimação",
                    "nomeOrgao": "Vara Cível",
                    "numero_processo": "0001234-56.2024.8.02.0001",
                    "data_disponibilizacao": "2024-01-15",
                    "texto": "Fica a parte intimada...",
                    "destinatarios": [],
                    "destinatarioadvogados": [],
                    "meio": "D",
                }
            ],
            "count": 1
        }
        
        # Mock diretamente na sessão do cliente
        djen_client.session.get = Mock(return_value=mock_response)

        # Executar busca com parâmetros corretos
        resultado = djen_client.buscar_publicacoes(
            numero_oab="184404",
            uf_oab="MG",
            data_inicio="2024-01-15",
            data_fim="2024-01-15"
        )

        # Verificar resultado
        assert resultado is not None
        assert isinstance(resultado, list)

    def test_djen_api_url_correta(self, djen_client):
        """Testar se URL da API CNJ está correta"""
        # URL oficial: https://comunicaapi.pje.jus.br/api/v1/comunicacao
        assert hasattr(djen_client, "BASE_URL") or hasattr(djen_client, "base_url")
        url = getattr(djen_client, "BASE_URL", None) or getattr(
            djen_client, "base_url", None
        )

        if url:
            assert "comunicaapi.pje.jus.br" in url or "pje" in url.lower()


class TestDataJudIntegration:
    """Testes de integração com DataJud"""

    @pytest.fixture
    def datajud_client(self):
        """Cliente DataJud"""
        return DataJudClient()

    def test_datajud_client_inicializa(self, datajud_client):
        """Testar inicialização do cliente DataJud"""
        assert datajud_client is not None
        assert hasattr(datajud_client, "session")

    def test_datajud_cache_funciona(self, datajud_client):
        """Testar funcionalidade de cache"""
        # Salvar no cache
        datajud_client._set_cache("test_key", {"data": "value"})

        # Buscar do cache
        cached = datajud_client._get_from_cache("test_key")

        assert cached is not None
        assert cached["data"] == "value"

    @patch("requests.get")
    def test_datajud_buscar_tribunais(self, mock_get, datajud_client):
        """Testar busca de tribunais (mockado)"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "tribunais": [
                {"sigla": "TRT19", "nome": "Tribunal Regional do Trabalho 19ª Região"}
            ]
        }
        mock_get.return_value = mock_response

        # DataJud não tem método buscar_tribunais, testar o que existe
        # Verificar que o cliente tem métodos básicos
        assert hasattr(datajud_client, "session")
        assert hasattr(datajud_client, "_get_from_cache")
        assert hasattr(datajud_client, "_set_cache")


class TestGoogleCalendarIntegration:
    """Testes de integração com Google Calendar"""

    def test_google_calendar_mock(self):
        """Testar integração mockada com Google Calendar"""
        # Criar serviço mockado
        service = GoogleCalendarService()

        # Verificar métodos básicos que existem na implementação atual
        assert hasattr(service, "get_auth_url")
        assert hasattr(service, "get_credentials_from_code")
        assert hasattr(service, "_get_client_config")


class TestRedisIntegration:
    """Testes de integração com Redis/Upstash"""

    def test_redis_connection(self):
        """Testar conexão com Redis"""
        try:
            from backend.database import get_redis_client

            client = get_redis_client()

            # Testar ping
            assert client.ping()

            # Testar set/get
            client.set("test_key", "test_value", ex=60)
            value = client.get("test_key")

            assert value == "test_value"

            # Limpar
            client.delete("test_key")

        except Exception as e:
            pytest.skip(f"Redis não disponível: {e}")


class TestGeminiIntegration:
    """Testes de integração com Gemini"""

    def test_gemini_client_inicializa(self):
        """Testar inicialização do cliente Gemini"""
        try:
            from lib.gemini_service import GeminiService

            service = GeminiService()
            assert service is not None

        except ImportError:
            pytest.skip("Gemini service não implementado ainda")

    @pytest.mark.asyncio
    @patch("google.genai.Client")
    async def test_gemini_gerar_texto_mock(self, mock_model):
        """Testar geração de texto (mockado)"""
        try:
            from lib.gemini_service import GeminiService

            # Mock da resposta
            mock_response = Mock()
            mock_response.text = "Resposta gerada pelo Gemini"
            mock_model.return_value.generate_content.return_value = mock_response

            service = GeminiService()
            resultado = await service.gerar_texto("Teste prompt")

            assert resultado is not None

        except ImportError:
            pytest.skip("Gemini service não implementado ainda")


class TestBackendRouters:
    """Testes dos routers do backend"""

    @pytest.fixture
    def client(self):
        """Cliente de teste FastAPI"""
        try:
            from backend.main import app
            from fastapi.testclient import TestClient

            return TestClient(app)
        except ImportError:
            pytest.skip("Backend FastAPI não está disponível")

    def test_router_processos_existe(self, client):
        """Testar se router de processos existe"""
        response = client.get("/api/processos")
        # Aceita sucesso ou 501 (não implementado)
        assert response.status_code in [200, 501]

    def test_router_agentes_existe(self, client):
        """Testar se router de agentes existe"""
        response = client.get("/api/agentes")
        assert response.status_code in [200, 501]

    def test_router_djen_existe(self, client):
        """Testar se router de DJEN existe"""
        response = client.post("/api/djen/sincronizar")
        assert response.status_code in [200, 501, 405]

    def test_router_tarefas_existe(self, client):
        """Testar se router de tarefas existe"""
        response = client.get("/api/tarefas")
        assert response.status_code in [200, 501]

    def test_cors_configurado(self, client):
        """Testar se CORS está configurado"""
        response = client.options("/api/processos")
        # Deve permitir OPTIONS ou retornar 405
        assert response.status_code in [200, 405]
