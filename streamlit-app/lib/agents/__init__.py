"""
Agentes LangChain - Sistema Assistente Jurídico PJe
Todos os 16 agentes implementados com LangChain real
"""

from .analise_doc import AnaliseDocAgent
from .analise_risco import AnaliseRiscoAgent
from .analise_sentenca import AnaliseSentencaAgent
from .base_agent import BaseAgent
from .compliance import ComplianceAgent
from .comunicacao import ComunicacaoClientesAgent
from .estrategia import EstrategiaProcessualAgent
from .financeiro import FinanceiroAgent
from .harvey import HarveyAgent
from .justine import JustineAgent
from .monitor_djen import MonitorDJENAgent
from .organizacao import OrganizacaoArquivosAgent
from .pesquisa import PesquisaAgent
from .prazos import GestaoPrazosAgent
from .redacao import RedacaoAgent
from .revisao_contratual import RevisaoContratualAgent
from .traducao import TraducaoJuridicaAgent

__all__ = [
    "BaseAgent",
    "HarveyAgent",
    "JustineAgent",
    "RedacaoAgent",
    "PesquisaAgent",
    "AnaliseDocAgent",
    "MonitorDJENAgent",
    "GestaoPrazosAgent",
    "OrganizacaoArquivosAgent",
    "AnaliseRiscoAgent",
    "RevisaoContratualAgent",
    "ComunicacaoClientesAgent",
    "FinanceiroAgent",
    "EstrategiaProcessualAgent",
    "TraducaoJuridicaAgent",
    "ComplianceAgent",
    "AnaliseSentencaAgent",
]

# Mapa de agentes por ID para facilitar lookup
AGENTS_MAP = {
    "harvey": HarveyAgent,
    "justine": JustineAgent,
    "redacao": RedacaoAgent,
    "pesquisa": PesquisaAgent,
    "analise-documental": AnaliseDocAgent,
    "monitor-djen": MonitorDJENAgent,
    "gestao-prazos": GestaoPrazosAgent,
    "organizacao-arquivos": OrganizacaoArquivosAgent,
    "analise-risco": AnaliseRiscoAgent,
    "revisao-contratual": RevisaoContratualAgent,
    "comunicacao-clientes": ComunicacaoClientesAgent,
    "financeiro": FinanceiroAgent,
    "estrategia-processual": EstrategiaProcessualAgent,
    "traducao-juridica": TraducaoJuridicaAgent,
    "compliance": ComplianceAgent,
    "analise-sentenca": AnaliseSentencaAgent,
}
