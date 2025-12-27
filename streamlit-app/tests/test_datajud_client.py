"""
Testes para DataJud API Client
"""

from unittest.mock import Mock, patch

import pytest
from lib.integrations.datajud import DataJudClient


class TestDataJudClient:
    """Testes do cliente DataJud"""

    def test_inicializacao(self):
        """Testar inicialização do cliente"""
        client = DataJudClient()

        assert client.session is not None
        assert client.BASE_URL is not None
        assert client.TIMEOUT == 30

    def test_inicializacao_com_api_key(self):
        """Testar inicialização com API key"""
        client = DataJudClient(api_key="test-key-123")

        assert client.api_key == "test-key-123"
        assert "Authorization" in client.session.headers

    def test_cache_funcionando(self):
        """Testar funcionalidade de cache"""
        client = DataJudClient()

        # Salvar no cache
        client._set_cache("test_key", {"data": "value"})

        # Buscar do cache
        cached = client._get_from_cache("test_key")

        assert cached is not None
        assert cached["data"] == "value"

    def test_cache_expirado(self):
        """Testar expiração de cache"""
        client = DataJudClient()
        client._cache_ttl = 0  # TTL zero

        client._set_cache("test_key", {"data": "value"})

        # Cache deve expirar imediatamente
        import time

        time.sleep(0.1)

        cached = client._get_from_cache("test_key")
        assert cached is None

    @patch("requests.Session.get")
    def test_buscar_processo_sucesso(self, mock_get, numero_cnj_teste):
        """Testar busca de processo com sucesso"""
        # Mock da resposta
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "hits": {
                "hits": [
                    {
                        "_source": {
                            "numeroProcesso": numero_cnj_teste,
                            "tribunal": "TJAL",
                            "classe": "Ação Civil",
                            "assunto": "Indenização",
                        }
                    }
                ]
            }
        }
        mock_get.return_value = mock_response

        client = DataJudClient()
        processo = client.buscar_processo(numero_cnj_teste, use_cache=False)

        assert processo is not None
        assert processo["numeroCNJ"] == numero_cnj_teste
        assert processo["tribunal"] == "TJAL"

    @patch("requests.Session.get")
    def test_buscar_processo_nao_encontrado(self, mock_get, numero_cnj_teste):
        """Testar processo não encontrado"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"hits": {"hits": []}}
        mock_get.return_value = mock_response

        client = DataJudClient()
        processo = client.buscar_processo(numero_cnj_teste)

        assert processo is None

    @patch("requests.Session.get")
    def test_buscar_movimentacoes(self, mock_get, numero_cnj_teste):
        """Testar busca de movimentações"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": "1",
                        "_source": {
                            "dataHora": "2024-01-15",
                            "tipoMovimentacao": "Despacho",
                            "descricaoMovimentacao": "Processo em andamento",
                        },
                    },
                    {
                        "_id": "2",
                        "_source": {
                            "dataHora": "2024-01-20",
                            "tipoMovimentacao": "Sentença",
                            "descricaoMovimentacao": "Sentença publicada",
                        },
                    },
                ]
            }
        }
        mock_get.return_value = mock_response

        client = DataJudClient()
        movimentacoes = client.buscar_movimentacoes(numero_cnj_teste)

        assert len(movimentacoes) == 2
        assert movimentacoes[0]["tipo"] == "Despacho"
        assert movimentacoes[1]["tipo"] == "Sentença"

    @patch("requests.Session.get")
    def test_buscar_processos_recentes(self, mock_get):
        """Testar busca de processos recentes"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "hits": {
                "hits": [
                    {
                        "_id": "1",
                        "_source": {
                            "numeroProcesso": "0001234-56.2024.8.02.0001",
                            "tribunal": "TJAL",
                            "classe": "Ação",
                        },
                    }
                ]
            }
        }
        mock_get.return_value = mock_response

        client = DataJudClient()
        processos = client.buscar_processos_recentes(tribunal="TJAL", dias=7)

        assert len(processos) == 1
        assert processos[0]["tribunal"] == "TJAL"

    @patch("requests.Session.get")
    def test_timeout_com_retry(self, mock_get, numero_cnj_teste):
        """Testar timeout com retry automático"""
        import requests

        # Primeira tentativa: timeout
        # Segunda tentativa: sucesso
        mock_get.side_effect = [
            requests.exceptions.Timeout(),
            Mock(status_code=200, json=lambda: {"hits": {"hits": []}}),
        ]

        client = DataJudClient()
        resultado = client.buscar_processo(numero_cnj_teste)

        # Deve ter tentado 2 vezes
        assert mock_get.call_count == 2

    @patch("requests.Session.get")
    def test_rate_limit_429(self, mock_get, numero_cnj_teste):
        """Testar rate limit com código 429"""
        import requests

        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError()
        mock_get.return_value = mock_response

        client = DataJudClient()
        resultado = client.buscar_processo(numero_cnj_teste)

        # Deve retornar None após retries
        assert resultado is None
        assert mock_get.call_count == client.MAX_RETRIES

    @patch("requests.Session.get")
    def test_health_check(self, mock_get):
        """Testar health check da API"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response

        client = DataJudClient()
        is_healthy = client.health_check()

        assert is_healthy is True

    @patch("requests.Session.get")
    def test_health_check_falha(self, mock_get):
        """Testar health check com falha"""
        mock_get.side_effect = Exception("Connection error")

        client = DataJudClient()
        is_healthy = client.health_check()

        assert is_healthy is False
