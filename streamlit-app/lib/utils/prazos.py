"""
Utilitários para cálculo de prazos processuais
"""

from datetime import datetime, timedelta
from typing import Literal

# Feriados nacionais fixos
FERIADOS_NACIONAIS = [
    (1, 1),  # Confraternização Universal
    (4, 21),  # Tiradentes
    (5, 1),  # Dia do Trabalho
    (9, 7),  # Independência do Brasil
    (10, 12),  # Nossa Senhora Aparecida
    (11, 2),  # Finados
    (11, 15),  # Proclamação da República
    (12, 25),  # Natal
]

# Feriados móveis (aproximados para 2024/2025)
FERIADOS_MOVEIS = {
    2024: [
        (2, 12),  # Carnaval
        (2, 13),  # Carnaval
        (3, 29),  # Sexta-feira Santa
        (5, 30),  # Corpus Christi
    ],
    2025: [
        (3, 3),  # Carnaval
        (3, 4),  # Carnaval
        (4, 18),  # Sexta-feira Santa
        (6, 19),  # Corpus Christi
    ],
}


def eh_feriado(data: datetime) -> bool:
    """
    Verifica se uma data é feriado nacional.

    Args:
        data: Data a ser verificada

    Returns:
        True se for feriado, False caso contrário
    """
    mes_dia = (data.month, data.day)

    # Verifica feriados fixos
    if mes_dia in FERIADOS_NACIONAIS:
        return True

    # Verifica feriados móveis do ano
    ano = data.year
    if ano in FERIADOS_MOVEIS:
        if mes_dia in FERIADOS_MOVEIS[ano]:
            return True

    return False


def eh_dia_util(data: datetime) -> bool:
    """
    Verifica se uma data é dia útil (não é fim de semana nem feriado).

    Args:
        data: Data a ser verificada

    Returns:
        True se for dia útil, False caso contrário
    """
    # Fim de semana (5 = sábado, 6 = domingo)
    if data.weekday() >= 5:
        return False

    # Feriado
    if eh_feriado(data):
        return False

    return True


def calcular_prazo(
    data_inicio: datetime, dias: int, tipo: Literal["corridos", "uteis"] = "corridos"
) -> datetime:
    """
    Calcula a data final de um prazo.

    Args:
        data_inicio: Data de início do prazo
        dias: Número de dias do prazo
        tipo: "corridos" para dias corridos, "uteis" para dias úteis

    Returns:
        Data final do prazo
    """
    if tipo == "corridos":
        return data_inicio + timedelta(days=dias)

    # Dias úteis
    data_atual = data_inicio
    dias_contados = 0

    while dias_contados < dias:
        data_atual += timedelta(days=1)
        if eh_dia_util(data_atual):
            dias_contados += 1

    return data_atual


def calcular_prazo_processual(
    data_publicacao: datetime, dias: int, tipo: Literal["corridos", "uteis"] = "uteis"
) -> datetime:
    """
    Calcula prazo processual considerando a regra de início no primeiro dia útil.

    Args:
        data_publicacao: Data da publicação
        dias: Número de dias do prazo
        tipo: Tipo de contagem

    Returns:
        Data final do prazo
    """
    # O prazo começa no primeiro dia útil após a publicação
    data_inicio = data_publicacao
    while not eh_dia_util(data_inicio):
        data_inicio += timedelta(days=1)

    return calcular_prazo(data_inicio, dias, tipo)
