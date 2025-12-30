"""
Success Predictor - Predição de sucesso processual
Modelo RandomForest para prever probabilidade de sucesso em ações judiciais
"""

import logging
import pickle
from pathlib import Path
from typing import Dict, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)


class SuccessPredictor:
    """
    Modelo de predição de sucesso processual

    Features consideradas:
    - tipo_acao: Tipo de ação judicial
    - valor_causa: Valor da causa
    - tribunal: Tribunal de origem
    - tempo_tramitacao: Tempo de tramitação (dias)
    - complexidade: Nível de complexidade (baixa/média/alta)
    - num_partes: Número de partes envolvidas
    - tem_advogado: Possui advogado (bool)

    Target:
    - sucesso: 1 (procedente/parcialmente procedente), 0 (improcedente)
    """

    def __init__(self, n_estimators: int = 100, random_state: int = 42):
        """
        Inicializar preditor

        Args:
            n_estimators: Número de árvores no RandomForest
            random_state: Seed para reprodutibilidade
        """
        self.model = RandomForestClassifier(
            n_estimators=n_estimators,
            random_state=random_state,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",  # Lidar com classes desbalanceadas
        )

        self.encoders = {}
        self.scaler = StandardScaler()
        self.feature_names = [
            "tipo_acao",
            "valor_causa",
            "tribunal",
            "tempo_tramitacao",
            "complexidade",
            "num_partes",
            "tem_advogado",
        ]
        self.is_trained = False

        logger.info("✅ SuccessPredictor inicializado")

    def treinar(
        self,
        df: pd.DataFrame,
        y: Optional[Sequence[int]] = None,
        test_size: float = 0.2,
    ) -> Dict:
        """
        Treinar modelo com dados históricos

        Args:
            df: DataFrame com colunas das features e (opcionalmente) a coluna 'sucesso'.
            y: Labels (0/1). Se fornecido, dispensa a coluna 'sucesso' no DataFrame.
            test_size: Proporção de dados para teste

        Returns:
            Dicionário com métricas de performance
        """
        try:
            logger.info("🎓 Treinando modelo de predição de sucesso...")

            # Backward-compat: chamada antiga `treinar(df, test_size=0.2)`
            # (Se alguém passou um float/int como 2º parâmetro, interpretamos como test_size)
            if y is not None and isinstance(y, (float, int)) and not isinstance(y, bool):
                test_size = float(y)
                y = None

            # Validar colunas de features
            missing_features = [col for col in self.feature_names if col not in df.columns]
            if missing_features:
                raise ValueError(f"Colunas faltando: {missing_features}")

            # Labels
            if y is None:
                if "sucesso" not in df.columns:
                    raise ValueError("Coluna 'sucesso' não encontrada e labels 'y' não fornecidos")
                y_arr = df["sucesso"].values
            else:
                if len(y) != len(df):
                    raise ValueError(
                        f"Tamanho de y ({len(y)}) diferente do DataFrame ({len(df)})"
                    )
                y_arr = np.asarray(list(y))

            # Preparar features
            X = df[self.feature_names].copy()

            # Encoding de variáveis categóricas
            categorical_cols = ["tipo_acao", "tribunal", "complexidade"]
            for col in categorical_cols:
                if col in X.columns:
                    self.encoders[col] = LabelEncoder()
                    X[col] = self.encoders[col].fit_transform(X[col].astype(str))

            # Scaling de variáveis numéricas
            numeric_cols = ["valor_causa", "tempo_tramitacao", "num_partes"]
            X[numeric_cols] = self.scaler.fit_transform(X[numeric_cols])

            # Split treino/teste
            X_train, X_test, y_train, y_test = train_test_split(
                X, y_arr, test_size=test_size, random_state=42, stratify=y_arr
            )

            logger.info(
                f"  Treino: {len(X_train)} amostras | Teste: {len(X_test)} amostras"
            )

            # Treinar modelo
            self.model.fit(X_train, y_train)

            # Validação cruzada
            cv_scores = cross_val_score(
                self.model, X_train, y_train, cv=5, scoring="accuracy"
            )

            # Predições no conjunto de teste
            y_pred = self.model.predict(X_test)
            y_pred_proba = self.model.predict_proba(X_test)[:, 1]

            # Métricas
            accuracy = accuracy_score(y_test, y_pred)
            report = classification_report(y_test, y_pred, output_dict=True)
            conf_matrix = confusion_matrix(y_test, y_pred)

            # Feature importance
            feature_importance = dict(
                zip(self.feature_names, self.model.feature_importances_)
            )

            self.is_trained = True

            # Expor precision/recall no top-level para compatibilidade com testes
            positive_key = "1" if "1" in report else None
            precision = (
                float(report[positive_key]["precision"]) if positive_key else float(report["macro avg"]["precision"])
            )
            recall = (
                float(report[positive_key]["recall"]) if positive_key else float(report["macro avg"]["recall"])
            )

            metrics = {
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "cv_scores_mean": cv_scores.mean(),
                "cv_scores_std": cv_scores.std(),
                "classification_report": report,
                "confusion_matrix": conf_matrix.tolist(),
                "feature_importance": feature_importance,
                "n_train": len(X_train),
                "n_test": len(X_test),
            }

            logger.info(f"✅ Modelo treinado!")
            logger.info(f"  Acurácia: {accuracy:.2%}")
            logger.info(
                f"  CV Score: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})"
            )

            return metrics

        except Exception as e:
            logger.error(f"❌ Erro ao treinar modelo: {str(e)}")
            raise

    def prever(self, caso: Dict) -> Dict:
        """
        Prever probabilidade de sucesso para um caso

        Args:
            caso: Dicionário com features do caso

        Returns:
            Dicionário com predição e probabilidade
        """
        if not self.is_trained:
            # Para compatibilidade com testes/UX, retornar erro estruturado (sem exception)
            logger.warning("⚠️ SuccessPredictor.prever: modelo não treinado")
            return {"error": "Modelo não foi treinado ainda!"}

        try:
            # Preparar features
            X = pd.DataFrame([caso])

            # Garantir todas as features
            for col in self.feature_names:
                if col not in X.columns:
                    X[col] = 0  # Valor padrão

            X = X[self.feature_names]

            # Encoding
            categorical_cols = ["tipo_acao", "tribunal", "complexidade"]
            for col in categorical_cols:
                if col in X.columns and col in self.encoders:
                    try:
                        X[col] = self.encoders[col].transform(X[col].astype(str))
                    except ValueError:
                        # Categoria não vista no treino - usar valor padrão
                        X[col] = -1

            # Scaling
            numeric_cols = ["valor_causa", "tempo_tramitacao", "num_partes"]
            X[numeric_cols] = self.scaler.transform(X[numeric_cols])

            # Prever
            predicao = self.model.predict(X)[0]
            probabilidade = self.model.predict_proba(X)[0]

            resultado = {
                "sucesso": bool(predicao),
                "probabilidade_sucesso": float(probabilidade[1]),
                "probabilidade_insucesso": float(probabilidade[0]),
                # Alias para compatibilidade com diferentes consumidores
                "probabilidade": float(probabilidade[1]),
                "confianca": (
                    "alta"
                    if max(probabilidade) > 0.8
                    else "média" if max(probabilidade) > 0.6 else "baixa"
                ),
            }

            logger.info(
                f"🔮 Predição: {resultado['probabilidade_sucesso']:.1%} de sucesso ({resultado['confianca']} confiança)"
            )

            return resultado

        except Exception as e:
            logger.error(f"❌ Erro ao fazer predição: {str(e)}")
            raise

    def get_feature_importances(self) -> dict[str, float]:
        """Retorna as importâncias das features do modelo treinado (compatível com testes)."""
        if not self.is_trained:
            return {}
        try:
            importancias = [float(x) for x in self.model.feature_importances_.tolist()]
            return {name: val for name, val in zip(self.feature_names, importancias)}
        except Exception as e:
            logger.error(f"Erro ao obter importâncias: {e}")
            return {}

    def salvar(self, filepath: str = "models/success_predictor.pkl"):
        """
        Salvar modelo treinado

        Args:
            filepath: Caminho do arquivo
        """
        if not self.is_trained:
            raise ValueError("Modelo não foi treinado ainda!")

        try:
            # Criar diretório se não existir
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            # Salvar modelo e metadados
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
            logger.error(f"❌ Erro ao salvar modelo: {str(e)}")
            raise

    @classmethod
    def carregar(
        cls, filepath: str = "models/success_predictor.pkl"
    ) -> "SuccessPredictor":
        """
        Carregar modelo treinado

        Args:
            filepath: Caminho do arquivo

        Returns:
            Instância do preditor com modelo carregado
        """
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)

            predictor = cls()
            predictor.model = data["model"]
            predictor.encoders = data["encoders"]
            predictor.scaler = data["scaler"]
            predictor.feature_names = data["feature_names"]
            predictor.is_trained = data["is_trained"]

            logger.info(f"📂 Modelo carregado: {filepath}")

            return predictor

        except Exception as e:
            logger.error(f"❌ Erro ao carregar modelo: {str(e)}")
            raise

    def gerar_dados_sinteticos(self, n_samples: int = 1000) -> pd.DataFrame:
        """
        Gerar dados sintéticos para treino inicial

        Args:
            n_samples: Número de amostras

        Returns:
            DataFrame com dados sintéticos
        """
        logger.info(f"🎲 Gerando {n_samples} amostras sintéticas...")

        np.random.seed(42)

        tipos_acao = [
            "Trabalhista",
            "Cível",
            "Criminal",
            "Previdenciária",
            "Tributária",
        ]
        tribunais = ["TJAL", "TRT19", "TRF5", "STJ", "STF"]
        complexidades = ["baixa", "média", "alta"]

        data = {
            "tipo_acao": np.random.choice(tipos_acao, n_samples),
            "valor_causa": np.random.lognormal(
                10, 2, n_samples
            ),  # Distribuição log-normal
            "tribunal": np.random.choice(tribunais, n_samples),
            "tempo_tramitacao": np.random.randint(
                30, 1800, n_samples
            ),  # 1 mês a 5 anos
            "complexidade": np.random.choice(complexidades, n_samples),
            "num_partes": np.random.randint(2, 10, n_samples),
            "tem_advogado": np.random.choice(
                [0, 1], n_samples, p=[0.1, 0.9]
            ),  # 90% têm advogado
        }

        df = pd.DataFrame(data)

        # Gerar target com lógica heurística
        # Maior probabilidade de sucesso quando:
        # - Tem advogado
        # - Valor causa alto
        # - Complexidade baixa
        # - Tempo tramitação moderado

        sucesso_score = (
            df["tem_advogado"] * 0.3
            + (df["valor_causa"] > df["valor_causa"].median()).astype(int) * 0.2
            + (df["complexidade"] == "baixa").astype(int) * 0.3
            + (df["tempo_tramitacao"] < 365).astype(int) * 0.2
            + np.random.normal(0, 0.15, n_samples)  # Ruído
        )

        df["sucesso"] = (sucesso_score > 0.5).astype(int)

        logger.info(f"  Distribuição: {df['sucesso'].value_counts().to_dict()}")

        return df


