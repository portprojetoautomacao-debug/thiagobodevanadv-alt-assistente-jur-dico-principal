"""
Módulo de integrações externas
Scrapers e clientes para DJEN, DataJud e PJe
"""

from .datajud import DataJudClient
from .djen import DJENScraper
from .pje import PJeScraper

__all__ = ["DJENScraper", "DataJudClient", "PJeScraper"]
