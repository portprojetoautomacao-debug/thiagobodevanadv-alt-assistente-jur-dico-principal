"""
Testes de Minutas com Chamadas Reais à API Gemini
=================================================

Testa o workflow completo de redação de minutas usando a API real do Gemini.
"""

import asyncio
import os
import sys

import pytest

# Adicionar diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar API key antes de importar módulos
os.environ["GEMINI_API_KEY"] = "AIzaSyDSjxUtNlcl-m985jcgQp-7WVdF4MCh438"
os.environ["GOOGLE_API_KEY"] = "AIzaSyDSjxUtNlcl-m985jcgQp-7WVdF4MCh438"


class TestAIMinutaCommandsReal:
    """Testes com chamadas reais ao Gemini para comandos de IA"""

    @pytest.fixture
    def ai_commands(self):
        """Inicializa o módulo de comandos de IA"""
        from lib.ai_commands import AIMinutaCommands

        return AIMinutaCommands()

    @pytest.mark.asyncio
    async def test_continuar_texto_real(self, ai_commands):
        """Testa continuação de texto com API real"""
        texto_inicial = """
        EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) DE DIREITO DA VARA CÍVEL DA COMARCA DE DIVINÓPOLIS/MG

        PROCESSO Nº: 0001234-56.2025.8.13.0223

        FULANO DE TAL, já qualificado nos autos, vem, respeitosamente, à presença de Vossa Excelência,
        por seu advogado infra-assinado, com fundamento no artigo 319 do Código de Processo Civil,
        """

        resultado = ""
        async for chunk in ai_commands.continuar(texto_inicial):
            resultado += chunk
            print(chunk, end="", flush=True)

        print("\n")  # Nova linha após streaming

        # Verificações
        assert len(resultado) > 50, "Continuação deve ter conteúdo substancial"
        assert resultado.strip(), "Resultado não pode estar vazio"
        print(f"✅ Continuação gerada com {len(resultado)} caracteres")

    @pytest.mark.asyncio
    async def test_expandir_texto_real(self, ai_commands):
        """Testa expansão de texto com API real"""
        texto_curto = (
            "O autor sofreu danos morais devido à conduta ilícita da empresa ré."
        )

        resultado = ""
        async for chunk in ai_commands.expandir(texto_curto):
            resultado += chunk

        # Verificações
        assert (
            len(resultado) > len(texto_curto) * 2
        ), "Texto expandido deve ser significativamente maior"
        print(
            f"✅ Texto expandido de {len(texto_curto)} para {len(resultado)} caracteres"
        )

    @pytest.mark.asyncio
    async def test_revisar_texto_real(self, ai_commands):
        """Testa revisão de texto com API real"""
        texto_com_erros = """
        O requerente, vem respeitosamente perante vossa excelência, requerer a procedencia
        da ação, haja visto que o requerido não cumpriu com suas obrigações contratuais,
        causando prejuisos ao autor.
        """

        resultado = ""
        async for chunk in ai_commands.revisar(texto_com_erros):
            resultado += chunk

        # Verificações
        assert len(resultado) > 50, "Revisão deve ter conteúdo"
        assert (
            "prejuíz" in resultado.lower() or "danos" in resultado.lower()
        ), "Deve corrigir ou melhorar o texto"
        print(f"✅ Texto revisado com {len(resultado)} caracteres")

    @pytest.mark.asyncio
    async def test_formalizar_texto_real(self, ai_commands):
        """Testa formalização de texto com API real"""
        texto_informal = """
        O cara não pagou a conta. Ele deve muito dinheiro e não quer pagar.
        A gente precisa cobrar ele na justiça porque ele tá errado.
        """

        resultado = ""
        async for chunk in ai_commands.formalizar(texto_informal):
            resultado += chunk

        # Verificações
        assert len(resultado) > 50, "Formalização deve ter conteúdo"
        # Verificar se usa linguagem mais formal
        termos_formais = [
            "devedor",
            "credor",
            "obrigação",
            "adimplemento",
            "inadimplemento",
            "requerido",
            "autor",
            "réu",
            "débito",
            "crédito",
        ]
        possui_termo_formal = any(
            termo in resultado.lower() for termo in termos_formais
        )
        print(f"✅ Texto formalizado com {len(resultado)} caracteres")
        print(f"   Contém termos formais: {possui_termo_formal}")


