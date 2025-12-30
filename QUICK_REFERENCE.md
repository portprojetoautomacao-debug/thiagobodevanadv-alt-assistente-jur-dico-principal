# 🚀 Guia Rápido - LangSmith Agent Server

## Instalação e Setup

```bash
# Instalar dependências
cd streamlit-app
pip install -r requirements.txt

# Ou com uv (mais rápido)
uv pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.production .env
# Editar .env com suas credenciais
```

## Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento
langgraph dev

# Testar se o servidor está rodando
curl http://localhost:2024/ok

# Abrir LangGraph Studio
# Navegue para: http://localhost:2024/studio
```

## Testes

```bash
# Rodar todos os testes
npm run test:run

# Testes com cobertura
npm run test:coverage

# Testes de API
npm run test:api

# Type checking
npm run type-check
```

## Deployment

### Cloud (LangSmith)

```bash
# Via UI
# 1. Acesse smith.langchain.com
# 2. Deployments > + New Deployment
# 3. Selecione seu repo GitHub
# 4. Configure e deploy

# Via SDK (Python)
python -c "
from langgraph_sdk import get_client
client = get_client(url='https://sua-url.langgraph.app')
print('✅ Conectado!')
"
```

### Self-Hosted (Docker)

```bash
# Build da imagem
langgraph build -t legal-assistant:latest

# Rodar com Docker
docker run \
  --env-file .env \
  -p 8000:8000 \
  legal-assistant:latest

# Ou com Docker Compose
docker-compose up -d
```

## Operações Comuns

### Criar Thread

```python
from langgraph_sdk import get_client

client = get_client(url="<DEPLOYMENT_URL>")
thread = await client.threads.create()
print(f"Thread ID: {thread['thread_id']}")
```

```bash
# Via cURL
curl -X POST https://sua-url/threads \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Executar Run

```python
# Com streaming
async for chunk in client.runs.stream(
    thread_id,
    "legal_assistant",
    input={"messages": [{"role": "user", "content": "Olá!"}]},
    stream_mode="updates"
):
    print(chunk.data)

# Sem streaming (wait)
result = await client.runs.wait(
    thread_id,
    "legal_assistant",
    input={"messages": [{"role": "user", "content": "Olá!"}]}
)
```

```bash
# Via cURL (streaming)
curl -X POST https://sua-url/threads/<THREAD_ID>/runs/stream \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "legal_assistant",
    "input": {"messages": [{"role": "user", "content": "Olá!"}]},
    "stream_mode": ["updates"]
  }'
```

### Consultar Estado

```python
# Estado atual do thread
state = await client.threads.get_state(thread_id)
print(state["values"])

# Histórico completo
history = await client.threads.get_history(thread_id)
for checkpoint in history:
    print(f"Step {checkpoint['metadata']['step']}")
```

```bash
# Via cURL
curl https://sua-url/threads/<THREAD_ID>/state

# Histórico
curl -X POST https://sua-url/threads/<THREAD_ID>/history \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### Gerenciar Assistants

```python
# Listar assistants
assistants = await client.assistants.search()

# Criar novo assistant
assistant = await client.assistants.create(
    "legal_assistant",
    context={"temperature": 0.5},
    name="Assistente Personalizado"
)

# Atualizar assistant
updated = await client.assistants.update(
    assistant["assistant_id"],
    context={"temperature": 0.7}
)
```

## Monitoramento

```bash
# Monitorar métricas uma vez
python scripts/monitor_metrics.py

# Monitoramento contínuo (a cada 60s)
python scripts/monitor_metrics.py --continuous 60

# Calcular capacidade necessária
python scripts/calculate_capacity.py

# Ver logs (se self-hosted com k8s)
kubectl logs -f deployment/langgraph-api --tail=100

# Verificar health
curl https://sua-url/ok
```

## Troubleshooting

### Runs lentos

```bash
# Verificar métricas
python scripts/monitor_metrics.py

# Aumentar workers (se self-hosted)
# Editar deployment-config.yaml:
# queue.replicas: 10
# config.numberOfJobsPerWorker: 30

