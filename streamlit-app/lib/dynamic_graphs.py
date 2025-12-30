"""
Dynamic Graph Builder - Rebuild graphs at runtime baseado em configuração.

Permite criar grafos diferentes baseados em contexto, usuário ou tipo de tarefa.
"""

import logging
from typing import Optional, Dict, Any

from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

try:
    from .langgraph_orchestrator import AgentState, LangGraphOrchestrator
except ImportError:
    from langgraph_orchestrator import AgentState, LangGraphOrchestrator

logger = logging.getLogger(__name__)


def make_simple_agent_graph(agent_id: str):
    """
    Cria grafo simples para um agente específico.

    Args:
        agent_id: ID do agente

    Returns:
        Grafo compilado
    """
    orchestrator = LangGraphOrchestrator()

    workflow = StateGraph(AgentState)

    # Nós simplificados
    async def execute_node(state: AgentState) -> AgentState:
        agent = orchestrator._load_agent(agent_id)
        if agent:
            result = await agent.execute(state["task"])
            state["result"] = result
        return state

    workflow.add_node("execute", execute_node)
    workflow.add_edge(START, "execute")
    workflow.add_edge("execute", END)

    return workflow.compile(checkpointer=MemorySaver())


def make_multi_agent_graph():
    """
    Cria grafo com múltiplos agentes em sequência.

    Fluxo: Harvey (análise) → Justine (prazos) → Redação (minuta)
    """
    orchestrator = LangGraphOrchestrator()

    workflow = StateGraph(AgentState)

    # Nós
    async def harvey_node(state: AgentState) -> AgentState:
        agent = orchestrator._load_agent("harvey")
        result = await agent.execute(state["task"])
        state["intermediate_steps"].append({"agent": "harvey", "result": result})
        return state

    async def justine_node(state: AgentState) -> AgentState:
        agent = orchestrator._load_agent("justine")
        # Usar resultado anterior como contexto
        prev_result = state["intermediate_steps"][-1]["result"]
        task = f"Analisar prazos baseado em: {prev_result}"
        result = await agent.execute(task)
        state["intermediate_steps"].append({"agent": "justine", "result": result})
        return state

    async def redacao_node(state: AgentState) -> AgentState:
        agent = orchestrator._load_agent("redacao-peticoes")
        # Consolidar resultados
        context = "\n".join([
            step["result"].get("response", "")
            for step in state["intermediate_steps"]
        ])
        task = f"Criar minuta baseado em: {context}"
        result = await agent.execute(task)
        state["result"] = result
        return state

    workflow.add_node("harvey", harvey_node)
    workflow.add_node("justine", justine_node)
    workflow.add_node("redacao", redacao_node)

    workflow.add_edge(START, "harvey")
    workflow.add_edge("harvey", "justine")
    workflow.add_edge("justine", "redacao")
    workflow.add_edge("redacao", END)

    return workflow.compile(checkpointer=MemorySaver())


def make_conditional_graph():
    """
    Cria grafo com roteamento condicional baseado no tipo de tarefa.
    """
    orchestrator = LangGraphOrchestrator()

    workflow = StateGraph(AgentState)

    # Nó de roteamento
    def route_task(state: AgentState) -> str:
        task_lower = state["task"].lower()

        if "intimação" in task_lower or "prazo" in task_lower:
            return "justine"
        elif "contrato" in task_lower or "análise" in task_lower:
            return "harvey"
        elif "petição" in task_lower or "minuta" in task_lower:
            return "redacao"
        else:
            return "harvey"  # Default

    # Nós de execução
    async def execute_agent_node(state: AgentState) -> AgentState:
        agent_id = state.get("routed_agent", state["agent_id"])
        agent = orchestrator._load_agent(agent_id)

        if agent:
            result = await agent.execute(state["task"])
            state["result"] = result

        return state

    workflow.add_node("execute", execute_agent_node)
    workflow.add_edge(START, "execute")
    workflow.add_edge("execute", END)

    return workflow.compile(checkpointer=MemorySaver())


def make_graph(config: RunnableConfig):
    """
    Factory function para criar grafos dinamicamente baseado em config.

    Esta função é chamada pelo LangSmith em cada run, permitindo
    diferentes estruturas de grafo baseadas no contexto.

    Args:
        config: Configuração do run contendo metadata customizada

    Returns:
        Grafo compilado apropriado para o contexto

    Usage no langgraph.json:
        {
            "graphs": {
                "dynamic_assistant": "./lib/dynamic_graphs.py:make_graph"
            }
        }

    Usage ao invocar:
        remote_graph.invoke(
            {"task": "...", "agent_id": "harvey"},
            config={
                "configurable": {
                    "graph_type": "multi_agent",
                    "user_tier": "premium"
                }
            }
        )
    """
    # Extrair configurações
    configurable = config.get("configurable", {})
    graph_type = configurable.get("graph_type", "standard")
    user_tier = configurable.get("user_tier", "free")
    agent_id = configurable.get("agent_id")

    logger.info(f"🔧 Criando grafo: type={graph_type}, tier={user_tier}, agent={agent_id}")

    # Roteamento baseado em tipo
    if graph_type == "simple" and agent_id:
        # Grafo simples para um agente específico
        return make_simple_agent_graph(agent_id)

    elif graph_type == "multi_agent":
        # Workflow com múltiplos agentes
        return make_multi_agent_graph()

    elif graph_type == "conditional":
        # Roteamento inteligente
        return make_conditional_graph()

    elif user_tier == "premium":
        # Usuários premium: grafo completo
        return make_multi_agent_graph()

    else:
        # Padrão: orquestrador completo
        orchestrator = LangGraphOrchestrator()
        return orchestrator.graph


# Example usage
"""
# Para usar no langgraph.json:
{
    "graphs": {
        "dynamic_assistant": "./lib/dynamic_graphs.py:make_graph"
    }
}

# Ao invocar, passar configuração:
from langgraph.pregel.remote import RemoteGraph

remote_graph = RemoteGraph("dynamic_assistant", url="...")

# Grafo simples
result = await remote_graph.ainvoke(
    {"task": "Analisar", "agent_id": "harvey"},
    config={
        "configurable": {
            "graph_type": "simple",
            "agent_id": "harvey"
        }
    }
)

# Multi-agent workflow
result = await remote_graph.ainvoke(
    {"task": "Processo completo"},
    config={
        "configurable": {
            "graph_type": "multi_agent"
        }
    }
)

# Por tier de usuário
result = await remote_graph.ainvoke(
    {"task": "Analisar contrato"},
    config={
        "configurable": {
            "user_tier": "premium"
        }
    }
)
"""