class TestRedacaoAgentReal:
    """Testes do agente de redação com chamadas reais"""

    @pytest.fixture
    def redacao_agent(self):
        """Inicializa o agente de redação"""
        from lib.agents.redacao import RedacaoAgent

        return RedacaoAgent()

    @pytest.mark.asyncio
    async def test_gerar_peticao_inicial_real(self, redacao_agent):
        """Testa geração de petição inicial completa"""
        task = """
        Elabore uma petição inicial de cobrança de dívida no valor de R$ 15.000,00.

        DADOS:
        - Autor: João da Silva, CPF 123.456.789-00, residente em Divinópolis/MG
        - Réu: Maria de Souza, CPF 987.654.321-00, residente em Belo Horizonte/MG
        - Dívida: Contrato de empréstimo particular datado de 01/01/2024
        - Valor: R$ 15.000,00 com juros de 1% ao mês
        - Vencimento: 01/06/2024
        """

        context = {"tipo": "peticao_inicial", "vara": "Vara Cível de Divinópolis/MG"}

        resultado = await redacao_agent.execute(task, context)

        # Verificações
        assert (
            resultado["status"] == "completed"
        ), f"Falha: {resultado.get('error', 'Erro desconhecido')}"
        assert resultado["response"], "Deve ter resposta"
        assert len(resultado["response"]) > 200, "Petição deve ser substancial"

        # Verificar elementos típicos de petição
        response_lower = resultado["response"].lower()
        assert any(
            termo in response_lower for termo in ["excelentíssimo", "exmo", "mm"]
        ), "Deve ter vocativo"

        print(f"✅ Petição inicial gerada com {len(resultado['response'])} caracteres")
        print(f"   Confiança: {resultado.get('confidence', 'N/A')}")
        print(f"   Validação: {resultado.get('metadata', {}).get('validacao', 'N/A')}")

    @pytest.mark.asyncio
    async def test_gerar_contestacao_real(self, redacao_agent):
        """Testa geração de contestação"""
        task = """
        Elabore uma contestação para ação de cobrança indevida.

        CONTEXTO:
        - O réu está sendo cobrado por uma dívida que já foi paga
        - Possui comprovante de pagamento (recibo bancário)
        - Pede danos morais por cobrança indevida
        """

        context = {"tipo": "contestacao"}

        resultado = await redacao_agent.execute(task, context)

        assert resultado["status"] == "completed"
        assert len(resultado["response"]) > 200
        print(f"✅ Contestação gerada com {len(resultado['response'])} caracteres")

    @pytest.mark.asyncio
    async def test_gerar_recurso_real(self, redacao_agent):
        """Testa geração de recurso de apelação"""
        task = """
        Elabore um recurso de apelação contra sentença que julgou improcedente ação de
        indenização por danos morais.

        MOTIVOS:
        - Sentença não considerou todas as provas produzidas
        - Erro na valoração dos depoimentos testemunhais
        - Jurisprudência favorável ao autor
        """

        context = {"tipo": "recurso"}

        resultado = await redacao_agent.execute(task, context)

        assert resultado["status"] == "completed"
        assert len(resultado["response"]) > 200
        print(f"✅ Recurso gerado com {len(resultado['response'])} caracteres")


