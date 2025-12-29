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

        assert predictor.model is not None
        assert predictor.is_trained is False
        assert len(predictor.feature_names) == 7

    def test_gerar_dados_sinteticos(self):
        """Testar geração de dados sintéticos"""
        predictor = SuccessPredictor()
        df = predictor.gerar_dados_sinteticos(n_samples=100)

        assert isinstance(df, pd.DataFrame)
        assert len(df) == 100
        assert "sucesso" in df.columns
        assert all(col in df.columns for col in predictor.feature_names)

    def test_treinar_modelo(self):
        """Testar treinamento do modelo"""
        predictor = SuccessPredictor(n_estimators=50)
        df = predictor.gerar_dados_sinteticos(n_samples=200)

        metrics = predictor.treinar(df, test_size=0.2)

        assert predictor.is_trained is True
        assert "accuracy" in metrics
        assert "cv_scores_mean" in metrics
        assert metrics["accuracy"] > 0.5  # Melhor que chance
        assert metrics["cv_scores_mean"] > 0.5

    def test_prever_caso(self, caso_teste_basico):
        """Testar predição de um caso"""
        predictor = SuccessPredictor(n_estimators=50)
        df = predictor.gerar_dados_sinteticos(n_samples=200)
        predictor.treinar(df)

        resultado = predictor.prever(caso_teste_basico)

        assert "sucesso" in resultado
        assert "probabilidade_sucesso" in resultado
        assert "probabilidade_insucesso" in resultado
        assert "confianca" in resultado
        assert 0 <= resultado["probabilidade_sucesso"] <= 1
        assert resultado["confianca"] in ["alta", "média", "baixa"]

    def test_prever_sem_treinar(self, caso_teste_basico):
        """Testar predição sem treinar deve falhar"""
        predictor = SuccessPredictor()

        with pytest.raises(ValueError, match="não foi treinado"):
            predictor.prever(caso_teste_basico)

    def test_salvar_carregar(self, tmp_path):
        """Testar salvar e carregar modelo"""
        predictor = SuccessPredictor(n_estimators=50)
        df = predictor.gerar_dados_sinteticos(n_samples=200)
        predictor.treinar(df)

        # Salvar
        filepath = tmp_path / "test_predictor.pkl"
        predictor.salvar(str(filepath))

        assert filepath.exists()

        # Carregar
        predictor2 = SuccessPredictor.carregar(str(filepath))

        assert predictor2.is_trained is True
        assert len(predictor2.encoders) == len(predictor.encoders)

    def test_prever_com_dados_faltando(self):
        """Testar predição com dados faltando"""
        predictor = SuccessPredictor(n_estimators=50)
        df = predictor.gerar_dados_sinteticos(n_samples=200)
        predictor.treinar(df)

        # Caso incompleto
        caso_incompleto = {"tipo_acao": "Trabalhista", "valor_causa": 50000}

        resultado = predictor.prever(caso_incompleto)

        # Deve preencher valores padrão e retornar predição
        assert "probabilidade_sucesso" in resultado
