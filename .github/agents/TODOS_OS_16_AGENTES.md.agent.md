# 🤖 Sistema de 15 Agentes IA - Configuração Completa

## 📌 Visão Geral do Sistema (Atualizado: 24/12/2025)

O Assistente Jurídico PJe possui **15 agentes especializados**, dos quais:
- **9 agentes ativos 24/7** (fluxo automático de análise)
- **6 agentes sob demanda** (ativação manual)
- **9 agentes com arquitetura híbrida** (LangGraph + Traditional)

---

## 🎯 Agentes Ativos (Automáticos - 24/7)

### 1. **Harvey Specter** (`harvey`)
- **Tipo**: Strategic Advisor
- **Função**: Análise estratégica global do escritório
- **Capacidades**: `strategic-analysis`, `performance-monitoring`, `risk-identification`, `data-analysis`
- **Híbrido**: ✅ Sim
- **Uso**: Dashboard principal, relatórios executivos

### 2. **Mrs. Justin-e** (`justine`)
- **Tipo**: Intimation Analyzer
- **Função**: Análise automática de intimações e prazos
- **Capacidades**: `intimation-analysis`, `deadline-identification`, `task-generation`, `priority-assessment`
- **Híbrido**: ✅ Sim
- **Uso**: Processa intimações do DJEN/DataJud/PJe automaticamente

### 3. **Análise Documental** (`analise-documental`)
- **Tipo**: Document Analyzer
- **Função**: Análise de expedientes e documentos processuais
- **Capacidades**: `document-analysis`, `text-extraction`, `entity-recognition`, `classification`
- **Híbrido**: ✅ Sim
- **Uso**: Processa documentos novos automaticamente

### 4. **Monitor DJEN** (`monitor-djen`)
- **Tipo**: Publication Monitor
- **Função**: Monitoramento do Diário de Justiça Eletrônico Nacional
- **Capacidades**: `djen-monitoring`, `publication-detection`, `notification`, `datajud-integration`
- **Híbrido**: ✅ Sim
- **Uso**: Verifica publicações diárias (cron configurado)

### 5. **Gestão de Prazos** (`gestao-prazos`)
- **Tipo**: Deadline Calculator
- **Função**: Cálculo e gestão de prazos processuais
- **Capacidades**: `deadline-calculation`, `business-days`, `holiday-detection`, `alert-generation`
- **Híbrido**: ✅ Sim
- **Uso**: Calcula prazos e gera alertas automáticos

### 6. **Redação de Petições** (`redacao-peticoes`)
- **Tipo**: Legal Writer
- **Função**: Criação de petições e documentos jurídicos
- **Capacidades**: `document-drafting`, `legal-writing`, `template-generation`, `precedent-integration`
- **Híbrido**: ✅ Sim
- **Uso**: Gera minutas automaticamente com Gemini 2.5

### 7. **Pesquisa Jurisprudencial** (`pesquisa-juris`)
- **Tipo**: Legal Researcher
- **Função**: Busca de precedentes e jurisprudências
- **Capacidades**: `jurisprudence-search`, `precedent-analysis`, `case-law-research`, `trend-analysis`
- **Híbrido**: ✅ Sim (com Qdrant para busca vetorial)
- **Uso**: Fundamenta petições com jurisprudência

### 8. **Análise de Risco** (`analise-risco`)
- **Tipo**: Risk Analyzer
- **Função**: Avaliação de riscos processuais
- **Capacidades**: `risk-assessment`, `probability-analysis`, `financial-impact`, `mitigation-strategies`
- **Híbrido**: ✅ Sim
- **Uso**: Avalia viabilidade de casos

### 9. **Estratégia Processual** (`estrategia-processual`)
- **Tipo**: Strategy Advisor
- **Função**: Sugestão de estratégias baseadas em dados
- **Capacidades**: `strategic-planning`, `option-analysis`, `cost-benefit`, `success-probability`
- **Híbrido**: ✅ Sim
- **Uso**: Define melhor caminho processual

---

## ⏸️ Agentes Sob Demanda (Ativação Manual)

### 10. **Organização de Arquivos** (`organizacao-arquivos`)
- **Tipo**: File Organizer
- **Função**: Organização e categorização de documentos
- **Capacidades**: `file-organization`, `categorization`, `indexing`, `duplicate-detection`
- **Híbrido**: ❌ Não
- **Uso**: Limpar e organizar arquivos quando necessário

### 11. **Revisão Contratual** (`revisao-contratual`)
- **Tipo**: Contract Reviewer
- **Função**: Análise de contratos
- **Capacidades**: `contract-analysis`, `clause-review`, `compliance-check`, `risk-identification`
- **Híbrido**: ❌ Não
- **Uso**: Revisar contratos manualmente

### 12. **Comunicação com Clientes** (`comunicacao-clientes`)
- **Tipo**: Client Communicator
- **Função**: Geração de comunicações para clientes
- **Capacidades**: `client-communication`, `report-generation`, `language-simplification`, `personalization`
- **Híbrido**: ❌ Não
- **Uso**: Gerar relatórios e comunicados

### 13. **Análise Financeira** (`financeiro`)
- **Tipo**: Financial Analyzer
- **Função**: Monitoramento de faturamento
- **Capacidades**: `financial-monitoring`, `profitability-analysis`, `receivables-tracking`, `metrics-calculation`
- **Híbrido**: ❌ Não
- **Uso**: Análises financeiras sob demanda

