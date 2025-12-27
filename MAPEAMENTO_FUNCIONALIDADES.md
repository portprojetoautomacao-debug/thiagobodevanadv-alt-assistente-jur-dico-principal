# 🔄 MAPEAMENTO DE FUNCIONALIDADES - React/Node.js → Python/Streamlit

**Data:** 27/12/2025
**Objetivo:** Garantir que NENHUMA funcionalidade seja perdida na migração

---

## 📊 FUNCIONALIDADES CORE DO SISTEMA ATUAL

### 1️⃣ GESTÃO DE PROCESSOS

#### Funcionalidades Atuais (React/Node.js)
```typescript
// src/types.ts
interface Process {
  id: string;
  numeroCNJ: string;
  titulo: string;
  autor: string;
  reu: string;
  comarca: string;
  vara: string;
  status: "ativo" | "suspenso" | "arquivado" | "concluido";
  fase?: string;
  valor?: number;
  valorCausa?: number;
  dataDistribuicao: string;
  dataUltimaMovimentacao: string;
  notas?: string;
  prazos: Prazo[];
  expedientesCount?: number;
  intimacoesCount?: number;
  minutasCount?: number;
  documentosCount?: number;
}
```

#### Implementação Python (Preservar)
```python
# streamlit-app/lib/models/process.py
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class Process:
    """Modelo de Processo - compatível com sistema atual"""
    id: str
    numero_cnj: str
    titulo: str
    autor: str
    reu: str
    comarca: str
    vara: str
    status: str  # "ativo" | "suspenso" | "arquivado" | "concluido"
    fase: Optional[str] = None
    valor: Optional[float] = None
    valor_causa: Optional[float] = None  # Sincronizado com valor
    data_distribuicao: datetime
    data_ultima_movimentacao: datetime
    notas: Optional[str] = None
    prazos: List['Prazo'] = None
    expedientes_count: int = 0
    intimacoes_count: int = 0
    minutas_count: int = 0
    documentos_count: int = 0
    created_at: datetime = None
    updated_at: datetime = None

    # Métodos do sistema atual
    def to_dict(self) -> dict:
        """Converter para dicionário (compatível com API)"""
        return {
            "id": self.id,
            "numeroCNJ": self.numero_cnj,  # Manter nome original da API
            "titulo": self.titulo,
            "autor": self.autor,
            "reu": self.reu,
            "comarca": self.comarca,
            "vara": self.vara,
            "status": self.status,
            "valor": self.valor,
            "valorCausa": self.valor_causa,
            # ... todos os campos
        }
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Manter TODOS os campos do tipo Process
- ✅ Preservar nomes de API (numeroCNJ, valorCausa)
- ✅ Manter contadores automáticos (expedientesCount, etc)
- ✅ Sincronização valor ↔ valorCausa

---

### 2️⃣ GESTÃO DE PRAZOS

#### Funcionalidades Atuais
```typescript
// src/types.ts
interface Prazo {
  id: string;
  processId: string;
  descricao: string;
  dataInicio: string;
  diasCorridos: number;
  tipoPrazo: "cpc" | "clt";
  dataFinal: string;
  concluido: boolean;
  urgente: boolean;
  createdAt: string;
}

// src/lib/prazos.ts - Cálculos complexos
- calcularDiasRestantes(dataFinal): number
- isUrgente(diasRestantes): boolean
- calcularPrazoProcessual(dataInicio, dias, tipo): Date
- contarDiasUteis(dataInicio, dataFim): number
- ignorarFeriados(data): boolean
```

#### Implementação Python (Preservar)
```python
# streamlit-app/lib/utils/prazos.py
from datetime import datetime, timedelta
from typing import List, Dict
import pandas as pd

