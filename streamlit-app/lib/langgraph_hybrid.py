"""
LangGraph Híbrido - Combina Tools + Nós Especializados.

Este é o grafo principal que integra todos os 16 agentes de forma inteligente:
- Tools para casos genéricos (LLM decide)
- Nós especializados para workflows fixos (fluxos comuns)
- Routing dinâmico baseado no tipo de tarefa
"""

import os
import sys
from pathlib import Path
from typing import Literal, TypedDict, Annotated, Sequence
from operator import add
import logging

# Adicionar lib ao path
sys.path.insert(0, str(Path(__file__).parent))

from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langchain_google_genai import ChatGoogleGenerativeAI

# Importar tools dos agentes
from langgraph_agents_tools import (
    ALL_LEGAL_AGENT_TOOLS,
    get_tools_by_category,
)

logger = logging.getLogger(__name__)


# ============================================================================
# ESTADO DO GRAFO
# ============================================================================

class LegalAssistantState(TypedDict):
    """Estado do assistente jurídico"""
    messages: Annotated[Sequence[BaseMessage], add]
    task_type: str  # tipo de tarefa identificada
    workflow_mode: str  # modo: generic, specialized, hybrid


# ============================================================================
# CONFIGURAÇÃO
# ============================================================================

class Configuration(TypedDict):
    """Configuração do assistente"""
    model: str
    temperature: float
    max_tokens: int


DEFAULT_CONFIG = Configuration(
    model=os.getenv("GOOGLE_MODEL", "gemini-1.5-flash"),
    temperature=float(os.getenv("MODEL_TEMPERATURE", "0.3")),
    max_tokens=int(os.getenv("MAX_COMPLETION_TOKENS", "2000"))
)


# ============================================================================
# NÓS DO GRAFO
# ============================================================================

def classify_task(state: LegalAssistantState) -> LegalAssistantState:
    """Classifica o tipo de tarefa do usuário"""

    last_message = state["messages"][-1]
    content = last_message.content.lower() if hasattr(last_message, 'content') else ""

    # Classificação simples baseada em palavras-chave
    task_type = "generic"

    if any(word in content for word in ["intimação", "prazo", "publicação"]):
        task_type = "intimacao_workflow"
    elif any(word in content for word in ["contrato", "revisar", "cláusula"]):
        task_type = "contrato_workflow"
    elif any(word in content for word in ["petição", "redigir", "contestação"]):
        task_type = "redacao_workflow"

    logger.info(f"📋 Tarefa classificada como: {task_type}")

    return {"task_type": task_type}


def call_model_with_tools(state: LegalAssistantState) -> LegalAssistantState:
    """Chama o modelo com acesso a todas as tools dos agentes"""

    # Criar modelo com tools
    model = ChatGoogleGenerativeAI(
        model=DEFAULT_CONFIG["model"],
        temperature=DEFAULT_CONFIG["temperature"],
        max_output_tokens=DEFAULT_CONFIG["max_tokens"],
        google_api_key=os.getenv("GOOGLE_API_KEY")
    ).bind_tools(ALL_LEGAL_AGENT_TOOLS)

    try:
        response = model.invoke(state["messages"])
        return {"messages": [response]}
    except Exception as e:
        logger.error(f"Erro ao chamar modelo: {e}")
        error_msg = AIMessage(content=f"Desculpe, ocorreu um erro: {str(e)}")
        return {"messages": [error_msg]}


def should_continue_generic(state: LegalAssistantState) -> Literal["tools", "__end__"]:
    """Decide se deve executar tools ou terminar"""

    last_message = state["messages"][-1]

    # Se tem tool calls, executar
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        return "tools"

    return "__end__"


def route_by_task(state: LegalAssistantState) -> Literal["generic", "intimacao_flow", "contrato_flow", "redacao_flow"]:
    """Roteia para workflow apropriado baseado no tipo de tarefa"""

    task = state.get("task_type", "generic")

    routing = {
        "intimacao_workflow": "intimacao_flow",
        "contrato_workflow": "contrato_flow",
        "redacao_workflow": "redacao_flow",
    }

    return routing.get(task, "generic")


# ============================================================================
# WORKFLOWS ESPECIALIZADOS
# ============================================================================

def intimacao_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para processar intimações"""

    logger.info("📨 Executando workflow de intimação especializado")

    # Extrair intimação da última mensagem
    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Justine analisa intimação
        from lib.agents.justine import JustineAgent
        justine = JustineAgent()
        analise = justine.analyze(content)

        # Passo 2: Calcular prazos
        from lib.agents.prazos import PrazosAgent
        prazos_agent = PrazosAgent()
        prazos = prazos_agent.calculate_from_analysis(analise)

        # Passo 3: Verificar se precisa de ação
        from lib.agents.harvey import HarveyAgent
        harvey = HarveyAgent()
        estrategia = harvey.quick_assessment(analise, prazos)

        # Montar resposta
        resposta = f"""✅ Intimação Analisada:

