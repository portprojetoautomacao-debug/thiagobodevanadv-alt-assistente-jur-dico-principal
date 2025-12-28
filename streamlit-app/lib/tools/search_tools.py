"""
Ferramentas de Busca Jurídica
Compartilhadas entre agentes (Pesquisa, Redação, etc)
"""

import logging

from langchain.tools import tool

try:
    from lib.integrations.datajud_client import DataJudClient
    from lib.integrations.qdrant_service import QdrantService
except ImportError:
    from integrations.datajud_client import DataJudClient
    from integrations.qdrant_service import QdrantService

logger = logging.getLogger(__name__)

# Inicializar serviços (Singleton pattern implícito pelo módulo)
qdrant_service = QdrantService()
datajud_client = DataJudClient()


@tool
def buscar_stf(termo: str) -> str:
    """Busca precedentes no STF"""
    # TODO: Implementar busca real
    return f"Precedentes STF sobre: {termo}"


@tool
def buscar_stj(termo: str) -> str:
    """Busca precedentes no STJ"""
    # TODO: Implementar busca real
    return f"Precedentes STJ sobre: {termo}"


@tool
def buscar_jurisprudencia_vetorial(termo: str) -> str:
    """Busca jurisprudência usando busca semântica vetorial (Qdrant)"""
    if not qdrant_service.is_available():
        return "Busca vetorial indisponível (Qdrant não configurado)"

    resultados = qdrant_service.search(termo)
    if not resultados:
        return "Nenhum resultado encontrado na base vetorial."

    return str(resultados)


@tool
def buscar_jurisprudencia_datajud(termo: str) -> str:
    """
    Busca processos/jurisprudência no DataJud (CNJ) e popula automaticamente a base vetorial (Qdrant).
    Use esta ferramenta para buscar novos precedentes e enriquecer a base de conhecimento.
    """
    logger.info(f"🔍 Buscando no DataJud: {termo}")

    # 1. Buscar no DataJud
    processos = datajud_client.buscar_processos(assunto=termo, limit=10)

    if not processos:
        return "Nenhum processo encontrado no DataJud para este termo."

    # 2. Preparar documentos para Qdrant
    documents = []
    for proc in processos:
        # Criar conteúdo textual rico para embedding
        content = f"""
        Processo: {proc.get('numero')}
        Tribunal: {proc.get('tribunal')}
        Classe: {proc.get('classe')}
        Assuntos: {', '.join(proc.get('assuntos', []))}
        Órgão Julgador: {proc.get('orgao_julgador')}
        """

        documents.append(
            {
                "content": content.strip(),
                "metadata": {
                    "source": "datajud",
                    "numero_processo": proc.get("numero"),
                    "tribunal": proc.get("tribunal"),
                    "data_coleta": "2025-12-27",  # TODO: Usar data atual dinâmica
                },
            }
        )

    # 3. Popular Qdrant (Upsert)
    if qdrant_service.is_available():
        logger.info(
            f"💾 Populando Qdrant com {len(documents)} novos documentos do DataJud"
        )
        qdrant_service.upsert(documents)
    else:
        logger.warning(
            "⚠️ Qdrant indisponível. Resultados não foram salvos na base vetorial."
        )

    return str(processos)
