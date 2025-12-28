# 🐍 Arquitetura do App Python/Streamlit - Assistente Jurídico PJe

## 📐 Visão Geral da Arquitetura

```
┌──────────────────────────────────────────────────────────────────────┐
│                    USUÁRIO (Advogado/Escritório)                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ HTTP (localhost:8501)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         STREAMLIT UI (Frontend)                       │
├──────────────────────────────────────────────────────────────────────┤
│  8 Páginas Interativas:                                              │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │ Processos  │Expedientes │ Agentes IA │ Automações │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │Análises ML │  Config    │  Minutas   │ Dashboard  │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│                                                                       │
│  • Interface Python-native (sem JavaScript)                          │
│  • Auto-reload em mudanças de código                                 │
│  • State management via st.session_state                             │
│  • Suporte a multipage apps                                          │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                                │ HTTP REST API (localhost:8000)
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      BACKEND FASTAPI (Python)                         │
├──────────────────────────────────────────────────────────────────────┤
│  Endpoints REST API:                                                  │
│  • GET  /api/health          - Health check                          │
│  • GET  /api/processes       - Listar processos                      │
│  • POST /api/processes       - Criar processo                        │
│  • GET  /api/expedientes     - Listar expedientes                    │
│  • POST /api/agents/execute  - Executar agente                       │
│  • GET  /api/metrics         - Métricas do sistema                   │
│  • POST /api/djen-sync       - Sincronizar DJEN                      │
│                                                                       │
│  Features:                                                            │
│  • Async/await nativo (uvicorn)                                      │
│  • CORS configurado (React + Streamlit)                              │
│  • Middleware de logging                                             │
│  • Global exception handler                                          │
│  • APScheduler para cron jobs                                        │
│  • Pydantic para validação                                           │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │                                │
                ▼                                ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│   REDIS CACHE           │      │   15 AGENTES PYTHON     │
│   (Upstash)             │      │   (LangChain)           │
├─────────────────────────┤      ├─────────────────────────┤
│ • Session state         │      │ 1. Harvey Specter       │
│ • Process cache         │      │ 2. Mrs. Justin-e        │
│ • Agent results         │      │ 3. Análise Documental   │
│ • Temporary data        │      │ 4. Monitor DJEN         │
│ • Rate limiting         │      │ 5. Gestão de Prazos     │
└─────────┬───────────────┘      │ 6. Redação de Petições  │
          │                      │ 7. Organização Arquivos │
          │                      │ 8. Pesquisa Jurisp.     │
          │                      │ 9. Análise de Risco     │
          │                      │ 10. Revisão Contratual  │
          │                      │ 11. Comunicação Cliente │
          │                      │ 12. Financeiro          │
          │                      │ 13. Estratégia Process. │
          │                      │ 14. Tradução Jurídica   │
          │                      │ 15. Compliance          │
          │                      └─────────┬───────────────┘
          │                                │
          │         ┌──────────────────────┴─────────────────────┐
          │         │                                            │
          ▼         ▼                                            ▼
┌─────────────────────────┐      ┌─────────────────────────────────────┐
│   INTEGRAÇÕES           │      │   MACHINE LEARNING                  │
│   EXTERNAS              │      │   (scikit-learn)                    │
├─────────────────────────┤      ├─────────────────────────────────────┤
│ • DJEN (Scraping)       │      │ • Predictor (success rate)          │
│ • DataJud (API CNJ)     │      │ • Clustering (case similarity)      │
│ • PJe (Selenium)        │      │ • Duration Estimator                │
│ • Google Calendar       │      │ • Sentiment Analysis                │
│ • Google Gemini AI      │      │ • Train models pipeline             │
└─────────────────────────┘      └─────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    AUTOMAÇÃO PJe (Selenium + PyAutoGUI)              │
├──────────────────────────────────────────────────────────────────────┤
│ • Login automático no PJe                                            │
│ • Navegação por processos                                            │
│ • Preenchimento de formulários                                       │
│ • Upload de petições                                                 │
│ • Protocolo automático (CUIDADO!)                                    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios Detalhada

```
streamlit-app/
│
├── app.py                          # 🚀 Entry point Streamlit (300 linhas)
│   ├── Page config (must be first)
│   ├── Backend startup check
│   ├── Authentication (se configurado)
│   └── Navigation sidebar
│
├── backend/                        # 🔧 Backend FastAPI
│   ├── main.py                     # API server (200 linhas)
│   ├── database.py                 # Redis client wrapper (150 linhas)
│   ├── cron_jobs.py                # APScheduler jobs (100 linhas)
│   └── routers/                    # API endpoints por domínio
│       ├── agents.py               # POST /api/agents/execute
│       ├── processes.py            # CRUD de processos
│       ├── expedientes.py          # CRUD de expedientes
│       ├── intimacoes.py           # Análise de intimações
│       ├── kv.py                   # Key-value store
│       ├── djen.py                 # DJEN sync
│       └── metrics.py              # Métricas e analytics
│
├── lib/                            # 📚 Bibliotecas compartilhadas
│   ├── config.py                   # Configurações centralizadas
│   ├── backend_client.py           # Cliente HTTP para backend
│   ├── backend_client_v2.py        # Cliente v2 (async)
│   ├── memory_manager.py           # Gerenciamento de memória
│   ├── langchain_agents.py         # Orquestração LangChain
│   ├── ai_commands.py              # Comandos de IA rápidos
│   ├── selenium_scraper.py         # Scraping genérico
│   ├── pyautogui_automation.py     # Automação GUI
│   │
│   ├── agents/                     # 🤖 15 Agentes Especializados
│   │   ├── harvey.py               # Estrategista-chefe (250 linhas)
│   │   ├── justine.py              # Análise de intimações (300 linhas)
│   │   ├── analise_doc.py          # Análise documental (200 linhas)
│   │   ├── monitor_djen.py         # Monitor DJEN (180 linhas)
│   │   ├── prazos.py               # Gestão de prazos (220 linhas)
│   │   ├── redacao.py              # Redação de petições (350 linhas)
│   │   ├── organizacao.py          # Organização de arquivos (150 linhas)
│   │   ├── pesquisa.py             # Pesquisa jurisprudencial (280 linhas)
│   │   ├── analise_risco.py        # Análise de risco (200 linhas)
│   │   ├── revisao_contratual.py   # Revisão contratual (180 linhas)
│   │   ├── comunicacao_clientes.py # Comunicação com clientes (160 linhas)
│   │   ├── financeiro.py           # Análise financeira (190 linhas)
│   │   ├── estrategia.py           # Estratégia processual (240 linhas)
│   │   ├── traducao_juridica.py    # Tradução jurídica (120 linhas)
│   │   ├── compliance.py           # Compliance LGPD (150 linhas)
│   │   └── analise_sentenca.py     # Análise de sentenças (180 linhas)
│   │
│   ├── integrations/               # 🔌 Integrações Externas
│   │   ├── djen.py                 # DJEN scraping (BeautifulSoup)
│   │   ├── djen_api_client.py      # Cliente API DJEN
│   │   ├── djen_service.py         # Serviço DJEN completo
│   │   ├── datajud.py              # DataJud API (CNJ oficial)
│   │   ├── datajud_client.py       # Cliente DataJud
│   │   ├── pje.py                  # Automação PJe (Selenium)
│   │   ├── google_calendar.py      # Google Calendar API
│   │   └── qdrant_service.py       # Vector DB (opcional)
│   │
│   ├── ml/                         # 🧠 Machine Learning
│   │   ├── predictor.py            # Previsão de sucesso (300 linhas)
│   │   ├── clustering.py           # Agrupamento de casos (200 linhas)
│   │   ├── duration_estimator.py   # Estimativa de duração (180 linhas)
│   │   ├── sentiment.py            # Análise de sentimento (150 linhas)
│   │   ├── train_all_models.py     # Pipeline de treino (250 linhas)
│   │   └── __init__.py
│   │
│   ├── automation/                 # ⚙️ Automação
│   │   ├── pje_automation.py       # Automação PJe (400 linhas)
│   │   ├── form_filler.py          # Preenchimento de formulários (200 linhas)
│   │   └── __init__.py
│   │
│   └── tools/                      # 🛠️ Ferramentas Auxiliares
│       ├── search_tools.py         # Ferramentas de busca
│       ├── djen_tools.py           # Ferramentas DJEN
│       └── __init__.py
│
├── pages/                          # 📄 Páginas Streamlit
│   ├── 1_Processos.py              # CRUD de processos (250 linhas)
│   ├── 2_Expedientes.py            # CRUD de expedientes (300 linhas)
│   ├── 3_Agentes_IA.py             # Interface de agentes (400 linhas)
│   ├── 4_Automacoes.py             # Automações PJe (159 linhas)
│   ├── 5_Analises_ML.py            # Dashboards ML (89 linhas)
│   ├── 6_Configuracoes.py          # Configurações (304 linhas)
│   ├── 7_Minutas.py                # Gestão de minutas (637 linhas)
│   ├── 8_dashboard.py              # Dashboard principal (297 linhas)
│   └── __init__.py
│
├── scripts/                        # 📜 Scripts Auxiliares
│   └── train_success_model.py      # Treinar modelo de sucesso (311 linhas)
│
├── tests/                          # 🧪 Testes Automatizados
│   ├── conftest.py                 # Fixtures pytest (77 linhas)
│   ├── test_agents.py              # Testes de agentes (191 linhas)
│   ├── test_backend_api.py         # Testes da API (257 linhas)
│   ├── test_cron_jobs.py           # Testes de cron jobs (217 linhas)
│   ├── test_datajud_client.py      # Testes DataJud (217 linhas)
│   ├── test_djen_workflow.py       # Testes DJEN (366 linhas)
│   ├── test_e2e.py                 # Testes end-to-end (209 linhas)
│   ├── test_integrations.py        # Testes de integrações (234 linhas)
│   ├── test_ml_predictor.py        # Testes ML predictor (96 linhas)
│   ├── test_ml_sentiment.py        # Testes ML sentiment (135 linhas)
│   ├── test_orchestrator.py        # Testes orquestrador (101 linhas)
│   └── test_utils.py               # Testes utilitários (284 linhas)
│
├── requirements.txt                # 📦 Dependências Python
├── render.yaml                     # 🚀 Deploy Render.com
├── start.sh                        # 🏃 Script de inicialização
├── test_quick.py                   # ⚡ Teste rápido
└── README.md                       # 📖 Documentação (PENDENTE)
```

**Total**: ~7.500 linhas de código Python puro

---

## 🏗️ Componentes Principais

### 1. Frontend Streamlit (app.py + pages/)

**Responsabilidades**:
- Interface de usuário interativa
- Gerenciamento de sessão do usuário
- Navegação multi-page
- Comunicação com backend via REST API
- Renderização de gráficos e dashboards

**Tecnologias**:
- `streamlit`: Framework de UI Python
- `plotly`: Gráficos interativos
- `pandas`: Manipulação de dados para exibição

**Fluxo de Inicialização**:
```python
1. app.py é executado (streamlit run app.py)
2. Verifica se backend FastAPI está rodando (porta 8000)
3. Se não estiver, inicia backend/main.py em subprocesso
4. Carrega configurações do config.py
5. Inicializa session_state
6. Renderiza página principal com sidebar de navegação
7. Aguarda interação do usuário
```

**Páginas**:
- **Processos**: CRUD completo de processos jurídicos
- **Expedientes**: Gerenciamento de expedientes/intimações
- **Agentes IA**: Interface para executar agentes manualmente
- **Automações**: Controle de automações PJe
- **Análises ML**: Dashboards de machine learning
- **Configurações**: Variáveis de ambiente, integrações
- **Minutas**: Geração e edição de documentos
- **Dashboard**: Visão geral do escritório

---

### 2. Backend FastAPI (backend/)

**Responsabilidades**:
- API REST compatível com endpoints React/Vercel
- Gerenciamento de dados (Redis)
- Orquestração de agentes
- Cron jobs automáticos
- Validação de dados (Pydantic)

**Endpoints Principais**:

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/health` | Health check do servidor |
| GET | `/api/processes` | Listar processos (paginado) |
| POST | `/api/processes` | Criar novo processo |
| PUT | `/api/processes/{id}` | Atualizar processo |
| DELETE | `/api/processes/{id}` | Deletar processo |
| GET | `/api/expedientes` | Listar expedientes |
| POST | `/api/expedientes` | Criar expediente |
| POST | `/api/agents/execute` | Executar agente específico |
| GET | `/api/metrics` | Métricas do sistema |
| POST | `/api/djen-sync` | Sincronizar DJEN |
| GET | `/api/kv/{key}` | Buscar valor no Redis |
| POST | `/api/kv` | Salvar valor no Redis |

