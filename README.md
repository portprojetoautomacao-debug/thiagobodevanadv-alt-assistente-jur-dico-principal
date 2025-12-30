# ⚖️ Assistente Jurídico PJe - Python Edition

Sistema inteligente de gestão jurídica para escritórios de advocacia com suporte a escala empresarial usando LangSmith Agent Server.

> 📚 **[Índice Completo de Documentação](INDEX.md)** - Navegue por todos os guias, scripts e configurações

## 🚀 Stack

- **Frontend**: Streamlit
- **Backend**: FastAPI + LangGraph
- **IA**: LangChain + 16 Agentes Especializados
- **Database**: PostgreSQL + Redis
- **Deployment**: LangSmith Agent Server
- **Integrações**: DJEN, DataJud, Google Calendar, Qdrant

## 📦 Instalação

```bash
cd streamlit-app
pip install -r requirements.txt

# Ou com uv (recomendado para produção)
uv pip install -r requirements.txt
```

## ▶️ Executar

### Desenvolvimento Local

```bash
# Iniciar servidor de desenvolvimento LangGraph
cd streamlit-app
langgraph dev

# Ou executar com Streamlit
streamlit run app.py
```

O backend FastAPI inicia automaticamente na porta 8000.
O LangGraph Studio estará disponível em http://localhost:2024/studio

### Produção

Consulte os guias:
- [📊 Configuração para Escala](AGENT_SERVER_SCALE_CONFIG.md)
- [📋 Checklist de Deployment](DEPLOYMENT_CHECKLIST.md)
- [🚀 Guia Rápido](QUICK_REFERENCE.md)

## 🤖 16 Agentes IA

| Agente | Função |
|--------|--------|
| Harvey Specter | Estrategista-chefe |
| Mrs. Justin-e | Análise de intimações e prazos |
| Monitor DJEN | Monitoramento de publicações |
| Análise Documental | Análise de expedientes |
| Gestão de Prazos | Cálculo de prazos |
| Redação de Petições | Criação de documentos |
| Pesquisa Jurisprudencial | Busca de precedentes |
| Análise de Risco | Avaliação de viabilidade |
| Estratégia Processual | Planejamento estratégico |
| Organização de Arquivos | Categorização de docs |
| Revisão Contratual | Análise de contratos |
| Comunicação Clientes | Geração de comunicações |
| Financeiro | Análise financeira |
| Tradução Jurídica | Tradução de termos |
| Compliance | Conformidade LGPD |
| Análise de Sentença | Análise de decisões |

## 📁 Estrutura

```
streamlit-app/
├── app.py                      # App principal Streamlit
├── langgraph.json              # Configuração LangGraph
├── deployment-config.yaml      # Config de deployment para escala
├── .env.production             # Variáveis de ambiente de produção
├── backend/                    # FastAPI backend
│   ├── main.py
│   └── routers/                # Endpoints da API
├── lib/
│   ├── langgraph_orchestrator.py  # Orquestrador principal
│   ├── agents/                 # 16 agentes LangChain
│   ├── integrations/           # DJEN, DataJud, Calendar, Qdrant
│   └── ml/                     # Machine Learning
├── pages/                      # Páginas Streamlit
├── scripts/
│   ├── monitor_metrics.py      # Script de monitoramento
│   └── calculate_capacity.py   # Calculadora de capacidade
└── tests/                      # Testes pytest
```

## 🔧 Variáveis de Ambiente

### Desenvolvimento

Crie um arquivo `.env` em `streamlit-app/`:

```env
# LangSmith
LANGSMITH_API_KEY=lsv2_pt_...
LANGSMITH_PROJECT=legal-assistant-dev

# Google AI
GOOGLE_API_KEY=AIza...

# Redis (local ou Upstash)
REDIS_URI_CUSTOM=redis://localhost:6379/0

# PostgreSQL (local)
POSTGRES_URI_CUSTOM=postgresql://user:pass@localhost:5432/legal_assistant
```

### Produção

