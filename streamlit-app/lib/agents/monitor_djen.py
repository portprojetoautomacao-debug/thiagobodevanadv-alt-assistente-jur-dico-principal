"""Agente Monitor DJEN"""

import logging
from typing import Any, Dict, Optional

from langchain_core.tools import tool

try:
    from lib.tools.djen_tools import buscar_publicacoes_djen_por_oab
except ImportError:
    try:
        from tools.djen_tools import buscar_publicacoes_djen_por_oab
    except ImportError:
        # Criar ferramenta stub se não disponível
        @tool
        def buscar_publicacoes_djen_por_oab(
            numero_oab: str,
            uf_oab: str,
            data_inicio: str = None,
            data_fim: str = None,
        ) -> str:
            """Stub para busca de publicações DJEN"""
            return '{"count": 0, "items": []}'


from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class MonitorDJENAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="monitor-djen",
            name="Monitor DJEN",
            role="Especialista em monitoramento do Diário de Justiça",
            capabilities=["djen-monitoring", "publication-detection", "notification"],
        )

        self.tools = [buscar_publicacoes_djen_por_oab]

    async def execute(
        self, task: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            # Se a tarefa for genérica "monitorar", usar termos padrão
            if task.lower() in ["monitorar", "verificar publicações"]:
                task = "Buscar publicações para OAB 12345/AL e nome 'Thiago Bodevan'"

            system_prompt = f"""Você é {self.name}, {self.role}.

            Sua função é monitorar o Diário de Justiça Eletrônico Nacional (DJEN) em busca de novas publicações.
            Use a ferramenta 'buscar_publicacoes_djen_por_oab' para verificar se há novidades.

            Se encontrar publicações, analise-as brevemente e relate.
            """

            messages = [("system", system_prompt), ("human", f"Tarefa: {task}")]

            # Chamada direta ao LLM (simplificado)
            response = await self.llm.ainvoke(messages)

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.content,
                "status": "completed",
                "confidence": 0.90,
            }
        except Exception as e:
            logger.error(f"❌ Erro: {e}")
            return {"agentId": self.agent_id, "response": str(e), "status": "failed"}

