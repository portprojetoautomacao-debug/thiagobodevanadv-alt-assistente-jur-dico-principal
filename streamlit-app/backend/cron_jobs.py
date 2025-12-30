"""
Cron Jobs - Automação de Tarefas
Agendamento de execução de agentes e monitoramento.

Dependências:
- apscheduler: pip install apscheduler==3.10.4
"""

import logging
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

# APScheduler para agendamento de tarefas
from apscheduler.schedulers.asyncio import AsyncIOScheduler  # type: ignore
from apscheduler.triggers.cron import CronTrigger  # type: ignore

# Adicionar diretório lib ao path para imports
sys.path.append(str(Path(__file__).parent.parent / "lib"))

logger = logging.getLogger(__name__)

SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")

scheduler = AsyncIOScheduler(timezone=SAO_PAULO_TZ)
# Orquestrador será importado quando necessário para evitar dependências circulares


def _set_djen_heartbeat(payload: dict) -> None:
    try:
        from database import RedisClient

        redis = RedisClient()
        redis.set("djen:heartbeat", payload)
    except Exception:
        pass


async def run_djen_monitor():
    """Executa o monitoramento do DJEN via API REST."""
    logger.info("⏰ CRON: Iniciando monitoramento DJEN...")
    try:
        from datetime import datetime, timedelta

        from agents.justine import JustineAgent
        from database import RedisClient

        redis = RedisClient()

        # Mrs. Justin-e chama a tool do DJEN para coletar publicações do dia
        justine = JustineAgent()

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

        # Datas: do último horário até agora (por data de disponibilização)
        now = datetime.now(SAO_PAULO_TZ)
        last_run_key = "djen:last_run_at"
        heartbeat_key = "djen:heartbeat"
        last_run_raw = redis.get(last_run_key)

        last_run = None
        if isinstance(last_run_raw, str) and last_run_raw:
            try:
                last_run = datetime.fromisoformat(last_run_raw)
            except Exception:
                last_run = None

        # Limite de segurança: no máximo últimos 7 dias
        min_start = now - timedelta(days=7)
        start_dt = last_run if last_run and last_run > min_start else min_start

        data_inicio = start_dt.strftime("%Y-%m-%d")
        data_fim = now.strftime("%Y-%m-%d")

        new_count = 0
        total_found = 0

        existing_pubs = redis.get("publications") or []
        existing_hashes = {p.get("hash") for p in existing_pubs if p.get("hash")}

        items = justine.coletar_publicacoes_djen_diarias(
            enabled_lawyers,
            data_inicio=data_inicio,
            data_fim=data_fim,
        )

        total_found = len(items)

        for it in items:
            tribunal = it.get("tribunal")
            data_disp = it.get("dataDisponibilizacao")
            numero_processo = it.get("numeroProcesso")
            pub_hash = f"{tribunal}-{data_disp}-{numero_processo}"

            if pub_hash in existing_hashes:
                continue

            new_pub = {
                "id": it.get("id"),
                "tribunal": tribunal,
                "data": data_disp,
                "numeroProcesso": numero_processo,
                "processo": numero_processo,  # compat
                "tipo": it.get("tipo"),
                "orgao": it.get("orgao"),
                "teor": (it.get("teor") or "")[:2000],
                "hash": pub_hash,
                "lawyerId": it.get("lawyerId"),
                "lawyerName": it.get("lawyerName"),
                "oab": it.get("oab"),
                "notified": False,
                "createdAt": datetime.now(SAO_PAULO_TZ).isoformat(),
            }

            existing_pubs.insert(0, new_pub)
            existing_hashes.add(pub_hash)
            new_count += 1

        redis.set("publications", existing_pubs[:1000])

        # Persistir última execução apenas após completar a coleta
        redis.set(last_run_key, now.isoformat())

        # Heartbeat para observabilidade no dashboard
        redis.set(
            heartbeat_key,
            {
                "status": "ok",
                "ranAt": now.isoformat(),
                "window": {"start": data_inicio, "end": data_fim},
                "totalFound": total_found,
                "newCount": new_count,
                "lawyers": len(enabled_lawyers),
            },
        )

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
        from datetime import datetime

        _set_djen_heartbeat(
            {
                "status": "error",
                "ranAt": datetime.now(SAO_PAULO_TZ).isoformat(),
                "error": str(e),
            }
        )


def run_datajud_monitor():
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
        # DJEN: 2x por dia (00:30 e 09:00 horário de São Paulo)
        # - 00:30: pega o lote assim que o DJEN começa a disponibilizar (a partir de 0h)
        # - 09:00: redundância/recuperação em horário útil
        scheduler.add_job(
            run_djen_monitor,
            CronTrigger(hour=0, minute=30, timezone=SAO_PAULO_TZ),
            id="djen_midnight",
            replace_existing=True,
        )
        scheduler.add_job(
            run_djen_monitor,
            CronTrigger(hour=9, minute=0, timezone=SAO_PAULO_TZ),
            id="djen_morning",
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


def stop_scheduler():
    """Encerra o agendador de tarefas (best-effort)."""
    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("🛑 Scheduler encerrado")
    except Exception as e:
        logger.warning(f"⚠️ Falha ao encerrar scheduler: {e}")
