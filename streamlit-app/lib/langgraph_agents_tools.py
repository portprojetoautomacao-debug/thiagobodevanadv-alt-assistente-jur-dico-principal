"""
Integração dos 16 Agentes como LangChain Tools para LangGraph.

Este módulo transforma cada agente especializado em uma tool que pode ser
chamada dinamicamente pelo LLM no grafo LangGraph.
"""

from langchain_core.tools import tool
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# AGENTE 1: Harvey Specter - Estrategista
# ============================================================================

@tool
def harvey_estrategista(caso: str) -> str:
    """
    Harvey Specter - Estrategista-chefe para análise estratégica de casos jurídicos.

    Use quando precisar de:
    - Estratégia geral do caso
    - Análise de viabilidade
    - Recomendações táticas
    - Visão geral estratégica

    Args:
        caso: Descrição completa do caso ou questão estratégica

    Returns:
        Análise estratégica e recomendações
    """
    try:
        from lib.agents.harvey import HarveyAgent
        agent = HarveyAgent()
        return agent.strategize(caso)
    except Exception as e:
        logger.error(f"Erro no harvey_estrategista: {e}")
        return f"Erro ao executar análise estratégica: {str(e)}"


# ============================================================================
# AGENTE 2: Mrs. Justine - Análise de Intimações
# ============================================================================

@tool
def justine_analise_intimacoes(intimacao: str) -> Dict[str, Any]:
    """
    Mrs. Justine - Especialista em análise de intimações e prazos processuais.

    Use quando precisar de:
    - Análise de intimação
    - Identificação de prazos
    - Verificação de urgências
    - Classificação de publicações

    Args:
        intimacao: Texto da intimação ou publicação oficial

    Returns:
        Dicionário com análise, prazos e urgências identificadas
    """
    try:
        from lib.agents.justine import JustineAgent
        agent = JustineAgent()
        return agent.analyze(intimacao)
    except Exception as e:
        logger.error(f"Erro no justine_analise_intimacoes: {e}")
        return {"erro": str(e), "status": "falha"}


# ============================================================================
# AGENTE 3: Monitor DJEN
# ============================================================================

@tool
def monitor_djen_publicacoes(busca: str = "") -> List[Dict[str, Any]]:
    """
    Monitor DJEN - Monitoramento de publicações oficiais do Diário de Justiça.

    Use quando precisar de:
    - Buscar publicações no DJEN
    - Monitorar intimações
    - Verificar novas publicações

    Args:
        busca: Termo de busca ou número de processo (opcional)

    Returns:
        Lista de publicações encontradas
    """
    try:
        from lib.agents.monitor_djen import MonitorDJENAgent
        agent = MonitorDJENAgent()
        return agent.search_publications(busca)
    except Exception as e:
        logger.error(f"Erro no monitor_djen: {e}")
        return [{"erro": str(e)}]


# ============================================================================
# AGENTE 4: Análise Documental
# ============================================================================

@tool
def analise_documento(documento: str, tipo: str = "geral") -> Dict[str, Any]:
    """
    Análise Documental - Análise completa de documentos jurídicos.

    Use quando precisar de:
    - Analisar expedientes
    - Extrair informações de documentos
    - Classificar documentos
    - Identificar pontos relevantes

    Args:
        documento: Texto do documento a analisar
        tipo: Tipo do documento (peticao, contrato, sentenca, etc)

    Returns:
        Análise detalhada do documento
    """
    try:
        from lib.agents.analise_doc import AnaliseDocAgent
        agent = AnaliseDocAgent()
        return agent.analyze(documento, tipo)
    except Exception as e:
        logger.error(f"Erro no analise_documento: {e}")
        return {"erro": str(e), "status": "falha"}


# ============================================================================
# AGENTE 5: Gestão de Prazos
# ============================================================================

@tool
def calcular_prazos(
    data_intimacao: str,
    tipo_prazo: str,
    dias: int = 15
) -> Dict[str, str]:
    """
    Gestão de Prazos - Cálculo de prazos processuais com dias úteis.

    Use quando precisar de:
    - Calcular prazo de resposta
    - Verificar vencimentos
    - Contagem de dias úteis
    - Considerar feriados

    Args:
        data_intimacao: Data da intimação (formato: DD/MM/YYYY)
        tipo_prazo: Tipo (contestacao, recurso, manifestacao, etc)
        dias: Número de dias do prazo

    Returns:
        Dicionário com data_final, dias_uteis, alertas
    """
    try:
        from lib.agents.prazos import PrazosAgent
        agent = PrazosAgent()
        return agent.calculate(data_intimacao, tipo_prazo, dias)
    except Exception as e:
        logger.error(f"Erro no calcular_prazos: {e}")
        return {"erro": str(e), "data_final": None}


