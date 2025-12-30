"""Router Expedientes (Upload + Lista + Análise IA).

Compatível com a página Streamlit [pages/2_Expedientes.py](streamlit-app/pages/2_Expedientes.py):
- Upload envia base64 em `content` e metadados (`filename`, `tipo`, `processoNumero`)
- Lista espera campos como `filename`, `createdAt`, `processado`, `prazo`
"""

import base64
import io
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


class AnaliseExpediente(BaseModel):
    """Esquema estruturado retornado pelo LLM."""

    prazo: str = Field(
        default="-",
        description="Prazo identificado; use '-' quando ausente.",
    )
    resumo: str = Field(..., description="Resumo objetivo do expediente.")
    urgencia: str = Field(
        ...,
        description="Nível de urgência (baixa|media|alta).",
    )

    def dump(self) -> Dict[str, Any]:
        return self.model_dump()


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


def _guess_mime(filename: str) -> str:
    lower = (filename or "").lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".docx"):
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    if lower.endswith(".txt"):
        return "text/plain"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith((".jpg", ".jpeg")):
        return "image/jpeg"
    return "application/octet-stream"


async def _analyze_expedientes_items(
    items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Analisa expedientes em lote usando LangChain `abatch` com saída estruturada.

    Retorna uma lista com updates (por item) contendo: prazo, analise e flags.
    """

    from langchain.schema import HumanMessage, SystemMessage
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
    structured_llm = llm.with_structured_output(AnaliseExpediente)

    system = (
        "Você é um assistente jurídico especializado em expedientes/intimações. "
        "Extraia informações objetivas e responda no formato estruturado solicitado."
    )

    inputs = []
    for exp in items:
        texto = (exp.get("conteudoExtraido") or "").strip()
        raw_b64 = exp.get("rawContentBase64")
        filename = exp.get("filename") or "documento"

        # Monta mensagem multimodal quando não há texto, senão usa texto puro.
        if not texto and raw_b64:
            content = [
                {
                    "type": "text",
                    "text": (
                        "Analise o documento e devolva somente os campos solicitados: "
                        "prazo (string curta, '-' se não houver), resumo (string), "
                        "urgencia (baixa|media|alta)."
                    ),
                },
                {
                    "type": "file",
                    "source_type": "base64",
                    "data": raw_b64,
                    "mime_type": _guess_mime(filename),
                },
            ]
        else:
            content = (
                "Analise o documento a seguir e devolva os campos: "
                "prazo (string curta, '-' se não houver), resumo (string), "
                "urgencia (baixa|media|alta).\n\nDOCUMENTO:\n" + texto
            )

        inputs.append(
            [
                SystemMessage(content=system),
                HumanMessage(content=content),
            ]
        )

    results = await structured_llm.abatch(inputs)

    updates: List[Dict[str, Any]] = []
    for exp, res in zip(items, results):
        parsed = {}
        prazo = "-"

        if isinstance(res, AnaliseExpediente):
            parsed = res.dump()
            prazo = parsed.get("prazo") or "-"
        else:
            # fallback defensivo em caso de comportamento inesperado
            content = getattr(res, "content", "")
            parsed = {"raw": content}

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
    raw_b64 = None

    # Guardar o conteúdo base64 apenas se não houver texto extraído,
    # para permitir análise multimodal posterior sem inflar o Redis para casos comuns.
    if not (extracted or "").strip():
        raw_b64 = payload.content

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
        "rawContentBase64": raw_b64,
    }

    expedientes = redis.get("expedientes") or []
    expedientes.append(expediente)
    redis.set("expedientes", expedientes)

    # Análise automática (se solicitado e se houver material para analisar)
    if payload.analisarAutomaticamente and (extracted.strip() or raw_b64):
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

    # Filtrar os que têm texto ou conteúdo bruto para análise multimodal
    analyzable = [
        e
        for e in selected
        if (e.get("conteudoExtraido") or "").strip() or e.get("rawContentBase64")
    ]
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
