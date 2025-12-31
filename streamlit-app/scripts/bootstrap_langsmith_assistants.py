#!/usr/bin/env python3
"""
Bootstrap de assistants do LangSmith alinhados ao app.

Cria (ou versiona) assistants para os grafos `legal_hybrid` e `legal_assistant`
com contexto/metadata compatíveis com o Assistente Jurídico. Rode uma vez e
copie os `assistant_id` exibidos para usar no Studio ou no seu app.
"""

import asyncio
import os
from typing import Any, Dict, List

from langgraph_sdk import get_client


LANGSMITH_URL = (
    os.getenv("LANGSMITH_ENDPOINT")
    or os.getenv("LANGCHAIN_ENDPOINT")
    or "https://api.smith.langchain.com"
)


def _get_api_key() -> str:
    """Obtém API key do LangSmith das variáveis mais comuns."""
    return os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY") or ""


def _build_base_context() -> Dict[str, Any]:
    """Contexto padrão herdado do app (temperatura, projeto, limites)."""
    return {
        "project": os.getenv("LANGSMITH_PROJECT")
        or os.getenv("LANGCHAIN_PROJECT")
        or "assistente-juridico-dev",
        "temperature": float(os.getenv("MODEL_TEMPERATURE", "0.3")),
        "max_tokens": int(os.getenv("MAX_COMPLETION_TOKENS", "2000")),
        "workflow_mode": "auto",
    }


async def _create_assistants() -> List[Dict[str, Any]]:
    api_key = _get_api_key()
    if not api_key:
        raise SystemExit(
            "Defina LANGSMITH_API_KEY ou LANGCHAIN_API_KEY antes de rodar o script."
        )

    client = get_client(url=LANGSMITH_URL, api_key=api_key)
    base_context = _build_base_context()
    metadata = {
        "app": "assistente-juridico",
        "source": "bootstrap_langsmith_assistants.py",
    }

    configs = [
        {
            "graph_id": "legal_hybrid",
            "name": "Assistente Jurídico Híbrido",
            "context": {
                **base_context,
                "entrypoint": "legal_hybrid",
                "capabilities": ["tools", "workflows", "routing"],
            },
        },
        {
            "graph_id": "legal_assistant",
            "name": "Assistente Jurídico Clássico",
            "context": {
                **base_context,
                "entrypoint": "legal_assistant",
                "capabilities": ["orchestrator"],
            },
        },
    ]

    created: List[Dict[str, Any]] = []

    for cfg in configs:
        assistant = await client.assistants.create(
            cfg["graph_id"],
            name=cfg["name"],
            context=cfg["context"],
            metadata=metadata,
        )

        print(
            f"✅ {cfg['graph_id']} -> {assistant['assistant_id']} "
            f"(versão {assistant.get('version', '?')})"
        )
        created.append(assistant)

    return created


def main():
    asyncio.run(_create_assistants())


if __name__ == "__main__":
    main()
