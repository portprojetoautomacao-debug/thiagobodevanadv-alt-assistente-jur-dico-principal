# Configuração do LangSmith Agent Server para Escala

Este guia fornece configurações otimizadas para escalar o Agent Server do seu assistente jurídico.

## 📊 Análise de Carga

Antes de configurar, determine seu padrão de carga:

### Carga de Escrita
- Criação de novas runs (assistente executando tarefas)
- Criação de checkpoints durante execução
- Escrita em memória de longo prazo
- Criação de threads/assistants/cron jobs

### Carga de Leitura
- Consulta de resultados de runs
- Recuperação de estado de threads
- Busca de runs, threads, assistants
- Recuperação de checkpoints e memória

## ⚙️ Melhores Práticas

### 1. Configurar N_JOBS_PER_WORKER

```bash
# Para assistentes limitados por CPU (padrão)
N_JOBS_PER_WORKER=10

# Para assistentes limitados por I/O (chamadas a APIs externas, busca de dados)
N_JOBS_PER_WORKER=20-50
```

**Para o assistente jurídico**: Como faz chamadas a APIs (Google AI, busca de dados), recomendo `N_JOBS_PER_WORKER=20-30`.

### 2. Evitar Operações Bloqueantes Síncronas

✅ **Bom** (Assíncrono):
```python
import asyncio

async def process_legal_document():
    await asyncio.sleep(1)  # Operação não bloqueante
```

❌ **Ruim** (Síncrono bloqueante):
```python
import time

def process_legal_document():
    time.sleep(1)  # Bloqueia o event loop
```

Se precisar usar operações síncronas, configure:
```bash
BG_JOB_ISOLATED_LOOPS=True
```

### 3. Minimizar Checkpointing Redundante

Configure o modo de durabilidade apropriado:

```python
# No cliente LangGraph SDK
from langgraph_sdk import get_client

client = get_client(url="<DEPLOYMENT_URL>")

# Para runs que só precisam do estado final
run = await client.runs.create(
    thread_id=thread["thread_id"],
    assistant_id="legal_assistant",
    durability="exit"  # Apenas checkpoint final
)

# Para runs que precisam de checkpoints intermediários (padrão)
run = await client.runs.create(
    thread_id=thread["thread_id"],
    assistant_id="legal_assistant",
    durability="async"  # Checkpoints após cada step
)
```

## 🚀 Configurações por Cenário

### Cenário 1: Baixa Carga (< 10 req/s leitura e escrita)

```yaml
# langgraph-deployment-low.yaml
api:
  replicas: 1
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

queue:
  replicas: 1
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

config:
  numberOfJobsPerWorker: 20  # I/O bound

redis:
  resources:
    requests:
      memory: "2Gi"
    limits:
      memory: "2Gi"

postgres:
  resources:
    requests:
      cpu: "2"
      memory: "8Gi"
    limits:
      cpu: "4"
      memory: "16Gi"
```

### Cenário 2: Carga Média (50 req/s leitura, 50 req/s escrita)

```yaml
# langgraph-deployment-medium.yaml
api:
  replicas: 3
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

queue:
  replicas: 5
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

config:
  numberOfJobsPerWorker: 25

redis:
  resources:
    requests:
      memory: "4Gi"
    limits:
      memory: "4Gi"

postgres:
  resources:
    requests:
      cpu: "4"
      memory: "16Gi"
    limits:
      cpu: "8"
      memory: "32Gi"
```

### Cenário 3: Alta Carga (500 req/s leitura e escrita)

```yaml
# langgraph-deployment-high.yaml
api:
  replicas: 15
  autoscaling:
    enabled: true
    minReplicas: 15
    maxReplicas: 25
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

queue:
  replicas: 10
  autoscaling:
    enabled: true
    minReplicas: 10
    maxReplicas: 20
  resources:
    requests:
      cpu: "1"
      memory: "2Gi"
    limits:
      cpu: "2"
      memory: "4Gi"

config:
  numberOfJobsPerWorker: 50

redis:
  resources:
    requests:
      memory: "4Gi"
    limits:
      memory: "4Gi"

postgres:
  resources:
    requests:
      cpu: "8"
      memory: "32Gi"
    limits:
      cpu: "16"
      memory: "64Gi"
```

## 🔧 Variáveis de Ambiente

Adicione ao seu `.env`:

```bash
# Performance
N_JOBS_PER_WORKER=25
BG_JOB_ISOLATED_LOOPS=false

# Database (use externo para produção)
POSTGRES_URI_CUSTOM=postgresql://user:pass@host:5432/legal_assistant
REDIS_URI_CUSTOM=redis://host:6379/0

# LangSmith
LANGSMITH_API_KEY=your_api_key
LANGSMITH_ENDPOINT=https://api.smith.langchain.com/v1

# Rate Limiting (opcional)
MAX_CONCURRENT_RUNS=100
```

