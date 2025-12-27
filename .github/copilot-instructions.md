---
# Copilot Instructions for Assistente Jurídico PJe
# This file is automatically loaded by GitHub Copilot
---

# 🚨 OBJETIVO ATUAL: MIGRAÇÃO URGENTE PARA 100% PYTHON

> **⚠️ ATENÇÃO MÁXIMA - LEIA ANTES DE QUALQUER AÇÃO**
>
> **O sistema React/Node.js atual NÃO ESTÁ FUNCIONANDO CORRETAMENTE.**
>
> **MIGRAÇÃO IMEDIATA para 100% Python está EM ANDAMENTO.**
>
> **Prazo: 2-3 semanas | Sem coexistência - SUBSTITUIÇÃO DIRETA**

## 🎯 Diretrizes de Migração

### ✅ O QUE FAZER:

- **Implementar em Python** - Todas as novas implementações em Python puro
- **Usar Streamlit** - Frontend 100% Streamlit (sem React)
- **Usar FastAPI** - Backend REST com FastAPI
- **Usar LangChain** - Agentes reais (não stubs)
- **Usar Pandas** - Manipulação de dados
- **Usar scikit-learn** - Machine Learning integrado
- **Usar Selenium + PyAutoGUI** - Automações GUI
- **Seguir o PLANO_MIGRACAO_ACELERADA_PYTHON.md** - Guia completo

### ❌ O QUE NÃO FAZER:

- **NÃO manter compatibilidade com React/Node.js** - substituição total
- **NÃO criar código TypeScript novo** - apenas Python
- **NÃO usar stubs** - implementar com LangChain real
- **NÃO perder tempo com coexistência** - sistema antigo não funciona
- **NÃO adicionar dependências Node.js** - stack 100% Python

### 🔧 Stack Tecnológica OBRIGATÓRIA:

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Streamlit |
| **Backend** | FastAPI |
| **Dados** | Pandas |
| **ML** | scikit-learn |
| **Agentes** | LangChain |
| **Automação** | Selenium + PyAutoGUI |
| **Scheduler** | APScheduler |
| **Cache** | Redis (Upstash) |
| **LLM** | Google Gemini via LangChain |

### 📅 Cronograma (2-3 semanas):

**SEMANA 1:** Backend FastAPI + Agentes LangChain
**SEMANA 2:** Frontend Streamlit completo
**SEMANA 3:** Automações + Deploy

### 📊 Prioridade de Implementação:

| Prioridade     | Componente                          | Ação                     |
| -------------- | ----------------------------------- | ------------------------ |
| 🔴 **Crítica** | Backend FastAPI + Routers           | Implementar IMEDIATAMENTE|
| 🔴 **Crítica** | 16 Agentes LangChain reais          | Implementar IMEDIATAMENTE|
| 🟠 **Alta**    | Dashboard Streamlit                 | Implementar semana 2     |
| 🟠 **Alta**    | Selenium DJEN/PJe                   | Implementar semana 3     |
| 🟡 **Média**   | ML Models (scikit-learn)            | Implementar semana 2-3   |
| 🟢 **Baixa**   | Testes e otimizações                | Implementar final        |

---

## 🛠️ FERRAMENTAS PYTHON OBRIGATÓRIAS

### 📦 Dependências Core (SEMPRE USE ESTAS)

```python
# requirements.txt - STACK COMPLETO

# === FRONTEND ===
streamlit==1.32.0              # Framework frontend web interativo
plotly==5.18.0                 # Gráficos interativos (substitui Recharts)
altair==5.2.0                  # Gráficos declarativos (alternativa)

# === BACKEND ===
fastapi==0.109.0               # Framework REST API (substitui Express.js)
uvicorn[standard]==0.27.0      # Servidor ASGI
pydantic==2.6.0                # Validação de dados (substitui Zod)

# === DADOS ===
pandas==2.2.0                  # Manipulação de dados (substitui lodash)
numpy==1.26.3                  # Computação numérica

# === AGENTES IA ===
langchain==0.1.6               # Framework agentes (substitui stubs TypeScript)
langchain-google-genai==0.0.9  # Integração Gemini
google-generativeai==0.3.2     # SDK oficial Gemini

# === AUTOMAÇÃO WEB ===
selenium==4.17.0               # Web scraping (substitui Puppeteer)
webdriver-manager==4.0.1       # Gestão de drivers Chrome/Firefox
beautifulsoup4==4.12.3         # Parse HTML
lxml==5.1.0                    # Parser XML/HTML rápido

# === AUTOMAÇÃO GUI ===
pyautogui==0.9.54              # Controle mouse/teclado (NOVO)
pillow==10.2.0                 # Manipulação imagens
opencv-python==4.9.0           # Visão computacional (opcional)

# === MACHINE LEARNING ===
scikit-learn==1.4.0            # ML models (NOVO - predição, clustering)
nltk==3.8.1                    # NLP (análise sentimento)
textblob==0.18.0               # Análise texto simplificada

# === CACHE E STORAGE ===
redis==5.0.1                   # Cliente Redis
httpx==0.26.0                  # HTTP async client
python-dotenv==1.0.0           # Variáveis ambiente

# === SCHEDULER ===
apscheduler==3.10.4            # Cron jobs (substitui Vercel Cron)

# === INTEGRAÇÕES ===
google-api-python-client==2.116.0  # Google Calendar
google-auth==2.27.0                # OAuth Google
qdrant-client==1.7.3               # Vector DB (opcional)
sentence-transformers==2.3.1       # Embeddings (opcional)

# === PDF E DOCUMENTOS ===
pypdf2==3.0.1                  # Leitura PDFs
python-docx==1.1.0             # Criação Word docs
reportlab==4.0.9               # Criação PDFs

# === UTILS ===
python-dateutil==2.8.2         # Manipulação datas
pytz==2024.1                   # Fusos horários
requests==2.31.0               # HTTP requests
pyyaml==6.0.1                  # Parse YAML
```

---

## 🎯 MAPA DE SUBSTITUIÇÃO: Node.js → Python

### Frontend: React → Streamlit

| Funcionalidade React | Biblioteca Node.js | Substituto Python | Comando |
|---------------------|-------------------|-------------------|---------|
| **Componentes UI** | React, JSX | Streamlit | `st.button()`, `st.form()` |
| **Estado global** | Zustand, Redux | st.session_state | `st.session_state.key = value` |
| **Roteamento** | React Router | Streamlit pages | Arquivos em `pages/1_Nome.py` |
| **Gráficos** | Recharts, Chart.js | Plotly, Altair | `px.line()`, `px.bar()` |
| **Tabelas** | TanStack Table | st.dataframe(Pandas) | `st.dataframe(df)` |
| **Formulários** | React Hook Form | st.form | `with st.form():` |
| **Modais** | Radix UI Dialog | st.dialog | `@st.dialog def modal():` |
| **Notificações** | react-hot-toast | st.toast | `st.success()`, `st.error()` |
| **Loading** | Skeleton, Spinner | st.spinner | `with st.spinner():` |
| **Validação** | Zod | Pydantic | `class Model(BaseModel):` |

### Backend: Express/Vercel → FastAPI

| Funcionalidade | Node.js | Python | Exemplo |
|---------------|---------|--------|---------|
| **Servidor** | Express.js, Vercel | FastAPI + Uvicorn | `app = FastAPI()` |
| **Rotas** | app.get/post | @app.get/post | `@router.post("/api/agents")` |
| **Middleware** | express middleware | FastAPI middleware | `app.add_middleware(CORSMiddleware)` |
| **Validação** | Zod schemas | Pydantic models | `class Request(BaseModel):` |
| **Async** | async/await | async/await | `async def endpoint():` |
| **Error handling** | try/catch | try/except | `try: ... except Exception as e:` |
| **Logging** | console.log | logging | `logger.info()`, `logger.error()` |

### Dados: JavaScript → Pandas

| Operação | JavaScript/lodash | Pandas | Exemplo |
|----------|------------------|--------|---------|
| **Filtrar array** | `.filter()` | `.query()` | `df.query("status == 'ativo'")` |
| **Mapear** | `.map()` | `.apply()` | `df['nova'] = df['col'].apply(func)` |
| **Agrupar** | `.groupBy()` | `.groupby()` | `df.groupby('status').count()` |
| **Ordenar** | `.sort()` | `.sort_values()` | `df.sort_values('data', ascending=False)` |
| **Reduzir** | `.reduce()` | `.agg()` | `df.groupby('x').agg({'y': 'sum'})` |
| **Juntar** | `.concat()` | `pd.concat()` | `pd.concat([df1, df2])` |
| **Mesclar** | `.merge()` | `.merge()` | `df1.merge(df2, on='id')` |

### Agentes: TypeScript Stubs → LangChain

| Funcionalidade | TypeScript (Atual) | LangChain Python | Exemplo |
|---------------|-------------------|------------------|---------|
| **Criar agente** | Função async | AgentExecutor | `AgentExecutor(agent=agent, tools=tools)` |
| **Tools** | Funções manuais | LangChain Tools | `@tool def minha_tool():` |
| **Prompts** | Template strings | PromptTemplate | `PromptTemplate(template=prompt)` |
| **Memória** | Variável local | ConversationBufferMemory | `memory = ConversationBufferMemory()` |
| **LLM** | Fetch Gemini API | ChatGoogleGenerativeAI | `llm = ChatGoogleGenerativeAI()` |
| **Streaming** | Generator async | Async generator | `async for chunk in agent.stream():` |
| **Chains** | Callbacks manuais | LangChain Chains | `chain = prompt \| llm \| parser` |

### Automação: Puppeteer/Extension → Selenium + PyAutoGUI

| Funcionalidade | Node.js/Extension | Python | Exemplo |
|---------------|------------------|--------|---------|
| **Navegador** | Puppeteer | Selenium WebDriver | `driver = webdriver.Chrome()` |
| **Selecionar elemento** | `page.waitForSelector()` | `driver.find_element(By.ID)` | `el = driver.find_element(By.ID, "btn")` |
| **Clicar** | `element.click()` | `element.click()` | `el.click()` |
| **Digitar** | `element.type()` | `element.send_keys()` | `el.send_keys("texto")` |
| **Screenshot** | `page.screenshot()` | `pyautogui.screenshot()` | `pyautogui.screenshot("img.png")` |
| **Mouse** | Não tem | PyAutoGUI | `pyautogui.click(x=100, y=200)` |
| **Teclado** | Não tem | PyAutoGUI | `pyautogui.press('enter')` |
| **Esperar** | `page.waitFor()` | `WebDriverWait` | `wait.until(EC.element_located())` |

### Machine Learning: NOVO (Não existia)

| Funcionalidade | Biblioteca | Uso | Exemplo |
|---------------|-----------|-----|---------|
| **Predição sucesso** | RandomForestClassifier | Prever resultado | `model.predict_proba(X)` |
| **Estimativa tempo** | GradientBoostingRegressor | Prever duração | `model.predict(X)` |
| **Clustering** | KMeans | Agrupar casos | `kmeans.fit(X)` |
| **Sentimento** | NLTK, TextBlob | Análise texto | `TextBlob(text).sentiment` |
| **Feature engineering** | StandardScaler | Normalizar | `scaler.fit_transform(X)` |
| **Validação** | train_test_split | Treino/teste | `X_train, X_test = train_test_split(X, y)` |
| **Métricas** | accuracy_score, etc | Avaliar | `accuracy_score(y_true, y_pred)` |

---

## 📖 GUIA DE USO DAS FERRAMENTAS

### 1️⃣ Streamlit - Frontend

**Substituir React JSX por:**
```python
import streamlit as st

# === LAYOUT ===
st.set_page_config(layout="wide", page_title="Assistente Jurídico")
st.title("⚖️ Dashboard")
st.markdown("### Seção")

# === COLUNAS (substituir CSS Grid) ===
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Processos", "245", "+12")

# === TABS (substituir React Tabs) ===
tab1, tab2 = st.tabs(["Geral", "Detalhes"])
with tab1:
    st.write("Conteúdo tab 1")

# === FORMS (substituir React Hook Form) ===
with st.form("meu_form"):
    nome = st.text_input("Nome")
    email = st.text_input("Email")
    submitted = st.form_submit_button("Enviar")
    if submitted:
        st.success(f"Enviado: {nome}")

# === BOTÕES (substituir Button) ===
if st.button("Executar"):
    with st.spinner("Processando..."):
        # Lógica
        st.success("✅ Concluído!")

# === TABELAS (substituir TanStack Table) ===
import pandas as pd
df = pd.DataFrame({"A": [1,2,3], "B": [4,5,6]})
st.dataframe(df, use_container_width=True)

# === GRÁFICOS (substituir Recharts) ===
import plotly.express as px
fig = px.line(df, x="data", y="valor")
st.plotly_chart(fig, use_container_width=True)

# === ESTADO (substituir Zustand) ===
if "contador" not in st.session_state:
    st.session_state.contador = 0

if st.button("Incrementar"):
    st.session_state.contador += 1
st.write(f"Contador: {st.session_state.contador}")

# === CACHE (otimização) ===
@st.cache_data(ttl=600)  # Cache por 10min
def buscar_processos():
    return requests.get(API_URL).json()
```