**Arquitetura de Routers**:
```python
backend/
├── main.py              # FastAPI app principal
└── routers/
    ├── agents.py        # /api/agents/*
    ├── processes.py     # /api/processes/*
    ├── expedientes.py   # /api/expedientes/*
    ├── intimacoes.py    # /api/intimacoes/*
    ├── kv.py            # /api/kv/*
    ├── djen.py          # /api/djen-sync
    └── metrics.py       # /api/metrics
```

**Middleware Stack**:
1. **CORSMiddleware**: Permitir React + Streamlit
2. **LoggingMiddleware**: Log de todas requests
3. **ExceptionHandler**: Captura erros globais
4. **RateLimitMiddleware**: (PENDENTE) Proteção contra abuso

**Cron Jobs** (APScheduler):
```python
# cron_jobs.py
def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # Monitor DJEN a cada 2 horas
    scheduler.add_job(monitor_djen, 'interval', hours=2)
    
    # Calcular prazos a cada 1 hora
    scheduler.add_job(calculate_deadlines, 'interval', hours=1)
    
    # Backup diário às 03:00
    scheduler.add_job(backup_data, 'cron', hour=3)
    
    scheduler.start()
```

---

### 3. Agentes de IA (lib/agents/)

**Arquitetura de Agentes**:

