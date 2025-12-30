"""Router de Cron Jobs - Gerenciamento de tarefas agendadas.

Este router expõe o estado do APScheduler definido em `backend/cron_jobs.py`.
"""

import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cron", tags=["cron"])

# Constantes
JOB_NOT_FOUND = "Job não encontrado"


class CronJob(BaseModel):
    """Modelo de cron job"""

    id: str
    name: str
    schedule: str
    enabled: bool
    last_run: str | None = None
    next_run: str | None = None
    status: str = "idle"




def _fmt_dt(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None


def _get_scheduler():
    from backend.cron_jobs import get_scheduler

    return get_scheduler()


def _job_to_model(job) -> CronJob:
    trigger = getattr(job, "trigger", None)
    next_run = getattr(job, "next_run_time", None)
    enabled = next_run is not None

    return CronJob(
        id=str(getattr(job, "id", "")),
        name=str(getattr(job, "name", "")) or str(getattr(job, "id", "")),
        schedule=str(trigger) if trigger is not None else "-",
        enabled=enabled,
        last_run=None,
        next_run=_fmt_dt(next_run),
        status="idle",
    )


@router.get("/jobs", response_model=List[CronJob])
async def list_jobs():
    """Lista todos os cron jobs"""
    scheduler = _get_scheduler()
    return [_job_to_model(j) for j in scheduler.get_jobs()]


@router.get("/jobs/{job_id}", response_model=CronJob)
async def get_job(job_id: str):
    """Obtém detalhes de um job específico"""
    scheduler = _get_scheduler()
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND)
    return _job_to_model(job)


@router.post("/jobs/{job_id}/enable")
async def enable_job(job_id: str):
    """Habilita um job"""
    scheduler = _get_scheduler()
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND)

    scheduler.resume_job(job_id)
    logger.info("Job %s habilitado", job_id)
    return {"success": True, "message": f"Job {job_id} habilitado"}


@router.post("/jobs/{job_id}/disable")
async def disable_job(job_id: str):
    """Desabilita um job"""
    scheduler = _get_scheduler()
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND)

    scheduler.pause_job(job_id)
    logger.info("Job %s desabilitado", job_id)
    return {"success": True, "message": f"Job {job_id} desabilitado"}


@router.post("/jobs/{job_id}/run")
async def run_job_now(job_id: str):
    """Executa um job manualmente"""
    scheduler = _get_scheduler()
    job = scheduler.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=JOB_NOT_FOUND)

    logger.info("Executando job %s manualmente", job_id)

    # Best-effort: executar a função configurada.
    # Observação: no nosso scheduler, as funções são wrappers que já lidam com async.
    try:
        result = job.func(*job.args, **job.kwargs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao executar job: {e}")

    return {
        "success": True,
        "message": f"Job {job_id} disparado",
        "job_id": job_id,
        "result": str(result),
    }


@router.get("/status")
async def get_cron_status():
    """Obtém status geral do sistema de cron"""
    scheduler = _get_scheduler()
    jobs = scheduler.get_jobs()

    total_jobs = len(jobs)
    enabled_jobs = sum(1 for j in jobs if getattr(j, "next_run_time", None) is not None)

    return {
        "total_jobs": total_jobs,
        "enabled_jobs": enabled_jobs,
        "running_jobs": 0,
        "healthy": True,
        "scheduler_running": scheduler.running,
    }