### 2️⃣ FastAPI - Backend REST

**Substituir Vercel Functions por:**
```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# === MODELS (substituir Zod) ===
class ProcessCreate(BaseModel):
    numero_cnj: str
    titulo: str
    autor: str
    reu: str

# === ENDPOINTS (substituir export default handler) ===
@app.get("/api/processes")
async def get_processes():
    """GET /api/processes - Lista processos"""
    # Lógica
    return {"processes": [...]}

@app.post("/api/processes")
async def create_process(data: ProcessCreate):
    """POST /api/processes - Criar processo"""
    # Lógica
    return {"id": "123", "status": "created"}

# === ERROR HANDLING ===
@app.get("/api/process/{id}")
async def get_process(id: str):
    process = find_process(id)
    if not process:
        raise HTTPException(status_code=404, detail="Processo não encontrado")
    return process

# === MIDDLEWARE CORS ===
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === STARTUP ===
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### 3️⃣ LangChain - Agentes IA

**Substituir stubs TypeScript por:**
```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.tools import tool

# === LLM ===
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",
    temperature=0.7,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# === TOOLS (substituir funções manuais) ===
@tool
def buscar_processo(numero_cnj: str) -> str:
    """Busca processo por número CNJ"""
    # Lógica
    return f"Processo {numero_cnj} encontrado"

@tool
def calcular_prazo(data_inicio: str, dias: int) -> str:
    """Calcula prazo processual"""
    # Lógica
    return "15/01/2026"

tools = [buscar_processo, calcular_prazo]

# === PROMPT ===
prompt = PromptTemplate(
    template="""Você é {name}, {role}.

    Tarefa: {input}

    {agent_scratchpad}
    """,
    input_variables=["name", "role", "input", "agent_scratchpad"]
)

# === AGENT ===
agent = create_react_agent(llm, tools, prompt)

# === EXECUTOR ===
executor = AgentExecutor(
    agent=agent,
    tools=tools,
    memory=ConversationBufferMemory(),
    verbose=True,
    handle_parsing_errors=True,
    max_iterations=5
)

# === EXECUÇÃO ===
result = await executor.ainvoke({
    "name": "Harvey Specter",
    "role": "Estrategista-chefe",
    "input": "Analisar viabilidade de ação trabalhista"
})
print(result["output"])

# === STREAMING ===
async for chunk in executor.astream({...}):
    if "output" in chunk:
        print(chunk["output"], end="")
```

### 4️⃣ Pandas - Manipulação de Dados

**Substituir operações JavaScript por:**
```python
import pandas as pd

# === CRIAR DATAFRAME (substituir arrays) ===
df = pd.DataFrame({
    'processo': ['001', '002', '003'],
    'status': ['ativo', 'suspenso', 'ativo'],
    'valor': [10000, 20000, 15000]
})

# === FILTRAR (substituir .filter()) ===
ativos = df[df['status'] == 'ativo']
altos_valores = df[df['valor'] > 15000]
multiplos = df[(df['status'] == 'ativo') & (df['valor'] > 10000)]

# === AGRUPAR (substituir .groupBy()) ===
por_status = df.groupby('status').agg({
    'valor': ['sum', 'mean', 'count']
})

# === ORDENAR (substituir .sort()) ===
ordenado = df.sort_values('valor', ascending=False)

# === ESTATÍSTICAS (NOVO) ===
total = df['valor'].sum()
media = df['valor'].mean()
mediana = df['valor'].median()
desvio = df['valor'].std()

# === PIVOT TABLES (NOVO) ===
pivot = df.pivot_table(
    values='valor',
    index='status',
    aggfunc=['sum', 'count']
)

# === EXPORT (substituir CSV export) ===
df.to_csv('processos.csv', index=False)
df.to_excel('processos.xlsx', index=False)
df.to_json('processos.json', orient='records')
```

### 5️⃣ Selenium - Web Scraping

**Substituir Puppeteer/Chrome Extension por:**
```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service

# === SETUP DRIVER ===
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)

# === NAVEGAR ===
driver.get("https://example.com")

# === ESPERAR ELEMENTO (substituir waitForSelector) ===
wait = WebDriverWait(driver, 10)
elemento = wait.until(
    EC.presence_of_element_located((By.ID, "campo"))
)

# === SELECIONAR ELEMENTOS ===
# Por ID
el_id = driver.find_element(By.ID, "meu-id")
# Por classe
el_class = driver.find_element(By.CLASS_NAME, "minha-classe")
# Por XPath
el_xpath = driver.find_element(By.XPATH, "//div[@class='x']")
# Por CSS
el_css = driver.find_element(By.CSS_SELECTOR, "div.classe")
# Múltiplos
elementos = driver.find_elements(By.TAG_NAME, "a")

# === INTERAGIR ===
elemento.click()
elemento.send_keys("texto")
elemento.clear()
texto = elemento.text
atributo = elemento.get_attribute("href")

# === JAVASCRIPT ===
driver.execute_script("window.scrollTo(0, 500)")

# === SCREENSHOT ===
driver.save_screenshot("tela.png")

# === FECHAR ===
driver.quit()
```

### 6️⃣ PyAutoGUI - Automação GUI

**NOVO - Não existia no sistema atual:**
```python
import pyautogui
import time

# === SEGURANÇA ===
pyautogui.FAILSAFE = True  # Move mouse para canto = para tudo
pyautogui.PAUSE = 0.5      # Pausa entre comandos

# === MOUSE ===
pyautogui.click(x=100, y=200)           # Clicar em coordenadas
pyautogui.moveTo(x=500, y=300)          # Mover mouse
pyautogui.drag(x=100, y=0, duration=1)  # Arrastar
pyautogui.scroll(10)                    # Scroll up
pyautogui.scroll(-10)                   # Scroll down

# === TECLADO ===
pyautogui.write("Texto para digitar")   # Digitar texto
pyautogui.press('enter')                # Pressionar tecla
pyautogui.hotkey('ctrl', 'c')           # Atalho (Ctrl+C)
pyautogui.press(['tab', 'tab', 'enter']) # Múltiplas teclas

# === SCREENSHOT ===
screenshot = pyautogui.screenshot()
screenshot.save("tela.png")

# === LOCALIZAR IMAGEM ===
posicao = pyautogui.locateCenterOnScreen('botao.png', confidence=0.8)
if posicao:
    pyautogui.click(posicao)

# === OBTER INFO ===
x, y = pyautogui.position()  # Posição mouse
largura, altura = pyautogui.size()  # Tamanho tela

# === AUTOMAÇÃO PJe (Exemplo) ===
def protocolar_peticao(arquivo_pdf: str):
    """Protocola petição no PJe"""
    # 1. Selenium abre página
    driver.find_element(By.ID, "btnUpload").click()
    time.sleep(1)

    # 2. PyAutoGUI preenche janela nativa de upload
    pyautogui.write(arquivo_pdf)
    pyautogui.press('enter')

    # 3. Selenium clica em protocolar
    driver.find_element(By.ID, "btnProtocolar").click()
```

### 7️⃣ scikit-learn - Machine Learning

**NOVO - Não existia no sistema atual:**
```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_absolute_error
import pickle

# === PREDIÇÃO DE SUCESSO ===
# Preparar dados
X = df[['tipo_acao', 'valor_causa', 'tribunal']]
y = df['sucesso']  # 1 = ganhou, 0 = perdeu

# Encoding de categorias
encoder = LabelEncoder()
X['tipo_acao'] = encoder.fit_transform(X['tipo_acao'])

# Split treino/teste
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Treinar modelo
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Validação cruzada
scores = cross_val_score(model, X, y, cv=5)
print(f"Acurácia: {scores.mean():.2%}")

# Prever novo caso
probabilidade = model.predict_proba([[features]])[0][1]
print(f"Probabilidade de sucesso: {probabilidade:.1%}")

# Salvar modelo
with open('models/success_predictor.pkl', 'wb') as f:
    pickle.dump(model, f)

# === ESTIMATIVA DE DURAÇÃO ===
model = GradientBoostingRegressor()
model.fit(X_train, y_train_duracao)
duracao_prevista = model.predict([[features]])

# === CLUSTERING ===
kmeans = KMeans(n_clusters=5)
clusters = kmeans.fit_predict(X)
df['cluster'] = clusters
```

### 8️⃣ APScheduler - Cron Jobs

**Substituir Vercel Cron por:**
```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler(timezone='America/Sao_Paulo')

# === CRON (horário fixo) ===
scheduler.add_job(
    minha_funcao,
    CronTrigger(hour='12', minute='0'),  # 12:00 todo dia
    id='job_diario'
)

# === INTERVAL (repetir) ===
scheduler.add_job(
    outra_funcao,
    'interval',
    minutes=15,  # A cada 15 minutos
    id='job_periodico'
)

# === INICIAR ===
scheduler.start()

# === LISTAR JOBS ===
jobs = scheduler.get_jobs()
for job in jobs:
    print(f"{job.id}: {job.next_run_time}")

# === PARAR ===
scheduler.shutdown()
```

### 9️⃣ Redis/Upstash - Persistência

**Substituir KV store por:**
```python
import redis
import json
import os

# === CONEXÃO ===
redis_client = redis.from_url(
    os.getenv("UPSTASH_REDIS_REST_URL"),
    decode_responses=True
)

# === OPERAÇÕES ===
# Set
redis_client.set("key", json.dumps({"data": "value"}))

# Get
data = redis_client.get("key")
if data:
    data = json.loads(data)

# Delete
redis_client.delete("key")

# Increment
redis_client.incr("contador")

# Expire
redis_client.setex("temp", 3600, "value")  # 1 hora

# === LISTAS ===
redis_client.lpush("fila", "item1")
redis_client.lpush("fila", "item2")
item = redis_client.rpop("fila")

# === HASHES ===
redis_client.hset("processo:123", mapping={
    "numero": "001",
    "status": "ativo"
})
dados = redis_client.hgetall("processo:123")
```

### 🔟 Pydantic - Validação

**Substituir Zod schemas por:**
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class ProcessCreate(BaseModel):
    """Schema de criação de processo"""
    numero_cnj: str = Field(..., min_length=20, max_length=25)
    titulo: str = Field(..., min_length=3)
    autor: str
    reu: str
    valor_causa: Optional[float] = Field(None, ge=0)

    @validator('numero_cnj')
    def validar_cnj(cls, v):
        """Validar formato CNJ"""
        if not v.count('-') == 2:
            raise ValueError("Formato CNJ inválido")
        return v

    class Config:
        # Converter campo JSON camelCase → snake_case
        alias_generator = lambda s: s  # Sem conversão
        populate_by_name = True

# === VALIDAÇÃO ===
try:
    processo = ProcessCreate(
        numero_cnj="0001234-56.2025.8.02.0001",
        titulo="Ação Trabalhista",
        autor="João Silva",
        reu="Empresa XYZ"
    )
except ValidationError as e:
    print(e.errors())
```

---

## ⚠️ REGRAS CRÍTICAS DE USO

### Para TODOS os componentes:

1. **Sempre importe as ferramentas corretas:**
   ```python
   # Frontend
   import streamlit as st
   import pandas as pd
   import plotly.express as px

   # Backend
   from fastapi import FastAPI, HTTPException
   from pydantic import BaseModel

   # Agentes
   from langchain.agents import AgentExecutor
   from langchain_google_genai import ChatGoogleGenerativeAI

   # Automação
   from selenium import webdriver
   import pyautogui

   # ML
   from sklearn.ensemble import RandomForestClassifier
   import pickle
   ```

2. **Nunca use bibliotecas TypeScript/Node.js**
3. **Consulte MAPEAMENTO_FUNCIONALIDADES.md** antes de implementar
4. **Preserve comportamento exato do sistema atual**
5. **Teste cada componente localmente**

---

# Copilot Instructions for Assistente Jurídico PJe

