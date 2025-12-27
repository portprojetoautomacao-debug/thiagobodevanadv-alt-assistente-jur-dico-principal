"""
Router de Prazos - Cálculo REAL de prazos processuais.
"""

import json
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


# Feriados nacionais 2024-2025 (DADOS REAIS)
FERIADOS_NACIONAIS = [
    "2024-01-01",  # Ano Novo
    "2024-02-13",  # Carnaval
    "2024-03-29",  # Sexta-feira Santa
    "2024-04-21",  # Tiradentes
    "2024-05-01",  # Dia do Trabalho
    "2024-05-30",  # Corpus Christi
    "2024-09-07",  # Independência
    "2024-10-12",  # Nossa Senhora Aparecida
    "2024-11-02",  # Finados
    "2024-11-15",  # Proclamação da República
    "2024-11-20",  # Consciência Negra
    "2024-12-25",  # Natal
    "2025-01-01",  # Ano Novo
    "2025-03-04",  # Carnaval
    "2025-04-18",  # Sexta-feira Santa
    "2025-04-21",  # Tiradentes
    "2025-05-01",  # Dia do Trabalho
    "2025-06-19",  # Corpus Christi
    "2025-09-07",  # Independência
    "2025-10-12",  # Nossa Senhora Aparecida
    "2025-11-02",  # Finados
    "2025-11-15",  # Proclamação da República
    "2025-11-20",  # Consciência Negra
    "2025-12-25",  # Natal
]


# Models
class PrazoCalculo(BaseModel):
    """Request para cálculo de prazo."""

    data_inicio: str  # ISO date
    dias: Optional[int] = None
    dias_corridos: Optional[int] = None  # Aceitar ambos
    tipo: Optional[str] = None  # corridos, uteis, ou tipo de manifestação
    tribunal: Optional[str] = None  # Para feriados locais

    @property
    def dias_final(self) -> int:
        """Retorna dias corridos ou dias."""
        return self.dias_corridos or self.dias or 0

    @property
    def tipo_prazo(self) -> str:
        """Retorna tipo de prazo normalizado."""
        # Se tipo não especificado ou é nome de manifestação, usar corridos
        if not self.tipo or self.tipo not in ["corridos", "uteis"]:
            return "corridos"
        return self.tipo


# Funções auxiliares REAIS
def eh_feriado(data: datetime) -> bool:
    """Verifica se é feriado nacional."""
    data_str = data.strftime("%Y-%m-%d")
    return data_str in FERIADOS_NACIONAIS


def eh_fim_de_semana(data: datetime) -> bool:
    """Verifica se é sábado ou domingo."""
    return data.weekday() >= 5  # 5=sábado, 6=domingo


def eh_dia_util(data: datetime) -> bool:
    """Verifica se é dia útil."""
    return not eh_fim_de_semana(data) and not eh_feriado(data)


def calcular_prazo_corridos(data_inicio: datetime, dias: int) -> datetime:
    """Calcula prazo em dias corridos."""
    return data_inicio + timedelta(days=dias)


def calcular_prazo_uteis(data_inicio: datetime, dias: int) -> datetime:
    """Calcula prazo em dias úteis."""
    data_atual = data_inicio
    dias_contados = 0

    while dias_contados < dias:
        data_atual += timedelta(days=1)

        if eh_dia_util(data_atual):
            dias_contados += 1

    return data_atual


# Endpoints
@router.post("/prazos/calcular")
async def calcular_prazo(request: PrazoCalculo):
    """Calcula prazo processual REAL."""

    try:
        # Parse data início
        data_inicio = datetime.fromisoformat(request.data_inicio.replace("Z", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Data início inválida")

    # Calcular prazo
    dias_total = request.dias_final
    tipo_prazo = request.tipo_prazo

    if tipo_prazo == "corridos":
        data_final = calcular_prazo_corridos(data_inicio, dias_total)
    elif tipo_prazo == "uteis":
        raise HTTPException(
            status_code=400, detail="Tipo deve ser 'corridos' ou 'uteis'"
        )

    # Ajustar se cair em feriado/fim de semana
    while not eh_dia_util(data_final):
        data_final += timedelta(days=1)

    return {
        "data_inicio": data_inicio.strftime("%Y-%m-%d"),
        "data_final": data_final.strftime("%Y-%m-%d"),
        "dias": dias_total,
        "tipo": tipo_prazo,
        "dias_corridos_total": (data_final - data_inicio).days,
        "prazo_final": data_final.isoformat(),
    }


@router.get("/prazos/feriados/{ano}")
async def listar_feriados(ano: int):
    """Lista feriados nacionais do ano."""
    feriados_ano = [f for f in FERIADOS_NACIONAIS if f.startswith(str(ano))]

    return {"ano": ano, "feriados": feriados_ano, "total": len(feriados_ano)}


@router.post("/prazos/verificar")
async def verificar_prazo(data: str):
    """Verifica se data é dia útil."""
    try:
        data_obj = datetime.fromisoformat(data.replace("Z", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")

    return {
        "data": data,
        "dia_util": eh_dia_util(data_obj),
        "fim_de_semana": eh_fim_de_semana(data_obj),
        "feriado": eh_feriado(data_obj),
        "dia_semana": data_obj.strftime("%A"),
    }
