# ⚖️ Assistente Jurídico PJe - Versão Streamlit

> **Versão Python paralela** do sistema jurídico com Streamlit, Pandas, scikit-learn, LangChain, Selenium e PyAutoGUI.

## 🎯 Objetivo

Criar uma **versão alternativa em Python** que:

- ✅ Mantém compatibilidade total com backend React/Vercel
- ✅ Aproveita ecossistema Python (ML, IA, automação)
- ✅ Oferece interface Streamlit moderna e interativa
- ✅ Não afeta sistema React em produção

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd streamlit-app

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Instalar drivers Selenium
playwright install chromium
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar template
cp .env.example .env

# Editar .env com suas credenciais
nano .env
```

**Configurações mínimas:**

```bash
REACT_API_URL=https://assistente-juridico-github.vercel.app/api
GEMINI_API_KEY=your-key-here
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

### 3. Executar App

```bash
streamlit run app.py
```

**Acesse:** http://localhost:8501

## 📁 Estrutura do Projeto

```
streamlit-app/
├── app.py                      # Aplicação principal
├── requirements.txt            # Dependências Python
├── .env.example               # Template de configuração
├── README.md                  # Este arquivo
│
├── lib/                       # Bibliotecas core
│   ├── config.py              # Configuração centralizada
│   ├── backend_client.py      # Cliente HTTP para React API
│   ├── langchain_agents.py    # Agentes LangChain
│   ├── ml_models.py           # Modelos scikit-learn
│   ├── selenium_scraper.py    # Web scraping com Selenium
│   └── pyautogui_automation.py # Automação GUI
│
├── pages/                     # Páginas Streamlit
│   ├── dashboard.py           # Dashboard principal ✅
│   ├── processos.py           # Gestão de processos
│   ├── expedientes.py         # Expedientes
│   ├── agentes.py             # Agentes IA
│   ├── automacoes.py          # Automações
│   ├── analises_ml.py         # Análises ML
│   └── configuracoes.py       # Configurações
│
└── tests/                     # Testes pytest
    ├── test_backend_client.py
    ├── test_agents.py
    └── test_automation.py
```

## 🔌 Integração com Backend React

### API Endpoints Compatíveis

| Endpoint                   | Método   | Descrição       |
| -------------------------- | -------- | --------------- |
| `/api/health`              | GET      | Health check    |
| `/api/kv`                  | POST     | Redis KV store  |
| `/api/processes`           | GET      | Lista processos |
| `/api/expedientes`         | GET/POST | Expedientes     |
| `/api/agents`              | GET      | Lista agentes   |
| `/api/agents/process-task` | POST     | Executa agente  |
| `/api/metrics`             | GET      | Métricas        |

### Exemplo de Uso

```python
from backend_client import BackendClient

backend = BackendClient()

# Buscar processos
processes = backend.get_processes()

# Criar expediente
novo_expediente = {
    "tipo": "intimacao",
    "processo_id": "123",
    "conteudo": "Intimação para manifestação"
}
result = backend.create_expediente(novo_expediente)

# Executar agente
task = {"type": "analyze", "data": {...}}
response = backend.execute_agent_task("harvey", task)
```

## 🤖 Funcionalidades Python Exclusivas

### 1. Análise de Dados com Pandas

```python
import pandas as pd

# Análise de processos
df = pd.DataFrame(processes)
df['created_month'] = pd.to_datetime(df['createdAt']).dt.month

# Agregações complexas
stats = df.groupby('status').agg({
    'id': 'count',
    'valor': 'sum',
    'prazo': 'mean'
})
```

### 2. Machine Learning com scikit-learn

```python
from sklearn.ensemble import RandomForestClassifier

# Prever probabilidade de sucesso
model = RandomForestClassifier()
model.fit(X_train, y_train)

probabilidade_sucesso = model.predict_proba(novo_processo)
```

### 3. LangChain para Orquestração LLM

