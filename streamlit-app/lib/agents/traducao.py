"""Agente Tradutor Jurídico"""

import logging
from typing import Any, Dict, Optional

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class TraducaoJuridicaAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="traducao-juridica",
            name="Tradutor Jurídico",
            role="Especialista em tradução de termos técnicos",
            capabilities=["legal-translation", "term-explanation", "glossary-creation"],
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
