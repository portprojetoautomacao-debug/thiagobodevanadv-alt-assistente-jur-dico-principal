"""
Router Processes (Processos) - Implementação REAL.
"""

import re
import uuid
from datetime import datetime
from typing import List, Optional

from database import RedisClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

router = APIRouter()


# Models Pydantic para validação REAL
class ProcessoCreate(BaseModel):
    """Schema para criação de processo."""

    numero_cnj: str = Field(..., min_length=20, max_length=30)
    titulo: str = Field(..., min_length=3, max_length=200)
    autor: str = Field(..., min_length=3, max_length=100)
    reu: str = Field(..., min_length=3, max_length=100)
    tipo: str = Field(default="civel")
    status: str = Field(default="ativo")
    valor_causa: Optional[float] = Field(None, ge=0)
    data_distribuicao: Optional[str] = None
    comarca: Optional[str] = None
    vara: Optional[str] = None

    @validator("numero_cnj")
    def validar_numero_cnj(cls, v):
        """Validar formato CNJ real."""
        # Formato: 0000000-00.0000.0.00.0000
        pattern = r"^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$"
        if not re.match(pattern, v):
            raise ValueError("Número CNJ inválido. Formato: 0000000-00.0000.0.00.0000")
        return v


class ProcessoResponse(ProcessoCreate):
    """Schema de resposta."""

    id: str
    created_at: str
    updated_at: str


# Endpoints REAIS
@router.get("/processos")
async def listar_processos():
    """Lista todos os processos REAIS do Redis."""
    redis = RedisClient()

    # Buscar do Redis
    processos_json = redis.get("processos")

    if processos_json is None:
        return []

    # Já é lista de dicts
    return processos_json if isinstance(processos_json, list) else []


@router.post("/processos", status_code=201)
async def criar_processo(processo: ProcessoCreate):
    """Cria processo REAL no Redis."""
    redis = RedisClient()

    # Gerar ID único
    processo_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    # Criar objeto completo
    processo_dict = processo.dict()
    processo_dict.update({"id": processo_id, "created_at": now, "updated_at": now})

    # Buscar lista atual
    processos = redis.get("processos") or []

    # Adicionar novo
    processos.append(processo_dict)

    # Salvar no Redis
    redis.set("processos", processos)

    return processo_dict


@router.get("/processos/{processo_id}")
async def buscar_processo(processo_id: str):
    """Busca processo específico."""
    redis = RedisClient()

    processos = redis.get("processos") or []

    for proc in processos:
        if proc.get("id") == processo_id or proc.get("numero_cnj") == processo_id:
            return proc

    raise HTTPException(status_code=404, detail="Processo não encontrado")


@router.put("/processos/{processo_id}")
async def atualizar_processo(processo_id: str, processo: ProcessoCreate):
    """Atualiza processo existente."""
    redis = RedisClient()

    processos = redis.get("processos") or []
    updated = False

    for i, proc in enumerate(processos):
        if proc.get("id") == processo_id:
            # Atualizar mantendo id e created_at
            processo_dict = processo.dict()
            processo_dict["id"] = proc["id"]
            processo_dict["created_at"] = proc["created_at"]
            processo_dict["updated_at"] = datetime.now().isoformat()

            processos[i] = processo_dict
            updated = True
            break

    if not updated:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    redis.set("processos", processos)

    return processos[i]


@router.delete("/processos/{processo_id}")
async def deletar_processo(processo_id: str):
    """Deleta processo."""
    redis = RedisClient()

    processos = redis.get("processos") or []
    processos_filtrados = [p for p in processos if p.get("id") != processo_id]

    if len(processos) == len(processos_filtrados):
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    redis.set("processos", processos_filtrados)

    return {"message": "Processo deletado com sucesso"}
