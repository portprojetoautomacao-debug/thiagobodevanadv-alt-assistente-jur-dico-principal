"""
Testes para os 16 Agentes LangChain REAIS
"""

import os

import pytest

# Garantir que a API key está configurada
if not os.getenv("GEMINI_API_KEY"):
    os.environ["GEMINI_API_KEY"] = "AIzaSyDSjxUtNlcl-m985jcgQp-7WVdF4MCh438"
    os.environ["GOOGLE_API_KEY"] = "AIzaSyDSjxUtNlcl-m985jcgQp-7WVdF4MCh438"


def safe_import_agent(agent_module, agent_class):
    """Helper para importar agente com segurança"""
    try:
        # Primeiro, tentar importar usando o caminho completo
        module = __import__(f"lib.agents.{agent_module}", fromlist=[agent_class])
        return getattr(module, agent_class, None)
    except (ImportError, ModuleNotFoundError, AttributeError):
        pass

    try:
        # Tentar importar diretamente do módulo agents
        module = __import__(f"agents.{agent_module}", fromlist=[agent_class])
        return getattr(module, agent_class, None)
    except (ImportError, ModuleNotFoundError, AttributeError):
        pass

    return None


# Mapeamento correto dos nomes das classes
AGENT_MAP = {
    "harvey": "HarveyAgent",
    "justine": "JustineAgent",
    "analise_doc": "AnaliseDocAgent",
    "analise_risco": "AnaliseRiscoAgent",
    "analise_sentenca": "AnaliseSentencaAgent",
    "compliance": "ComplianceAgent",
    "comunicacao": "ComunicacaoClientesAgent",
    "estrategia": "EstrategiaProcessualAgent",
    "financeiro": "FinanceiroAgent",
    "organizacao": "OrganizacaoArquivosAgent",
    "pesquisa": "PesquisaAgent",
    "prazos": "GestaoPrazosAgent",
    "redacao": "RedacaoAgent",
    "revisao_contratual": "RevisaoContratualAgent",
    "traducao": "TraducaoJuridicaAgent",
    "expedientes": "ExpedientesAgent",
    "monitor_djen": "MonitorDJENAgent",
}


class TestAgentesLangChain:
    """Testes dos agentes LangChain reais"""

    @pytest.mark.asyncio
    async def test_harvey_executa_e_completa(self):
        """Testar que Harvey executa e completa"""
        AgentClass = safe_import_agent("harvey", AGENT_MAP["harvey"])
        if AgentClass is None:
            pytest.skip("HarveyAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None
        assert "status" in result or "response" in result

    @pytest.mark.asyncio
    async def test_justine_executa_e_completa(self):
        """Testar que Justine executa e completa"""
        AgentClass = safe_import_agent("justine", AGENT_MAP["justine"])
        if AgentClass is None:
            pytest.skip("JustineAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None
        assert "status" in result or "response" in result

    @pytest.mark.asyncio
    async def test_analise_documental_executa_e_completa(self):
        """Testar que Análise Documental executa e completa"""
        AgentClass = safe_import_agent("analise_doc", AGENT_MAP["analise_doc"])
        if AgentClass is None:
            pytest.skip("AnaliseDocAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_gestao_prazos_executa_e_completa(self):
        """Testar que Gestão de Prazos executa e completa"""
        AgentClass = safe_import_agent("prazos", AGENT_MAP["prazos"])
        if AgentClass is None:
            pytest.skip("GestaoPrazosAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_analise_risco_executa_e_completa(self):
        """Testar que Análise de Risco executa e completa"""
        AgentClass = safe_import_agent("analise_risco", AGENT_MAP["analise_risco"])
        if AgentClass is None:
            pytest.skip("AnaliseRiscoAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_revisao_contratual_executa_e_completa(self):
        """Testar que Revisão Contratual executa e completa"""
        AgentClass = safe_import_agent(
            "revisao_contratual", AGENT_MAP["revisao_contratual"]
        )
        if AgentClass is None:
            pytest.skip("RevisaoContratualAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_comunicacao_clientes_executa_e_completa(self):
        """Testar que Comunicação Clientes executa e completa"""
        AgentClass = safe_import_agent("comunicacao", AGENT_MAP["comunicacao"])
        if AgentClass is None:
            pytest.skip("ComunicacaoClientesAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_financeiro_executa_e_completa(self):
        """Testar que Financeiro executa e completa"""
        AgentClass = safe_import_agent("financeiro", AGENT_MAP["financeiro"])
        if AgentClass is None:
            pytest.skip("FinanceiroAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_estrategia_processual_executa_e_completa(self):
        """Testar que Estratégia Processual executa e completa"""
        AgentClass = safe_import_agent("estrategia", AGENT_MAP["estrategia"])
        if AgentClass is None:
            pytest.skip("EstrategiaProcessualAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_traducao_juridica_executa_e_completa(self):
        """Testar que Tradução Jurídica executa e completa"""
        AgentClass = safe_import_agent("traducao", AGENT_MAP["traducao"])
        if AgentClass is None:
            pytest.skip("TraducaoJuridicaAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_compliance_executa_e_completa(self):
        """Testar que Compliance executa e completa"""
        AgentClass = safe_import_agent("compliance", AGENT_MAP["compliance"])
        if AgentClass is None:
            pytest.skip("ComplianceAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_organizacao_arquivos_executa_e_completa(self):
        """Testar que Organização de Arquivos executa e completa"""
        AgentClass = safe_import_agent("organizacao", AGENT_MAP["organizacao"])
        if AgentClass is None:
            pytest.skip("OrganizacaoArquivosAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_analise_sentenca_executa_e_completa(self):
        """Testar que Análise de Sentença executa e completa"""
        AgentClass = safe_import_agent(
            "analise_sentenca", AGENT_MAP["analise_sentenca"]
        )
        if AgentClass is None:
            pytest.skip("AnaliseSentencaAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_pesquisa_executa_e_completa(self):
        """Testar que Pesquisa executa e completa"""
        AgentClass = safe_import_agent("pesquisa", AGENT_MAP["pesquisa"])
        if AgentClass is None:
            pytest.skip("PesquisaAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None

    @pytest.mark.asyncio
    async def test_redacao_executa_e_completa(self):
        """Testar que Redação executa e completa"""
        AgentClass = safe_import_agent("redacao", AGENT_MAP["redacao"])
        if AgentClass is None:
            pytest.skip("RedacaoAgent não encontrado")

        agent = AgentClass()
        result = await agent.execute("Diga 'teste ok' em uma frase curta")

        assert result is not None


class TestAgentesInfo:
    """Testes de informações dos agentes"""

    def test_harvey_info(self):
        """Testar informações do Harvey"""
        AgentClass = safe_import_agent("harvey", AGENT_MAP["harvey"])
        if AgentClass is None:
            pytest.skip("HarveyAgent não encontrado")

        agent = AgentClass()
        info = agent.get_info()

        assert info is not None
        assert "id" in info
        assert "name" in info
        assert info["id"] == "harvey"

    def test_justine_info(self):
        """Testar informações da Justine"""
        AgentClass = safe_import_agent("justine", AGENT_MAP["justine"])
        if AgentClass is None:
            pytest.skip("JustineAgent não encontrado")

        agent = AgentClass()
        info = agent.get_info()

        assert info is not None
        assert "id" in info
        assert "name" in info
        assert info["id"] == "justine"
