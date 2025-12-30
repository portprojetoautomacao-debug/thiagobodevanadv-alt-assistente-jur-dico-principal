"""
Dynamic Prompt Templates - Templates Reutilizáveis e Versionáveis.

Implementa sistema de templates de prompts com variáveis, versionamento e A/B testing.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
    PromptTemplate
)

logger = logging.getLogger(__name__)


# ============================================
# Templates Base para Domínio Jurídico
# ============================================

class LegalPromptTemplates:
    """Repositório de templates para domínio jurídico."""

    # Sistema base
    SYSTEM_BASE = """Você é um assistente jurídico sênior altamente qualificado.

Características:
- Domínio profundo de direito brasileiro
- Linguagem técnica e precisa
- Análise criteriosa e fundamentada
- Referências a legislação quando aplicável

Legislações principais:
- Constituição Federal de 1988 (CF/88)
- Código Civil de 2002 (CC/02)
- Código de Processo Civil de 2015 (CPC/15)
- Código de Processo Penal (CPP)
- Consolidação das Leis do Trabalho (CLT)
"""

    # Templates de análise
    ANALISE_INTIMACAO = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Análise de intimações e prazos processuais.

Sua tarefa:
1. Identificar o tipo de intimação
2. Extrair prazos e datas relevantes
3. Avaliar urgência e prioridade
4. Listar ações necessárias
5. Identificar partes envolvidas
"""),
        ("human", """Analise a seguinte intimação:

{texto_intimacao}

{format_instructions}
""")
    ])

    ANALISE_CONTRATO = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Análise e revisão de contratos.

Sua tarefa:
1. Identificar tipo e objeto do contrato
2. Analisar cláusulas principais
3. Identificar riscos potenciais
4. Avaliar equilíbrio contratual
5. Fornecer recomendações
"""),
        ("human", """Analise o seguinte contrato:

{texto_contrato}

Aspectos a considerar: {aspectos}

{format_instructions}
""")
    ])

    ANALISE_SENTENCA = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Análise de sentenças e decisões judiciais.

Sua tarefa:
1. Resumir o dispositivo da decisão
2. Identificar fundamentos jurídicos
3. Avaliar chances de reforma
4. Sugerir estratégia recursal
5. Identificar pontos fortes e fracos
"""),
        ("human", """Analise a seguinte sentença:

{texto_sentenca}

Perspectiva: {perspectiva}

{format_instructions}
""")
    ])

    # Templates de geração
    GERAR_PETICAO = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Redação de petições e peças processuais.

Diretrizes:
- Estrutura formal adequada
- Fundamentação jurídica sólida
- Linguagem técnica e persuasiva
- Pedidos claros e objetivos
- Referências legais precisas
"""),
        ("human", """Redija {tipo_peca} com os seguintes dados:

Partes:
Autor: {autor}
Réu: {reu}

Fatos: {fatos}

Fundamentos: {fundamentos}

Pedidos: {pedidos}

{instrucoes_adicionais}
""")
    ])

    GERAR_PARECER = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Elaboração de pareceres jurídicos.

Estrutura do parecer:
1. Consulta
2. Análise dos fatos
3. Fundamentação jurídica
4. Conclusão
5. Recomendações
"""),
        ("human", """Elabore parecer jurídico sobre:

Consulta: {consulta}

Contexto: {contexto}

Questões específicas: {questoes}

{format_instructions}
""")
    ])

    # Templates com histórico
    CHAT_COM_MEMORIA = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Você está em uma conversa contínua com um advogado.
Mantenha contexto das mensagens anteriores.
"""),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}")
    ])

    # Templates de pesquisa
    PESQUISA_JURISPRUDENCIA = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_BASE + """
Especialização: Pesquisa de jurisprudência e precedentes.

Sua tarefa:
- Identificar teses relevantes
- Citar números de processos
- Resumir ementas principais
- Avaliar aplicabilidade ao caso
"""),
        ("human", """Pesquise jurisprudência sobre:

Tema: {tema}
Tribunal: {tribunal}
Período: {periodo}

