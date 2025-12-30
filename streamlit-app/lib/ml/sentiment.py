"""
Sentiment Analyzer - Análise de sentimento em textos jurídicos
NLP para análise de sentimentos em decisões judiciais e documentos
"""

import logging
import re
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

# Tentativa de importar NLTK - pode falhar em ambientes sem os dados
NLTK_AVAILABLE = False
try:
    import nltk
    from textblob import TextBlob

    # Download de recursos NLTK necessários
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        try:
            nltk.download("punkt", quiet=True)
        except Exception:
            pass

    # Alguns ambientes recentes do NLTK/TextBlob exigem o pacote `punkt_tab`
    try:
        nltk.data.find("tokenizers/punkt_tab")
    except LookupError:
        try:
            nltk.download("punkt_tab", quiet=True)
        except Exception:
            pass

    try:
        nltk.data.find("corpora/stopwords")
    except LookupError:
        try:
            nltk.download("stopwords", quiet=True)
        except Exception:
            pass

    NLTK_AVAILABLE = True
except Exception as e:
    logger.warning(f"NLTK não disponível: {e}. Usando análise simplificada.")


class SentimentAnalyzer:
    """
    Analisador de sentimento para textos jurídicos

    Funcionalidades:
    - Análise de polaridade (positivo/negativo/neutro)
    - Análise de subjetividade
    - Detecção de tom judicial
    - Extração de palavras-chave
    - Classificação de decisões (favorável/desfavorável)
    """

    def __init__(self):
        """Inicializar analisador"""

        # Palavras-chave jurídicas por sentimento
        self.palavras_favoraveis = {
            "procedente",
            "acolho",
            "provido",
            "deferido",
            "favorável",
            "reconheço",
            "julgo procedente",
            "concedo",
            "defiro",
            "acolhida",
            "procedência",
            "êxito",
            "vitória",
        }

        self.palavras_desfavoraveis = {
            "improcedente",
            "nego",
            "improvido",
            "indeferido",
            "desfavorável",
            "não reconheço",
            "julgo improcedente",
            "não concedo",
            "indefiro",
            "rejeitada",
            "improcedência",
            "insucesso",
            "derrota",
        }

        self.palavras_parciais = {
            "parcialmente procedente",
            "em parte",
            "parcial",
            "parcialmente",
            "parte dos pedidos",
        }

        # Stopwords português
        try:
            from nltk.corpus import stopwords

            self.stopwords = set(stopwords.words("portuguese"))
        except:
            self.stopwords = set()

        logger.info("✅ SentimentAnalyzer inicializado")

    def analisar_texto(self, texto: str) -> Dict:
        """
        Análise completa de sentimento

        Args:
            texto: Texto para análise

        Returns:
            Dicionário com análises
        """
        try:
            if not texto or not isinstance(texto, str):
                raise ValueError("Texto inválido")

            # Limpar texto
            texto_limpo = self._limpar_texto(texto)

            # Análise TextBlob (se disponível)
            if NLTK_AVAILABLE:
                blob = TextBlob(texto_limpo)
                polaridade = blob.sentiment.polarity
                subjetividade = blob.sentiment.subjectivity
                num_sentencas = len(blob.sentences)
            else:
                # Análise simplificada sem NLTK
                polaridade = 0.0
                subjetividade = 0.5
                num_sentencas = texto_limpo.count(".") + 1

            # Classificação de polaridade
            if polaridade > 0.1:
                sentimento = "positivo"
            elif polaridade < -0.1:
                sentimento = "negativo"
            else:
                sentimento = "neutro"

            # Análise específica jurídica
            analise_juridica = self._analisar_decisao_judicial(texto_limpo)

            # Palavras-chave
            palavras_chave = self._extrair_palavras_chave(texto_limpo)

            resultado = {
                "sentimento": sentimento,
                "polaridade": float(polaridade),
                "subjetividade": float(subjetividade),
                "confianca": self._calcular_confianca(polaridade, subjetividade),
                "analise_juridica": analise_juridica,
                "palavras_chave": palavras_chave[:10],  # Top 10
                "tamanho_texto": len(texto),
                "num_sentencas": num_sentencas,
            }

            logger.info(f"📊 Sentimento: {sentimento} ({analise_juridica['tipo']})")

            return resultado

        except Exception as e:
            logger.error(f"❌ Erro na análise: {str(e)}")
            raise

    def _limpar_texto(self, texto: str) -> str:
        """Limpar e normalizar texto"""
        # Remover quebras de linha excessivas
        texto = re.sub(r"\n+", " ", texto)

        # Remover espaços múltiplos
        texto = re.sub(r"\s+", " ", texto)

        # Lowercase
        texto = texto.lower()

        return texto.strip()

    def _analisar_decisao_judicial(self, texto: str) -> Dict:
        """
        Análise específica para decisões judiciais

        Returns:
            Classificação da decisão
        """
        texto_lower = texto.lower()

        # Buscar palavras-chave
        score_favoravel = sum(
            1 for palavra in self.palavras_favoraveis if palavra in texto_lower
        )
        score_desfavoravel = sum(
            1 for palavra in self.palavras_desfavoraveis if palavra in texto_lower
        )
        score_parcial = sum(
            1 for palavra in self.palavras_parciais if palavra in texto_lower
        )

        # Classificar decisão
        if score_parcial > 0:
            tipo = "parcialmente_procedente"
            favorabilidade = 0.5
        elif score_favoravel > score_desfavoravel:
            tipo = "procedente"
            favorabilidade = 0.8
        elif score_desfavoravel > score_favoravel:
            tipo = "improcedente"
            favorabilidade = 0.2
        else:
            tipo = "indefinido"
            favorabilidade = 0.5

        return {
            "tipo": tipo,
            "favorabilidade": favorabilidade,
            "score_favoravel": score_favoravel,
            "score_desfavoravel": score_desfavoravel,
            "score_parcial": score_parcial,
        }

    def _extrair_palavras_chave(self, texto: str, top_n: int = 10) -> List[str]:
        """
        Extrair palavras-chave mais relevantes

        Args:
            texto: Texto limpo
            top_n: Número de palavras

        Returns:
            Lista de palavras-chave
        """
        # Tokenizar
        palavras = re.findall(r"\b\w+\b", texto.lower())

        # Remover stopwords e palavras curtas
        palavras = [p for p in palavras if p not in self.stopwords and len(p) > 3]

        # Contar frequência
        from collections import Counter

        contador = Counter(palavras)

        # Top N mais comuns
        palavras_chave = [palavra for palavra, _ in contador.most_common(top_n)]

        return palavras_chave

    def _calcular_confianca(self, polaridade: float, subjetividade: float) -> str:
        """Calcular confiança da análise"""
        # Quanto mais extrema a polaridade e menor a subjetividade, maior a confiança
        intensidade = abs(polaridade)
        objetividade = 1 - subjetividade

        score = (intensidade + objetividade) / 2

        if score > 0.7:
            return "alta"
        elif score > 0.4:
            return "média"
        else:
            return "baixa"

    def analisar_lote(self, textos: List[str]) -> List[Dict]:
        """
        Analisar múltiplos textos

        Args:
            textos: Lista de textos

        Returns:
            Lista de análises
        """
        logger.info(f"📊 Analisando {len(textos)} textos...")

        resultados = []

        for i, texto in enumerate(textos):
            try:
                resultado = self.analisar_texto(texto)
                resultado["index"] = i
                resultados.append(resultado)
            except Exception as e:
                logger.warning(f"⚠️ Erro no texto {i}: {str(e)}")
                continue

        logger.info(f"✅ {len(resultados)}/{len(textos)} textos analisados")

        return resultados

    def comparar_sentencas(self, sentenca_a: str, sentenca_b: str) -> Dict:
        """
        Comparar sentimento de duas sentenças

        Args:
            sentenca_a: Primeira sentença
            sentenca_b: Segunda sentença

        Returns:
            Comparação detalhada
        """
        try:
            analise_a = self.analisar_texto(sentenca_a)
            analise_b = self.analisar_texto(sentenca_b)

            # Diferenças
            diff_polaridade = analise_a["polaridade"] - analise_b["polaridade"]
            diff_subjetividade = analise_a["subjetividade"] - analise_b["subjetividade"]

            # Similaridade
            if analise_a["sentimento"] == analise_b["sentimento"]:
                similaridade = "alta"
            elif abs(diff_polaridade) < 0.3:
                similaridade = "média"
            else:
                similaridade = "baixa"

            comparacao = {
                "sentenca_a": analise_a,
                "sentenca_b": analise_b,
                "diferenca_polaridade": float(diff_polaridade),
                "diferenca_subjetividade": float(diff_subjetividade),
                "similaridade": similaridade,
                "mesma_favorabilidade": (
                    analise_a["analise_juridica"]["tipo"]
                    == analise_b["analise_juridica"]["tipo"]
                ),
            }

            logger.info(f"🔄 Similaridade: {similaridade}")

            return comparacao

        except Exception as e:
            logger.error(f"❌ Erro na comparação: {str(e)}")
            raise

    def classificar_urgencia(self, texto: str) -> Dict:
        """
        Classificar urgência de um texto judicial

        Args:
            texto: Texto para análise

        Returns:
            Classificação de urgência
        """
        texto_lower = texto.lower()

        palavras_urgentes = {
            "urgente",
            "urgência",
            "imediato",
            "prazo fatal",
            "prazo decadencial",
            "risco",
            "grave",
            "iminente",
            "tutela de urgência",
            "liminar",
            "antecipação",
        }

        score_urgencia = sum(
            1 for palavra in palavras_urgentes if palavra in texto_lower
        )

        # Buscar prazos curtos
        prazos_curtos = re.findall(r"\b([1-5])\s*dias?\b", texto_lower)
        if prazos_curtos:
            score_urgencia += len(prazos_curtos)

        # Classificar
        if score_urgencia >= 3:
            nivel = "crítico"
            prioridade = 1
        elif score_urgencia >= 2:
            nivel = "alto"
            prioridade = 2
        elif score_urgencia >= 1:
            nivel = "médio"
            prioridade = 3
        else:
            nivel = "baixo"
            prioridade = 4

        return {
            "nivel": nivel,
            "prioridade": prioridade,
            "score": score_urgencia,
            "palavras_encontradas": [p for p in palavras_urgentes if p in texto_lower],
        }


# Teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    print("🧪 Testando Sentiment Analyzer...\n")

    analyzer = SentimentAnalyzer()

    # Teste 1: Sentença favorável
    print("1️⃣ Teste: Sentença procedente")
    texto1 = """
    SENTENÇA. Julgo PROCEDENTE o pedido para condenar o réu ao pagamento
    de indenização por danos morais no valor de R$ 10.000,00. Reconheço
    o direito do autor e acolho integralmente seus argumentos.
    """

    resultado1 = analyzer.analisar_texto(texto1)
    print(f"   Sentimento: {resultado1['sentimento']}")
    print(f"   Tipo: {resultado1['analise_juridica']['tipo']}")
    print(f"   Favorabilidade: {resultado1['analise_juridica']['favorabilidade']}\n")

    # Teste 2: Sentença desfavorável
    print("2️⃣ Teste: Sentença improcedente")
    texto2 = """
    SENTENÇA. Julgo IMPROCEDENTE o pedido por falta de provas suficientes.
    Nego provimento ao recurso e condeno o autor ao pagamento de custas.
    Não reconheço os direitos pleiteados.
    """

    resultado2 = analyzer.analisar_texto(texto2)
    print(f"   Sentimento: {resultado2['sentimento']}")
    print(f"   Tipo: {resultado2['analise_juridica']['tipo']}\n")

    # Teste 3: Urgência
    print("3️⃣ Teste: Classificação de urgência")
    texto3 = """
    INTIMAÇÃO URGENTE. O prazo para manifestação é de 2 dias úteis,
    sob pena de preclusão. Trata-se de tutela de urgência com risco
    iminente de dano irreparável.
    """

    urgencia = analyzer.classificar_urgencia(texto3)
    print(f"   Nível: {urgencia['nivel']}")
    print(f"   Prioridade: {urgencia['prioridade']}\n")

    # Teste 4: Comparação
    print("4️⃣ Teste: Comparação de sentenças")
    comparacao = analyzer.comparar_sentencas(texto1, texto2)
    print(f"   Similaridade: {comparacao['similaridade']}")
    print(f"   Mesma favorabilidade: {comparacao['mesma_favorabilidade']}\n")

    print("✅ Testes concluídos!")
