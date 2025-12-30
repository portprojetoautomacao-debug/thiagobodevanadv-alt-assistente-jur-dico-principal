"""Router Expedientes (Upload + Lista + Análise IA).

Compatível com a página Streamlit [pages/2_Expedientes.py](streamlit-app/pages/2_Expedientes.py):
- Upload envia base64 em `content` e metadados (`filename`, `tipo`, `processoNumero`)
- Lista espera campos como `filename`, `createdAt`, `processado`, `prazo`
"""

import base64
import io
import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from database import RedisClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()


class ExpedienteUploadRequest(BaseModel):
    filename: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1, description="Conteúdo base64 do arquivo")
    tipo: str = Field(default="Outro")
    processoNumero: Optional[str] = None
    analisarAutomaticamente: bool = False


class ExpedienteAnalyzeRequest(BaseModel):
    ids: List[str] = Field(default_factory=list)


def _extract_text(filename: str, file_bytes: bytes) -> str:
    lower = (filename or "").lower()

    # TXT
    if lower.endswith(".txt"):
        try:
            return file_bytes.decode("utf-8")
        except Exception:
            return file_bytes.decode("latin-1", errors="ignore")

    # PDF
    if lower.endswith(".pdf"):
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for page in reader.pages:
                try:
                    pages_text.append(page.extract_text() or "")
                except Exception:
                    pages_text.append("")
            return "\n".join(pages_text).strip()
        except Exception:
            return ""

    # DOCX
    if lower.endswith(".docx"):
        try:
            from docx import Document

            doc = Document(io.BytesIO(file_bytes))
            return "\n".join(p.text for p in doc.paragraphs).strip()
        except Exception:
            return ""

    # Imagens (OCR não implementado aqui)
    return ""


def _get_extraction_note(filename: str, extracted_text: str) -> Optional[str]:
    """Retorna uma observação amigável quando não há texto extraído.

    Mantemos OCR fora do escopo; aqui apenas orientamos o usuário.
    """
    if (extracted_text or "").strip():
        return None

    lower = (filename or "").lower()
    if lower.endswith((".jpg", ".jpeg", ".png")):
        return "Sem texto extraído (imagem). OCR não habilitado."
    if lower.endswith(".pdf"):
        return "Sem texto extraído (PDF possivelmente escaneado). OCR não habilitado."
    return "Sem texto extraído."


def _extract_json(text: str) -> Optional[Dict[str, Any]]:
    """Tenta extrair um JSON puro de uma resposta do LLM."""
    if not text:
        return None

    candidate = text.strip()

    # Remover fences ```json ... ```
    if candidate.startswith("```"):
        candidate = re.sub(r"^```(?:json)?\s*", "", candidate, flags=re.IGNORECASE)
        candidate = re.sub(r"```\s*$", "", candidate)
        candidate = candidate.strip()

    # Pegar primeiro bloco {...}
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None

    try:
        return json.loads(candidate[start : end + 1])
    except Exception:
        return None


