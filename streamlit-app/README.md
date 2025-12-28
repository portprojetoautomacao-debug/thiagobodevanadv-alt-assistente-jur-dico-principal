# 🐍 Assistente Jurídico PJe - Versão Python/Streamlit

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-1.30+-red.svg)](https://streamlit.io/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Sistema inteligente de gestão jurídica com Machine Learning, automação e IA integrada.**

---

## 🎯 Visão Geral

Esta é a **versão Python** do Assistente Jurídico PJe, construída com **Streamlit** para interface administrativa e análise de dados. Ideal para:

- 📊 **Análise de dados** e dashboards ML
- 🤖 **Prototipagem rápida** de novos agentes
- 🔬 **Experimentação** com modelos de ML
- 🏢 **Backoffice** e ferramentas internas
- 🚀 **Automação PJe** com Selenium

> **Nota**: Para a versão de produção com UI moderna em React, veja [thiagobodevanadv-alt-assistente-juridico-typescript](../README.md)

---

## ✨ Features Principais

### 🤖 15 Agentes de IA Especializados

| Agente | Função | Status |
|--------|--------|--------|
| 👨‍⚖️ Harvey Specter | Estratégia macro | ✅ Ativo |
| 👩‍💼 Mrs. Justin-e | Análise de intimações | ✅ Ativo |
| 📄 Análise Documental | OCR + NLP | ✅ Ativo |
| 📰 Monitor DJEN | Scraping diário | ✅ Ativo |
| ⏰ Gestão de Prazos | Cálculo automático | ✅ Ativo |
| ✏️ Redação de Petições | Geração de minutas | ✅ Ativo |
| 📁 Organização | Classificação de docs | ⏸️ Sob demanda |
| 🔍 Pesquisa Jurisprudencial | Busca precedentes | ✅ Ativo |
| ⚠️ Análise de Risco | Previsão de sucesso | ✅ Ativo |
| 📋 Estratégia Processual | Recomendações | ✅ Ativo |
| 📝 Revisão Contratual | Análise de contratos | ⏸️ Sob demanda |
| 💬 Comunicação Clientes | Relatórios auto | ⏸️ Sob demanda |
| 💰 Financeiro | Análise rentabilidade | ⏸️ Sob demanda |
| 🌐 Tradução Jurídica | Explicação de termos | ⏸️ Sob demanda |
| 🔐 Compliance | Auditoria LGPD | ⏸️ Sob demanda |

### 🧠 Machine Learning Integrado

- **Predictor de Sucesso**: Prevê probabilidade de ganhar um caso
- **Clustering de Casos**: Agrupa casos similares automaticamente
- **Estimador de Duração**: Prevê quanto tempo levará um processo
- **Análise de Sentimento**: Detecta tom de documentos e sentenças

### 🔌 Integrações

- **DJEN**: Monitoramento automático de publicações
- **DataJud (CNJ)**: API oficial para busca de jurisprudência
- **PJe**: Automação completa com Selenium
- **Google Calendar**: Sincronização de prazos
- **Redis/Upstash**: Cache e persistência
- **Google Gemini**: LLM para análise jurídica

### 📊 8 Páginas Interativas

1. **Processos**: CRUD completo de processos
2. **Expedientes**: Gerenciamento de intimações
3. **Agentes IA**: Interface de execução manual
4. **Automações**: Controle de automações PJe
5. **Análises ML**: Dashboards de machine learning
6. **Configurações**: Variáveis e integrações
7. **Minutas**: Geração de documentos
8. **Dashboard**: Visão geral do escritório

---

## 🚀 Quick Start

### Pré-requisitos

- Python 3.11+
- Redis (Upstash ou local)
- Google Chrome (para automação PJe)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/assistente-juridico-python.git
cd assistente-juridico-python/streamlit-app

# 2. Crie ambiente virtual
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 3. Instale dependências
pip install -r requirements.txt

# 4. Configure variáveis de ambiente
cp .env.example .env
nano .env  # Edite com suas chaves
```

### Variáveis de Ambiente Obrigatórias

```env
# Redis (Upstash)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Google Gemini
GEMINI_API_KEY=your-gemini-api-key

# Opcional - Integrações
GOOGLE_CALENDAR_CREDENTIALS_PATH=credentials.json
DATAJUD_API_KEY=your-datajud-key
```

### Executar Aplicação

```bash
# Modo desenvolvimento
streamlit run app.py

# Abrir automaticamente no browser
streamlit run app.py --server.headless false

# Especificar porta
streamlit run app.py --server.port 8502
```

Acesse: **http://localhost:8501**

---

## 📁 Estrutura do Projeto

```
streamlit-app/
├── app.py                    # Entry point Streamlit
├── requirements.txt          # Dependências Python
│
├── backend/                  # Backend FastAPI
│   ├── main.py              # API server
│   ├── database.py          # Redis client
│   ├── cron_jobs.py         # Jobs agendados
│   └── routers/             # Endpoints REST
│
├── lib/                      # Bibliotecas
│   ├── agents/              # 15 agentes
│   ├── integrations/        # DJEN, DataJud, PJe
│   ├── ml/                  # Machine Learning
│   ├── automation/          # Automação PJe
│   └── tools/               # Utilitários
│
├── pages/                    # 8 páginas Streamlit
│   ├── 1_Processos.py
│   ├── 2_Expedientes.py
│   ├── 3_Agentes_IA.py
│   └── ...
│
├── tests/                    # Testes pytest
│   ├── test_agents.py
│   ├── test_backend_api.py
│   └── ...
│
└── scripts/                  # Scripts auxiliares
    └── train_success_model.py
```

**Total**: ~7.500 linhas de código Python

Para arquitetura detalhada, veja: [docs/PYTHON_APP_ARCHITECTURE.md](../docs/PYTHON_APP_ARCHITECTURE.md)

---

## 🧪 Testes

### Rodar todos os testes

```bash
pytest tests/ -v
```

### Teste específico

```bash
pytest tests/test_agents.py -v
```

### Com cobertura

```bash
pytest tests/ --cov=lib --cov-report=html
open htmlcov/index.html
```

### Testar integrações

```bash
# DJEN
python -m lib.integrations.djen_service

# DataJud
python -m lib.integrations.datajud_client

# Backend API
curl http://localhost:8000/api/health
```

---

## 📦 Deploy

### Opção 1: Render.com (Recomendado)

**Gratuito** até 750 horas/mês

```yaml
# render.yaml (já configurado)
services:
  - type: web
    name: assistente-juridico-python
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "streamlit run app.py --server.port=$PORT"
```

**Passos**:
1. Criar conta em [render.com](https://render.com)
2. Conectar repositório GitHub
3. Criar Web Service
4. Apontar para `streamlit-app/`
5. Configurar variáveis de ambiente
6. Deploy automático a cada push

**URL**: `https://seu-app.onrender.com`

### Opção 2: Railway.app

**$5 crédito grátis/mês** + recursos superiores

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Deploy
cd streamlit-app
railway init
railway up
```

**URL**: `https://seu-app.railway.app`

### Opção 3: Streamlit Cloud

**Gratuito** para repositórios públicos

1. Push código para GitHub
2. Acessar [share.streamlit.io](https://share.streamlit.io/)
3. New app → Escolher repo → Deploy

**Limitações**:
- Apenas Streamlit (sem FastAPI separado)
- 1 GB RAM
- Sem Selenium

---

## 🔧 Desenvolvimento

### Adicionar Novo Agente

```python
# lib/agents/meu_agente.py
from lib.agents.base import AgentBase

class MeuAgente(AgentBase):
    def __init__(self):
        super().__init__(
            name="Meu Agente",
            description="Descrição do que faz",
            capabilities=["capability-1", "capability-2"]
        )
    
    async def execute(self, input_data: dict) -> dict:
        # Sua lógica aqui
        return {
            "result": "...",
            "confidence": 0.95
        }
```

### Criar Nova Página

```python
# pages/9_Minha_Pagina.py
import streamlit as st

st.set_page_config(page_title="Minha Página", page_icon="🎯")

st.title("🎯 Minha Página")

# Seu código aqui
st.write("Hello World!")
```

### Adicionar Endpoint API

```python
# backend/routers/meu_router.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/api/meu-endpoint")
async def meu_endpoint():
    return {"message": "Hello from API"}
```

---

## 🛠️ Troubleshooting

### Erro: "Port 8000 already in use"

```bash
# Linux/Mac
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Erro: "Module not found"

```bash
# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

### Erro: "Redis connection failed"

Verificar variáveis de ambiente:
```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

### Selenium não funciona

```bash
# Instalar ChromeDriver
pip install webdriver-manager

# Testar
python -c "from selenium import webdriver; driver = webdriver.Chrome(); print('OK')"
```

---

## 📊 Comparação: Python vs TypeScript

| Critério | Python/Streamlit | TypeScript/React |
|----------|------------------|------------------|
| **UI** | ⭐⭐⭐ Simples | ⭐⭐⭐⭐⭐ Moderna |
| **Deploy** | ⭐⭐⭐ Médio | ⭐⭐⭐⭐⭐ Fácil |
| **Custo** | ⭐⭐⭐ $7-15/mês | ⭐⭐⭐⭐⭐ Free |
| **ML/Data** | ⭐⭐⭐⭐⭐ Nativo | ⭐⭐ Limitado |
| **Automação** | ⭐⭐⭐⭐ Selenium | ⭐⭐ Puppeteer |
| **LangChain** | ⭐⭐⭐⭐⭐ Oficial | ⭐⭐⭐⭐ JS port |

**Recomendação**:
- **Use Python** para: Análise de dados, ML, automação, backoffice
- **Use TypeScript** para: App de produção, clientes, escalabilidade

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feat/minha-feature`
3. Commit: `git commit -m 'feat: Minha nova feature'`
4. Push: `git push origin feat/minha-feature`
5. Abra um Pull Request

### Padrões de Código

- **PEP 8**: Seguir style guide Python
- **Type Hints**: Usar sempre que possível
- **Docstrings**: Formato Google
- **Testes**: Cobertura mínima de 70%

```python
def minha_funcao(param: str) -> dict:
    """
    Breve descrição da função.
    
    Args:
        param: Descrição do parâmetro
    
    Returns:
        Descrição do retorno
    
    Raises:
        ValueError: Quando ocorre erro
    """
    return {"result": param}
```

---

## 📚 Documentação Completa

- 📖 [Arquitetura Detalhada](../docs/PYTHON_APP_ARCHITECTURE.md) - 31KB
- 📖 [Análise de Separação](../docs/PYTHON_APP_REVIEW_AND_SEPARATION.md) - 16KB
- 📖 [Guia de Agentes](../TODOS_OS_15_AGENTES.md)
- 📖 [LGPD Compliance](../docs/LGPD_COMPLIANCE.md)

---

## 🔒 Segurança

### LGPD Compliance

Todos os dados sensíveis são sanitizados:
- CPF: `123.***.**-45`
- Email: `j***@example.com`
- Telefone: `(11) 9****-1234`

### Autenticação

**Status**: ⚠️ Não implementado

**Roadmap**: Sistema de login/senha planejado para v2.0

---

## 📈 Roadmap

### v1.1 (Janeiro 2025)
- [ ] Autenticação e autorização
- [ ] Testes E2E com Playwright
- [ ] Logging estruturado (JSON)
- [ ] Integração com Sentry

### v1.2 (Fevereiro 2025)
- [ ] Cache agressivo (Redis)
- [ ] Background tasks (Celery)
- [ ] Notificações em tempo real
- [ ] UI themes customizáveis

### v2.0 (Março 2025)
- [ ] Multi-tenancy
- [ ] Deep Learning (BERT jurídico)
- [ ] RAG com Qdrant
- [ ] Mobile app (React Native)

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 👥 Equipe

**Desenvolvido por**: Thiago Bode V Adv

**Contribuidores**:
- GitHub Copilot IA

---

## 🙏 Agradecimentos

- [Streamlit](https://streamlit.io/) - Framework Python incrível
- [FastAPI](https://fastapi.tiangolo.com/) - Backend moderno
- [LangChain](https://python.langchain.com/) - Orquestração de LLMs
- [Upstash](https://upstash.com/) - Redis serverless
- [Google Gemini](https://ai.google.dev/) - LLM poderoso

---

## 📞 Suporte

- 📧 Email: suporte@assistentepje.com.br
- 💬 Discord: [Entrar no servidor](https://discord.gg/...)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/assistente-juridico-python/issues)

---

**Versão**: 1.0.0  
**Última Atualização**: 28/12/2024  
**Status**: ✅ Produção

---

## 🌟 Star o Projeto!

Se este projeto te ajudou, considere dar uma ⭐ no GitHub!

[![GitHub stars](https://img.shields.io/github/stars/seu-usuario/assistente-juridico-python.svg?style=social&label=Star)](https://github.com/seu-usuario/assistente-juridico-python)
