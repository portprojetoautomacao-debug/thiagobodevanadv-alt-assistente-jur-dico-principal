"""
Temperature Configuration - Ajuste Dinâmico de Temperatura por Tipo de Tarefa.

Implementa configuração inteligente de temperatura baseada no contexto da tarefa.
"""

import logging
from enum import Enum
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TaskType(str, Enum):
    """Tipos de tarefas com diferentes necessidades de criatividade."""

    # Tarefas analíticas (temperatura baixa)
    ANALYSIS = "analysis"
    EXTRACTION = "extraction"
    CLASSIFICATION = "classification"
    VALIDATION = "validation"
    CALCULATION = "calculation"

    # Tarefas balanceadas (temperatura média)
    SUMMARIZATION = "summarization"
    TRANSLATION = "translation"
    Q_AND_A = "q_and_a"
    RESEARCH = "research"

    # Tarefas criativas (temperatura alta)
    GENERATION = "generation"
    BRAINSTORMING = "brainstorming"
    CREATIVE_WRITING = "creative_writing"
    STORYTELLING = "storytelling"


class TemperatureConfig:
    """
    Configuração de temperatura otimizada por tipo de tarefa.

    Ranges:
    - 0.0-0.3: Determinístico (análise, extração)
    - 0.4-0.6: Balanceado (resumo, Q&A)
    - 0.7-1.0: Criativo (geração, redação)
    """

    # Configurações padrão por tipo
    DEFAULTS: Dict[TaskType, float] = {
        # Analíticas - Precisão máxima
        TaskType.ANALYSIS: 0.1,
        TaskType.EXTRACTION: 0.0,
        TaskType.CLASSIFICATION: 0.2,
        TaskType.VALIDATION: 0.1,
        TaskType.CALCULATION: 0.0,

        # Balanceadas
        TaskType.SUMMARIZATION: 0.5,
        TaskType.TRANSLATION: 0.3,
        TaskType.Q_AND_A: 0.4,
        TaskType.RESEARCH: 0.5,

        # Criativas
        TaskType.GENERATION: 0.7,
        TaskType.BRAINSTORMING: 0.8,
        TaskType.CREATIVE_WRITING: 0.9,
        TaskType.STORYTELLING: 1.0,
    }

    # Configurações jurídicas específicas
    LEGAL_TASKS = {
        "analise_intimacao": 0.2,  # Preciso
        "analise_contrato": 0.3,    # Preciso mas permite inferências
        "analise_sentenca": 0.3,
        "extracao_dados": 0.0,      # Máxima precisão
        "classificacao_processo": 0.2,

        "resumo_processo": 0.4,
        "pesquisa_juris": 0.5,
        "parecer_juridico": 0.6,    # Permite argumentação

        "redacao_peticao": 0.7,     # Criativo mas técnico
        "minutas": 0.7,
        "argumentacao": 0.8,        # Criatividade na argumentação
    }

    @classmethod
    def get_temperature(
        cls,
        task_type: Optional[TaskType] = None,
        legal_task: Optional[str] = None,
        default: float = 0.7
    ) -> float:
        """
        Retorna temperatura otimizada para a tarefa.

        Args:
            task_type: Tipo genérico da tarefa
            legal_task: Tarefa jurídica específica
            default: Temperatura padrão se não encontrar

        Returns:
            Temperatura entre 0.0 e 1.0
        """
        # Priorizar tarefa jurídica específica
        if legal_task and legal_task in cls.LEGAL_TASKS:
            temp = cls.LEGAL_TASKS[legal_task]
            logger.debug(f"🌡️ Temperatura para '{legal_task}': {temp}")
            return temp

        # Usar tipo genérico
        if task_type and task_type in cls.DEFAULTS:
            temp = cls.DEFAULTS[task_type]
            logger.debug(f"🌡️ Temperatura para tipo '{task_type.value}': {temp}")
            return temp

        # Fallback
        logger.debug(f"🌡️ Usando temperatura padrão: {default}")
        return default

    @classmethod
    def get_config_for_agent(cls, agent_id: str) -> float:
        """
        Retorna configuração otimizada por agente.

        Args:
            agent_id: ID do agente

        Returns:
            Temperatura otimizada
        """
        agent_configs = {
            # Agentes analíticos
            "justine": 0.2,        # Análise de intimações - preciso
            "monitor-djen": 0.1,   # Monitoramento - muito preciso
            "analise-documental": 0.3,
            "financeiro": 0.1,     # Cálculos - exato
            "compliance": 0.2,

            # Agentes balanceados
            "harvey": 0.5,         # Estratégia - equilibrado
            "pesquisa-juris": 0.5,
            "gestao-prazos": 0.3,
            "organizacao-arquivos": 0.2,

            # Agentes criativos
            "redacao-peticoes": 0.7,  # Redação - criativo
            "estrategia-processual": 0.6,
            "revisao-contratual": 0.5,
            "comunicacao-clientes": 0.6,
            "traducao-juridica": 0.4,
        }

        return agent_configs.get(agent_id, 0.7)


