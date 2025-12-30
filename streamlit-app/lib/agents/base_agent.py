"""BaseAgent - LangChain Integration with Advanced Features"""

import logging
import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import RunnableRetry

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
        enable_fallback: bool = True,
        fallback_models: Optional[List[str]] = None,
    ):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.capabilities = capabilities or []
        self.enable_fallback = enable_fallback
        self.fallback_models = fallback_models or ["gemini-1.5-flash", "gemini-1.5-pro"]

        # API key pode vir como GEMINI_API_KEY (padrão do projeto) ou GOOGLE_API_KEY (padrão LangChain)
        # Em produção (Render), normalmente não existe .env; só variáveis de ambiente do processo.
        self._api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self._llm = None
        self._llm_with_fallback = None
        self.model = None
        self._genai_client = None

        if not self._api_key:
            logger.warning(
                "⚠️ API key do Gemini não encontrada (GEMINI_API_KEY/GOOGLE_API_KEY) "
                f"para agente {self.name}. LLM será inicializado apenas quando necessário."
            )

        logger.info(f"✅ {self.name} pronto (fallback: {enable_fallback})")

    def _init_llm_if_needed(self) -> None:
        if self._llm is not None:
            return

        if not self._api_key:
            raise ValueError(
                "API key requerida para Gemini. Defina GEMINI_API_KEY ou GOOGLE_API_KEY nas variáveis de ambiente."
            )

        base_llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=self._api_key,
            temperature=0.7,
            convert_system_message_to_human=True,  # Fix para Gemini
        )

        # Adicionar retry com exponential backoff
        llm_with_retry = base_llm.with_retry(
            retry_if_exception_type=(Exception,),
            wait_exponential_jitter=True,
            stop_after_attempt=3,
            retry_error_callback=self._on_retry_error,
        )

        # Adicionar fallback se habilitado
        if self.enable_fallback and self.fallback_models:
            fallback_llms = []
            for fb_model in self.fallback_models:
                try:
                    fb_llm = ChatGoogleGenerativeAI(
                        model=fb_model,
                        google_api_key=self._api_key,
                        temperature=0.7,
                        convert_system_message_to_human=True,
                    )
                    fallback_llms.append(fb_llm)
                except Exception as e:
                    logger.warning(f"⚠️ Não foi possível configurar fallback {fb_model}: {e}")

            if fallback_llms:
                self._llm = llm_with_retry.with_fallbacks(
                    fallback_llms,
                    exceptions_to_handle=(Exception,)
                )
                logger.info(f"✅ Fallback configurado com {len(fallback_llms)} modelos")
            else:
                self._llm = llm_with_retry
        else:
            self._llm = llm_with_retry

        # Manter compatibilidade com agentes legados (que usam self.model.generate_content)
        # Projeto padronizado no SDK novo (google-genai).
        from google import genai as google_genai  # type: ignore

        self._genai_client = google_genai.Client(api_key=self._api_key)
        self.model = _GenAIModelAdapter(self._genai_client, MODEL_NAME)

    def _on_retry_error(self, retry_state) -> None:
        """Callback executado em cada retry."""
        attempt = retry_state.attempt_number
        exception = retry_state.outcome.exception() if retry_state.outcome else None
        logger.warning(
            f"⚠️ Retry {attempt} para {self.name}: {exception}"
        )

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
