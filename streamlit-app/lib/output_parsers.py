"""
Output Parsers - Validação e Estruturação de Respostas LLM.

Implementa parsers com validação automática usando Pydantic.
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from langchain.output_parsers import PydanticOutputParser, StructuredOutputParser
from langchain.output_parsers.json import SimpleJsonOutputParser
from langchain_core.exceptions import OutputParserException
from langchain_core.output_parsers import BaseOutputParser
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)


# ============================================
# Modelos Pydantic para Saídas Estruturadas
# ============================================

class TipoIntimacao(str, Enum):
    """Tipos de intimação processual."""
    CONTESTACAO = "contestacao"
    MANIFESTACAO = "manifestacao"
    RECURSO = "recurso"
    CUMPRIMENTO = "cumprimento"
    AUDIENCIA = "audiencia"
    GENERICA = "generica"


class Prioridade(str, Enum):
    """Níveis de prioridade."""
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class PrazoProcessual(BaseModel):
    """Modelo para prazos processuais."""
    encontrado: bool = Field(description="Se um prazo foi identificado")
    dias: Optional[int] = Field(None, description="Número de dias do prazo")
    data_vencimento: Optional[str] = Field(None, description="Data de vencimento (dd/mm/yyyy)")
    dias_corridos: bool = Field(True, description="Se são dias corridos ou úteis")
    urgente: bool = Field(False, description="Se o prazo é urgente (<=5 dias)")
    observacoes: Optional[str] = Field(None, description="Observações sobre o prazo")

    @field_validator("dias")
    @classmethod
    def validate_dias(cls, v):
        if v is not None and v < 0:
            raise ValueError("Dias não pode ser negativo")
        return v


class AnaliseIntimacao(BaseModel):
    """Modelo completo para análise de intimação."""
    tipo: TipoIntimacao = Field(description="Tipo da intimação")
    prioridade: Prioridade = Field(description="Prioridade da intimação")
    prazo: Optional[PrazoProcessual] = Field(None, description="Prazo identificado")
    resumo: str = Field(description="Resumo da intimação")
    acoes_requeridas: List[str] = Field(default_factory=list, description="Ações necessárias")
    partes_envolvidas: List[str] = Field(default_factory=list, description="Partes mencionadas")
    numero_processo: Optional[str] = Field(None, description="Número do processo")

    @field_validator("acoes_requeridas")
    @classmethod
    def validate_acoes(cls, v):
        if not v:
            return ["Revisar intimação"]
        return v


class AnaliseContrato(BaseModel):
    """Modelo para análise de contratos."""
    tipo_contrato: str = Field(description="Tipo do contrato")
    partes: List[str] = Field(description="Partes contratantes")
    objeto: str = Field(description="Objeto do contrato")
    valor: Optional[str] = Field(None, description="Valor do contrato")
    vigencia: Optional[str] = Field(None, description="Período de vigência")
    clausulas_importantes: List[str] = Field(default_factory=list, description="Cláusulas relevantes")
    riscos_identificados: List[str] = Field(default_factory=list, description="Riscos potenciais")
    recomendacoes: List[str] = Field(default_factory=list, description="Recomendações")
    score_risco: int = Field(ge=0, le=10, description="Score de risco (0-10)")


class ArgumentoJuridico(BaseModel):
    """Modelo para argumentos jurídicos."""
    tese: str = Field(description="Tese principal")
    fundamentos: List[str] = Field(description="Fundamentos legais")
    jurisprudencia: List[str] = Field(default_factory=list, description="Jurisprudências aplicáveis")
    doutrina: List[str] = Field(default_factory=list, description="Doutrinas citadas")
    forca_argumento: int = Field(ge=1, le=10, description="Força do argumento (1-10)")


class ResumoPeticao(BaseModel):
    """Modelo para resumo de petições."""
    tipo_peca: str = Field(description="Tipo da peça processual")
    autor: str = Field(description="Parte autora")
    reu: str = Field(description="Parte ré")
    pedidos: List[str] = Field(description="Pedidos principais")
    valor_causa: Optional[str] = Field(None, description="Valor da causa")
    argumentos_principais: List[str] = Field(description="Principais argumentos")
    provas: List[str] = Field(default_factory=list, description="Provas mencionadas")


# ============================================
# Parsers Customizados
# ============================================

class SafePydanticOutputParser(PydanticOutputParser):
    """
    Parser Pydantic com tratamento de erros robusto.

    Tenta recuperar de erros de parsing com estratégias de fallback.
    """

    def parse(self, text: str) -> BaseModel:
        """Parse com error handling."""
        try:
            return super().parse(text)
        except OutputParserException as e:
            logger.warning(f"⚠️ Erro no parsing, tentando limpar JSON: {e}")

            # Tentar extrair JSON do texto
            import json
            import re

            # Procurar por JSON no texto
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                try:
                    cleaned_text = json_match.group(0)
                    return super().parse(cleaned_text)
                except Exception:
                    pass

            logger.error(f"❌ Não foi possível fazer parse: {text[:100]}...")
            raise


class LegalOutputParser:
    """
    Factory para criar parsers específicos para domínio jurídico.
    """

    @staticmethod
    def for_intimacao() -> SafePydanticOutputParser:
        """Parser para análise de intimações."""
        return SafePydanticOutputParser(pydantic_object=AnaliseIntimacao)

    @staticmethod
    def for_contrato() -> SafePydanticOutputParser:
        """Parser para análise de contratos."""
        return SafePydanticOutputParser(pydantic_object=AnaliseContrato)

    @staticmethod
    def for_argumento() -> SafePydanticOutputParser:
        """Parser para argumentos jurídicos."""
        return SafePydanticOutputParser(pydantic_object=ArgumentoJuridico)

    @staticmethod
    def for_peticao() -> SafePydanticOutputParser:
        """Parser para resumo de petições."""
        return SafePydanticOutputParser(pydantic_object=ResumoPeticao)

    @staticmethod
    def for_prazo() -> SafePydanticOutputParser:
        """Parser para prazos processuais."""
        return SafePydanticOutputParser(pydantic_object=PrazoProcessual)


class ListOutputParser(BaseOutputParser[List[str]]):
    """Parser para listas de strings."""

    def parse(self, text: str) -> List[str]:
        """Parse text para lista."""
        import re

        # Remover markdown
        text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)

        # Tentar extrair lista numerada ou com bullets
        items = []

        # Lista numerada: 1. item, 2. item
        numbered = re.findall(r'^\d+\.\s+(.+)$', text, re.MULTILINE)
        if numbered:
            return numbered

        # Lista com bullets: - item, * item
        bulleted = re.findall(r'^[\-\*]\s+(.+)$', text, re.MULTILINE)
        if bulleted:
            return bulleted

        # Separar por quebras de linha
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            return lines

        return [text]

    def get_format_instructions(self) -> str:
        return "Retorne uma lista de itens, um por linha, prefixados com '- ' ou números."


# ============================================
# Helpers
# ============================================

def create_structured_parser(response_schemas: List[Dict[str, str]]) -> StructuredOutputParser:
    """
    Cria parser estruturado a partir de schema simples.

    Args:
        response_schemas: Lista de dicts com name e description

    Example:
        schemas = [
            {"name": "tipo", "description": "Tipo da intimação"},
            {"name": "prazo", "description": "Prazo em dias"},
        ]
    """
    from langchain.output_parsers import ResponseSchema

    schemas = [
        ResponseSchema(name=s["name"], description=s["description"])
        for s in response_schemas
    ]

    return StructuredOutputParser.from_response_schemas(schemas)


def parse_with_retry(
    parser: BaseOutputParser,
    text: str,
    max_retries: int = 3
) -> Any:
    """
    Tenta fazer parse com retries.

    Args:
        parser: Parser a usar
        text: Texto para parse
        max_retries: Número máximo de tentativas

    Returns:
        Resultado do parse
    """
    last_error = None

    for attempt in range(max_retries):
        try:
            return parser.parse(text)
        except Exception as e:
            logger.warning(f"⚠️ Tentativa {attempt + 1}/{max_retries} falhou: {e}")
            last_error = e

            # Tentar limpar o texto
            if attempt < max_retries - 1:
                # Remover markdown code blocks
                import re
                text = re.sub(r'```\w*\n?', '', text)
                text = text.strip()

    raise last_error or Exception("Parse failed after retries")


# Example usage
"""
# Usando parser de intimação
parser = LegalOutputParser.for_intimacao()

# Adicionar instruções ao prompt
format_instructions = parser.get_format_instructions()

prompt = f'''
Analise a intimação abaixo:

{texto_intimacao}

{format_instructions}
'''

response = await llm.ainvoke(prompt)
analise = parser.parse(response.content)

print(f"Tipo: {analise.tipo}")
print(f"Prioridade: {analise.prioridade}")
print(f"Ações: {analise.acoes_requeridas}")
"""
