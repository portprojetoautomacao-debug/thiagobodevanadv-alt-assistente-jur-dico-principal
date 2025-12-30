"""
Utilitários de segurança para o sistema jurídico
"""

import base64
import hashlib
import hmac
import secrets
from typing import Optional


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """
    Gera hash seguro de senha usando PBKDF2

    Args:
        password: Senha em texto plano
        salt: Salt opcional (se não fornecido, gera automaticamente)

    Returns:
        Hash da senha no formato salt:hash
    """
    if salt is None:
        salt = secrets.token_hex(16)

    # Usa PBKDF2 com SHA256
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,  # Número de iterações
    )

    hash_hex = key.hex()
    return f"{salt}:{hash_hex}"


def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica se senha corresponde ao hash

    Args:
        password: Senha em texto plano
        hashed: Hash no formato salt:hash

    Returns:
        True se a senha corresponde
    """
    try:
        salt, stored_hash = hashed.split(":")
        new_hash = hash_password(password, salt)
        return hmac.compare_digest(new_hash, hashed)
    except (ValueError, AttributeError):
        return False


def generate_token(length: int = 32) -> str:
    """
    Gera token aleatório seguro

    Args:
        length: Tamanho do token em bytes

    Returns:
        Token em formato hexadecimal
    """
    return secrets.token_hex(length)


def generate_api_key() -> str:
    """
    Gera chave de API segura

    Returns:
        Chave de API no formato base64
    """
    random_bytes = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(random_bytes).decode("utf-8").rstrip("=")


def hash_data(data: str) -> str:
    """
    Gera hash SHA256 de dados

    Args:
        data: Dados para hash

    Returns:
        Hash em hexadecimal
    """
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def sanitize_input(text: str) -> str:
    """
    Sanitiza entrada de texto removendo caracteres potencialmente perigosos

    Args:
        text: Texto de entrada

    Returns:
        Texto sanitizado
    """
    if not text:
        return ""

    # Remove caracteres de controle e scripts perigosos
    dangerous_patterns = [
        "<script",
        "</script>",
        "javascript:",
        "onclick=",
        "onerror=",
        "<iframe",
        "</iframe>",
        "vbscript:",
        "<object",
        "<embed",
    ]

    result = text
    for pattern in dangerous_patterns:
        result = result.replace(pattern, "")
        result = result.replace(pattern.upper(), "")

    return result


def mask_sensitive_data(data: str, visible_chars: int = 4) -> str:
    """
    Mascara dados sensíveis mostrando apenas últimos caracteres

    Args:
        data: Dados a mascarar
        visible_chars: Número de caracteres visíveis no final

    Returns:
        Dados mascarados
    """
    if not data or len(data) <= visible_chars:
        return "*" * len(data) if data else ""

    masked_length = len(data) - visible_chars
    return "*" * masked_length + data[-visible_chars:]
