"""
Process Clusterer - Agrupamento de processos similares
K-Means clustering para identificar padrões em processos judiciais
"""

import logging
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import calinski_harabasz_score, silhouette_score
from sklearn.preprocessing import LabelEncoder, StandardScaler

logger = logging.getLogger(__name__)


class ProcessClusterer:
    """
    Modelo de clustering para agrupar processos similares

    Features consideradas:
    - tipo_acao: Tipo de ação
    - valor_causa: Valor da causa
    - tempo_tramitacao: Tempo de tramitação
    - num_movimentacoes: Número de movimentações
    - complexidade: Complexidade do caso
    - tribunal: Tribunal
    - tem_sentenca: Possui sentença (bool)
    - num_partes: Número de partes

    Clusters identificados:
    - Simples e rápidos
    - Complexos e demorados
    - Alto valor
    - Padrão médio
    - Casos problemáticos
    """

    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        """
        Inicializar clusterer

        Args:
            n_clusters: Número de clusters
            random_state: Seed
        """
        self.model = KMeans(
            n_clusters=n_clusters, random_state=random_state, n_init=10, max_iter=300
        )

        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)  # Manter 95% da variância
        self.encoders = {}

        self.feature_names = [
            "tipo_acao",
            "valor_causa",
            "tempo_tramitacao",
            "num_movimentacoes",
            "complexidade",
            "tribunal",
            "tem_sentenca",
            "num_partes",
        ]

        self.cluster_names = {
            0: "Simples e Rápidos",
            1: "Complexos e Demorados",
            2: "Alto Valor",
            3: "Padrão Médio",
            4: "Casos Problemáticos",
        }

        self.is_trained = False

        logger.info(f"✅ ProcessClusterer inicializado ({n_clusters} clusters)")

    def treinar(self, df: pd.DataFrame) -> Dict:
        """
        Treinar modelo de clustering

        Args:
            df: DataFrame com features dos processos

        Returns:
            Métricas e informações dos clusters
        """
        try:
            logger.info("🎓 Treinando modelo de clustering...")

            # Validar colunas
            missing_cols = [col for col in self.feature_names if col not in df.columns]
            if missing_cols:
                raise ValueError(f"Colunas faltando: {missing_cols}")

            # Preparar features
            X = df[self.feature_names].copy()

            # Encoding categóricas
            categorical_cols = ["tipo_acao", "complexidade", "tribunal"]
            for col in categorical_cols:
                if col in X.columns:
                    self.encoders[col] = LabelEncoder()
                    X[col] = self.encoders[col].fit_transform(X[col].astype(str))

            # Scaling
            X_scaled = self.scaler.fit_transform(X)

            # PCA para redução dimensional
            X_pca = self.pca.fit_transform(X_scaled)

            logger.info(f"  PCA: {X.shape[1]} → {X_pca.shape[1]} features")

            # Treinar K-Means
            self.model.fit(X_pca)

            # Predições
            labels = self.model.labels_

            # Métricas
            silhouette = silhouette_score(X_pca, labels)
            calinski = calinski_harabasz_score(X_pca, labels)

            # Análise de clusters
            cluster_info = self._analisar_clusters(df, labels)

            self.is_trained = True

            metrics = {
                "n_clusters": self.model.n_clusters,
                "silhouette_score": silhouette,
                "calinski_harabasz_score": calinski,
                "cluster_sizes": cluster_info["sizes"],
                "cluster_centroids": self.model.cluster_centers_.tolist(),
                "pca_explained_variance": self.pca.explained_variance_ratio_.tolist(),
                "n_samples": len(df),
            }

            logger.info(f"✅ Clustering concluído!")
            logger.info(f"  Silhouette Score: {silhouette:.3f}")
            logger.info(f"  Distribuição: {cluster_info['sizes']}")

            return metrics

        except Exception as e:
            logger.error(f"❌ Erro ao treinar: {str(e)}")
            raise

    def classificar(self, caso: Dict) -> Dict:
        """
        Classificar caso em um cluster

        Args:
            caso: Dicionário com features

        Returns:
            Informações do cluster
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
            categorical_cols = ["tipo_acao", "complexidade", "tribunal"]
            for col in categorical_cols:
                if col in X.columns and col in self.encoders:
                    try:
                        X[col] = self.encoders[col].transform(X[col].astype(str))
                    except ValueError:
                        X[col] = -1

            # Scaling e PCA
            X_scaled = self.scaler.transform(X)
            X_pca = self.pca.transform(X_scaled)

            # Predição
            cluster_id = self.model.predict(X_pca)[0]
            distancias = self.model.transform(X_pca)[0]

            # Distância ao centroide do cluster
            distancia_centroide = distancias[cluster_id]

            # Cluster mais próximo alternativo
            sorted_clusters = np.argsort(distancias)
            segundo_cluster = (
                sorted_clusters[1] if len(sorted_clusters) > 1 else cluster_id
            )

            resultado = {
                "cluster_id": int(cluster_id),
                "cluster_nome": self.cluster_names.get(
                    cluster_id, f"Cluster {cluster_id}"
                ),
                "distancia_centroide": float(distancia_centroide),
                "confianca": self._calcular_confianca(distancias, cluster_id),
                "cluster_alternativo": {
                    "id": int(segundo_cluster),
                    "nome": self.cluster_names.get(
                        segundo_cluster, f"Cluster {segundo_cluster}"
                    ),
                },
            }

            logger.info(
                f"🏷️ Cluster: {resultado['cluster_nome']} (confiança: {resultado['confianca']})"
            )

            return resultado

        except Exception as e:
            logger.error(f"❌ Erro ao classificar: {str(e)}")
            raise

    def _calcular_confianca(self, distancias: np.ndarray, cluster_id: int) -> str:
        """Calcular confiança da classificação"""
        dist_cluster = distancias[cluster_id]
        dist_outras = np.delete(distancias, cluster_id)

        if len(dist_outras) == 0:
            return "alta"

        dist_segunda = np.min(dist_outras)
        ratio = dist_cluster / dist_segunda

        if ratio < 0.5:
            return "alta"
        elif ratio < 0.8:
            return "média"
        else:
            return "baixa"

    def _analisar_clusters(self, df: pd.DataFrame, labels: np.ndarray) -> Dict:
        """Analisar características de cada cluster"""
        df_analise = df.copy()
        df_analise["cluster"] = labels

        cluster_info = {"sizes": {}, "characteristics": {}}

        for cluster_id in range(self.model.n_clusters):
            cluster_data = df_analise[df_analise["cluster"] == cluster_id]

            cluster_info["sizes"][cluster_id] = len(cluster_data)

            # Características predominantes
            cluster_info["characteristics"][cluster_id] = {
                "tipo_acao_mais_comum": (
                    cluster_data["tipo_acao"].mode()[0]
                    if len(cluster_data) > 0
                    else None
                ),
                "valor_causa_medio": (
                    float(cluster_data["valor_causa"].mean())
                    if "valor_causa" in cluster_data
                    else None
                ),
                "tempo_tramitacao_medio": (
                    float(cluster_data["tempo_tramitacao"].mean())
                    if "tempo_tramitacao" in cluster_data
                    else None
                ),
            }

        return cluster_info

    def encontrar_processos_similares(
        self, caso: Dict, df_processos: pd.DataFrame, top_n: int = 5
    ) -> List[Dict]:
        """
        Encontrar processos similares ao caso

        Args:
            caso: Caso de referência
            df_processos: DataFrame com todos os processos
            top_n: Número de processos similares

        Returns:
            Lista de processos similares
        """
        try:
            # Classificar caso
            resultado = self.classificar(caso)
            cluster_id = resultado["cluster_id"]

            # Preparar todos os processos
            X_all = df_processos[self.feature_names].copy()

            # Encoding
            categorical_cols = ["tipo_acao", "complexidade", "tribunal"]
            for col in categorical_cols:
                if col in X_all.columns and col in self.encoders:
                    X_all[col] = X_all[col].map(
                        lambda x: (
                            self.encoders[col].transform([str(x)])[0]
                            if str(x) in self.encoders[col].classes_
                            else -1
                        )
                    )

            # Scaling e PCA
            X_scaled = self.scaler.transform(X_all)
            X_pca = self.pca.transform(X_scaled)

            # Predições
            labels = self.model.predict(X_pca)

            # Filtrar processos do mesmo cluster
            indices_mesmo_cluster = np.nonzero(labels == cluster_id)[0]

            if len(indices_mesmo_cluster) == 0:
                return []

            # Calcular distâncias ao caso de referência
            caso_X = pd.DataFrame([caso])[self.feature_names]
            for col in categorical_cols:
                if col in caso_X.columns and col in self.encoders:
                    try:
                        caso_X[col] = self.encoders[col].transform(
                            caso_X[col].astype(str)
                        )
                    except Exception:
                        caso_X[col] = -1

            caso_scaled = self.scaler.transform(caso_X)
            caso_pca = self.pca.transform(caso_scaled)

            # Distâncias euclidianas
            distancias = np.linalg.norm(X_pca[indices_mesmo_cluster] - caso_pca, axis=1)

            # Top N mais similares
            top_indices = indices_mesmo_cluster[np.argsort(distancias)[:top_n]]

            similares = []
            for idx in top_indices:
                processo = df_processos.iloc[idx].to_dict()
                processo["distancia"] = float(
                    distancias[np.nonzero(indices_mesmo_cluster == idx)[0][0]]
                )
                similares.append(processo)

            logger.info(f"🔍 {len(similares)} processos similares encontrados")

            return similares

        except Exception as e:
            logger.error(f"❌ Erro ao buscar similares: {str(e)}")
            return []

    def salvar(self, filepath: str = "models/process_clusterer.pkl"):
        """Salvar modelo"""
        if not self.is_trained:
            raise ValueError("Modelo não treinado!")

        try:
            Path(filepath).parent.mkdir(parents=True, exist_ok=True)

            data = {
                "model": self.model,
                "scaler": self.scaler,
                "pca": self.pca,
                "encoders": self.encoders,
                "feature_names": self.feature_names,
                "cluster_names": self.cluster_names,
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
        cls, filepath: str = "models/process_clusterer.pkl"
    ) -> "ProcessClusterer":
        """Carregar modelo"""
        try:
            with open(filepath, "rb") as f:
                data = pickle.load(f)

            clusterer = cls(n_clusters=data["model"].n_clusters)
            clusterer.model = data["model"]
            clusterer.scaler = data["scaler"]
            clusterer.pca = data["pca"]
            clusterer.encoders = data["encoders"]
            clusterer.feature_names = data["feature_names"]
            clusterer.cluster_names = data["cluster_names"]
            clusterer.is_trained = data["is_trained"]

            logger.info(f"📂 Modelo carregado: {filepath}")

            return clusterer

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
        tribunais = ["TJAL", "TRT19", "TRF5", "STJ"]
        complexidades = ["baixa", "média", "alta"]

        data = {
            "tipo_acao": np.random.choice(tipos_acao, n_samples),
            "valor_causa": np.random.lognormal(10, 2, n_samples),
            "tempo_tramitacao": np.random.randint(30, 1800, n_samples),
            "num_movimentacoes": np.random.randint(5, 100, n_samples),
            "complexidade": np.random.choice(complexidades, n_samples),
            "tribunal": np.random.choice(tribunais, n_samples),
            "tem_sentenca": np.random.choice([0, 1], n_samples),
            "num_partes": np.random.randint(2, 10, n_samples),
        }

        return pd.DataFrame(data)


# Teste
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    print("🧪 Testando Process Clusterer...\n")

    clusterer = ProcessClusterer(n_clusters=5)

    print("1️⃣ Gerando dados")
    df = clusterer.gerar_dados_sinteticos(1000)

    print("2️⃣ Treinando")
    metrics = clusterer.treinar(df)
    print(f"   Silhouette: {metrics['silhouette_score']:.3f}\n")

    print("3️⃣ Classificando caso")
    caso = {
        "tipo_acao": "Trabalhista",
        "valor_causa": 50000,
        "tempo_tramitacao": 180,
        "num_movimentacoes": 25,
        "complexidade": "média",
        "tribunal": "TRT19",
        "tem_sentenca": 0,
        "num_partes": 2,
    }

    resultado = clusterer.classificar(caso)
    print(f"   Cluster: {resultado['cluster_nome']}\n")

    print("4️⃣ Salvando")
    clusterer.salvar()

    print("\n✅ Concluído!")
