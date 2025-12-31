# 🔧 Scripts de Utilidades - Agent Server

Este diretório contém scripts úteis para operar e monitorar o Agent Server do assistente jurídico.

## 📋 Scripts Disponíveis

### 0. bootstrap_langsmith_assistants.py

Cria automaticamente assistants do LangSmith alinhados ao app (`legal_hybrid` e `legal_assistant`) com contexto/metadata padrão.

**Uso:**
```bash
cd streamlit-app
python scripts/bootstrap_langsmith_assistants.py
```

**Requisitos:**
- `LANGSMITH_API_KEY` ou `LANGCHAIN_API_KEY`
- (opcional) `LANGSMITH_PROJECT`/`LANGCHAIN_PROJECT`, `MODEL_TEMPERATURE`, `MAX_COMPLETION_TOKENS`

### 1. monitor_metrics.py

Monitora métricas do Agent Server em tempo real.

**Uso Básico:**
```bash
# Executar uma vez
python scripts/monitor_metrics.py

# Monitoramento contínuo (a cada 60 segundos)
python scripts/monitor_metrics.py --continuous 60
```

**Variáveis de Ambiente:**
```bash
export DEPLOYMENT_URL=https://sua-url.langgraph.app
export LANGSMITH_API_KEY=lsv2_pt_...
```

**Métricas Coletadas:**
- ✅ Health check
- 📊 Runs (total, sucesso, falhas, latência)
- 🧵 Threads (idle, busy, error)
- 🤖 Informações do assistant

**Alertas Automáticos:**
- ⚠️ Taxa de sucesso < 90%
- ⚠️ Latência média > 5s
- ⚠️ Threads em erro > 10

**Exemplo de Saída:**
```
📊 MÉTRICAS DO AGENT SERVER - 2025-12-30 15:30:45
═══════════════════════════════════════════════════

🏥 Health Check: ✅ Saudável

🏃 Métricas de Runs (últimas 24h):
  • Total de runs: 150
  • Bem-sucedidos: 145
  • Falhas: 5
  • Taxa de sucesso: 96.67%
  • Latência média: 1.8s
```

---

### 2. calculate_capacity.py

Calcula a capacidade necessária baseado em throughput esperado.

**Uso:**
```bash
python scripts/calculate_capacity.py
```

**Fluxo Interativo:**
1. Escolhe ou define cenário de carga
2. Informa requisições por segundo (leitura e escrita)
3. Informa tempo médio de execução
4. Define se é I/O bound ou CPU bound

**Saída:**
- 📊 Relatório de capacidade detalhado
- ⚙️ Número de API servers necessários
- 👷 Número de queue workers necessários
- 💾 Recursos de PostgreSQL e Redis
- 💡 Dicas de otimização

**Geração de YAML:**
- Opcionalmente gera arquivo `deployment-config-*.yaml`
- Pronto para usar no deployment

**Cenários Pré-definidos:**
1. Desenvolvimento/Teste (5 req/s)
2. Produção Inicial (50 req/s)
3. Produção em Escala (500 req/s)
4. Cenário Personalizado

**Exemplo de Uso:**
```bash
$ python scripts/calculate_capacity.py

🎯 CALCULADORA DE CAPACIDADE - AGENT SERVER

Requisições de leitura/segundo: 50
Requisições de escrita/segundo: 50
Tempo médio de run (segundos): 2.0
É I/O bound? (s/n): s

📊 RELATÓRIO DE CAPACIDADE: Cenário Personalizado
═══════════════════════════════════════════════════

📈 Carga Esperada:
  • Requisições de leitura/segundo: 50.0
  • Requisições de escrita/segundo: 50.0
  • Tempo médio de execução: 2.0s
  • Tipo: I/O Bound

⚙️  Configuração Recomendada:
  • API Servers: 3 réplicas
  • Queue Workers: 4 réplicas
  • Jobs por Worker: 25
  • Capacidade total de jobs: 100
```

---

### 3. examples.py

Exemplos práticos de uso do Agent Server.

**Uso:**
```bash
python scripts/examples.py
```

**Menu Interativo:**
```
Escolha um exemplo para executar:

   1. Conversação Simples
   2. Processamento em Batch
   3. Background Job (Cron)
   4. Streaming de Tokens
   5. Time Travel
   6. Monitoramento
   7. Assistants Customizados
   8. Executar Todos

Escolha (1-8):
```

**Exemplos Incluídos:**

#### 1. Conversação Simples com Memória
Demonstra como manter contexto em múltiplas mensagens usando o mesmo thread.

```python
# Thread criado uma vez
thread = await client.threads.create()

# Múltiplas mensagens mantêm contexto
mensagens = ["Olá!", "Como está?", "Tchau!"]
for msg in mensagens:
    result = await client.runs.stream(...)
```

#### 2. Processamento em Batch
Processa múltiplos documentos em paralelo para alta performance.

```python
# Processar documentos em paralelo
results = await asyncio.gather(*[
    process_document(doc) for doc in documents
])
```

#### 3. Background Job com Cron
Agenda tarefas recorrentes (exemplo: relatório diário).

```python
# Executar diariamente às 9h
cron_job = await client.crons.create(
    "legal_assistant",
    schedule="0 9 * * *",
    input={...}
)
```

#### 4. Streaming de Tokens LLM
Streaming de resposta token por token (UX responsiva).

```python
async for chunk in client.runs.stream(
    ...,
    stream_mode="messages-tuple"
):
    if chunk.event == "messages":
        print(chunk.data[0]["content"], end="")
```

