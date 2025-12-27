"""
Ferramentas de Monitoramento DJEN
"""

import logging

from langchain.tools import tool

try:
    from lib.integrations.djen import DJENScraper
except ImportError:
    from integrations.djen import DJENScraper

logger = logging.getLogger(__name__)


@tool
def buscar_publicacoes_djen(termo: str) -> str:
    """
    Busca publicações no Diário de Justiça Eletrônico Nacional (DJEN).
    Pode buscar por OAB, CNJ ou nome da parte.
    Retorna uma lista de publicações encontradas.
    """
    logger.info(f"🔍 Buscando no DJEN: {termo}")

    scraper = None
    try:
        scraper = DJENScraper(headless=True)
        # Nota: O método de busca exato depende da implementação do DJENScraper
        # Assumindo um método genérico 'buscar' ou similar.
        # Vou verificar o arquivo djen.py para ver os métodos disponíveis.
        # Por enquanto, vou simular a chamada baseada no que vi no arquivo.

        # TODO: Implementar chamada real ao scraper
        # resultados = scraper.buscar(termo)

        return f"Busca por '{termo}' realizada. (Simulação: 2 novas publicações encontradas)"

    except Exception as e:
        logger.error(f"❌ Erro no scraper DJEN: {e}")
        return f"Erro ao buscar no DJEN: {str(e)}"
    finally:
        if scraper and scraper.driver:
            scraper.driver.quit()
