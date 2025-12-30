"""
Structured Tool Calling com AgentExecutor - Best Practices.

Implementa agentes com tool calling estruturado usando AgentExecutor do LangChain.
"""

import logging
from typing import Any, Dict, List, Optional

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import BaseTool, tool
from langchain_core.runnables import Runnable

logger = logging.getLogger(__name__)


class StructuredAgent:
    """
    Agente com tool calling estruturado usando AgentExecutor.

    Benefits:
    - Validação automática de inputs/outputs
    - Error handling integrado
    - Logging de tool calls
    - Retry em falhas
    """

    def __init__(
        self,
        llm: Runnable,
        tools: List[BaseTool],
        system_prompt: str,
        max_iterations: int = 10,
        max_execution_time: Optional[float] = None,
        verbose: bool = False
    ):
        """
        Args:
            llm: Modelo de linguagem
            tools: Lista de ferramentas
            system_prompt: Prompt do sistema
            max_iterations: Máximo de iterações
            max_execution_time: Tempo máximo de execução (segundos)
            verbose: Modo verbose para debugging
        """
        self.llm = llm
        self.tools = tools
        self.system_prompt = system_prompt
        self.max_iterations = max_iterations
        self.max_execution_time = max_execution_time
        self.verbose = verbose

        # Criar prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # Criar agente
        self.agent = create_tool_calling_agent(llm, tools, self.prompt)

        # Criar executor
        self.executor = AgentExecutor(
            agent=self.agent,
            tools=tools,
            max_iterations=max_iterations,
            max_execution_time=max_execution_time,
            verbose=verbose,
            handle_parsing_errors=True,
            return_intermediate_steps=True
        )

    async def execute(
        self,
        input_text: str,
        chat_history: Optional[List] = None
    ) -> Dict[str, Any]:
        """
        Executa o agente.

        Args:
            input_text: Input do usuário
            chat_history: Histórico de mensagens

        Returns:
            Resultado com output e steps intermediários
        """
        try:
            result = await self.executor.ainvoke({
                "input": input_text,
                "chat_history": chat_history or []
            })

            return {
                "success": True,
                "output": result["output"],
                "intermediate_steps": result.get("intermediate_steps", []),
                "total_iterations": len(result.get("intermediate_steps", []))
            }

        except Exception as e:
            logger.error(f"Erro na execução do agente: {e}")
            return {
                "success": False,
                "error": str(e),
                "output": f"Erro: {e}"
            }

    async def stream(
        self,
        input_text: str,
        chat_history: Optional[List] = None
    ):
        """Stream de execução."""
        try:
            async for chunk in self.executor.astream({
                "input": input_text,
                "chat_history": chat_history or []
            }):
                yield chunk

        except Exception as e:
            logger.error(f"Erro no streaming: {e}")
            yield {"error": str(e)}


# Example: Agente jurídico estruturado

@tool
def extrair_prazo_estruturado(texto: str) -> Dict[str, Any]:
    """
    Extrai prazo de texto de intimação de forma estruturada.

    Args:
        texto: Texto da intimação

    Returns:
        Dict com dias, data_vencimento e urgente
    """
    import re
    from datetime import datetime, timedelta

    patterns = [
        r"(\d+)\s*dias?",
        r"prazo\s+de\s+(\d+)",
        r"no\s+prazo\s+de\s+(\d+)"
    ]

    dias = None
    for pattern in patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            dias = int(match.group(1))
            break

    if dias:
        data_vencimento = datetime.now() + timedelta(days=dias)
        urgente = dias <= 5

        return {
            "encontrado": True,
            "dias": dias,
            "data_vencimento": data_vencimento.strftime("%d/%m/%Y"),
            "urgente": urgente,
            "mensagem": f"Prazo de {dias} dias até {data_vencimento.strftime('%d/%m/%Y')}"
        }
    else:
        return {
            "encontrado": False,
            "dias": None,
            "data_vencimento": None,
            "urgente": False,
            "mensagem": "Nenhum prazo identificado"
        }