📋 Análise: {analise.get('resumo', 'N/A')}
⏰ Prazo: {prazos.get('data_final', 'N/A')} ({prazos.get('dias_uteis', 0)} dias úteis)
🎯 Recomendação: {estrategia}

{analise.get('detalhes', '')}"""

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de intimação: {e}")
        error_msg = AIMessage(content=f"Erro ao processar intimação: {str(e)}")
        return {"messages": [error_msg]}


def contrato_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para análise de contratos"""

    logger.info("📄 Executando workflow de contrato especializado")

    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Revisão contratual
        from lib.agents.revisao_contratual import RevisaoAgent
        revisao = RevisaoAgent()
        analise = revisao.review(content)

        # Passo 2: Compliance LGPD
        from lib.agents.compliance import ComplianceAgent
        compliance = ComplianceAgent()
        lgpd = compliance.check(content)

        # Passo 3: Análise de risco
        from lib.agents.analise_risco import AnaliseRiscoAgent
        risco = AnaliseRiscoAgent()
        riscos = risco.analyze_contract(analise)

        # Montar resposta
        resposta = f"""✅ Contrato Analisado:

📋 Cláusulas Problemáticas: {len(analise.get('problemas', []))}
⚖️  Conformidade LGPD: {lgpd.get('status', 'N/A')}
⚠️  Nível de Risco: {riscos.get('nivel', 'N/A')}

Principais Achados:
{analise.get('resumo', 'Análise completa realizada.')}

Recomendações:
{analise.get('recomendacoes', 'Ver análise detalhada.')}"""

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de contrato: {e}")
        error_msg = AIMessage(content=f"Erro ao analisar contrato: {str(e)}")
        return {"messages": [error_msg]}


def redacao_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para redação de documentos"""

    logger.info("✍️  Executando workflow de redação especializado")

    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Pesquisa jurisprudencial
        from lib.agents.pesquisa import PesquisaAgent
        pesquisa = PesquisaAgent()
        precedentes = pesquisa.search(content)

        # Passo 2: Redação
        from lib.agents.redacao import RedacaoAgent
        redacao = RedacaoAgent()
        documento = redacao.generate_with_research(content, precedentes)

        # Passo 3: Revisão
        from lib.agents.revisao_contratual import RevisaoAgent
        revisao = RevisaoAgent()
        documento_final = revisao.quick_review(documento)

        resposta = f"""✅ Documento Redigido:

{documento_final}

---
📚 Baseado em {len(precedentes)} precedente(s) jurisprudencial(is)
✅ Revisão automática concluída"""

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de redação: {e}")
        error_msg = AIMessage(content=f"Erro ao redigir documento: {str(e)}")
        return {"messages": [error_msg]}


# ============================================================================
# CRIAR GRAFO HÍBRIDO
# ============================================================================

def create_hybrid_graph():
    """Cria o grafo híbrido combinando tools + workflows especializados"""

    logger.info("🏗️  Criando grafo híbrido...")

    # Criar workflow
    workflow = StateGraph(LegalAssistantState)

    # Adicionar nós
    workflow.add_node("classify", classify_task)
    workflow.add_node("agent_generic", call_model_with_tools)
    workflow.add_node("tools", ToolNode(ALL_LEGAL_AGENT_TOOLS))
    workflow.add_node("intimacao_flow", intimacao_workflow_node)
    workflow.add_node("contrato_flow", contrato_workflow_node)
    workflow.add_node("redacao_flow", redacao_workflow_node)

    # Fluxo principal
    workflow.add_edge(START, "classify")

    # Routing após classificação
    workflow.add_conditional_edges(
        "classify",
        route_by_task,
        {
            "generic": "agent_generic",
            "intimacao_flow": "intimacao_flow",
            "contrato_flow": "contrato_flow",
            "redacao_flow": "redacao_flow",
        }
    )

    # Fluxo genérico com tools
    workflow.add_conditional_edges(
        "agent_generic",
        should_continue_generic,
        {
            "tools": "tools",
            "__end__": END
        }
    )
    workflow.add_edge("tools", "agent_generic")

    # Workflows especializados vão direto pro fim
    workflow.add_edge("intimacao_flow", END)
    workflow.add_edge("contrato_flow", END)
    workflow.add_edge("redacao_flow", END)

    # Compilar sem checkpointer (gerenciado pela plataforma)
    graph = workflow.compile()

    logger.info("✅ Grafo híbrido criado com sucesso!")
    logger.info(f"   • 16 agentes como tools")
    logger.info(f"   • 3 workflows especializados")
    logger.info(f"   • Routing dinâmico")

    return graph


# Exportar grafo para langgraph.json
graph = create_hybrid_graph()