{criterios_adicionais}
""")
    ])


# ============================================
# Template Manager com Versionamento
# ============================================

class PromptTemplateManager:
    """
    Gerenciador de templates com versionamento e A/B testing.
    """

    def __init__(self):
        self._templates: Dict[str, Dict[str, ChatPromptTemplate]] = {}
        self._active_versions: Dict[str, str] = {}
        self._usage_stats: Dict[str, Dict[str, int]] = {}

    def register_template(
        self,
        name: str,
        template: ChatPromptTemplate,
        version: str = "v1"
    ):
        """
        Registra um template com versão.

        Args:
            name: Nome do template
            template: Template do prompt
            version: Versão do template
        """
        if name not in self._templates:
            self._templates[name] = {}
            self._active_versions[name] = version
            self._usage_stats[name] = {}

        self._templates[name][version] = template
        self._usage_stats[name][version] = 0

        logger.info(f"📝 Template '{name}' versão {version} registrado")

    def get_template(
        self,
        name: str,
        version: Optional[str] = None
    ) -> ChatPromptTemplate:
        """
        Recupera template por nome e versão.

        Args:
            name: Nome do template
            version: Versão específica (ou usa a ativa)
        """
        if name not in self._templates:
            raise ValueError(f"Template '{name}' não encontrado")

        version = version or self._active_versions.get(name)

        if version not in self._templates[name]:
            raise ValueError(f"Versão '{version}' do template '{name}' não encontrada")

        # Incrementar contador
        self._usage_stats[name][version] += 1

        return self._templates[name][version]

    def set_active_version(self, name: str, version: str):
        """Define versão ativa de um template."""
        if name not in self._templates:
            raise ValueError(f"Template '{name}' não encontrado")

        if version not in self._templates[name]:
            raise ValueError(f"Versão '{version}' não encontrada")

        self._active_versions[name] = version
        logger.info(f"✅ Template '{name}' agora usa versão {version}")

    def list_templates(self) -> List[str]:
        """Lista todos os templates disponíveis."""
        return list(self._templates.keys())

    def list_versions(self, name: str) -> List[str]:
        """Lista versões de um template."""
        if name not in self._templates:
            return []
        return list(self._templates[name].keys())

    def get_stats(self, name: str) -> Dict[str, int]:
        """Retorna estatísticas de uso de um template."""
        return self._usage_stats.get(name, {})


# ============================================
# Prompt Builder Fluente
# ============================================

class LegalPromptBuilder:
    """
    Builder fluente para criar prompts complexos.
    """

    def __init__(self):
        self._messages = []
        self._variables = set()

    def system(self, content: str) -> "LegalPromptBuilder":
        """Adiciona mensagem de sistema."""
        self._messages.append(("system", content))
        return self

    def human(self, content: str) -> "LegalPromptBuilder":
        """Adiciona mensagem humana."""
        self._messages.append(("human", content))
        # Extrair variáveis {var}
        import re
        vars_found = re.findall(r'\{(\w+)\}', content)
        self._variables.update(vars_found)
        return self

    def ai(self, content: str) -> "LegalPromptBuilder":
        """Adiciona exemplo de resposta da IA."""
        self._messages.append(("ai", content))
        return self

    def placeholder(self, name: str) -> "LegalPromptBuilder":
        """Adiciona placeholder para mensagens."""
        self._messages.append(MessagesPlaceholder(variable_name=name))
        self._variables.add(name)
        return self

    def with_examples(
        self,
        examples: List[Dict[str, str]]
    ) -> "LegalPromptBuilder":
        """Adiciona exemplos few-shot."""
        for ex in examples:
            self._messages.append(("human", ex.get("input", "")))
            self._messages.append(("ai", ex.get("output", "")))
        return self

    def build(self) -> ChatPromptTemplate:
        """Constrói o template final."""
        return ChatPromptTemplate.from_messages(self._messages)

    def get_variables(self) -> List[str]:
        """Retorna variáveis necessárias."""
        return list(self._variables)


# ============================================
# Templates Pré-configurados
# ============================================

# Criar manager global
prompt_manager = PromptTemplateManager()

# Registrar templates padrão
prompt_manager.register_template(
    "analise_intimacao",
    LegalPromptTemplates.ANALISE_INTIMACAO,
    "v1"
)

prompt_manager.register_template(
    "analise_contrato",
    LegalPromptTemplates.ANALISE_CONTRATO,
    "v1"
)

prompt_manager.register_template(
    "gerar_peticao",
    LegalPromptTemplates.GERAR_PETICAO,
    "v1"
)

prompt_manager.register_template(
    "chat_com_memoria",
    LegalPromptTemplates.CHAT_COM_MEMORIA,
    "v1"
)


# ============================================
# Helpers
# ============================================

def create_few_shot_prompt(
    instruction: str,
    examples: List[Dict[str, str]],
    input_key: str = "input"
) -> ChatPromptTemplate:
    """
    Cria prompt few-shot facilmente.

    Args:
        instruction: Instrução base
        examples: Lista de exemplos com input/output
        input_key: Nome da variável de input
    """
    builder = LegalPromptBuilder()
    builder.system(instruction)
    builder.with_examples(examples)
    builder.human(f"{{{input_key}}}")
    return builder.build()


def get_legal_template(name: str) -> ChatPromptTemplate:
    """Helper para pegar template rapidamente."""
    return prompt_manager.get_template(name)


# Example usage
"""
# Usar template registrado
template = get_legal_template("analise_intimacao")
prompt = template.format_messages(
    texto_intimacao="...",
    format_instructions="Retorne JSON com tipo e prazo"
)

# Criar template customizado com builder
custom_template = (
    LegalPromptBuilder()
    .system("Você é um especialista em direito trabalhista")
    .human("Analise: {caso}")
    .build()
)

# Few-shot
few_shot = create_few_shot_prompt(
    "Classifique o tipo de ação",
    examples=[
        {"input": "dano moral", "output": "Ação indenizatória"},
        {"input": "revisão contrato", "output": "Ação revisional"}
    ]
)
"""
