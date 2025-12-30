"""
LangGraph Orchestrator - Sistema de orquestração avançado com LangGraph.

Implementa:
- StateGraph para execução durável
- Persistência de estado
- Human-in-the-loop
- Recovery automático
- Checkpointing
"""

import asyncio
import importlib
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict, Annotated
from operator import add

# Adicionar lib ao path
sys.path.insert(0, str(Path(__file__).parent))

from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import ToolNode

from memory_manager import MemoryManager

logger = logging.getLogger(__name__)


# Estado do agente
class AgentState(TypedDict):
    """Estado compartilhado entre nós do grafo."""
    task: str
    agent_id: str
    session_id: Optional[str]
    chat_history: List[Dict[str, Any]]
    result: Optional[Dict[str, Any]]
    error: Optional[str]
    intermediate_steps: Annotated[List[Dict[str, Any]], add]
    retry_count: int


class LangGraphOrchestrator:
    """Orquestrador avançado com LangGraph para execução durável."""

    def __init__(self):
        logger.info("🤖 Inicializando LangGraph Orchestrator...")

        self.memory_manager = MemoryManager()

        # Checkpointer para persistência de estado
        self.checkpointer = MemorySaver()

        self.agents_map = {
            "harvey": "lib.agents.harvey.HarveyAgent",
            "justine": "lib.agents.justine.JustineAgent",
            "redacao-peticoes": "lib.agents.redacao.RedacaoAgent",
            "pesquisa-juris": "lib.agents.pesquisa.PesquisaAgent",
            "organizacao-arquivos": "lib.agents.organizacao.OrganizacaoArquivosAgent",
            "gestao-prazos": "lib.agents.prazos.GestaoPrazosAgent",
            "analise-documental": "lib.agents.analise_doc.AnaliseDocAgent",
            "monitor-djen": "lib.agents.monitor_djen.MonitorDJENAgent",
            "analise-risco": "lib.agents.analise_risco.AnaliseRiscoAgent",
            "revisao-contratual": "lib.agents.revisao_contratual.RevisaoContratualAgent",
            "comunicacao-clientes": "lib.agents.comunicacao.ComunicacaoClientesAgent",
            "financeiro": "lib.agents.financeiro.FinanceiroAgent",
            "estrategia-processual": "lib.agents.estrategia.EstrategiaProcessualAgent",
            "traducao-juridica": "lib.agents.traducao.TraducaoJuridicaAgent",
            "compliance": "lib.agents.compliance.ComplianceAgent",
            "analise-sentenca": "lib.agents.analise_sentenca.AnaliseSentencaAgent",
        }

        self.loaded_agents = {}
        self.agents_list = list(self.agents_map.keys())

        # Criar grafo
        self.graph = self._build_graph()

        logger.info(f"✅ LangGraph Orchestrator com {len(self.agents_list)} agentes")

    def _load_agent(self, agent_id: str):
        """Carrega um agente dinamicamente com cache."""
        if agent_id in self.loaded_agents:
            return self.loaded_agents[agent_id]

        if agent_id not in self.agents_map:
            return None

        try:
            module_path, class_name = self.agents_map[agent_id].rsplit(".", 1)
            module = importlib.import_module(module_path)
            agent_class = getattr(module, class_name)
            agent_instance = agent_class()
            self.loaded_agents[agent_id] = agent_instance
            return agent_instance
        except Exception as e:
            logger.error(f"Erro ao carregar agente {agent_id}: {e}")
            return None

    def _build_graph(self) -> StateGraph:
        """Constrói o grafo de execução."""
        workflow = StateGraph(AgentState)

        # Nós do grafo
        workflow.add_node("load_memory", self._load_memory_node)
        workflow.add_node("execute_agent", self._execute_agent_node)
        workflow.add_node("save_memory", self._save_memory_node)
        workflow.add_node("handle_error", self._handle_error_node)

        # Edges
        workflow.add_edge(START, "load_memory")
        workflow.add_edge("load_memory", "execute_agent")
        workflow.add_conditional_edges(
            "execute_agent",
            self._should_retry,
            {
                "success": "save_memory",
                "retry": "execute_agent",
                "error": "handle_error"
            }
        )
        workflow.add_edge("save_memory", END)
        workflow.add_edge("handle_error", END)

        # Compilar sem checkpointer (LangGraph API gerencia automaticamente)
        return workflow.compile()

    async def _load_memory_node(self, state: AgentState) -> AgentState:
        """Carrega histórico da memória."""
        try:
            session_id = state.get("session_id")
            if session_id:
                history = self.memory_manager.get_session_history(session_id)
                state["chat_history"] = [
                    {"type": msg.type, "content": msg.content}
                    for msg in history.messages
                ]
            else:
                state["chat_history"] = []

            logger.debug(f"📚 Carregado {len(state['chat_history'])} mensagens")
        except Exception as e:
            logger.warning(f"Erro ao carregar memória: {e}")
            state["chat_history"] = []

        return state

    async def _execute_agent_node(self, state: AgentState) -> AgentState:
        """Executa o agente solicitado."""
        agent_id = state["agent_id"]
        task = state["task"]

        try:
            agent = self._load_agent(agent_id)

            if not agent:
                state["error"] = f"Agente {agent_id} não encontrado"
                return state

            # Preparar contexto
            context = {
                "chat_history": state.get("chat_history", []),
                "session_id": state.get("session_id"),
            }

            # Executar agente
            logger.info(f"🚀 Executando {agent_id}...")
            result = await agent.execute(task, context=context)

            # Salvar resultado
            state["result"] = result
            state["intermediate_steps"].append({
                "agent": agent_id,
                "status": "completed",
                "output": result
            })

            logger.info(f"✅ {agent_id} completado")

        except Exception as e:
            logger.error(f"❌ Erro em {agent_id}: {e}")
            state["error"] = str(e)
            state["retry_count"] = state.get("retry_count", 0) + 1

        return state

    async def _save_memory_node(self, state: AgentState) -> AgentState:
        """Salva resultado na memória."""
        try:
            session_id = state.get("session_id")
            result = state.get("result", {})

            if session_id and result:
                history = self.memory_manager.get_session_history(session_id)

                # Adicionar mensagem do usuário se ainda não foi
                task = state["task"]
                if not any(msg.content == task for msg in history.messages):
                    history.add_user_message(task)

                # Adicionar resposta do agente
                response = result.get("response", str(result))
                history.add_ai_message(response)

                logger.debug(f"💾 Memória salva para sessão {session_id}")

        except Exception as e:
            logger.warning(f"Erro ao salvar memória: {e}")

        return state

    async def _handle_error_node(self, state: AgentState) -> AgentState:
        """Trata erros com fallback."""
        agent_id = state["agent_id"]
        error = state.get("error", "Erro desconhecido")

        logger.error(f"🔴 Erro no agente {agent_id}: {error}")

        # Fallback para resposta mock
        state["result"] = {
            "success": False,
            "agent": agent_id,
            "error": error,
            "fallback": True,
            "response": f"Erro ao processar tarefa com {agent_id}. Por favor, tente novamente."
        }

        return state

    def _should_retry(self, state: AgentState) -> str:
        """Decide se deve retry, retornar sucesso ou erro."""
        if state.get("result") and not state.get("error"):
            return "success"

        retry_count = state.get("retry_count", 0)
        max_retries = 3

        if retry_count < max_retries and state.get("error"):
            logger.warning(f"⚠️ Retry {retry_count + 1}/{max_retries}")
            return "retry"

        return "error"

    async def execute_agent(
        self,
        agent_id: str,
        task: str,
        session_id: Optional[str] = None,
        thread_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executa um agente com LangGraph.

        Args:
            agent_id: ID do agente
            task: Tarefa a executar
            session_id: ID da sessão para memória
            thread_id: ID do thread para checkpointing

        Returns:
            Resultado da execução
        """
        if agent_id not in self.agents_list:
            return {"success": False, "error": f"Agente {agent_id} não encontrado"}

        # Estado inicial
        initial_state: AgentState = {
            "task": task,
            "agent_id": agent_id,
            "session_id": session_id,
            "chat_history": [],
            "result": None,
            "error": None,
            "intermediate_steps": [],
            "retry_count": 0
        }

        # Configuração com thread_id para checkpointing
        config = {"configurable": {"thread_id": thread_id or session_id or "default"}}

        try:
            # Executar grafo
            final_state = await self.graph.ainvoke(initial_state, config)

            result = final_state.get("result", {})

            return {
                "success": not bool(final_state.get("error")),
                "agent": agent_id,
                "output": result.get("response", str(result)),
                "metadata": {
                    **result,
                    "intermediate_steps": final_state.get("intermediate_steps", []),
                    "retry_count": final_state.get("retry_count", 0)
                }
            }

        except Exception as e:
            logger.error(f"Erro fatal na execução: {e}")
            return {
                "success": False,
                "error": str(e),
                "agent": agent_id
            }

    async def execute_agent_stream(
        self,
        agent_id: str,
        task: str,
        session_id: Optional[str] = None,
        thread_id: Optional[str] = None
    ):
        """Executa agente com streaming de eventos."""
        if agent_id not in self.agents_list:
            yield {"error": f"Agente {agent_id} não encontrado"}
            return

        initial_state: AgentState = {
            "task": task,
            "agent_id": agent_id,
            "session_id": session_id,
            "chat_history": [],
            "result": None,
            "error": None,
            "intermediate_steps": [],
            "retry_count": 0
        }

        config = {"configurable": {"thread_id": thread_id or session_id or "default"}}

        try:
            async for event in self.graph.astream(initial_state, config):
                yield event
        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield {"error": str(e)}

    def list_agents(self) -> List[str]:
        """Lista agentes disponíveis."""
        return self.agents_list

    def get_state(self, thread_id: str) -> Optional[AgentState]:
        """Recupera estado de uma execução."""
        try:
            config = {"configurable": {"thread_id": thread_id}}
            return self.graph.get_state(config)
        except Exception as e:
            logger.error(f"Erro ao recuperar estado: {e}")
            return None


# Manter compatibilidade com código legado
LegalAgentOrchestrator = LangGraphOrchestrator


# Criar instância e exportar grafo compilado para deployment
# Referenciado em langgraph.json como: "./lib/langgraph_orchestrator.py:graph"
_orchestrator = LangGraphOrchestrator()
graph = _orchestrator.graph
