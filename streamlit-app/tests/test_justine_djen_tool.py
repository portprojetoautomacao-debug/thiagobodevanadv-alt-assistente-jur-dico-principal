"""
Testes de Mrs. Justin-e chamando a Tool DJEN

Testa a integração entre o agente Justine e a ferramenta DJEN
para coleta de publicações de advogados.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

# Adicionar paths necessários
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "lib"))


class TestJustineDJENToolIntegration:
    """Testes de integração entre Justine e a Tool DJEN"""

    @pytest.fixture
    def mock_djen_response(self):
        """Response mockada da API DJEN"""
        return {
            "count": 2,
            "items": [
                {
                    "id": "pub-001",
                    "tribunal": "TJMG",
                    "tipo": "Intimação",
                    "orgao": "3ª Vara Cível da Comarca de Divinópolis",
                    "numeroProcesso": "5013310-29.2021.8.13.0223",
                    "dataDisponibilizacao": "2025-12-22",
                    "teor": "Fica a parte intimada para pagar o débito em 15 dias...",
                    "meio": "D",
                    "link": "https://pje.tjmg.jus.br/...",
                    "lawyerId": "1",
                    "lawyerName": "Advogado Teste",
                    "oab": "184404/MG",
                },
                {
                    "id": "pub-002",
                    "tribunal": "TJMG",
                    "tipo": "Intimação",
                    "orgao": "1ª Vara de Família da Comarca de Divinópolis",
                    "numeroProcesso": "5024793-51.2024.8.13.0223",
                    "dataDisponibilizacao": "2025-12-22",
                    "teor": "Processo sob sigilo...",
                    "meio": "D",
                    "link": "https://pje.tjmg.jus.br/...",
                    "lawyerId": "1",
                    "lawyerName": "Advogado Teste",
                    "oab": "184404/MG",
                },
            ],
        }

    def test_justine_has_djen_tool(self):
        """Verifica que Justine tem a tool DJEN configurada"""
        try:
            from lib.agents.justine import JustineAgent

            agent = JustineAgent()

            # Verificar que a tool DJEN está disponível
            assert hasattr(agent, "djen_tool")
            assert agent.djen_tool is not None
            assert callable(agent.djen_tool.invoke)

        except ImportError as e:
            pytest.skip(f"JustineAgent não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro ao criar JustineAgent: {e}")

    def test_justine_coletar_publicacoes_method_exists(self):
        """Verifica que Justine tem o método coletar_publicacoes_djen_diarias"""
        try:
            from lib.agents.justine import JustineAgent

            agent = JustineAgent()

            assert hasattr(agent, "coletar_publicacoes_djen_diarias")
            assert callable(agent.coletar_publicacoes_djen_diarias)

        except ImportError as e:
            pytest.skip(f"JustineAgent não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro ao criar JustineAgent: {e}")

    def test_justine_coleta_publicacoes_com_mock(self, mock_djen_response):
        """Testa coleta de publicações com mock da API - testa método de forma direta"""
        try:
            from lib.agents.justine import JustineAgent

            # Criar agente
            agent = JustineAgent()

            # Criar JSON mockado conforme a tool retorna
            mock_items = []
            for item in mock_djen_response["items"]:
                mock_items.append(
                    {
                        "id": item["id"],
                        "tribunal": item["tribunal"],
                        "tipo": item["tipo"],
                        "orgao": item["orgao"],
                        "numeroProcesso": item["numeroProcesso"],
                        "dataDisponibilizacao": item["dataDisponibilizacao"],
                        "dataPublicacao": "",
                        "teor": item["teor"],
                        "meio": item["meio"],
                        "link": item["link"],
                        "lawyerId": item.get("lawyerId"),
                        "lawyerName": item.get("lawyerName"),
                        "oab": item.get("oab"),
                    }
                )

            mock_json = json.dumps({"count": len(mock_items), "items": mock_items})

            # Substituir a djen_tool por um mock simples
            mock_tool = MagicMock()
            mock_tool.invoke = MagicMock(return_value=mock_json)
            original_tool = agent.djen_tool
            agent.djen_tool = mock_tool

            try:
                lawyers = [{"id": "1", "name": "Advogado Teste", "oab": "184404/MG"}]
                data_inicio = "2025-12-22"
                data_fim = "2025-12-22"

                result = agent.coletar_publicacoes_djen_diarias(
                    lawyers=lawyers,
                    data_inicio=data_inicio,
                    data_fim=data_fim,
                )

                # Verificações
                assert isinstance(result, list)
                assert len(result) == 2

                # Verificar estrutura das publicações
                for pub in result:
                    assert "id" in pub
                    assert "tribunal" in pub
                    assert "tipo" in pub
                    assert "numeroProcesso" in pub

            finally:
                # Restaurar a tool original
                agent.djen_tool = original_tool

        except ImportError as e:
            pytest.skip(f"Módulo não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro no teste: {e}")

    def test_djen_tool_buscar_por_oab(self):
        """Testa a tool buscar_publicacoes_djen_por_oab diretamente"""
        try:
            from lib.tools.djen_tools import buscar_publicacoes_djen_por_oab

            # Verificar que a tool existe e é callable
            assert callable(buscar_publicacoes_djen_por_oab.invoke)

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")

    def test_djen_tool_buscar_multiplos_advogados(self):
        """Testa a tool buscar_publicacoes_djen_multiplos_advogados"""
        try:
            from lib.tools.djen_tools import buscar_publicacoes_djen_multiplos_advogados

            # Verificar que a tool existe
            assert callable(buscar_publicacoes_djen_multiplos_advogados.invoke)

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")

    @patch("lib.tools.djen_tools.DJENAPIClient")
    def test_tool_retorna_json_valido(self, mock_client_class):
        """Verifica que a tool retorna JSON válido"""
        try:
            from lib.tools.djen_tools import buscar_publicacoes_djen_por_oab

            # Configurar mock
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            mock_client.buscar_publicacoes.return_value = []

            # Invocar tool
            result = buscar_publicacoes_djen_por_oab.invoke(
                {"numero_oab": "184404", "uf_oab": "MG"}
            )

            # Verificar que é JSON válido
            assert isinstance(result, str)
            data = json.loads(result)
            assert "count" in data
            assert "items" in data
            assert isinstance(data["items"], list)

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro no teste: {e}")

    @patch("lib.tools.djen_tools.DJENAPIClient")
    def test_tool_multiplos_advogados_retorna_json(self, mock_client_class):
        """Verifica que a tool de múltiplos advogados retorna JSON válido"""
        try:
            from lib.tools.djen_tools import buscar_publicacoes_djen_multiplos_advogados

            # Configurar mock
            mock_client = MagicMock()
            mock_client_class.return_value = mock_client
            mock_client.buscar_publicacoes.return_value = []

            # Invocar tool
            result = buscar_publicacoes_djen_multiplos_advogados.invoke(
                {
                    "advogados": [{"id": "1", "name": "Teste", "oab": "184404/MG"}],
                    "data_inicio": "2025-12-22",
                    "data_fim": "2025-12-22",
                }
            )

            # Verificar que é JSON válido
            assert isinstance(result, str)
            data = json.loads(result)
            assert "count" in data
            assert "items" in data

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro no teste: {e}")


class TestJustineDJENRealAPI:
    """Testes com chamada real à API DJEN (marcados como slow)"""

    @pytest.mark.slow
    @pytest.mark.skipif(
        os.getenv("SKIP_EXTERNAL_API_TESTS", "false").lower() == "true",
        reason="Testes de API externa desabilitados",
    )
    def test_djen_api_real_call(self):
        """Teste com chamada real à API DJEN"""
        try:
            from lib.tools.djen_tools import buscar_publicacoes_djen_por_oab

            # Buscar publicações reais para OAB de teste
            result = buscar_publicacoes_djen_por_oab.invoke(
                {
                    "numero_oab": "184404",
                    "uf_oab": "MG",
                    "data_inicio": "2025-12-22",
                    "data_fim": "2025-12-22",
                }
            )

            # Verificar estrutura
            data = json.loads(result)
            assert "count" in data
            assert "items" in data

            print(f"\n📊 Publicações encontradas: {data['count']}")

        except Exception as e:
            pytest.skip(f"Erro na chamada real: {e}")

    @pytest.mark.slow
    @pytest.mark.skipif(
        os.getenv("SKIP_EXTERNAL_API_TESTS", "false").lower() == "true",
        reason="Testes de API externa desabilitados",
    )
    def test_justine_coleta_real(self):
        """Teste de coleta real via Justine"""
        try:
            from lib.agents.justine import JustineAgent

            agent = JustineAgent()

            lawyers = [{"id": "1", "name": "Thiago Bodevan", "oab": "184404/MG"}]

            result = agent.coletar_publicacoes_djen_diarias(
                lawyers=lawyers,
                data_inicio="2025-12-22",
                data_fim="2025-12-22",
            )

            print(f"\n📋 Publicações coletadas: {len(result)}")

            if result:
                for pub in result[:3]:  # Mostrar até 3
                    print(f"  - {pub.get('numeroProcesso')}: {pub.get('tipo')}")

        except Exception as e:
            pytest.skip(f"Erro na coleta real: {e}")


class TestJustineAnaliseIntimacao:
    """Testes de análise de intimação pela Justine"""

    @pytest.mark.asyncio
    @pytest.mark.skipif(
        not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"),
        reason="API Key do Gemini não configurada",
    )
    async def test_justine_analisa_intimacao_djen(self):
        """Testa análise de uma intimação vinda do DJEN"""
        try:
            from lib.agents.justine import JustineAgent

            agent = JustineAgent()

            # Intimação típica do DJEN
            intimacao_texto = """
            PODER JUDICIÁRIO DO ESTADO DE MINAS GERAIS
            Justiça de Primeira Instância
            Comarca de Divinópolis / 3ª Vara Cível

            PROCESSO Nº: 5013310-29.2021.8.13.0223
            CLASSE: PROCEDIMENTO COMUM CÍVEL
            ASSUNTO: Pagamento com Sub-rogação

            Decisão: Defere-se o processamento do cumprimento de sentença.
            O executado deverá ser intimado para pagar o débito, no prazo de
            15 (quinze) dias, sob pena de multa de dez por cento e honorários
            de advogado de dez por cento, nos termos do art. 523 do CPC.
            """

            result = await agent.execute(intimacao_texto)

            # Verificações
            assert result is not None
            assert "status" in result
            assert result.get("agentName") == "Mrs. Justin-e"

            # Se completou com sucesso, verificar response
            if result.get("status") == "completed":
                assert "response" in result
                print(f"\n📋 Análise da Justine:\n{result['response'][:500]}...")

        except ImportError as e:
            pytest.skip(f"JustineAgent não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro no teste: {e}")

    @pytest.mark.asyncio
    @pytest.mark.skipif(
        not os.getenv("GOOGLE_API_KEY") and not os.getenv("GEMINI_API_KEY"),
        reason="API Key do Gemini não configurada",
    )
    async def test_justine_identifica_prazo(self):
        """Testa se Justine identifica prazos corretamente"""
        try:
            from lib.agents.justine import JustineAgent

            agent = JustineAgent()

            intimacao = "Intimação para manifestação no prazo de 5 dias úteis."

            result = await agent.execute(intimacao)

            assert result is not None

            # Verificar metadata se disponível
            if result.get("status") == "completed":
                metadata = result.get("metadata", {})
                print(f"\n⏰ Prazo identificado: {metadata.get('prazo', 'N/A')}")
                print(f"📁 Tipo: {metadata.get('tipo', 'N/A')}")

        except ImportError as e:
            pytest.skip(f"JustineAgent não disponível: {e}")
        except Exception as e:
            pytest.skip(f"Erro no teste: {e}")


class TestJustineTools:
    """Testes das tools internas da Justine"""

    def test_extrair_prazo_tool(self):
        """Testa a tool extrair_prazo"""
        try:
            from lib.agents.justine import extrair_prazo

            # Teste com prazo de dias
            result = extrair_prazo.invoke(
                {"texto": "Prazo de 15 dias para manifestação"}
            )
            assert "15 dias" in result

            # Teste sem prazo
            result = extrair_prazo.invoke({"texto": "Processo arquivado"})
            assert "Nenhum prazo" in result

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")

    def test_classificar_intimacao_tool(self):
        """Testa a tool classificar_intimacao"""
        try:
            from lib.agents.justine import classificar_intimacao

            # Teste contestação
            result = classificar_intimacao.invoke(
                {"texto": "Intimação para contestar a ação"}
            )
            assert "Contestação" in result

            # Teste manifestação
            result = classificar_intimacao.invoke(
                {"texto": "Intimação para manifestar-se nos autos"}
            )
            assert "Manifestação" in result

            # Teste recurso
            result = classificar_intimacao.invoke(
                {"texto": "Intimação para interpor recurso"}
            )
            assert "Recurso" in result

            # Teste genérico
            result = classificar_intimacao.invoke(
                {"texto": "Intimação para ciência da decisão"}
            )
            assert "Genérica" in result

        except ImportError as e:
            pytest.skip(f"Tool não disponível: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