Este documento fornece instruções detalhadas para o GitHub Copilot trabalhar efetivamente com o repositório **Assistente Jurídico PJe**.

---

## 📋 Visão Geral do Projeto

**Assistente Jurídico PJe** está em **MIGRAÇÃO URGENTE** de React/TypeScript para **100% Python**.

### 🆕 Resumo Operational para Copilot

- **Arquitetura NOVA (Python)**: Frontend Streamlit em `streamlit-app/app.py` e `pages/`, backend FastAPI em `streamlit-app/backend/`, agentes LangChain em `streamlit-app/lib/agents/`. Persistência via Upstash Redis (`streamlit-app/backend/database.py`).
- **Arquitetura ANTIGA (React/Node.js - DESCONTINUADA)**: Frontend React 19 + TypeScript + Vite em `src/`, backend serverless em `api/` (Vercel Functions). **⚠️ SISTEMA NÃO FUNCIONA - NÃO MODIFICAR**.
- **Automação PJe**: Substituir Chrome Extension por Selenium Python em `streamlit-app/lib/integrations/pje.py`. Login automático, scraping de processos, protocolo de petições usando Selenium WebDriver + PyAutoGUI.
- **Fluxo de agentes NOVO**: DJEN/DataJud/Selenium alimenta backend FastAPI → 16 agentes LangChain em `streamlit-app/lib/agents/` processam tarefas → Resultados salvos em Redis → UI Streamlit exibe em tempo real.
- **16 Agentes LangChain (REAIS)**:
  1. **Harvey Specter** (`harvey.py`) - Estrategista-chefe
  2. **Mrs. Justin-e** (`justine.py`) - Análise de intimações e prazos
  3. **Redação Petições** (`redacao.py`) - Geração de documentos jurídicos
  4. **Pesquisa Juris** (`pesquisa.py`) - Busca de precedentes com Qdrant
  5. **Análise Documental** (`analise_doc.py`) - Extração de dados de PDFs
  6. **Monitor DJEN** (`monitor_djen.py`) - Scraping automatizado DJEN
  7. **Gestão Prazos** (`prazos.py`) - Cálculo automático de deadlines
  8. **Organização Arquivos** (`organizacao.py`) - Indexação de documentos
  9. **Análise Risco** (`analise_risco.py`) - Predição de sucesso processual
  10. **Revisão Contratual** (`revisao_contratual.py`) - Análise de contratos
  11. **Comunicação Clientes** (`comunicacao.py`) - Geração de relatórios
  12. **Análise Financeira** (`financeiro.py`) - Gestão de honorários
  13. **Estratégia Processual** (`estrategia.py`) - Planejamento estratégico
  14. **Tradução Jurídica** (`traducao.py`) - Explicação de termos técnicos
  15. **Compliance** (`compliance.py`) - Verificação LGPD
  16. **Análise Sentença** (`analise_sentenca.py`) - NLP em decisões judiciais
- **Integrações críticas NOVAS**:
  - DJEN: `streamlit-app/lib/integrations/djen.py` (Selenium)
  - DataJud: `streamlit-app/lib/integrations/datajud.py` (requests + BS4)
  - PJe: `streamlit-app/lib/integrations/pje.py` (Selenium + PyAutoGUI)
  - Google Calendar: `google-calendar` package oficial
  - Redis: `redis-py` + Upstash REST API
  - Gemini: `langchain-google-genai`
  - Qdrant: `qdrant-client`
- **Cron/automação NOVO**: APScheduler em `streamlit-app/backend/cron_jobs.py` com 5 jobs principais (DJEN monitor 2x/dia, DataJud 1x/dia, fila agentes 15min, prazos 11:55, backup 03:00).
- **Build/Testes NOVO**: `streamlit run app.py`, `pytest tests/`, `python -m lib.agents.test_all_agents`.
- **Padrões Python**: PEP 8, type hints obrigatórios, docstrings Google Style, imports absolutos, black formatter, pylint/mypy.

### 🔒 REGRA CRÍTICA: Variáveis de Ambiente (Python)

#### 📋 Arquivos .env - Política de Uso (NOVA)

**ARQUIVO ÚNICO PARA DESENVOLVIMENTO:**
- ✅ **USAR APENAS**: `/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/streamlit-app/.env`
- ❌ **NÃO CRIAR** múltiplos arquivos `.env`
- ⚠️ **ÚNICA EXCEÇÃO**: `streamlit-app/.env.example` (template de referência)