class AdaptiveTemperature:
    """
    Sistema adaptativo que ajusta temperatura baseado em feedback.
    """

    def __init__(self):
        self._history: Dict[str, list] = {}
        self._adjustments: Dict[str, float] = {}

    def record_result(
        self,
        task_key: str,
        temperature: float,
        success: bool,
        confidence: Optional[float] = None
    ):
        """
        Registra resultado para aprendizado.

        Args:
            task_key: Identificador da tarefa
            temperature: Temperatura usada
            success: Se foi bem-sucedido
            confidence: Confiança na resposta (0-1)
        """
        if task_key not in self._history:
            self._history[task_key] = []

        self._history[task_key].append({
            "temperature": temperature,
            "success": success,
            "confidence": confidence
        })

    def get_recommended_temperature(
        self,
        task_key: str,
        base_temperature: float = 0.7
    ) -> float:
        """
        Retorna temperatura recomendada baseada no histórico.

        Args:
            task_key: Identificador da tarefa
            base_temperature: Temperatura base

        Returns:
            Temperatura ajustada
        """
        if task_key not in self._history or len(self._history[task_key]) < 5:
            return base_temperature

        # Analisar últimos 10 resultados
        recent = self._history[task_key][-10:]

        # Calcular taxa de sucesso por faixa de temperatura
        success_rate = sum(1 for r in recent if r["success"]) / len(recent)

        # Ajustar baseado no sucesso
        if success_rate > 0.8:
            # Está indo bem, manter
            return base_temperature
        elif success_rate < 0.5:
            # Baixo sucesso, ajustar temperatura
            adjustment = -0.1 if base_temperature > 0.5 else 0.1
            new_temp = max(0.0, min(1.0, base_temperature + adjustment))

            logger.info(
                f"🎯 Ajustando temperatura de {task_key}: "
                f"{base_temperature} → {new_temp} (sucesso: {success_rate:.1%})"
            )

            return new_temp

        return base_temperature


# Singleton global
_adaptive_temp: Optional[AdaptiveTemperature] = None


def get_adaptive_temperature() -> AdaptiveTemperature:
    """Retorna instância global do sistema adaptativo."""
    global _adaptive_temp
    if _adaptive_temp is None:
        _adaptive_temp = AdaptiveTemperature()
    return _adaptive_temp


def get_temperature_for_task(
    task_description: str,
    agent_id: Optional[str] = None,
    use_adaptive: bool = False
) -> float:
    """
    Helper para obter temperatura ideal.

    Args:
        task_description: Descrição da tarefa
        agent_id: ID do agente (opcional)
        use_adaptive: Se deve usar sistema adaptativo

    Returns:
        Temperatura otimizada
    """
    # Detectar tipo de tarefa por palavras-chave
    desc_lower = task_description.lower()

    if any(kw in desc_lower for kw in ["analise", "analisar", "classificar", "extrair"]):
        task_type = TaskType.ANALYSIS
    elif any(kw in desc_lower for kw in ["resumir", "resumo", "sintetizar"]):
        task_type = TaskType.SUMMARIZATION
    elif any(kw in desc_lower for kw in ["redigir", "criar", "gerar", "escrever"]):
        task_type = TaskType.GENERATION
    elif any(kw in desc_lower for kw in ["traduzir", "tradução"]):
        task_type = TaskType.TRANSLATION
    else:
        task_type = None

    # Usar configuração do agente se disponível
    if agent_id:
        temp = TemperatureConfig.get_config_for_agent(agent_id)
    else:
        temp = TemperatureConfig.get_temperature(task_type=task_type)

    # Aplicar sistema adaptativo se habilitado
    if use_adaptive and agent_id:
        adaptive = get_adaptive_temperature()
        temp = adaptive.get_recommended_temperature(agent_id, temp)

    return temp


# Example usage
"""
from lib.temperature_config import TemperatureConfig, get_temperature_for_task

# 1. Por tipo de tarefa
temp = TemperatureConfig.get_temperature(TaskType.ANALYSIS)
# 0.1 - baixa para análise precisa

temp = TemperatureConfig.get_temperature(TaskType.GENERATION)
# 0.7 - alta para geração criativa

# 2. Por tarefa jurídica específica
temp = TemperatureConfig.get_temperature(legal_task="analise_contrato")
# 0.3

temp = TemperatureConfig.get_temperature(legal_task="redacao_peticao")
# 0.7

# 3. Por agente
temp = TemperatureConfig.get_config_for_agent("justine")
# 0.2 - preciso para análise de intimações

temp = TemperatureConfig.get_config_for_agent("redacao-peticoes")
# 0.7 - criativo para redação

# 4. Detectar automaticamente
temp = get_temperature_for_task(
    "Analisar contrato de prestação de serviços",
    agent_id="harvey"
)

# 5. Sistema adaptativo
from lib.temperature_config import get_adaptive_temperature

adaptive = get_adaptive_temperature()

# Registrar resultado
adaptive.record_result(
    task_key="analise_contrato",
    temperature=0.3,
    success=True,
    confidence=0.9
)

# Obter recomendação ajustada
temp = adaptive.get_recommended_temperature("analise_contrato", base_temperature=0.3)
"""
