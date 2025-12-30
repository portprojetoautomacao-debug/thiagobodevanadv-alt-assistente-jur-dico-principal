"""
Batch Processor - Processamento em Lote com Paralelização.

Implementa batch() e abatch() para processar múltiplas operações em paralelo.
"""

import asyncio
import logging
from typing import Any, Callable, Dict, List, Optional, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar('T')
R = TypeVar('R')


class BatchProcessor:
    """
    Processador de lotes com controle de concorrência.

    Features:
    - Processamento paralelo
    - Limite de concorrência
    - Error handling por item
    - Progress tracking
    - Retry por item
    """

    def __init__(
        self,
        max_concurrency: int = 5,
        retry_failed: bool = True,
        max_retries: int = 3
    ):
        """
        Args:
            max_concurrency: Máximo de tarefas simultâneas
            retry_failed: Se deve retry em falhas
            max_retries: Máximo de tentativas por item
        """
        self.max_concurrency = max_concurrency
        self.retry_failed = retry_failed
        self.max_retries = max_retries

        self._stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "retried": 0
        }

    async def process_batch(
        self,
        items: List[T],
        processor: Callable[[T], Any],
        show_progress: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Processa lote de itens em paralelo.

        Args:
            items: Lista de itens para processar
            processor: Função assíncrona para processar cada item
            show_progress: Se deve mostrar progresso

        Returns:
            Lista de resultados com status
        """
        if not items:
            return []

        logger.info(f"🚀 Processando batch de {len(items)} itens")

        # Criar semáforo para controlar concorrência
        semaphore = asyncio.Semaphore(self.max_concurrency)

        async def process_with_semaphore(item: T, index: int) -> Dict[str, Any]:
            async with semaphore:
                return await self._process_item_with_retry(
                    item, index, processor
                )

        # Processar todos os itens
        tasks = [
            process_with_semaphore(item, i)
            for i, item in enumerate(items)
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Processar resultados
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "index": i,
                    "success": False,
                    "error": str(result),
                    "item": items[i]
                })
                self._stats["failed"] += 1
            else:
                processed_results.append(result)
                if result.get("success"):
                    self._stats["successful"] += 1
                else:
                    self._stats["failed"] += 1

        self._stats["total_processed"] += len(items)

        logger.info(
            f"✅ Batch completo: {self._stats['successful']}/{len(items)} sucesso"
        )

        return processed_results

    async def _process_item_with_retry(
        self,
        item: T,
        index: int,
        processor: Callable[[T], Any]
    ) -> Dict[str, Any]:
        """Processa item com retry."""
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                result = await processor(item)

                return {
                    "index": index,
                    "success": True,
                    "result": result,
                    "attempts": attempt
                }

            except Exception as e:
                last_error = e

                if attempt < self.max_retries and self.retry_failed:
                    self._stats["retried"] += 1
                    logger.warning(
                        f"⚠️ Item {index} falhou (tentativa {attempt}): {e}"
                    )
                    await asyncio.sleep(0.5 * attempt)  # Backoff
                else:
                    logger.error(f"❌ Item {index} falhou após {attempt} tentativas")
                    break

        return {
            "index": index,
            "success": False,
            "error": str(last_error),
            "item": item,
            "attempts": self.max_retries
        }

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de processamento."""
        total = self._stats["total_processed"]
        success_rate = (
            self._stats["successful"] / total
            if total > 0 else 0
        )

        return {
            **self._stats,
            "success_rate": success_rate
        }

    def reset_stats(self):
        """Reseta estatísticas."""
        self._stats = {
            "total_processed": 0,
            "successful": 0,
            "failed": 0,
            "retried": 0
        }


class LangChainBatchProcessor:
    """
    Batch processor especializado para operações LangChain.
    """

    def __init__(self, max_concurrency: int = 5):
        self.processor = BatchProcessor(max_concurrency=max_concurrency)

    async def batch_invoke(
        self,
        runnable,
        inputs: List[Dict[str, Any]]
    ) -> List[Any]:
        """
        Executa runnable em batch.

        Args:
            runnable: Chain ou LLM do LangChain
            inputs: Lista de inputs

        Returns:
            Lista de resultados
        """
        async def process(input_data: Dict[str, Any]) -> Any:
            return await runnable.ainvoke(input_data)

        results = await self.processor.process_batch(inputs, process)

        # Extrair apenas os resultados bem-sucedidos
        return [
            r.get("result")
            for r in results
            if r.get("success")
        ]

    async def batch_with_different_prompts(
        self,
        llm,
        prompts: List[str]
    ) -> List[str]:
        """
        Executa múltiplos prompts em paralelo.

        Args:
            llm: Modelo de linguagem
            prompts: Lista de prompts

        Returns:
            Lista de respostas
        """
        async def process(prompt: str) -> str:
            response = await llm.ainvoke(prompt)
            return response.content

        results = await self.processor.process_batch(prompts, process)

        return [
            r.get("result", "")
            for r in results
            if r.get("success")
        ]


# Helpers globais

async def batch_process_agents(
    orchestrator,
    tasks: List[Dict[str, str]],
    max_concurrency: int = 3
) -> List[Dict[str, Any]]:
    """
    Processa múltiplas tarefas de agentes em paralelo.

    Args:
        orchestrator: Instância do orquestrador
        tasks: Lista de {agent_id, task, session_id}
        max_concurrency: Limite de concorrência

    Returns:
        Lista de resultados

    Usage:
        from lib.batch_processor import batch_process_agents
        from lib.langgraph_orchestrator import LangGraphOrchestrator

        orchestrator = LangGraphOrchestrator()

        tasks = [
            {"agent_id": "harvey", "task": "Analisar contrato A"},
            {"agent_id": "justine", "task": "Revisar intimação B"},
            {"agent_id": "harvey", "task": "Analisar contrato C"},
        ]

        results = await batch_process_agents(orchestrator, tasks)
    """
    processor = BatchProcessor(max_concurrency=max_concurrency)

    async def process(task_data: Dict[str, str]) -> Dict[str, Any]:
        return await orchestrator.execute_agent(
            agent_id=task_data["agent_id"],
            task=task_data["task"],
            session_id=task_data.get("session_id")
        )

    return await processor.process_batch(tasks, process)


async def batch_analyze_documents(
    llm,
    documents: List[str],
    analysis_prompt: str,
    max_concurrency: int = 5
) -> List[str]:
    """
    Analisa múltiplos documentos em paralelo.

    Args:
        llm: Modelo de linguagem
        documents: Lista de textos
        analysis_prompt: Template de prompt com {document}
        max_concurrency: Limite de concorrência

    Returns:
        Lista de análises

    Usage:
        from lib.batch_processor import batch_analyze_documents

        analyses = await batch_analyze_documents(
            llm=llm,
            documents=[doc1, doc2, doc3],
            analysis_prompt="Analise o seguinte documento:\n\n{document}\n\nResumo:"
        )
    """
    processor = BatchProcessor(max_concurrency=max_concurrency)

    async def analyze(document: str) -> str:
        prompt = analysis_prompt.format(document=document)
        response = await llm.ainvoke(prompt)
        return response.content

    results = await processor.process_batch(documents, analyze)

    return [
        r.get("result", "Erro na análise")
        for r in results
    ]


# Example usage
"""
# 1. Processar múltiplos agentes
from lib.batch_processor import batch_process_agents
from lib.langgraph_orchestrator import LangGraphOrchestrator

orchestrator = LangGraphOrchestrator()

tasks = [
    {"agent_id": "harvey", "task": "Analisar contrato 1"},
    {"agent_id": "harvey", "task": "Analisar contrato 2"},
    {"agent_id": "justine", "task": "Processar intimação 1"},
    {"agent_id": "justine", "task": "Processar intimação 2"},
]

# Processa 3 por vez
results = await batch_process_agents(orchestrator, tasks, max_concurrency=3)

# 2. Análise de documentos
from lib.batch_processor import batch_analyze_documents

contratos = [contrato1_texto, contrato2_texto, contrato3_texto]

analises = await batch_analyze_documents(
    llm=llm,
    documents=contratos,
    analysis_prompt="Resuma o contrato:\n\n{document}",
    max_concurrency=5
)

# 3. Batch customizado
from lib.batch_processor import BatchProcessor

processor = BatchProcessor(max_concurrency=10)

async def process_item(item):
    # Sua lógica aqui
    return await some_async_function(item)

results = await processor.process_batch(items, process_item)

# Ver estatísticas
stats = processor.get_stats()
print(f"Sucesso: {stats['success_rate']:.1%}")
"""