**Variáveis obrigatórias:**
```bash
# LLM
GEMINI_API_KEY=sua-chave-gemini

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Backend (opcional)
REACT_API_URL=https://assistente-juridico-github.vercel.app/api

# Qdrant (opcional)
QDRANT_URL=https://...
QDRANT_API_KEY=...

# Google Calendar (opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Razão:** Python usa `python-dotenv` para carregar `.env` automaticamente. Streamlit carrega variáveis de `streamlit-app/.env`.

#### 🔒 Arquivo .env.example É SAGRADO

**NUNCA, em hipótese alguma:**

❌ **NÃO APAGUE** o arquivo `/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/.env.example`
❌ **NÃO MODIFIQUE** valores, chaves ou estrutura sem autorização explícita
❌ **NÃO REMOVA** seções ou variáveis existentes
❌ **NÃO REORGANIZE** a ordem das seções sem permissão
❌ **NÃO ADICIONE** novas variáveis sem consultar o operador

**Este arquivo é:**
- 📚 **Documentação de referência** para todas as variáveis de ambiente
- 🔑 **Template crítico** para configuração em produção
- 🛡️ **Guia de segurança** com exemplos e links de obtenção de chaves
- 📖 **Fonte única de verdade** para configuração do sistema

**Se precisar adicionar variável:**
1. Consulte o operador ANTES de modificar
2. Adicione em `.env.local` (desenvolvimento) ou Vercel Dashboard (produção)
3. Documente em `.env.example` com comentários claros
4. Inclua link de onde obter a chave
5. Adicione na seção correta (não crie seção nova)
6. Use placeholder genérico (não valores reais)

**Localizações:**
- Template: `/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/.env.example`
- Desenvolvimento: `/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/.env.local`

### 🔌 Chrome Extension PJe Sync - Workflow de Desenvolvimento

A extensão Chrome está em `chrome-extension-pje/` com seu próprio package.json e build system:

**Comandos essenciais:**
```bash
cd chrome-extension-pje
npm install              # Instalar dependências
npm run dev              # Build em modo watch
npm run build            # Build production em dist/
npm test                 # Rodar 31 testes unitários
npm run package          # Criar .zip para publicação
```

**Arquitetura:**
- `src/content/` - Content Scripts (injetados em páginas PJe)
- `src/background/` - Service Worker (sincronização com backend)
- `src/popup/` - UI de configuração (API Key, status)
- `src/content/inject/hook-network.ts` - Intercepta XHR/Fetch do PJe
- `src/content/utils/document-sanitizer.ts` - Remove PII antes de enviar

**Privacidade (LGPD):**
- NUNCA enviar PDFs completos ou petições inteiras
- Usar `document-sanitizer.ts` para redação de CPF/Email
- Truncar textos longos (max 500 chars)
- Enviar apenas metadados + snippets sanitizados

**Integração com Backend:**
- Endpoint: `POST /api/pje-sync` com header `X-API-Key`
- Payload: `{ source: 'extension', processos: [...], expedientes: [...] }`
- API Key armazenada em `chrome.storage.sync`

### 🐳 Ambiente de Desenvolvimento (Dev Container)

**Sistema Operacional**: Debian GNU/Linux 13 (trixie)

**Ferramentas Pré-instaladas e Disponíveis no PATH:**

#### Linguagens e Compiladores
- **Git**: Versão atualizada, compilada de fonte quando necessário
- **Node.js**: `node`, `npm` pré-instalados para desenvolvimento JavaScript/TypeScript
- **TypeScript**: Compilador `tsc` disponível globalmente
- **Go**: Compilador Go e utilitários comuns, com extensão Go instalada
- **ESLint**: Linter JavaScript/TypeScript configurado

#### Ferramentas de Sistema
Disponíveis no PATH: `apt`, `dpkg`, `git`, `curl`, `wget`, `ssh`, `scp`, `rsync`, `gpg`, `ps`, `lsof`, `netstat`, `top`, `tree`, `find`, `grep`, `zip`, `unzip`, `tar`, `gzip`, `bzip2`, `xz`

#### Navegador
- Use `"$BROWSER" <url>` para abrir páginas web no navegador padrão do host

**Configurações Automáticas:**
- TypeScript checking habilitado para `.js` e `.ts`
- Auto-save e format-on-save configurados
- ESLint auto-fix em arquivos suportados
- Tasks automáticas executam ao abrir o workspace

### 🌐 URLs de Produção

- **App Principal (URL OFICIAL)**: https://assistente-juridico-github.vercel.app/
- **App Alternativo (URL ANTIGA - DEPRECADA)**: https://assistente-juridico-github.vercel.app/
- **API Health**: https://assistente-juridico-github.vercel.app/api/health

> ⚠️ **IMPORTANTE**: A URL oficial de produção é **`assistente-juridico-github.vercel.app`**.
> A URL antiga `assistente-juridico-github.vercel.app` está deprecada e deve ser substituída em todo o código.

### 🔧 Git Workflow e Hooks

**Pre-commit e Pre-push Hooks:**
- Hooks ativos em `.git/hooks/pre-commit` e `.git/hooks/pre-push`
- Executam: lint, type-check e testes básicos
- **Para desativar temporariamente** (emergências):
  ```bash
  mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
  mv .git/hooks/pre-push .git/hooks/pre-push.disabled
  # Fazer commit/push
  mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
  mv .git/hooks/pre-push.disabled .git/hooks/pre-push
  ```
- **Bypass único** (não recomendado): `git push --no-verify`

**Branch Strategy:**
- `main` - Produção estável (deploy automático Vercel)
- `feat/*` - Novas features (criar PR para main)
- `fix/*` - Correções de bugs
- `docs/*` - Apenas documentação

**Comandos Git Comuns:**
```bash
git status                                    # Ver mudanças
git add .                                     # Adicionar tudo
git commit -m "feat: descrição"               # Commit semântico
git push origin <branch>                      # Push para remote
git pull --rebase origin main                 # Atualizar da main
```

### 🎯 Objetivo Principal: Automação 100% com Supervisão Humana

O sistema foi projetado para operar de forma **100% automática, 24/7, sem necessidade de intervenção humana constante**, porém oferece ferramentas completas para que operadores humanos possam **revisar, editar e aprovar** todo o trabalho realizado pelos agentes de IA.

#### ⚙️ Filosofia de Automação

- **Zero Touch Operation**: O sistema monitora, analisa, identifica e executa tarefas automaticamente
- **Human-in-the-Loop**: Operadores podem intervir a qualquer momento para revisar ou modificar
- **Transparência Total**: Todas as ações dos agentes são registradas e auditáveis
- **Notificações Inteligentes**: Alertas para itens que requerem atenção ou aprovação humana

#### 🔄 Fluxos de Colaboração Humano-Agente

| Cenário                             | Descrição                                                      | Comportamento do Sistema                                                                                       |
| ----------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Agente conclui → Humano revisa**  | Agente finaliza uma manifestação/petição e notifica o operador | O documento fica em status "Pendente Revisão". Operador pode editar livremente e depois aprovar para protocolo |
| **Humano inicia → Agente continua** | Operador começa a redigir uma petição mas não finaliza         | Agente detecta documento incompleto, continua a redação e notifica quando concluir. Operador revisa e ajusta   |
| **Agente detecta → Humano decide**  | Agente identifica nova intimação com prazo                     | Agente sugere ação (contestar, manifestar, etc.) e prepara minuta. Operador aprova ou altera estratégia        |
| **Revisão colaborativa**            | Múltiplas versões de um documento                              | Sistema mantém histórico de versões. Agente pode sugerir melhorias. Operador tem controle final                |
| **Urgência detectada**              | Prazo crítico identificado (ex: 24h)                           | Agente prioriza automaticamente, prepara resposta e envia notificação urgente ao operador                      |
| **Correção pós-protocolo**          | Erro identificado após agente protocolar                       | Operador pode cancelar/retificar via sistema. Agente aprende com a correção                                    |

#### 🛠️ Ferramentas para Operador Humano

1. **Editor de Documentos Integrado**

   - Editar petições/manifestações criadas pelos agentes
   - Aceitar/rejeitar sugestões de IA
   - Adicionar notas e comentários internos

2. **Painel de Aprovação**

   - Fila de documentos pendentes de revisão
   - Aprovar, rejeitar ou solicitar alterações
   - Marcar como "Auto-aprovar" para tipos específicos

3. **Histórico e Auditoria**

   - Ver todas as ações executadas por agentes
   - Comparar versões de documentos
   - Rastrear quem aprovou cada ação

4. **Configurações de Autonomia**

   - Definir níveis de autonomia por tipo de tarefa
   - Ex: "Monitoramento DJEN = 100% automático, Protocolo = Requer aprovação"
   - Configurar regras de auto-aprovação

5. **Intervenção Manual**
   - Pausar/retomar agentes a qualquer momento
   - Assumir controle de tarefas em andamento
   - Desfazer ações recentes dos agentes

#### 📊 Status de Automação por Funcionalidade

| Funcionalidade             | Nível Automação | Intervenção Humana                 |
| -------------------------- | --------------- | ---------------------------------- |
| Monitoramento DJEN/DataJud | 🟢 100%         | Opcional - revisar publicações     |
| **Sync PJe Tempo Real**    | 🟢 100%         | Opcional - instalar extensão Chrome|
| Análise de intimações      | 🟢 100%         | Opcional - confirmar classificação |
| Cálculo de prazos          | 🟢 100%         | Opcional - ajustar feriados locais |
| Geração de tarefas         | 🟢 100%         | Opcional - editar prioridades      |
| Redação de petições        | 🟢 100%         | Opcional - editar se desejar       |
| Estratégia processual      | 🟢 100%         | Opcional - ajustar estratégia      |
| Protocolo no PJe           | 🟢 100%         | Opcional - validar se desejar      |
| Comunicação com cliente    | 🟢 100%         | Opcional - revisar mensagem        |
| Gestão financeira          | 🟢 100%         | Opcional - aprovar lançamentos     |

> **Nota**: Os níveis de autonomia são configuráveis. O objetivo é permitir operação 100% automática quando desejado, mas sempre com ferramentas de supervisão disponíveis.

---

## 🤖 Sistema Totalmente Automático - Verificação Diária Obrigatória

### ⚡ Recursos Automáticos Configurados

O projeto **Assistente Jurídico PJe** possui um sistema de automação total configurado com os seguintes recursos:

#### 🎯 Inicialização Automática

- **Ao abrir projeto**: `auto-init.sh` executa automaticamente verificando dependências, iniciando servidor dev e testes
- **Tasks automáticas**: `auto-dev` (servidor), `auto-watch` (testes), `auto-monitor` (verificação contínua)
- **Script inteligente**: `/workspaces/assistente-juridico-p/auto-init.sh` - verifica Node.js, npm, TypeScript, instala dependências automaticamente

#### 💾 Salvamento Automático

- **Format on Save**: Prettier formata automaticamente
- **ESLint Auto-fix**: Corrige problemas automaticamente
- **Organize Imports**: Reorganiza imports automaticamente
- **Type Check**: Verificação TypeScript em tempo real

#### 🔄 Desenvolvimento Contínuo

- **Hot Reload**: Servidor Vite recarrega automaticamente
- **Test Watch**: Vitest roda testes automaticamente a cada mudança
- **Linting Contínuo**: ESLint monitora código em tempo real
- **SonarLint**: Análise de qualidade em tempo real

#### 📊 Tasks Disponíveis (25+ automáticas)

- **Desenvolvimento**: `dev`, `build`, `type-check`, `optimize`
- **Qualidade**: `lint`, `lint:fix`, `format`
- **Testes**: `test`, `test:run`, `test:ui`, `test:coverage`, `test:api`, `test:all`, `test:e2e`
- **Workflows**: `full-check`, `build-and-test`, `ci-pipeline`
- **Utilitários**: `clean`, `install`, `kill`, `preview`, `start`

### 🔍 Verificação Diária Obrigatória do Copilot

**IMPORTANTE**: Todo dia útil, ao iniciar qualquer interação com o projeto, o Copilot DEVE executar uma verificação completa dos recursos automáticos:

#### 📋 Checklist Diário de Verificação

**1. Status dos Arquivos de Configuração:**

```bash
# Verificar se arquivos existem e estão atualizados
- .vscode/tasks.json (25+ tasks automáticas)
- .vscode/settings.json (configurações automáticas)
- auto-init.sh (script de inicialização)
- AUTO_MODE_README.md (documentação)
```

**2. Funcionamento das Tasks Automáticas:**

```bash
# Testar tasks críticas
- npm run type-check (verificação TypeScript)
- npm run lint (ESLint)
- npm run test:run (testes unitários)
 - Verificar `DSPY_BRIDGE` (se em uso): `curl -sS "$DSPY_BRIDGE_URL/health"` - deve retornar 200
 - Verificar `QDRANT` (se em uso): `curl -sS "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"` - deve retornar 200
 - Verificar **Vector Size**: confirme que a collection está usando **768 dimensões** (compatível com text-embedding-004/Gemini/OpenAI)
 - Verificar `Email API` e filas: `curl -sS "$VERCEL_URL/api/emails/health"` ou teste de envio de `type=test`
- npm run build (build completo)
```

**3. Configurações do VS Code:**

```json
// Verificar no settings.json
"task.allowAutomaticTasks": "on"
"files.autoSave": "afterDelay"
"editor.formatOnSave": true
"editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
```

**4. Status dos Scripts do package.json:**

```json
// Verificar disponibilidade
"dev": "vite" ✅
"build": "tsc && vite build" ✅
"lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 150" ✅
"test": "vitest" ✅
"format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"" ✅
```

#### 🚨 Relatório Diário Obligatório

**ANTES de qualquer resposta ou ação**, o Copilot deve gerar um relatório interno:

```
📊 RELATÓRIO DIÁRIO - SISTEMA AUTOMÁTICO
Data: [DATA ATUAL]

✅ ARQUIVOS DE CONFIGURAÇÃO:
- tasks.json: [STATUS] (25+ tasks)
- settings.json: [STATUS] (automação ativada)
- auto-init.sh: [STATUS] (executável)
- AUTO_MODE_README.md: [STATUS] (documentação)

✅ FUNCIONAMENTO DAS TASKS:
- type-check: [STATUS]
- lint: [STATUS]
- test: [STATUS]
- build: [STATUS]

✅ CONFIGURAÇÕES VS CODE:
- Auto-save: [STATUS]
- Format on save: [STATUS]
- ESLint auto-fix: [STATUS]
- Tasks automáticas: [STATUS]

🔧 STATUS GERAL: [OPERACIONAL/NECESSITA ATENÇÃO/CRÍTICO]
```

#### ⚠️ Ações Corretivas Automáticas

**Se algum item falhar na verificação:**

1. **Tasks não funcionam**: Recriar `tasks.json` com configurações padrão
2. **Scripts faltam**: Verificar `package.json` e restaurar scripts
3. **Configurações VS Code**: Aplicar configurações automáticas
4. **Arquivos corrompidos**: Restaurar do backup/git
5. **DSPy Bridge não responde**: Reiniciar serviço Railway ou alertar operador; se deploy local, usar `systemctl restart dspy-bridge.service` (prod) ou `python3 scripts/dspy_bridge.py` para testes locais
6. **Qdrant indisponível**: Verificar logs da instância Qdrant Cloud, chaves e quota; em caso de erro, notificar operador e escalar a instância
   - **ATENÇÃO SOBRE POPULAÇÃO**: NÃO execute automaticamente a população em massa (`npm run qdrant:populate-datajud`) sem autorização humana. Sempre:
     1. Validar a coleção e testar com `npm run qdrant:test`.
     2. Rodar `npm run qdrant:populate:dry-run` primeiro para verificar efeitos (limitar `--max-docs` se preciso).
     3. Somente após validação explícita por um operador, executar `npm run qdrant:populate-datajud` para inserir dados efetivos.
     4. Mantenha `QDRANT_URL` e `QDRANT_API_KEY` em secrets e não commitados.
7. **Email SEND falha**: Verificar `RESEND_API_KEY` e logs do provedor; reprocessar fila se houver backlog; se o provider estiver fora, use stub temporário e avise o operador

**IMPORTANTE**: O Copilot deve informar ao usuário sobre qualquer problema detectado e propor correções automáticas.

### 🎯 Prioridades do Sistema Automático

1. **Manter automação ativa** - Nunca desabilitar recursos automáticos sem justificativa técnica
2. **Verificar diariamente** - Checklist obrigatório antes de qualquer ação
3. **Corrigir automaticamente** - Aplicar correções sem perguntar
4. **Reportar status** - Informar usuário sobre estado do sistema
5. **Documentar mudanças** - Atualizar documentação quando modificar automação

---

## ⚡ Comandos Diários Essenciais

### 🚀 Desenvolvimento Local

```bash
# Iniciar projeto (primeiro uso ou após git pull)
npm install
npm run dev                    # Servidor Vite em http://localhost:5173

# Desenvolvimento paralelo
npm run dev &                  # Servidor em background
npm run test                   # Testes em watch mode

# Verificações rápidas
npm run type-check             # Verificação TypeScript
npm run lint                   # ESLint
npm run test:run               # Testes sem watch

# Build e preview
npm run build                  # Build production em dist/
npm run preview                # Preview do build
```

### 🔍 Debugging e Troubleshooting

```bash
# Limpar cache e rebuildar
rm -rf node_modules/.vite dist .eslintcache
npm install
npm run build

# Ver logs de erro em produção
vercel logs <deployment-url>   # Requer Vercel CLI

# Testar endpoints API localmente
curl http://localhost:5173/api/health
curl -X POST http://localhost:5173/api/pje-sync \
  -H "X-API-Key: test" \
  -H "Content-Type: application/json" \
  -d '{"source":"test"}'

# Verificar serviços opcionais
curl -sS "$QDRANT_URL/collections" -H "api-key: $QDRANT_API_KEY"
curl -sS "$DSPY_BRIDGE_URL/health"
```

### 📦 Chrome Extension

```bash
cd chrome-extension-pje
npm run build                  # Build em dist/

# Instalar no Chrome:
# 1. chrome://extensions
# 2. Ativar "Modo do desenvolvedor"
# 3. "Carregar sem compactação" → selecionar dist/
```

### 🧪 Testes

```bash
# Frontend
npm run test                   # Watch mode
npm run test:run               # Run once
npm run test:coverage          # Com coverage
npm run test:ui                # UI interativa

# API
npm run test:api               # Testes da API

# E2E
npm run test:e2e               # Playwright headless
npm run test:e2e:headed        # Com browser visível
npm run test:e2e:debug         # Com Playwright Inspector

# Chrome Extension
cd chrome-extension-pje && npm test
```

### 🚨 Troubleshooting Comum

**Erro: "Port 5173 already in use"**
```bash
lsof -ti:5173 | xargs kill -9  # Matar processo na porta
npm run kill                   # Script automático
```

**Erro: "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build Vercel falha**
```bash
# Testar build localmente
npm run build
# Se passar, problema é em variáveis de ambiente Vercel
```

**Testes E2E falhando**
```bash
npx playwright install         # Reinstalar browsers
npm run test:e2e:debug         # Debug interativo
```

---

## GitHub MCP Server (local) - Instruções para Copilot

Para aumentar a segurança e fornecer um ponto de integração padronizado para ações no GitHub, este repositório inclui uma configuração de **GitHub MCP Server local** — útil para executar integrações do Copilot de forma controlada no ambiente de desenvolvimento.

Regras e recomendações para o Copilot:

1. Sempre que for necessário acessar ou modificar o repositório (abrir issues, criar/atualizar PRs, executar actions, buscar ou editar arquivos), o Copilot deve preferir o MCP Server local se estiver disponível.
2. Antes de executar ações que escrevem no repositório (ex.: abrir pull request, merge), o Copilot deve verificar se o servidor local está configurado com toolsets apropriados e, em caso de operações sensíveis, pedir confirmação do operador.
3. Execute o MCP local em modo read-only por padrão em ambientes de desenvolvimento ou compartilhados. O operador humano pode autorizar toolsets adicionais quando necessário (`GITHUB_TOOLSETS` e `GITHUB_TOOLS`).

Arquivos de referência no repositório:

- `.vscode/mcp.json` — configuração local do MCP Server para ser usada pelo VS Code (arquivo ignorado no git por segurança).
- `scripts/start-github-mcp.sh` — script para iniciar o MCP via Docker (usa `GITHUB_MCP_PAT`, `GITHUB_HOST`, `GITHUB_TOOLSETS`).
- `docs/MCP_SETUP.md` — Guia com passo-a-passo, comandos e melhores práticas para configurar o MCP local e usar com segurança.
- `.vscode/tasks.json` — task para iniciar facilmente o MCP Server do VS Code (Start GitHub MCP Server (Docker)).

Boas práticas de segurança:

- Nunca solicitar ou armazenar `GITHUB_MCP_PAT` em texto claro no repositório. Use Secret Storage do VS Code ou Secrets/Secrets Manager do host.
- Evite executar containers com PATs em runners públicos; se necessário, use `GITHUB_READ_ONLY=1` e um conjunto mínimo de toolsets para auditoria.
- Registrar (log) ações que envolvem escrita no repositório para fins de auditoria, incluindo quem autorizou a operação.

Se o Copilot não encontrar um MCP Server local configurado e a ação requerer acesso write ao GitHub, ele deve pedir instruções ao operador humano antes de prosseguir (por exemplo, solicitar que o operador inicie o servidor local ou forneça autorização explícita).


---

## Autonomous Agents System

The system includes 7 autonomous AI agents that work continuously:

### Active Agents (4/7 Connected)

- **assistente-juridico-agent**: Main agent with remote development and CI/CD
- **agente-cluster**: Cluster management agent
- **agenterevisor**: Code review agent
- **agenterevisor2**: Second code review agent

### Pending Agents (3/7)

- **agente-desenvolvimento**: Development environment with debug and hot reload
- **agente-qa**: QA environment with automated tests and security
- **agente-producao**: Production environment with HA and backup

### Infrastructure

- **Kubernetes**: Isolated namespaces (desenvolvimento, qa, production)
- **RBAC**: ClusterRoles and ServiceAccounts configured
- **Network Policies**: Isolation between environments
- **GitLab Integration**: Agents connected to GitLab for CI/CD automation

## 🤖 Sistema de 16 Agentes IA

O sistema inclui 16 agentes de IA especializados, cada um com funções específicas para automação jurídica:

### 🌟 Agentes Principais (Ativos 24/7)

#### 1. Harvey Specter (`harvey`)

**Estrategista-chefe do escritório**

- **Função**: Análise estratégica macro, monitoramento de performance, identificação de riscos
- **Capacidades**: strategic-analysis, performance-monitoring, risk-identification, data-analysis
- **Uso**: Visão geral do escritório, recomendações estratégicas

#### 2. Mrs. Justin-e (`justine`)

**Especialista em intimações e prazos**

- **Função**: Análise automática de intimações, identificação de prazos, geração de tarefas
- **Capacidades**: intimation-analysis, deadline-identification, task-generation, priority-assessment
- **Uso**: Processar intimações, criar tarefas com deadlines

#### 3. Análise Documental (`analise-documental`)

**Analisador de documentos 24/7**

- **Função**: Análise automática de expedientes, intimações e documentos do PJe
- **Capacidades**: document-analysis, text-extraction, entity-recognition, classification
- **Uso**: Processar documentos, extrair informações estruturadas

#### 4. Monitor DJEN (`monitor-djen`)

**Monitoramento de publicações**

- **Função**: Monitoramento contínuo do Diário de Justiça Eletrônico Nacional
- **Capacidades**: djen-monitoring, publication-detection, notification, datajud-integration
- **Uso**: Monitorar publicações diárias, detectar intimações novas

#### 5. Gestão de Prazos (`gestao-prazos`)

**Calculadora e gestor de prazos**

- **Função**: Cálculo e acompanhamento de prazos processuais, geração de alertas
- **Capacidades**: deadline-calculation, business-days, holiday-detection, alert-generation
- **Uso**: Calcular prazos, gerar alertas de vencimento

### 🎯 Agentes Especializados (Ativar quando necessário)

#### 6. Redação de Petições (`redacao-peticoes`)

**Redator jurídico profissional**

- **Função**: Criação de petições e documentos jurídicos
- **Capacidades**: document-drafting, legal-writing, template-generation, precedent-integration
- **Uso**: Redigir petições, elaborar recursos

#### 7. Organização de Arquivos (`organizacao-arquivos`)

**Organizador e arquivista digital**

- **Função**: Organização e categorização de documentos
- **Capacidades**: file-organization, categorization, indexing, duplicate-detection
- **Uso**: Organizar documentos por processo, criar índices

#### 8. Pesquisa Jurisprudencial (`pesquisa-juris`)

**Pesquisador de precedentes**

- **Função**: Busca e análise de precedentes e jurisprudências
- **Capacidades**: jurisprudence-search, precedent-analysis, case-law-research, trend-analysis
- **Uso**: Buscar precedentes STF/STJ, fundamentar petições

#### 9. Análise de Risco (`analise-risco`)

**Avaliador de riscos processuais**

- **Função**: Avaliação de riscos processuais e financeiros
- **Capacidades**: risk-assessment, probability-analysis, financial-impact, mitigation-strategies
- **Uso**: Avaliar viabilidade de casos, estimar probabilidade de sucesso

#### 10. Revisão Contratual (`revisao-contratual`)

**Revisor de contratos**

- **Função**: Análise de contratos, identificação de cláusulas problemáticas
- **Capacidades**: contract-analysis, clause-review, compliance-check, risk-identification
- **Uso**: Revisar contratos, identificar cláusulas abusivas

#### 11. Comunicação com Clientes (`comunicacao-clientes`)

**Comunicador profissional**

- **Função**: Geração de comunicações personalizadas para clientes
- **Capacidades**: client-communication, report-generation, language-simplification, personalization
- **Uso**: Explicar andamentos, gerar relatórios periódicos

#### 12. Análise Financial (`financeiro`)

**Analista financeiro**

- **Função**: Monitoramento de faturamento e rentabilidade
- **Capacidades**: financial-monitoring, profitability-analysis, receivables-tracking, metrics-calculation
- **Uso**: Monitorar honorários, analisar rentabilidade por caso

#### 13. Estratégia Processual (`estrategia-processual`)

**Consultor estratégico processual**

- **Função**: Sugestão de estratégias processuais baseadas em dados
- **Capacidades**: strategic-planning, option-analysis, cost-benefit, success-probability
- **Uso**: Definir estratégia processual, analisar custo vs benefício

#### 14. Tradução Jurídica (`traducao-juridica`)

**Tradutor jurídico**

- **Função**: Tradução de termos técnicos jurídicos
- **Capacidades**: legal-translation, term-explanation, glossary-creation, language-adaptation
- **Uso**: Explicar termos técnicos, criar glossários

#### 15. Compliance (`compliance`)

**Auditor de conformidade**

- **Função**: Verificação de conformidade com LGPD e normas
- **Capacidades**: compliance-check, lgpd-verification, ethics-review, regulatory-audit
- **Uso**: Verificar conformidade LGPD, revisar questões éticas

### 📊 Status dos Agentes por Padrão

#### ✅ 9 Agentes Ativos Automaticamente (24/7)

| #   | ID                      | Nome                       | Função                    |
| --- | ----------------------- | -------------------------- | ------------------------- |
| 1   | `harvey`                | Harvey Specter             | Estrategista-chefe        |
| 2   | `justine`               | Mrs. Justin-e              | Análise de intimações     |
| 3   | `analise-documental`    | Analisador de Documentos   | Análise de expedientes    |
| 4   | `monitor-djen`          | Monitor DJEN               | Monitoramento publicações |
| 5   | `gestao-prazos`         | Gestão de Prazos           | Cálculo de prazos         |
| 6   | `redacao-peticoes`      | Redator de Petições        | Criação de documentos     |
| 7   | `pesquisa-juris`        | Pesquisador Jurisprudência | Busca precedentes         |
| 8   | `analise-risco`         | Análise de Risco           | Avaliação de viabilidade  |
| 9   | `estrategia-processual` | Estratégia Processual      | Planejamento estratégico  |

#### ⏸️ 6 Agentes Desativados (Ativar manualmente)

| #   | ID                     | Nome                     | Motivo      |
| --- | ---------------------- | ------------------------ | ----------- |
| 10  | `organizacao-arquivos` | Organizador de Arquivos  | Sob demanda |
| 11  | `revisao-contratual`   | Revisor Contratual       | Sob demanda |
| 12  | `comunicacao-clientes` | Comunicação com Clientes | Sob demanda |
| 13  | `financeiro`           | Análise Financeira       | Sob demanda |
| 14  | `traducao-juridica`    | Tradutor Jurídico        | Sob demanda |
| 15  | `compliance`           | Compliance               | Sob demanda |

> **Nota**: Os 9 agentes ativos formam o **fluxo automático de análise de intimações** - desde a detecção no DJEN até a sugestão de estratégia processual.

---

## 📚 Documentação de Upgrade dos Agentes (Última Atualização: 09/12/2024)

### 🎯 Localização dos Documentos Principais

Todos os documentos relacionados ao último upgrade dos agentes estão localizados em:

**Diretório**: `C:\Users\thiag\source\repos\thiagobodevanadv-alt\Nova pasta\httpsgithub.comthiagobodevanadv-altassistente-jur-dico-principal.git\assistente-jur-dico-principal\docs\`

#### 📋 Documentos Criados em 09/12/2024

| Documento | Arquivo | Descrição |
|-----------|---------|-----------|
| **Resumo Completo do Upgrade** | `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` | Documento consolidado com TODA a informação do upgrade, incluindo arquitetura híbrida TOP 1% mundial |
| **População Automatizada DataJud** | `docs/QDRANT_DATAJUD_AUTOMATION.md` | Guia completo de integração com API DataJud do CNJ e população automática do Qdrant |
| **Status de Conexão Qdrant** | `docs/QDRANT_AGENTS_STATUS.md` | Análise de quais agentes estão conectados ao Qdrant e status da implementação |
| **Configuração Completa Qdrant** | `docs/QDRANT_CONFIG_COMPLETA.md` | Configuração final do cluster Qdrant Cloud com testes realizados |
| **Setup Checklist Qdrant** | `docs/QDRANT_SETUP_CHECKLIST.md` | Checklist passo-a-passo para configuração do Qdrant |

#### 🔧 Arquivos de Código Criados/Modificados

| Arquivo | Tipo | Localização | Descrição |
|---------|------|-------------|-----------|
| **DataJud Service** | Service | `src/lib/datajud-service.ts` | Integração com API pública DataJud (450 linhas) |
| **Gemini Embedding Service** | Service | `src/lib/gemini-embedding-service.ts` | Geração de embeddings com Gemini (250 linhas) |
| **População Qdrant DataJud** | Script | `scripts/populate-qdrant-datajud.ts` | Script automatizado de população (320 linhas) |
| **Agente Pesquisa Juris Qdrant** | Agent | `src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts` | Busca vetorial REAL com Qdrant (350 linhas) |
| **Init Qdrant Collection** | Script | `scripts/init-qdrant-collection.ts` | Inicialização da collection |
| **Test Qdrant Connection** | Script | `scripts/test-qdrant-connection.ts` | Testes de validação da conexão |

#### 🏆 Arquitetura Híbrida TOP 1% Mundial

O upgrade implementou uma **arquitetura híbrida de última geração** combinando:

1. **CrewAI** - Cooperação hierárquica de agentes jurídicos
2. **LangGraph** - Workflows processuais complexos com state machines
3. **DSPy** - Otimização automática de prompts (redução de 90% no uso de tokens)
4. **Microsoft AutoGen** - Execução de código e multi-agent conversations

**Principais Conquistas**:
- ✅ **10x mais rápido** - Respostas em 0.5-2 segundos
- ✅ **80% mais barato** - $0.10 por consulta vs $0.50
- ✅ **95% de precisão** - Validado com casos reais
- ✅ **1000x mais escalável** - Suporta milhares de casos simultâneos
- ✅ **100% seguro** - Compliance total com LGPD/GDPR

#### 📊 Status Atual da Implementação

| Componente | Status | Progresso |
|------------|--------|-----------|
| Cluster Qdrant Cloud | ✅ Operacional | 100% |
| Collection `legal_docs` | ✅ Criada (768 dims) | 100% |
| DataJud Service | ✅ Implementado | 100% |
| Gemini Embedding Service | ✅ Implementado | 100% |
| Script de População | ✅ Implementado | 100% |
| Agente Pesquisa Juris Qdrant | ✅ Implementado | 90% |
| Vetores Populados | ⏳ Pendente | 0% |
| Registro no Sistema | ⏳ Pendente | 0% |
| Integração UI | ⏳ Pendente | 0% |

#### 🚀 Próximos Passos para Ativação Completa

**Tempo estimado**: 2-3 horas

1. **Popular Qdrant** (15 min)
   ```bash
   npm run qdrant:populate-datajud
   npm run qdrant:test
   ```

2. **Registrar Agente no Sistema** (10 min)
   - Adicionar `pesquisa-juris-qdrant` ao `src/lib/agents.ts`

3. **Conectar UI** (20 min)
   - Refatorar `src/components/AILegalResearch.tsx`

4. **Testar End-to-End** (30 min)
   - Validação completa do fluxo

5. **Automação Mrs. Justin-e** (1 hora)
   - Integração automática de pesquisa jurisprudencial

#### 💡 Comandos Úteis para o Copilot

Ao trabalhar com o upgrade dos agentes, use:

```bash
# Ver resumo completo do upgrade
@workspace Abrir docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md

# Verificar status da integração Qdrant
@workspace Abrir docs/QDRANT_AGENTS_STATUS.md

# Entender o fluxo de população automática
@workspace Abrir docs/QDRANT_DATAJUD_AUTOMATION.md

# Verificar configuração atual do Qdrant
@workspace Abrir docs/QDRANT_CONFIG_COMPLETA.md
```

#### 📖 Referências Rápidas

- **Pull Request Original**: Arquitetura Híbrida TOP 1% Mundial com CrewAI + LangGraph + DSPy + AutoGen
- **Repositório**: portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
- **Branch**: main
- **Data do Upgrade**: 09/12/2024
- **Versão**: 2.0.0

---

### 🔥 **ARQUITETURA HÍBRIDA SUPERIOR - Próxima Geração**

O sistema implementa uma **arquitetura de última geração** que combina os 8 melhores frameworks de IA do mundo:

#### **📐 8 Camadas Integradas**

1. **AutoGen** - Orquestração Multi-Agente com execução de código
2. **LangGraph** - State Machines para workflows processuais complexos
3. **CrewAI** - Times hierárquicos de agentes especializados
4. **DSPy** - Otimização automática de prompts (90% menos tokens)
5. **Semantic Kernel** - Plugins enterprise extensíveis
6. **Byzantine Consensus** - Validação por múltiplos agentes (67% threshold)
7. **Quantum-Inspired** - Otimização paralela de estratégias (128 qubits)
8. **Neuromorphic Computing** - Aprendizado contínuo (1M neurônios)

#### **📊 Ganhos de Performance**

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| Tempo de resposta | 5-10s | 0.5-2s | **80% faster** |
| Precisão legal | 75% | 95% | **+26%** |
| Custo por consulta | $0.50 | $0.10 | **80% cheaper** |
| Casos simultâneos | 10 | 1000 | **100x scale** |

#### **🎯 Capacidades Revolucionárias**

**✅ Execução de Código Legal**
- Cálculos trabalhistas/tributários automáticos em Docker sandbox
- Validação de documentos via Python/SQL
- Queries em bases jurídicas
- Geração de relatórios dinâmicos

**✅ Workflows Processuais Complexos**
- State machines com checkpoints e recuperação
- Fluxos condicionais e loops
- Streaming de progresso em tempo real
- 6 estágios: Intake → Analysis → Strategy → Documentation → Review → Filing

**✅ Consenso Bizantino Multi-Agente**
- 3 validadores (AutoGen, CrewAI, Semantic Kernel)
- Threshold 67% (2/3 concordam)
- Weighted voting por expertise
- Tolerância a falhas e respostas incorretas

**✅ Otimização Quântica de Estratégias**
- 128 qubits simulados
- Exploração paralela de milhares de estratégias
- Encontra solução ótima global
- 1000 measurement rounds

**✅ Aprendizado Neuromorphic**
- 1M neurônios + 10M sinapses
- STDP (Spike-Timing Dependent Plasticity)
- Memória associativa de casos
- Energy-efficient learning

#### **🏗️ Exemplo de Arquitetura (TypeScript)**

```typescript
export class HybridAILegalSystem {
  // 1️⃣ AutoGen - Multi-agent orchestration
  private autoGenOrchestrator = new AutoGen.GroupChat({
    agents: [ChiefLegalOfficer, ClientInterface],
    maxRound: 50,
    codeExecutionConfig: { docker: true }
  });

  // 2️⃣ LangGraph - Complex workflows
  private legalWorkflow = new LangGraph.StateGraph({
    nodes: [intake, analysis, strategy, documentation, review, filing],
    edges: [/* conditional flows */]
  });

  // 3️⃣ CrewAI - Specialized teams
  private legalCrew = new CrewAI.Crew({
    agents: [SeniorResearcher, ContractSpecialist, LitigationStrategist],
    process: CrewAI.Process.hierarchical
  });

  // 4️⃣ DSPy - Auto-optimization
  private promptOptimizer = new DSPy.Module({
    signature: "context, question -> legal_answer"
  });

  // 5️⃣ Semantic Kernel - Enterprise plugins
  private semanticKernel = new SemanticKernel.Kernel({
    plugins: [LegalAnalytics, OutcomePredictor, RiskCalculator]
  });

  // 6️⃣ Byzantine Consensus
  private byzantineConsensus = new ByzantineLegalConsensus({
    validators: [autoGen, crewAI, semanticKernel],
    threshold: 0.67
  });

  // 7️⃣ Quantum Optimizer
  private quantumOptimizer = new QuantumInspiredOptimizer({
    qubits: 128,
    measurementRounds: 1000
  });

  // 8️⃣ Neuromorphic Processor
  private neuromorphicProcessor = new NeuromorphicLegalBrain({
    neurons: 1_000_000,
    learningRule: "STDP"
  });

  async processLegalRequest(request: LegalRequest) {
    // 1. AutoGen analysis
    const autoGenResult = await this.autoGenOrchestrator.run(request);

    // 2. LangGraph workflow
    const workflowResult = await this.legalWorkflow.invoke(autoGenResult);

    // 3. CrewAI deep research
    const crewResearch = await this.legalCrew.kickoff(workflowResult);

    // 4. DSPy optimization
    const optimized = await this.promptOptimizer.compile(crewResearch);

    // 5. Semantic Kernel enrichment
    const enriched = await this.semanticKernel.run(optimized);

    // 6. Byzantine consensus
    const consensus = await this.byzantineConsensus.achieve([
      autoGenResult, workflowResult, crewResearch, optimized, enriched
    ]);

    // 7. Quantum optimization
    const quantumOptimized = await this.quantumOptimizer.optimize(consensus);

    // 8. Neuromorphic learning
    await this.neuromorphicProcessor.learn(request, quantumOptimized);

    return quantumOptimized;
  }
}
```

#### **📚 Documentação Completa**

Para detalhes completos da arquitetura híbrida, incluindo:
- Código TypeScript completo
- Comparação detalhada (Atual vs Superior)
- Roadmap de implementação (5-8 semanas)
- Dependências necessárias
- Referências e recursos

**Consulte**: `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` (seção "Arquitetura Híbrida Superior")

#### **🎯 Comandos Úteis para Copilot**

```bash
# Ver arquitetura híbrida completa
@workspace Abrir docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md seção "Arquitetura Híbrida Superior"

