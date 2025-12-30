"""
Router de Upload de Documentos - Implementação REAL.
"""

import asyncio
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


def _has_magic_header(contents: bytes, file_ext: str) -> bool:
    if not contents:
        return False

    # PDF
    if file_ext == ".pdf":
        return contents.startswith(b"%PDF")

    # DOC (OLE compound file)
    if file_ext == ".doc":
        return contents.startswith(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1")

    # DOCX/ODT são ZIP
    if file_ext in {".docx", ".odt"}:
        return contents.startswith(b"PK\x03\x04")

    # TXT: não há assinatura confiável; aceitar.
    if file_ext == ".txt":
        return True

    return True


def _write_bytes(path: str, data: bytes) -> None:
    with open(path, "wb") as f:
        f.write(data)


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

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Arquivo vazio")

    # Validar tamanho
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE / 1024 / 1024}MB",
        )

    # Validação básica de assinatura do arquivo (evita mismatch óbvio)
    if not _has_magic_header(contents, file_ext):
        raise HTTPException(
            status_code=400,
            detail="Conteúdo do arquivo não corresponde à extensão informada",
        )

    # Gerar ID único
    doc_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    # Storage local opcional (para permitir reprocessamento/análise posterior)
    storage_dir = (os.getenv("DOCUMENTS_STORAGE_DIR") or "").strip()
    saved_path = None
    if storage_dir:
        try:
            os.makedirs(storage_dir, exist_ok=True)
            safe_name = os.path.basename(file.filename)
            saved_path = os.path.join(storage_dir, f"{doc_id}_{safe_name}")
            await asyncio.to_thread(_write_bytes, saved_path, contents)
        except Exception:
            saved_path = None

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
        "storage_path": saved_path,
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