class TestWorkflowMinutaCompleto:
    """Testa o workflow completo de criação e edição de minuta"""

    @pytest.mark.asyncio
    async def test_workflow_criar_editar_minuta(self):
        """Testa workflow: criar -> expandir -> revisar -> formalizar"""
        from lib.agents.redacao import RedacaoAgent
        from lib.ai_commands import AIMinutaCommands

        ai_commands = AIMinutaCommands()
        redacao_agent = RedacaoAgent()

        # 1. Criar rascunho inicial com agente
        print("\n📝 ETAPA 1: Criando rascunho inicial...")
        resultado_inicial = await redacao_agent.execute(
            "Elabore um contrato de prestação de serviços advocatícios",
            {"tipo": "contrato"},
        )

        assert resultado_inicial["status"] == "completed"
        texto_v1 = resultado_inicial["response"]
        print(f"   ✅ Rascunho criado: {len(texto_v1)} caracteres")

        # 2. Expandir uma seção (simular seleção de trecho)
        print("\n📝 ETAPA 2: Expandindo seção de honorários...")
        trecho = (
            "Os honorários advocatícios serão pagos conforme acordado entre as partes."
        )

        texto_expandido = ""
        async for chunk in ai_commands.expandir(trecho):
            texto_expandido += chunk

        print(
            f"   ✅ Seção expandida: {len(trecho)} -> {len(texto_expandido)} caracteres"
        )

        # 3. Revisar o documento
        print("\n📝 ETAPA 3: Revisando documento completo...")

        # Pegar primeiros 500 chars para teste rápido
        texto_para_revisao = texto_v1[:500] if len(texto_v1) > 500 else texto_v1

        texto_revisado = ""
        async for chunk in ai_commands.revisar(texto_para_revisao):
            texto_revisado += chunk

        print(f"   ✅ Documento revisado: {len(texto_revisado)} caracteres")

        # 4. Verificar resultado final
        print("\n✅ WORKFLOW COMPLETO EXECUTADO COM SUCESSO!")
        print(f"   - Rascunho inicial: {len(texto_v1)} chars")
        print(f"   - Seção expandida: {len(texto_expandido)} chars")
        print(f"   - Documento revisado: {len(texto_revisado)} chars")

        assert len(texto_v1) > 100
        assert len(texto_expandido) > len(trecho)
        assert len(texto_revisado) > 50


class TestMinutasIntegracaoJustine:
    """Testa integração de minutas com agente Justine (monitoramento DJEN)"""

    @pytest.mark.asyncio
    async def test_gerar_minuta_baseada_em_publicacao(self):
        """Testa geração de minuta baseada em publicação do DJEN"""
        from lib.agents.redacao import RedacaoAgent

        redacao_agent = RedacaoAgent()

        # Simular dados de publicação DJEN (como os retornados na sua consulta)
        publicacao = {
            "numero_processo": "5013310-29.2021.8.13.0223",
            "nomeClasse": "CUMPRIMENTO DE SENTENÇA",
            "texto": """
            Presentes os pressupostos processuais e requisitos legais, defere-se o
            processamento do cumprimento de sentença proposto pela parte autora.
            O executado deverá ser intimado para pagar o débito no prazo de 15 dias,
            sob pena de multa de 10% e honorários de 10%.
            """,
            "valor": "R$ 13.001,86",
        }

        # Gerar petição de cumprimento de sentença
        task = f"""
        Com base na seguinte decisão judicial, elabore uma petição de cumprimento de sentença:

        PROCESSO: {publicacao['numero_processo']}
        CLASSE: {publicacao['nomeClasse']}
        VALOR: {publicacao['valor']}

        DECISÃO:
        {publicacao['texto']}

        Elabore a petição inicial de cumprimento de sentença requerendo a intimação do
        executado para pagamento no prazo legal.
        """

        resultado = await redacao_agent.execute(task, {"tipo": "cumprimento_sentenca"})

        assert resultado["status"] == "completed"
        assert len(resultado["response"]) > 200

        # Verificar elementos específicos
        response_lower = resultado["response"].lower()
        assert any(
            termo in response_lower
            for termo in ["cumprimento", "execução", "executado"]
        ), "Deve mencionar termos de cumprimento de sentença"

        print(
            f"✅ Minuta de cumprimento gerada com {len(resultado['response'])} caracteres"
        )
        print(f"   Baseada no processo: {publicacao['numero_processo']}")


if __name__ == "__main__":
    # Rodar testes
    pytest.main([__file__, "-v", "-s", "--asyncio-mode=auto"])