```
AgentBase (Interface)
  ├── Harvey Specter (Estrategista)
  ├── Mrs. Justin-e (Análise Intimações)
  ├── Análise Documental (OCR + NLP)
  ├── Monitor DJEN (Scraping)
  ├── Gestão de Prazos (Cálculo)
  ├── Redação de Petições (Geração)
  ├── Organização de Arquivos (Classificação)
  ├── Pesquisa Jurisprudencial (Busca)
  ├── Análise de Risco (Predição)
  ├── Revisão Contratual (Análise)
  ├── Comunicação com Clientes (Geração)
  ├── Financeiro (Análise)
  ├── Estratégia Processual (Recomendação)
  ├── Tradução Jurídica (Explicação)
  └── Compliance (Auditoria LGPD)
```

**Interface Padrão**:
```python
class AgentBase(ABC):
    def __init__(self, name: str, description: str, capabilities: List[str]):
        self.name = name
        self.description = description
        self.capabilities = capabilities
    
    @abstractmethod
    async def execute(self, input_data: dict) -> dict:
        """Executa a tarefa do agente."""
        pass
    
    def validate_input(self, input_data: dict) -> bool:
        """Valida entrada antes de executar."""
        pass
```

**Exemplo de Agente** (Mrs. Justin-e):
```python
# lib/agents/justine.py
class JustineAgent(AgentBase):
    def __init__(self):
        super().__init__(
            name="Mrs. Justin-e",
            description="Especialista em análise de intimações e prazos",
            capabilities=["intimation-analysis", "deadline-calculation", "task-generation"]
        )
    
    async def execute(self, input_data: dict) -> dict:
        # 1. Extrair texto da intimação
        intimacao = input_data.get("expediente")
        texto = self._extract_text(intimacao)
        
        # 2. Analisar com LangChain + Gemini
        analysis = await self._analyze_with_llm(texto)
        
        # 3. Calcular prazos
        deadlines = self._calculate_deadlines(analysis)
        
        # 4. Gerar tarefas
        tasks = self._generate_tasks(analysis, deadlines)
        
        return {
            "analysis": analysis,
            "deadlines": deadlines,
            "tasks": tasks,
            "confidence": 0.95
        }
```

