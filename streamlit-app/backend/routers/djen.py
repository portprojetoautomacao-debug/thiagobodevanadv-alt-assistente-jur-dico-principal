"""
Router DJEN API.
"""

import logging
import re
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import uuid4

from database import RedisClient
from fastapi import APIRouter, HTTPException
from integrations.djen_api_client import DJENAPIClient
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

# Constantes
KV_KEYS = {
    "PUBLICATIONS": "publications",
    "LAST_SYNC": "last-djen-sync",
    "LAST_CHECK": "last-djen-check",
    "MONITORED_LAWYERS": "monitored-lawyers",
    "PUBLICATION_HASHES": "publication-hashes",
}


def parse_oab(oab: str) -> Dict[str, str]:
    """Extrai número e UF da OAB."""
    if not oab or len(oab) > 50:
        return {}

    # Tenta formato "123456/UF" ou "123456 UF"
    match = re.search(r"(?P<numero>\d+)\s?[/-]?\s?(?P<uf>[A-Z]{2})", oab, re.IGNORECASE)
    if match:
        return {"numero": match.group("numero"), "uf": match.group("uf").upper()}

    # Tenta apenas números
    match_num = re.search(r"^\d+$", oab)
    if match_num:
        return {"numero": match_num.group(0)}

    return {}


def create_publication(item: Any, lawyer: Dict[str, Any]) -> Dict[str, Any]:
    """Cria objeto de publicação padronizado."""
    # Gerar hash único se não existir
    pub_hash = (
        getattr(item, "hash", None)
        or f"{item.sigla_tribunal}-{item.data_disponibilizacao}-{item.numero_processo}"
    )

    return {
        "id": str(uuid4()),
        "djenId": getattr(item, "id", None),
        "tribunal": item.sigla_tribunal,
        "data": item.data_disponibilizacao,
        "tipo": getattr(item, "tipo_comunicacao", "Intimação"),
        "teor": (item.texto or "")[:2000],
        "numeroProcesso": item.numero_processo,
        "orgao": item.nome_orgao,
        "meio": getattr(item, "meio", "D"),
        "link": getattr(item, "link", ""),
        "hash": pub_hash,
        "matchType": "oab",
        "lawyerId": lawyer.get("id"),
        "lawyerName": lawyer.get("name"),
        "lawyerOAB": lawyer.get("oab"),
        "advogados": [
            {
                "nome": d.nome,
                "numero_oab": getattr(d, "numero_oab", ""),
                "uf_oab": getattr(d, "uf_oab", ""),
            }
            for d in getattr(item, "destinatarios", [])
            if hasattr(d, "nome")
        ],
        "notified": False,
        "createdAt": datetime.now().isoformat(),
    }


class DJENFetchRequest(BaseModel):
    data_disponibilizacao: str
    numero_oab: str
    uf_oab: str


@router.post("/djen/fetch")
async def djen_fetch(request: DJENFetchRequest):
    """Busca publicações na API do DJEN e salva no Redis."""
    try:
        redis = RedisClient()
        client = DJENAPIClient()

        # Buscar publicações
        publicacoes_raw = client.buscar_publicacoes(
            numero_oab=request.numero_oab,
            uf_oab=request.uf_oab,
            data_inicio=request.data_disponibilizacao,
            data_fim=request.data_disponibilizacao,
        )

        # Carregar publicações existentes e hashes
        existing_pubs = redis.get(KV_KEYS["PUBLICATIONS"]) or []
        existing_hashes = redis.get(KV_KEYS["PUBLICATION_HASHES"]) or set()

        if isinstance(existing_hashes, list):
            existing_hashes = set(existing_hashes)

        new_count = 0
        publicacoes_formatadas = []

        # Processar cada publicação
        for p in publicacoes_raw:
            # Gerar hash único
            pub_hash = (
                f"{p.sigla_tribunal}-{p.data_disponibilizacao}-{p.numero_processo}"
            )

            # Verificar duplicata
            if pub_hash in existing_hashes:
                continue

            # Criar publicação formatada
            pub_data = {
                "id": str(uuid4()),
                "djenId": p.id,
                "tribunal": p.sigla_tribunal,
                "data": p.data_disponibilizacao,
                "tipo": p.tipo_comunicacao,
                "teor": (p.texto or "")[:2000],
                "numeroProcesso": p.numero_processo,
                "orgao": p.nome_orgao,
                "link": p.link,
                "hash": pub_hash,
                "advogados": [
                    {
                        "nome": adv.nome,
                        "numero_oab": adv.numero_oab,
                        "uf_oab": adv.uf_oab,
                    }
                    for adv in p.advogados
                ],
                "notified": False,
                "createdAt": datetime.now().isoformat(),
            }

            # Adicionar aos resultados
            publicacoes_formatadas.append(pub_data)
            existing_pubs.insert(0, pub_data)
            existing_hashes.add(pub_hash)
            new_count += 1

        # Salvar no Redis (limite 1000 publicações)
        if new_count > 0:
            redis.set(KV_KEYS["PUBLICATIONS"], existing_pubs[:1000])
            redis.set(KV_KEYS["PUBLICATION_HASHES"], list(existing_hashes))
            redis.set(KV_KEYS["LAST_CHECK"], datetime.now().isoformat())

        return {
            "success": True,
            "quantidade": len(publicacoes_raw),
            "novas": new_count,
            "publicacoes": [
                {
                    "id": p.id,
                    "processo": p.numero_processo,
                    "texto": p.texto[:200] + "...",
                    "data": p.data_disponibilizacao,
                }
                for p in publicacoes_raw
            ],
        }
    except Exception as e:
        logger.error(f"Erro na API DJEN: {e}")
        return {"success": False, "error": str(e)}


