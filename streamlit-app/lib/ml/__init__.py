"""
Módulo de Machine Learning
Modelos preditivos para análise jurídica
"""

from .clustering import ProcessClusterer
from .duration_estimator import DurationEstimator
from .predictor import SuccessPredictor
from .sentiment import SentimentAnalyzer

__all__ = [
    "SuccessPredictor",
    "DurationEstimator",
    "ProcessClusterer",
    "SentimentAnalyzer",
]