# Verificar logs de erros
grep ERROR logs/agent-server.log
```

### Erros de conexão

```bash
# Testar conectividade
curl -I https://sua-url/ok

# Verificar DNS
nslookup sua-url.langgraph.app

# Testar com verbose
curl -v https://sua-url/ok
```

### Alto uso de memória

```python
# Limpar threads antigos
threads = await client.threads.search(limit=1000)
for thread in threads:
    created = datetime.fromisoformat(thread["created_at"])
    if (datetime.now() - created).days > 30:
        await client.threads.delete(thread["thread_id"])
```

## Otimizações

### Reduzir latência

```python
# Usar durability="exit" para runs que não precisam checkpoints intermediários
run = await client.runs.create(
    thread_id,
    "legal_assistant",
    input=input_data,
    durability="exit"  # Apenas checkpoint final
)

# Usar /join ao invés de polling
await client.runs.join(thread_id, run_id)
```

### Melhorar throughput

```bash
# Aumentar jobs por worker (para I/O bound)
export N_JOBS_PER_WORKER=30

# Adicionar mais workers
# Editar deployment-config.yaml:
# queue.replicas: 15
```

### Reduzir custos

```python
# Configurar TTL para limpeza automática
# Em langgraph.json:
{
  "checkpointer": {
    "ttl": {
      "default_ttl": 43200  # 30 dias
    }
  }
}

# Usar modelos mais baratos quando possível
# Em .env:
GOOGLE_MODEL=gemini-1.5-flash  # Mais barato que pro
```

## Comandos Úteis (LangGraph CLI)

```bash
# Verificar configuração
langgraph config

# Build imagem Docker
langgraph build -t my-agent:v1

# Push para registry
docker push my-agent:v1

# Validar langgraph.json
langgraph validate

# Ver versão
langgraph --version

# Help
langgraph --help
```

## Variáveis de Ambiente Importantes

```bash
# Core
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_PROJECT=legal-assistant-prod
GOOGLE_API_KEY=AIza...

# Performance
N_JOBS_PER_WORKER=25
MAX_CONCURRENT_RUNS=100
DEFAULT_RUN_TIMEOUT=300

# Database
POSTGRES_URI_CUSTOM=postgresql://...
REDIS_URI_CUSTOM=redis://...

# Features
BG_JOB_ISOLATED_LOOPS=false
```

## Padrões de Uso

### Conversação com memória

```python
# Criar thread uma vez
thread = await client.threads.create()

# Múltiplas mensagens no mesmo thread
for user_message in ["Olá", "Como está?", "Tchau"]:
    result = await client.runs.wait(
        thread["thread_id"],
        "legal_assistant",
        input={"messages": [{"role": "user", "content": user_message}]}
    )
    print(result["messages"][-1]["content"])
```

### Processamento em batch

```python
# Criar runs em paralelo
import asyncio

async def process_document(doc):
    thread = await client.threads.create()
    return await client.runs.wait(
        thread["thread_id"],
        "legal_assistant",
        input={"document": doc}
    )

results = await asyncio.gather(*[
    process_document(doc) for doc in documents
])
```

### Background jobs com Cron

```python
# Agendar job diário
cron_job = await client.crons.create(
    "legal_assistant",
    schedule="0 9 * * *",  # 9h todos os dias
    input={"task": "daily_summary"}
)

# Não esqueça de deletar quando não precisar mais!
await client.crons.delete(cron_job["cron_id"])
```

## Referências Rápidas

- **Documentação**: https://docs.langchain.com/langsmith
- **API Reference**: https://api.smith.langchain.com/redoc
- **Status**: https://status.langchain.com
- **Suporte**: https://support.langchain.com

## Atalhos

```bash
# Alias úteis (adicione ao seu .bashrc ou .zshrc)
alias lg-dev='langgraph dev'
alias lg-test='npm run test:run'
alias lg-monitor='python scripts/monitor_metrics.py'
alias lg-health='curl http://localhost:2024/ok'
```