class GestorPrazos:
    """Gestão de prazos processuais - compatível com sistema atual"""

    FERIADOS_NACIONAIS = [
        "2025-01-01",  # Ano Novo
        "2025-04-18",  # Paixão de Cristo
        # ... todos os feriados
    ]

    @staticmethod
    def calcular_dias_restantes(data_final: str) -> int:
        """Calcular dias restantes até o prazo"""
        hoje = datetime.now().date()
        final = datetime.strptime(data_final, "%Y-%m-%d").date()
        return (final - hoje).days

    @staticmethod
    def is_urgente(dias_restantes: int) -> bool:
        """Verificar se prazo é urgente (<= 2 dias)"""
        return dias_restantes <= 2

    @staticmethod
    def calcular_prazo_processual(
        data_inicio: str,
        dias: int,
        tipo_prazo: str = "cpc"
    ) -> str:
        """
        Calcular prazo processual considerando dias úteis
        tipo_prazo: "cpc" (dias úteis) ou "clt" (dias corridos)
        """
        inicio = datetime.strptime(data_inicio, "%Y-%m-%d").date()

        if tipo_prazo == "clt":
            # Dias corridos
            final = inicio + timedelta(days=dias)
        else:
            # Dias úteis (CPC)
            final = GestorPrazos._adicionar_dias_uteis(inicio, dias)

        return final.strftime("%Y-%m-%d")

    @staticmethod
    def _adicionar_dias_uteis(data_inicio: date, dias: int) -> date:
        """Adicionar dias úteis (pula fins de semana e feriados)"""
        data_atual = data_inicio
        dias_adicionados = 0

        while dias_adicionados < dias:
            data_atual += timedelta(days=1)

            # Pular fins de semana (5=Sábado, 6=Domingo)
            if data_atual.weekday() in [5, 6]:
                continue

            # Pular feriados
            if data_atual.strftime("%Y-%m-%d") in GestorPrazos.FERIADOS_NACIONAIS:
                continue

            dias_adicionados += 1

        return data_atual

    @staticmethod
    def listar_prazos_urgentes(processos: List[Dict]) -> pd.DataFrame:
        """Listar todos os prazos urgentes (compatível com Dashboard)"""
        prazos_urgentes = []

        for processo in processos:
            for prazo in processo.get('prazos', []):
                if not prazo.get('concluido'):
                    dias = GestorPrazos.calcular_dias_restantes(prazo['dataFinal'])
                    if GestorPrazos.is_urgente(dias):
                        prazos_urgentes.append({
                            'processo': processo['numeroCNJ'],
                            'descricao': prazo['descricao'],
                            'dataFinal': prazo['dataFinal'],
                            'diasRestantes': dias
                        })

        return pd.DataFrame(prazos_urgentes)
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Preservar lógica de cálculo de dias úteis
- ✅ Manter lista de feriados nacionais
- ✅ Suportar tipos "cpc" e "clt"
- ✅ Alertas de prazos urgentes (<= 2 dias)
- ✅ Compatibilidade com Dashboard

---

### 3️⃣ 16 AGENTES IA

