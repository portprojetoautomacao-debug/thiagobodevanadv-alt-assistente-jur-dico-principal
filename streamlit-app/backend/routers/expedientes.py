"""
Router Expedientes.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import RedisClient
from datetime import datetime

router = APIRouter()

# Modelo
class Expediente(BaseModel):
    id: Optional[str] = None
    tipo: str
    processo_id: Optional[str] = None
    conteudo: str
    data: Optional[str] = None
    processado: bool = False

# Endpoints
@router.get("/expedientes")
async def get_expedientes():
    """Lista todos os expedientes."""

    redis = RedisClient()
    expedientes = redis.get("expedientes") or []

    return {"expedientes": expedientes, "total": len(expedientes)}

@router.post("/expedientes")
async def create_expediente(expediente: Expediente):
    """Cria novo expediente."""

    redis = RedisClient()

    # Gerar ID
    if not expediente.id:
        import uuid
        expediente.id = f"exp-{uuid.uuid4().hex[:8]}"

    # Data atual
    if not expediente.data:
        expediente.data = datetime.now().isoformat()

    # Buscar lista existente
    expedientes = redis.get("expedientes") or []

    # Adicionar novo
    expedientes.append(expediente.dict())

    # Salvar
    redis.set("expedientes", expedientes)

    return {"success": True, "expediente": expediente.dict()}

@router.get("/expedientes/{expediente_id}")
async def get_expediente(expediente_id: str):
    """Busca expediente por ID."""

    redis = RedisClient()
    expedientes = redis.get("expedientes") or []

    for exp in expedientes:
        if exp.get("id") == expediente_id:
            return exp

    raise HTTPException(status_code=404, detail="Expediente not found")