class DJENSyncRequest(BaseModel):
    source: str = "manual"
    processos: Optional[List[dict]] = None
    expedientes: Optional[List[dict]] = None


@router.post("/djen/sync")
@router.post("/djen/sincronizar")  # Português
async def djen_sync_trigger(request: Optional[DJENSyncRequest] = None):
    """
    Sincroniza dados do DJEN para advogados monitorados.
    Portado do Vercel/Node.js para Python.
    """
    try:
        # Request pode ser None se não enviado
        if request is None:
            request = DJENSyncRequest()

        redis = RedisClient()
        client = DJENAPIClient()

        # 1. Buscar advogados monitorados
        lawyers = redis.get(KV_KEYS["MONITORED_LAWYERS"]) or []
        enabled_lawyers = [l for l in lawyers if l.get("enabled", True)]

        is_fallback = False
        if not enabled_lawyers:
            # Configuração padrão fixa: Thiago Bodevan Veiga
            enabled_lawyers = [
                {
                    "id": "thiago-bodevan",
                    "name": "Thiago Bodevan Veiga",
                    "oab": "184404/MG",
                    "enabled": True,
                }
            ]

        # 2. Configurar datas (últimos 7 dias)
        today = datetime.now()
        data_fim = today.strftime("%Y-%m-%d")
        data_inicio = (today - timedelta(days=7)).strftime("%Y-%m-%d")

        # 3. Carregar publicações existentes para deduplicação
        existing_pubs = redis.get(KV_KEYS["PUBLICATIONS"]) or []
        existing_hashes = {
            p.get("hash")
            or f"{p.get('tribunal')}-{p.get('data')}-{p.get('numeroProcesso')}"
            for p in existing_pubs
        }

        total_pubs = 0
        new_pubs_count = 0
        errors = []

        # 4. Iterar advogados
        for lawyer in enabled_lawyers:
            try:
                oab_info = parse_oab(lawyer.get("oab", ""))
                if not oab_info.get("numero"):
                    logger.warning(
                        f"OAB inválida para {lawyer.get('name')}: {lawyer.get('oab')}"
                    )
                    continue

                # Buscar na API
                publicacoes = client.buscar_publicacoes(
                    numero_oab=oab_info["numero"],
                    uf_oab=oab_info.get("uf", "MG"),  # Default MG se não tiver UF
                    data_inicio=data_inicio,
                    data_fim=data_fim,
                )

                total_pubs += len(publicacoes)

                # Processar e deduplicar
                for item in publicacoes:
                    # Gerar hash para verificação
                    pub_hash = f"{item.sigla_tribunal}-{item.data_disponibilizacao}-{item.numero_processo}"

                    if pub_hash in existing_hashes:
                        continue

                    # Criar nova publicação
                    new_pub = create_publication(item, lawyer)
                    existing_pubs.insert(0, new_pub)  # Adicionar no início
                    existing_hashes.add(pub_hash)
                    new_pubs_count += 1

                # Rate limit sleep
                await asyncio.sleep(0.5)

            except Exception as e:
                error_msg = f"Erro ao processar {lawyer.get('name')}: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)

        # 5. Salvar no Redis (limite 1000)
        if new_pubs_count > 0:
            redis.set(KV_KEYS["PUBLICATIONS"], existing_pubs[:1000])

        # Atualizar timestamp
        now_iso = datetime.now().isoformat()
        redis.set(KV_KEYS["LAST_SYNC"], now_iso)
        redis.set(KV_KEYS["LAST_CHECK"], now_iso)

        message = f"Sincronização concluída. {new_pubs_count} novas publicações."
        if is_fallback:
            message += " (Configuração Padrão: Thiago Bodevan Veiga)"

        return {
            "success": True,
            "message": message,
            "stats": {
                "lawyers_checked": len(enabled_lawyers),
                "total_found": total_pubs,
                "new_saved": new_pubs_count,
                "errors": errors,
                "is_fallback": is_fallback,
            },
        }

    except Exception as e:
        logger.error(f"Erro crítico no sync DJEN: {e}")
        return {"success": False, "error": str(e)}


