""" 
Mrs. Justin-e - Especialista em intimações e prazos
Agente LangChain REAL para análise de intimações
"""

import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from langchain_core.messages import ToolMessage
from langchain_core.tools import tool

from .base_agent import BaseAgent

try:
    from tools.djen_tools import buscar_publicacoes_djen_multiplos_advogados
except ImportError:
    # Fallback para contexto em que `tools` não está na path
    from lib.tools.djen_tools import buscar_publicacoes_djen_multiplos_advogados

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

        # Tool DJEN (API pública) para uso em rotinas agendadas
        self.djen_tool = buscar_publicacoes_djen_multiplos_advogados

        # Prompt otimizado
        self.prompt = """Você é Mrs. Justin-e, especialista em intimações e prazos processuais.

Seu papel: Análise automática de intimações, identificação de prazos, geração de tarefas.

Características:
- Precisão em identificar prazos
- Classificação correta de intimações
- Priorização inteligente
- Criação de tarefas claras
"""

    async def _run_with_tool_calling(self, task: str):
        llm_with_tools = self.llm.bind_tools(self.tools)

        messages = [
            ("system", self.prompt),
            (
                "human",
                f"""Analise a intimação abaixo.

Texto: {task}

Objetivo:
1) Identificar o tipo de intimação
2) Identificar prazo (se houver)
3) Avaliar urgência
4) Recomendar ações

Use as ferramentas disponíveis quando for útil.
""",
            ),
        ]

        response = await llm_with_tools.ainvoke(messages)

        max_steps = 4
        steps = 0

        while getattr(response, "tool_calls", None) and steps < max_steps:
            steps += 1

            for tool_call in response.tool_calls:
                tool_name = tool_call.get("name")
                tool_args = tool_call.get("args") or {}
                tool_call_id = tool_call.get("id")

                tool_fn = next(
                    (t for t in self.tools if getattr(t, "name", None) == tool_name),
                    None,
                )

                if tool_fn is None:
                    tool_result = f"Tool não encontrada: {tool_name}"
                else:
                    try:
                        tool_result = tool_fn.invoke(tool_args)
                    except Exception as te:
                        tool_result = f"Erro ao executar tool '{tool_name}': {te}"

                messages.append(response)
                messages.append(
                    ToolMessage(
                        content=str(tool_result),
                        tool_call_id=tool_call_id,
                    )
                )

            response = await llm_with_tools.ainvoke(messages)

        return response, steps

    def coletar_publicacoes_djen_diarias(
        self,
        lawyers: list[dict],
        data_inicio: str,
        data_fim: str,
    ) -> list[dict]:
        """Coleta publicações DJEN (API pública) para uma lista de advogados.

        Observação: aqui chamamos a Tool diretamente (sem LLM) para reduzir custo e ser determinístico.
        """

        raw = self.djen_tool.invoke(
            {
                "advogados": lawyers or [],
                "data_inicio": data_inicio,
                "data_fim": data_fim,
            }
        )

        if not isinstance(raw, str):
            return []

        try:
            data = json.loads(raw)
        except Exception:
            return []

        if not isinstance(data, dict):
            return []

        items = data.get("items")
        if not isinstance(items, list):
            return []

        return [it for it in items if isinstance(it, dict)]

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
            logger.info("📋 Justin-e analisando intimação")

            response, steps = await self._run_with_tool_calling(task)

            # Fallback: se o modelo não usou tools, manter o comportamento antigo (manual)
            prazo_result: Optional[str] = None
            tipo_result: Optional[str] = None

            if not getattr(response, "tool_calls", None) and steps == 0:
                prazo_result = extrair_prazo.invoke({"texto": task})
                tipo_result = classificar_intimacao.invoke({"texto": task})

            # Metadados: se tools foram chamadas, tentamos inferir pela execução manual
            # (mantemos simples: o texto final do modelo já incorporará os resultados)

            logger.info("✅ Justin-e concluiu análise")

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.content,
                "status": "completed",
                "confidence": 0.90,
                "metadata": {
                    "prazo": prazo_result or "-",
                    "tipo": tipo_result or "-",
                    "hasDeadline": "prazo" in task.lower(),
                    "isUrgent": "urgente" in task.lower(),
                    "toolCalling": True,
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