#### Agentes Atuais (TypeScript - STUBS)
```typescript
// src/lib/agents.ts
export const AGENTS = [
  { id: "harvey", name: "Harvey Specter", capabilities: ["strategic-analysis"] },
  { id: "justine", name: "Mrs. Justin-e", capabilities: ["analyze-intimation", "deadline-calculation"] },
  { id: "redacao-peticoes", capabilities: ["draft-petition", "legal-writing"] },
  { id: "pesquisa-juris", capabilities: ["research-precedents", "legal-search"] },
  { id: "analise-documental", capabilities: ["analyze-document", "extract-data"] },
  { id: "monitor-djen", capabilities: ["monitor-publications", "djen-scraping"] },
  { id: "gestao-prazos", capabilities: ["deadline-calculation", "deadline-alerts"] },
  { id: "organizacao-arquivos", capabilities: ["organize-files", "indexing"] },
  { id: "analise-risco", capabilities: ["risk-analysis", "prediction"] },
  { id: "revisao-contratual", capabilities: ["contract-review", "compliance"] },
  { id: "comunicacao-clientes", capabilities: ["client-communication", "reporting"] },
  { id: "financeiro", capabilities: ["billing-analysis", "financial-management"] },
  { id: "estrategia-processual", capabilities: ["case-strategy", "planning"] },
  { id: "traducao-juridica", capabilities: ["legal-translation", "terminology"] },
  { id: "compliance", capabilities: ["compliance-check", "lgpd"] },
  { id: "analise-sentenca", capabilities: ["sentiment-analysis", "nlp"] }
];

// api/agents.ts - Tipos de tarefa
export enum AgentTaskType {
  ANALYZE_DOCUMENT = "analyze_document",
  ANALYZE_INTIMATION = "analyze_intimation",
  MONITOR_DJEN = "monitor_djen",
  CALCULATE_DEADLINE = "calculate_deadline",
  DRAFT_PETITION = "draft_petition",
  CHECK_DATAJUD = "check_datajud",
  ORGANIZE_FILES = "organize_files",
  RESEARCH_PRECEDENTS = "research_precedents",
  RISK_ANALYSIS = "risk_analysis",
  CONTRACT_REVIEW = "contract_review",
  CLIENT_COMMUNICATION = "client_communication",
  BILLING_ANALYSIS = "billing_analysis",
  CASE_STRATEGY = "case_strategy",
  LEGAL_TRANSLATION = "legal_translation",
  COMPLIANCE_CHECK = "compliance_check"
}
```

#### Implementação Python (REAL - LangChain)
```python
# streamlit-app/lib/agents/registry.py
from enum import Enum
from typing import List, Dict, Optional

class AgentTaskType(Enum):
    """Tipos de tarefa - compatível com sistema atual"""
    ANALYZE_DOCUMENT = "analyze_document"
    ANALYZE_INTIMATION = "analyze_intimation"
    MONITOR_DJEN = "monitor_djen"
    CALCULATE_DEADLINE = "calculate_deadline"
    DRAFT_PETITION = "draft_petition"
    CHECK_DATAJUD = "check_datajud"
    ORGANIZE_FILES = "organize_files"
    RESEARCH_PRECEDENTS = "research_precedents"
    RISK_ANALYSIS = "risk_analysis"
    CONTRACT_REVIEW = "contract_review"
    CLIENT_COMMUNICATION = "client_communication"
    BILLING_ANALYSIS = "billing_analysis"
    CASE_STRATEGY = "case_strategy"
    LEGAL_TRANSLATION = "legal_translation"
    COMPLIANCE_CHECK = "compliance_check"

class AgentRegistry:
    """Registry de agentes - compatível com API atual"""

    AGENTS = [
        {
            "id": "harvey",
            "name": "Harvey Specter",
            "role": "Estrategista-chefe",
            "capabilities": ["strategic-analysis", "risk-assessment"],
            "task_types": [AgentTaskType.CASE_STRATEGY, AgentTaskType.RISK_ANALYSIS]
        },
        {
            "id": "justine",
            "name": "Mrs. Justin-e",
            "role": "Análise de intimações",
            "capabilities": ["analyze-intimation", "deadline-calculation"],
            "task_types": [AgentTaskType.ANALYZE_INTIMATION, AgentTaskType.CALCULATE_DEADLINE]
        },
        # ... todos os 16 agentes
    ]

    @classmethod
    def get_agent_by_id(cls, agent_id: str) -> Optional[Dict]:
        """Buscar agente por ID (compatível com API)"""
        return next((a for a in cls.AGENTS if a["id"] == agent_id), None)

    @classmethod
    def get_agents_by_capability(cls, capability: str) -> List[Dict]:
        """Buscar agentes por capacidade"""
        return [a for a in cls.AGENTS if capability in a["capabilities"]]

    @classmethod
    def find_best_agent_for_task(cls, task_description: str) -> Optional[Dict]:
        """Descoberta automática de agente por descrição de tarefa"""
        task_lower = task_description.lower()

        if "intimação" in task_lower or "prazo" in task_lower:
            return cls.get_agent_by_id("justine")
        elif "petição" in task_lower or "minuta" in task_lower:
            return cls.get_agent_by_id("redacao-peticoes")
        elif "jurisprudência" in task_lower or "precedente" in task_lower:
            return cls.get_agent_by_id("pesquisa-juris")
        # ... lógica de descoberta

        return None
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Manter TODOS os 16 agentes
- ✅ Preservar IDs exatos ("harvey", "justine", etc)
- ✅ Manter capabilities de cada agente
- ✅ Preservar tipos de tarefa (AgentTaskType)
- ✅ Implementar descoberta automática de agente
- ✅ LangChain REAL (não stubs)

---

### 4️⃣ EXPEDIENTES E INTIMAÇÕES

#### Funcionalidades Atuais
```typescript
// src/types.ts
export type TipoExpediente = "intimacao" | "citacao" | "documento" | "outro";

