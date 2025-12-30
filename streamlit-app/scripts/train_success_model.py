"""
Script de Treinamento - Modelo de Predição de Sucesso Processual
Usa RandomForestClassifier para prever probabilidade de vitória
"""

import logging
import os
import pickle
from datetime import datetime
from typing import Dict, List

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SuccessPredictor:
    """Modelo para prever sucesso processual."""

    def __init__(self):
        """Inicializa o preditor."""
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            random_state=42,
            n_jobs=-1,
        )
        self.encoders = {}
        self.scaler = StandardScaler()
        self.feature_importance = None
        self.metrics = {}

    def gerar_dados_sinteticos(self, n_samples: int = 1000) -> pd.DataFrame:
        """
        Gera dados sintéticos para treinamento.

        Args:
            n_samples: Número de amostras

        Returns:
            DataFrame com dados sintéticos
        """
        logger.info(f"Gerando {n_samples} amostras sintéticas...")

        # Usar numpy.random.Generator moderno
        rng = np.random.default_rng(42)

        tipos = ["Trabalhista", "Cível", "Tributário", "Previdenciário", "Criminal"]
        tribunais = ["TRT2", "TRT15", "TJSP", "TJAL", "STJ"]
        instancias = ["1ª Instância", "2ª Instância", "Tribunal Superior"]

        data = {
            "tipo_acao": rng.choice(tipos, n_samples),
            "tribunal": rng.choice(tribunais, n_samples),
            "instancia": rng.choice(instancias, n_samples),
            "valor_causa": rng.lognormal(10, 2, n_samples),  # Valores realistas
            "complexidade": rng.integers(1, 11, n_samples),
            "prazo_meses": rng.integers(6, 60, n_samples),
            "tem_precedente": rng.choice([0, 1], n_samples, p=[0.3, 0.7]),
            "advogado_experiencia": rng.integers(1, 31, n_samples),
            "num_testemunhas": rng.integers(0, 11, n_samples),
            "provas_documentais": rng.integers(0, 21, n_samples),
        }

        df = pd.DataFrame(data)

        # Gerar target (sucesso) baseado em lógica realista
        sucesso_prob = (
            (df["tem_precedente"] * 0.3)
            + (df["advogado_experiencia"] / 30 * 0.2)
            + ((11 - df["complexidade"]) / 10 * 0.2)
            + (df["provas_documentais"] / 20 * 0.15)
            + (df["num_testemunhas"] / 10 * 0.15)
        )

        # Adicionar ruído
        sucesso_prob += rng.normal(0, 0.1, n_samples)
        sucesso_prob = np.clip(sucesso_prob, 0, 1)

        df["sucesso"] = (sucesso_prob > 0.5).astype(int)

        logger.info(f"Taxa de sucesso: {df['sucesso'].mean():.2%}")

        return df

    def preparar_dados(self, df: pd.DataFrame) -> tuple:
        """
        Prepara dados para treinamento.

        Args:
            df: DataFrame com dados

        Returns:
            Tupla (X, y) com features e target
        """
        logger.info("Preparando dados...")

        # Separar features e target
        y = df["sucesso"]
        X = df.drop("sucesso", axis=1)

        # Encoding de variáveis categóricas
        categorical_cols = ["tipo_acao", "tribunal", "instancia"]

        for col in categorical_cols:
            if col in X.columns:
                self.encoders[col] = LabelEncoder()
                X[col] = self.encoders[col].fit_transform(X[col])

        # Normalizar features numéricas
        X_scaled = self.scaler.fit_transform(X)
        X = pd.DataFrame(X_scaled, columns=X.columns)

        return X, y

    def treinar(self, df: pd.DataFrame) -> Dict:
        """
        Treina o modelo.

        Args:
            df: DataFrame com dados de treinamento

        Returns:
            Dicionário com métricas
        """
        logger.info("Iniciando treinamento...")

        # Preparar dados
        X, y = self.preparar_dados(df)

        # Split treino/teste
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        logger.info(f"Treino: {len(X_train)} | Teste: {len(X_test)}")

        # Treinar modelo
        self.model.fit(X_train, y_train)

        # Predições
        y_pred = self.model.predict(X_test)
        y_proba = self.model.predict_proba(X_test)[:, 1]

        # Métricas
        self.metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred),
            "roc_auc": roc_auc_score(y_test, y_proba),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "train_date": datetime.now().isoformat(),
        }

        # Cross-validation
        cv_scores = cross_val_score(self.model, X, y, cv=5, scoring="accuracy")
        self.metrics["cv_accuracy_mean"] = cv_scores.mean()
        self.metrics["cv_accuracy_std"] = cv_scores.std()

        # Feature importance
        self.feature_importance = pd.DataFrame(
            {"feature": X.columns, "importance": self.model.feature_importances_}
        ).sort_values("importance", ascending=False)

        logger.info("✅ Treinamento concluído")
        self._print_metrics()

        return self.metrics

    def _print_metrics(self):
        """Imprime métricas do modelo."""
        print("\n" + "=" * 50)
        print("MÉTRICAS DO MODELO - PREDIÇÃO DE SUCESSO")
        print("=" * 50)
        print(f"Acurácia:       {self.metrics['accuracy']:.3f}")
        print(f"Precisão:       {self.metrics['precision']:.3f}")
        print(f"Recall:         {self.metrics['recall']:.3f}")
        print(f"F1-Score:       {self.metrics['f1_score']:.3f}")
        print(f"ROC-AUC:        {self.metrics['roc_auc']:.3f}")
        print(
            f"CV Accuracy:    {self.metrics['cv_accuracy_mean']:.3f} ± {self.metrics['cv_accuracy_std']:.3f}"
        )
        print("=" * 50)
        print("\nTop 5 Features:")
        print(self.feature_importance.head())
        print("=" * 50 + "\n")

    def salvar_modelo(self, filename: str = "models/success_predictor.pkl"):
        """Salva modelo treinado."""
        os.makedirs(os.path.dirname(filename), exist_ok=True)

        with open(filename, "wb") as f:
            pickle.dump(
                {
                    "model": self.model,
                    "encoders": self.encoders,
                    "scaler": self.scaler,
                    "feature_importance": self.feature_importance,
                    "metrics": self.metrics,
                },
                f,
            )

        logger.info(f"✅ Modelo salvo em: {filename}")

    def carregar_modelo(self, filename: str = "models/success_predictor.pkl"):
        """Carrega modelo treinado."""
        with open(filename, "rb") as f:
            data = pickle.load(f)
            self.model = data["model"]
            self.encoders = data["encoders"]
            self.scaler = data["scaler"]
            self.feature_importance = data["feature_importance"]
            self.metrics = data["metrics"]

        logger.info(f"✅ Modelo carregado de: {filename}")

    def prever(self, features: dict) -> dict:
        """
        Faz predição para um novo caso.

        Args:
            features: Dicionário com características do caso

        Returns:
            Dicionário com predição e probabilidade
        """
        # Criar DataFrame
        df = pd.DataFrame([features])

        # Encoding
        for col, encoder in self.encoders.items():
            if col in df.columns:
                df[col] = encoder.transform(df[col])

        # Normalizar
        X = self.scaler.transform(df)

        # Prever
        predicao = self.model.predict(X)[0]
        probabilidade = self.model.predict_proba(X)[0][1]

        return {
            "sucesso": bool(predicao),
            "probabilidade": float(probabilidade),
        }

        # Calcular confiança
        diff_from_half = abs(probabilidade - 0.5)
        if diff_from_half > 0.3:
            resultado["confianca"] = "Alta"
        elif diff_from_half > 0.15:
            resultado["confianca"] = "Média"
        else:
            resultado["confianca"] = "Baixa"

        return resultado