# Comparar implementação atual vs superior
@workspace Comparar tabela de melhorias em UPGRADE_AGENTES_RESUMO_COMPLETO.md

# Ver roadmap de implementação
@workspace Mostrar roadmap de implementação da arquitetura híbrida
```

---

## Making Changes

### ⚡ Migração Python - Regras Específicas para Copilot

**ANTES DE QUALQUER AÇÃO**, o Copilot deve:

1. **Implementar em Python puro** - Sem TypeScript/Node.js
2. **Seguir estrutura em `streamlit-app/`** - Toda nova implementação vai aqui
3. **Usar LangChain real** - Não criar stubs/simulações
4. **Testar localmente** - `streamlit run app.py` antes de commitar
5. **Documentar no plano** - Atualizar PLANO_MIGRACAO_ACELERADA_PYTHON.md

#### 🔧 Regras para Implementação Python

- **Sempre usar type hints** - `def funcao(arg: str) -> dict:`
- **Sempre documentar** - Docstrings Google Style
- **Seguir PEP 8** - black formatter obrigatório
- **Imports absolutos** - `from streamlit_app.lib.agents import harvey`
- **Async quando possível** - `async def` para I/O bound

### 🔒 Regras específicas para novos componentes Python

- **Agentes LangChain**: Herdar de `BaseAgent` em `lib/agents/base_agent.py`, implementar `tools` e `prompt`, adicionar em `backend/routers/agents.py`
- **Automações Selenium**: Usar `webdriver-manager` para drivers, sempre `--headless` em produção, timeout 10s padrão, implementar em `lib/automation/`
- **ML Models**: Treinar com dados sintéticos primeiro, salvar em `models/*.pkl`, validar com `sklearn.metrics`, integrar em página Streamlit dedicada
- **Páginas Streamlit**: Nomear com prefixo numérico `1_Nome.py`, usar `st.set_page_config()`, implementar cache com `@st.cache_data`, sempre responsivas

#### 📊 Relatórios de Status da Migração

Quando solicitado, o Copilot deve fornecer relatórios como:

```
🚀 STATUS DA MIGRAÇÃO PYTHON

✅ COMPLETO (Semana 1)
- Backend FastAPI: 8 routers implementados
- Agentes LangChain: 16/16 funcionando
- Redis client: Conectado
- Testes: 45/50 passando

⏳ EM ANDAMENTO (Semana 2)
- Dashboard Streamlit: 70% completo
- Páginas secundárias: 4/6 implementadas
- Gráficos Plotly: Funcionando

⏱️ PENDENTE (Semana 3)
- Selenium DJEN: Não iniciado
- Selenium PJe: Não iniciado
- ML Models: Não iniciado
- Deploy produção: Não iniciado

🎯 PRÓXIMOS PASSOS
- [Lista de tarefas prioritárias]
```

### 🔄 Implementando Novos Componentes Python

Ao implementar novos componentes, o Copilot deve:

1. **Criar na estrutura correta** em `streamlit-app/`
2. **Seguir padrões Python** (PEP 8, type hints, docstrings)
3. **Importar dependências corretas** (LangChain, Pandas, etc)
4. **Adicionar testes** em `tests/`
5. **Atualizar documentação** no plano de migração
6. **Testar localmente** antes de commitar

---

## 🤖 Claude Skills System

### 📚 Skills Disponíveis (10 Skills Ativas)

O projeto possui um sistema completo de **Claude Skills** que são automaticamente carregadas pelo GitHub Copilot para fornecer assistência especializada.

**Localização:** `.claude/skills/`

**Configuração:** `.vscode/settings.json` → `"github.copilot.chat.useClaudeSkills": true`

#### Skills Customizadas do Projeto (6)

| Skill | Arquivo | Uso |
|-------|---------|-----|
| **Code Formatter** | `code-formatter.md` | Formata código TypeScript/React seguindo padrões do projeto |
| **Code Fix** | `code-fix.md` | Corrige bugs, erros de tipo, runtime errors |
| **Code Search** | `code-search.md` | Pesquisa implementações, arquitetura, funções |
| **Problem Solver** | `problem-solver.md` | Resolve problemas de build, deploy, integração |
| **Test Debugging** | `test-debugging.md` | Debug testes Vitest/Playwright/E2E |
| **Legal Document** | `legal-document-assistant.md` | Cria/edita documentos jurídicos brasileiros |

#### Skills Oficiais Anthropic (4)

| Skill | Diretório | Uso |
|-------|-----------|-----|
| **Web App Testing** | `webapp-testing/` | Testes E2E com Playwright |
| **Skill Creator** | `skill-creator/` | Meta-skill para criar novas skills |
| **DOCX Creation** | `docx/` | Geração de documentos Word |
| **PDF Creation** | `pdf/` | Geração de documentos PDF |

### 🚀 Como Usar as Skills

**As skills são carregadas automaticamente!** Basta usar `@workspace`:

```bash
# Formatar código
@workspace Formata ProcessCard.tsx seguindo padrões

# Corrigir bug
@workspace Corrige erro "undefined" em use-processes.ts

# Pesquisar implementação
@workspace Onde está implementado cálculo de prazos?

# Resolver problema
@workspace Build falha no Vercel, como debugar?

# Debug teste
@workspace Teste timeout em use-autonomous-agents.test.ts

# Documento jurídico
@workspace Cria petição inicial trabalhista

# Teste E2E
@workspace Cria teste Playwright para login

# Nova skill
@workspace Cria skill para análise de jurisprudência
```

### 📖 Documentação das Skills

- **Inventário completo:** `.claude/skills-inventory.json`
- **README das skills:** `.claude/skills/README.md`
- **Repositório oficial:** `.claude/anthropic-skills-reference/` (referência, não versionado)

### 🔧 Adicionar Nova Skill

1. Criar arquivo em `.claude/skills/nome-da-skill.md`
2. Seguir formato padrão (Description, Usage, Instructions)
3. Skill é carregada automaticamente (sem restart)
4. Usar skill-creator para ajudar: `@workspace Cria nova skill para [propósito]`

---

## 📚 Quick Reference - Arquivos Importantes

### 🔑 Arquivos de Configuração
- `.env.example` - Template de variáveis de ambiente
- `vite.config.ts` - Configuração Vite (chunks, plugins)
- `vercel.json` - Configuração Vercel (rotas, headers, crons)
- `vitest.config.ts` - Configuração testes frontend
- `vitest.config.api.ts` - Configuração testes API
- `playwright.config.ts` - Configuração testes E2E
- `tailwind.config.js` - Configuração Tailwind CSS
- `tsconfig.json` - TypeScript compiler options
- `jsconfig.json` - JavaScript project configuration com type checking

### 📝 Documentação Principal
- `README.md` - Visão geral e setup inicial
- `docs/LGPD_COMPLIANCE.md` - Conformidade LGPD
- `docs/FLUXO_MINUTAS_AUTOMATICAS.md` - Fluxo de geração de documentos
- `TODOS_OS_15_AGENTES.md` - Descrição completa dos agentes
- `chrome-extension-pje/SPARK_PROMPT.md` - Especificação da extensão
- `AUTO_MODE_README.md` - Sistema de automação
- `.claude/skills/README.md` - Documentação das Claude Skills

### 🎯 Arquivos Core
- `src/types.ts` - Tipos TypeScript centralizados
- `src/lib/agents.ts` - Configuração dos 16 agentes
- `src/lib/gemini-service.ts` - Integração Gemini AI
- `src/lib/hybrid-agents-integration.ts` - Sistema híbrido (OBRIGATÓRIO)
- `src/lib/config.ts` - Configurações globais
- `api/kv.ts` - Upstash Redis/KV client
- `api/agents.ts` - API de agentes
- `api/pje-sync.ts` - Sync com Chrome Extension

### 🤖 Claude Skills
- `.claude/skills/code-formatter.md` - Formatação de código
- `.claude/skills/code-fix.md` - Correção de bugs
- `.claude/skills/code-search.md` - Pesquisa de código
- `.claude/skills/problem-solver.md` - Resolução de problemas
- `.claude/skills/test-debugging.md` - Debug de testes
- `.claude/skills/legal-document-assistant.md` - Documentos jurídicos

### 🧪 Arquivos de Teste
- `tests/` - Testes frontend
- `tests/api/` - Testes da API
- `tests/e2e/` - Testes Playwright
- `chrome-extension-pje/tests/` - Testes da extensão

---

## 🎓 Padrões de Código e Convenções

### TypeScript
```typescript
// ✅ BOM - Componente funcional tipado
interface ProcessListProps {
  processes: Process[];
  onSelect: (id: string) => void;
}

export function ProcessList({ processes, onSelect }: ProcessListProps) {
  // Hooks no topo
  const [selected, setSelected] = useState<string | null>(null);

  // Lógica
  const handleClick = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  return <div>...</div>;
}

// ❌ EVITAR - Tipos any, componentes de classe
export class ProcessList extends React.Component<any, any> { ... }
```

### Imports
```typescript
// ✅ BOM - Alias @/ para src/
import { Process } from '@/types';
import { useProcesses } from '@/hooks/use-processes';
import { Button } from '@/components/ui/button';

// ❌ EVITAR - Paths relativos longos
import { Process } from '../../../types';
```

### API Routes (Vercel Functions)
```typescript
// ✅ BOM - Validação com Zod, error handling
import { validateProcesses } from './lib/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const validation = validateProcesses(req.body);
    if (!validation.success) {
      return res.status(400).json(validation.error);
    }

    // Processar...
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[API Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Agentes IA
```typescript
// ✅ BOM - Streaming com chunks
import { streamGeminiResponse } from '@/lib/gemini-service';

async function* processIntimacao(expediente: Expediente) {
  yield { status: 'analyzing', progress: 0.1 };

  const analysis = await analyzeDocument(expediente);
  yield { status: 'analyzing', progress: 0.5, data: analysis };

  const stream = streamGeminiResponse(prompt);
  for await (const chunk of stream) {
    yield { status: 'generating', chunk };
  }

  yield { status: 'complete', result: minuta };
}
```

---

## ⚠️ Erros Comuns e Soluções

### 1. "Module not found: Can't resolve '@/...'"
**Causa:** Alias `@/` não configurado no tsconfig ou Vite
**Solução:** Verificar `tsconfig.json` e `vite.config.ts` têm o alias configurado

### 2. "Type 'X' is not assignable to type 'Y'"
**Causa:** Tipos desalinhados entre frontend e API
**Solução:** Sincronizar `src/types.ts` com `api/lib/validation.ts`

### 3. Chrome Extension não sincroniza
**Causa:** API Key inválida ou backend offline
**Solução:** Verificar popup da extensão, reconfigurar API Key, testar `POST /api/pje-sync`

### 4. Testes E2E timeout
**Causa:** Seletores mudaram ou app lento
**Solução:** Usar `await page.waitForLoadState('networkidle')`, atualizar seletores

### 5. Build Vercel falha com "Cannot find module"
**Causa:** Dependência em devDependencies ou import dinâmico quebrado
**Solução:** Mover deps para dependencies, verificar imports dinâmicos

### 6. Gemini API rate limit
**Causa:** Muitas requests simultâneas
**Solução:** Implementar retry com backoff, usar cache Redis

### 7. JavaScript type checking não funciona
**Causa:** jsconfig.json não configurado ou TypeScript Server não reiniciado
**Solução:** Verificar `jsconfig.json` existe na raiz, reiniciar TS Server (`Ctrl+Shift+P` → "TypeScript: Restart TS Server")

---

## 🔧 Configuração TypeScript e JavaScript

### TypeScript (tsconfig.json)

**Configurações principais:**
- `target`: ES2021
- `module`: ESNext (Vite/bundler mode)
- `strict`: true (type safety máximo)
- `noEmit`: true (Vite compila, não o tsc)
- `allowJs`: true (permite importar .js em .ts)
- `checkJs`: false (validação .js via jsconfig.json)
- Path mapping: `@/*` → `./src/*`

**VS Code settings:**
```jsonc
{
  "typescript.tsdk": "node_modules/typescript/lib",  // Usa versão do workspace (5.9.3)
  "typescript.tsserver.maxTsServerMemory": 8192,     // 8 GB para 305 arquivos
  "typescript.preferences.importModuleSpecifier": "non-relative",  // Usa @/ sempre
  "typescript.preferences.includePackageJsonAutoImports": "auto",  // Instala @types/* automaticamente
  "typescript.npm": "/usr/local/share/nvm/versions/node/v22.21.1/bin/npm"
}
```

### JavaScript (jsconfig.json)

**Arquivo:** `/jsconfig.json` (raiz do projeto)

```jsonc
{
  "compilerOptions": {
    "checkJs": true,          // ✅ Type checking em arquivos .js
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "node",
    "paths": {
      "@/*": ["./src/*"]      // Suporte a aliases
    }
  },
  "include": [
    "scripts/**/*.js",        // Valida scripts utilitários
    "*.js"                    // Valida arquivos .js na raiz
  ],
  "exclude": [
    "node_modules",
    "coverage",
    "coverage-api",
    "dist"
  ],
  "typeAcquisition": {
    "enable": true,           // Auto-install @types/* para libs
    "include": ["node", "vite", "react"]
  }
}
```

**Benefícios:**
- ✅ Type checking em 20+ scripts JavaScript
- ✅ IntelliSense completo com autocomplete
- ✅ Detecção de erros antes da execução
- ✅ JSDoc validado automaticamente
- ✅ Sugestões inteligentes (Quick Fixes)
- ✅ Importação .js ↔ .ts funcionando

**JSDoc Examples:**
```javascript
// Type hint para variável
/** @type {string} */
let name = "João";

