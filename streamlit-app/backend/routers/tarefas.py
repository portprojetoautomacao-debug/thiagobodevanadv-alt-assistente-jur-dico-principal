"""
Router de Tarefas - Implementação REAL.
"""

import uuid
from datetime import datetime
from typing import Optional

from database import RedisClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

# Constantes
TAREFA_NOT_FOUND = "Tarefa não encontrada"


# Models
class TarefaCreate(BaseModel):
    """Schema para criação de tarefa."""

    titulo: str = Field(..., min_length=3, max_length=200)
    descricao: Optional[str] = None
    processo_id: Optional[str] = None
    prazo: Optional[str] = None  # ISO datetime
    prioridade: str = Field(default="media")  # baixa, media, alta, urgente
    status: str = Field(default="pendente")  # pendente, em_andamento, concluida
    tipo: Optional[str] = None  # manifestacao, peticao, recurso, etc


# Endpoints
@router.get("/tarefas")
async def listar_tarefas():
    """Lista todas as tarefas."""
    redis = RedisClient()
    tarefas = redis.get("tarefas") or []
    return tarefas


@router.post("/tarefas", status_code=201)
async def criar_tarefa(tarefa: TarefaCreate):
    """Cria tarefa REAL."""
    redis = RedisClient()

    tarefa_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    tarefa_dict = tarefa.dict()
    tarefa_dict.update(
        {
            "id": tarefa_id,
            "created_at": now,
            "updated_at": now,
            "completed_at": None,
        }
    )

    tarefas = redis.get("tarefas") or []
    tarefas.append(tarefa_dict)
    redis.set("tarefas", tarefas)

    return tarefa_dict


@router.get("/tarefas/{tarefa_id}")
async def buscar_tarefa(tarefa_id: str):
    """Busca tarefa específica."""
    redis = RedisClient()
    tarefas = redis.get("tarefas") or []

    for tarefa in tarefas:
        if tarefa.get("id") == tarefa_id:
            return tarefa

    raise HTTPException(status_code=404, detail=TAREFA_NOT_FOUND)


@router.patch("/tarefas/{tarefa_id}")
async def atualizar_status_tarefa(tarefa_id: str, status: str):
    """Atualiza status da tarefa."""
    redis = RedisClient()
    tarefas = redis.get("tarefas") or []

    for i, tarefa in enumerate(tarefas):
        if tarefa.get("id") == tarefa_id:
            tarefas[i]["status"] = status
            tarefas[i]["updated_at"] = datetime.now().isoformat()

            if status == "concluida":
                tarefas[i]["completed_at"] = datetime.now().isoformat()

            redis.set("tarefas", tarefas)
            return tarefas[i]

    raise HTTPException(status_code=404, detail=TAREFA_NOT_FOUND)


@router.delete("/tarefas/{tarefa_id}")
async def deletar_tarefa(tarefa_id: str):
    """Deleta tarefa."""
    redis = RedisClient()
    tarefas = redis.get("tarefas") or []
    tarefas_filtradas = [t for t in tarefas if t.get("id") != tarefa_id]

    if len(tarefas) == len(tarefas_filtradas):
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")

    redis.set("tarefas", tarefas_filtradas)
    return {"message": "Tarefa deletada com sucesso"}
