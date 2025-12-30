"""BaseAgent - LangChain Integration"""

import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

# Carregar .env
load_dotenv()

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.0-flash-exp"


class _GenAIResponseAdapter:
    """Adapter para respostas do Google GenAI SDK"""

    def __init__(self, raw_response):
        self._raw = raw_response

    @property
    def text(self) -> str:
        if hasattr(self._raw, "text"):
            return getattr(self._raw, "text") or ""
        return str(self._raw)


class _GenAIModelAdapter:
    """Adapter para modelo do Google GenAI SDK"""

    def __init__(self, client, model_name: str):
        self._client = client
        self._model_name = model_name

    def generate_content(self, contents, **kwargs):
        raw = self._client.models.generate_content(
            model=self._model_name,
            contents=contents,
            **kwargs,
        )
        return _GenAIResponseAdapter(raw)


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

        # API key pode vir como GEMINI_API_KEY (padrão do projeto) ou GOOGLE_API_KEY (padrão LangChain)
        # Em produção (Render), normalmente não existe .env; só variáveis de ambiente do processo.
        self._api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self._llm = None
        self.model = None
        self._genai_client = None

        if not self._api_key:
            logger.warning(
                "⚠️ API key do Gemini não encontrada (GEMINI_API_KEY/GOOGLE_API_KEY) "
                f"para agente {self.name}. LLM será inicializado apenas quando necessário."
            )

        logger.info(f"✅ {self.name} pronto")

    def _init_llm_if_needed(self) -> None:
        if self._llm is not None:
            return

        if not self._api_key:
            raise ValueError(
                "API key requerida para Gemini. Defina GEMINI_API_KEY ou GOOGLE_API_KEY nas variáveis de ambiente."
            )

        self._llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=self._api_key,
            temperature=0.7,
            convert_system_message_to_human=True,  # Fix para Gemini
        )

        # Manter compatibilidade com agentes legados (que usam self.model.generate_content)
        # Projeto padronizado no SDK novo (google-genai).
        from google import genai as google_genai  # type: ignore

        self._genai_client = google_genai.Client(api_key=self._api_key)
        self.model = _GenAIModelAdapter(self._genai_client, MODEL_NAME)

    @property
    def llm(self):
        self._init_llm_if_needed()
        return self._llm

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
