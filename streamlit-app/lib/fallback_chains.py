"""
Fallback Chain System - Alta Disponibilidade para LLMs.

Implementa fallback automático entre modelos para garantir resiliência.
"""

import logging
import os
from typing import List, Optional, Dict, Any

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable

logger = logging.getLogger(__name__)


class FallbackConfig:
    """Configuração de fallback para modelos."""

    # Modelos primários (mais rápidos/baratos)
    PRIMARY_MODELS = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
    ]

    # Modelos de fallback (mais robustos)
    FALLBACK_MODELS = [
        "gemini-1.5-pro",
        "gemini-1.0-pro",
    ]

    # Configurações por tipo de tarefa
    TASK_CONFIGS = {
        "analysis": {
            "primary": "gemini-2.0-flash-exp",
            "fallbacks": ["gemini-1.5-pro", "gemini-1.5-flash"],
            "temperature": 0.3,
        },
        "generation": {
            "primary": "gemini-2.0-flash-exp",
            "fallbacks": ["gemini-1.5-flash", "gemini-1.0-pro"],
            "temperature": 0.7,
        },
        "structured": {
            "primary": "gemini-1.5-pro",
            "fallbacks": ["gemini-2.0-flash-exp", "gemini-1.5-flash"],
            "temperature": 0.1,
        },
    }


