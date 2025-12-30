"""
Utilitários para formatação de dados jurídicos
"""

import re
from typing import Optional


def formatar_numero_cnj(numero: str) -> str:
    """
    Formata número de processo no padrão CNJ (NNNNNNN-DD.AAAA.J.TR.OOOO).

    Args:
        numero: Número sem formatação (20 dígitos)

    Returns:
        Número formatado no padrão CNJ
    """
    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", numero)

    # Verifica se tem 20 dígitos
    if len(apenas_numeros) != 20:
        return numero  # Retorna original se não for válido

    # Formata: NNNNNNN-DD.AAAA.J.TR.OOOO
    return (
        f"{apenas_numeros[0:7]}-"
        f"{apenas_numeros[7:9]}."
        f"{apenas_numeros[9:13]}."
        f"{apenas_numeros[13]}."
        f"{apenas_numeros[14:16]}."
        f"{apenas_numeros[16:20]}"
    )


def formatar_valor_monetario(valor: float, moeda: str = "R$") -> str:
    """
    Formata valor monetário no padrão brasileiro.

    Args:
        valor: Valor a ser formatado
        moeda: Símbolo da moeda (padrão: R$)

    Returns:
        Valor formatado (ex: R$ 50.000,50)
    """
    # Formata com separador de milhares e decimais
    valor_formatado = f"{valor:,.2f}"

    # Troca padrão americano pelo brasileiro
    valor_formatado = valor_formatado.replace(",", "X")
    valor_formatado = valor_formatado.replace(".", ",")
    valor_formatado = valor_formatado.replace("X", ".")

    return f"{moeda} {valor_formatado}"


def formatar_cpf(cpf: str) -> str:
    """
    Formata CPF no padrão XXX.XXX.XXX-XX.

    Args:
        cpf: CPF sem formatação (11 dígitos)

    Returns:
        CPF formatado
    """
    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", cpf)

    # Verifica se tem 11 dígitos
    if len(apenas_numeros) != 11:
        return cpf  # Retorna original se não for válido

    return f"{apenas_numeros[0:3]}.{apenas_numeros[3:6]}.{apenas_numeros[6:9]}-{apenas_numeros[9:11]}"


def formatar_cnpj(cnpj: str) -> str:
    """
    Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX.

    Args:
        cnpj: CNPJ sem formatação (14 dígitos)

    Returns:
        CNPJ formatado
    """
    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", cnpj)

    # Verifica se tem 14 dígitos
    if len(apenas_numeros) != 14:
        return cnpj  # Retorna original se não for válido

    return (
        f"{apenas_numeros[0:2]}."
        f"{apenas_numeros[2:5]}."
        f"{apenas_numeros[5:8]}/"
        f"{apenas_numeros[8:12]}-"
        f"{apenas_numeros[12:14]}"
    )


def formatar_telefone(telefone: str) -> str:
    """
    Formata telefone brasileiro.

    Args:
        telefone: Telefone sem formatação

    Returns:
        Telefone formatado
    """
    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", telefone)

    if len(apenas_numeros) == 11:  # Celular com DDD
        return f"({apenas_numeros[0:2]}) {apenas_numeros[2:7]}-{apenas_numeros[7:11]}"
    elif len(apenas_numeros) == 10:  # Fixo com DDD
        return f"({apenas_numeros[0:2]}) {apenas_numeros[2:6]}-{apenas_numeros[6:10]}"
    else:
        return telefone


def formatar_cep(cep: str) -> str:
    """
    Formata CEP no padrão XXXXX-XXX.

    Args:
        cep: CEP sem formatação (8 dígitos)

    Returns:
        CEP formatado
    """
    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", cep)

    if len(apenas_numeros) != 8:
        return cep

    return f"{apenas_numeros[0:5]}-{apenas_numeros[5:8]}"


def limpar_formatacao(texto: str) -> str:
    """
    Remove toda formatação de um texto, deixando apenas números.

    Args:
        texto: Texto com formatação

    Returns:
        Apenas os dígitos numéricos
    """
    return re.sub(r"\D", "", texto)