#### 5. Time Travel
Volta no tempo para checkpoint anterior e modifica estado.

```python
# Ver histórico
history = await client.threads.get_history(thread_id)

# Voltar e modificar
new_config = await client.threads.update_state(
    thread_id,
    {"messages": [...]},
    checkpoint_id=previous_checkpoint
)
```

#### 6. Monitoramento de Métricas
Coleta e exibe métricas do deployment.

```python
# Buscar runs recentes
runs = await client.runs.list(limit=100)

# Calcular métricas
success_rate = successful / total * 100
```

#### 7. Assistants Customizados
Cria assistants especializados com configurações diferentes.

```python
custom_assistant = await client.assistants.create(
    "legal_assistant",
    name="Assistente Trabalhista",
    context={"specialization": "trabalhista"}
)
```

**Configuração:**
```bash
# Local
export DEPLOYMENT_URL=http://localhost:2024

# Remoto
export DEPLOYMENT_URL=https://sua-url.langgraph.app
export LANGSMITH_API_KEY=lsv2_pt_...
```

---

## 🚀 Início Rápido

### Setup

```bash
# Instalar dependências
cd streamlit-app
pip install -r requirements.txt

# Configurar ambiente (local)
export DEPLOYMENT_URL=http://localhost:2024

# Ou para produção
export DEPLOYMENT_URL=https://sua-url.langgraph.app
export LANGSMITH_API_KEY=lsv2_pt_...
```

### Fluxo Recomendado

1. **Desenvolvimento Local:**
   ```bash
   # Iniciar servidor
   langgraph dev

   # Em outro terminal, testar exemplos
   python scripts/examples.py
   ```

2. **Planejamento:**
   ```bash
   # Calcular capacidade necessária
   python scripts/calculate_capacity.py
   ```

3. **Deploy:**
   ```bash
   # Seguir DEPLOYMENT_CHECKLIST.md
   # Usar configuração gerada
   ```

4. **Monitoramento:**
   ```bash
   # Monitorar continuamente
   python scripts/monitor_metrics.py --continuous 60
   ```

---

## 📊 Casos de Uso

### Para Desenvolvedores

**Testar API localmente:**
```bash
# 1. Iniciar servidor local
langgraph dev

# 2. Executar exemplos
python scripts/examples.py
```

### Para DevOps

**Calcular recursos e monitorar:**
```bash
# 1. Calcular capacidade
python scripts/calculate_capacity.py

# 2. Monitorar produção
export DEPLOYMENT_URL=https://prod.langgraph.app
export LANGSMITH_API_KEY=lsv2_pt_...
python scripts/monitor_metrics.py --continuous 300
```

### Para QA

**Executar testes de integração:**
```bash
# 1. Apontar para staging
export DEPLOYMENT_URL=https://staging.langgraph.app

# 2. Executar todos os exemplos
python scripts/examples.py
# Escolher opção 8 (Executar Todos)
```

---

## 🔧 Customização

### Adicionar Novos Exemplos

Edite `examples.py`:

```python
async def example_meu_caso():
    """Meu caso de uso específico"""
    client = get_client(url=DEPLOYMENT_URL, api_key=API_KEY)
    # Seu código aqui
    ...

# Adicionar ao menu
examples = {
    # ... exemplos existentes ...
    "9": ("Meu Caso", example_meu_caso),
}
```

### Customizar Métricas

Edite `monitor_metrics.py`:

```python
class AgentServerMonitor:
    async def get_custom_metrics(self):
        """Suas métricas customizadas"""
        # Seu código aqui
        ...
```

### Ajustar Cálculos

Edite `calculate_capacity.py`:

```python
def calculate_queue_workers(
    write_rps: float,
    avg_run_time: float,
    jobs_per_worker: int
) -> int:
    # Ajustar fórmula conforme necessário
    return max(1, int((write_rps * avg_run_time) / jobs_per_worker) + 1)
```

---

## 🆘 Troubleshooting

### Erro: "Connection refused"

```bash
# Verificar se servidor está rodando
curl http://localhost:2024/ok

# Se não, iniciar
langgraph dev
```

### Erro: "Authentication failed"

```bash
# Verificar API key
echo $LANGSMITH_API_KEY

# Configurar se necessário
export LANGSMITH_API_KEY=lsv2_pt_...
```

### Métricas não aparecem

```bash
# Verificar se há runs
python -c "
from langgraph_sdk import get_client
client = get_client(url='http://localhost:2024')
print(len(await client.runs.list()))
"

# Se zero, executar alguns exemplos primeiro
python scripts/examples.py
```

---

## 📚 Documentação Relacionada

- **[AGENT_SERVER_SCALE_CONFIG.md](../AGENT_SERVER_SCALE_CONFIG.md)** - Guia completo de escala
- **[QUICK_REFERENCE.md](../QUICK_REFERENCE.md)** - Referência rápida de comandos
- **[DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md)** - Checklist de deployment
- **[INDEX.md](../INDEX.md)** - Índice completo da documentação

---

## 💡 Dicas

- **Use `--continuous`** para monitoramento em produção
- **Grave logs** com `> output.log` para análise posterior
- **Configure alertas** usando webhooks/emails
- **Automatize** com cron jobs no servidor

---

**Última atualização**: 30 de dezembro de 2025
**Versão**: 1.0
**Mantido por**: Equipe de Desenvolvimento
