#!/usr/bin/env python3
"""
Script de monitoramento de métricas do Agent Server

Coleta e exibe métricas importantes para monitorar a saúde e performance
do deployment do assistente jurídico.
"""

import asyncio
import os
from datetime import datetime, timedelta
from typing import Dict, List

from langgraph_sdk import get_client


class AgentServerMonitor:
    """Monitor para métricas do Agent Server"""

    def __init__(self, deployment_url: str, api_key: str):
        self.client = get_client(url=deployment_url, api_key=api_key)
        self.assistant_id = "legal_assistant"

    async def get_run_metrics(self, hours: int = 24) -> Dict:
        """Coleta métricas de runs nas últimas N horas"""
        try:
            # Buscar runs recentes
            runs = await self.client.runs.list(limit=1000)

            # Calcular métricas
            total_runs = len(runs)
            successful_runs = len([r for r in runs if r.get("status") == "success"])
            failed_runs = len([r for r in runs if r.get("status") == "error"])
            pending_runs = len([r for r in runs if r.get("status") == "pending"])

            success_rate = (successful_runs / total_runs * 100) if total_runs > 0 else 0

            # Calcular latência média
            durations = []
            for run in runs:
                if run.get("status") == "success" and run.get("created_at") and run.get("updated_at"):
                    created = datetime.fromisoformat(run["created_at"].replace("Z", "+00:00"))
                    updated = datetime.fromisoformat(run["updated_at"].replace("Z", "+00:00"))
                    duration = (updated - created).total_seconds()
                    durations.append(duration)

            avg_latency = sum(durations) / len(durations) if durations else 0
            max_latency = max(durations) if durations else 0

            return {
                "total_runs": total_runs,
                "successful_runs": successful_runs,
                "failed_runs": failed_runs,
                "pending_runs": pending_runs,
                "success_rate": round(success_rate, 2),
                "avg_latency_seconds": round(avg_latency, 2),
                "max_latency_seconds": round(max_latency, 2),
            }
        except Exception as e:
            print(f"Erro ao coletar métricas de runs: {e}")
            return {}

    async def get_thread_metrics(self) -> Dict:
        """Coleta métricas de threads"""
        try:
            # Buscar threads por status
            idle_threads = await self.client.threads.search(status="idle", limit=1000)
            busy_threads = await self.client.threads.search(status="busy", limit=1000)
            interrupted_threads = await self.client.threads.search(status="interrupted", limit=1000)
            error_threads = await self.client.threads.search(status="error", limit=1000)

            return {
                "total_threads": len(idle_threads) + len(busy_threads) + len(interrupted_threads) + len(error_threads),
                "idle_threads": len(idle_threads),
                "busy_threads": len(busy_threads),
                "interrupted_threads": len(interrupted_threads),
                "error_threads": len(error_threads),
            }
        except Exception as e:
            print(f"Erro ao coletar métricas de threads: {e}")
            return {}

    async def get_assistant_info(self) -> Dict:
        """Coleta informações do assistant"""
        try:
            assistants = await self.client.assistants.search()
            legal_assistant = next(
                (a for a in assistants if a.get("graph_id") == self.assistant_id),
                None
            )

            if legal_assistant:
                return {
                    "assistant_id": legal_assistant.get("assistant_id"),
                    "graph_id": legal_assistant.get("graph_id"),
                    "name": legal_assistant.get("name", "N/A"),
                    "created_at": legal_assistant.get("created_at"),
                    "updated_at": legal_assistant.get("updated_at"),
                }
            return {}
        except Exception as e:
            print(f"Erro ao coletar informações do assistant: {e}")
            return {}

    async def check_health(self) -> bool:
        """Verifica saúde do servidor"""
        try:
            # Tentar criar um thread simples
            thread = await self.client.threads.create()
            await self.client.threads.delete(thread["thread_id"])
            return True
        except Exception as e:
            print(f"Health check falhou: {e}")
            return False

    def print_metrics(self, metrics: Dict):
        """Imprime métricas formatadas"""
        print("\n" + "="*60)
        print(f"📊 MÉTRICAS DO AGENT SERVER - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)

        if "health" in metrics:
            status = "✅ Saudável" if metrics["health"] else "❌ Com problemas"
            print(f"\n🏥 Health Check: {status}")

        if "assistant" in metrics and metrics["assistant"]:
            print("\n📋 Informações do Assistant:")
            for key, value in metrics["assistant"].items():
                print(f"  • {key}: {value}")

        if "runs" in metrics and metrics["runs"]:
            print("\n🏃 Métricas de Runs (últimas 24h):")
            runs = metrics["runs"]
            print(f"  • Total de runs: {runs.get('total_runs', 0)}")
            print(f"  • Bem-sucedidos: {runs.get('successful_runs', 0)}")
            print(f"  • Falhas: {runs.get('failed_runs', 0)}")
            print(f"  • Pendentes: {runs.get('pending_runs', 0)}")
            print(f"  • Taxa de sucesso: {runs.get('success_rate', 0)}%")
            print(f"  • Latência média: {runs.get('avg_latency_seconds', 0)}s")
            print(f"  • Latência máxima: {runs.get('max_latency_seconds', 0)}s")

        if "threads" in metrics and metrics["threads"]:
            print("\n🧵 Métricas de Threads:")
            threads = metrics["threads"]
            print(f"  • Total de threads: {threads.get('total_threads', 0)}")
            print(f"  • Idle: {threads.get('idle_threads', 0)}")
            print(f"  • Busy: {threads.get('busy_threads', 0)}")
            print(f"  • Interrupted: {threads.get('interrupted_threads', 0)}")
            print(f"  • Error: {threads.get('error_threads', 0)}")

        print("\n" + "="*60 + "\n")

    async def collect_all_metrics(self) -> Dict:
        """Coleta todas as métricas"""
        print("🔍 Coletando métricas...")

        metrics = {
            "health": await self.check_health(),
            "assistant": await self.get_assistant_info(),
            "runs": await self.get_run_metrics(hours=24),
            "threads": await self.get_thread_metrics(),
        }

        return metrics

    async def monitor_continuous(self, interval_seconds: int = 300):
        """Monitora continuamente com intervalo especificado"""
        print(f"🔄 Iniciando monitoramento contínuo (intervalo: {interval_seconds}s)")
        print("   Pressione Ctrl+C para parar\n")

        try:
            while True:
                metrics = await self.collect_all_metrics()
                self.print_metrics(metrics)

                # Alertas
                if metrics["runs"]:
                    if metrics["runs"].get("success_rate", 100) < 90:
                        print("⚠️  ALERTA: Taxa de sucesso abaixo de 90%!")

                    if metrics["runs"].get("avg_latency_seconds", 0) > 5:
                        print("⚠️  ALERTA: Latência média acima de 5 segundos!")

                if metrics["threads"]:
                    if metrics["threads"].get("error_threads", 0) > 10:
                        print("⚠️  ALERTA: Mais de 10 threads em erro!")

                await asyncio.sleep(interval_seconds)

        except KeyboardInterrupt:
            print("\n\n✅ Monitoramento encerrado pelo usuário")


async def main():
    """Função principal"""
    # Configuração
    deployment_url = os.getenv("DEPLOYMENT_URL", "http://localhost:2024")
    api_key = os.getenv("LANGSMITH_API_KEY", "")

    # API key só é obrigatória para deployment remoto
    if not api_key and "localhost" not in deployment_url and "127.0.0.1" not in deployment_url:
        print("❌ Erro: LANGSMITH_API_KEY não configurada!")
        print("   Configure: export LANGSMITH_API_KEY=sua_chave")
        return

    # Criar monitor
    monitor = AgentServerMonitor(deployment_url, api_key)

    # Escolher modo
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--continuous":
        interval = int(sys.argv[2]) if len(sys.argv) > 2 else 300
        await monitor.monitor_continuous(interval_seconds=interval)
    else:
        # Modo single-shot
        metrics = await monitor.collect_all_metrics()
        monitor.print_metrics(metrics)

        print("💡 Dica: Use '--continuous [interval]' para monitoramento contínuo")
        print("   Exemplo: python monitor_metrics.py --continuous 60")


if __name__ == "__main__":
    asyncio.run(main())
