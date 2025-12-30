# 🚀 Guia de Deployment - LangSmith

## Estrutura Preparada para Deployment

Seu assistente jurídico está configurado para deployment no LangSmith seguindo as melhores práticas.

### ✅ Arquivos de Configuração

- **langgraph.json** - Configuração de deployment
- **requirements.txt** - Dependências Python
- **.env** - Variáveis de ambiente (local)
- **lib/langgraph_orchestrator.py** - Grafo deployável

**⚠️ Nota Importante sobre Checkpointer:**

O LangSmith **configura automaticamente** o checkpointer para seu grafo. O `MemorySaver` usado em desenvolvimento local será **substituído** por um checkpointer baseado em PostgreSQL gerenciado pelo LangSmith. Você não precisa (e não deve) configurar checkpointer para produção - ele é gerenciado automaticamente.

```python
# ✅ Local (desenvolvimento)
from langgraph.checkpoint.memory import MemorySaver
graph = workflow.compile(checkpointer=MemorySaver())

# ✅ Production (LangSmith)
# O checkpointer é substituído automaticamente por um PostgreSQL-backed checkpointer
# Nenhuma mudança necessária no código!
```

---

## 📁 Estrutura do Projeto

```
streamlit-app/                         # Raiz da aplicação
├── lib/                               # Código da aplicação
│   ├── langgraph_orchestrator.py     # ✅ Exporta 'graph'
│   ├── agents/                        # Agentes
│   │   ├── __init__.py
│   │   ├── base_agent.py
│   │   ├── harvey.py
│   │   └── justine.py
│   ├── tools/                         # Ferramentas
│   │   ├── __init__.py
│   │   └── djen_tools.py
│   ├── memory_manager.py              # Gerenciamento de memória
│   ├── cache_manager.py               # Sistema de cache
│   ├── rate_limiter.py                # Rate limiting
│   ├── circuit_breaker.py             # Circuit breaker
│   └── ...                            # Outros módulos (15 total)
├── requirements.txt                   # ✅ Dependencies (raiz)
├── langgraph.json                     # ✅ Config deployment (raiz)
├── .env                              # ✅ Variáveis (local)
└── .env.example                      # ✅ Template

Nota: Esta estrutura segue as melhores práticas do LangSmith onde:
- langgraph.json e requirements.txt ficam na raiz
- dependencies: ["."] instala pacotes do requirements.txt na raiz
- O código da aplicação fica em lib/
- Todos os módulos são importáveis via lib.module_name
```

---

## 🔧 Configuração (langgraph.json)

```json
{
  "dependencies": [
    "."
  ],
  "graphs": {
    "legal_assistant": "./lib/langgraph_orchestrator.py:graph"
  },
  "env": ".env",
  "python_version": "3.11",
  "checkpointer": {
    "ttl": {
      "strategy": "delete",
      "sweep_interval_minutes": 60,
      "default_ttl": 43200
    }
  },
  "store": {
    "ttl": {
      "refresh_on_read": true,
      "sweep_interval_minutes": 120,
      "default_ttl": 10080
    },
    "index": {
      "embed": "openai:text-embedding-3-small",
      "dims": 1536,
      "fields": ["$"]
    }
  }
}
```

**Campos importantes:**
- **dependencies**: ["."] = instala pacotes do requirements.txt local
- **graphs**: Referência ao grafo compilado (variável `graph`)
- **env**: Arquivo de variáveis (local)
- **python_version**: Versão do Python

**TTL Configuration:**
- **checkpointer.ttl.default_ttl**: 43200 min (30 dias) - threads e checkpoints
- **checkpointer.ttl.sweep_interval_minutes**: 60 min - verifica a cada 1h
- **store.ttl.default_ttl**: 10080 min (7 dias) - memórias no store
- **store.ttl.refresh_on_read**: true - TTL renova ao acessar
- **store.ttl.sweep_interval_minutes**: 120 min - verifica a cada 2h

**Semantic Search (Store Index):**
- **embed**: "openai:text-embedding-3-small" - modelo de embeddings
- **dims**: 1536 - dimensão dos embeddings
- **fields**: ["$"] - indexa todos os campos (ou especifique: ["text", "metadata.title"])

