"""
Testes para Cron Jobs Manager
"""

import os
import sys
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

# Adicionar backend ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from cron_jobs import CronJobsManager


class TestCronJobsManager:
    """Testes do gerenciador de cron jobs"""

    def test_inicializacao(self):
        """Testar inicialização do manager"""
        manager = CronJobsManager(timezone="America/Sao_Paulo")

        assert manager.scheduler is not None
        assert manager.timezone == "America/Sao_Paulo"
        assert isinstance(manager.jobs, dict)

    def test_add_job(self):
        """Testar adição de job"""
        from apscheduler.triggers.interval import IntervalTrigger

        manager = CronJobsManager()

        def test_func():
            pass

        manager.add_job(
            func=test_func,
            trigger=IntervalTrigger(seconds=60),
            job_id="test_job",
            name="Test Job",
        )

        assert "test_job" in manager.jobs
        assert manager.jobs["test_job"].id == "test_job"

    def test_start_inicializa_jobs(self):
        """Testar que start() inicializa todos os jobs"""
        manager = CronJobsManager()
        manager.start()

        # Verificar que scheduler está rodando
        assert manager.scheduler.running is True

        # Verificar jobs principais
        jobs = manager.scheduler.get_jobs()
        job_ids = [job.id for job in jobs]

        assert "daily_reset" in job_ids
        assert "djen_monitor" in job_ids
        assert "process_queue" in job_ids
        assert "deadline_alerts" in job_ids

        # Parar scheduler
        manager.stop()

    def test_stop(self):
        """Testar parada do scheduler"""
        manager = CronJobsManager()
        manager.start()

        assert manager.scheduler.running is True

        manager.stop()

        assert manager.scheduler.running is False

    def test_list_jobs(self, caplog):
        """Testar listagem de jobs"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.start()

        manager.list_jobs()

        # Verificar que lista foi logada
        assert "Jobs agendados" in caplog.text

        manager.stop()

    @patch("cron_jobs.DJENScraper")
    def test_monitor_djen_executa(self, mock_scraper):
        """Testar execução do job DJEN Monitor"""
        mock_instance = Mock()
        mock_instance.buscar_por_oab.return_value = []
        mock_scraper.return_value = mock_instance

        manager = CronJobsManager()
        manager.monitor_djen()

        # Verificar que scraper foi chamado
        mock_scraper.assert_called_once_with(headless=True)
        mock_instance.buscar_por_oab.assert_called_once()

    @patch("cron_jobs.DataJudClient")
    def test_check_datajud_executa(self, mock_client):
        """Testar execução do job DataJud Check"""
        mock_instance = Mock()
        mock_client.return_value = mock_instance

        manager = CronJobsManager()
        manager.check_datajud()

        # Verificar que client foi criado
        mock_client.assert_called_once()

    def test_daily_reset_executa(self, caplog):
        """Testar execução do Daily Reset"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.daily_reset()

        assert "DAILY RESET" in caplog.text

    def test_process_queue_executa(self, caplog):
        """Testar execução do Process Queue"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.process_agent_queue()

        assert "PROCESS QUEUE" in caplog.text

    def test_deadline_alerts_executa(self, caplog):
        """Testar execução do Deadline Alerts"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.deadline_alerts()

        assert "DEADLINE ALERTS" in caplog.text

    def test_watchdog_executa(self, caplog):
        """Testar execução do Watchdog"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.watchdog()

        assert "WATCHDOG" in caplog.text

    def test_backup_executa(self, caplog):
        """Testar execução do Backup"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.backup_database()

        assert "BACKUP" in caplog.text

    def test_sync_calendar_executa(self, caplog):
        """Testar execução do Calendar Sync"""
        import logging

        caplog.set_level(logging.INFO)

        manager = CronJobsManager()
        manager.sync_calendar()

        assert "CALENDAR SYNC" in caplog.text

    def test_jobs_nao_duplicados(self):
        """Testar que jobs não são duplicados ao chamar start() múltiplas vezes"""
        manager = CronJobsManager()
        manager.start()

        jobs_antes = len(manager.scheduler.get_jobs())

        # Tentar adicionar novamente (replace_existing=True)
        manager.start()

        jobs_depois = len(manager.scheduler.get_jobs())

        assert jobs_antes == jobs_depois

        manager.stop()

    def test_variaveis_ambiente_carregadas(self):
        """Testar que variáveis de ambiente são carregadas"""
        import os

        os.environ["OAB_NUMERO"] = "99999"
        os.environ["OAB_UF"] = "SP"

        manager = CronJobsManager()

        assert manager.djen_oab == "99999"
        assert manager.djen_uf == "SP"

        # Limpar
        del os.environ["OAB_NUMERO"]
        del os.environ["OAB_UF"]