interface Expediente {
  id: string;
  processId?: string;
  tipo: TipoExpediente;
  titulo?: string;
  conteudo?: string;
  descricao?: string;
  dataRecebimento?: string;
  prazoFatal?: string;
  deadline?: string | {
    days?: number;
    type?: "úteis" | "corridos";
    startDate?: string;
    endDate?: string;
    description?: string;
  };
  lido?: boolean;
  arquivado?: boolean;
  analyzed?: boolean;
  processado?: boolean;
  urgente?: boolean;
  // Campos de análise automática
  agentAnalysis?: {
    summary?: string;
    keyPoints?: string[];
    suggestedActions?: string[];
    urgencyLevel?: "low" | "medium" | "high" | "critical";
  };
}
```

#### Implementação Python (Preservar)
```python
# streamlit-app/lib/models/expediente.py
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Union

@dataclass
class DeadlineInfo:
    """Informações de prazo do expediente"""
    days: Optional[int] = None
    type: Optional[str] = None  # "úteis" | "corridos"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

@dataclass
class AgentAnalysis:
    """Análise automática do agente"""
    summary: Optional[str] = None
    key_points: List[str] = field(default_factory=list)
    suggested_actions: List[str] = field(default_factory=list)
    urgency_level: str = "medium"  # "low" | "medium" | "high" | "critical"

@dataclass
class Expediente:
    """Modelo de Expediente - compatível com sistema atual"""
    id: str
    process_id: Optional[str] = None
    tipo: str = "outro"  # "intimacao" | "citacao" | "documento" | "outro"
    titulo: Optional[str] = None
    conteudo: Optional[str] = None
    descricao: Optional[str] = None
    data_recebimento: Optional[datetime] = None
    prazo_fatal: Optional[str] = None
    deadline: Optional[Union[str, DeadlineInfo]] = None
    lido: bool = False
    arquivado: bool = False
    analyzed: bool = False
    processado: bool = False
    urgente: bool = False
    agent_analysis: Optional[AgentAnalysis] = None

    def to_dict(self) -> dict:
        """Converter para dicionário (compatível com API)"""
        return {
            "id": self.id,
            "processId": self.process_id,
            "tipo": self.tipo,
            "titulo": self.titulo,
            "conteudo": self.conteudo,
            "dataRecebimento": self.data_recebimento.isoformat() if self.data_recebimento else None,
            "prazoFatal": self.prazo_fatal,
            "lido": self.lido,
            "arquivado": self.arquivado,
            "analyzed": self.analyzed,
            "urgente": self.urgente,
            # ... todos os campos
        }
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Suportar 4 tipos de expediente
- ✅ Preservar campos de análise automática
- ✅ Manter estrutura de deadline (str ou objeto)
- ✅ Estados (lido, arquivado, analyzed, processado)
- ✅ Análise automática pelo agente Justin-e

---

### 5️⃣ CRON JOBS E AUTOMAÇÕES