class DJENCheckRequest(BaseModel):
    mode: Optional[str] = None
    tribunais: Optional[List[str]] = ["TJMG", "TRT3", "TST", "STJ"]
    oab: Optional[str] = "184404"
    ufOab: Optional[str] = "MG"
    lawyerName: Optional[str] = "Thiago Bodevan Veiga"


@router.post("/djen/check")
async def djen_check(request: DJENCheckRequest):
    """
    Verifica publicações no DJEN (Endpoint de compatibilidade).
    Suporta mode='next-pending' para retornar apenas a próxima pendência.
    """
    try:
        client = DJENAPIClient()

        # Se mode for next-pending, delegar para lógica simplificada
        if request.mode == "next-pending":
            # Buscar últimos 7 dias
            today = datetime.now()
            data_fim = today.strftime("%Y-%m-%d")
            data_inicio = (today - timedelta(days=7)).strftime("%Y-%m-%d")

            publicacoes = client.buscar_publicacoes(
                numero_oab=request.oab,
                uf_oab=request.ufOab,
                data_inicio=data_inicio,
                data_fim=data_fim,
            )

            if publicacoes:
                # Retornar a primeira encontrada
                p = publicacoes[0]
                return {
                    "ok": True,
                    "intimacao": {
                        "id": p.id,
                        "teor": p.texto,
                        "processo": p.numero_processo,
                        "data": p.data_disponibilizacao,
                        "tribunal": p.sigla_tribunal,
                        "orgao": p.nome_orgao,
                    },
                    "timestamp": datetime.now().isoformat(),
                }
            else:
                return {
                    "ok": True,
                    "intimacao": None,
                    "timestamp": datetime.now().isoformat(),
                }

        # Modo padrão: Retornar lista completa (compatível com Node.js handleDJENCheck)
        # Buscar apenas hoje por padrão se não especificado datas (mas aqui usamos 7 dias para garantir)
        today = datetime.now()
        data_fim = today.strftime("%Y-%m-%d")
        data_inicio = today.strftime("%Y-%m-%d")  # Apenas hoje para check rápido

        publicacoes = client.buscar_publicacoes(
            numero_oab=request.oab,
            uf_oab=request.ufOab,
            data_inicio=data_inicio,
            data_fim=data_fim,
        )

        # Formatar resultados
        resultados = []
        # Agrupar por tribunal (simplificado)
        tribunais_map = {}

        for p in publicacoes:
            if p.sigla_tribunal not in tribunais_map:
                tribunais_map[p.sigla_tribunal] = {
                    "tribunal": p.sigla_tribunal,
                    "publicacoes": [],
                }

            tribunais_map[p.sigla_tribunal]["publicacoes"].append(
                {
                    "id": str(p.id),
                    "data": p.data_disponibilizacao,
                    "processo": p.numero_processo,
                    "tipo": p.tipo_comunicacao,
                    "conteudo": p.texto,
                    "link": p.link,
                }
            )

        resultados = list(tribunais_map.values())

        return {
            "ok": True,
            "timestamp": datetime.now().isoformat(),
            "tribunaisConsultados": len(request.tribunais or []),
            "publicacoesEncontradas": len(publicacoes),
            "resultados": resultados,
            "erros": [],
        }

    except Exception as e:
        logger.error(f"Erro no endpoint djen/check: {e}")
        return {"ok": False, "error": str(e)}
