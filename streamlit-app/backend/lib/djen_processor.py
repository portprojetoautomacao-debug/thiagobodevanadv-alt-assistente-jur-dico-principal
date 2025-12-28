"""
Processador Automático de Intimações DJEN
Integra publicações DJEN com agente Mrs. Justin-e
"""

import logging
from datetime import datetime
from typing import Any, Dict, List

from database import RedisClient
from lib.agents.justine import create_justine_agent

logger = logging.getLogger(__name__)


async def processar_intimacoes_pendentes():
    """
    Processa intimações não processadas do Redis com Mrs. Justin-e.

    Fluxo:
    1. Buscar publicações não notificadas do Redis
    2. Para cada publicação, executar Mrs. Justin-e
    3. Gerar tarefas automáticas com prazos
    4. Criar minutas sugeridas (se aplicável)
    5. Marcar como processada
    """
    try:
        redis = RedisClient()

        # Buscar publicações não processadas
        publications = redis.get("publications") or []
        pendentes = [p for p in publications if not p.get("notified", False)]

        if not pendentes:
            logger.info("✅ Nenhuma intimação pendente para processar")
            return {"processed": 0, "tasks": 0}

        logger.info(f"📋 Processando {len(pendentes)} intimações pendentes...")

        # Criar agente Mrs. Justin-e
        justine = await create_justine_agent()

        tasks_created = 0
        processed_count = 0

        for pub in pendentes[:10]:  # Processar máximo 10 por vez
            try:
                # Preparar contexto da intimação
                context = f"""
                Tribunal: {pub.get('tribunal')}
                Processo: {pub.get('numeroProcesso')}
                Tipo: {pub.get('tipo')}
                Data: {pub.get('data')}
                Órgão: {pub.get('orgao')}

                Conteúdo:
                {pub.get('teor', '')[:500]}
                """

                # Executar Mrs. Justin-e
                task = f"Analisar intimação e gerar tarefas: {context}"
                result = await justine.execute(task)

                # Extrair tarefas geradas
                if result.get("tasks"):
                    # Salvar tarefas no Redis
                    existing_tasks = redis.get("tasks") or []
                    for task_data in result["tasks"]:
                        task_obj = {
                            "id": datetime.now().timestamp(),
                            "intimacao_id": pub.get("id"),
                            "processo": pub.get("numeroProcesso"),
                            "titulo": task_data.get("titulo"),
                            "prazo": task_data.get("prazo"),
                            "prioridade": task_data.get("prioridade", "media"),
                            "status": "pendente",
                            "createdAt": datetime.now().isoformat(),
                        }
                        existing_tasks.insert(0, task_obj)
                        tasks_created += 1

                    redis.set("tasks", existing_tasks[:500])

                # Marcar como processada
                pub["notified"] = True
                pub["processedAt"] = datetime.now().isoformat()
                pub["processedBy"] = "mrs-justine"

                processed_count += 1

            except Exception as e:
                logger.error(f"❌ Erro ao processar intimação {pub.get('id')}: {e}")
                continue

        # Salvar publicações atualizadas
        redis.set("publications", publications)

        logger.info(
            f"✅ Processadas {processed_count} intimações, {tasks_created} tarefas criadas"
        )

        # Enviar notificação por email
        if processed_count > 0:
            try:
                from lib.email_service import get_email_service

                email_service = get_email_service()
                intimacoes_para_email = [p for p in pendentes[:processed_count]]
                email_service.enviar_alerta_intimacoes(
                    intimacoes_para_email, tasks_created
                )
            except Exception as e:
                logger.warning(f"⚠️ Falha ao enviar email: {e}")

        return {"processed": processed_count, "tasks": tasks_created, "success": True}

    except Exception as e:
        logger.error(f"❌ Erro crítico ao processar intimações: {e}")
        return {"processed": 0, "tasks": 0, "error": str(e)}


async def gerar_minutas_automaticas():
    """
    Gera minutas sugeridas para tarefas pendentes.

    Conecta com agente de redação para criar minutas prontas.
    """
    try:
        redis = RedisClient()

        # Buscar tarefas que precisam de minuta
        tasks = redis.get("tasks") or []
        tasks_sem_minuta = [
            t for t in tasks if t.get("status") == "pendente" and not t.get("minuta_id")
        ]

        if not tasks_sem_minuta:
            return {"minutas": 0}

        logger.info(f"📝 Gerando minutas para {len(tasks_sem_minuta)} tarefas...")

        # TODO: Integrar com agente de redação
        # from lib.agents.redacao import create_redacao_agent
        # redacao = await create_redacao_agent()

        minutas_geradas = 0

        # Por enquanto, apenas log
        logger.info(
            f"ℹ️ {len(tasks_sem_minuta)} minutas a serem geradas (implementação pendente)"
        )

        return {"minutas": minutas_geradas, "success": True}

    except Exception as e:
        logger.error(f"❌ Erro ao gerar minutas: {e}")
        return {"minutas": 0, "error": str(e)}
