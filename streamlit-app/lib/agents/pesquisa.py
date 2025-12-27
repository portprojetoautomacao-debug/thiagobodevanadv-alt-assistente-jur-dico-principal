"""
Pesquisa Jurisprudencial - Pesquisador
Agente LangChain REAL para busca de precedentes
"""

import logging
from typing import Any, Dict, List

from langchain.tools import tool

try:
    from lib.tools.search_tools import (
        buscar_jurisprudencia_datajud,
        buscar_jurisprudencia_vetorial,
        buscar_stf,
        buscar_stj,
    )
except ImportError:
    from tools.search_tools import (
        buscar_jurisprudencia_datajud,
        buscar_jurisprudencia_vetorial,
        buscar_stf,
        buscar_stj,
    )

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


class PesquisaAgent(BaseAgent):
    """Pesquisador Jurisprudencial"""

    def __init__(self):
        super().__init__(
            agent_id="pesquisa-juris",
            name="Pesquisador Jurisprudencial",
            role="Especialista em busca de precedentes e jurisprudência",
            capabilities=[
                "jurisprudence-search",
                "precedent-analysis",
                "case-law-research",
                "trend-analysis",
            ],
        )

        # Tools
        self.tools = [
            buscar_stf,
            buscar_stj,
            buscar_jurisprudencia_vetorial,
            buscar_jurisprudencia_datajud,
        ]

        # Prompt
        self.prompt = """Você é um Pesquisador Jurisprudencial especializado.

Seu papel: Busca e análise de precedentes relevantes.

Características:
- Pesquisa abrangente em tribunais superiores
- Identificação de precedentes relevantes
- Análise de tendências jurisprudenciais
- Síntese clara de jurisprudência
"""

    async def execute(
        self, task: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Pesquisa precedentes"""
        try:
            logger.info(f"🔍 Pesquisador buscando precedentes")

            # 1. Executar ferramentas
            stf_result = buscar_stf.invoke({"termo": task})
            stj_result = buscar_stj.invoke({"termo": task})
            vetorial_result = buscar_jurisprudencia_vetorial.invoke({"termo": task})

            # 2. Construir prompt (não usado diretamente, mas útil para debug)
            # full_prompt = ...

            # 3. Gerar resposta
            messages = [
                ("system", self.prompt),
                (
                    "human",
                    f"Resultados da pesquisa:\nSTF: {stf_result}\nSTJ: {stj_result}\nQdrant: {vetorial_result}\n\nTarefa: {task}\n\nAnalise os precedentes encontrados e forneça uma síntese jurisprudencial.",
                ),
            ]
            response = await self.llm.ainvoke(messages)

            logger.info(f"✅ Pesquisa concluída")

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.content,
                "status": "completed",
                "confidence": 0.82,
            }

        except Exception as e:
            logger.error(f"❌ Pesquisa falhou: {str(e)}")
            return {
                "agentId": self.agent_id,
                "response": f"Erro: {str(e)}",
                "status": "failed",
                "error": str(e),
            }
