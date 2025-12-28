"""Agente de Análise Documental"""

import logging
from typing import Any, Dict, Optional

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class AnaliseDocAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="analise-documental",
            name="Analisador de Documentos",
            role="Especialista em análise de documentos jurídicos",
            capabilities=["document-analysis", "entity-extraction", "classification"],
        )

    async def execute(
        self, task: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            documento = context.get("documento", "") if context else task
            system_prompt = f"Você é {self.name}, {self.role}. Analise documentos e extraia informações estruturadas."
            messages = [
                ("system", system_prompt),
                ("human", f"Documento: {documento[:2000]}\n\nTarefa: {task}"),
            ]
            response = await self.llm.ainvoke(messages)

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.content,
                "status": "completed",
                "confidence": 0.80,
            }
        except Exception as e:
            logger.error(f"❌ Erro: {e}")
            return {"agentId": self.agent_id, "response": str(e), "status": "failed"}