---

### 4. Integrações Externas (lib/integrations/)

#### 4.1 DJEN (Diário de Justiça Eletrônico Nacional)

**Estratégia**: Web Scraping (BeautifulSoup)

```python
# lib/integrations/djen_service.py
class DJENService:
    def __init__(self):
        self.base_url = "https://www.cnj.jus.br/diarios-eletronicos/"
        self.session = requests.Session()
    
    async def fetch_latest_publications(self, tribunal: str, date: str) -> List[dict]:
        """Busca publicações mais recentes de um tribunal."""
        url = f"{self.base_url}/{tribunal}/{date}"
        response = await self.session.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        publications = []
        for item in soup.find_all('div', class_='publicacao'):
            publications.append({
                'numero_processo': item.find('span', class_='processo').text,
                'tipo': item.find('span', class_='tipo').text,
                'conteudo': item.find('div', class_='texto').text,
                'data': date
            })
        
        return publications
```

#### 4.2 DataJud (API Oficial CNJ)

**Estratégia**: REST API com autenticação

```python
# lib/integrations/datajud_client.py
class DataJudClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api-publica.datajud.cnj.jus.br"
    
    async def search_jurisprudence(self, query: str, tribunal: str = "STJ") -> List[dict]:
        """Busca jurisprudência na base do CNJ."""
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {
            "q": query,
            "tribunal": tribunal,
            "limit": 100
        }
        
        response = await self.client.get(
            f"{self.base_url}/api_publica_acordaos/_search",
            headers=headers,
            params=params
        )
        
        return response.json()['hits']
```

