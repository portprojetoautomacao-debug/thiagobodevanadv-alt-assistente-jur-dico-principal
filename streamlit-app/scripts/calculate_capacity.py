#!/usr/bin/env python3
"""
Script para calcular a capacidade necessária do Agent Server
baseado nos requisitos de throughput do seu assistente jurídico.
"""

from dataclasses import dataclass
from typing import List, Tuple


@dataclass
class LoadScenario:
    """Cenário de carga"""
    name: str
    read_rps: float  # Requisições de leitura por segundo
    write_rps: float  # Requisições de escrita por segundo
    avg_run_time: float  # Tempo médio de execução em segundos
    is_io_bound: bool  # Se é limitado por I/O


def calculate_queue_workers(
    write_rps: float,
    avg_run_time: float,
    jobs_per_worker: int
) -> int:
    """
    Calcula o número de queue workers necessários.

    Fórmula:
    available_jobs = number_of_queue_workers * jobs_per_worker
    throughput = available_jobs / avg_run_time
    number_of_queue_workers = (throughput * avg_run_time) / jobs_per_worker
    """
    return max(1, int((write_rps * avg_run_time) / jobs_per_worker) + 1)


def calculate_api_servers(read_rps: float) -> int:
    """
    Calcula o número de API servers necessários.

    Regra de ouro: ~100 req/s por servidor com CPU 1-2 cores
    """
    servers_needed = max(1, int(read_rps / 100) + 1)
    # Sempre ter pelo menos 2 para redundância
    return max(2, servers_needed)


def estimate_postgres_resources(
    read_rps: float,
    write_rps: float
) -> Tuple[int, int]:
    """
    Estima recursos de PostgreSQL necessários.

    Returns:
        Tuple[cpu_cores, memory_gb]
    """
    total_rps = read_rps + write_rps

    if total_rps < 20:
        return (2, 8)
    elif total_rps < 100:
        return (4, 16)
    elif total_rps < 500:
        return (8, 32)
    else:
        return (16, 64)


def estimate_redis_memory(write_rps: float) -> int:
    """
    Estima memória Redis necessária (GB).

    Redis é usado para:
    - Pub/Sub para streaming
    - Cache de runs em andamento
    """
    if write_rps < 10:
        return 2
    elif write_rps < 100:
        return 4
    else:
        return 8


def calculate_capacity(scenario: LoadScenario) -> dict:
    """Calcula capacidade completa para um cenário"""

    # Determinar jobs per worker baseado em I/O bound
    jobs_per_worker = 25 if scenario.is_io_bound else 10

    # Calcular componentes
    queue_workers = calculate_queue_workers(
        scenario.write_rps,
        scenario.avg_run_time,
        jobs_per_worker
    )

    api_servers = calculate_api_servers(scenario.read_rps)

    postgres_cpu, postgres_memory = estimate_postgres_resources(
        scenario.read_rps,
        scenario.write_rps
    )

    redis_memory = estimate_redis_memory(scenario.write_rps)

    return {
        "scenario": scenario.name,
        "load": {
            "read_rps": scenario.read_rps,
            "write_rps": scenario.write_rps,
            "avg_run_time": scenario.avg_run_time,
            "is_io_bound": scenario.is_io_bound,
        },
        "configuration": {
            "api_servers": api_servers,
            "queue_workers": queue_workers,
            "jobs_per_worker": jobs_per_worker,
            "total_capacity": queue_workers * jobs_per_worker,
        },
        "resources": {
            "postgres": {
                "cpu_cores": postgres_cpu,
                "memory_gb": postgres_memory,
            },
            "redis": {
                "memory_gb": redis_memory,
            }
        }
    }


