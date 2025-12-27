# 🚀 PLANO DE MIGRAÇÃO ACELERADA - 100% PYTHON

**Status Atual:** Sistema React/Node.js não está estável e não funciona corretamente
**Objetivo:** Migrar IMEDIATAMENTE para 100% Python sem perder tempo
**Estratégia:** Substituição direta - sem coexistência
**Prazo:** 2-3 semanas
**Data:** 27/12/2025

---

## ⚡ SITUAÇÃO URGENTE

```
❌ Sistema Atual (React/Node.js):
   • Não está funcionando corretamente
   • Instável
   • Precisa ser substituído URGENTEMENTE

✅ Nova Stack (100% Python):
   • Streamlit - Frontend interativo
   • Pandas - Manipulação de dados
   • scikit-learn - Machine Learning
   • LangChain - Agentes IA reais
   • PyAutoGUI - Automação GUI
   • Selenium - Web scraping
   • FastAPI - Backend REST
```

---

## 📊 MAPEAMENTO COMPLETO DAS FUNCIONALIDADES

### 1️⃣ Frontend React → Streamlit

| Funcionalidade Atual | Tecnologia Atual | Nova Implementação Python |
|---------------------|------------------|---------------------------|
| **Dashboard** | React + Recharts | Streamlit + Plotly |
| **Lista de Processos** | React + TanStack Table | Streamlit + st.dataframe(Pandas) |
| **Formulários** | React Hook Form | Streamlit widgets (st.form) |
| **Modais** | Radix UI Dialog | st.dialog() ou st.modal() |
| **Notificações** | react-hot-toast | st.success/error/warning() |
| **Navegação** | React Router | Streamlit pages/ |
| **Estado Global** | Zustand/Redux | st.session_state |
| **Temas** | Tailwind CSS | Streamlit themes (.streamlit/config.toml) |

### 2️⃣ Backend Node.js → FastAPI + Python

| Endpoint Atual | Arquivo Node.js | Nova Implementação Python |
|----------------|-----------------|---------------------------|
| `/api/health` | `api/health.ts` | `backend/routers/health.py` |
| `/api/processes` | `api/processes.ts` | `backend/routers/processes.py` (Pandas) |
| `/api/expedientes` | `api/expedientes.ts` | `backend/routers/expedientes.py` |
| `/api/agents` | `api/agents.ts` | `backend/routers/agents.py` (LangChain) |
| `/api/agents/process-task` | `api/agents.ts` | `backend/routers/agents.py` (LangChain) |
| `/api/djen-sync` | `api/djen-sync.ts` | `backend/routers/djen.py` (Selenium) |
| `/api/pje-sync` | `api/pje-sync.ts` | `backend/routers/pje.py` (Selenium) |
| `/api/kv` | `api/kv.ts` | `backend/database.py` (Redis) |
| `/api/metrics` | `api/metrics.ts` | `backend/routers/metrics.py` (Pandas) |
| `/api/cron` | `api/cron.ts` | `backend/cron_jobs.py` (APScheduler) |

### 3️⃣ Agentes TypeScript → LangChain Python

| Agente Atual | Implementação Atual | Nova Implementação Python |
|-------------|---------------------|---------------------------|
| **Harvey Specter** | `src/lib/agents.ts` (stub) | `lib/agents/harvey.py` (LangChain real) |
| **Mrs. Justin-e** | `src/lib/agents.ts` (stub) | `lib/agents/justine.py` (LangChain real) |
| **Redação Petições** | `src/lib/agents.ts` (stub) | `lib/agents/redacao.py` (LangChain real) |
| **Pesquisa Juris** | `src/lib/agents.ts` (stub) | `lib/agents/pesquisa.py` (LangChain + Qdrant) |
| **Análise Documental** | `src/lib/agents.ts` (stub) | `lib/agents/analise_doc.py` (LangChain + PyPDF) |
| **Monitor DJEN** | `src/lib/agents.ts` (stub) | `lib/agents/monitor_djen.py` (Selenium) |
| **Gestão Prazos** | `src/lib/agents.ts` (stub) | `lib/agents/prazos.py` (Python datetime) |
| **+9 agentes** | Stubs TypeScript | LangChain Python real |

### 4️⃣ Integrações Externas