## 📈 Cálculo de Capacidade

### Fórmula para Queue Workers

```
available_jobs = number_of_queue_workers * N_JOBS_PER_WORKER

throughput_per_second = available_jobs / average_run_execution_time_seconds

number_of_queue_workers = (throughput_per_second * average_run_execution_time_seconds) / N_JOBS_PER_WORKER
```

### Exemplo para Assistente Jurídico

Assumindo:
- Tempo médio de execução: 2 segundos
- Throughput desejado: 50 req/s
- N_JOBS_PER_WORKER: 25

```
number_of_queue_workers = (50 * 2) / 25 = 4 workers
```

## 🎯 Otimizações Específicas para Assistente Jurídico

### 1. Filtrar Consultas

```python
# Use filtros para reduzir dados retornados
from langgraph_sdk import get_client

client = get_client(url="<DEPLOYMENT_URL>")

# Buscar apenas threads ativos de um usuário específico
threads = await client.threads.search(
    status="idle",
    metadata={"user_id": "user123"},
    limit=10
)
```

### 2. Configurar TTL para Limpeza Automática

No `langgraph.json`:

```json
{
  "checkpointer": {
    "ttl": {
      "strategy": "delete",
      "sweep_interval_minutes": 60,
      "default_ttl": 43200  // 30 dias em minutos
    }
  }
}
```

### 3. Usar /join ao Invés de Polling

❌ **Evite**:
```python
# Polling (ineficiente)
while True:
    run = await client.runs.get(thread_id, run_id)
    if run["status"] == "success":
        break
    await asyncio.sleep(1)
```

✅ **Use**:
```python
# Join (eficiente)
await client.runs.join(thread_id, run_id)
result = await client.threads.get_state(thread_id)
```

### 4. Streaming para Monitoramento em Tempo Real

```python
# Para UX responsiva
async for chunk in client.runs.stream(
    thread_id,
    "legal_assistant",
    input={"messages": [{"role": "user", "content": "Analise este contrato"}]},
    stream_mode="updates"
):
    # Atualizar UI em tempo real
    print(chunk.data)
```

## 🔒 Segurança e Autenticação

Para ambientes self-hosted:

```python
# custom_auth.py
from langgraph.auth import Auth

auth = Auth()

@auth.authenticate
async def get_current_user(authorization: str):
    # Validar token JWT
    return {"user_id": "user123", "role": "lawyer"}

@auth.on.thread.create
async def can_create_thread(ctx, input):
    # Limitar criação de threads por usuário
    user_threads = await count_user_threads(ctx.user["user_id"])
    if user_threads >= 100:
        raise PermissionError("Limite de threads atingido")
    return input
```

## 📊 Monitoramento

### Métricas Importantes

1. **Latência de Runs**: Tempo de execução dos assistentes
2. **Taxa de Sucesso**: % de runs bem-sucedidos
3. **Uso de Workers**: Quantos jobs simultâneos
4. **Tamanho de Fila**: Backlog de runs pendentes

### Acessar Métricas

```bash
# Via API
curl https://<DEPLOYMENT_URL>/monitoring/metrics

# Via UI
# Deployments > [Seu Deploy] > Monitoring
```

## 🚨 Troubleshooting

### Problema: Runs lentos

**Solução**:
1. Aumentar `N_JOBS_PER_WORKER` para assistentes I/O bound
2. Adicionar mais queue workers
3. Otimizar operações bloqueantes

### Problema: Alto uso de memória

**Solução**:
1. Reduzir `N_JOBS_PER_WORKER`
2. Diminuir TTL de checkpoints
3. Limpar dados antigos

### Problema: Timeouts

**Solução**:
1. Aumentar timeout de runs
2. Dividir tarefas longas em steps menores
3. Usar background runs para tarefas demoradas

## 📚 Próximos Passos

1. **Testar localmente**: `langgraph dev`
2. **Deploy staging**: Testar configuração em ambiente de teste
3. **Monitorar**: Acompanhar métricas por 1 semana
4. **Ajustar**: Iterar baseado em dados reais
5. **Autoescalar**: Implementar autoscaling para picos

## 📖 Referências

- [Agent Server Scale Guide](https://docs.langchain.com/langsmith/agent-server-scale)
- [Environment Variables](https://docs.langchain.com/langsmith/env-var)
- [Monitoring](https://docs.langchain.com/langsmith/control-plane#monitoring)
