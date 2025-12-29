""" 
Mrs. Justin-e - Especialista em intimações e prazos
Agente LangChain REAL para análise de intimações
"""

import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict

from langchain_core.tools import tool

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


@tool
def extrair_prazo(texto: str) -> str:
    """Extrai prazo de texto de intimação"""
    # Regex para detectar prazos
    patterns = [r"(\d+)\s*dias?", r"prazo\s+de\s+(\d+)", r"no\s+prazo\s+de\s+(\d+)"]

    for pattern in patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            return f"Prazo de {match.group(1)} dias identificado"

    return "Nenhum prazo identificado"


@tool
def classificar_intimacao(texto: str) -> str:
    """Classifica tipo de intimação"""
    texto_lower = texto.lower()

    if "contestar" in texto_lower or "defesa" in texto_lower:
        return "Tipo: Contestação"
    elif "manifestar" in texto_lower:
        return "Tipo: Manifestação"
    elif "recurso" in texto_lower:
        return "Tipo: Recurso"
    else:
        return "Tipo: Genérica"


class JustineAgent(BaseAgent):
    """Mrs. Justin-e - Especialista em intimações e prazos"""

    def __init__(self):
        super().__init__(
            agent_id="justine",
            name="Mrs. Justin-e",
            role="Especialista em intimações e prazos",
            capabilities=[
                "intimation-analysis",
                "deadline-identification",
                "task-generation",
                "priority-assessment",
            ],
        )

        # Tools específicas
        self.tools = [extrair_prazo, classificar_intimacao]

        # Prompt otimizado
        self.prompt = """Você é Mrs. Justin-e, especialista em intimações e prazos processuais.

Seu papel: Análise automática de intimações, identificação de prazos, geração de tarefas.

Características:
- Precisão em identificar prazos
- Classificação correta de intimações
- Priorização inteligente
- Criação de tarefas claras
"""

    async def execute(
        self, task: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Analisa intimação e identifica prazos.

        Args:
            task: Texto da intimação
            context: Processo relacionado, etc

        Returns:
            Análise da intimação com prazos identificados
        """
        try:
            logger.info(f"📋 Justin-e analisando intimação")

            # Executar ferramentas localmente
            prazo_result = extrair_prazo.invoke({"texto": task})
            tipo_result = classificar_intimacao.invoke({"texto": task})

            # Construir prompt com resultados das ferramentas
            messages = [
                ("system", self.prompt),
                ("human", f"""Análise da intimação:

Texto: {task}

Resultados das ferramentas:
- {prazo_result}
- {tipo_result}

Forneça uma análise completa desta intimação, incluindo:
1. Tipo de intimação identificado
2. Prazo identificado (se houver)
3. Urgência
4. Ações recomendadas
"""),
            ]

            response = await self.llm.ainvoke(messages)

            logger.info(f"✅ Justin-e concluiu análise")

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.content,
                "status": "completed",
                "confidence": 0.90,
                "metadata": {
                    "prazo": prazo_result,
                    "tipo": tipo_result,
                    "hasDeadline": "prazo" in task.lower(),
                    "isUrgent": "urgente" in task.lower(),
                },
            }

        except Exception as e:
            logger.error(f"❌ Justin-e falhou: {str(e)}")
            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": f"Erro na análise: {str(e)}",
                "status": "failed",
                "error": str(e),
            }