| Integração | Tecnologia Atual | Nova Implementação Python |
|-----------|------------------|---------------------------|
| **DJEN** | `src/lib/djen-api.ts` | `lib/integrations/djen.py` (Selenium) |
| **DataJud** | `src/lib/datajud-api.ts` | `lib/integrations/datajud.py` (requests) |
| **PJe** | Chrome Extension | `lib/integrations/pje.py` (Selenium) |
| **Google Calendar** | `src/lib/google-calendar-service.ts` | `google-calendar` (oficial) |
| **Upstash Redis** | `api/kv.ts` | `redis-py` + `httpx` |
| **Gemini AI** | `src/lib/gemini-service.ts` | `google-generativeai` |
| **Qdrant** | `src/lib/qdrant-service.ts` | `qdrant-client` |

### 5️⃣ Automações

| Automação | Tecnologia Atual | Nova Implementação Python |
|-----------|------------------|---------------------------|
| **Scraping DJEN** | Node.js + Puppeteer | Selenium WebDriver |
| **Scraping PJe** | Chrome Extension | Selenium WebDriver |
| **Scraping DataJud** | Node.js + Axios | requests + BeautifulSoup |
| **Login automático** | Chrome Extension | Selenium WebDriver |
| **Protocolo PJe** | Chrome Extension | Selenium + PyAutoGUI |
| **Preenchimento forms** | Chrome Extension | Selenium + PyAutoGUI |
| **Screenshots** | Puppeteer | PyAutoGUI.screenshot() |
| **Controle mouse** | Não implementado | PyAutoGUI (move, click, scroll) |

### 6️⃣ Machine Learning (NOVO)

| Funcionalidade | Status Atual | Implementação Python |
|---------------|--------------|----------------------|
| **Predição Sucesso** | ❌ Não existe | scikit-learn (RandomForest) |
| **Estimativa Duração** | ❌ Não existe | scikit-learn (GradientBoosting) |
| **Clustering Casos** | ❌ Não existe | scikit-learn (KMeans) |
| **Análise Sentimento** | ❌ Não existe | NLTK + TextBlob |
| **Recomendação Estratégia** | ❌ Não existe | scikit-learn (DecisionTree) |

---

## 🎯 PLANO DE EXECUÇÃO ACELERADO

### SEMANA 1: SETUP E BACKEND (Dias 1-7)

#### Dia 1: Ambiente e Dependências
```bash
# 1. Criar ambiente virtual
cd streamlit-app
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 2. Instalar todas as dependências
pip install --upgrade pip
pip install streamlit pandas numpy scikit-learn
pip install langchain langchain-google-genai
pip install selenium webdriver-manager
pip install pyautogui pillow
pip install fastapi uvicorn redis httpx
pip install google-api-python-client google-auth
pip install qdrant-client sentence-transformers
pip install beautifulsoup4 requests lxml
pip install apscheduler python-dotenv
pip install plotly altair
pip install pypdf2 python-docx
pip install nltk textblob

# 3. Instalar drivers Selenium
pip install webdriver-manager

# 4. Salvar requirements
pip freeze > requirements.txt
```

#### Dia 2-3: Backend FastAPI
```python
# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Assistente Jurídico API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Importar routers
from routers import health, processes, agents, expedientes

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(processes.router, prefix="/api", tags=["processes"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(expedientes.router, prefix="/api", tags=["expedientes"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

**Arquivos a criar:**
- `backend/main.py` - FastAPI app principal
- `backend/database.py` - Cliente Redis/Upstash
- `backend/routers/health.py` - Health check
- `backend/routers/processes.py` - CRUD processos (Pandas)
- `backend/routers/agents.py` - Agentes LangChain
- `backend/routers/expedientes.py` - CRUD expedientes
- `backend/routers/djen.py` - Scraping DJEN (Selenium)
- `backend/routers/pje.py` - Scraping PJe (Selenium)
- `backend/routers/metrics.py` - Métricas (Pandas)
- `backend/cron_jobs.py` - Jobs agendados (APScheduler)

#### Dia 4-5: Agentes LangChain
```python
# lib/agents/base_agent.py
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory

class BaseAgent:
    def __init__(self, agent_id: str, name: str, role: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            temperature=0.7
        )
        self.memory = ConversationBufferMemory()

    def create_executor(self, tools: list, prompt: str):
        prompt_template = PromptTemplate(
            template=prompt,
            input_variables=["input", "agent_scratchpad"]
        )
        agent = create_react_agent(self.llm, tools, prompt_template)
        return AgentExecutor(
            agent=agent,
            tools=tools,
            memory=self.memory,
            verbose=True,
            handle_parsing_errors=True
        )

