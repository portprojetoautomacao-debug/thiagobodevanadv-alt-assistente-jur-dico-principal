"""
Router Intimações.
Substitui api/intimacoes/pendente.ts
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from database import RedisClient
from fastapi import APIRouter, HTTPException
from integrations.djen_api_client import DJENAPIClient
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()


class IntimacaoPendenteResponse(BaseModel):
    ok: bool
    intimacao: Any
    timestamp: str


@router.get("/intimacoes/pendente")
@router.post("/intimacoes/pendente")
async def get_intimacao_pendente():
    """
    Retorna a próxima intimação pendente.
    Equivalente ao api/intimacoes/pendente.ts do Node.js.
    """
    try:
        # 1. Tentar buscar do cache primeiro (Redis)
        redis = RedisClient()
        cached_pubs = redis.get("publications") or []

        # Filtrar não lidas/pendentes (se houver flag, por enquanto pegamos a primeira)
        pendentes = [p for p in cached_pubs if not p.get("read", False)]

        if pendentes:
            # Retorna a mais antiga pendente (FIFO) ou a mais recente?
            # Geralmente "próxima" implica a mais urgente ou a primeira da fila.
            # Vamos retornar a primeira da lista.
            intimacao = pendentes[0]
            return {
                "ok": True,
                "intimacao": intimacao,
                "timestamp": datetime.now().isoformat(),
            }

        # 2. Se não tiver no cache, buscar na API DJEN (Fallback)
        # Usar credenciais padrão do Thiago
        client = DJENAPIClient()
        today = datetime.now()
        data_fim = today.strftime("%Y-%m-%d")
        data_inicio = (today - timedelta(days=7)).strftime("%Y-%m-%d")

        # Thiago Bodevan Veiga
        publicacoes = client.buscar_publicacoes(
            numero_oab="184404", uf_oab="MG", data_inicio=data_inicio, data_fim=data_fim
        )

        if publicacoes:
            # Converter para dict
            pub_dict = {
                "id": publicacoes[0].id,
                "teor": publicacoes[0].texto,
                "processo": publicacoes[0].numero_processo,
                "data": publicacoes[0].data_disponibilizacao,
                "tribunal": publicacoes[0].sigla_tribunal,
                "orgao": publicacoes[0].nome_orgao,
            }
            return {
                "ok": True,
                "intimacao": pub_dict,
                "timestamp": datetime.now().isoformat(),
            }

        # 3. Se não encontrar nada
        return {
            "ok": True,
            "intimacao": None,
            "timestamp": datetime.now().isoformat(),
            "message": "Nenhuma intimação pendente encontrada nos últimos 7 dias.",
        }

    except Exception as e:
        logger.error(f"Erro ao buscar intimação pendente: {e}")
        raise HTTPException(status_code=500, detail=str(e))
