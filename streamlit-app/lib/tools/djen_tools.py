"""Ferramentas DJEN (API pública do CNJ).

Essas tools são feitas para uso por agentes e por jobs agendados.
Retornam JSON (string) com dados enxutos para evitar respostas gigantes.
"""

import json
import logging
from typing import Any, Dict, List, Optional

from langchain_core.tools import tool

try:
    from integrations.djen_api_client import DJENAPIClient
except ImportError:  # fallback quando importado como pacote completo
    from lib.integrations.djen_api_client import DJENAPIClient

logger = logging.getLogger(__name__)


def _pub_to_dict(pub: Any, lawyer: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    texto = getattr(pub, "texto", "") or ""

    payload: Dict[str, Any] = {
        "id": getattr(pub, "id", ""),
        "tribunal": getattr(pub, "sigla_tribunal", ""),
        "tipo": getattr(pub, "tipo_comunicacao", ""),
        "orgao": getattr(pub, "nome_orgao", ""),
        "numeroProcesso": getattr(pub, "numero_processo", ""),
        "dataDisponibilizacao": getattr(pub, "data_disponibilizacao", ""),
        "dataPublicacao": getattr(pub, "data_publicacao", ""),
        "teor": texto[:2000],
        "meio": getattr(pub, "meio", ""),
        "link": getattr(pub, "link", None),
    }

    if lawyer:
        payload["lawyerId"] = lawyer.get("id")
        payload["lawyerName"] = lawyer.get("name")
        payload["oab"] = lawyer.get("oab")

    return payload


@tool
def buscar_publicacoes_djen_por_oab(
    numero_oab: str,
    uf_oab: str,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
) -> str:
    """Busca publicações DJEN para uma OAB/UF no período.

    Args:
        numero_oab: somente dígitos (ex: "184404")
        uf_oab: UF (ex: "MG")
        data_inicio: AAAA-MM-DD (opcional)
        data_fim: AAAA-MM-DD (opcional)

    Returns:
        JSON string: {"count": int, "items": [..]}
    """
    client = DJENAPIClient()

    pubs = client.buscar_publicacoes(
        numero_oab=numero_oab,
        uf_oab=uf_oab,
        data_inicio=data_inicio,
        data_fim=data_fim,
    )

    data = {"count": len(pubs), "items": [_pub_to_dict(p) for p in pubs]}
    return json.dumps(data, ensure_ascii=False)


@tool
def buscar_publicacoes_djen_multiplos_advogados(
    advogados: List[Dict[str, Any]],
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
) -> str:
    """Busca publicações DJEN para múltiplos advogados (cada item deve ter campo 'oab' no formato 'NUM/UF').

    Returns:
        JSON string: {"count": int, "items": [..]}
    """
    client = DJENAPIClient()

    all_items: List[Dict[str, Any]] = []

    for lawyer in advogados:
        oab_value = lawyer.get("oab")
        if not isinstance(oab_value, str):
            continue

        parts = oab_value.replace("/", " ").split()
        if len(parts) < 2:
            continue

        numero_oab = parts[0]
        uf_oab = parts[1]

        try:
            pubs = client.buscar_publicacoes(
                numero_oab=numero_oab,
                uf_oab=uf_oab,
                data_inicio=data_inicio,
                data_fim=data_fim,
            )
            for pub in pubs:
                all_items.append(_pub_to_dict(pub, lawyer=lawyer))
        except Exception as e:
            logger.warning(f"⚠️ Falha ao buscar DJEN {oab_value}: {e}")
            continue

    data = {"count": len(all_items), "items": all_items}
    return json.dumps(data, ensure_ascii=False)
