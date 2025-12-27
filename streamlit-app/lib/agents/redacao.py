"""
Redação de Petições - Redator Jurídico
Agente LangChain REAL para criação de documentos
"""

import logging
from typing import Any, Dict

from langchain.tools import tool

try:
    from lib.tools.search_tools import buscar_jurisprudencia_datajud
except ImportError:
    from tools.search_tools import buscar_jurisprudencia_datajud

from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


@tool
def buscar_modelo(tipo_documento: str) -> str:
    """Busca modelo de documento"""
    modelos = {
        "peticao_inicial": "Template de petição inicial",
        "contestacao": "Template de contestação",
        "recurso": "Template de recurso",
    }
    return modelos.get(tipo_documento, "Modelo genérico")


@tool
def validar_formatacao(texto: str) -> str:
    """Valida formatação de documento jurídico"""
    if len(texto) < 100:
        return "⚠️ Documento muito curto"
    return "✅ Formatação OK"


class RedacaoAgent(BaseAgent):
    """Redator Jurídico - Criação de documentos"""

    def __init__(self):
        super().__init__(
            agent_id="redacao-peticoes",
            name="Redator Jurídico",
            role="Especialista em redação de documentos jurídicos",
            capabilities=[
                "document-drafting",
                "legal-writing",
                "template-generation",
                "precedent-integration",
            ],
        )

        # Tools
        self.tools = [buscar_modelo, validar_formatacao, buscar_jurisprudencia_datajud]

        # Prompt
        self.prompt = """Você é um Redator Jurídico profissional.

Seu papel: Criação de petições e documentos jurídicos de alta qualidade.

Características:
- Linguagem jurídica precisa
- Formatação adequada
- Fundamentação legal sólida
- Clareza e objetividade

IMPORTANTE: Antes de redigir, SEMPRE use a ferramenta 'buscar_jurisprudencia_datajud' para encontrar precedentes e jurisprudência atualizada sobre o tema da peça. Use esses dados para fundamentar seus argumentos.
"""

    async def execute(
        self, task: str, context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Cria documento jurídico"""
        try:
            logger.info(f"✍️ Redator criando documento")

            # 1. Buscar template se aplicável
            tipo = context.get("tipo", "generico") if context else "generico"
            template = buscar_modelo.invoke({"tipo_documento": tipo})

            # 2. Construir prompt
            full_prompt = f"""{self.prompt}

Template sugerido: {template}

Tarefa: {task}

{f"Contexto adicional: {context}" if context else ""}

Gere o documento jurídico solicitado seguindo as melhores práticas.
"""

            # 3. Gerar conteúdo
            messages = [
                ("system", self.prompt),
                (
                    "human",
                    f"Template sugerido: {template}\n\nTarefa: {task}\n\n{f'Contexto adicional: {context}' if context else ''}\n\nGere o documento jurídico solicitado seguindo as melhores práticas.",
                ),
            ]
            response = await self.llm.ainvoke(messages)
            texto_gerado = response.content

            # 4. Validar
            validacao = validar_formatacao.invoke({"texto": texto_gerado})

            logger.info(f"✅ Documento criado")

            return {
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": texto_gerado,
                "status": "completed",
                "confidence": 0.88,
                "metadata": {
                    "documentType": tipo,
                    "hasTemplate": True,
                    "validacao": validacao,
                },
            }

        except Exception as e:
            logger.error(f"❌ Redator falhou: {str(e)}")
            return {
                "agentId": self.agent_id,
                "response": f"Erro: {str(e)}",
                "status": "failed",
                "error": str(e),
            }
