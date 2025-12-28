"""
Router Agentes - LangChain Agents.

Endpoints para execução de agentes IA.
"""

import sys
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# Add lib to path
sys.path.append(str(Path(__file__).parent.parent.parent / "lib"))

from langchain_agents import LegalAgentOrchestrator

router = APIRouter()

# Singleton orchestrator
orchestrator = None


def get_orchestrator():
    """Get or create orchestrator."""
    global orchestrator
    if orchestrator is None:
        orchestrator = LegalAgentOrchestrator()
    return orchestrator


# Modelos
class AgentTaskRequest(BaseModel):
    agentId: str
    task: dict


class AgentExecuteRequest(BaseModel):
    agent: Optional[str] = None
    agente_id: Optional[str] = None  # Aceitar português também
    input: str
    options: Optional[Dict[str, Any]] = None

    @property
    def agent_id_final(self) -> str:
        """Retorna ID do agente."""
        return self.agente_id or self.agent or "harvey"


# Endpoints
@router.get("/agents")
@router.get("/agentes")  # Aceitar também em português
async def list_agents():
    """Lista todos os agentes disponíveis."""

    orch = get_orchestrator()
    agent_ids = orch.list_agents()

    # Metadata dos agentes
    agents_metadata = {
        "harvey": {
            "id": "harvey",
            "name": "Harvey Specter",
            "description": "Estrategista-chefe do escritório",
            "icon": "🎯",
            "capabilities": ["analise_estrategica", "avaliacao_risco"],
        },
        "justine": {
            "id": "justine",
            "name": "Mrs. Justin-e",
            "description": "Especialista em intimações e prazos",
            "icon": "📋",
            "capabilities": ["extrair_prazo", "classificar_tipo", "gerar_tarefa"],
        },
        "redacao-peticoes": {
            "id": "redacao-peticoes",
            "name": "Redator Jurídico",
            "description": "Criação de petições e documentos",
            "icon": "✍️",
            "capabilities": [
                "buscar_modelo",
                "buscar_precedentes",
                "validar_formatacao",
            ],
        },
        "pesquisa-juris": {
            "id": "pesquisa-juris",
            "name": "Pesquisador Jurisprudencial",
            "description": "Busca de precedentes e jurisprudência",
            "icon": "🔍",
            "capabilities": ["buscar_stf", "buscar_stj", "buscar_qdrant"],
        },
    }

    # Adicionar metadata para outros agentes
    for agent_id in agent_ids:
        if agent_id not in agents_metadata:
            agents_metadata[agent_id] = {
                "id": agent_id,
                "name": agent_id.replace("-", " ").title(),
                "description": f"Agente {agent_id}",
                "icon": "🤖",
                "capabilities": [],
            }

    agents_list = [agents_metadata[id] for id in agent_ids if id in agents_metadata]

    # Retornar lista direta para compatibilidade com testes
    return agents_list


@router.post("/agents/process-task")
async def process_task(request: AgentTaskRequest):
    """Executa tarefa em um agente específico."""

    try:
        orch = get_orchestrator()

        # Extrair input da tarefa
        task_input = (
            request.task.get("input")
            or request.task.get("description")
            or str(request.task)
        )

        # Executar agente (async)
        result = await orch.execute_agent(request.agentId, task_input)

        return {
            "success": result.get("success", False),
            "agent": request.agentId,
            "result": result,
            "timestamp": "2025-12-27T12:00:00Z",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/execute")
@router.post("/agentes/executar")  # Português
async def execute_agent(request: AgentExecuteRequest):
    """Executa agente diretamente."""

    try:
        orch = get_orchestrator()

        result = await orch.execute_agent(request.agent_id_final, request.input)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/agents/run-all")
async def run_all_agents():
    """Executa todos os agentes principais."""
    try:
        orch = get_orchestrator()
        agents_to_run = ["harvey", "justine", "monitor-djen"]  # Exemplo

        results = {}
        for agent_id in agents_to_run:
            # Executar tarefa padrão de verificação
            result = await orch.execute_agent(
                agent_id, "Verificar pendências e status atual"
            )
            results[agent_id] = result

        return {"success": True, "count": len(results), "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}")
async def get_agent_info(agent_id: str):
    """Retorna informações de um agente específico."""

    orch = get_orchestrator()
    agents = orch.list_agents()

    if agent_id not in agents:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return {
        "id": agent_id,
        "name": agent_id.replace("-", " ").title(),
        "status": "active",
        "available": True,
    }


@router.get("/agents/{agent_id}/status")
async def get_agent_status(agent_id: str):
    """Status de um agente."""

    return {
        "agent": agent_id,
        "status": "idle",
        "lastActivity": "2025-12-27T12:00:00Z",
        "tasksCompleted": 0,
    }