# ============================================================================
# AGENTE 6: Redação de Petições
# ============================================================================

@tool
def redigir_peticao(
    tipo: str,
    contexto: str,
    partes: Optional[str] = None
) -> str:
    """
    Redação de Petições - Geração automática de documentos jurídicos.

    Use quando precisar de:
    - Redigir petição inicial
    - Gerar contestação
    - Criar recursos (apelação, agravo)
    - Manifestações processuais

    Tipos suportados:
    - peticao_inicial, contestacao, reconvencao
    - apelacao, agravo, embargos
    - alegacoes_finais, manifestacao

    Args:
        tipo: Tipo de petição a redigir
        contexto: Fatos e argumentos do caso
        partes: JSON com dados das partes (autor, réu, etc)

    Returns:
        Texto da petição formatada
    """
    try:
        from lib.agents.redacao import RedacaoAgent
        agent = RedacaoAgent()
        return agent.generate(tipo, contexto, partes)
    except Exception as e:
        logger.error(f"Erro no redigir_peticao: {e}")
        return f"Erro ao redigir petição: {str(e)}"


# ============================================================================
# AGENTE 7: Pesquisa Jurisprudencial
# ============================================================================

@tool
def pesquisar_jurisprudencia(
    tema: str,
    tribunal: str = "todos",
    anos: int = 5
) -> List[Dict[str, Any]]:
    """
    Pesquisa Jurisprudencial - Busca precedentes e jurisprudência relevante.

    Use quando precisar de:
    - Encontrar precedentes
    - Buscar decisões similares
    - Pesquisar súmulas
    - Identificar entendimentos jurisprudenciais

    Args:
        tema: Tema ou palavras-chave para busca
        tribunal: STF, STJ, TJ, TRT, todos (padrão: todos)
        anos: Anos retroativos para busca (padrão: 5)

    Returns:
        Lista de precedentes encontrados com ementas e links
    """
    try:
        from lib.agents.pesquisa import PesquisaAgent
        agent = PesquisaAgent()
        return agent.search(tema, tribunal, anos)
    except Exception as e:
        logger.error(f"Erro no pesquisar_jurisprudencia: {e}")
        return [{"erro": str(e)}]


# ============================================================================
# AGENTE 8: Análise de Risco
# ============================================================================

@tool
def analisar_risco_caso(caso: str, valor_causa: Optional[float] = None) -> Dict[str, Any]:
    """
    Análise de Risco - Avalia viabilidade e riscos do processo.

    Use quando precisar de:
    - Probabilidade de sucesso
    - Identificação de riscos
    - Custos estimados
    - Recomendação de prosseguimento

    Args:
        caso: Descrição completa do caso
        valor_causa: Valor econômico da causa (opcional)

    Returns:
        Análise com probabilidade, riscos, custos e recomendação
    """
    try:
        from lib.agents.analise_risco import AnaliseRiscoAgent
        agent = AnaliseRiscoAgent()
        return agent.analyze(caso, valor_causa)
    except Exception as e:
        logger.error(f"Erro no analisar_risco_caso: {e}")
        return {"erro": str(e), "probabilidade": None}


# ============================================================================
# AGENTE 9: Estratégia Processual
# ============================================================================

@tool
def estrategia_processual(caso: str, fase: str = "inicial") -> str:
    """
    Estratégia Processual - Planejamento estratégico de atuação no processo.

    Use quando precisar de:
    - Plano de atuação processual
    - Definição de teses
    - Escolha de provas
    - Linha de defesa/ataque

    Args:
        caso: Descrição do caso
        fase: Fase processual (inicial, instrucao, recursal, execucao)

    Returns:
        Plano estratégico detalhado
    """
    try:
        from lib.agents.estrategia import EstrategiaAgent
        agent = EstrategiaAgent()
        return agent.plan(caso, fase)
    except Exception as e:
        logger.error(f"Erro no estrategia_processual: {e}")
        return f"Erro no planejamento: {str(e)}"


