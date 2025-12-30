import logging
import os
from typing import Any, Dict, List

from qdrant_client import QdrantClient
from qdrant_client.http import models

logger = logging.getLogger(__name__)


class QdrantService:
    """Serviço de integração com Qdrant Vector DB."""

    def __init__(self):
        self.url = os.getenv("QDRANT_URL")
        self.api_key = os.getenv("QDRANT_API_KEY")
        self.collection_name = "jurisprudencia"
        self.client = None

        if not self.url or not self.api_key:
            raise ValueError(
                "QdrantService: QDRANT_URL e QDRANT_API_KEY são obrigatórios e não foram encontrados."
            )

        try:
            self.client = QdrantClient(url=self.url, api_key=self.api_key)
            logger.info("✅ QdrantService: Conectado")
        except Exception as e:
            logger.error(f"❌ QdrantService: Erro de conexão: {e}")
            raise

    def upsert(self, documents: List[Dict[str, Any]]):
        """
        Insere ou atualiza documentos no Qdrant.

        Args:
            documents: Lista de dicionários com 'content' e 'metadata'
        """
        if not self.client:
            logger.warning("⚠️ Qdrant não configurado. Ignorando upsert.")
            return

        try:
            import uuid

            from qdrant_client.http import models

            points = []
            for doc in documents:
                content = doc.get("content", "")
                metadata = doc.get("metadata", {})

                # Gerar ID se não existir
                doc_id = str(uuid.uuid4())

                # TODO: Gerar embeddings reais
                # Por enquanto, vetor aleatório ou zero para manter compatibilidade
                # Em produção, usar self.encoder.encode(content)
                vector = [0.0] * 768

                points.append(
                    models.PointStruct(
                        id=doc_id,
                        vector=vector,
                        payload={"content": content, **metadata},
                    )
                )

            self.client.upsert(collection_name=self.collection_name, points=points)
            logger.info(f"✅ {len(points)} documentos inseridos no Qdrant")

        except Exception as e:
            logger.error(f"❌ Erro ao inserir no Qdrant: {e}")

    def search(self, query_text: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Busca semântica no Qdrant."""
        if not self.client:
            return [{"error": "Qdrant não configurado"}]

        try:
            # Nota: Em produção, precisaríamos gerar embeddings para o query_text aqui
            # Como não temos o encoder configurado neste snippet, assumimos que o Qdrant
            # pode ter suporte a busca híbrida ou usamos um encoder local.
            # Para simplificar, vamos simular ou usar busca textual se suportado,
            # ou retornar erro se não tivermos embeddings.

            # TODO: Integrar com serviço de Embeddings (Gemini ou OpenAI)
            # embeddings = gemini_service.embed(query_text)

            return [{"info": "Busca vetorial requer serviço de embeddings configurado"}]

            # Exemplo de busca real (comentado):
            # results = self.client.search(
            #     collection_name=self.collection_name,
            #     query_vector=embeddings,
            #     limit=limit
            # )
            # return [r.payload for r in results]

        except Exception as e:
            logger.error(f"Erro na busca Qdrant: {e}")
            return []

    def is_available(self) -> bool:
        return self.client is not None
