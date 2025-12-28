#!/usr/bin/env python3
"""
Script para criar os 10 agentes restantes de forma rápida
"""

AGENTES = [
    {
        "filename": "monitor_djen.py",
        "class_name": "MonitorDJENAgent",
        "agent_id": "monitor-djen",
        "name": "Monitor DJEN",
        "role": "Especialista em monitoramento do Diário de Justiça",
        "capabilities": ["djen-monitoring", "publication-detection", "notification"],
    },
    {
        "filename": "prazos.py",
        "class_name": "GestaoPrazosAgent",
        "agent_id": "gestao-prazos",
        "name": "Gestão de Prazos",
        "role": "Especialista em cálculo de prazos processuais",
        "capabilities": ["deadline-calculation", "business-days", "alert-generation"],
    },
    {
        "filename": "organizacao.py",
        "class_name": "OrganizacaoArquivosAgent",
        "agent_id": "organizacao-arquivos",
        "name": "Organizador de Arquivos",
        "role": "Especialista em organização de documentos",
        "capabilities": ["file-organization", "categorization", "indexing"],
    },
    {
        "filename": "analise_risco.py",
        "class_name": "AnaliseRiscoAgent",
        "agent_id": "analise-risco",
        "name": "Análise de Risco",
        "role": "Especialista em avaliação de riscos processuais",
        "capabilities": ["risk-assessment", "probability-analysis", "financial-impact"],
    },
    {
        "filename": "revisao_contratual.py",
        "class_name": "RevisaoContratualAgent",
        "agent_id": "revisao-contratual",
        "name": "Revisor Contratual",
        "role": "Especialista em análise de contratos",
        "capabilities": ["contract-analysis", "clause-review", "compliance-check"],
    },
    {
        "filename": "comunicacao.py",
        "class_name": "ComunicacaoClientesAgent",
        "agent_id": "comunicacao-clientes",
        "name": "Comunicação com Clientes",
        "role": "Especialista em comunicação clara com clientes",
        "capabilities": [
            "client-communication",
            "report-generation",
            "language-simplification",
        ],
    },
    {
        "filename": "financeiro.py",
        "class_name": "FinanceiroAgent",
        "agent_id": "financeiro",
        "name": "Análise Financeira",
        "role": "Especialista em gestão financeira jurídica",
        "capabilities": [
            "financial-monitoring",
            "profitability-analysis",
            "receivables-tracking",
        ],
    },
    {
        "filename": "estrategia.py",
        "class_name": "EstrategiaProcessualAgent",
        "agent_id": "estrategia-processual",
        "name": "Estratégia Processual",
        "role": "Consultor estratégico processual",
        "capabilities": [
            "strategic-planning",
            "option-analysis",
            "success-probability",
        ],
    },
    {
        "filename": "traducao.py",
        "class_name": "TraducaoJuridicaAgent",
        "agent_id": "traducao-juridica",
        "name": "Tradutor Jurídico",
        "role": "Especialista em tradução de termos técnicos",
        "capabilities": ["legal-translation", "term-explanation", "glossary-creation"],
    },
    {
        "filename": "compliance.py",
        "class_name": "ComplianceAgent",
        "agent_id": "compliance",
        "name": "Compliance",
        "role": "Auditor de conformidade LGPD e ética",
        "capabilities": ["compliance-check", "lgpd-verification", "ethics-review"],
    },
    {
        "filename": "analise_sentenca.py",
        "class_name": "AnaliseSentencaAgent",
        "agent_id": "analise-sentenca",
        "name": "Análise de Sentença",
        "role": "Especialista em análise de decisões judiciais",
        "capabilities": ["sentence-analysis", "nlp", "outcome-detection"],
    },
]

TEMPLATE = '''"""Agente {name}"""
from .base_agent import BaseAgent
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class {class_name}(BaseAgent):
    def __init__(self):
        super().__init__(
            agent_id="{agent_id}",
            name="{name}",
            role="{role}",
            capabilities={capabilities}
        )

    async def execute(self, task: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        try:
            system_prompt = f"Você é {{self.name}}, {{self.role}}. Forneça análise profissional e detalhada."
            response = self.model.generate_content(f"{{system_prompt}}\\n\\nTarefa: {{task}}")

            return {{
                "agentId": self.agent_id,
                "agentName": self.name,
                "response": response.text,
                "status": "completed",
                "confidence": 0.80
            }}
        except Exception as e:
            logger.error(f"❌ Erro: {{e}}")
            return {{"agentId": self.agent_id, "response": str(e), "status": "failed"}}
'''

if __name__ == "__main__":
    import os

    base_path = "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/streamlit-app/lib/agents"

    for agente in AGENTES:
        filepath = os.path.join(base_path, agente["filename"])

        code = TEMPLATE.format(
            name=agente["name"],
            class_name=agente["class_name"],
            agent_id=agente["agent_id"],
            role=agente["role"],
            capabilities=agente["capabilities"],
        )

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)

        print(f"✅ {agente['filename']} criado")

    print(f"\n🎉 {len(AGENTES)} agentes criados com sucesso!")
