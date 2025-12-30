"""
Script de treinamento de todos os modelos ML
Treina e salva os 4 modelos com dados sintéticos
"""

import os
import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.append(str(Path(__file__).parent.parent))

import logging

from lib.ml.clustering import ProcessClusterer
from lib.ml.duration_estimator import DurationEstimator
from lib.ml.predictor import SuccessPredictor
from lib.ml.sentiment import SentimentAnalyzer

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Constantes
MSG_MODELO_SALVO = "   💾 Modelo salvo\n"


def treinar_todos_modelos(n_samples: int = 2000):
    """
    Treinar todos os 4 modelos ML

    Args:
        n_samples: Número de amostras sintéticas
    """
    logger.info("🚀 Iniciando treinamento de todos os modelos ML\n")

    # Criar diretório de modelos
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)
    logger.info(f"📁 Diretório de modelos: {models_dir}\n")

    # ============================================================
    # 1. Success Predictor
    # ============================================================
    logger.info("=" * 60)
    logger.info("1️⃣ TREINANDO SUCCESS PREDICTOR")
    logger.info("=" * 60)

    try:
        predictor = SuccessPredictor(n_estimators=100)

        # Gerar dados
        df_predictor = predictor.gerar_dados_sinteticos(n_samples)
        logger.info(f"   Dados gerados: {df_predictor.shape}")

        # Treinar
        metrics_predictor = predictor.treinar(df_predictor)
        logger.info(f"   ✅ Acurácia: {metrics_predictor['accuracy']:.2%}")
        logger.info(f"   ✅ CV Score: {metrics_predictor['cv_scores_mean']:.2%}")

        # Salvar
        predictor.salvar(str(models_dir / "success_predictor.pkl"))
        logger.info(MSG_MODELO_SALVO)

    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # ============================================================
    # 2. Duration Estimator
    # ============================================================
    logger.info("=" * 60)
    logger.info("2️⃣ TREINANDO DURATION ESTIMATOR")
    logger.info("=" * 60)

    try:
        estimator = DurationEstimator(n_estimators=150)

        # Gerar dados
        df_estimator = estimator.gerar_dados_sinteticos(n_samples)
        logger.info(f"   Dados gerados: {df_estimator.shape}")

        # Treinar
        metrics_estimator = estimator.treinar(df_estimator)
        logger.info(f"   ✅ MAE: {metrics_estimator['mae']:.0f} dias")
        logger.info(f"   ✅ RMSE: {metrics_estimator['rmse']:.0f} dias")
        logger.info(f"   ✅ R²: {metrics_estimator['r2']:.3f}")

        # Salvar
        estimator.salvar(str(models_dir / "duration_estimator.pkl"))
        logger.info(MSG_MODELO_SALVO)

    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # ============================================================
    # 3. Process Clusterer
    # ============================================================
    logger.info("=" * 60)
    logger.info("3️⃣ TREINANDO PROCESS CLUSTERER")
    logger.info("=" * 60)

    try:
        clusterer = ProcessClusterer(n_clusters=5)

        # Gerar dados
        df_clusterer = clusterer.gerar_dados_sinteticos(n_samples)
        logger.info(f"   Dados gerados: {df_clusterer.shape}")

        # Treinar
        metrics_clusterer = clusterer.treinar(df_clusterer)
        logger.info(
            f"   ✅ Silhouette Score: {metrics_clusterer['silhouette_score']:.3f}"
        )
        logger.info(f"   ✅ Distribuição: {metrics_clusterer['cluster_sizes']}")

        # Salvar
        clusterer.salvar(str(models_dir / "process_clusterer.pkl"))
        logger.info(MSG_MODELO_SALVO)

    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # ============================================================
    # 4. Sentiment Analyzer
    # ============================================================
    logger.info("=" * 60)
    logger.info("4️⃣ TESTANDO SENTIMENT ANALYZER")
    logger.info("=" * 60)

    try:
        analyzer = SentimentAnalyzer()

        # Textos de teste
        textos_teste = [
            "Julgo PROCEDENTE o pedido. Acolho os argumentos do autor.",
            "Julgo IMPROCEDENTE o pedido. Nego provimento ao recurso.",
            "Julgo PARCIALMENTE PROCEDENTE em parte dos pedidos.",
            "URGENTE: prazo de 2 dias para manifestação.",
        ]

        resultados = analyzer.analisar_lote(textos_teste)
        logger.info(f"   ✅ {len(resultados)} textos analisados")

        # Sentiment Analyzer não precisa ser salvo (baseado em regras)
        logger.info("   ℹ️ Sentiment Analyzer baseado em regras (não salvo)\n")

    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # ============================================================
    # Resumo Final
    # ============================================================
    logger.info("=" * 60)
    logger.info("📊 RESUMO DO TREINAMENTO")
    logger.info("=" * 60)

    # Listar modelos salvos
    modelos_salvos = list(models_dir.glob("*.pkl"))
    logger.info(f"\n✅ {len(modelos_salvos)} modelos salvos em {models_dir}:")

    for modelo in modelos_salvos:
        tamanho_kb = modelo.stat().st_size / 1024
        logger.info(f"   - {modelo.name} ({tamanho_kb:.1f} KB)")

    logger.info("\n" + "=" * 60)
    logger.info("✅ TREINAMENTO CONCLUÍDO COM SUCESSO!")
    logger.info("=" * 60 + "\n")