# Função de teste standalone
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    print("🧪 Testando Success Predictor...\n")

    predictor = SuccessPredictor()

    # Gerar dados sintéticos
    print("1️⃣ Gerando dados sintéticos")
    df = predictor.gerar_dados_sinteticos(n_samples=1000)
    print(f"   Shape: {df.shape}\n")

    # Treinar modelo
    print("2️⃣ Treinando modelo")
    metrics = predictor.treinar(df)
    print(f"   Acurácia: {metrics['accuracy']:.2%}\n")

    # Fazer predição
    print("3️⃣ Teste de predição")
    caso_teste = {
        "tipo_acao": "Trabalhista",
        "valor_causa": 50000,
        "tribunal": "TRT19",
        "tempo_tramitacao": 180,
        "complexidade": "média",
        "num_partes": 2,
        "tem_advogado": 1,
    }

    resultado = predictor.prever(caso_teste)
    print(f"   Probabilidade sucesso: {resultado['probabilidade_sucesso']:.1%}")
    print(f"   Confiança: {resultado['confianca']}\n")

    # Salvar modelo
    print("4️⃣ Salvando modelo")
    predictor.salvar()

    # Carregar modelo
    print("5️⃣ Carregando modelo")
    predictor2 = SuccessPredictor.carregar()
    resultado2 = predictor2.prever(caso_teste)
    print(f"   Predição após carregar: {resultado2['probabilidade_sucesso']:.1%}\n")

    print("✅ Testes concluídos!")
