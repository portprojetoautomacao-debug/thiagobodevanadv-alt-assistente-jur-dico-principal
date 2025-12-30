"""
Utilitários para parsing e extração de dados de textos jurídicos
"""

import re
from datetime import datetime
from typing import Any, Dict, List, Optional


def extrair_numero_cnj(texto: str) -> List[str]:
    """
    Extrai números de processos no formato CNJ de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de números CNJ encontrados
    """
    if not texto:
        return []

    # Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
    padrao = r"\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}"

    matches = re.findall(padrao, texto)

    # Remove duplicatas mantendo ordem
    numeros_unicos = []
    for numero in matches:
        if numero not in numeros_unicos:
            numeros_unicos.append(numero)

    return numeros_unicos


def extrair_prazos(texto: str) -> List[Dict[str, Any]]:
    """
    Extrai menções a prazos de um texto jurídico.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de dicionários com informações dos prazos
    """
    if not texto:
        return []

    prazos = []

    # Padrões comuns de prazo
    padroes = [
        # "em X dias" ou "no prazo de X dias"
        (r"(?:em|prazo de)\s+(\d+)\s+dias?\s*(úteis|corridos)?", "dias"),
        # "X dias úteis" ou "X dias corridos"
        (r"(\d+)\s+dias?\s+(úteis|corridos)", "dias"),
        # "em X horas"
        (r"(?:em|prazo de)\s+(\d+)\s+horas?", "horas"),
        # "até o dia DD/MM/AAAA"
        (r"até\s+(?:o\s+)?dia\s+(\d{2}/\d{2}/\d{4})", "data"),
        # "até DD/MM/AAAA"
        (r"até\s+(\d{2}/\d{2}/\d{4})", "data"),
    ]

    texto_lower = texto.lower()

    for padrao, tipo in padroes:
        matches = re.finditer(padrao, texto_lower)
        for match in matches:
            prazo_info = {
                "texto_original": match.group(0),
                "tipo": tipo,
                "posicao": match.start(),
            }

            if tipo == "dias":
                prazo_info["quantidade"] = int(match.group(1))
                prazo_info["tipo_dias"] = (
                    match.group(2) if len(match.groups()) > 1 else "corridos"
                )
            elif tipo == "horas":
                prazo_info["quantidade"] = int(match.group(1))
            elif tipo == "data":
                prazo_info["data"] = match.group(1)

            prazos.append(prazo_info)

    # Remove duplicatas baseado na posição
    prazos_unicos = []
    posicoes_vistas = set()
    for prazo in prazos:
        if prazo["posicao"] not in posicoes_vistas:
            posicoes_vistas.add(prazo["posicao"])
            prazos_unicos.append(prazo)

    return prazos_unicos


def extrair_valores_monetarios(texto: str) -> List[Dict[str, Any]]:
    """
    Extrai valores monetários de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de valores encontrados
    """
    if not texto:
        return []

    valores = []

    # Padrões de valores monetários
    padroes = [
        # R$ 1.234,56 ou R$ 1234,56
        r"R\$\s*([\d.]+,\d{2})",
        # 1.234,56 reais
        r"([\d.]+,\d{2})\s*reais",
    ]

    for padrao in padroes:
        matches = re.finditer(padrao, texto, re.IGNORECASE)
        for match in matches:
            valor_str = match.group(1)
            # Converte para float
            try:
                valor_float = float(valor_str.replace(".", "").replace(",", "."))
                valores.append(
                    {
                        "texto_original": match.group(0),
                        "valor": valor_float,
                        "posicao": match.start(),
                    }
                )
            except ValueError:
                pass

    return valores


def extrair_cpfs(texto: str) -> List[str]:
    """
    Extrai CPFs de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de CPFs encontrados
    """
    if not texto:
        return []

    # Padrão CPF: XXX.XXX.XXX-XX ou XXXXXXXXXXX
    padrao_formatado = r"\d{3}\.\d{3}\.\d{3}-\d{2}"
    padrao_sem_formato = r"(?<!\d)\d{11}(?!\d)"

    cpfs = []

    # CPFs formatados
    cpfs.extend(re.findall(padrao_formatado, texto))

    # CPFs sem formatação (mais cuidado para não pegar outros números)
    for match in re.finditer(padrao_sem_formato, texto):
        cpf = match.group(0)
        # Verifica se não são todos iguais
        if cpf != cpf[0] * 11:
            cpfs.append(cpf)

    # Remove duplicatas
    return list(dict.fromkeys(cpfs))


def extrair_cnpjs(texto: str) -> List[str]:
    """
    Extrai CNPJs de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de CNPJs encontrados
    """
    if not texto:
        return []

    # Padrão CNPJ: XX.XXX.XXX/XXXX-XX
    padrao = r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}"

    return list(dict.fromkeys(re.findall(padrao, texto)))


def extrair_datas(texto: str) -> List[str]:
    """
    Extrai datas de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de datas encontradas (no formato original)
    """
    if not texto:
        return []

    datas = []

    # Padrões de data
    padroes = [
        r"\d{2}/\d{2}/\d{4}",  # DD/MM/AAAA
        r"\d{2}-\d{2}-\d{4}",  # DD-MM-AAAA
        r"\d{4}-\d{2}-\d{2}",  # AAAA-MM-DD (ISO)
    ]

    for padrao in padroes:
        datas.extend(re.findall(padrao, texto))

    return list(dict.fromkeys(datas))


def extrair_emails(texto: str) -> List[str]:
    """
    Extrai emails de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de emails encontrados
    """
    if not texto:
        return []

    padrao = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"

    return list(dict.fromkeys(re.findall(padrao, texto)))


def extrair_oabs(texto: str) -> List[Dict[str, str]]:
    """
    Extrai números de OAB de um texto.

    Args:
        texto: Texto a ser analisado

    Returns:
        Lista de OABs encontradas com número e UF
    """
    if not texto:
        return []

    # Padrão OAB: OAB/UF XXXXX ou OAB UF XXXXX
    padrao = r"OAB[/\s]*([A-Z]{2})[:\s]*(\d+)"

    oabs = []
    for match in re.finditer(padrao, texto.upper()):
        oabs.append(
            {
                "uf": match.group(1),
                "numero": match.group(2),
            }
        )

    return oabs