async def _analyze_expedientes_items(
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Analisa expedientes em lote usando LangChain `abatch`.

    Retorna uma lista com updates (por item) contendo: prazo, analise e flags.
    """

    from langchain_google_genai import ChatGoogleGenerativeAI

    api_key = __import__("os").getenv("GEMINI_API_KEY") or __import__("os").getenv(
        "GOOGLE_API_KEY"
    )
    if not api_key:
        raise ValueError("API key não configurada (GEMINI_API_KEY/GOOGLE_API_KEY)")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-exp",
        google_api_key=api_key,
        temperature=0.2,
        convert_system_message_to_human=True,
    )

    system = (
        "Você é um assistente jurídico especializado em expedientes/intimações. "
        "Extraia informações objetivas e retorne SOMENTE JSON válido."
    )

    inputs = []
    for exp in items:
        texto = (exp.get("conteudoExtraido") or "").strip()
        inputs.append(
            [
                ("system", system),
                (
                    "human",
                    "Analise o documento a seguir e retorne JSON estrito com as chaves: "
                    "prazo (string curta), resumo (string), urgencia (baixa|media|alta). "
                    "Se não houver prazo, use prazo='-'.\n\nDOCUMENTO:\n" + texto,
                ),
            ]
        )

    results = await llm.abatch(inputs)

    updates: List[Dict[str, Any]] = []
    for exp, res in zip(items, results):
        content = getattr(res, "content", "")
        parsed = _extract_json(content) or {}

        prazo = parsed.get("prazo") if isinstance(parsed, dict) else None
        if not prazo:
            prazo = "-"

        updates.append(
            {
                "id": exp.get("id"),
                "processado": True,
                "prazo": str(prazo),
                "analise": parsed if parsed else {"raw": content},
                "processedAt": datetime.now().isoformat(),
            }
        )

    return updates


@router.get("/expedientes")
async def get_expedientes():
    """Lista todos os expedientes."""
    redis = RedisClient()
    expedientes = redis.get("expedientes") or []
    return {"expedientes": expedientes, "total": len(expedientes)}


@router.post("/expedientes")
async def create_expediente(payload: ExpedienteUploadRequest):
    """Cria novo expediente a partir de upload (base64)."""

    redis = RedisClient()

    try:
        file_bytes = base64.b64decode(payload.content)
    except Exception:
        raise HTTPException(status_code=400, detail="content inválido (base64)")

    extracted = _extract_text(payload.filename, file_bytes)
    extraction_note = _get_extraction_note(payload.filename, extracted)

    exp_id = f"exp-{uuid.uuid4().hex[:10]}"
    now = datetime.now().isoformat()

    expediente: Dict[str, Any] = {
        "id": exp_id,
        "filename": payload.filename,
        "tipo": payload.tipo,
        "processoNumero": payload.processoNumero,
        "createdAt": now,
        "processado": False,
        "prazo": "-",
        "conteudoExtraido": extracted,
        "extractionNote": extraction_note,
    }

    expedientes = redis.get("expedientes") or []
    expedientes.append(expediente)
    redis.set("expedientes", expedientes)

    # Análise automática (se solicitado e se houver texto extraído)
    if payload.analisarAutomaticamente and extracted.strip():
        try:
            updates = await _analyze_expedientes_items([expediente])
            update = updates[0] if updates else None
            if update:
                for item in expedientes:
                    if item.get("id") == exp_id:
                        item.update(update)
                        break
                redis.set("expedientes", expedientes)
        except Exception as e:
            for item in expedientes:
                if item.get("id") == exp_id:
                    item["analysisError"] = str(e)
                    break
            redis.set("expedientes", expedientes)

    return {"success": True, "expediente": expediente}


@router.post("/expedientes/analyze")
async def analyze_expedientes(request: ExpedienteAnalyzeRequest):
    """Analisa expedientes selecionados em lote (batch)."""

    if not request.ids:
        raise HTTPException(status_code=400, detail="ids é obrigatório")

    redis = RedisClient()
    expedientes = redis.get("expedientes") or []

    id_set = set(request.ids)
    selected = [e for e in expedientes if e.get("id") in id_set]
    if not selected:
        raise HTTPException(status_code=404, detail="Nenhum expediente encontrado")

    # Filtrar os que têm texto
    analyzable = [e for e in selected if (e.get("conteudoExtraido") or "").strip()]
    skipped_ids = [e.get("id") for e in selected if e not in analyzable]
    if not analyzable:
        return {
            "success": True,
            "updated": 0,
            "skipped": len(selected),
            "skippedIds": skipped_ids,
            "message": "Nenhum expediente possui texto extraído para análise (OCR não habilitado).",
        }

    updates = await _analyze_expedientes_items(analyzable)
    updated_ids = {u.get("id") for u in updates}

    for item in expedientes:
        if item.get("id") in updated_ids:
            update = next((u for u in updates if u.get("id") == item.get("id")), None)
            if update:
                item.update(update)

    redis.set("expedientes", expedientes)

    return {
        "success": True,
        "updated": len(updated_ids),
        "skipped": len(selected) - len(updated_ids),
        "skippedIds": skipped_ids,
        "message": (
            "Alguns expedientes foram ignorados por falta de texto extraído (OCR não habilitado)."
            if skipped_ids
            else None
        ),
    }


@router.get("/expedientes/{expediente_id}")
async def get_expediente(expediente_id: str):
    """Busca expediente por ID."""
    redis = RedisClient()
    expedientes = redis.get("expedientes") or []
    for exp in expedientes:
        if exp.get("id") == expediente_id:
            return exp
    raise HTTPException(status_code=404, detail="Expediente not found")