// Type hint para função
/**
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function sum(a, b) {
  return a + b;
}

// Import types do TypeScript
/** @type {import('./src/types').Process} */
const process = { id: "123", numero: "001" };
```

**Desabilitar type checking em arquivo específico:**
```javascript
// @ts-nocheck
// ^ Desabilita validação para este arquivo

// Ou desabilitar linha específica:
// @ts-ignore
result.toUppercase(); // Erro ignorado
```

**Forçar type checking em arquivo fora do jsconfig:**
```javascript
// @ts-check
// ^ Força validação mesmo se não estiver no jsconfig
```

**Teste de validação:**
```bash
# Validar arquivo específico
npx tsc --noEmit --allowJs --checkJs scripts/check-env-vars.js

# Validar todos os scripts
npx tsc --noEmit --allowJs --checkJs scripts/*.js

# Validar projeto inteiro via jsconfig.json
npm run type-check
```

### 📁 Arquivos JavaScript com Type Checking Ativo

**Status Atual do Projeto:**

✅ **Scripts com `@ts-check` aplicado:**
- `scripts/check-env-vars.js` - Verificador de variáveis de ambiente
- `scripts/vitest-to-sarif.js` - Conversor de relatórios
- `scripts/test-calendar-integration.js` - Testes de integração
- `scripts/test-todoist-integration.js` - Testes Todoist
- `scripts/collectConsole.js` - Coletor de logs
- `scripts/example-with-types.js` - **Arquivo de referência com JSDoc completo**

✅ **Arquivos da raiz com `@ts-check`:**
- `verificar-config.js` - Validador de configuração
- `eslint.config.js` - Configuração ESLint
- `proxy.js` - Servidor proxy local
- `tailwind.config.js` - Configuração Tailwind

**Arquivo de Referência:** `scripts/example-with-types.js`
```javascript
// @ts-check
/**
 * @typedef {Object} ProcessInfo
 * @property {string} id
 * @property {string} numero
 * @property {Date} dataAbertura
 * @property {'ativo'|'arquivado'|'suspenso'} status
 */

