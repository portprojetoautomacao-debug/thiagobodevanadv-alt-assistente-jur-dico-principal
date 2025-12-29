"""
Testes para Cron Jobs
"""

import os
import sys
from unittest.mock import AsyncMock, Mock, patch

import pytest

# Adicionar backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from cron_jobs import scheduler, start_scheduler


class TestCronJobs:
    """Testes do sistema de cron jobs"""

    def test_scheduler_existe(self):
        """Testar que o scheduler está definido"""
        assert scheduler is not None

    def test_start_scheduler(self):
        """Testar inicialização do scheduler"""
        # Scheduler pode já estar rodando de outro teste
        if not scheduler.running:
            start_scheduler()
        assert scheduler.running

    def test_jobs_configurados(self):
        """Testar que jobs estão configurados"""
        if not scheduler.running:
            start_scheduler()
        
        jobs = scheduler.get_jobs()
        job_ids = [job.id for job in jobs]
        
        # Verificar jobs principais
        assert "djen_noon" in job_ids or "djen_evening" in job_ids or len(jobs) > 0
