"""BaseAgent - LangChain Integration"""

import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Carregar .env
load_dotenv()

logger = logging.getLogger(__name__)


class BaseAgent:
    def __init__(
        self,
        agent_id: str,
        name: str,
        role: str,
        capabilities: Optional[List[str]] = None,
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.capabilities = capabilities or []

        # Inicializar LLM via LangChain
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning(f"⚠️ GEMINI_API_KEY não encontrada para agente {self.name}")

        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            google_api_key=api_key,
            temperature=0.7,
            convert_system_message_to_human=True,  # Fix para Gemini
        )

        # Manter compatibilidade com agentes legados (que usam self.model)
        import google.generativeai as genai

        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

        logger.info(f"✅ {self.name} pronto (LangChain + Legacy)")

    async def execute(
        self, task: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        raise NotImplementedError(f"{self.agent_id} deve implementar execute()")

    def get_info(self) -> Dict[str, Any]:
        return {
            "id": self.agent_id,
            "name": self.name,
            "role": self.role,
            "capabilities": self.capabilities,
            "status": "active",
        }