# Script principal
if __name__ == "__main__":
    print("\n🤖 TREINAMENTO - PREDITOR DE SUCESSO PROCESSUAL")
    print("=" * 60)

    # Criar preditor
    predictor = SuccessPredictor()

    # Gerar dados sintéticos
    df = predictor.gerar_dados_sinteticos(n_samples=2000)

    # Treinar
    metricas = predictor.treinar(df)

    # Salvar
    predictor.salvar_modelo()

    # Teste de predição
    print("\n🧪 TESTANDO PREDIÇÃO...")
    print("-" * 60)

    caso_teste = {
        "tipo_acao": "Trabalhista",
        "tribunal": "TRT2",
        "instancia": "1ª Instância",
        "valor_causa": 50000,
        "complexidade": 5,
        "prazo_meses": 12,
        "tem_precedente": 1,
        "advogado_experiencia": 10,
        "num_testemunhas": 3,
        "provas_documentais": 8,
    }

    resultado = predictor.prever(caso_teste)

    print(f"Caso de teste: Ação Trabalhista no TRT2")
    print(f"Predição: {'✅ SUCESSO' if resultado['sucesso'] else '❌ INSUCESSO'}")
    print(f"Probabilidade: {resultado['probabilidade']:.1%}")
    print(f"Confiança: {resultado['confianca']}")
    print("=" * 60)
    print("\n✅ Modelo treinado e pronto para uso!")
