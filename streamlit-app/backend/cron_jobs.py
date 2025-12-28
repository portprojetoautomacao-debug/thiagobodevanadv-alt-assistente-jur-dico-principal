"""
Cron Jobs - Automação de Tarefas
Agendamento de execução de agentes e monitoramento.

Dependências:
- apscheduler: pip install apscheduler==3.10.4
"""

import logging
import sys
from pathlib import Path

# APScheduler para agendamento de tarefas
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore
from apscheduler.triggers.cron import CronTrigger  # type: ignore

# Adicionar diretório lib ao path para imports
sys.path.append(str(Path(__file__).parent.parent / "lib"))

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
# Orquestrador será importado quando necessário para evitar dependências circulares


async def run_djen_monitor():
    """Executa o monitoramento do DJEN via API REST."""
    logger.info("⏰ CRON: Iniciando monitoramento DJEN...")
    try:
        from datetime import datetime, timedelta

        from database import RedisClient
        from integrations.djen_api_client import DJENAPIClient  # type: ignore

        redis = RedisClient()
        client = DJENAPIClient()

        # Buscar advogados monitorados
        lawyers = redis.get("monitored-lawyers") or []
        if not lawyers:
            # Configuração padrão: Thiago Bodevan
            lawyers = [
                {
                    "id": "thiago-bodevan",
                    "name": "Thiago Bodevan Veiga",
                    "oab": "184404/MG",
                    "enabled": True,
                }
            ]

        enabled_lawyers = [lawyer for lawyer in lawyers if lawyer.get("enabled", True)]

        # Datas: últimos 7 dias
        today = datetime.now()
        data_fim = today.strftime("%Y-%m-%d")
        data_inicio = (today - timedelta(days=7)).strftime("%Y-%m-%d")

        new_count = 0
        total_found = 0

        for lawyer in enabled_lawyers:
            # Parse OAB
            oab_value = lawyer.get("oab", "")
            if not isinstance(oab_value, str):
                logger.warning(f"OAB inválida para {lawyer.get('name')}: {oab_value}")
                continue
            oab_parts = oab_value.replace("/", " ").split()
            if len(oab_parts) < 2:
                continue

            numero_oab = oab_parts[0]
            uf_oab = oab_parts[1]

            # Buscar publicações
            publicacoes = client.buscar_publicacoes(
                numero_oab=numero_oab,
                uf_oab=uf_oab,
                data_inicio=data_inicio,
                data_fim=data_fim,
            )

            total_found += len(publicacoes)

            # Salvar no Redis (evitar duplicatas)
            existing_pubs = redis.get("publications") or []
            existing_hashes = {p.get("hash") for p in existing_pubs if p.get("hash")}

            for pub in publicacoes:
                pub_hash = f"{pub.sigla_tribunal}-{pub.data_disponibilizacao}-{pub.numero_processo}"
                if pub_hash not in existing_hashes:
                    new_pub = {
                        "id": pub.id,
                        "tribunal": pub.sigla_tribunal,
                        "data": pub.data_disponibilizacao,
                        "processo": pub.numero_processo,
                        "tipo": pub.tipo_comunicacao,
                        "teor": pub.texto[:2000],
                        "hash": pub_hash,
                        "lawyerId": lawyer.get("id"),
                        "lawyerName": lawyer.get("name"),
                        "notified": False,
                        "createdAt": datetime.now().isoformat(),
                    }
                    existing_pubs.insert(0, new_pub)
                    existing_hashes.add(pub_hash)
                    new_count += 1

            # Salvar atualizado
            redis.set("publications", existing_pubs[:1000])

        logger.info(f"✅ CRON DJEN: {new_count} novas de {total_found} encontradas")

        # Processar intimações com Mrs. Justin-e
        if new_count > 0:
            from lib.djen_processor import processar_intimacoes_pendentes

            result = await processar_intimacoes_pendentes()
            logger.info(
                f"🤖 Mrs. Justin-e processou {result.get('processed', 0)} intimações"
            )

    except Exception as e:
        logger.error(f"❌ CRON: Erro no monitoramento DJEN: {e}")


async def run_datajud_monitor():
    """Executa atualização de dados via DataJud."""
    logger.info("⏰ CRON: Iniciando monitoramento DataJud...")
    try:
        # Exemplo: Atualizar processos ativos
        # Poderíamos ter um agente específico ou usar o 'pesquisa-juris' com uma task específica
        # Por enquanto, log apenas
        logger.info(
            "ℹ️ CRON: Monitoramento DataJud (Simulado - Atualizar andamentos dos processos ativos)"
        )
    except Exception as e:
        logger.error(f"❌ CRON: Erro no monitoramento DataJud: {e}")


def start_scheduler():
    """Inicia o agendador de tarefas."""
    if not scheduler.running:
        # DJEN: 2x por dia (12:00 e 20:00 BRT = 15:00 e 23:00 UTC)
        scheduler.add_job(
            run_djen_monitor,
            CronTrigger(hour=15, minute=0),  # 12:00 BRT
            id="djen_noon",
            replace_existing=True,
        )
        scheduler.add_job(
            run_djen_monitor,
            CronTrigger(hour=23, minute=0),  # 20:00 BRT
            id="djen_evening",
            replace_existing=True,
        )
        scheduler.add_job(
            run_djen_monitor,
            CronTrigger(hour=16, minute=0),
            id="djen_afternoon",
            replace_existing=True,
        )

        # DataJud: 1x por dia (02:00)
        scheduler.add_job(
            run_datajud_monitor,
            CronTrigger(hour=2, minute=0),
            id="datajud_night",
            replace_existing=True,
        )

        # Teste rápido (a cada 5 min para debug - remover em prod)
        # scheduler.add_job(run_djen_monitor, IntervalTrigger(minutes=5), id="debug_djen")

        scheduler.start()
        logger.info("🚀 Scheduler iniciado com sucesso")