#### 4.3 PJe (Processo Judicial Eletrônico)

**Estratégia**: Selenium WebDriver (automação de browser)

```python
# lib/integrations/pje.py
class PJeAutomation:
    def __init__(self, headless: bool = True):
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        self.driver = webdriver.Chrome(options=options)
    
    async def login(self, cpf: str, senha: str):
        """Faz login no PJe."""
        self.driver.get("https://pje.tjal.jus.br/login")
        self.driver.find_element(By.ID, "cpf").send_keys(cpf)
        self.driver.find_element(By.ID, "senha").send_keys(senha)
        self.driver.find_element(By.ID, "btnLogin").click()
        
        # Aguardar carregamento
        WebDriverWait(self.driver, 10).until(
            EC.presence_of_element_located((By.ID, "menu-principal"))
        )
    
    async def protocolar_peticao(self, numero_processo: str, arquivo_pdf: str):
        """Protocola uma petição no processo."""
        # CUIDADO: Automação real de protocolo!
        # Validar MUITO bem antes de executar
        ...
```

#### 4.4 Google Calendar

**Estratégia**: Google Calendar API oficial

```python
# lib/integrations/google_calendar.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class GoogleCalendarService:
    def __init__(self, credentials_path: str):
        self.creds = Credentials.from_authorized_user_file(credentials_path)
        self.service = build('calendar', 'v3', credentials=self.creds)
    
    async def create_deadline_event(self, titulo: str, data: datetime, descricao: str):
        """Cria evento de prazo no Google Calendar."""
        event = {
            'summary': f'⚖️ Prazo: {titulo}',
            'description': descricao,
            'start': {
                'dateTime': data.isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
            'end': {
                'dateTime': (data + timedelta(hours=1)).isoformat(),
                'timeZone': 'America/Sao_Paulo',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 dia antes
                    {'method': 'popup', 'minutes': 60},       # 1 hora antes
                ],
            },
        }
        
        return self.service.events().insert(calendarId='primary', body=event).execute()
```

---

### 5. Machine Learning (lib/ml/)

#### 5.1 Success Predictor

**Objetivo**: Prever probabilidade de sucesso de um processo

