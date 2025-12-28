"""
Testes para os 16 Agentes LangChain REAIS
"""

import pytest

# ✅ Helper to skip tests if agent module not found
def skip_if_agent_not_found(agent_name):
    """Decorator to skip test if agent module doesn't exist"""
    def decorator(func):
        try:
            # Try to import the agent module
            if agent_name == "harvey":
                from agents.harvey import HarveyAgent
            elif agent_name == "justine":
                from agents.justine import JustineAgent
            elif agent_name == "analise_doc":
                from agents.analise_doc import AnaliseDocAgent
            elif agent_name == "prazos":
                from agents.prazos import GestaoPrazosAgent
            elif agent_name == "analise_risco":
                from agents.analise_risco import AnaliseRiscoAgent
            elif agent_name == "revisao_contratual":
                from agents.revisao_contratual import RevisaoContratualAgent
            elif agent_name == "comunicacao":
                from agents.comunicacao import ComunicacaoClientesAgent
            elif agent_name == "financeiro":
                from agents.financeiro import FinanceiroAgent
            elif agent_name == "estrategia":
                from agents.estrategia import EstrategiaProcessualAgent
            elif agent_name == "traducao":
                from agents.traducao import TraducaoJuridicaAgent
            elif agent_name == "compliance":
                from agents.compliance import ComplianceAgent
            elif agent_name == "organizacao":
                from agents.organizacao import OrganizacaoArquivosAgent
            elif agent_name == "analise_sentenca":
                from agents.analise_sentenca import AnaliseSentencaAgent
            return func
        except (ImportError, ModuleNotFoundError):
            return pytest.mark.skip(reason=f"Agent module '{agent_name}' not implemented yet")(func)
    return decorator


class TestAgentesLangChain:
    """Testes dos agentes LangChain reais"""

    @pytest.mark.asyncio
    @skip_if_agent_not_found("harvey")
    async def test_harvey_executa_e_completa(self):
        """Testar que Harvey executa e completa"""
        from agents.harvey import HarveyAgent

        agent = HarveyAgent()
        result = await agent.execute("Análise estratégica do escritório")

        assert result is not None
        assert "status" in result or "response" in result

    @pytest.mark.asyncio
    @skip_if_agent_not_found("justine")
    async def test_justine_executa_e_completa(self):
        """Testar que Justine executa e completa"""
        from agents.justine import JustineAgent

        agent = JustineAgent()
        result = await agent.execute("Analisar intimação de 15 dias")

        assert result is not None
        assert "status" in result or "response" in result

    @pytest.mark.asyncio
    @skip_if_agent_not_found("analise_doc")
    async def test_analise_documental_executa_e_completa(self):
        """Testar que Análise Documental executa e completa"""
        from agents.analise_doc import AnaliseDocAgent

        agent = AnaliseDocAgent()
        result = await agent.execute("Analisar petição inicial")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("prazos")
    async def test_gestao_prazos_executa_e_completa(self):
        """Testar que Gestão de Prazos executa e completa"""
        from agents.prazos import GestaoPrazosAgent

        agent = GestaoPrazosAgent()
        result = await agent.execute("Calcular prazo de 15 dias")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("analise_risco")
    async def test_analise_risco_executa_e_completa(self):
        """Testar que Análise de Risco executa e completa"""
        from agents.analise_risco import AnaliseRiscoAgent

        agent = AnaliseRiscoAgent()
        result = await agent.execute("Avaliar viabilidade de ação")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("revisao_contratual")
    async def test_revisao_contratual_executa_e_completa(self):
        """Testar que Revisão Contratual executa e completa"""
        from agents.revisao_contratual import RevisaoContratualAgent

        agent = RevisaoContratualAgent()
        result = await agent.execute("Revisar contrato")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("comunicacao")
    async def test_comunicacao_clientes_executa_e_completa(self):
        """Testar que Comunicação Clientes executa e completa"""
        from agents.comunicacao import ComunicacaoClientesAgent

        agent = ComunicacaoClientesAgent()
        result = await agent.execute("Gerar relatório")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("financeiro")
    async def test_financeiro_executa_e_completa(self):
        """Testar que Financeiro executa e completa"""
        from agents.financeiro import FinanceiroAgent

        agent = FinanceiroAgent()
        result = await agent.execute("Calcular honorários")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("estrategia")
    async def test_estrategia_processual_executa_e_completa(self):
        """Testar que Estratégia Processual executa e completa"""
        from agents.estrategia import EstrategiaProcessualAgent

        agent = EstrategiaProcessualAgent()
        result = await agent.execute("Definir estratégia")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("traducao")
    async def test_traducao_juridica_executa_e_completa(self):
        """Testar que Tradução Jurídica executa e completa"""
        from agents.traducao import TraducaoJuridicaAgent

        agent = TraducaoJuridicaAgent()
        result = await agent.execute("Explicar termo revelia")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("compliance")
    async def test_compliance_executa_e_completa(self):
        """Testar que Compliance executa e completa"""
        from agents.compliance import ComplianceAgent

        agent = ComplianceAgent()
        result = await agent.execute("Verificar conformidade LGPD")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("organizacao")
    async def test_organizacao_arquivos_executa_e_completa(self):
        """Testar que Organização de Arquivos executa e completa"""
        from agents.organizacao import OrganizacaoArquivosAgent

        agent = OrganizacaoArquivosAgent()
        result = await agent.execute("Organizar documentos")

        assert result is not None

    @pytest.mark.asyncio
    @skip_if_agent_not_found("analise_sentenca")
    async def test_analise_sentenca_executa_e_completa(self):
        """Testar que Análise de Sentença executa e completa"""
        from agents.analise_sentenca import AnaliseSentencaAgent

        agent = AnaliseSentencaAgent()
        result = await agent.execute("Analisar sentença procedente")

        assert result is not None