# ============================================================================
# AGENTE 10: Organização de Arquivos
# ============================================================================

@tool
def organizar_documentos(documentos: List[str]) -> Dict[str, List[str]]:
    """
    Organização de Arquivos - Categorização e organização de documentos.

    Use quando precisar de:
    - Classificar documentos
    - Organizar arquivos do processo
    - Criar índice de documentos
    - Identificar documentos faltantes

    Args:
        documentos: Lista de nomes/conteúdos de documentos

    Returns:
        Documentos organizados por categoria
    """
    try:
        from lib.agents.organizacao import OrganizacaoAgent
        agent = OrganizacaoAgent()
        return agent.organize(documentos)
    except Exception as e:
        logger.error(f"Erro no organizar_documentos: {e}")
        return {"erro": str(e), "categorias": {}}


# ============================================================================
# AGENTE 11: Revisão Contratual
# ============================================================================

@tool
def revisar_contrato(contrato: str, tipo_contrato: str = "geral") -> Dict[str, Any]:
    """
    Revisão Contratual - Análise completa de contratos.

    Use quando precisar de:
    - Revisar contratos
    - Identificar cláusulas abusivas
    - Verificar conformidade legal
    - Sugerir alterações

    Args:
        contrato: Texto do contrato
        tipo_contrato: Tipo (prestacao_servicos, trabalho, locacao, etc)

    Returns:
        Análise com riscos, cláusulas problemáticas e sugestões
    """
    try:
        from lib.agents.revisao_contratual import RevisaoAgent
        agent = RevisaoAgent()
        return agent.review(contrato, tipo_contrato)
    except Exception as e:
        logger.error(f"Erro no revisar_contrato: {e}")
        return {"erro": str(e), "riscos": []}


# ============================================================================
# AGENTE 12: Comunicação com Clientes
# ============================================================================

@tool
def gerar_comunicacao_cliente(
    tipo: str,
    contexto: str,
    tom: str = "formal"
) -> str:
    """
    Comunicação com Clientes - Geração de comunicações personalizadas.

    Use quando precisar de:
    - Redigir e-mails para clientes
    - Criar relatórios de andamento
    - Gerar notificações
    - Explicar decisões de forma acessível

    Tipos: email, relatorio, notificacao, explicacao
    Tom: formal, informal, técnico, simples

    Args:
        tipo: Tipo de comunicação
        contexto: Conteúdo a comunicar
        tom: Tom da comunicação (padrão: formal)

    Returns:
        Texto da comunicação formatado
    """
    try:
        from lib.agents.comunicacao import ComunicacaoAgent
        agent = ComunicacaoAgent()
        return agent.generate(tipo, contexto, tom)
    except Exception as e:
        logger.error(f"Erro no gerar_comunicacao: {e}")
        return f"Erro ao gerar comunicação: {str(e)}"


# ============================================================================
# AGENTE 13: Análise Financeira
# ============================================================================

@tool
def analisar_financeiro_processo(
    dados: str,
    tipo_analise: str = "custas"
) -> Dict[str, Any]:
    """
    Análise Financeira - Análise de custos e valores processuais.

    Use quando precisar de:
    - Calcular custas processuais
    - Estimar honorários
    - Analisar benefício econômico
    - Projetar custos da causa

    Tipos: custas, honorarios, valor_causa, beneficio

    Args:
        dados: Dados financeiros do processo
        tipo_analise: Tipo de análise financeira

    Returns:
        Análise financeira detalhada
    """
    try:
        from lib.agents.financeiro import FinanceiroAgent
        agent = FinanceiroAgent()
        return agent.analyze(dados, tipo_analise)
    except Exception as e:
        logger.error(f"Erro no analisar_financeiro: {e}")
        return {"erro": str(e), "valor_total": None}


# ============================================================================
# AGENTE 14: Tradução Jurídica
# ============================================================================