```python
# lib/ml/predictor.py
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

class SuccessPredictor:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100)
        self.encoders = {}
    
    def train(self, X: pd.DataFrame, y: pd.Series):
        """Treina modelo com casos históricos."""
        # Encode categorical features
        for col in X.select_dtypes(include=['object']).columns:
            self.encoders[col] = LabelEncoder()
            X[col] = self.encoders[col].fit_transform(X[col])
        
        self.model.fit(X, y)
    
    def predict(self, caso: dict) -> float:
        """Prevê probabilidade de sucesso."""
        X = self._prepare_features(caso)
        return self.model.predict_proba(X)[0][1]  # Prob. de sucesso
```

**Features utilizadas**:
- Tipo de ação
- Tribunal
- Valor da causa
- Matéria jurídica
- Histórico de sentenças semelhantes
- Jurisprudência favorável (%)

#### 5.2 Case Clustering

**Objetivo**: Agrupar casos similares

```python
# lib/ml/clustering.py
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

class CaseClustering:
    def __init__(self, n_clusters: int = 5):
        self.vectorizer = TfidfVectorizer(max_features=100)
        self.kmeans = KMeans(n_clusters=n_clusters)
    
    def cluster_cases(self, casos: List[str]) -> np.ndarray:
        """Agrupa casos por similaridade."""
        X = self.vectorizer.fit_transform(casos)
        return self.kmeans.fit_predict(X)
```

#### 5.3 Duration Estimator

**Objetivo**: Estimar duração de um processo

```python
# lib/ml/duration_estimator.py
from sklearn.linear_model import LinearRegression

class DurationEstimator:
    def __init__(self):
        self.model = LinearRegression()
    
    def train(self, X: pd.DataFrame, y: pd.Series):
        """Treina modelo com durações históricas (em dias)."""
        self.model.fit(X, y)
    
    def estimate(self, caso: dict) -> int:
        """Estima duração em dias."""
        X = self._prepare_features(caso)
        return int(self.model.predict(X)[0])
```

---

## 🔐 Segurança e Compliance

### LGPD Compliance

**Dados Sensíveis Protegidos**:
- CPF (mascarado: `123.***.**-45`)
- Email (mascarado: `j***@example.com`)
- Telefone (mascarado: `(11) 9****-1234`)
- Endereço (apenas cidade/estado)
- RG, CNH, OAB (mascarados)

**Implementação**:
```python
# lib/agents/compliance.py
class ComplianceAgent(AgentBase):
    def sanitize_data(self, data: dict) -> dict:
        """Remove/mascara dados sensíveis antes de logging."""
        sanitized = data.copy()
        
        if 'cpf' in sanitized:
            sanitized['cpf'] = self._mask_cpf(sanitized['cpf'])
        
        if 'email' in sanitized:
            sanitized['email'] = self._mask_email(sanitized['email'])
        
        return sanitized
```

### Autenticação

**Pendente**: Sistema de autenticação não implementado

**Recomendação**:
```python
# Adicionar ao app.py
def check_authentication():
    if 'user' not in st.session_state:
        username = st.text_input("Usuário")
        password = st.text_input("Senha", type="password")
        
        if st.button("Login"):
            if authenticate(username, password):
                st.session_state['user'] = username
                st.rerun()
            else:
                st.error("Credenciais inválidas")
        
        st.stop()
```

---

## 📊 Métricas e Monitoramento

### Métricas Coletadas

```python
# backend/routers/metrics.py
@router.get("/api/metrics")
async def get_metrics():
    return {
        "processes": {
            "total": await count_processes(),
            "active": await count_active_processes(),
            "archived": await count_archived_processes()
        },
        "agents": {
            "executions_today": await count_agent_executions(today),
            "success_rate": await calculate_success_rate(),
            "avg_duration": await calculate_avg_duration()
        },
        "integrations": {
            "djen_syncs": await count_djen_syncs(),
            "datajud_queries": await count_datajud_queries(),
            "pje_automations": await count_pje_automations()
        },
        "ml": {
            "predictions_made": await count_predictions(),
            "model_accuracy": await get_model_accuracy()
        }
    }
```

