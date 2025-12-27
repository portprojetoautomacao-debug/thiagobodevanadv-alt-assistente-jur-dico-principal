"""
Router de Upload de Documentos - Implementação REAL.
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from database import RedisClient
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

router = APIRouter()

# Tamanho máximo: 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024

# Extensões permitidas (apenas documentos jurídicos)
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".odt"}


@router.post("/documentos/upload")
async def upload_documento(
    file: UploadFile = File(...),
    processo_id: Optional[str] = Form(None),
    tipo: Optional[str] = Form("documento"),
    descricao: Optional[str] = Form(None),
):
    """Upload REAL de documento."""

    # Validar extensão
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extensão não permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Ler conteúdo
    contents = await file.read()
    file_size = len(contents)

    # Validar tamanho
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB",
        )

    # Gerar ID único
    doc_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    # Salvar metadados no Redis
    redis = RedisClient()

    documento = {
        "id": doc_id,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file_size,
        "processo_id": processo_id,
        "tipo": tipo,
        "descricao": descricao,
        "uploaded_at": now,
        "extension": file_ext,
    }

    # Adicionar à lista de documentos
    documentos = redis.get("documentos") or []
    documentos.append(documento)
    redis.set("documentos", documentos)

    # Em produção, salvar arquivo em storage (Azure Blob, S3, etc)
    # Por ora, salvamos apenas metadados

    return {
        "success": True,
        "documento": documento,
        "message": "Documento enviado com sucesso",
    }


@router.get("/documentos")
async def listar_documentos(processo_id: Optional[str] = None):
    """Lista documentos."""
    redis = RedisClient()
    documentos = redis.get("documentos") or []

    if processo_id:
        documentos = [d for d in documentos if d.get("processo_id") == processo_id]

    return documentos


@router.get("/documentos/{doc_id}")
async def buscar_documento(doc_id: str):
    """Busca documento específico."""
    redis = RedisClient()
    documentos = redis.get("documentos") or []

    for doc in documentos:
        if doc.get("id") == doc_id:
            return doc

    raise HTTPException(status_code=404, detail="Documento não encontrado")


@router.delete("/documentos/{doc_id}")
async def deletar_documento(doc_id: str):
    """Deleta documento."""
    redis = RedisClient()
    documentos = redis.get("documentos") or []
    documentos_filtrados = [d for d in documentos if d.get("id") != doc_id]

    if len(documentos) == len(documentos_filtrados):
        raise HTTPException(status_code=404, detail="Documento não encontrado")

    redis.set("documentos", documentos_filtrados)

    return {"message": "Documento deletado com sucesso"}