### 14. **Tradução Jurídica** (`traducao-juridica`)
- **Tipo**: Legal Translator
- **Função**: Tradução de termos técnicos
- **Capacidades**: `legal-translation`, `term-explanation`, `glossary-creation`, `language-adaptation`
- **Híbrido**: ❌ Não
- **Uso**: Explicar termos jurídicos

### 15. **Compliance** (`compliance`)
- **Tipo**: Compliance Checker
- **Função**: Verificação de conformidade LGPD
- **Capacidades**: `compliance-check`, `lgpd-verification`, `ethics-review`, `regulatory-audit`
- **Híbrido**: ❌ Não
- **Uso**: Auditorias de conformidade

---

## 🔄 Arquitetura Híbrida (LangGraph + Traditional)

### Agentes com Versão Híbrida
Os 9 agentes marcados com ✅ possuem:

1. **Versão Tradicional**: Execução rápida, baixa latência
2. **Versão LangGraph**: Workflows complexos, state machines
3. **Fallback Automático**: Se LangGraph falha, usa tradicional
4. **Métricas de Performance**: Tracking de execuções e fallbacks

### Configuração de Fallback
```typescript
{
  enableFallback: true,
  maxRetries: 3,
  fallbackThreshold: 0.8, // 80% confiança mínima
  logFallbacks: true
}
```

---

## 📊 Tipos de Tarefas Suportadas

```typescript
type TarefaSistemaTipo =
  | "IMPORTAR_INTIMACOES"
  | "CRIAR_MINUTA"
  | "ANALISAR_PRAZO"
  | "ATUALIZAR_STATUS_PROCESSO"
  | "ENVIAR_RESUMO_DIARIO"
  | "CALCULATE_DEADLINE"
  | "RESEARCH_PRECEDENTS"
  | "CLIENT_COMMUNICATION"
  | "CHECK_DATAJUD"
  | "RISK_ANALYSIS"
  | "BILLING_ANALYSIS"
  | "ORGANIZE_FILES"
  | "COMPLIANCE_CHECK"
  | "LEGAL_TRANSLATION"
  | "CONTRACT_REVIEW"
  | "CASE_STRATEGY"
  | "DRAFT_PETITION"
  | "ANALYZE_DOCUMENT"
  | "ANALYZE_INTIMATION"
  | "MONITOR_DJEN"
  | "SYNC_CALENDAR"
  | "SEND_NOTIFICATION";
```

---

## 🚀 Sistema de Retry e Timeout

### Configuração de Retry
- **Base Delay**: 10 segundos
- **Max Delay**: 10 minutos
- **Max Retries**: 3 tentativas
- **Backoff**: Exponencial com jitter (±30%)

### Timeouts
- **Tarefas rápidas**: 30 segundos
- **Tarefas médias**: 2 minutos
- **Tarefas longas**: 5 minutos
- **Grace period**: 5% adicional

### Cleanup Automático (TTL)
- **Tarefas completadas**: 24 horas
- **Tarefas humanas**: 7 dias
- **Timeout cache**: 30 segundos

---

## 📈 Monitoramento e Métricas

### Métricas Disponíveis
```typescript
interface HybridStats {
  totalExecutions: number;
  langgraphExecutions: number;
  traditionalExecutions: number;
  fallbackExecutions: number;
  failedExecutions: number;
  averageLatencyMs: number;
}
```

### Comandos de Gestão
```typescript
// Obter estatísticas
getHybridStats(agentId: AgentId): HybridStats

// Resetar métricas
resetHybridStats(agentId?: AgentId): void

// Listar agentes híbridos
listHybridAgents(): AgentId[]

// Verificar suporte híbrido
hasHybridVersion(agentId: AgentId): boolean
```

---

## 🔧 Integração com Sistema

### Arquivos Principais
- `src/lib/agents.ts` - Tipos e configurações core
- `src/lib/hybrid-agents-integration.ts` - Integração híbrida
- `src/hooks/use-autonomous-agents.ts` - Hook React para UI
- `src/agents/*/` - Implementações específicas

### Fluxo de Execução
1. Tarefa criada (manual, cron, webhook)
2. Sistema verifica se agente tem versão híbrida
3. Tenta LangGraph primeiro (se disponível)
4. Em caso de falha, fallback para tradicional
5. Registra métricas e resultado
6. Cleanup automático após TTL

---

## 📝 Exemplo de Uso

```typescript
import { executeHybridTask, hasHybridVersion } from '@/lib/agents';

// Verificar suporte híbrido
if (hasHybridVersion('justine')) {
  console.log('✅ Agente com versão híbrida');
}

// Executar tarefa
const result = await executeHybridTask({
  agentId: 'justine',
  task: {
    id: 'task-123',
    type: 'ANALYZE_INTIMATION',
    data: { expediente: {...} }
  },
  config: {
    enableFallback: true,
    maxRetries: 3
  }
});

if (result.success) {
  console.log('✅ Tarefa concluída:', result.data);
}
```

---

## 🎯 Prioridades de Tarefas

| Prioridade | Descrição | SLA |
|------------|-----------|-----|
| `critical` | Prazos < 24h, urgências | < 5 min |
| `high` | Prazos < 5 dias | < 30 min |
| `medium` | Trabalho rotineiro | < 2 horas |
| `low` | Backlog, melhorias | < 24 horas |

---

**Última atualização**: 24/12/2025
**Versão do sistema**: 2.0.0 (Arquitetura Híbrida)
