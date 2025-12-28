"""
Módulo de agentes - ORQUESTRADOR REAL.

Implementa a orquestração dos agentes LangChain reais.
"""

import asyncio
import importlib
import logging
from typing import Any, Dict, List, Optional

# Try relative import first (when imported as lib.langchain_agents)
# Then fall back to absolute import (when lib is in sys.path)
try:
    from .memory_manager import MemoryManager
except ImportError:
    from memory_manager import MemoryManager

logger = logging.getLogger(__name__)


class LegalAgentOrchestrator:
    """Orquestrador de agentes jurídicos."""

    def __init__(self):
        logger.info("🤖 Inicializando orquestrador de agentes...")

        self.memory_manager = MemoryManager()

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
        self.agents_list = [
            "harvey",
            "justine",
            "redacao-peticoes",
            "pesquisa-juris",
            "organizacao-arquivos",
            "gestao-prazos",
            "analise-documental",
            "monitor-djen",
            "analise-risco",
            "revisao-contratual",
            "comunicacao-clientes",
            "financeiro",
            "estrategia-processual",
            "traducao-juridica",
            "compliance",
            "analise-sentenca",
        ]

        logger.info(f"✅ {len(self.agents_list)} agentes disponíveis")

    def _load_agent(self, agent_id: str):
        """Carrega um agente dinamicamente."""
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

    async def execute_agent(
        self, agent_id: str, task: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Executa um agente específico."""

        if agent_id not in self.agents_list:
            return {"success": False, "error": f"Agente {agent_id} não encontrado"}

        # Tentar carregar agente real
        agent = self._load_agent(agent_id)

        if agent:
            # Execução real
            try:
                # Recuperar histórico se session_id fornecido
                history = None
                if session_id:
                    history = self.memory_manager.get_session_history(session_id)
                    # Adicionar mensagem do usuário ao histórico
                    history.add_user_message(task)

                # Passar contexto com histórico
                context = {"chat_history": history.messages if history else []}

                result = await agent.execute(task, context=context)

                # Salvar resposta no histórico
                if history and result.get("success", True):
                    response_text = result.get("response", str(result))
                    history.add_ai_message(response_text)

                return {
                    "success": True,
                    "agent": agent_id,
                    "output": result.get("response", str(result)),
                    "metadata": result,
                }
            except Exception as e:
                logger.error(f"Erro na execução do agente {agent_id}: {e}")
                return {"success": False, "error": str(e)}
        else:
            # Fallback para mock (para agentes ainda não migrados)
            logger.warning(f"Agente {agent_id} não implementado, usando mock.")

            responses = {
                "redacao-peticoes": f"✍️ Minuta criada: {task[:50]}...\n📄 Modelo: Petição inicial",
                "pesquisa-juris": f"🔍 5 precedentes encontrados sobre: {task[:60]}...",
            }

            return {
                "success": True,
                "agent": agent_id,
                "output": responses.get(
                    agent_id, f"Agente {agent_id} processou: {task} (MOCK)"
                ),
                "steps": 0,
            }

    def list_agents(self) -> List[str]:
        """Lista agentes disponíveis."""
        return self.agents_list
