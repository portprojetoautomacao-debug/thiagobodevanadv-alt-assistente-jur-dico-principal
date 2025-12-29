"""
Testes para Sentiment Analyzer
"""

import pytest
from ml.sentiment import SentimentAnalyzer


class TestSentimentAnalyzer:
    """Testes do analisador de sentimento"""

    def test_inicializacao(self):
        """Testar inicialização"""
        analyzer = SentimentAnalyzer()

        assert len(analyzer.palavras_favoraveis) > 0
        assert len(analyzer.palavras_desfavoraveis) > 0
        assert len(analyzer.palavras_parciais) > 0

    def test_analisar_sentenca_procedente(self, texto_sentenca_procedente):
        """Testar análise de sentença procedente"""
        analyzer = SentimentAnalyzer()
        resultado = analyzer.analisar_texto(texto_sentenca_procedente)

        assert resultado["sentimento"] in ["positivo", "neutro", "negativo"]
        assert resultado["analise_juridica"]["tipo"] == "procedente"
        assert resultado["analise_juridica"]["favorabilidade"] > 0.5
        assert "palavras_chave" in resultado

    def test_analisar_sentenca_improcedente(self, texto_sentenca_improcedente):
        """Testar análise de sentença improcedente"""
        analyzer = SentimentAnalyzer()
        resultado = analyzer.analisar_texto(texto_sentenca_improcedente)

        assert resultado["analise_juridica"]["tipo"] == "improcedente"
        assert resultado["analise_juridica"]["favorabilidade"] < 0.5

    def test_analisar_sentenca_parcial(self):
        """Testar sentença parcialmente procedente"""
        analyzer = SentimentAnalyzer()
        texto = "Julgo PARCIALMENTE PROCEDENTE o pedido em parte dos argumentos."

        resultado = analyzer.analisar_texto(texto)

        assert resultado["analise_juridica"]["tipo"] == "parcialmente_procedente"
        assert resultado["analise_juridica"]["favorabilidade"] == 0.5

    def test_classificar_urgencia_critica(self):
        """Testar classificação de urgência crítica"""
        analyzer = SentimentAnalyzer()
        texto = """
        INTIMAÇÃO URGENTE. Prazo de 2 dias úteis para manifestação.
        Trata-se de tutela de urgência com risco iminente de dano grave.
        """

        urgencia = analyzer.classificar_urgencia(texto)

        assert urgencia["nivel"] in ["crítico", "alto"]
        assert urgencia["prioridade"] <= 2
        assert urgencia["score"] >= 2

    def test_classificar_urgencia_baixa(self):
        """Testar classificação de urgência baixa"""
        analyzer = SentimentAnalyzer()
        texto = "Informo que o processo segue tramitando normalmente."

        urgencia = analyzer.classificar_urgencia(texto)

        assert urgencia["nivel"] == "baixo"
        assert urgencia["prioridade"] == 4

    def test_analisar_lote(self):
        """Testar análise em lote"""
        analyzer = SentimentAnalyzer()
        textos = [
            "Julgo PROCEDENTE o pedido.",
            "Julgo IMPROCEDENTE o pedido.",
            "Julgo PARCIALMENTE PROCEDENTE.",
        ]

        resultados = analyzer.analisar_lote(textos)

        assert len(resultados) == 3
        assert all("sentimento" in r for r in resultados)
        assert all("analise_juridica" in r for r in resultados)

    def test_comparar_sentencas(
        self, texto_sentenca_procedente, texto_sentenca_improcedente
    ):
        """Testar comparação de sentenças"""
        analyzer = SentimentAnalyzer()

        comparacao = analyzer.comparar_sentencas(
            texto_sentenca_procedente, texto_sentenca_improcedente
        )

        assert "sentenca_a" in comparacao
        assert "sentenca_b" in comparacao
        assert "similaridade" in comparacao
        assert "mesma_favorabilidade" in comparacao
        assert comparacao["mesma_favorabilidade"] is False

    def test_extrair_palavras_chave(self):
        """Testar extração de palavras-chave"""
        analyzer = SentimentAnalyzer()
        texto = """
        O processo trabalhista envolve discussão sobre horas extras
        e adicional noturno. O trabalhador alegou jornada excessiva
        e não pagamento de verbas trabalhistas devidas.
        """

        resultado = analyzer.analisar_texto(texto)
        palavras = resultado["palavras_chave"]

        assert len(palavras) > 0
        assert all(isinstance(p, str) for p in palavras)

    def test_texto_vazio(self):
        """Testar com texto vazio deve falhar"""
        analyzer = SentimentAnalyzer()

        with pytest.raises(ValueError):
            analyzer.analisar_texto("")

    def test_polaridade_e_subjetividade(self):
        """Testar cálculo de polaridade e subjetividade"""
        analyzer = SentimentAnalyzer()
        texto = "Julgo PROCEDENTE o pedido com total convicção."

        resultado = analyzer.analisar_texto(texto)

        assert "polaridade" in resultado
        assert "subjetividade" in resultado
        assert -1 <= resultado["polaridade"] <= 1
        assert 0 <= resultado["subjetividade"] <= 1
