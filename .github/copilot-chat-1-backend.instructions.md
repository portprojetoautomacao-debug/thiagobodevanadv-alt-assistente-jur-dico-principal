# 🎯 CHAT 1 - BACKEND E AGENTES (SEMANA 1)

**Responsabilidade:** Backend FastAPI + 16 Agentes LangChain + Integrações Redis
**Prazo:** Dias 1-7
**Prioridade:** 🔴 CRÍTICA

---

## 📋 ESCOPO DESTE CHAT

Você é responsável por implementar:

### 1️⃣ Backend FastAPI (Dias 2-3)
- `streamlit-app/backend/main.py` - App principal
- `streamlit-app/backend/database.py` - Cliente Redis/Upstash
- `streamlit-app/backend/routers/` - 8 routers:
  - `health.py` - Health check
  - `processes.py` - CRUD processos (Pandas)
  - `agents.py` - Execução de agentes LangChain
  - `expedientes.py` - CRUD expedientes
  - `djen.py` - Scraping DJEN (stub inicial)
  - `pje.py` - Scraping PJe (stub inicial)
  - `metrics.py` - Métricas com Pandas
  - `cron.py` - Gerenciamento de jobs

### 2️⃣ 16 Agentes LangChain (Dias 4-5)
- `streamlit-app/lib/agents/base_agent.py` - Classe base
- `streamlit-app/lib/agents/harvey.py` - Harvey Specter
- `streamlit-app/lib/agents/justine.py` - Mrs. Justin-e
- `streamlit-app/lib/agents/redacao.py` - Redação Petições
- `streamlit-app/lib/agents/pesquisa.py` - Pesquisa Jurisprudencial
- `streamlit-app/lib/agents/analise_doc.py` - Análise Documental
- `streamlit-app/lib/agents/monitor_djen.py` - Monitor DJEN
- `streamlit-app/lib/agents/prazos.py` - Gestão Prazos
- `streamlit-app/lib/agents/organizacao.py` - Organização Arquivos
- `streamlit-app/lib/agents/analise_risco.py` - Análise Risco
- `streamlit-app/lib/agents/revisao_contratual.py` - Revisão Contratual
- `streamlit-app/lib/agents/comunicacao.py` - Comunicação Clientes
- `streamlit-app/lib/agents/financeiro.py` - Análise Financeira
- `streamlit-app/lib/agents/estrategia.py` - Estratégia Processual
- `streamlit-app/lib/agents/traducao.py` - Tradução Jurídica
- `streamlit-app/lib/agents/compliance.py` - Compliance
- `streamlit-app/lib/agents/analise_sentenca.py` - Análise Sentença

### 3️⃣ Integrações Básicas (Dias 6-7)
- `streamlit-app/lib/integrations/redis_client.py` - Cliente Redis/Upstash
- `streamlit-app/lib/integrations/gemini_client.py` - Cliente Gemini AI
- `streamlit-app/backend/cron_jobs.py` - APScheduler (5 jobs)

---

## 🚀 COMANDOS PARA ESTE CHAT

```bash
# Ambiente
cd streamlit-app
source venv/bin/activate

# Instalar dependências backend
pip install fastapi uvicorn redis httpx
pip install langchain langchain-google-genai
pip install pandas numpy
pip install python-dotenv apscheduler

# Executar backend
cd backend
python main.py
# Ou: uvicorn main:app --reload --port 8000

# Testar endpoints
curl http://localhost:8000/api/health
curl http://localhost:8000/api/agents
curl -X POST http://localhost:8000/api/agents/process-task \
  -H "Content-Type: application/json" \
  -d '{"agentId": "harvey", "task": "Analisar caso"}'

# Testes
pytest tests/backend/
```

---

## 📝 TEMPLATES DE CÓDIGO

### Backend Main.py
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers import health, processes, agents, expedientes, metrics