@tool
def classificar_intimacao_estruturado(texto: str) -> Dict[str, Any]:
    """
    Classifica tipo de intimação de forma estruturada.

    Args:
        texto: Texto da intimação

    Returns:
        Dict com tipo, categoria e prioridade
    """
    texto_lower = texto.lower()

    tipos = {
        "contestacao": ["contestar", "defesa", "responder"],
        "manifestacao": ["manifestar", "se pronunciar"],
        "recurso": ["recurso", "apelação", "agravo"],
        "cumprimento": ["cumprir", "apresentar"],
        "audiencia": ["audiência", "comparecimento"]
    }

    tipo_encontrado = "genérica"
    prioridade = "média"

    for tipo, keywords in tipos.items():
        if any(kw in texto_lower for kw in keywords):
            tipo_encontrado = tipo
            break

    # Definir prioridade
    if tipo_encontrado in ["contestacao", "recurso"]:
        prioridade = "alta"
    elif tipo_encontrado == "audiencia":
        prioridade = "alta"

    return {
        "tipo": tipo_encontrado,
        "categoria": "processual",
        "prioridade": prioridade,
        "requer_acao": tipo_encontrado != "genérica",
        "mensagem": f"Intimação tipo '{tipo_encontrado}' com prioridade {prioridade}"
    }


@tool
def calcular_prazo_processual(
    dias_corridos: int,
    excluir_feriados: bool = True
) -> Dict[str, Any]:
    """
    Calcula prazo processual considerando dias úteis.

    Args:
        dias_corridos: Número de dias do prazo
        excluir_feriados: Se deve excluir feriados

    Returns:
        Dict com data de vencimento calculada
    """
    from datetime import datetime, timedelta

    # Simplificado: considera apenas fins de semana
    data_atual = datetime.now()
    dias_adicionados = 0
    dias_uteis = 0

    while dias_uteis < dias_corridos:
        dias_adicionados += 1
        data_teste = data_atual + timedelta(days=dias_adicionados)

        # Ignorar sábado (5) e domingo (6)
        if data_teste.weekday() < 5:
            dias_uteis += 1

    data_vencimento = data_atual + timedelta(days=dias_adicionados)

    return {
        "data_vencimento": data_vencimento.strftime("%d/%m/%Y"),
        "dias_corridos": dias_adicionados,
        "dias_uteis": dias_corridos,
        "dias_restantes": dias_adicionados,
        "vence_em": f"{dias_adicionados} dias corridos ({dias_corridos} úteis)"
    }


def create_legal_agent(llm: Runnable) -> StructuredAgent:
    """
    Cria agente jurídico estruturado com ferramentas.

    Args:
        llm: Modelo de linguagem

    Returns:
        Agente configurado
    """
    tools = [
        extrair_prazo_estruturado,
        classificar_intimacao_estruturado,
        calcular_prazo_processual
    ]

    system_prompt = """Você é um assistente jurídico especializado em análise de intimações e gestão de prazos.

Suas responsabilidades:
1. Analisar textos de intimações judiciais
2. Identificar prazos e datas importantes
3. Classificar o tipo de intimação
4. Calcular datas de vencimento
5. Avaliar urgência e prioridade

Ferramentas disponíveis:
- extrair_prazo_estruturado: Extrai prazos do texto
- classificar_intimacao_estruturado: Classifica tipo de intimação
- calcular_prazo_processual: Calcula prazos processuais

IMPORTANTE:
- Use as ferramentas quando necessário
- Retorne informações estruturadas
- Seja preciso com datas e prazos
- Indique urgência quando apropriado
"""

    return StructuredAgent(
        llm=llm,
        tools=tools,
        system_prompt=system_prompt,
        max_iterations=5,
        verbose=True
    )


# Example usage
"""
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash-exp")
agent = create_legal_agent(llm)

result = await agent.execute(
    "Fica V.Sa. intimado para contestar no prazo de 15 dias"
)

print(result["output"])
print(f"Total de iterações: {result['total_iterations']}")
for step in result["intermediate_steps"]:
    print(f"Tool: {step[0].tool}")
    print(f"Input: {step[0].tool_input}")
    print(f"Output: {step[1]}")
"""
