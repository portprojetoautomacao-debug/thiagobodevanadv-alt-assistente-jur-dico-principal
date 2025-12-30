"""
Módulo de utilitários para o Assistente Jurídico
"""

from .cache import cache_result, clear_cache, get_cache
from .date_utils import converter_para_brasilia, obter_data_atual_brasilia
from .formatacao import formatar_cpf, formatar_numero_cnj, formatar_valor_monetario
from .parser import extrair_numero_cnj, extrair_prazos
from .prazos import calcular_prazo, eh_feriado
from .security import (
    generate_api_key,
    generate_token,
    hash_data,
    hash_password,
    mask_sensitive_data,
    sanitize_input,
    verify_password,
)
from .validacao import validar_cpf, validar_email, validar_numero_cnj

__all__ = [
    "calcular_prazo",
    "eh_feriado",
    "formatar_numero_cnj",
    "formatar_valor_monetario",
    "formatar_cpf",
    "validar_numero_cnj",
    "validar_cpf",
    "validar_email",
    "extrair_numero_cnj",
    "extrair_prazos",
    "obter_data_atual_brasilia",
    "converter_para_brasilia",
    "cache_result",
    "get_cache",
    "clear_cache",
    "hash_password",
    "verify_password",
    "generate_token",
    "generate_api_key",
    "hash_data",
    "sanitize_input",
    "mask_sensitive_data",
]