app = FastAPI(
    title="Assistente Jurídico API",
    version="2.0.0",
    description="Backend 100% Python com FastAPI + LangChain"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(processes.router, prefix="/api", tags=["processes"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(expedientes.router, prefix="/api", tags=["expedientes"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

### Base Agent
```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from typing import List

class BaseAgent:
    """Classe base para todos os agentes LangChain"""

    def __init__(self, agent_id: str, name: str, role: str):
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            temperature=0.7
        )
        self.memory = ConversationBufferMemory()

    def create_executor(self, tools: List, prompt: str) -> AgentExecutor:
        """Cria executor do agente"""
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

    async def execute(self, task: str) -> dict:
        """Executa tarefa"""
        raise NotImplementedError("Subclasse deve implementar execute()")
```

### Router de Agentes
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from lib.agents import harvey, justine, redacao, pesquisa
import time

router = APIRouter()

class AgentTask(BaseModel):
    agentId: str
    task: str
    context: dict = {}

@router.get("/agents")
async def list_agents():
    """Lista todos os agentes disponíveis"""
    return {
        "agents": [
            {"id": "harvey", "name": "Harvey Specter", "status": "active"},
            {"id": "justine", "name": "Mrs. Justin-e", "status": "active"},
            {"id": "redacao", "name": "Redator Jurídico", "status": "active"},
            {"id": "pesquisa", "name": "Pesquisador", "status": "active"},
            # ... outros 12 agentes
        ],
        "total": 16
    }

@router.post("/agents/process-task")
async def process_task(task: AgentTask):
    """Executa tarefa em um agente específico"""
    start_time = time.time()

    # Mapear agente
    agents_map = {
        "harvey": harvey.HarveyAgent(),
        "justine": justine.JustineAgent(),
        "redacao": redacao.RedacaoAgent(),
        "pesquisa": pesquisa.PesquisaAgent(),
    }

    agent = agents_map.get(task.agentId)
    if not agent:
        raise HTTPException(status_code=404, detail="Agente não encontrado")

    # Executar
    result = await agent.execute(task.task)

    return {
        "agentId": task.agentId,
        "response": result,
        "processingTime": int((time.time() - start_time) * 1000),
        "status": "completed"
    }
```

---

## ✅ CHECKLIST DE ENTREGA (SEMANA 1)

### Dia 1: Setup
- [ ] Ambiente virtual criado e ativado
- [ ] Dependências instaladas (requirements.txt)
- [ ] Variáveis .env configuradas
- [ ] Estrutura de pastas criada

### Dia 2-3: Backend FastAPI
- [ ] `main.py` funcionando
- [ ] 8 routers criados
- [ ] Cliente Redis conectado
- [ ] Endpoints respondendo
- [ ] Swagger docs em /docs

### Dia 4-5: Agentes LangChain
- [ ] BaseAgent implementado
- [ ] 16 agentes criados
- [ ] Tools específicas implementadas
- [ ] Prompts otimizados
- [ ] Memória de conversação OK

### Dia 6-7: Integrações
- [ ] Redis client funcionando
- [ ] Gemini API conectada
- [ ] APScheduler configurado
- [ ] 5 cron jobs definidos
- [ ] Testes básicos passando

### Final Semana 1
- [ ] Backend rodando em http://localhost:8000
- [ ] Swagger docs acessível em /docs
- [ ] 16 agentes respondendo
- [ ] Redis persistindo dados
- [ ] Logs estruturados
- [ ] Pronto para integrar com frontend (Chat 2)

---

## 🔗 COORDENAÇÃO COM OUTROS CHATS

### Com Chat 2 (Frontend):
- Garantir que endpoints retornem JSON no formato esperado
- Documentar estrutura de dados (Process, Expediente, etc)
- Testar CORS para localhost:8501

### Com Chat 3 (Automações):
- Criar routers stub para DJEN/PJe
- Preparar estrutura para receber scrapers Selenium
- Definir interface de comunicação

---

## 📚 DOCUMENTOS DE REFERÊNCIA

- **Plano completo:** `PLANO_MIGRACAO_ACELERADA_PYTHON.md`
- **Instruções gerais:** `.github/copilot-instructions.md`
- **⚠️ MAPEAMENTO DE FUNCIONALIDADES:** `MAPEAMENTO_FUNCIONALIDADES.md` ⭐ **LEIA ANTES DE IMPLEMENTAR**
- **Código existente:** `streamlit-app/` (80% pronto)
- **Sistema atual:** `src/` e `api/` (para referência de funcionalidades)

---

## 🚨 REGRAS IMPORTANTES

1. **⚠️ CONSULTAR MAPEAMENTO** - Ler `MAPEAMENTO_FUNCIONALIDADES.md` ANTES de implementar
2. **Preservar TODAS as funcionalidades** - Nada pode ser perdido
3. **Compatibilidade de API** - JSON response idêntico ao Node.js
4. **IDs exatos de agentes** - "harvey", "justine", etc (não mudar)
5. **Enum AgentTaskType completo** - Todos os 15 tipos de tarefa
6. **Sempre usar type hints** - `def func(arg: str) -> dict:`
7. **Docstrings obrigatórias** - Google Style
8. **PEP 8 rigoroso** - Use black formatter
9. **Imports absolutos** - `from streamlit_app.lib.agents import...`
10. **Async quando possível** - Para I/O bound
11. **Testar localmente** - Antes de marcar como completo
12. **Logs estruturados** - logger.info/error/warning
13. **Error handling** - try/except em todas as APIs

---

**Status:** ⏳ Aguardando início da Semana 1
**Responsável:** Chat 1 - Backend e Agentes
**Contato com:** Chat 2 (Frontend) e Chat 3 (Automações)
