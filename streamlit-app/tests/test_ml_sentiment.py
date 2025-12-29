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

        assert analyzer is not None

    def test_analisar_texto_positivo(self, texto_sentenca_procedente):
        """Testar análise de texto positivo"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar(texto_sentenca_procedente)

        assert resultado is not None
        assert "sentimento" in resultado
        assert resultado["sentimento"] in ["positivo", "neutro", "negativo"]

    def test_analisar_texto_negativo(self, texto_sentenca_improcedente):
        """Testar análise de texto negativo"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar(texto_sentenca_improcedente)

        assert resultado is not None
        assert "sentimento" in resultado

    def test_analisar_texto_vazio(self):
        """Testar análise de texto vazio"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar("")

        assert resultado is not None
        assert resultado["sentimento"] == "neutro"

    def test_extrair_keywords(self, texto_sentenca_procedente):
        """Testar extração de keywords"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar(texto_sentenca_procedente)

        assert "keywords" in resultado
        assert len(resultado["keywords"]) > 0

    def test_confianca_score(self, texto_sentenca_procedente):
        """Testar score de confiança"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar(texto_sentenca_procedente)

        assert "confianca" in resultado
        assert 0.0 <= resultado["confianca"] <= 1.0

    def test_detectar_entidades_juridicas(self, texto_sentenca_procedente):
        """Testar detecção de entidades jurídicas"""
        analyzer = SentimentAnalyzer()

        resultado = analyzer.analisar(texto_sentenca_procedente)

        assert "entidades" in resultado
        # Verificar tipos de entidades
        assert any(
            e["tipo"] in ["valor", "partes", "lei", "artigo"]
            for e in resultado["entidades"]
        )

    def test_batch_analise(self):
        """Testar análise em lote"""
        analyzer = SentimentAnalyzer()

        textos = [
            "Pedido procedente. Recurso provido.",
            "Pedido improcedente. Recurso negado.",
            "Processo arquivado por abandono.",
        ]

        resultados = analyzer.analisar_batch(textos)

        assert len(resultados) == 3
        assert all(r["sentimento"] is not None for r in resultados)

    def test_idioma_portugues(self):
        """Testar suporte ao português"""
        analyzer = SentimentAnalyzer()

        texto_pt = "O réu foi condenado ao pagamento de indenização por danos morais."

        resultado = analyzer.analisar(texto_pt)

        assert resultado is not None
        assert resultado["idioma"] == "pt"