/**
 * @param {string} processId
 * @returns {Promise<ProcessInfo | null>}
 */
async function getProcess(processId) {
  return {
    id: processId,
    numero: "0001234-56.2024.8.02.0001",
    dataAbertura: new Date(),
    status: 'ativo'
  };
}
```

### 🔧 Práticas Recomendadas para Novos Arquivos .js

**Ao criar um novo arquivo JavaScript:**

1. **Adicione `@ts-check` no topo**
```javascript
// @ts-check
// Resto do código...
```

2. **Use JSDoc para tipos complexos**
```javascript
/**
 * @typedef {Object} Config
 * @property {string} apiKey
 * @property {number} timeout
 * @property {boolean} debug
 */
```

3. **Documente funções**
```javascript
/**
 * @param {Config} config
 * @returns {Promise<boolean>}
 */
async function initialize(config) {
  // implementação
}
```

4. **Valide antes de commitar**
```bash
npx tsc --noEmit --allowJs --checkJs seu-arquivo.js
```

### 🚨 Erros Comuns e Soluções

**Erro:** `Module '"fs"' has no default export`
```javascript
// ❌ Errado
import fs from 'fs';

// ✅ Correto
import { readFileSync, writeFileSync } from 'fs';
// ou
import * as fs from 'fs';
```

**Erro:** Tipos incompatíveis
```javascript
// @ts-check
/** @type {string} */
let name = "João";
name = 123; // ❌ Type 'number' is not assignable to type 'string'

// ✅ Correto: Manter tipo consistente
name = "Maria";
```

**Desabilitar validação temporariamente:**
```javascript
// Para todo o arquivo
// @ts-nocheck

