"""
Router Metrics (Métricas dos agentes).
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
async def get_metrics():
    """Retorna métricas dos agentes."""

    # Mock data (seria calculado de verdade)
    return {
        "totalExecutions": 0,
        "successRate": 0,
        "avgLatency": 0,
        "agents": {
            "harvey": {
                "totalExecutions": 0,
                "successRate": 100,
                "avgLatency": 0
            }
        }
    }
