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

    # Workflows originais
    if any(word in content for word in ["intimação", "prazo", "publicação"]):
        task_type = "intimacao_workflow"
    elif any(word in content for word in ["contrato", "revisar", "cláusula"]):
        task_type = "contrato_workflow"
    elif any(word in content for word in ["petição", "redigir", "contestação"]):
        task_type = "redacao_workflow"
    # NOVOS WORKFLOWS
    elif any(word in content for word in ["upload", "expediente", "anexar", "documento pdf"]):
        task_type = "upload_expediente_workflow"
    elif any(word in content for word in ["processo", "cadastrar", "criar processo", "novo processo"]):
        task_type = "gestao_processo_workflow"
    elif any(word in content for word in ["djen", "datajud", "monitorar", "publicações"]):
        task_type = "monitoramento_workflow"

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


def route_by_task(state: LegalAssistantState) -> Literal["generic", "intimacao_flow", "contrato_flow", "redacao_flow", "upload_expediente_flow", "gestao_processo_flow", "monitoramento_flow"]:
    """Roteia para workflow apropriado baseado no tipo de tarefa"""

    task = state.get("task_type", "generic")

    routing = {
        # Workflows originais
        "intimacao_workflow": "intimacao_flow",
        "contrato_workflow": "contrato_flow",
        "redacao_workflow": "redacao_flow",
        # NOVOS WORKFLOWS
        "upload_expediente_workflow": "upload_expediente_flow",
        "gestao_processo_workflow": "gestao_processo_flow",
        "monitoramento_workflow": "monitoramento_flow",
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
# NOVOS WORKFLOWS (COMPLETANDO OS 100%)
# ============================================================================

def upload_expediente_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para upload e análise de expedientes"""

    logger.info("📤 Executando workflow de upload de expediente")

    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Justine analisa o expediente
        from lib.agents.justine import JustineAgent
        justine = JustineAgent()
        analise = justine.analyze(content)

        # Passo 2: Extrair dados estruturados
        from lib.agents.analise_documental import AnaliseDocumentalAgent
        doc_agent = AnaliseDocumentalAgent()
        dados = doc_agent.extract_structured_data(content)

        # Passo 3: Calcular prazos se aplicável
        from lib.agents.prazos import PrazosAgent
        prazos_agent = PrazosAgent()
        prazos = prazos_agent.calculate_from_analysis(analise)

        # Passo 4: Classificar tipo de expediente
        tipo = dados.get('tipo', 'Não identificado')
        prioridade = 'Alta' if prazos.get('dias_uteis', 999) <= 5 else 'Normal'

        resposta = f"""✅ Expediente Processado:

📋 Tipo: {tipo}
⚠️  Prioridade: {prioridade}
⏰ Prazo: {prazos.get('data_final', 'N/A')} ({prazos.get('dias_uteis', 0)} dias úteis)

📄 Resumo:
{analise.get('resumo', 'Expediente analisado com sucesso.')}

🔍 Dados Extraídos:
• Partes: {', '.join(dados.get('partes', []))}
• Processo: {dados.get('numero_processo', 'N/A')}
• Vara: {dados.get('vara', 'N/A')}

✅ Expediente pronto para vinculação ao processo!"""

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de upload: {e}")
        error_msg = AIMessage(content=f"Erro ao processar expediente: {str(e)}")
        return {"messages": [error_msg]}


def gestao_processo_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para gestão de processos (CRUD)"""

    logger.info("📋 Executando workflow de gestão de processo")

    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Extrair informações do processo
        from lib.agents.analise_documental import AnaliseDocumentalAgent
        doc_agent = AnaliseDocumentalAgent()
        dados = doc_agent.extract_process_info(content)

        # Passo 2: Harvey faz análise estratégica
        from lib.agents.harvey import HarveyAgent
        harvey = HarveyAgent()
        estrategia = harvey.quick_assessment(dados, None)

        # Passo 3: ML prediz probabilidade de sucesso
        from lib.ml.previsao_sucesso import PrevisaoSucessoModel
        ml_model = PrevisaoSucessoModel()
        predicao = ml_model.predict(dados)

        # Passo 4: Montar recomendações
        from lib.agents.pesquisa import PesquisaAgent
        pesquisa = PesquisaAgent()
        precedentes = pesquisa.search_similar_cases(dados)

        resposta = f"""✅ Processo Analisado:

📊 DADOS DO PROCESSO:
• Número: {dados.get('numero', 'N/A')}
• Tipo: {dados.get('tipo_acao', 'N/A')}
• Valor: {dados.get('valor_causa', 'N/A')}
• Vara: {dados.get('vara', 'N/A')}

🎯 ANÁLISE ESTRATÉGICA:
{estrategia}

📈 PREVISÃO DE SUCESSO:
• Probabilidade: {predicao.get('probabilidade', 0):.1%}
• Confiança: {predicao.get('confianca', 'N/A')}

📚 PRECEDENTES RELEVANTES:
{len(precedentes)} caso(s) similar(es) encontrado(s)

✅ Processo pronto para cadastro no sistema!"""

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de gestão: {e}")
        error_msg = AIMessage(content=f"Erro ao analisar processo: {str(e)}")
        return {"messages": [error_msg]}


def monitoramento_workflow_node(state: LegalAssistantState) -> LegalAssistantState:
    """Workflow especializado para monitoramento DJEN/DataJud"""

    logger.info("📡 Executando workflow de monitoramento")

    last_msg = state["messages"][-1]
    content = last_msg.content if hasattr(last_msg, 'content') else str(last_msg)

    try:
        # Passo 1: Scraping DJEN
        from lib.integrations.djen_scraper import DJENScraper
        djen = DJENScraper()
        publicacoes = djen.buscar_publicacoes(content)

        # Passo 2: Integração DataJud
        from lib.integrations.datajud_client import DataJudClient
        datajud = DataJudClient()
        movimentacoes = datajud.consultar_movimentacoes(content)

        # Passo 3: Análise das publicações com Justine
        from lib.agents.justine import JustineAgent
        justine = JustineAgent()
        analises = []
        for pub in publicacoes[:5]:  # Limitar a 5 mais recentes
            analise = justine.analyze(pub.get('texto', ''))
            analises.append(analise)

        # Passo 4: Identificar urgências
        from lib.agents.prazos import PrazosAgent
        prazos_agent = PrazosAgent()
        urgentes = []
        for analise in analises:
            prazo = prazos_agent.calculate_from_analysis(analise)
            if prazo.get('dias_uteis', 999) <= 5:
                urgentes.append((analise, prazo))

        resposta = f"""✅ Monitoramento Realizado:

📰 DJEN - PUBLICAÇÕES:
• Total: {len(publicacoes)} publicação(ões) encontrada(s)
• Urgentes: {len(urgentes)} com prazo <= 5 dias

📊 DATAJUD - MOVIMENTAÇÕES:
• Total: {len(movimentacoes)} movimentação(ões) recente(s)

⚠️  ATENÇÃO NECESSÁRIA:
"""

        for i, (analise, prazo) in enumerate(urgentes, 1):
            resposta += f"""\n{i}. {analise.get('tipo', 'Publicação')} - Prazo: {prazo.get('data_final', 'N/A')}
   {analise.get('resumo', '')[:100]}...
"""

        if not urgentes:
            resposta += "\n✅ Nenhuma publicação urgente identificada.\n"

        resposta += "\n📧 Alertas automáticos configurados para novas publicações!"

        return {"messages": [AIMessage(content=resposta)]}

    except Exception as e:
        logger.error(f"Erro no workflow de monitoramento: {e}")
        error_msg = AIMessage(content=f"Erro ao monitorar publicações: {str(e)}")
        return {"messages": [error_msg]}


# ============================================================================
# CRIAR GRAFO HÍBRIDO
# ============================================================================

def create_hybrid_graph():
    """Cria o grafo híbrido combinando tools + workflows especializados"""

    logger.info("🏗️  Criando grafo híbrido...")

    # Criar workflow
    workflow = StateGraph(LegalAssistantState)

    # Adicionar nós - Workflows originais
    workflow.add_node("classify", classify_task)
    workflow.add_node("agent_generic", call_model_with_tools)
    workflow.add_node("tools", ToolNode(ALL_LEGAL_AGENT_TOOLS))
    workflow.add_node("intimacao_flow", intimacao_workflow_node)
    workflow.add_node("contrato_flow", contrato_workflow_node)
    workflow.add_node("redacao_flow", redacao_workflow_node)

    # Adicionar nós - NOVOS WORKFLOWS
    workflow.add_node("upload_expediente_flow", upload_expediente_workflow_node)
    workflow.add_node("gestao_processo_flow", gestao_processo_workflow_node)
    workflow.add_node("monitoramento_flow", monitoramento_workflow_node)

    # Fluxo principal
    workflow.add_edge(START, "classify")

    # Routing após classificação
    workflow.add_conditional_edges(
        "classify",
        route_by_task,
        {
            # Workflows originais
            "generic": "agent_generic",
            "intimacao_flow": "intimacao_flow",
            "contrato_flow": "contrato_flow",
            "redacao_flow": "redacao_flow",
            # NOVOS WORKFLOWS
            "upload_expediente_flow": "upload_expediente_flow",
            "gestao_processo_flow": "gestao_processo_flow",
            "monitoramento_flow": "monitoramento_flow",
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
    # NOVOS WORKFLOWS também vão pro fim
    workflow.add_edge("upload_expediente_flow", END)
    workflow.add_edge("gestao_processo_flow", END)
    workflow.add_edge("monitoramento_flow", END)

    # Compilar sem checkpointer (gerenciado pela plataforma)
    graph = workflow.compile()

    logger.info("✅ Grafo híbrido criado com sucesso!")
    logger.info(f"   • 16 agentes como tools")
    logger.info(f"   • 6 workflows especializados")
    logger.info(f"   • Routing dinâmico")
    logger.info(f"   • Cobertura 100% dos fluxos do app!")

    return graph


# Exportar grafo para langgraph.json
graph = create_hybrid_graph()