class FallbackChainBuilder:
    """
    Construtor de chains com fallback automático.

    Features:
    - Múltiplos modelos de backup
    - Configuração por tipo de tarefa
    - Logging de fallbacks
    - Métricas de uso
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        enable_metrics: bool = True
    ):
        """
        Args:
            api_key: API key do Google (ou usa GEMINI_API_KEY/GOOGLE_API_KEY)
            enable_metrics: Habilitar coleta de métricas
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.enable_metrics = enable_metrics

        if not self.api_key:
            raise ValueError(
                "API key requerida. Defina GEMINI_API_KEY ou GOOGLE_API_KEY"
            )

        self._metrics = {
            "primary_success": 0,
            "fallback_used": 0,
            "total_requests": 0,
            "fallbacks_by_model": {}
        }

    def create_llm_with_fallbacks(
        self,
        primary_model: str = "gemini-2.0-flash-exp",
        fallback_models: Optional[List[str]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> Runnable:
        """
        Cria LLM com fallbacks configurados.

        Args:
            primary_model: Modelo primário
            fallback_models: Lista de modelos de fallback
            temperature: Temperatura para geração
            max_tokens: Máximo de tokens
            **kwargs: Argumentos adicionais para ChatGoogleGenerativeAI

        Returns:
            Runnable com fallbacks configurados
        """
        fallback_models = fallback_models or FallbackConfig.FALLBACK_MODELS

        # Criar modelo primário
        primary = ChatGoogleGenerativeAI(
            model=primary_model,
            google_api_key=self.api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
            convert_system_message_to_human=True,
            **kwargs
        )

        logger.info(f"🎯 Modelo primário: {primary_model}")

        # Criar modelos de fallback
        fallbacks = []
        for fb_model in fallback_models:
            try:
                fb_llm = ChatGoogleGenerativeAI(
                    model=fb_model,
                    google_api_key=self.api_key,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    convert_system_message_to_human=True,
                    **kwargs
                )
                fallbacks.append(fb_llm)
                logger.info(f"🔄 Fallback configurado: {fb_model}")
            except Exception as e:
                logger.warning(f"⚠️ Não foi possível configurar fallback {fb_model}: {e}")

        if not fallbacks:
            logger.warning("⚠️ Nenhum fallback disponível, usando apenas modelo primário")
            return primary

        # Configurar fallbacks com callback
        llm_with_fallbacks = primary.with_fallbacks(
            fallbacks,
            exceptions_to_handle=(Exception,),
        )

        logger.info(f"✅ Chain com {len(fallbacks)} fallbacks criada")

        return llm_with_fallbacks

    def create_for_task(
        self,
        task_type: str = "generation",
        **kwargs
    ) -> Runnable:
        """
        Cria LLM otimizado para tipo de tarefa.

        Args:
            task_type: Tipo de tarefa (analysis, generation, structured)
            **kwargs: Argumentos adicionais

        Returns:
            LLM configurado para a tarefa
        """
        config = FallbackConfig.TASK_CONFIGS.get(
            task_type,
            FallbackConfig.TASK_CONFIGS["generation"]
        )

        logger.info(f"🎯 Criando LLM para tarefa: {task_type}")

        return self.create_llm_with_fallbacks(
            primary_model=config["primary"],
            fallback_models=config["fallbacks"],
            temperature=config["temperature"],
            **kwargs
        )

    def create_multi_provider_fallback(
        self,
        providers: List[Dict[str, Any]]
    ) -> Runnable:
        """
        Cria fallback entre múltiplos provedores (ex: Google → OpenAI).

        Args:
            providers: Lista de configs de provedores

        Example:
            providers = [
                {"type": "google", "model": "gemini-2.0-flash-exp"},
                {"type": "openai", "model": "gpt-4o-mini"},
            ]
        """
        llms = []

        for provider_config in providers:
            try:
                provider_type = provider_config.get("type", "google")
                model = provider_config.get("model")

                if provider_type == "google":
                    llm = ChatGoogleGenerativeAI(
                        model=model,
                        google_api_key=self.api_key,
                        temperature=provider_config.get("temperature", 0.7),
                        convert_system_message_to_human=True
                    )
                    llms.append(llm)
                    logger.info(f"✅ Google provider: {model}")

                elif provider_type == "openai":
                    from langchain_openai import ChatOpenAI
                    openai_key = os.getenv("OPENAI_API_KEY")

                    if openai_key:
                        llm = ChatOpenAI(
                            model=model,
                            api_key=openai_key,
                            temperature=provider_config.get("temperature", 0.7)
                        )
                        llms.append(llm)
                        logger.info(f"✅ OpenAI provider: {model}")
                    else:
                        logger.warning("⚠️ OPENAI_API_KEY não encontrada")

            except Exception as e:
                logger.warning(f"⚠️ Erro ao configurar provider {provider_type}: {e}")

        if not llms:
            raise ValueError("Nenhum provider configurado com sucesso")

        if len(llms) == 1:
            return llms[0]

        # Configurar fallback chain
        primary = llms[0]
        fallbacks = llms[1:]

        return primary.with_fallbacks(
            fallbacks,
            exceptions_to_handle=(Exception,)
        )

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas de uso dos fallbacks."""
        if not self.enable_metrics:
            return {"metrics_disabled": True}

        total = self._metrics["total_requests"]
        fallback_rate = (
            self._metrics["fallback_used"] / total
            if total > 0 else 0
        )

        return {
            **self._metrics,
            "fallback_rate": fallback_rate
        }


# Convenience functions

def create_resilient_llm(
    primary_model: str = "gemini-2.0-flash-exp",
    fallback_models: Optional[List[str]] = None,
    temperature: float = 0.7
) -> Runnable:
    """
    Helper para criar LLM resiliente rapidamente.

    Usage:
        llm = create_resilient_llm()
        response = await llm.ainvoke("Hello")
    """
    builder = FallbackChainBuilder()
    return builder.create_llm_with_fallbacks(
        primary_model=primary_model,
        fallback_models=fallback_models,
        temperature=temperature
    )


def create_task_optimized_llm(task_type: str = "generation") -> Runnable:
    """
    Helper para criar LLM otimizado para tarefa.

    Usage:
        llm = create_task_optimized_llm("analysis")
        result = await llm.ainvoke(messages)
    """
    builder = FallbackChainBuilder()
    return builder.create_for_task(task_type)


# Example configurations

ANALYSIS_LLM_CONFIG = {
    "primary_model": "gemini-2.0-flash-exp",
    "fallback_models": ["gemini-1.5-pro", "gemini-1.5-flash"],
    "temperature": 0.3,
}

GENERATION_LLM_CONFIG = {
    "primary_model": "gemini-2.0-flash-exp",
    "fallback_models": ["gemini-1.5-flash", "gemini-1.0-pro"],
    "temperature": 0.7,
}

STRUCTURED_LLM_CONFIG = {
    "primary_model": "gemini-1.5-pro",
    "fallback_models": ["gemini-2.0-flash-exp"],
    "temperature": 0.1,
}