### Logging

**Implementação atual**: `print()` statements

**Recomendação**: Usar `logging` module

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
logger.info("Backend iniciado com sucesso")
```

---

## 🚀 Deploy e Infraestrutura

### Opções de Deploy

#### 1. Render.com (Recomendado)

**Arquivo**: `render.yaml`

```yaml
services:
  - type: web
    name: assistente-juridico-python
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "streamlit run app.py --server.port=$PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
      - key: REDIS_URL
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

**Vantagens**:
- ✅ Gratuito até 750h/mês
- ✅ Auto-deploy no push
- ✅ Logs integrados
- ✅ Custom domain

**Desvantagens**:
- ⚠️ Sleep após inatividade (tier free)
- ⚠️ 512 MB RAM (tier free)

#### 2. Railway.app

**Arquivo**: `railway.json`

```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "streamlit run app.py --server.port=$PORT",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Vantagens**:
- ✅ $5 crédito grátis/mês
- ✅ Mais recursos que Render
- ✅ PostgreSQL integrado

**Desvantagens**:
- ⚠️ Pago após crédito

#### 3. Streamlit Cloud (Específico)

**Gratuito** se o repositório for público.

**Limitações**:
- Apenas Streamlit (não FastAPI separado)
- Recursos limitados (1 GB RAM)
- Não suporta Selenium (headless mode)

---

## 📈 Roadmap de Melhorias

### Curto Prazo (1-2 semanas)

- [ ] **Autenticação e autorização**
  - Sistema de login/senha
  - JWT tokens
  - Permissões por usuário

- [ ] **Testes automatizados**
  - Aumentar cobertura para 80%+
  - CI/CD com GitHub Actions
  - Testes E2E com Playwright

- [ ] **Documentação**
  - Docstrings completos
  - README atualizado
  - API docs (Swagger)

- [ ] **Logging estruturado**
  - Substituir `print()` por `logging`
  - Logs em JSON
  - Integração com Sentry

### Médio Prazo (1-2 meses)

- [ ] **Performance**
  - Cache agressivo (Redis)
  - Lazy loading de agentes
  - Background tasks (Celery)

- [ ] **UI Melhorada**
  - Temas customizáveis
  - Responsividade mobile
  - Notificações em tempo real

- [ ] **Integrações adicionais**
  - Todoist (tarefas)
  - Slack (notificações)
  - Zapier (automações)

- [ ] **ML avançado**
  - Deep Learning (BERT jurídico)
  - Transfer learning
  - Active learning com feedback

### Longo Prazo (3-6 meses)

- [ ] **Multi-tenancy**
  - Suporte a múltiplos escritórios
  - Isolamento de dados
  - Billing por escritório

- [ ] **Mobile app**
  - React Native ou Flutter
  - Push notifications
  - Offline-first

- [ ] **IA avançada**
  - Fine-tuning de modelos próprios
  - RAG com Qdrant
  - Multi-agent orchestration (AutoGen)

---

## 🧪 Como Testar

### Setup Local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/assistente-juridico-python.git
cd assistente-juridico-python/streamlit-app

# 2. Crie virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# 3. Instale dependências
pip install -r requirements.txt

# 4. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves

# 5. Execute
streamlit run app.py
```

### Rodar Testes

```bash
# Todos os testes
pytest tests/

# Teste específico
pytest tests/test_agents.py -v

# Com cobertura
pytest tests/ --cov=lib --cov-report=html
```

### Validar Integrações

```bash
# Testar DJEN
python -m lib.integrations.djen_service

# Testar DataJud
python -m lib.integrations.datajud_client

# Testar backend
curl http://localhost:8000/api/health
```

---

## 📚 Referências

- **Streamlit Docs**: https://docs.streamlit.io/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **LangChain Python**: https://python.langchain.com/docs/
- **scikit-learn**: https://scikit-learn.org/stable/
- **Selenium**: https://www.selenium.dev/documentation/

---

**Última atualização**: 28/12/2024
**Autor**: GitHub Copilot
**Status**: 📖 Documentação Completa
