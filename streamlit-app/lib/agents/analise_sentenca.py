"""Agente Análise de Sentença"""

import logging
from typing import Any, Dict, Optional

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class AnaliseSentencaAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="analise-sentenca",
            name="Análise de Sentença",
            role="Especialista em análise de decisões judiciais",
            capabilities=["sentence-analysis", "nlp", "outcome-detection"],
        )

    async def execute(
        self, task: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            system_prompt = f"Você é {self.name}, {self.role}. Forneça análise profissional e detalhada."
            messages = [("system", system_prompt), ("human", f"Tarefa: {task}")]
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