Use `.env.production` como template e configure:

- Database externa (AWS RDS, GCP CloudSQL, etc.)
- Redis externo (Upstash, ElastiCache, etc.)
- Chaves de API de produção
- Configurações de performance

Veja detalhes completos em [`.env.production`](streamlit-app/.env.production).

## 📊 Deployment e Escala

### Opções de Deployment

#### 1. LangSmith Cloud (Recomendado para Produção)

```bash
# Deploy via UI
# 1. Acesse smith.langchain.com
# 2. Deployments > + New Deployment
# 3. Conecte seu repositório GitHub
# 4. Configure variáveis de ambiente
# 5. Deploy!

# Ou via SDK
python -c "
from langgraph_sdk import get_client
client = get_client(url='https://sua-url.langgraph.app')
"
```

#### 2. Self-Hosted

```bash
# Build da imagem
langgraph build -t legal-assistant:latest

# Deploy com Docker
docker run --env-file .env -p 8000:8000 legal-assistant:latest

# Ou com Kubernetes
kubectl apply -f deployment-config.yaml
```

#### 3. Render / Railway / Fly.io

Ver arquivo `render.yaml` para configuração específica.

### Configuração para Escala

O projeto inclui configurações otimizadas para diferentes níveis de carga:

| Carga | Read req/s | Write req/s | Config |
|-------|-----------|-------------|--------|
| **Baixa** | 5 | 5 | 1 API server, 1 worker |
| **Média** | 50 | 50 | 3 API servers, 5 workers |
| **Alta** | 500 | 500 | 15 API servers, 10 workers |

**Ferramentas incluídas:**

```bash
# Calcular capacidade necessária
python scripts/calculate_capacity.py

# Monitorar métricas em tempo real
python scripts/monitor_metrics.py --continuous 60
```

**Documentação completa:**

- 📊 [Guia de Configuração para Escala](AGENT_SERVER_SCALE_CONFIG.md)
- 📋 [Checklist de Deployment](DEPLOYMENT_CHECKLIST.md)
- 🚀 [Referência Rápida de Comandos](QUICK_REFERENCE.md)

### Melhores Práticas de Performance

1. **N_JOBS_PER_WORKER=25** - Otimizado para operações I/O bound
2. **Durability configurável** - Use `"exit"` para runs que não precisam de checkpoints intermediários
3. **TTL automático** - Limpeza de dados antigos após 30 dias
4. **Autoscaling** - Configurado para picos de tráfego

### Monitoramento

```bash
# Health check
curl https://sua-url/ok

# Métricas (via script)
python scripts/monitor_metrics.py

# Dashboard no LangSmith
# smith.langchain.com > Deployments > [Seu Deploy] > Monitoring
```

### Custos Estimados

| Tier | Uso Mensal | Custo Aprox. | Recomendado Para |
|------|-----------|--------------|------------------|
| **Dev** | < 10k runs | $0-50 | Desenvolvimento/Teste |
| **Starter** | 10k-100k runs | $50-500 | Pequenos escritórios |
| **Pro** | 100k-1M runs | $500-2000 | Médios escritórios |
| **Enterprise** | > 1M runs | Custom | Grandes escritórios |

*Custos incluem: LangSmith, Database, Cache, LLM APIs*

## 🔒 Segurança

- ✅ Autenticação via LangSmith API Keys
- ✅ CORS configurável
- ✅ Rate limiting
- ✅ Secrets gerenciados via variáveis de ambiente
- ✅ SSL/TLS em produção
- ✅ LGPD compliance via agente dedicado

## 📚 Recursos Adicionais

### Documentação Oficial

- [LangSmith Docs](https://docs.langchain.com/langsmith)
- [LangGraph Docs](https://docs.langchain.com/oss/python/langgraph)
- [API Reference](https://api.smith.langchain.com/redoc)

### Suporte

- 📧 Email: support@langchain.com
- 💬 Discord: [LangChain Community](https://discord.gg/langchain)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-repo/issues)

## 📄 Licença

MIT
