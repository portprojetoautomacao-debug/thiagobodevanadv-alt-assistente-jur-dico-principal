"""
Comandos de IA para o Editor de Minutas
=======================================

Módulo responsável por gerar texto jurídico usando Google Gemini.
Implementa streaming para feedback em tempo real.
"""

import os
from typing import AsyncIterator

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# Carregar variáveis de ambiente
load_dotenv()

# Configuração do modelo
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.0-flash-exp"  # Modelo rápido e eficiente


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

        async for chunk in self.llm.astream(messages):
            yield chunk.content

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