```python
from langchain.agents import AgentExecutor
from langchain.tools import Tool

# Agente jurídico com tools
tools = [
    Tool(name="pesquisa_juris", func=pesquisar_jurisprudencia),
    Tool(name="calculo_prazo", func=calcular_prazo)
]

agent = AgentExecutor(tools=tools, llm=gemini_llm)
result = agent.run("Analisar intimação e calcular prazo")
```

### 4. Automação Web com Selenium

```python
from selenium import webdriver
from selenium.webdriver.common.by import By

# Scraping DJEN
driver = webdriver.Chrome()
driver.get("https://djen.tjal.jus.br")

publicacoes = driver.find_elements(By.CLASS_NAME, "publicacao")
for pub in publicacoes:
    extrair_dados(pub)
```

### 5. Automação GUI com PyAutoGUI

```python
import pyautogui

# Automatizar PJe
pyautogui.click(x=500, y=300)
pyautogui.typewrite("texto da petição")
pyautogui.hotkey("ctrl", "s")
```

## 📊 Páginas Implementadas

### ✅ Dashboard (Implementado)

- KPIs principais
- Gráficos interativos (Plotly)
- Tendências temporais
- Métricas de agentes
- Processos recentes

### 🚧 Em Desenvolvimento

- Processos (CRUD completo)
- Expedientes (análise automática)
- Agentes IA (orquestração LangChain)
- Automações (Selenium + PyAutoGUI)
- Análises ML (scikit-learn)
- Configurações (gerenciamento)

## 🧪 Testes

```bash
# Executar todos os testes
pytest

# Com coverage
pytest --cov=lib --cov-report=html

# Teste específico
pytest tests/test_backend_client.py -v
```

## 🚀 Deploy

### Opção 1: Streamlit Cloud (Grátis)

```bash
# 1. Push para GitHub
git add streamlit-app/
git commit -m "feat: adiciona versão Streamlit"
git push

# 2. Deploy no Streamlit Cloud
# https://share.streamlit.io/
# Conectar repositório
# App path: streamlit-app/app.py
```

### Opção 2: Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501"]
```

```bash
docker build -t assistente-juridico-streamlit .
docker run -p 8501:8501 assistente-juridico-streamlit
```

### Opção 3: Railway/Render

```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "streamlit run app.py --server.port=$PORT"
```

## 🤝 Compatibilidade com Sistema React

| Recurso             | React App  | Streamlit App   | Compartilhado |
| ------------------- | ---------- | --------------- | ------------- |
| **Backend API**     | ✅ Vercel  | ✅ Consome      | ✅ Sim        |
| **Redis (Upstash)** | ✅ Usa     | ✅ Usa          | ✅ Sim        |
| **Qdrant**          | ✅ Usa     | ✅ Usa          | ✅ Sim        |
| **Heavy Processor** | ✅ Usa     | ✅ Usa          | ✅ Sim        |
| **UI Framework**    | React 19   | Streamlit       | ❌ Não        |
| **Linguagem**       | TypeScript | Python          | ❌ Não        |
| **Deploy**          | Vercel     | Streamlit Cloud | ❌ Não        |

## 📚 Tecnologias

- **Streamlit** - Framework UI Python
- **Pandas** - Análise de dados
- **scikit-learn** - Machine Learning
- **LangChain** - Orquestração LLM
- **Selenium** - Web scraping
- **PyAutoGUI** - Automação GUI
- **Plotly** - Visualizações interativas
- **Qdrant** - Vector database
- **Redis** - Cache e state

## 🎯 Roadmap

- [x] Setup inicial do projeto
- [x] Configuração de ambiente
- [x] Cliente backend (HTTP)
- [x] Dashboard principal
- [ ] CRUD de processos
- [ ] Gestão de expedientes
- [ ] Agentes LangChain
- [ ] Automação Selenium
- [ ] Análises ML (scikit-learn)
- [ ] Deploy Streamlit Cloud

## 📞 Suporte

Para dúvidas:

1. Consulte este README
2. Veja exemplos em `pages/`
3. Verifique logs: `streamlit run app.py --logger.level=debug`

---

**Versão:** 1.0.0
**Data:** 27/12/2025
**Autor:** Thiago Bode
**Licença:** Privado
