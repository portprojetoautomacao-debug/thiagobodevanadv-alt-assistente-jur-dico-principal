"""
Utilitários para validação de dados jurídicos
"""

import re
from typing import Optional


def validar_numero_cnj(numero: str) -> bool:
    """
    Valida se um número está no formato CNJ válido.

    O formato CNJ é: NNNNNNN-DD.AAAA.J.TR.OOOO
    - NNNNNNN: 7 dígitos sequenciais
    - DD: 2 dígitos verificadores
    - AAAA: ano (4 dígitos)
    - J: justiça (1 dígito)
    - TR: tribunal (2 dígitos)
    - OOOO: origem (4 dígitos)

    Args:
        numero: Número do processo

    Returns:
        True se válido, False caso contrário
    """
    if not numero:
        return False

    # Padrão CNJ com formatação
    padrao_formatado = r"^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$"

    # Padrão CNJ sem formatação (20 dígitos)
    padrao_sem_formatacao = r"^\d{20}$"

    if re.match(padrao_formatado, numero):
        return True

    # Remove formatação e verifica
    apenas_numeros = re.sub(r"\D", "", numero)

    if re.match(padrao_sem_formatacao, apenas_numeros):
        return True

    return False


def validar_cpf(cpf: str) -> bool:
    """
    Valida CPF usando o algoritmo oficial.

    Args:
        cpf: CPF a ser validado (com ou sem formatação)

    Returns:
        True se válido, False caso contrário
    """
    if not cpf:
        return False

    # Remove caracteres não numéricos
    cpf = re.sub(r"\D", "", cpf)

    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False

    # Verifica se todos os dígitos são iguais (inválido)
    if cpf == cpf[0] * 11:
        return False

    # Calcula primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    if int(cpf[9]) != digito1:
        return False

    # Calcula segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    if int(cpf[10]) != digito2:
        return False

    return True


def validar_cnpj(cnpj: str) -> bool:
    """
    Valida CNPJ usando o algoritmo oficial.

    Args:
        cnpj: CNPJ a ser validado (com ou sem formatação)

    Returns:
        True se válido, False caso contrário
    """
    if not cnpj:
        return False

    # Remove caracteres não numéricos
    cnpj = re.sub(r"\D", "", cnpj)

    # Verifica se tem 14 dígitos
    if len(cnpj) != 14:
        return False

    # Verifica se todos os dígitos são iguais (inválido)
    if cnpj == cnpj[0] * 14:
        return False

    # Calcula primeiro dígito verificador
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos1[i] for i in range(12))
    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    if int(cnpj[12]) != digito1:
        return False

    # Calcula segundo dígito verificador
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(cnpj[i]) * pesos2[i] for i in range(13))
    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    if int(cnpj[13]) != digito2:
        return False

    return True


def validar_email(email: str) -> bool:
    """
    Valida formato de email.

    Args:
        email: Email a ser validado

    Returns:
        True se válido, False caso contrário
    """
    if not email:
        return False

    # Verifica se contém pontos duplos
    if ".." in email:
        return False

    # Verifica se começa com ponto após @
    if "@." in email:
        return False

    # Padrão básico de email
    padrao = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    return bool(re.match(padrao, email))


def validar_oab(numero: str, uf: Optional[str] = None) -> bool:
    """
    Valida número de OAB.

    Args:
        numero: Número da OAB
        uf: UF da seccional (opcional)

    Returns:
        True se formato válido, False caso contrário
    """
    if not numero:
        return False

    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", numero)

    # OAB geralmente tem entre 3 e 7 dígitos
    if not (3 <= len(apenas_numeros) <= 7):
        return False

    # Se UF fornecida, valida
    if uf:
        ufs_validas = [
            "AC",
            "AL",
            "AP",
            "AM",
            "BA",
            "CE",
            "DF",
            "ES",
            "GO",
            "MA",
            "MT",
            "MS",
            "MG",
            "PA",
            "PB",
            "PR",
            "PE",
            "PI",
            "RJ",
            "RN",
            "RS",
            "RO",
            "RR",
            "SC",
            "SP",
            "SE",
            "TO",
        ]
        if uf.upper() not in ufs_validas:
            return False

    return True


def validar_telefone(telefone: str) -> bool:
    """
    Valida telefone brasileiro.

    Args:
        telefone: Telefone a ser validado

    Returns:
        True se válido, False caso contrário
    """
    if not telefone:
        return False

    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", telefone)

    # Aceita 10 (fixo com DDD) ou 11 (celular com DDD) dígitos
    if len(apenas_numeros) not in [10, 11]:
        return False

    # DDD deve ser válido (11-99)
    ddd = int(apenas_numeros[0:2])
    if ddd < 11 or ddd > 99:
        return False

    return True


def validar_cep(cep: str) -> bool:
    """
    Valida CEP brasileiro.

    Args:
        cep: CEP a ser validado

    Returns:
        True se válido, False caso contrário
    """
    if not cep:
        return False

    # Remove caracteres não numéricos
    apenas_numeros = re.sub(r"\D", "", cep)

    # CEP deve ter 8 dígitos
    return len(apenas_numeros) == 8