#### Jobs Atuais (vercel.json + api/cron.ts)
```typescript
// api/cron.ts
const CRON_ACTIONS = {
  "daily-reset": handleDailyReset,          // 00:00 UTC
  "djen-monitor": handleDJENMonitor,        // 12:00 e 20:00 UTC
  "process-queue": handleProcessQueue,      // A cada 15min
  "calendar-sync": handleCalendarSync,      // A cada 2h
  "deadline-alerts": handleDeadlineAlerts,  // 11:55 UTC
  "watchdog": handleWatchdog,               // A cada 30min
  "check-datajud": handleDataJud,           // 16:00 UTC
  "backup": handleBackup                    // 03:00 UTC
};

// Funcionalidades de cada job:
// 1. daily-reset: Reset contadores agentes
// 2. djen-monitor: Scraping DJEN 2x/dia
// 3. process-queue: Processar fila de agentes
// 4. calendar-sync: Sincronizar Google Calendar
// 5. deadline-alerts: Alertas de prazos
// 6. watchdog: Reset agentes travados
// 7. check-datajud: Buscar movimentações DataJud
// 8. backup: Backup Redis
```

#### Implementação Python (APScheduler)
```python
# streamlit-app/backend/cron_jobs.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging

logger = logging.getLogger(__name__)

class CronJobsManager:
    """Gerenciador de cron jobs - compatível com sistema atual"""

    def __init__(self):
        self.scheduler = BackgroundScheduler(timezone='America/Sao_Paulo')
        self.jobs = {}

    def start(self):
        """Iniciar TODOS os jobs do sistema atual"""

        # Job 1: Daily Reset (00:00 UTC)
        self.scheduler.add_job(
            self.daily_reset,
            CronTrigger(hour='0', minute='0'),
            id='daily_reset',
            name='Daily Reset'
        )

        # Job 2: DJEN Monitor (12:00 e 20:00 UTC = 09:00 e 17:00 BRT)
        self.scheduler.add_job(
            self.djen_monitor,
            CronTrigger(hour='12,20', minute='0'),
            id='djen_monitor',
            name='DJEN Monitor'
        )

        # Job 3: Process Queue (15min)
        self.scheduler.add_job(
            self.process_queue,
            'interval',
            minutes=15,
            id='process_queue',
            name='Process Agent Queue'
        )

        # Job 4: Calendar Sync (2h)
        self.scheduler.add_job(
            self.calendar_sync,
            'interval',
            hours=2,
            id='calendar_sync',
            name='Calendar Sync'
        )

        # Job 5: Deadline Alerts (11:55 UTC)
        self.scheduler.add_job(
            self.deadline_alerts,
            CronTrigger(hour='11', minute='55'),
            id='deadline_alerts',
            name='Deadline Alerts'
        )

        # Job 6: Watchdog (30min)
        self.scheduler.add_job(
            self.watchdog,
            'interval',
            minutes=30,
            id='watchdog',
            name='Watchdog'
        )

        # Job 7: DataJud (16:00 UTC)
        self.scheduler.add_job(
            self.check_datajud,
            CronTrigger(hour='16', minute='0'),
            id='check_datajud',
            name='Check DataJud'
        )

        # Job 8: Backup (03:00 UTC)
        self.scheduler.add_job(
            self.backup,
            CronTrigger(hour='3', minute='0'),
            id='backup',
            name='Backup'
        )

        self.scheduler.start()
        logger.info("✅ Todos os 8 cron jobs iniciados")

    async def daily_reset(self):
        """Reset diário de contadores"""
        logger.info("🔄 Daily Reset executando...")
        # Implementar lógica do sistema atual

    async def djen_monitor(self):
        """Monitor DJEN 2x/dia"""
        logger.info("📰 DJEN Monitor executando...")
        from lib.integrations.djen import DJENScraper
        scraper = DJENScraper()
        publicacoes = await scraper.buscar_novas_publicacoes()
        logger.info(f"✅ {len(publicacoes)} publicações encontradas")

    # ... implementar TODOS os 8 jobs
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Preservar TODOS os 8 cron jobs
- ✅ Manter horários exatos (UTC)
- ✅ Mesma lógica de cada job
- ✅ Logs estruturados
- ✅ Error handling

---

### 6️⃣ INTEGRAÇÕES EXTERNAS

#### Integrações Atuais
```typescript
// Sistema atual tem:
1. DJEN (Diário de Justiça Eletrônico Nacional)
2. DataJud (API CNJ)
3. PJe (via Chrome Extension)
4. Google Calendar OAuth
5. Upstash Redis/KV
6. Google Gemini AI
7. Qdrant (Vector DB - opcional)
8. Email (Resend - opcional)
```

#### Implementação Python
```python
# streamlit-app/lib/integrations/__init__.py
"""
Integrações externas - compatíveis com sistema atual

OBRIGATÓRIAS:
- djen.py: Scraping DJEN com Selenium
- datajud.py: API DataJud do CNJ
- pje.py: Scraping PJe com Selenium (substitui Extension)
- google_calendar.py: Google Calendar API
- redis_client.py: Upstash Redis
- gemini_client.py: Google Gemini via LangChain

OPCIONAIS:
- qdrant_client.py: Qdrant Vector DB
- email_client.py: Envio de emails
"""