@tool
def traduzir_juridico(
    texto: str,
    idioma_origem: str = "pt",
    idioma_destino: str = "en"
) -> str:
    """
    Tradução Jurídica - Tradução especializada de termos e documentos jurídicos.

    Use quando precisar de:
    - Traduzir documentos jurídicos
    - Converter termos técnicos
    - Manter precisão legal em tradução

    Idiomas: pt, en, es, fr

    Args:
        texto: Texto a traduzir
        idioma_origem: Idioma de origem (padrão: pt)
        idioma_destino: Idioma de destino (padrão: en)

    Returns:
        Texto traduzido mantendo termos técnicos adequados
    """
    try:
        from lib.agents.traducao import TraducaoAgent
        agent = TraducaoAgent()
        return agent.translate(texto, idioma_origem, idioma_destino)
    except Exception as e:
        logger.error(f"Erro no traduzir_juridico: {e}")
        return f"Erro na tradução: {str(e)}"


# ============================================================================
# AGENTE 15: Compliance LGPD
# ============================================================================

@tool
def verificar_compliance_lgpd(documento: str) -> Dict[str, Any]:
    """
    Compliance LGPD - Verificação de conformidade com Lei Geral de Proteção de Dados.

    Use quando precisar de:
    - Validar conformidade LGPD
    - Identificar dados pessoais
    - Verificar bases legais
    - Sugerir adequações

    Args:
        documento: Documento ou texto a verificar

    Returns:
        Análise de compliance com alertas e sugestões
    """
    try:
        from lib.agents.compliance import ComplianceAgent
        agent = ComplianceAgent()
        return agent.check(documento)
    except Exception as e:
        logger.error(f"Erro no verificar_compliance: {e}")
        return {"erro": str(e), "conforme": None}


# ============================================================================
# AGENTE 16: Análise de Sentença
# ============================================================================

@tool
def analisar_sentenca(sentenca: str) -> Dict[str, Any]:
    """
    Análise de Sentença - Análise detalhada de decisões judiciais.

    Use quando precisar de:
    - Analisar sentença ou acórdão
    - Identificar fundamentos
    - Avaliar possibilidade de recurso
    - Extrair dispositivo e fundamentação

    Args:
        sentenca: Texto da sentença ou acórdão

    Returns:
        Análise com dispositivo, fundamentos, e possibilidade de recurso
    """
    try:
        from lib.agents.analise_sentenca import AnaliseSentencaAgent
        agent = AnaliseSentencaAgent()
        return agent.analyze(sentenca)
    except Exception as e:
        logger.error(f"Erro no analisar_sentenca: {e}")
        return {"erro": str(e), "dispositivo": None}


# ============================================================================
# LISTA DE TODAS AS TOOLS
# ============================================================================

ALL_LEGAL_AGENT_TOOLS = [
    harvey_estrategista,
    justine_analise_intimacoes,
    monitor_djen_publicacoes,
    analise_documento,
    calcular_prazos,
    redigir_peticao,
    pesquisar_jurisprudencia,
    analisar_risco_caso,
    estrategia_processual,
    organizar_documentos,
    revisar_contrato,
    gerar_comunicacao_cliente,
    analisar_financeiro_processo,
    traduzir_juridico,
    verificar_compliance_lgpd,
    analisar_sentenca,
]


# ============================================================================
# GRUPOS DE TOOLS POR CATEGORIA
# ============================================================================

TOOLS_ANALISE = [
    justine_analise_intimacoes,
    analise_documento,
    analisar_risco_caso,
    analisar_sentenca,
    revisar_contrato,
]

TOOLS_GERACAO = [
    redigir_peticao,
    gerar_comunicacao_cliente,
]

TOOLS_PESQUISA = [
    pesquisar_jurisprudencia,
    monitor_djen_publicacoes,
]

TOOLS_GESTAO = [
    calcular_prazos,
    organizar_documentos,
    analisar_financeiro_processo,
]

TOOLS_ESTRATEGIA = [
    harvey_estrategista,
    estrategia_processual,
]

TOOLS_COMPLIANCE = [
    verificar_compliance_lgpd,
    traduzir_juridico,
]


def get_tools_by_category(category: str) -> List:
    """
    Retorna tools de uma categoria específica.

    Categorias: analise, geracao, pesquisa, gestao, estrategia, compliance, all
    """
    categories = {
        "analise": TOOLS_ANALISE,
        "geracao": TOOLS_GERACAO,
        "pesquisa": TOOLS_PESQUISA,
        "gestao": TOOLS_GESTAO,
        "estrategia": TOOLS_ESTRATEGIA,
        "compliance": TOOLS_COMPLIANCE,
        "all": ALL_LEGAL_AGENT_TOOLS,
    }

    return categories.get(category, ALL_LEGAL_AGENT_TOOLS)
