"""
Módulo de Machine Learning para análises preditivas jurídicas.

Modelos implementados:
- Predição de sucesso processual
- Classificação de tipo de ação
- Estimativa de duração de processo
- Clustering de casos similares
- Análise de sentimento de sentenças
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error
from typing import Dict, List, Any, Tuple
import pickle
import os

class LegalMLModels:
    """Modelos de Machine Learning para análises jurídicas."""

    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.model_dir = "models/"

        # Criar diretório de modelos
        os.makedirs(self.model_dir, exist_ok=True)

    # ============================================
    # 1. PREDIÇÃO DE SUCESSO PROCESSUAL
    # ============================================

    def train_success_predictor(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Treina modelo para prever probabilidade de sucesso.

        Features esperadas:
        - tipo_acao: tipo da ação judicial
        - valor_causa: valor da causa
        - tribunal: tribunal onde tramita
        - tempo_tramitacao: dias de tramitação
        - qtd_recursos: quantidade de recursos
        - experiencia_advogado: anos de experiência
        - sucesso: target (0=insucesso, 1=sucesso)
        """

        # Preparar features
        features = [
            'tipo_acao', 'valor_causa', 'tribunal',
            'tempo_tramitacao', 'qtd_recursos', 'experiencia_advogado'
        ]

        X = df[features].copy()
        y = df['sucesso']

        # Encode categóricas
        le_tipo = LabelEncoder()
        le_tribunal = LabelEncoder()

        X['tipo_acao_encoded'] = le_tipo.fit_transform(X['tipo_acao'])
        X['tribunal_encoded'] = le_tribunal.fit_transform(X['tribunal'])

        # Remover originais
        X = X.drop(['tipo_acao', 'tribunal'], axis=1)

        # Normalizar
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        # Treinar modelo
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )

        model.fit(X_train, y_train)

        # Avaliar
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        # Cross-validation
        cv_scores = cross_val_score(model, X_scaled, y, cv=5)

        # Salvar
        self.models['success_predictor'] = model
        self.scalers['success_scaler'] = scaler
        self.encoders['tipo_acao'] = le_tipo
        self.encoders['tribunal'] = le_tribunal

        self._save_model('success_predictor')

        return {
            'accuracy': accuracy,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'feature_importance': dict(zip(X.columns, model.feature_importances_))
        }

    def predict_success(self, caso: Dict[str, Any]) -> Dict[str, Any]:
        """Prediz probabilidade de sucesso de um caso."""

        if 'success_predictor' not in self.models:
            self._load_model('success_predictor')

        model = self.models['success_predictor']
        scaler = self.scalers['success_scaler']

        # Preparar input
        features = pd.DataFrame([{
            'valor_causa': caso.get('valor_causa', 0),
            'tempo_tramitacao': caso.get('tempo_tramitacao', 0),
            'qtd_recursos': caso.get('qtd_recursos', 0),
            'experiencia_advogado': caso.get('experiencia_advogado', 5),
            'tipo_acao_encoded': self.encoders['tipo_acao'].transform([caso.get('tipo_acao', 'Cível')])[0],
            'tribunal_encoded': self.encoders['tribunal'].transform([caso.get('tribunal', 'TJSP')])[0]
        }])

        # Predizer
        X_scaled = scaler.transform(features)
        probabilidade = model.predict_proba(X_scaled)[0]

        return {
            'probabilidade_sucesso': float(probabilidade[1]),
            'probabilidade_insucesso': float(probabilidade[0]),
            'predicao': 'sucesso' if probabilidade[1] > 0.5 else 'insucesso',
            'confianca': float(max(probabilidade))
        }

    # ============================================
    # 2. ESTIMATIVA DE DURAÇÃO
    # ============================================

    def train_duration_estimator(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Treina modelo para estimar duração de processo.

        Features:
        - tipo_acao, tribunal, complexidade, qtd_partes
        Target: duracao_dias
        """

        features = ['tipo_acao', 'tribunal', 'complexidade', 'qtd_partes', 'valor_causa']
        X = df[features].copy()
        y = df['duracao_dias']

        # Encode categóricas
        for col in ['tipo_acao', 'tribunal', 'complexidade']:
            le = LabelEncoder()
            X[f'{col}_encoded'] = le.fit_transform(X[col])
            self.encoders[f'duration_{col}'] = le
            X = X.drop(col, axis=1)

        # Normalizar
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Split
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        # Treinar
        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )

        model.fit(X_train, y_train)

        # Avaliar
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)

        self.models['duration_estimator'] = model
        self.scalers['duration_scaler'] = scaler

        self._save_model('duration_estimator')

        return {
            'mae_days': mae,
            'mae_months': mae / 30
        }

    def estimate_duration(self, caso: Dict[str, Any]) -> Dict[str, Any]:
        """Estima duração de um processo."""

        if 'duration_estimator' not in self.models:
            self._load_model('duration_estimator')

        model = self.models['duration_estimator']
        scaler = self.scalers['duration_scaler']

        # Preparar input
        features = pd.DataFrame([{
            'qtd_partes': caso.get('qtd_partes', 2),
            'valor_causa': caso.get('valor_causa', 0),
            'tipo_acao_encoded': self.encoders['duration_tipo_acao'].transform([caso.get('tipo_acao', 'Cível')])[0],
            'tribunal_encoded': self.encoders['duration_tribunal'].transform([caso.get('tribunal', 'TJSP')])[0],
            'complexidade_encoded': self.encoders['duration_complexidade'].transform([caso.get('complexidade', 'média')])[0]
        }])

        # Predizer
        X_scaled = scaler.transform(features)
        duracao_dias = model.predict(X_scaled)[0]

        return {
            'duracao_estimada_dias': int(duracao_dias),
            'duracao_estimada_meses': round(duracao_dias / 30, 1),
            'duracao_estimada_anos': round(duracao_dias / 365, 2)
        }

    # ============================================
    # 3. CLUSTERING DE CASOS SIMILARES
    # ============================================

    def train_case_clustering(self, df: pd.DataFrame, n_clusters: int = 5) -> Dict[str, Any]:
        """
        Agrupa casos similares usando K-Means.
        """

        features = ['valor_causa', 'tempo_tramitacao', 'qtd_recursos', 'experiencia_advogado']
        X = df[features]

        # Normalizar
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Treinar K-Means
        model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = model.fit_predict(X_scaled)

        self.models['clustering'] = model
        self.scalers['clustering_scaler'] = scaler

        self._save_model('clustering')

        return {
            'n_clusters': n_clusters,
            'inertia': model.inertia_,
            'cluster_distribution': pd.Series(clusters).value_counts().to_dict()
        }

    def find_similar_cases(self, caso: Dict[str, Any], n_similar: int = 5) -> List[int]:
        """Encontra casos similares ao fornecido."""

        if 'clustering' not in self.models:
            self._load_model('clustering')

        model = self.models['clustering']
        scaler = self.scalers['clustering_scaler']

        # Preparar input
        features = pd.DataFrame([{
            'valor_causa': caso.get('valor_causa', 0),
            'tempo_tramitacao': caso.get('tempo_tramitacao', 0),
            'qtd_recursos': caso.get('qtd_recursos', 0),
            'experiencia_advogado': caso.get('experiencia_advogado', 5)
        }])

        # Predizer cluster
        X_scaled = scaler.transform(features)
        cluster = model.predict(X_scaled)[0]

        return {
            'cluster': int(cluster),
            'message': f'Este caso pertence ao cluster {cluster}'
        }

    # ============================================
    # 4. ANÁLISE DE SENTIMENTO
    # ============================================

    def analyze_sentence_sentiment(self, texto_sentenca: str) -> Dict[str, Any]:
        """
        Analisa sentimento de sentença judicial.
        Classifica como: favorável, neutro, desfavorável
        """

        # Palavras-chave (simplificado - usar NLP real em produção)
        palavras_favoraveis = [
            'procedente', 'acolher', 'deferido', 'provido', 'favorável',
            'êxito', 'sucesso', 'justo', 'razoável'
        ]

        palavras_desfavoraveis = [
            'improcedente', 'indeferido', 'negado', 'improvido', 'rejeitado',
            'inviável', 'impossível', 'sem razão'
        ]

        texto_lower = texto_sentenca.lower()

        score_favoravel = sum(1 for palavra in palavras_favoraveis if palavra in texto_lower)
        score_desfavoravel = sum(1 for palavra in palavras_desfavoraveis if palavra in texto_lower)

        if score_favoravel > score_desfavoravel:
            sentimento = 'favorável'
            confianca = min(0.9, 0.5 + (score_favoravel * 0.1))
        elif score_desfavoravel > score_favoravel:
            sentimento = 'desfavorável'
            confianca = min(0.9, 0.5 + (score_desfavoravel * 0.1))
        else:
            sentimento = 'neutro'
            confianca = 0.5

        return {
            'sentimento': sentimento,
            'confianca': confianca,
            'palavras_favoraveis_encontradas': score_favoravel,
            'palavras_desfavoraveis_encontradas': score_desfavoravel
        }

    # ============================================
    # PERSISTÊNCIA
    # ============================================

    def _save_model(self, model_name: str):
        """Salva modelo em disco."""
        try:
            with open(f"{self.model_dir}{model_name}.pkl", 'wb') as f:
                pickle.dump({
                    'model': self.models.get(model_name),
                    'scaler': self.scalers.get(f'{model_name}_scaler'),
                    'encoders': {k: v for k, v in self.encoders.items() if model_name in k}
                }, f)
        except Exception as e:
            print(f"Erro ao salvar modelo {model_name}: {e}")

    def _load_model(self, model_name: str):
        """Carrega modelo do disco."""
        try:
            with open(f"{self.model_dir}{model_name}.pkl", 'rb') as f:
                data = pickle.load(f)
                self.models[model_name] = data['model']
                if 'scaler' in data:
                    self.scalers[f'{model_name}_scaler'] = data['scaler']
                if 'encoders' in data:
                    self.encoders.update(data['encoders'])
        except FileNotFoundError:
            print(f"Modelo {model_name} não encontrado. Treine o modelo primeiro.")
        except Exception as e:
            print(f"Erro ao carregar modelo {model_name}: {e}")

    # ============================================
    # UTILITÁRIOS
    # ============================================

    def generate_sample_data(self, n_samples: int = 1000) -> pd.DataFrame:
        """Gera dados sintéticos para treinamento (demo)."""
        np.random.seed(42)

        tipos_acao = ['Trabalhista', 'Cível', 'Criminal', 'Tributária', 'Família']
        tribunais = ['TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJDF']
        complexidades = ['baixa', 'média', 'alta']

        df = pd.DataFrame({
            'tipo_acao': np.random.choice(tipos_acao, n_samples),
            'tribunal': np.random.choice(tribunais, n_samples),
            'complexidade': np.random.choice(complexidades, n_samples),
            'valor_causa': np.random.lognormal(10, 2, n_samples),
            'tempo_tramitacao': np.random.normal(365, 180, n_samples),
            'qtd_recursos': np.random.poisson(2, n_samples),
            'qtd_partes': np.random.randint(2, 10, n_samples),
            'experiencia_advogado': np.random.normal(10, 5, n_samples),
            'duracao_dias': np.random.normal(500, 200, n_samples),
            'sucesso': np.random.binomial(1, 0.6, n_samples)
        })

        # Ajustar valores negativos
        df['tempo_tramitacao'] = df['tempo_tramitacao'].clip(lower=30)
        df['experiencia_advogado'] = df['experiencia_advogado'].clip(lower=0, upper=40)
        df['duracao_dias'] = df['duracao_dias'].clip(lower=90, upper=2000)

        return df