# CADA integração deve:
# 1. Manter mesma interface da versão TypeScript
# 2. Retornar dados no mesmo formato
# 3. Error handling compatível
# 4. Logs estruturados
```

**REGRAS DE MIGRAÇÃO:**
- ✅ Todas as integrações obrigatórias
- ✅ APIs com mesmos endpoints
- ✅ Formato de dados compatível
- ✅ Selenium substitui Chrome Extension
- ✅ Credenciais via .env

---

## 📋 CHECKLIST DE PRESERVAÇÃO

### Dados e Modelos
- [ ] Process (todos os campos)
- [ ] Prazo (cálculos complexos)
- [ ] Expediente (tipos e análises)
- [ ] Minuta (templates e variáveis)
- [ ] Agent (16 agentes completos)
- [ ] AgentTask (tipos e prioridades)
- [ ] Notification (tipos e ações)
- [ ] FinancialEntry (receitas/despesas)

### Funcionalidades
- [ ] Cálculo de prazos (CPC e CLT)
- [ ] Dias úteis vs corridos
- [ ] Feriados nacionais
- [ ] Alertas de prazos urgentes
- [ ] Análise automática de intimações
- [ ] Geração de minutas
- [ ] Pesquisa jurisprudencial
- [ ] Organização de documentos
- [ ] Análise de risco
- [ ] Comunicação com clientes

### Integrações
- [ ] DJEN Scraping (2x/dia)
- [ ] DataJud API (1x/dia)
- [ ] PJe Selenium (login + protocolo)
- [ ] Google Calendar sync (2h)
- [ ] Upstash Redis (persistência)
- [ ] Gemini AI (LangChain)
- [ ] Qdrant (opcional)

### Cron Jobs
- [ ] daily-reset (00:00)
- [ ] djen-monitor (12:00, 20:00)
- [ ] process-queue (15min)
- [ ] calendar-sync (2h)
- [ ] deadline-alerts (11:55)
- [ ] watchdog (30min)
- [ ] check-datajud (16:00)
- [ ] backup (03:00)

### Estados e Contadores
- [ ] Status de processos (4 estados)
- [ ] Status de tarefas (6 estados)
- [ ] Prioridades (4 níveis)
- [ ] Contadores automáticos (expedientes, minutas, etc)
- [ ] Flags booleanos (lido, arquivado, urgente, etc)

---

## 🚨 REGRAS CRÍTICAS

1. **Compatibilidade de API**: Endpoints Python devem retornar JSON idêntico ao Node.js
2. **Nomes de campos**: Manter camelCase nas APIs, snake_case internamente
3. **IDs de agentes**: Preservar exatos ("harvey", "justine", etc)
4. **Tipos de tarefa**: Enum AgentTaskType completo
5. **Cálculo de prazos**: Lógica exata de dias úteis
6. **Horários de cron**: UTC conforme vercel.json
7. **Estrutura de dados**: JSON Schema compatível

---

**Criado em:** 27/12/2025
**Para:** Chats 1, 2 e 3 do Copilot
**Status:** 📋 Documento de Referência Obrigatória
