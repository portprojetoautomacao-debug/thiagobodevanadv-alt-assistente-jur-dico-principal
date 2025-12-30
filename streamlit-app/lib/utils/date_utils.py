"""
Utilitários para manipulação de datas e fusos horários
"""

from datetime import datetime, timedelta
from typing import Optional

import pytz

# Timezone de Brasília
BRASILIA_TZ = pytz.timezone("America/Sao_Paulo")
UTC_TZ = pytz.UTC


def obter_data_atual_brasilia() -> datetime:
    """
    Obtém a data e hora atual no fuso horário de Brasília.

    Returns:
        Datetime com timezone de Brasília
    """
    return datetime.now(BRASILIA_TZ)


def converter_para_brasilia(data: datetime) -> datetime:
    """
    Converte uma data para o fuso horário de Brasília.

    Args:
        data: Data a ser convertida (pode ser naive ou aware)

    Returns:
        Data no fuso horário de Brasília
    """
    if data.tzinfo is None:
        # Se a data não tem timezone, assume UTC
        data = UTC_TZ.localize(data)

    return data.astimezone(BRASILIA_TZ)


def converter_para_utc(data: datetime) -> datetime:
    """
    Converte uma data para UTC.

    Args:
        data: Data a ser convertida

    Returns:
        Data em UTC
    """
    if data.tzinfo is None:
        # Se a data não tem timezone, assume Brasília
        data = BRASILIA_TZ.localize(data)

    return data.astimezone(UTC_TZ)


def formatar_data_brasileira(
    data: datetime, incluir_hora: bool = True, incluir_segundos: bool = False
) -> str:
    """
    Formata data no padrão brasileiro.

    Args:
        data: Data a ser formatada
        incluir_hora: Se deve incluir horário
        incluir_segundos: Se deve incluir segundos

    Returns:
        String formatada
    """
    if incluir_hora:
        if incluir_segundos:
            return data.strftime("%d/%m/%Y %H:%M:%S")
        return data.strftime("%d/%m/%Y %H:%M")
    return data.strftime("%d/%m/%Y")


def parse_data_brasileira(texto: str) -> Optional[datetime]:
    """
    Faz parse de uma data no formato brasileiro.

    Args:
        texto: Texto com a data (DD/MM/AAAA ou DD/MM/AAAA HH:MM)

    Returns:
        Datetime ou None se inválido
    """
    formatos = [
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]

    for formato in formatos:
        try:
            return datetime.strptime(texto.strip(), formato)
        except ValueError:
            continue

    return None


def inicio_do_dia(data: datetime) -> datetime:
    """
    Retorna o início do dia (00:00:00) para uma data.

    Args:
        data: Data de referência

    Returns:
        Data às 00:00:00
    """
    return data.replace(hour=0, minute=0, second=0, microsecond=0)


def fim_do_dia(data: datetime) -> datetime:
    """
    Retorna o fim do dia (23:59:59) para uma data.

    Args:
        data: Data de referência

    Returns:
        Data às 23:59:59
    """
    return data.replace(hour=23, minute=59, second=59, microsecond=999999)


def diferenca_em_dias(data_inicio: datetime, data_fim: datetime) -> int:
    """
    Calcula a diferença em dias entre duas datas.

    Args:
        data_inicio: Data inicial
        data_fim: Data final

    Returns:
        Número de dias de diferença
    """
    # Normaliza para início do dia
    inicio = inicio_do_dia(data_inicio)
    fim = inicio_do_dia(data_fim)

    return (fim - inicio).days


def dias_desde(data: datetime) -> int:
    """
    Calcula quantos dias se passaram desde uma data.

    Args:
        data: Data de referência

    Returns:
        Número de dias passados
    """
    hoje = obter_data_atual_brasilia()
    return diferenca_em_dias(data, hoje)


def dias_ate(data: datetime) -> int:
    """
    Calcula quantos dias faltam até uma data.

    Args:
        data: Data alvo

    Returns:
        Número de dias restantes (negativo se já passou)
    """
    hoje = obter_data_atual_brasilia()
    return diferenca_em_dias(hoje, data)


def data_por_extenso(data: datetime) -> str:
    """
    Retorna a data por extenso em português.

    Args:
        data: Data a ser formatada

    Returns:
        Data por extenso (ex: "29 de dezembro de 2025")
    """
    meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ]

    return f"{data.day} de {meses[data.month - 1]} de {data.year}"


def dia_da_semana(data: datetime) -> str:
    """
    Retorna o dia da semana em português.

    Args:
        data: Data de referência

    Returns:
        Nome do dia da semana
    """
    dias = [
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    ]

    return dias[data.weekday()]