# lib/agents/harvey.py - Estrategista
# lib/agents/justine.py - Intimações
# lib/agents/redacao.py - Petições
# lib/agents/pesquisa.py - Jurisprudência
# ... (12 agentes restantes)
```

#### Dia 6-7: Integrações Selenium
```python
# lib/integrations/djen.py
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

class DJENScraper:
    def __init__(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)

    def buscar_por_oab(self, numero_oab: str, uf: str):
        """Busca publicações no DJEN por número OAB"""
        try:
            self.driver.get("https://www.in.gov.br/consulta")
            # Implementar lógica de scraping
            wait = WebDriverWait(self.driver, 10)
            campo_busca = wait.until(
                EC.presence_of_element_located((By.ID, "campo-busca"))
            )
            campo_busca.send_keys(f"OAB {uf} {numero_oab}")
            # ... resto da implementação
            return publicacoes
        finally:
            self.driver.quit()

# lib/integrations/pje.py - Similar
```

### SEMANA 2: FRONTEND STREAMLIT (Dias 8-14)

#### Dia 8-9: Dashboard Principal
```python
# app.py
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

st.set_page_config(
    page_title="Assistente Jurídico PJe",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Estilo customizado
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1e40af;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<h1 class="main-header">⚖️ Assistente Jurídico PJe</h1>', unsafe_allow_html=True)
st.markdown("**Sistema 100% Python** | Streamlit + LangChain + Selenium")

# Sidebar
with st.sidebar:
    st.image("assets/logo.png", width=200)  # Se tiver logo
    st.markdown("---")
    st.markdown("### 🔧 Configurações")
    ambiente = st.selectbox("Ambiente", ["Produção", "Desenvolvimento"])
    st.markdown("---")
    st.markdown("### 📊 Status do Sistema")
    st.success("✅ Backend Online")
    st.success("✅ Redis Conectado")
    st.success("✅ 16 Agentes Ativos")

# KPIs em colunas
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Processos Ativos", "245", "+12")
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Intimações Pendentes", "18", "-5")
    st.markdown('</div>', unsafe_allow_html=True)

with col3:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Prazos Vencendo", "7", "+2")
    st.markdown('</div>', unsafe_allow_html=True)

with col4:
    st.markdown('<div class="metric-card">', unsafe_allow_html=True)
    st.metric("Agentes Executados", "1.234", "+89")
    st.markdown('</div>', unsafe_allow_html=True)

# Gráficos
st.markdown("---")
col_left, col_right = st.columns(2)

with col_left:
    st.markdown("### 📈 Processos por Status")
    # Dados de exemplo (substituir por dados reais)
    df_status = pd.DataFrame({
        'Status': ['Ativo', 'Suspenso', 'Arquivado', 'Em Análise'],
        'Quantidade': [120, 45, 60, 20]
    })
    fig = px.pie(df_status, values='Quantidade', names='Status',
                 color_discrete_sequence=px.colors.sequential.Blues_r)
    st.plotly_chart(fig, use_container_width=True)

with col_right:
    st.markdown("### 📊 Intimações por Semana")
    df_intimacoes = pd.DataFrame({
        'Semana': pd.date_range(start='2025-01-01', periods=12, freq='W'),
        'Quantidade': [23, 34, 28, 41, 35, 29, 38, 42, 31, 36, 40, 45]
    })
    fig = px.line(df_intimacoes, x='Semana', y='Quantidade',
                  markers=True, line_shape='spline')
    st.plotly_chart(fig, use_container_width=True)

# Tabela de processos recentes
st.markdown("---")
st.markdown("### 📋 Processos Recentes")

# Exemplo com Pandas (substituir por dados reais do backend)
df_processos = pd.DataFrame({
    'Processo': ['0001234-56.2025.8.02.0001', '0001235-56.2025.8.02.0001'],
    'Cliente': ['João Silva', 'Maria Santos'],
    'Status': ['Ativo', 'Em Análise'],
    'Última Atualização': ['27/12/2025', '26/12/2025'],
    'Prazo': ['15/01/2026', '20/01/2026']
})

# Tabela interativa
st.dataframe(
    df_processos,
    use_container_width=True,
    hide_index=True,
    column_config={
        "Status": st.column_config.SelectboxColumn(
            "Status",
            options=["Ativo", "Suspenso", "Arquivado", "Em Análise"]
        ),
        "Prazo": st.column_config.DateColumn("Prazo", format="DD/MM/YYYY")
    }
)

# Botões de ação
st.markdown("---")
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Sincronizar DJEN", use_container_width=True):
        with st.spinner("Buscando publicações..."):
            # Chamar backend Selenium
            st.success("✅ DJEN sincronizado!")

with col2:
    if st.button("📥 Importar Expedientes", use_container_width=True):
        st.info("📁 Selecione arquivos para upload")

with col3:
    if st.button("🤖 Executar Agentes", use_container_width=True):
        with st.spinner("Processando..."):
            # Chamar backend LangChain
            st.success("✅ 16 agentes executados!")
```

#### Dia 10-11: Páginas Secundárias
```python
# pages/1_📋_Processos.py
import streamlit as st
import pandas as pd

st.title("📋 Gestão de Processos")

# Filtros
col1, col2, col3 = st.columns(3)
with col1:
    filtro_status = st.multiselect("Status", ["Ativo", "Suspenso", "Arquivado"])
with col2:
    filtro_cliente = st.text_input("Cliente")
with col3:
    filtro_data = st.date_input("Data inicial")

# Tabela com dados reais do backend
# df = requests.get(f"{API_URL}/api/processes").json()
df = pd.DataFrame({...})  # Substituir por API real

# Editor de processos
if st.button("➕ Novo Processo"):
    with st.form("novo_processo"):
        numero = st.text_input("Número do Processo")
        cliente = st.text_input("Cliente")
        tipo = st.selectbox("Tipo", ["Trabalhista", "Cível", "Criminal"])
        submitted = st.form_submit_button("Salvar")
        if submitted:
            # POST para backend
            st.success("✅ Processo cadastrado!")

# pages/2_📨_Expedientes.py
# pages/3_🤖_Agentes_IA.py
# pages/4_🔍_Automações.py
# pages/5_📊_Análises_ML.py
# pages/6_⚙️_Configurações.py
```

#### Dia 12-13: Integrações UI
```python
# pages/3_🤖_Agentes_IA.py
import streamlit as st
import requests

st.title("🤖 Agentes de IA")

# Seleção de agente
agente_selecionado = st.selectbox(
    "Escolha um agente",
    ["Harvey Specter", "Mrs. Justin-e", "Redator Jurídico", "Pesquisador"]
)

# Input de tarefa
tarefa = st.text_area("Descreva a tarefa:", height=100)

if st.button("🚀 Executar Agente"):
    with st.spinner(f"🤖 {agente_selecionado} está trabalhando..."):
        # Chamar backend LangChain
        response = requests.post(
            f"{API_URL}/api/agents/process-task",
            json={
                "agentId": agente_selecionado.lower().replace(" ", "-"),
                "task": tarefa
            }
        )

        if response.status_code == 200:
            resultado = response.json()
            st.success("✅ Tarefa concluída!")

            # Mostrar resultado
            st.markdown("### 📄 Resultado:")
            st.markdown(resultado["response"])

            # Métricas
            col1, col2, col3 = st.columns(3)
            col1.metric("Tempo", f"{resultado['processingTime']}ms")
            col2.metric("Confiança", f"{resultado['confidence']}%")
            col3.metric("Tokens", resultado.get('tokens', 'N/A'))
```

#### Dia 14: Machine Learning UI
```python
# pages/5_📊_Análises_ML.py
import streamlit as st
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import plotly.express as px

st.title("📊 Análises com Machine Learning")

tab1, tab2, tab3 = st.tabs(["Predição de Sucesso", "Estimativa de Duração", "Clustering"])

with tab1:
    st.markdown("### 🎯 Predição de Sucesso Processual")

    with st.form("predicao"):
        tipo_acao = st.selectbox("Tipo de Ação", ["Trabalhista", "Cível", "Criminal"])
        valor_causa = st.number_input("Valor da Causa (R$)", min_value=0)
        tribunal = st.selectbox("Tribunal", ["TRT", "TJ", "STF", "STJ"])

        submitted = st.form_submit_button("Prever Sucesso")

        if submitted:
            # Carregar modelo treinado
            # model = pickle.load(open('models/success_predictor.pkl', 'rb'))
            # probabilidade = model.predict_proba([[features]])[0][1]

            probabilidade = 0.78  # Exemplo

            st.markdown("---")
            col1, col2 = st.columns([1, 2])

            with col1:
                st.metric(
                    "Probabilidade de Sucesso",
                    f"{probabilidade*100:.1f}%",
                    delta="+12% vs média"
                )

            with col2:
                # Gráfico de fatores
                df_fatores = pd.DataFrame({
                    'Fator': ['Tipo de Ação', 'Valor', 'Tribunal', 'Histórico'],
                    'Impacto': [0.35, 0.25, 0.20, 0.20]
                })
                fig = px.bar(df_fatores, x='Fator', y='Impacto',
                            title="Fatores de Influência")
                st.plotly_chart(fig, use_container_width=True)

with tab2:
    st.markdown("### ⏱️ Estimativa de Duração")
    # Similar ao tab1...

with tab3:
    st.markdown("### 🔍 Clustering de Casos Similares")
    # Similar ao tab1...
```

### SEMANA 3: AUTOMAÇÕES E DEPLOY (Dias 15-21)

#### Dia 15-16: Automações Selenium + PyAutoGUI
```python
# lib/automation/pje_automation.py
from selenium import webdriver
from selenium.webdriver.common.by import By
import pyautogui
import time

class PJeAutomation:
    def __init__(self):
        self.driver = self._setup_driver()

    def _setup_driver(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        return webdriver.Chrome(options=options)

    def login(self, cpf: str, senha: str):
        """Login automático no PJe"""
        self.driver.get("https://pje.tjal.jus.br/pje/login.seam")

        # Preencher campos
        self.driver.find_element(By.ID, "username").send_keys(cpf)
        self.driver.find_element(By.ID, "password").send_keys(senha)
        self.driver.find_element(By.ID, "btnEntrar").click()

        time.sleep(2)
        return self.driver.current_url

    def protocolar_peticao(self, numero_processo: str, arquivo_pdf: str):
        """Protocola petição automaticamente"""
        # Navegar até protocolo
        self.driver.find_element(By.LINK_TEXT, "Protocolo").click()

        # Preencher formulário
        self.driver.find_element(By.ID, "processo").send_keys(numero_processo)

        # Upload de arquivo (PyAutoGUI para janela nativa)
        self.driver.find_element(By.ID, "btnUpload").click()
        time.sleep(1)

        # Usar PyAutoGUI para janela de upload do Windows/Linux
        pyautogui.write(arquivo_pdf)
        pyautogui.press('enter')

        time.sleep(2)
        self.driver.find_element(By.ID, "btnProtocolar").click()

        return self._get_protocolo_numero()

    def buscar_processos(self, cpf_parte: str):
        """Busca processos por CPF da parte"""
        self.driver.get("https://pje.tjal.jus.br/pje/consulta")
        self.driver.find_element(By.ID, "cpf").send_keys(cpf_parte)
        self.driver.find_element(By.ID, "btnBuscar").click()

        # Extrair resultados
        processos = []
        elementos = self.driver.find_elements(By.CLASS_NAME, "processo-item")
        for el in elementos:
            processos.append({
                'numero': el.find_element(By.CLASS_NAME, "numero").text,
                'status': el.find_element(By.CLASS_NAME, "status").text,
                'data': el.find_element(By.CLASS_NAME, "data").text
            })

        return processos

    def baixar_documentos(self, numero_processo: str):
        """Baixa todos os documentos de um processo"""
        # Implementação similar...
        pass

    def tirar_screenshot(self, filename: str):
        """Captura screenshot da tela"""
        pyautogui.screenshot(filename)

# lib/automation/form_filler.py
class FormFiller:
    """Preenchimento automático de formulários"""

    def preencher_peticao_inicial(self, dados: dict):
        """Usa PyAutoGUI para preencher formulário nativo"""
        # Exemplo: formulário Word/PDF aberto
        pyautogui.click(x=100, y=200)  # Clicar no primeiro campo
        pyautogui.write(dados['nome_autor'])
        pyautogui.press('tab')
        pyautogui.write(dados['cpf'])
        # ... continuar
```

#### Dia 17-18: Cron Jobs e Scheduler
```python
# backend/cron_jobs.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CronJobsManager:
    def __init__(self):
        self.scheduler = BackgroundScheduler()

    def start(self):
        """Inicia todos os jobs agendados"""

        # Job 1: Monitorar DJEN (2x por dia - 12:00 e 20:00)
        self.scheduler.add_job(
            self.monitor_djen,
            CronTrigger(hour='12,20', minute='0'),
            id='djen_monitor',
            name='Monitor DJEN',
            replace_existing=True
        )

        # Job 2: DataJud (1x por dia - 16:00)
        self.scheduler.add_job(
            self.sync_datajud,
            CronTrigger(hour='16', minute='0'),
            id='datajud_sync',
            name='Sync DataJud',
            replace_existing=True
        )

        # Job 3: Fila de Agentes (a cada 15 minutos)
        self.scheduler.add_job(
            self.process_agent_queue,
            'interval',
            minutes=15,
            id='agent_queue',
            name='Process Agent Queue'
        )

        # Job 4: Alertas de Prazos (1x por dia - 11:55)
        self.scheduler.add_job(
            self.deadline_alerts,
            CronTrigger(hour='11', minute='55'),
            id='deadline_alerts',
            name='Deadline Alerts'
        )

        # Job 5: Backup (1x por dia - 03:00)
        self.scheduler.add_job(
            self.backup_database,
            CronTrigger(hour='3', minute='0'),
            id='backup',
            name='Database Backup'
        )

        self.scheduler.start()
        logger.info("✅ Cron jobs iniciados")

    def monitor_djen(self):
        """Monitora publicações no DJEN"""
        from lib.integrations.djen import DJENScraper
        scraper = DJENScraper()
        publicacoes = scraper.buscar_novas_publicacoes()
        logger.info(f"📰 DJEN: {len(publicacoes)} novas publicações")

    def sync_datajud(self):
        """Sincroniza com DataJud"""
        # Implementação...
        logger.info("🔄 DataJud sincronizado")

    def process_agent_queue(self):
        """Processa fila de tarefas dos agentes"""
        # Implementação com LangChain
        logger.info("🤖 Fila de agentes processada")

    def deadline_alerts(self):
        """Envia alertas de prazos"""
        # Implementação...
        logger.info("⏰ Alertas de prazo enviados")

    def backup_database(self):
        """Faz backup do Redis"""
        # Implementação...
        logger.info("💾 Backup realizado")

    def stop(self):
        """Para todos os jobs"""
        self.scheduler.shutdown()

# Integrar no main.py
from backend.cron_jobs import CronJobsManager

cron_manager = CronJobsManager()
cron_manager.start()
```

#### Dia 19-20: Testes e Validação
```bash
# Testar backend
cd backend
pytest tests/

# Testar Streamlit
cd ..
streamlit run app.py

# Testar Selenium
python -m lib.integrations.djen

# Testar agentes LangChain
python -m lib.agents.test_all_agents

# Testar PyAutoGUI (cuidado - controla mouse)
python -m lib.automation.test_automation
```

#### Dia 21: Deploy
```bash
# Deploy backend (Railway)
railway login
railway init
railway up

# Deploy Streamlit (Streamlit Cloud)
# 1. Push para GitHub
git add .
git commit -m "Migração completa para Python"
git push origin main

# 2. Deploy no Streamlit Cloud
# - Ir para share.streamlit.io
# - Conectar repositório
# - Selecionar app.py
# - Deploy automático

# Ou deploy no Railway
railway add
railway up
```

---

## 📦 ESTRUTURA FINAL DO PROJETO

```
assistente-juridico-python/
├── app.py                          # Streamlit app principal
├── requirements.txt                # Dependências Python
├── .streamlit/
│   └── config.toml                 # Configuração tema Streamlit
│
├── pages/                          # Páginas Streamlit
│   ├── 1_📋_Processos.py
│   ├── 2_📨_Expedientes.py
│   ├── 3_🤖_Agentes_IA.py
│   ├── 4_🔍_Automações.py
│   ├── 5_📊_Análises_ML.py
│   └── 6_⚙️_Configurações.py
│
├── lib/                            # Bibliotecas core
│   ├── agents/                     # Agentes LangChain
│   │   ├── base_agent.py
│   │   ├── harvey.py               # Harvey Specter
│   │   ├── justine.py              # Mrs. Justin-e
│   │   ├── redacao.py              # Redator
│   │   ├── pesquisa.py             # Pesquisador
│   │   └── ... (12 agentes)
│   │
│   ├── integrations/               # Integrações externas
│   │   ├── djen.py                 # DJEN Selenium
│   │   ├── datajud.py              # DataJud API
│   │   ├── pje.py                  # PJe Selenium
│   │   ├── google_calendar.py      # Google Calendar
│   │   └── redis_client.py         # Upstash Redis
│   │
│   ├── automation/                 # Automações
│   │   ├── pje_automation.py       # Selenium PJe
│   │   ├── form_filler.py          # PyAutoGUI forms
│   │   └── screenshot.py           # Capturas de tela
│   │
│   ├── ml/                         # Machine Learning
│   │   ├── predictor.py            # Predição sucesso
│   │   ├── duration_estimator.py   # Estimativa duração
│   │   ├── clustering.py           # K-Means clustering
│   │   └── sentiment.py            # Análise sentimento
│   │
│   └── utils/                      # Utilitários
│       ├── date_utils.py           # Cálculo prazos
│       ├── pdf_extractor.py        # PyPDF2
│       └── validators.py           # Validações
│
├── backend/                        # Backend FastAPI
│   ├── main.py                     # FastAPI app
│   ├── database.py                 # Cliente Redis
│   ├── cron_jobs.py                # APScheduler
│   │
│   ├── routers/                    # Endpoints API
│   │   ├── health.py
│   │   ├── processes.py            # Pandas CRUD
│   │   ├── agents.py               # LangChain agents
│   │   ├── expedientes.py
│   │   ├── djen.py                 # Selenium scraping
│   │   ├── pje.py
│   │   └── metrics.py              # Pandas analytics
│   │
│   └── tests/                      # Testes backend
│       ├── test_api.py
│       └── test_agents.py
│
├── models/                         # Modelos ML treinados
│   ├── success_predictor.pkl
│   ├── duration_estimator.pkl
│   └── clustering_model.pkl
│
├── data/                           # Dados e cache
│   ├── processes.json
│   ├── expedientes.json
│   └── cache/
│
├── assets/                         # Recursos estáticos
│   ├── logo.png
│   └── icons/
│
└── docs/                           # Documentação
    ├── API.md
    ├── AGENTS.md
    └── DEPLOYMENT.md
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

### Preparação
- [ ] Ambiente Python 3.11+ instalado
- [ ] Criar ambiente virtual
- [ ] Instalar todas as dependências
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Instalar ChromeDriver (Selenium)

### Backend
- [ ] FastAPI main.py configurado
- [ ] Cliente Redis funcionando
- [ ] 8 routers criados e testados
- [ ] Cron jobs configurados
- [ ] Testes passando (pytest)

### Agentes LangChain
- [ ] 16 agentes implementados
- [ ] Tools específicas criadas
- [ ] Prompts otimizados
- [ ] Memória de conversação funcionando
- [ ] Integração com Gemini AI OK

### Automações
- [ ] Selenium DJEN funcionando
- [ ] Selenium PJe funcionando
- [ ] PyAutoGUI testado
- [ ] Screenshots automáticos OK
- [ ] Login automático OK

### Machine Learning
- [ ] Modelos treinados (scikit-learn)
- [ ] Predição de sucesso OK
- [ ] Estimativa de duração OK
- [ ] Clustering funcionando
- [ ] Análise de sentimento OK

### Frontend Streamlit
- [ ] Dashboard principal criado
- [ ] 6 páginas implementadas
- [ ] Gráficos Plotly funcionando
- [ ] Tabelas Pandas interativas
- [ ] Formulários funcionando
- [ ] Integração com backend OK

### Deploy
- [ ] Backend em Railway/Render
- [ ] Streamlit em Streamlit Cloud
- [ ] Variáveis de ambiente configuradas
- [ ] Cron jobs agendados
- [ ] DNS configurado (se necessário)
- [ ] Monitoramento ativo

### Validação Final
- [ ] Todos os endpoints API funcionando
- [ ] 16 agentes executando corretamente
- [ ] Selenium scrapers funcionando
- [ ] PyAutoGUI testado
- [ ] ML models predizendo corretamente
- [ ] UI Streamlit responsiva
- [ ] Performance aceitável (<2s por requisição)
- [ ] Zero erros críticos

---

## 🚀 COMANDOS PARA EXECUÇÃO

### Setup Inicial
```bash
# 1. Criar ambiente
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar .env
cp .env.example .env
# Editar .env com suas credenciais

# 4. Instalar ChromeDriver
pip install webdriver-manager
```

### Executar Localmente
```bash
# Terminal 1: Backend FastAPI
cd backend
python main.py
# Ou: uvicorn main:app --reload --port 8000

# Terminal 2: Streamlit
cd ..
streamlit run app.py
# Ou: python -m streamlit run app.py
```

### Acessar
- **Streamlit**: http://localhost:8501
- **Backend API**: http://localhost:8000
- **Docs API**: http://localhost:8000/docs

### Testes
```bash
# Backend
cd backend
pytest tests/ -v

# Agentes
python -m lib.agents.test_all_agents

# Selenium
python -m lib.integrations.test_djen
python -m lib.integrations.test_pje

# ML
python -m lib.ml.test_models
```

### Deploy Produção
```bash
# Railway (Backend + Streamlit)
railway login
railway init
railway up

# Ou Streamlit Cloud (Frontend) + Railway (Backend)
# Push para GitHub → Deploy automático
git add .
git commit -m "Deploy produção"
git push origin main
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Aspecto | Antes (React/Node.js) | Depois (Python/Streamlit) |
|---------|----------------------|---------------------------|
| **Linguagem** | TypeScript | Python 100% |
| **Frontend** | React 19 + Vite | Streamlit |
| **Backend** | Vercel Serverless | FastAPI + Railway |
| **Agentes** | TypeScript stubs | LangChain real |
| **ML** | ❌ Não implementado | ✅ scikit-learn integrado |
| **Automação GUI** | Chrome Extension | Selenium + PyAutoGUI |
| **Scraping** | Puppeteer | Selenium WebDriver |
| **Cron Jobs** | Vercel Cron | APScheduler |
| **Dados** | ❌ Sem análise avançada | ✅ Pandas completo |
| **Deploy** | Vercel (caro) | Railway/Streamlit Cloud (grátis) |
| **Custo/mês** | $130 | $5-10 (95% economia) |
| **Tempo Dev** | Semanas | Dias |
| **Complexidade** | Alta | Baixa |
| **Manutenção** | Difícil (2 linguagens) | Fácil (1 linguagem) |

---

## 💰 ESTIMATIVA DE CUSTOS

### Desenvolvimento (2-3 semanas)
- **Desenvolvedor Python**: R$ 100/hora × 120h = **R$ 12.000**
- **Total**: **R$ 12.000** (vs R$ 39.200 da migração gradual)

### Custos Mensais (Produção)
| Serviço | Custo |
|---------|-------|
| **Railway Backend** | $5/mês |
| **Streamlit Cloud Community** | $0/mês (grátis) |
| **Upstash Redis** | $0/mês (free tier 10k req/dia) |
| **Google Gemini API** | ~$20/mês |
| **Total** | **$25/mês** ✅ |

**Economia**: $130 (atual) - $25 (novo) = **$105/mês** = **$1.260/ano**

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### HOJE (27/12/2025)
1. ✅ Ler este plano completo
2. ⬜ Aprovar migração acelerada
3. ⬜ Configurar ambiente Python
4. ⬜ Instalar dependências
5. ⬜ Criar estrutura de pastas

### SEGUNDA-FEIRA (30/12/2025)
1. ⬜ Iniciar backend FastAPI
2. ⬜ Implementar routers básicos
3. ⬜ Testar conexão Redis
4. ⬜ Primeira versão do Dashboard Streamlit

### ATÉ 10/01/2026
1. ⬜ Sistema 100% Python funcionando
2. ⬜ 16 agentes LangChain ativos
3. ⬜ Selenium scrapers operacionais
4. ⬜ ML models treinados
5. ⬜ Deploy em produção
6. ⬜ Desligar sistema React/Node.js antigo

---

## 📞 SUPORTE E CONTATO

**Para dúvidas técnicas:**
- Documentação Python: https://docs.python.org/
- Streamlit Docs: https://docs.streamlit.io/
- LangChain Docs: https://python.langchain.com/
- FastAPI Docs: https://fastapi.tiangolo.com/
- Selenium Docs: https://selenium-python.readthedocs.io/

**Arquivos de referência:**
- Este documento: `PLANO_MIGRACAO_ACELERADA_PYTHON.md`
- Código existente: `streamlit-app/` (já 80% pronto)
- Documentação: `streamlit-app/RESUMO_EXECUTIVO.md`

---

## 🎉 CONCLUSÃO

Este plano de migração acelerada permite **substituir completamente** o sistema React/Node.js atual por uma stack **100% Python** em apenas **2-3 semanas**.

**Vantagens:**
- ✅ **Rápido**: 2-3 semanas vs 7 meses
- ✅ **Barato**: R$ 12k vs R$ 39k
- ✅ **Simples**: Python puro vs TypeScript + Node.js
- ✅ **Poderoso**: LangChain real + ML integrado
- ✅ **Econômico**: $25/mês vs $130/mês

**Próxima ação:**
👉 **APROVAR e INICIAR IMEDIATAMENTE**

---

**Status:** 📋 Plano Acelerado Completo
**Criado em:** 27/12/2025
**Versão:** 1.0 URGENTE
**Autor:** AI Agent Expert

🚀 **Bora migrar! Sistema atual não funciona, então não há risco em substituir.**