def print_capacity_report(capacity: dict):
    """Imprime relatório de capacidade formatado"""
    print("\n" + "="*70)
    print(f"📊 RELATÓRIO DE CAPACIDADE: {capacity['scenario']}")
    print("="*70)

    # Carga
    load = capacity['load']
    print("\n📈 Carga Esperada:")
    print(f"  • Requisições de leitura/segundo: {load['read_rps']}")
    print(f"  • Requisições de escrita/segundo: {load['write_rps']}")
    print(f"  • Tempo médio de execução: {load['avg_run_time']}s")
    print(f"  • Tipo: {'I/O Bound' if load['is_io_bound'] else 'CPU Bound'}")

    # Configuração
    config = capacity['configuration']
    print("\n⚙️  Configuração Recomendada:")
    print(f"  • API Servers: {config['api_servers']} réplicas")
    print(f"  • Queue Workers: {config['queue_workers']} réplicas")
    print(f"  • Jobs por Worker: {config['jobs_per_worker']}")
    print(f"  • Capacidade total de jobs: {config['total_capacity']}")

    # Recursos
    resources = capacity['resources']
    print("\n💾 Recursos Necessários:")
    print(f"  PostgreSQL:")
    print(f"    - CPU: {resources['postgres']['cpu_cores']} cores")
    print(f"    - Memory: {resources['postgres']['memory_gb']} GB")
    print(f"  Redis:")
    print(f"    - Memory: {resources['redis']['memory_gb']} GB")

    # Dicas
    print("\n💡 Dicas de Otimização:")
    if load['is_io_bound']:
        print("  • Seu assistente é I/O bound - considere aumentar jobs_per_worker")
        print("  • Use operações assíncronas sempre que possível")
        print("  • Cache agressivo pode reduzir chamadas externas")
    else:
        print("  • Seu assistente é CPU bound - adicione mais workers")
        print("  • Considere otimizar operações computacionais pesadas")
        print("  • Use BG_JOB_ISOLATED_LOOPS=true se necessário")

    if config['queue_workers'] > 10:
        print("  • Considere habilitar autoscaling para picos")

    print("\n" + "="*70 + "\n")


def generate_deployment_config(capacity: dict) -> str:
    """Gera configuração YAML para deployment"""
    config = capacity['configuration']
    resources = capacity['resources']

    yaml = f"""# Configuração gerada automaticamente para: {capacity['scenario']}
# Gerado em: {__import__('datetime').datetime.now().isoformat()}

api:
  replicas: {config['api_servers']}
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

queue:
  enabled: true
  replicas: {config['queue_workers']}
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

config:
  numberOfJobsPerWorker: {config['jobs_per_worker']}

postgres:
  resources:
    requests:
      cpu: "{resources['postgres']['cpu_cores']}"
      memory: "{resources['postgres']['memory_gb']}Gi"
    limits:
      cpu: "{resources['postgres']['cpu_cores'] * 2}"
      memory: "{resources['postgres']['memory_gb'] * 2}Gi"

redis:
  resources:
    requests:
      memory: "{resources['redis']['memory_gb']}Gi"
    limits:
      memory: "{resources['redis']['memory_gb']}Gi"
"""
    return yaml


def main():
    """Função principal"""
    print("\n🎯 CALCULADORA DE CAPACIDADE - AGENT SERVER")
    print("   Assistente Jurídico\n")

    # Definir cenários
    scenarios = [
        LoadScenario(
            name="Desenvolvimento/Teste (Baixa Carga)",
            read_rps=5,
            write_rps=5,
            avg_run_time=2.0,
            is_io_bound=True
        ),
        LoadScenario(
            name="Produção Inicial (Carga Média)",
            read_rps=50,
            write_rps=50,
            avg_run_time=2.0,
            is_io_bound=True
        ),
        LoadScenario(
            name="Produção em Escala (Alta Carga)",
            read_rps=500,
            write_rps=500,
            avg_run_time=2.0,
            is_io_bound=True
        ),
        LoadScenario(
            name="Cenário Personalizado (seus números)",
            read_rps=float(input("Requisições de leitura/segundo: ") or "50"),
            write_rps=float(input("Requisições de escrita/segundo: ") or "50"),
            avg_run_time=float(input("Tempo médio de run (segundos): ") or "2.0"),
            is_io_bound=input("É I/O bound? (s/n): ").lower() in ["s", "sim", "y", "yes", ""]
        )
    ]

    # Calcular e exibir cada cenário
    capacities = []
    for scenario in scenarios:
        capacity = calculate_capacity(scenario)
        capacities.append(capacity)
        print_capacity_report(capacity)

    # Perguntar se quer gerar config
    print("\n💾 Deseja gerar arquivo de configuração YAML?")
    choice = input("   Escolha um cenário (1-4) ou 'n' para pular: ")

    if choice.isdigit() and 1 <= int(choice) <= 4:
        idx = int(choice) - 1
        yaml_config = generate_deployment_config(capacities[idx])

        filename = f"deployment-config-{capacities[idx]['scenario'].lower().replace(' ', '-')}.yaml"
        with open(filename, 'w') as f:
            f.write(yaml_config)

        print(f"\n✅ Configuração salva em: {filename}")
        print("   Use este arquivo para configurar seu deployment")

    print("\n✨ Cálculo concluído!\n")


if __name__ == "__main__":
    main()
