# ⚖️ Assistente Jurídico PJe - Python Edition

Sistema inteligente de gestão jurídica para escritórios de advocacia.

## 🚀 Stack

- **Frontend**: Streamlit
- **Backend**: FastAPI
- **IA**: LangChain + 16 Agentes Especializados
- **Database**: Redis (Upstash)
- **Integrações**: DJEN, DataJud, Google Calendar, Qdrant

## 📦 Instalação

```bash
cd streamlit-app
pip install -r requirements.txt
```

## ▶️ Executar

```bash
cd streamlit-app
streamlit run app.py
```

O backend FastAPI inicia automaticamente na porta 8000.

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
├── app.py              # App principal Streamlit
├── backend/            # FastAPI backend
│   ├── main.py
│   └── routers/        # Endpoints da API
├── lib/
│   ├── agents/         # 16 agentes LangChain
│   ├── integrations/   # DJEN, DataJud, Calendar, Qdrant
│   └── ml/             # Machine Learning
├── pages/              # Páginas Streamlit
└── tests/              # Testes pytest
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env` em `streamlit-app/`:

```env
# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# LLM
GOOGLE_API_KEY=

# Qdrant (opcional)
QDRANT_URL=
QDRANT_API_KEY=
```

## 📚 Deploy

- **Render**: Ver `streamlit-app/render.yaml`
- **Railway**: Configurar via dashboard
- **Streamlit Cloud**: Conectar repositório

## 📄 Licença

MIT
