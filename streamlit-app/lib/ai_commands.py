"""Comandos de IA para o Editor de Minutas."""

import asyncio
import os
import random
import re
import time
from typing import AsyncIterator

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do modelo
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.0-flash-exp"  # Modelo rápido e eficiente
_MIN_INTERVAL_SECONDS = float(os.getenv("GEMINI_MIN_REQUEST_INTERVAL_SECONDS", "6.5"))
_MAX_ATTEMPTS = int(os.getenv("GEMINI_MAX_RETRY_ATTEMPTS", "5"))
_BASE_BACKOFF = float(os.getenv("GEMINI_RETRY_BASE_SECONDS", "6"))
_RATE_LOCK = asyncio.Lock()
_LAST_REQUEST_AT = 0.0


def _is_rate_limit_error(err: Exception) -> bool:
    msg = str(err)
    return "Too Many Requests" in msg or "RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower()


def _extract_retry_delay_seconds(err: Exception) -> float | None:
    match = re.search(r"retryDelay\"?:\s*\"?(\d+)(?:\.\d+)?s", str(err))
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


class AIMinutaCommands:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError(
                "API key requerida para Gemini. Defina GEMINI_API_KEY ou GOOGLE_API_KEY nas variáveis de ambiente"
            )

        self.llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=api_key,
            temperature=0.7,
            convert_system_message_to_human=True,
        )

        self.system_prompt = """
        Você é um assistente jurídico sênior especializado em redação de peças processuais e contratos.
        Sua tarefa é auxiliar advogados na elaboração de documentos.

        Diretrizes:
        1. Use linguagem jurídica técnica, formal e precisa.
        2. Siga as normas da ABNT e padrões forenses brasileiros.
        3. Cite legislação (CF/88, CC/02, CPC/15, CLT) quando pertinente.
        4. Mantenha o tom profissional e persuasivo.
        5. Retorne APENAS o texto solicitado, sem introduções ou explicações extras.
        6. Se o texto for HTML, mantenha a formatação (parágrafos <p>, negrito <strong>, etc).
        """

    async def _stream_response(self, prompt: str) -> AsyncIterator[str]:
        """Gera resposta em streaming"""
        messages = [
            SystemMessage(content=self.system_prompt),
            HumanMessage(content=prompt),
        ]

        # Garantir espaçamento mínimo entre requisições (quota 10 req/min)
        async with _RATE_LOCK:
            global _LAST_REQUEST_AT
            now = time.monotonic()
            wait = _MIN_INTERVAL_SECONDS - (now - _LAST_REQUEST_AT)
            if wait > 0:
                await asyncio.sleep(wait)
            _LAST_REQUEST_AT = time.monotonic()

        last_error: Exception | None = None
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                async for chunk in self.llm.astream(messages):
                    yield chunk.content
                return
            except Exception as err:  # noqa: BLE001
                last_error = err
                if not _is_rate_limit_error(err) or attempt >= _MAX_ATTEMPTS:
                    raise

                retry_delay = _extract_retry_delay_seconds(err)
                if retry_delay is None:
                    retry_delay = _BASE_BACKOFF * attempt

                # jitter para reduzir colisão
                retry_delay += random.uniform(0.25, 1.0)
                await asyncio.sleep(retry_delay)

        if last_error is not None:
            raise last_error

    async def continuar(self, texto_anterior: str) -> AsyncIterator[str]:
        """Continua escrevendo o texto a partir do ponto atual"""
        prompt = f"""
        Continue escrevendo o seguinte texto jurídico de forma natural e coesa.
        Mantenha o mesmo estilo e formatação.

        TEXTO ATUAL:
        {texto_anterior}

        CONTINUAÇÃO:
        """
        async for chunk in self._stream_response(prompt):
            yield chunk

    async def expandir(self, texto_selecionado: str) -> AsyncIterator[str]:
        """Expande e desenvolve o texto selecionado"""
        prompt = f"""
        Expanda e desenvolva o seguinte trecho jurídico com mais detalhes,
        fundamentação e argumentos. Aumente o tamanho em pelo menos 50%.

        TRECHO ORIGINAL:
        {texto_selecionado}

        VERSÃO EXPANDIDA:
        """
        async for chunk in self._stream_response(prompt):
            yield chunk

    async def revisar(self, texto_selecionado: str) -> AsyncIterator[str]:
        """Revisa e melhora a redação do texto"""
        prompt = f"""
        Revise o seguinte texto jurídico melhorando a clareza, coesão e correção gramatical.
        Mantenha o significado original, mas torne a leitura mais fluida e profissional.

        TEXTO ORIGINAL:
        {texto_selecionado}

        VERSÃO REVISADA:
        """
        async for chunk in self._stream_response(prompt):
            yield chunk

    async def formalizar(self, texto_selecionado: str) -> AsyncIterator[str]:
        """Reescreve em linguagem jurídica formal (juridiquês culto)"""
        prompt = f"""
        Reescreva o seguinte texto utilizando linguagem jurídica formal, culta e técnica.
        Substitua termos comuns por terminologia jurídica adequada.

        TEXTO ORIGINAL:
        {texto_selecionado}

        VERSÃO FORMALIZADA:
        """
        async for chunk in self._stream_response(prompt):
            yield chunk
