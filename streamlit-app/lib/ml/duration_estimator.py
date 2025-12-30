"""
Duration Estimator - Estimativa de duração processual
Modelo GradientBoosting para prever tempo de tramitação de processos
"""

import logging
import pickle
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)

# Constantes
COMPLEXIDADES = ["baixa", "média", "alta"]
COMPLEXIDADE_MEDIA = "média"


class DurationEstimator:
    """
    Modelo de estimativa de duração processual

    Features consideradas:
    - tipo_acao: Tipo de ação judicial
    - tribunal: Tribunal de origem
    - grau: Grau da instância (1 ou 2)
    - complexidade: Nível de complexidade
    - num_partes: Número de partes
    - valor_causa: Valor da causa
    - tem_recurso: Possui recurso (bool)
    - comarca: Comarca de origem

    Target:
    - duracao_dias: Duração total em dias
    """

    def __init__(
        self,
        n_estimators: int = 150,
        learning_rate: float = 0.1,
        max_depth: int = 5,
        random_state: int = 42,
    ):
        """
        Inicializar estimador

        Args:
            n_estimators: Número de árvores
            learning_rate: Taxa de aprendizado
            max_depth: Profundidade máxima das árvores
            random_state: Seed
        """
        self.model = GradientBoostingRegressor(
            n_estimators=n_estimators,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=random_state,
            min_samples_split=10,
            min_samples_leaf=4,
            subsample=0.8,
        )

        self.encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = [
            "tipo_acao",
            "tribunal",
            "grau",
            "complexidade",
            "num_partes",
            "valor_causa",
            "tem_recurso",
            "comarca",
        ]
        self.is_trained = False

        logger.info("✅ DurationEstimator inicializado")

    def treinar(self, df: pd.DataFrame, test_size: float = 0.2) -> Dict:
        """
        Treinar modelo com dados históricos

        Args:
            df: DataFrame com features + 'duracao_dias'
            test_size: Proporção de teste

        Returns:
            Métricas de performance
        """
        try:
            logger.info("🎓 Treinando modelo de estimativa de duração...")

            # Validar colunas
            required_cols = self.feature_names + ["duracao_dias"]
            missing_cols = [col for col in required_cols if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Colunas faltando: {missing_cols}")

            # Preparar features
            X = df[self.feature_names].copy()
            y = df["duracao_dias"].values

            # Encoding categóricas
            categorical_cols = ["tipo_acao", "tribunal", "complexidade", "comarca"]
            for col in categorical_cols:
                if col in X.columns:
                    self.encoders[col] = LabelEncoder()
                    X[col] = self.encoders[col].fit_transform(X[col].astype(str))

            # Scaling numéricas
            numeric_cols = ["grau", "num_partes", "valor_causa"]
            X[numeric_cols] = self.scaler.fit_transform(X[numeric_cols])

            # Split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )

            logger.info(f"  Treino: {len(X_train)} | Teste: {len(X_test)}")

            # Treinar
            self.model.fit(X_train, y_train)

            # Validação cruzada (MAE negativo)
            cv_scores = cross_val_score(
                self.model, X_train, y_train, cv=5, scoring="neg_mean_absolute_error"
            )
            cv_mae = -cv_scores.mean()

            # Predições
            y_pred = self.model.predict(X_test)

            # Métricas
            mae = mean_absolute_error(y_test, y_pred)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred))
            r2 = r2_score(y_test, y_pred)

            # Feature importance
            feature_importance = dict(
                zip(self.feature_names, self.model.feature_importances_)
            )

            self.is_trained = True

            metrics = {
                "mae": mae,
                "rmse": rmse,
                "r2": r2,
                "cv_mae": cv_mae,
                "cv_mae_std": cv_scores.std(),
                "feature_importance": feature_importance,
                "mean_duration": y_train.mean(),
                "median_duration": np.median(y_train),
                "n_train": len(X_train),
                "n_test": len(X_test),
            }

            logger.info("✅ Modelo treinado!")
            logger.info(f"  MAE: {mae:.0f} dias")
            logger.info(f"  RMSE: {rmse:.0f} dias")
            logger.info(f"  R²: {r2:.3f}")

            return metrics

        except Exception as e:
            logger.error(f"❌ Erro ao treinar: {str(e)}")
            raise

    def estimar(self, caso: Dict) -> Dict:
        """
        Estimar duração de um caso

        Args:
            caso: Dicionário com features

        Returns:
            Estimativa com intervalos de confiança
        """
        if not self.is_trained:
            raise ValueError("Modelo não treinado!")

        try:
            # Preparar features
            X = pd.DataFrame([caso])

            for col in self.feature_names:
                if col not in X.columns:
                    X[col] = 0

            X = X[self.feature_names]

            # Encoding
            categorical_cols = ["tipo_acao", "tribunal", "complexidade", "comarca"]
            for col in categorical_cols:
                if col in X.columns and col in self.encoders:
                    try:
                        X[col] = self.encoders[col].transform(X[col].astype(str))
                    except ValueError:
                        X[col] = -1

            # Scaling
            numeric_cols = ["grau", "num_partes", "valor_causa"]
            X[numeric_cols] = self.scaler.transform(X[numeric_cols])

            # Predição
            duracao_dias = self.model.predict(X)[0]

            # Intervalo de confiança estimado (±20%)
            ic_lower = duracao_dias * 0.8
            ic_upper = duracao_dias * 1.2

            # Conversão para meses e anos
            duracao_meses = duracao_dias / 30
            duracao_anos = duracao_dias / 365

            resultado = {
                "duracao_estimada_dias": int(duracao_dias),
                "duracao_estimada_meses": round(duracao_meses, 1),
                "duracao_estimada_anos": round(duracao_anos, 2),
                "intervalo_confianca_dias": (int(ic_lower), int(ic_upper)),
                "categoria": self._classificar_duracao(duracao_dias),
            }

            logger.info(
                f"⏱️ Estimativa: {resultado['duracao_estimada_dias']} dias ({resultado['categoria']})"
            )

            return resultado

        except Exception as e:
            logger.error(f"❌ Erro ao estimar: {str(e)}")
            raise

    def _classificar_duracao(self, dias: float) -> str:
        """Classificar duração em categorias"""
        if dias < 180:
            return "rápido"
        elif dias < 365:
            return "moderado"
        elif dias < 730:
            return "demorado"
        else:
            return "muito_demorado"

    def salvar(self, filepath: str = "models/duration_estimator.pkl"):
        """Salvar modelo"""
        if not self.is_trained:
            raise ValueError("Modelo não treinado!")

        try:
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            data = {
                "model": self.model,
                "encoders": self.encoders,
                "scaler": self.scaler,
                "feature_names": self.feature_names,
                "is_trained": self.is_trained,
            }

            with open(filepath, "wb") as f:
                pickle.dump(data, f)

            logger.info(f"💾 Modelo salvo: {filepath}")

        except Exception as e:
            logger.error(f"❌ Erro ao salvar: {str(e)}")
            raise

    @classmethod
    def carregar(
        cls, filepath: str = "models/duration_estimator.pkl"
    ) -> "DurationEstimator":
        """Carregar modelo"""
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)

            estimator = cls()
            estimator.model = data["model"]
            estimator.encoders = data["encoders"]
            estimator.scaler = data["scaler"]
            estimator.feature_names = data["feature_names"]
            estimator.is_trained = data["is_trained"]

            logger.info(f"📂 Modelo carregado: {filepath}")

            return estimator

        except Exception as e:
            logger.error(f"❌ Erro ao carregar: {str(e)}")
            raise

    def gerar_dados_sinteticos(self, n_samples: int = 1000) -> pd.DataFrame:
        """Gerar dados sintéticos"""
        logger.info(f"🎲 Gerando {n_samples} amostras...")

        np.random.seed(42)

        tipos_acao = [
            "Trabalhista",
            "Cível",
            "Criminal",
            "Previdenciária",
            "Tributária",
        ]
        tribunais = ["TJAL", "TRT19", "TRF5", "STJ", "TSF"]
        complexidades = ["baixa", "média", "alta"]
        comarcas = [
            "Maceió",
            "Arapiraca",
            "Palmeira dos Índios",
            "Penedo",
            "Delmiro Gouveia",
        ]

        # Usar numpy.random.Generator moderno
        rng = np.random.default_rng(42)

        data = {
            "tipo_acao": rng.choice(tipos_acao, n_samples),
            "tribunal": rng.choice(tribunais, n_samples),
            "grau": rng.choice([1, 2], n_samples, p=[0.7, 0.3]),
            "complexidade": rng.choice(complexidades, n_samples),
            "num_partes": rng.integers(2, 8, n_samples),
            "valor_causa": rng.lognormal(10, 2, n_samples),
            "tem_recurso": rng.choice([0, 1], n_samples, p=[0.6, 0.4]),
            "comarca": rng.choice(comarcas, n_samples),
        }

        df = pd.DataFrame(data)

        # Gerar duração com lógica heurística
        duracao_base = 180  # 6 meses base

        duracao = (
            duracao_base
            + (df["grau"] - 1) * 200  # 2º grau demora mais
            + (df["complexidade"] == "alta").astype(int) * 300
            + (df["complexidade"] == "média").astype(int) * 150
            + df["tem_recurso"] * 180
            + df["num_partes"] * 30
            + rng.normal(0, 90, n_samples)  # Variação aleatória
        )

        df["duracao_dias"] = np.maximum(30, duracao).astype(int)  # Mínimo 30 dias

        logger.info(f"  Duração média: {df['duracao_dias'].mean():.0f} dias")

        return df


# Teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    print("🧪 Testando Duration Estimator...\n")

    estimator = DurationEstimator()

    print("1️⃣ Gerando dados sintéticos")
    df = estimator.gerar_dados_sinteticos(1000)
    print(f"   Shape: {df.shape}\n")

    print("2️⃣ Treinando modelo")
    metrics = estimator.treinar(df)
    print(f"   MAE: {metrics['mae']:.0f} dias\n")

    print("3️⃣ Teste de estimativa")
    caso = {
        "tipo_acao": "Trabalhista",
        "tribunal": "TRT19",
        "grau": 1,
        "complexidade": "média",
        "num_partes": 2,
        "valor_causa": 50000,
        "tem_recurso": 0,
        "comarca": "Maceió",
    }

    resultado = estimator.estimar(caso)
    print(f"   Duração: {resultado['duracao_estimada_dias']} dias")
    print(f"   Categoria: {resultado['categoria']}\n")

    print("4️⃣ Salvando modelo")
    estimator.salvar()

    print("\n✅ Testes concluídos!")
