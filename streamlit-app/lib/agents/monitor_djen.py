"""Agente Monitor DJEN"""

import logging
from typing import Any, Dict, Optional

from langchain.tools import tool

try:
    from lib.tools.djen_tools import buscar_publicacoes_djen
except ImportError:
    from tools.djen_tools import buscar_publicacoes_djen

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

        self.tools = [buscar_publicacoes_djen]

    async def execute(
        self, task: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        try:
            # Se a tarefa for genérica "monitorar", usar termos padrão
            if task.lower() in ["monitorar", "verificar publicações"]:
                task = "Buscar publicações para OAB 12345/AL e nome 'Thiago Bodevan'"

            system_prompt = f"""Você é {self.name}, {self.role}.

            Sua função é monitorar o Diário de Justiça Eletrônico Nacional (DJEN) em busca de novas publicações.
            Use a ferramenta 'buscar_publicacoes_djen' para verificar se há novidades.

            Se encontrar publicações, analise-as brevemente e relate.
            """

            messages = [("system", system_prompt), ("human", f"Tarefa: {task}")]

            # Usar bind_tools se disponível ou ReAct agent
            # Simplificando para chamada direta via LLM com tools (function calling)
            # Mas como estamos usando ainvoke direto no BaseAgent, vamos adaptar para usar as tools no prompt
            # ou usar um AgentExecutor como no JustineAgent.

            # Para manter consistência com JustineAgent (que é mais avançado):
            from langchain.agents import AgentExecutor, create_react_agent
            from langchain.prompts import PromptTemplate

            prompt_template = PromptTemplate.from_template(
                system_prompt
                + "\n\n{tools}\n\nUse as ferramentas para cumprir a tarefa: {input}\n\n{agent_scratchpad}"
            )

            agent = create_react_agent(self.llm, self.tools, prompt_template)
            agent_executor = AgentExecutor(
                agent=agent, tools=self.tools, verbose=True, handle_parsing_errors=True
            )

            result = await agent_executor.ainvoke({"input": task})

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": result["output"],
                "status": "completed",
                "confidence": 0.90,
            }
        except Exception as e:
            logger.error(f"❌ Erro: {e}")
            return {"agentId": self.agent_id, "response": str(e), "status": "failed"}
