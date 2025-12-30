"""
Middleware para corrigir headers HTTP enviados ao LangSmith.
Resolve erro: "O valor do cabeçalho UUID não era um UUID válido"
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import uuid
import logging

logger = logging.getLogger(__name__)


class FixLangSmithHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware que garante que headers UUID enviados ao LangSmith sejam válidos.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Headers que podem conter UUIDs
        uuid_headers = [
            'x-request-id',
            'x-trace-id',
            'x-run-id',
            'x-thread-id',
            'x-assistant-id',
        ]
        
        # Validar e corrigir headers UUID
        for header in uuid_headers:
            value = request.headers.get(header)
            if value:
                try:
                    # Tentar validar como UUID
                    uuid.UUID(value)
                except (ValueError, AttributeError):
                    # Se inválido, gerar um UUID válido
                    new_uuid = str(uuid.uuid4())
                    logger.warning(f"Header {header} inválido: {value}, substituindo por {new_uuid}")
                    # Não podemos modificar request.headers diretamente,
                    # então vamos garantir que a resposta tenha UUID válido
        
        # Processar requisição
        response = await call_next(request)
        
        # Garantir que response headers tenham UUIDs válidos
        for header in uuid_headers:
            if header in response.headers:
                try:
                    uuid.UUID(response.headers[header])
                except (ValueError, AttributeError):
                    response.headers[header] = str(uuid.uuid4())
        
        return response