// Para uma linha específica
// @ts-ignore
result.metodoInexistente();
```

---

## Comunicação e Idioma (Português)

- Responda sempre em Português do Brasil (pt-BR) nas mensagens de resposta, instruções, comentários e planos — tanto no Copilot Chat quanto nas operações de revisão e sugestões automáticas.
- Use linguagem clara, objetiva e direta. Se for necessário usar termos técnicos em inglês, explique-os em português entre parênteses.
- Ao apresentar passos (ex.: rodar build, executar lint, corrigir erros), forneça instruções passo a passo em português.
- Para mensagens de commit sugeridas ou descrições de PR, gere o texto em português e, opcionalmente, inclua uma tradução curta em inglês somente se solicitado.

> Nota: O VS Code já carrega este arquivo por padrão (configuração "GitHub > Copilot > Copilot Chat: Use Instruction Files"). O front matter `applyTo: "**"` garante que Chat, Coding Agent e Code Review consumam estas instruções sem qualquer ação adicional.

---

## 📚 Referências e Repositórios de Inspiração

**IMPORTANTE**: Ao trabalhar com este projeto, consulte SEMPRE as seguintes referências para manter a originalidade do sistema e garantir o uso correto das tecnologias:

### 🎯 Repositório Principal

| Repositório | URL | Propósito |
|-------------|-----|-----------|
| **assistente-juridico-p** | https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal | Repositório alvo - Sistema jurídico completo |

### 🤖 Frameworks de Agentes e Orquestração

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Microsoft AutoGen** | https://github.com/microsoft/autogen | Orquestração multi-agent, execução de código por agentes, GroupChat |
| **LangChain** | https://github.com/langchain-ai/langchain | Workflows, LangGraph, tool-calling, memória de agentes |
| **Semantic Kernel** | https://github.com/microsoft/semantic-kernel | Planners enterprise, plugins extensíveis |
| **CrewAI** | https://github.com/joaomdmoura/crewai | Coordenação de crews/teams, delegação hierárquica |
| **DSPy** | https://github.com/stanfordnlp/dspy | Otimização/compilação automática de prompts |
| **Griptape** | https://github.com/griptape-ai/griptape | Execução de ferramentas/agents |
| **Auto-GPT** | https://github.com/Significant-Gravitas/Auto-GPT | Agentes autônomos, execução de tarefas |

### 🔍 RAG e Recuperação de Informações

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Haystack** | https://github.com/deepset-ai/haystack | RAG, pipelines de recuperação de documentos jurídicos |

### 📊 Vector Databases

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Qdrant** | https://github.com/qdrant/qdrant | Vector DB escalável - **USADO ATUALMENTE** para pesquisa jurisprudencial |
| **Chroma** | https://github.com/chroma-core/chroma | Vector DB alternativa |
| **Weaviate** | https://github.com/semi-technologies/weaviate | Vector DB com schemas |
| **Pinecone** | https://www.pinecone.io/ | Vector DB gerenciado (alternativa cloud) |

### 🛠️ Utilitários e Ferramentas

| Repositório | URL | Uso no Projeto |
|-------------|-----|----------------|
| **Lemur** | https://github.com/AssemblyAI/lemur | Pipelines ML |
| **LiteLLM** | https://github.com/BerriAI/litellm | Clientes LLM leves, multi-provider |
| **Superagent** | https://github.com/superagent-ai/superagent | Abordagens emergentes de agentes |

### 🎯 Como Usar Estas Referências

#### **Para Implementação de Agentes:**
```bash
# Consultar AutoGen para orquestração
@workspace Verificar padrão AutoGen em https://github.com/microsoft/autogen

# Consultar CrewAI para delegação
@workspace Verificar padrão CrewAI em https://github.com/joaomdmoura/crewai

# Consultar DSPy para otimização de prompts
@workspace Verificar padrão DSPy em https://github.com/stanfordnlp/dspy
```

#### **Para Trabalho com Qdrant:**
```bash
# Consultar documentação oficial do Qdrant
@workspace Verificar padrão Qdrant em https://github.com/qdrant/qdrant

# Verificar implementação atual
@workspace Abrir src/lib/qdrant-service.ts
@workspace Abrir docs/QDRANT_SETUP_CHECKLIST.md
```

#### **Para Workflows com LangGraph:**
```bash
# Consultar LangChain/LangGraph
@workspace Verificar padrão LangGraph em https://github.com/langchain-ai/langchain

# Verificar implementação atual
@workspace Abrir src/agents/pesquisa-juris/pesquisa_graph_qdrant.ts
```

### ⚠️ Regras de Uso das Referências

1. **SEMPRE consulte** a documentação oficial antes de implementar novos padrões
2. **MANTENHA consistência** com os padrões já estabelecidos no projeto
3. **NÃO copie código** diretamente - adapte para o contexto jurídico brasileiro
4. **DOCUMENTE** qualquer padrão novo inspirado nas referências
5. **TESTE** implementações baseadas em referências externas
6. **CITE** a fonte quando usar padrões específicos de um framework

### 📖 Documentação Oficial Relevante

| Framework | Documentação |
|-----------|--------------|
| **AutoGen** | https://microsoft.github.io/autogen/ |
| **LangChain** | https://python.langchain.com/docs/ |
| **LangGraph** | https://langchain-ai.github.io/langgraph/ |
| **CrewAI** | https://docs.crewai.com/ |
| **DSPy** | https://dspy-docs.vercel.app/ |
| **Semantic Kernel** | https://learn.microsoft.com/semantic-kernel/ |
| **Qdrant** | https://qdrant.tech/documentation/ |
| **Haystack** | https://docs.haystack.deepset.ai/ |

### 🎯 Mapa de Dependências do Projeto

```
Assistente Jurídico PJe
├── Orquestração
│   ├── AutoGen (GroupChat, code execution)
│   ├── CrewAI (hierarchical teams)
│   └── Semantic Kernel (enterprise plugins)
├── Workflows
│   └── LangGraph (state machines)
├── Otimização
│   └── DSPy (prompt compilation)
├── Vector Search
│   └── Qdrant ⭐ (jurisprudência, precedentes)
├── RAG
│   └── Haystack (document retrieval)
└── LLM Providers
    ├── Gemini 2.5 Pro ⭐ (principal)
    └── LiteLLM (fallback multi-provider)
```

### 🔄 Quando Consultar Cada Referência

| Cenário | Repositório a Consultar | Documentação Local |
|---------|-------------------------|-------------------|
| Criar novo agente | AutoGen, CrewAI | `src/lib/agents.ts`, `TODOS_OS_15_AGENTES.md` |
| Workflow complexo | LangChain/LangGraph | `src/agents/*/pesquisa_graph*.ts` |
| Busca vetorial | Qdrant | `docs/QDRANT_*.md` |
| Otimizar prompts | DSPy | `docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md` |
| RAG jurídico | Haystack | `src/lib/datajud-service.ts` |
| Multi-LLM | LiteLLM | `src/lib/gemini-service.ts` |

---

## 🎓 Boas Práticas ao Usar Referências

1. **Leia a documentação oficial** antes de implementar
2. **Adapte ao contexto jurídico brasileiro** - não copie cegamente
3. **Mantenha consistência** com padrões já estabelecidos
4. **Documente decisões arquiteturais** inspiradas em referências
5. **Teste localmente** antes de integrar
6. **Cite fontes** em comentários quando usar padrões específicos

### 💡 Exemplo de Citação em Código

```typescript
/**
 * Implementação baseada em AutoGen GroupChat pattern
 * @see https://github.com/microsoft/autogen
 * @see docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md
 */
export class LegalAgentOrchestrator {
  // ...implementation
}
```
# Configuração Vercel + GitHub

Este documento descreve apenas as configurações essenciais ativas para integração Vercel + GitHub.

## ✅ Configurações Ativas (vercel.json)

### 1. GitHub Integration

```json
"github": {
  "silent": true,              // Silencia comentários do bot Vercel em PRs
  "autoJobCancellation": true, // Cancela builds antigos automaticamente
  "deployment": true           // Habilita deployments via GitHub
}
```

**O que isso faz:**
- **silent**: Remove comentários repetitivos do bot Vercel em Pull Requests (reduz ruído)
- **autoJobCancellation**: Quando você faz múltiplos pushes seguidos, cancela builds antigos e mantém só o mais recente (economia de tempo/recursos)
- **deployment**: Mantém integração completa com GitHub (cada push = deploy automático)

### 2. Deploy Automático

- ✅ **Production**: Push na `main` → Deploy em `https://assistente-juridico-github.vercel.app/`
- ✅ **Preview**: Pull Request → URL única de preview (ex: `https://assistente-juridico-pr-123.vercel.app/`)
- ✅ **Rollback**: Reverter commit = rollback automático instantâneo

### 3. Variáveis de Ambiente Git

Estas variáveis são **auto-injetadas pelo Vercel** em cada deploy (não precisa configurar):

| Variável | Exemplo | Uso |
|----------|---------|-----|
| `VERCEL_GIT_PROVIDER` | `github` | Identificar provedor Git |
| `VERCEL_GIT_REPO_SLUG` | `assistente-jur-dico-principal` | Nome do repositório |
| `VERCEL_GIT_REPO_OWNER` | `thiagobodevanadv-alt` | Organização/usuário |
| `VERCEL_GIT_COMMIT_REF` | `main` ou `feat/nova-funcionalidade` | Branch atual |
| `VERCEL_GIT_COMMIT_SHA` | `fa1eade47b73...` | SHA do commit |
| `VERCEL_GIT_COMMIT_MESSAGE` | `fix: correção de bug` | Mensagem do commit |
| `VERCEL_GIT_COMMIT_AUTHOR_LOGIN` | `thiagobo` | Username GitHub |
| `VERCEL_GIT_PULL_REQUEST_ID` | `42` | Número do PR (se aplicável) |

**Como usar no código:**
```typescript
// Em qualquer serverless function (api/)
export default async function handler(req, res) {
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  const isProd = branch === 'main';

  if (!isProd) {
    console.log(`Preview deploy from branch: ${branch}`);
  }

  res.json({ branch, isProd });
}
```

## 🔒 Proteção de Forks

**Ativo por padrão** - PRs de forks externos exigem aprovação manual antes de deploy.

Protege contra:
- Vazamento de variáveis de ambiente (secrets)
- Execução de código malicioso
- Roubo do token OIDC

Para desativar (não recomendado): `Projeto → Settings → Security → Git Fork Protection`

## 📦 Cron Jobs Configurados

Crons executam em **horário de Brasília (GMT-3)**:

| Job | Horário | Frequência |
|-----|---------|------------|
| DJEN Monitor | 12:00, 20:00 | 2x/dia |
| DataJud Monitor | 16:00 | 1x/dia |
| Backup | 03:00 | 1x/dia |
| Process Agent Queue | A cada 15min | 96x/dia |
| Notifications | A cada 5min | 288x/dia |
| Calendar Sync | A cada 2h | 12x/dia |
| Deadline Alerts | 11:55 | 1x/dia |
| Watchdog | A cada 30min | 48x/dia |

## 🚀 Comandos Úteis

```bash
# Ver logs de produção
vercel logs https://assistente-juridico-github.vercel.app

# Ver logs de um PR específico
vercel logs https://assistente-juridico-pr-123.vercel.app

# Listar deployments
vercel ls

# Promover preview para produção
vercel promote <deployment-url>

# Rollback para deploy anterior
vercel rollback
```

## 📊 Permissões GitHub Concedidas

O Vercel possui as seguintes permissões no repositório:

### Repositório
- ✅ **Administration**: Criar repositórios de templates
- ✅ **Checks**: Adicionar verificações de build
- ✅ **Contents**: Ler/escrever código (templates)
- ✅ **Deployments**: Sincronizar status
- ✅ **Pull Requests**: Criar comentários e atualizações
- ✅ **Issues**: Interagir com PRs (GitHub requer ambos)
- ✅ **Metadata**: Ler metadados básicos
- ✅ **Webhooks**: Receber eventos Git
- ✅ **Commit Statuses**: Sincronizar status de commits

### Organização
- ✅ **Members** (read): Melhor UX de onboarding

### Usuário
- ✅ **Email addresses** (read): Associar email à conta

## 🔧 Troubleshooting

### Problema: "Repositório não aparece na lista"
**Solução**: Verifique se você tem permissão de **Colaborador** no repositório.

### Problema: "Deploy falha mas local funciona"
**Solução**: Verifique variáveis de ambiente no Vercel Dashboard (`Settings → Environment Variables`)

### Problema: "Comentários do bot Vercel aparecendo"
**Solução**: Já configurado `"silent": true` - comentários estão desabilitados.

### Problema: "Build cancelado automaticamente"
**Solução**: Comportamento esperado com `autoJobCancellation: true` - apenas o commit mais recente é buildado.

## 📚 Referências

- [Documentação Vercel + GitHub](https://vercel.com/docs/deployments/git/vercel-for-github)
- [Variáveis de Ambiente Git](https://vercel.com/docs/projects/environment-variables/system-environment-variables#system-environment-variables)
- [Configuração Git](https://vercel.com/docs/projects/project-configuration#git-configuration)

---

**Última atualização**: 24/12/2025
