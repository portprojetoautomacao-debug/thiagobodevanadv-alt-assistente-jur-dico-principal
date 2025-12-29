"""
Testes para Success Predictor
"""

import pandas as pd
import pytest
from ml.predictor import SuccessPredictor


class TestSuccessPredictor:
    """Testes do modelo de predição de sucesso"""

    def test_inicializacao(self):
        """Testar inicialização do modelo"""
        predictor = SuccessPredictor(n_estimators=50, random_state=42)

        assert predictor is not None
        assert predictor.model is not None

    def test_treinar_com_dados_validos(self, caso_teste_basico):
        """Testar treinamento com dados válidos"""
        predictor = SuccessPredictor(n_estimators=50, random_state=42)

        # Criar dataset de treinamento
        dados = []
        for i in range(100):
            caso = caso_teste_basico.copy()
            caso["valor_causa"] = 10000 + i * 1000
            caso["tempo_tramitacao"] = 30 + i
            dados.append(caso)

        df = pd.DataFrame(dados)
        y = [1 if i % 2 == 0 else 0 for i in range(100)]  # Labels alternados

        # Treinar modelo
        metrics = predictor.treinar(df, y)

        assert "accuracy" in metrics
        assert "precision" in metrics
        assert "recall" in metrics
        assert metrics["accuracy"] > 0.0

    def test_prever_sem_treino_falha(self, caso_teste_basico):
        """Testar predição sem treino prévio"""
        predictor = SuccessPredictor()

        # Tentar prever sem treinar deve falhar ou retornar erro
        resultado = predictor.prever(caso_teste_basico)

        # Pode retornar None ou erro dependendo da implementação
        assert resultado is None or "error" in resultado

    def test_prever_com_modelo_treinado(self, caso_teste_basico):
        """Testar predição com modelo treinado"""
        predictor = SuccessPredictor(n_estimators=50, random_state=42)

        # Treinar primeiro
        dados = []
        for i in range(100):
            caso = caso_teste_basico.copy()
            caso["valor_causa"] = 10000 + i * 1000
            dados.append(caso)

        df = pd.DataFrame(dados)
        y = [1 if i % 2 == 0 else 0 for i in range(100)]

        predictor.treinar(df, y)

        # Agora prever
        resultado = predictor.prever(caso_teste_basico)

        assert resultado is not None
        assert "probabilidade" in resultado or "prediction" in resultado

    def test_features_importantes(self, caso_teste_basico):
        """Testar extração de features importantes"""
        predictor = SuccessPredictor(n_estimators=50, random_state=42)

        # Treinar
        dados = [caso_teste_basico.copy() for _ in range(100)]
        df = pd.DataFrame(dados)
        y = [1 if i % 2 == 0 else 0 for i in range(100)]

        predictor.treinar(df, y)

        # Obter features importantes
        importancias = predictor.get_feature_importances()

        assert importancias is not None
        assert len(importancias) > 0

    def test_salvar_e_carregar_modelo(self, tmp_path, caso_teste_basico):
        """Testar salvar e carregar modelo"""
        predictor = SuccessPredictor(n_estimators=50, random_state=42)

        # Treinar
        dados = [caso_teste_basico.copy() for _ in range(100)]
        df = pd.DataFrame(dados)
        y = [1 if i % 2 == 0 else 0 for i in range(100)]

        predictor.treinar(df, y)

        # Salvar
        model_path = tmp_path / "modelo_teste.pkl"
        predictor.salvar(str(model_path))

        assert model_path.exists()

        # Carregar em novo predictor
        novo_predictor = SuccessPredictor()
        novo_predictor.carregar(str(model_path))

        # Prever com modelo carregado
        resultado = novo_predictor.prever(caso_teste_basico)

        assert resultado is not None