def testar_modelos():
    """Testar todos os modelos treinados"""
    logger.info("🧪 Testando modelos treinados...\n")

    models_dir = Path(__file__).parent.parent / "models"

    # Caso de teste
    caso_teste = {
        "tipo_acao": "Trabalhista",
        "valor_causa": 50000,
        "tribunal": "TRT19",
        "tempo_tramitacao": 180,
        "complexidade": "média",
        "num_partes": 2,
        "tem_advogado": 1,
        "grau": 1,
        "tem_recurso": 0,
        "comarca": "Maceió",
        "num_movimentacoes": 25,
        "tem_sentenca": 0,
    }

    # Teste 1: Success Predictor
    try:
        logger.info("1️⃣ Success Predictor")
        predictor = SuccessPredictor.carregar(str(models_dir / "success_predictor.pkl"))
        resultado = predictor.prever(caso_teste)
        logger.info(
            f"   Probabilidade sucesso: {resultado['probabilidade_sucesso']:.1%}\n"
        )
    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # Teste 2: Duration Estimator
    try:
        logger.info("2️⃣ Duration Estimator")
        estimator = DurationEstimator.carregar(
            str(models_dir / "duration_estimator.pkl")
        )
        resultado = estimator.estimar(caso_teste)
        logger.info(f"   Duração estimada: {resultado['duracao_estimada_dias']} dias\n")
    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # Teste 3: Process Clusterer
    try:
        logger.info("3️⃣ Process Clusterer")
        clusterer = ProcessClusterer.carregar(str(models_dir / "process_clusterer.pkl"))
        resultado = clusterer.classificar(caso_teste)
        logger.info(f"   Cluster: {resultado['cluster_nome']}\n")
    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    # Teste 4: Sentiment Analyzer
    try:
        logger.info("4️⃣ Sentiment Analyzer")
        analyzer = SentimentAnalyzer()
        texto = "Julgo PROCEDENTE o pedido e acolho os argumentos."
        resultado = analyzer.analisar_texto(texto)
        logger.info(f"   Sentimento: {resultado['sentimento']}\n")
    except Exception as e:
        logger.error(f"   ❌ Erro: {str(e)}\n")

    logger.info("✅ Testes concluídos!\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Treinar modelos ML")
    parser.add_argument(
        "--samples",
        type=int,
        default=2000,
        help="Número de amostras sintéticas (padrão: 2000)",
    )
    parser.add_argument(
        "--test-only", action="store_true", help="Apenas testar modelos existentes"
    )

    args = parser.parse_args()

    if args.test_only:
        testar_modelos()
    else:
        treinar_todos_modelos(n_samples=args.samples)
        testar_modelos()