⚠️ **Requer**: `OPENAI_API_KEY` nas variáveis de ambiente para embeddings

---

## 🏗️ Estrutura Alternativa (Monorepo)

Se você tiver um monorepo com código compartilhado, pode usar:

```
my-monorepo/
├── shared-legal-utils/           # Código compartilhado
│   ├── __init__.py
│   ├── common.py
│   └── pyproject.toml
├── agents/
│   └── assistente-juridico/      # Este projeto
│       ├── lib/
│       │   └── langgraph_orchestrator.py
│       ├── langgraph.json        # Config aqui
│       ├── requirements.txt
│       └── .env
└── other-service/
```

**langgraph.json para monorepo:**
```json
{
  "dependencies": [
    ".",
    "../../shared-legal-utils"    # Path relativo ao compartilhado
  ],
  "graphs": {
    "legal_assistant": "./lib/langgraph_orchestrator.py:graph"
  },
  "env": ".env"
}
```

O LangSmith automaticamente:
- Detecta paths relativos que começam com "."
- Adiciona diretórios pai ao contexto do Docker
- Instala dependências na ordem correta

Ver [documentação de monorepo](https://docs.langchain.com/langsmith/monorepo-support) para mais detalhes.

---

## 🌐 Variáveis de Ambiente

### Local (.env)
```env
# LLM
GEMINI_API_KEY=your_api_key_here
GOOGLE_API_KEY=your_api_key_here

# LangSmith (Observabilidade)
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_PROJECT=assistente-juridico-prod
LANGCHAIN_TRACING_V2=true

# Cache (Opcional)
ENABLE_REDIS_CACHE=false
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Rate Limiting
GEMINI_MAX_REQ=10
GEMINI_WINDOW_SEC=60

# Circuit Breaker
CB_FAILURE_THRESHOLD=5
CB_RECOVERY_TIMEOUT=60
```

### Produção (LangSmith Console)
Configure as variáveis de ambiente no dashboard do LangSmith:
1. Acesse https://smith.langchain.com/
2. Vá em Settings → Environment Variables
3. Adicione as variáveis necessárias

---

## 📦 Instalação do LangGraph CLI

```bash
# Instalar CLI
pip install langgraph-cli

# Verificar instalação
langgraph --version
```

**Dependências Pré-instaladas:**

O LangSmith já inclui estas dependências na imagem Docker:
```
langgraph>=0.6.0
langgraph-sdk>=0.1.66
langgraph-checkpoint>=2.0.23
langchain-core>=0.2.38
langsmith>=0.1.63
orjson>=3.9.7,<3.10.17
httpx>=0.25.0
tenacity>=8.0.0
uvicorn>=0.26.0
```

Você **não precisa** incluí-las no requirements.txt, mas pode especificar versões compatíveis se necessário.

---

## 🧪 Testar Localmente

### 1. Verificar Configuração
```bash
cd streamlit-app

# Validar langgraph.json
langgraph dev
```

### 2. Testar o Grafo
```python
from lib.langgraph_orchestrator import graph

# Testar grafo compilado
result = await graph.ainvoke({
    "task": "Analisar contrato",
    "agent_id": "harvey",
    "session_id": "test_123",
    "chat_history": [],
    "result": None,
    "error": None,
    "intermediate_steps": [],
    "retry_count": 0
})

print(result)
```

### 3. Servidor Local
```bash
# Iniciar servidor LangGraph local
langgraph dev

# Acessa em: http://localhost:8123
```

---

## 🚀 Deploy para LangSmith

### Pré-requisitos
1. ✅ Conta no LangSmith (https://smith.langchain.com/)
2. ✅ API Key do LangSmith
3. ✅ LangGraph CLI instalado
4. ✅ License key (para versão Enterprise - [contate vendas](https://www.langchain.com/contact-sales))

### O que é Agent Server?

O **Agent Server** é a API que gerencia suas aplicações após deployment. Ele fornece:

- **Assistants**: Grafos configurados para tarefas específicas
- **Threads**: Conversações/sessões persistentes
- **Runs**: Execuções de tarefas
- **Cron Jobs**: Tarefas agendadas
- **Webhooks**: Integrações event-driven
- **Persistence**: PostgreSQL para estado
- **Task Queue**: Redis para processamento assíncrono

**Componentes após deployment:**
```
┌─────────────────────────────────────┐
│      Agent Server (API)             │
├─────────────────────────────────────┤
│  • legal_assistant (graph)          │
│  • Default Assistant (auto-criado)  │
├─────────────────────────────────────┤
│  PostgreSQL (persistência)          │
│  Redis (task queue)                 │
└─────────────────────────────────────┘
```

No LangSmith Cloud, PostgreSQL e Redis são gerenciados automaticamente.

### Passo a Passo

#### 1. Autenticar
```bash
# Configurar API key
export LANGCHAIN_API_KEY=lsv2_pt_...

# Ou via CLI
langgraph auth login
```

#### 2. Criar Deployment
```bash
cd streamlit-app

# Deploy
langgraph deploy

# Ou com nome específico
langgraph deploy --name assistente-juridico-prod
```

**Tipos de Deployment:**

| Tipo | CPU/Memória | Scaling | Database | Uso Recomendado |
|------|-------------|---------|----------|-----------------|
| **Development** | 1 CPU, 1 GB RAM | Até 1 réplica | 10 GB, sem backups | Testes, desenvolvimento |
| **Production** | 2 CPU, 2 GB RAM | Até 10 réplicas (auto) | Autoscaling, backups, multi-zone | Produção, apps críticos |

⚠️ **Development** usa infraestrutura preemptível (pode ser terminada a qualquer momento). Use apenas para testes.

✅ **Production** usa infraestrutura durável com:
- Autoscaling automático (baseado em CPU, memória, runs pendentes)
- Backups automáticos do PostgreSQL
- Alta disponibilidade (multi-zone)
- Scale up até 10 containers

**Autoscaling (Production):**
- Target: 75% CPU, 75% memória, 10 runs pendentes
- Scale down: delay de 30 minutos
- Máximo: 10 réplicas

**Selecionar tipo:**
```bash
# Development (padrão)
langgraph deploy --name meu-app-dev

# Production (via UI após criar deployment)
# Ou especificar no dashboard ao criar
```

⚠️ **Tipo de deployment não pode ser mudado após criação!**

#### 3. Configurar Variáveis
No dashboard do LangSmith:
- Settings → Environment Variables
- Adicionar `GEMINI_API_KEY`, etc.

#### 4. Verificar Status
```bash
# Listar deployments
langgraph deployments list

# Ver logs
langgraph logs <deployment-id>

# Ver status
langgraph status <deployment-id>
```

**Recursos Automáticos no LangSmith Cloud:**

✅ **PostgreSQL gerenciado:**
- Criado automaticamente por deployment
- Backup automático (Production)
- Disk autoscaling (Production)
- Sem acesso direto (apenas via Agent Server API)

✅ **Redis gerenciado:**
- Task queue para background workers
- Comunicação server ↔ workers
- Streaming output buffering
- Sem dados persistentes (apenas metadata efêmero)

✅ **Tracing automático:**
- Projeto LangSmith criado com nome do deployment
- Variáveis `LANGCHAIN_TRACING_V2` e `LANGCHAIN_API_KEY` configuradas automaticamente
- Traces permanecem após deletar deployment

✅ **Monitoramento:**
- CPU/Memória por réplica
- Disk usage do PostgreSQL
- Latência das APIs
- Taxa de sucesso/erro
- Runs pendentes/ativos

✅ **Static IPs (após jan/2025):**
- Todo tráfego via NAT gateway
- IPs estáticos para whitelist

**US Region:**
```
35.197.29.146, 34.145.102.123, 34.169.45.153
34.82.222.17, 35.227.171.135, 34.169.88.30
(+ 10 mais IPs)
```

**EU Region:**
```
34.13.192.67, 34.147.105.64, 34.90.22.166
34.147.36.213, 34.32.137.113, 34.91.238.184
(+ 2 mais IPs)
```

---

## 📡 Usar Deployment

### Via Python SDK
```python
from langsmith import Client

client = Client()

# Chamar deployment
result = client.invoke_deployment(
    deployment_id="<deployment-id>",
    input_data={
        "task": "Analisar contrato de prestação de serviços",
        "agent_id": "harvey",
        "session_id": "user_123"
    }
)

print(result)
```

### Via REST API
```bash
curl -X POST https://api.smith.langchain.com/deployments/<deployment-id>/invoke \
  -H "Authorization: Bearer ${LANGCHAIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task": "Analisar contrato",
      "agent_id": "harvey",
      "session_id": "user_123"
    }
  }'
```

### Via Streamlit (integração)
```python
import streamlit as st
from langsmith import Client

client = Client()

# Interface
task = st.text_area("Tarefa")
agent = st.selectbox("Agente", ["harvey", "justine", "redacao-peticoes"])

if st.button("Executar"):
    result = client.invoke_deployment(
        deployment_id=st.secrets["DEPLOYMENT_ID"],
        input_data={
            "task": task,
            "agent_id": agent,
            "session_id": st.session_state.user_id
        }
    )
    st.write(result)
```

---

## 🔄 Atualizar Deployment

```bash
# Fazer mudanças no código

# Re-deploy
langgraph deploy --name assistente-juridico-prod

# Deployment cria nova versão automaticamente
```

---

## 📊 Monitoramento

### LangSmith Dashboard
- **Traces**: Ver execuções em tempo real
- **Metrics**: Latência, custos, erros
- **Feedback**: Coletar feedback de usuários
- **Datasets**: Testar com datasets

### Métricas Disponíveis:
- CPU/Memória por réplica
- Número de container restarts
- Número de réplicas ativas (autoscaling)
- PostgreSQL: CPU, memória, disk usage
- Redis: runs pendentes/ativos
- API: success count, error count, latency (P50, P95, P99)

### Acessar
1. https://smith.langchain.com/
2. Selecionar projeto (criado automaticamente com nome do deployment)
3. Ver traces, métricas, etc.

---

## ⚠️ Limites e Considerações

### Payload Size (Cloud)
- **Máximo: 25 MB** por request
- Requests maiores retornam `413 Payload Too Large`
- Considere: processar arquivos grandes em chunks

### Deployment Assíncrono
- **Tempo inicial:** Alguns minutos (cria database)
- **Revisões subsequentes:** Mais rápido (database já existe)
- **Build step:** 2-5 minutos típico

### Database (Development)
- **10 GB disk** sem backups
- **Infraestrutura preemptível** (pode terminar sem aviso)
- Configure TTLs para gerenciar uso
- Para mais disk: contate support

### Database (Production)
- **Disk autoscaling** baseado em uso
- **Backups automáticos**
- **Alta disponibilidade** (multi-zone)
- Para aumentar recursos: contate support

### Custom PostgreSQL/Redis (Hybrid/Self-Hosted)
Se não usar Cloud, pode usar suas próprias instâncias:

```env
# Custom PostgreSQL
POSTGRES_URI_CUSTOM=postgres://user:pass@host/db_name

# Custom Redis
REDIS_URI_CUSTOM=redis://host:port/db_number
```

⚠️ **Diferentes deployments podem compartilhar instância mas NÃO o mesmo database!**

---

## 🐛 Troubleshooting

### Erro: "Graph not found"
```bash
# Verificar se variável graph existe
python -c "from lib.langgraph_orchestrator import graph; print(type(graph))"
```

### Erro: "Dependencies not installed"
```bash
# Verificar requirements.txt
pip install -r requirements.txt

# Testar imports
python -c "import langgraph; print(langgraph.__version__)"
```

### Erro: "Environment variables missing"
```bash
# Listar variáveis configuradas
langgraph env list <deployment-id>

# Adicionar variável
langgraph env set <deployment-id> GEMINI_API_KEY=...
```

### Logs
```bash
# Ver logs em tempo real
langgraph logs <deployment-id> --follow

# Ver últimos logs
langgraph logs <deployment-id> --tail 100
```

---

## 💡 Melhores Práticas

### 1. Ambientes Separados
```bash
# Development (testes, features em desenvolvimento)
langgraph deploy --name assistente-juridico-dev

# Staging (validação antes de produção)
langgraph deploy --name assistente-juridico-staging

# Production (usuários finais)
langgraph deploy --name assistente-juridico-prod
```

**Recomendação:**
- Dev: Use tipo **Development** (baixo custo, testes)
- Staging: Use tipo **Production** (simula produção)
- Prod: Use tipo **Production** (alta disponibilidade)

### 2. Versionamento
- Use tags do Git para versões
- Adicione `version` no langgraph.json
- Mantenha changelog

### 3. Monitoramento
- Configure alertas no LangSmith
- Monitore latência e custos
- Colete feedback dos usuários
- Use dashboards de métricas

### 4. Segurança
- ✅ Nunca commite `.env` no Git (use .env.example)
- ✅ Use secrets management do LangSmith
- ✅ Rotacione API keys regularmente
- ✅ Configure IPs estáticos para whitelist se necessário
- ✅ Limite payload size (< 25 MB)

### 5. Checkpointer
- ✅ **Não configure** checkpointer no código para produção
- ✅ O LangSmith substitui automaticamente por PostgreSQL-backed
- ✅ Use MemorySaver apenas para desenvolvimento local
- ✅ Checkpointer em produção é gerenciado e otimizado

### 6. Database Management
- Configure TTLs para limpar dados antigos
- Monitore disk usage
- Development: 10 GB (sem crescimento automático)
- Production: Autoscaling (cresce conforme necessário)

### 7. Assistants Strategy
- Crie assistants específicos por caso de uso
- Use configs diferentes (temperatura, context, etc)
- Um graph pode ter múltiplos assistants
- Assistant padrão é criado automaticamente

### 8. Observabilidade
- ✅ Tracing habilitado automaticamente
- ✅ Projeto criado com nome do deployment
- ✅ Traces preservados após delete
- ✅ Use LangSmith para debug e otimização

---

## 📚 Recursos

- [LangSmith Docs](https://docs.langchain.com/langsmith)
- [LangGraph CLI](https://docs.langchain.com/langsmith/cli)
- [Deployment Guide](https://docs.langchain.com/langsmith/deployments)
- [Application Structure](https://docs.langchain.com/langsmith/application-structure)
- [Agent Server](https://docs.langchain.com/langsmith/agent-server)
- [API Reference](https://langchain-ai.github.io/langgraph/cloud/reference/api/api_ref.html)

---

## 🔌 Interagir com Agent Server

Após deployment, você tem várias formas de interagir:

### 1. Via RemoteGraph (Recomendado)

**Uso idêntico ao grafo local!**

```python
from langgraph.pregel.remote import RemoteGraph

# Conectar ao deployment
graph = RemoteGraph("legal_assistant", url="https://api.smith.langchain.com")

# Usar exatamente como CompiledGraph local
result = await graph.ainvoke({
    "task": "Analisar contrato",
    "agent_id": "harvey",
    "session_id": "user_123",
    "chat_history": [],
    "result": None,
    "error": None,
    "intermediate_steps": [],
    "retry_count": 0
})

# Streaming
async for chunk in graph.astream({...}):
    print(chunk)

# Com thread (persistência)
config = {"configurable": {"thread_id": "thread_123"}}
result = await graph.ainvoke({...}, config=config)

# Ver estado
state = await graph.aget_state(config)

# Ver histórico
history = [s async for s in graph.aget_state_history(config)]
```

**Casos de uso:**
- ✅ Desenvolvimento local → produção (mesma API)
- ✅ Persistência por thread
- ✅ Usar como subgrafo em outro graph
- ✅ Converter em tool para outros agentes
- ✅ Composição modular de workflows

⚠️ **Importante:** Não use RemoteGraph para chamar o mesmo deployment (causa deadlock). Use composição local para grafos no mesmo deployment.

**Ver exemplos completos:** [examples_remote_graph.py](examples_remote_graph.py)

### 2. Via Python SDK

```python
from langsmith import Client

client = Client()

# Usar como se fosse local
from langgraph.pregel import RemoteGraph

# Conectar ao deployment
remote_graph = RemoteGraph(
    deployment_id="<deployment-id>",
    url="https://api.smith.langchain.com"
)

# Usar normalmente
result = await remote_graph.ainvoke({
    "task": "Analisar contrato",
    "agent_id": "harvey",
    "session_id": "user_123",
    "chat_history": [],
    "result": None,
    "error": None,
    "intermediate_steps": [],
    "retry_count": 0
})
```

### 3. Via REST API

```bash
# Criar thread (sessão)
curl -X POST "https://api.smith.langchain.com/deployments/<deployment-id>/threads" \
  -H "Authorization: Bearer ${LANGCHAIN_API_KEY}"

# Criar run (executar)
curl -X POST "https://api.smith.langchain.com/deployments/<deployment-id>/threads/<thread-id>/runs" \
  -H "Authorization: Bearer ${LANGCHAIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "task": "Analisar intimação",
      "agent_id": "justine"
    }
  }'

# Streaming
curl -X POST "https://api.smith.langchain.com/deployments/<deployment-id>/threads/<thread-id>/runs/stream" \
  -H "Authorization: Bearer ${LANGCHAIN_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"input": {...}}'
```

### 3. Criar Assistants Customizados

Após deployment, um assistant padrão é criado. Você pode criar mais:

```python
from langsmith import Client

client = Client()

# Criar assistant para análise de contratos
contract_assistant = client.create_assistant(
    graph_id="legal_assistant",
    name="Analista de Contratos",
    config={
        "configurable": {
            "agent_id": "harvey",
            "temperature": 0.3  # Mais preciso para análise
        }
    }
)

# Criar assistant para redação
drafting_assistant = client.create_assistant(
    graph_id="legal_assistant",
    name="Redator de Petições",
    config={
        "configurable": {
            "agent_id": "redacao-peticoes",
            "temperature": 0.7  # Mais criativo
        }
    }
)

# Usar assistant específico
result = contract_assistant.invoke({
    "task": "Analisar cláusulas de rescisão",
    "session_id": "user_123"
})
```

### 4. Cron Jobs (Tarefas Agendadas)

```python
# Criar cron job para monitorar DJEN diariamente
cron_job = client.create_cron_job(
    deployment_id="<deployment-id>",
    schedule="0 9 * * *",  # Todo dia às 9h
    input={
        "task": "Verificar publicações DJEN",
        "agent_id": "monitor-djen"
    }
)
```

### 5. Webhooks

```python
# Criar webhook para notificações
webhook = client.create_webhook(
    deployment_id="<deployment-id>",
    url="https://seu-app.com/webhook",
    events=["run.completed", "run.failed"]
)

# Seu endpoint recebe:
# POST https://seu-app.com/webhook
# {
#   "event": "run.completed",
#   "run_id": "...",
#   "thread_id": "...",
#   "output": {...}
# }
```

---

## ✅ Checklist de Deployment

- [ ] CLI instalado (`langgraph --version`)
- [ ] langgraph.json configurado
- [ ] Grafo testado localmente
- [ ] Variáveis de ambiente definidas
- [ ] Conta LangSmith criada
- [ ] API key configurada
- [ ] Deployment criado
- [ ] Variáveis configuradas no dashboard
- [ ] Testes no deployment
- [ ] Monitoramento ativo

---

## 🎯 Próximos Passos

1. **Teste Local**
   ```bash
   langgraph dev
   ```

2. **Deploy Staging**
   ```bash
   langgraph deploy --name assistente-juridico-staging
   ```

3. **Validar**
   - Testar endpoints
   - Verificar logs
   - Monitorar métricas

4. **Deploy Produção**
   ```bash
   langgraph deploy --name assistente-juridico-prod
   ```

5. **Integrar**
   - Atualizar Streamlit para usar deployment
   - Configurar fallback local
   - Setup de monitoring

---

✨ **Sistema pronto para deployment no LangSmith!**
