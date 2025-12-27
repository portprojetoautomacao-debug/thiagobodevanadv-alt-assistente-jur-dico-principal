# 🏗️ Arquitetura Unificada - Assistente Jurídico PJe

**Versão:** 2.0 (Unificada)
**Data:** 23/11/2025
**Status:** ✅ Produção

---

## 📋 Visão Geral

Este documento consolida a arquitetura completa do sistema, unificando as implementações V1 (src/lib/agents) e V2 (lib/ai/agents-registry).

---

## 🎯 Arquitetura de Agentes

### Sistema Dual de Agentes

O sistema possui **duas implementações complementares** de agentes:

#### 1. **Agentes Core (src/lib/agents.ts)** - Sistema Operacional
- **Propósito:** Execução e orquestração de tarefas
- **Responsabilidade:** Runtime, state management, task queue
- **Componentes:**
  - `Agent` - Definição de agente com estado
  - `AgentTask` - Tarefas na fila
  - `AgentOrchestrator` - Distribuição e execução
  - `AgentCommunication` - Comunicação entre agentes

#### 2. **Agentes Registry (lib/ai/agents-registry.ts)** - Definições e Prompts
- **Propósito:** Configuração e personalidade dos agentes
- **Responsabilidade:** Prompts, tools, permissões
- **Componentes:**
  - `AgentPersona` - Personalidade e instruções
  - `AGENTS` - Registry com 15 agentes
  - System prompts completos
  - Tool permissions

### Fluxo de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useAutonomousAgents Hook                            │  │
│  │  - Gerencia estado dos agentes                       │  │
│  │  - Task queue management                             │  │
│  │  - UI updates                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Core Agent System (src/lib/)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  agents.ts - Tipos e funções core                    │  │
│  │  - Agent, AgentTask, AgentTaskResult                 │  │
│  │  - processTaskWithAI()                               │  │
│  │  - Human-in-the-loop logic                           │  │
│  │  - Task generator                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  agent-orchestrator.ts                               │  │
│  │  - Task distribution                                 │  │
│  │  - Load balancing                                    │  │
│  │  - Health checks                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  agent-communication.ts                              │  │
│  │  - Inter-agent messaging                             │  │
│  │  - Shared context                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           Agent Registry (lib/ai/)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  agents-registry.ts                                  │  │
│  │  - 15 AgentPersona definitions                       │  │
│  │  - System prompts (Harvey, Justin-e, etc)           │  │
│  │  - Tool permissions                                  │  │
│  │  - Behavioral guidelines                             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  core-agent.ts                                       │  │
│  │  - ReAct pattern implementation                      │  │
│  │  - Execution traces                                  │  │
│  │  - Memory management                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  tools.ts                                            │  │
│  │  - 6 ferramentas API-conectadas                      │  │
│  │  - consultarProcessoPJe                              │  │
│  │  - calcularPrazos                                    │  │
│  │  - criarTarefa                                       │  │
│  │  - buscarIntimacaoPendente                           │  │
│  │  - enviarMensagemWhatsApp                            │  │
│  │  - registrarLogAgente                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend APIs (api/)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  agents-v2.ts - Endpoint principal                   │  │
│  │  - Processa requisições de agentes                   │  │
│  │  - Retorna traces e duração                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  legal-services.ts                                   │  │
│  │  - Deadline calculation                              │  │
│  │  - DJEN monitoring                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  llm-proxy.ts                                        │  │
│  │  - Proxy para Spark LLM (GPT-4o)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Execução de Tarefas

### 1. Criação de Tarefa

```typescript
// Frontend: Usuário ou sistema cria tarefa
addTask({
  id: crypto.randomUUID(),
  agentId: 'harvey',
  type: 'analyze-performance',
  priority: 'high',
  status: 'queued',
  createdAt: new Date().toISOString(),
  data: { period: 'last-30-days' }
})
```

### 2. Orquestração

```typescript
// Core: Orchestrator distribui tarefa
const agent = await orchestrator.distributeTask(task, agents)
// - Verifica capacidades do agente
// - Aplica load balancing
// - Considera prioridade
```

### 3. Verificação Human-in-the-Loop

```typescript
// Core: Verifica se requer revisão humana
if (shouldPauseForHuman(agent, task)) {
  // Pausa para revisão
  // - Tarefas críticas
  // - Múltiplas falhas
  // - Tipos sensíveis
}
```

### 4. Execução

```typescript
// Core: Processa com IA
const result = useRealAI
  ? await processTaskWithRealAI(task, agent)  // Spark LLM
  : await processTaskWithAI(task, agent)      // Simulado
```

### 5. Logging e Métricas

```typescript
// Core: Registra execução
logActivity(agent.id, `Tarefa concluída: ${task.type}`, 'success')
updateMetrics(agent, result)
```

---

## 📦 Estrutura de Diretórios

```
assistente-juridico-p/
├── src/
│   ├── lib/
│   │   ├── agents.ts                    # ✅ Core: Tipos e runtime
│   │   ├── agent-orchestrator.ts        # ✅ Core: Orquestração
│   │   ├── agent-communication.ts       # ✅ Core: Comunicação
│   │   ├── agents/
│   │   │   └── todoist-agent.ts         # ✅ Agente especializado
│   │   ├── djen-monitor-agent.ts        # ✅ Monitor DJEN
│   │   ├── prazos.ts                    # ✅ Cálculo de prazos
│   │   └── real-agent-client.ts         # ✅ Cliente IA real
│   └── hooks/
│       └── use-autonomous-agents.ts     # ✅ Hook React
├── lib/ai/
│   ├── agents-registry.ts               # ✅ Registry: 15 agentes
│   ├── core-agent.ts                    # ✅ Registry: ReAct engine
│   ├── tools.ts                         # ✅ Registry: Ferramentas
│   ├── agent-orchestrator.ts            # ✅ Registry: Orquestração V2
│   └── circuit-breaker.ts               # ✅ Registry: Resiliência
└── api/
    ├── agents-v2.ts                     # ✅ Endpoint principal
    ├── legal-services.ts                # ✅ Serviços jurídicos
    └── llm-proxy.ts                     # ✅ Proxy LLM
```

---

## 🎯 15 Agentes Implementados

### Agentes Ativos (24/7)

| ID | Nome | Arquivo Core | Registry | Status |
|----|------|--------------|----------|--------|
| `harvey` | Harvey Specter | `agents.ts` | `agents-registry.ts` | ✅ Ativo |
| `justine` | Mrs. Justin-e | `agents.ts` | `agents-registry.ts` | ✅ Ativo |
| `analise-documental` | Análise Documental | `agents.ts` | `agents-registry.ts` | ✅ Ativo |
| `monitor-djen` | Monitor DJEN | `djen-monitor-agent.ts` | `agents-registry.ts` | ✅ Ativo |
| `gestao-prazos` | Gestão de Prazos | `prazos.ts` | `agents-registry.ts` | ✅ Ativo |

### Agentes Especializados (Sob Demanda)

| ID | Nome | Arquivo Core | Registry | Status |
|----|------|--------------|----------|--------|
| `redacao-peticoes` | Redação de Petições | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `organizacao-arquivos` | Organização de Arquivos | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `pesquisa-juris` | Pesquisa Jurisprudencial | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `analise-risco` | Análise de Risco | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `revisao-contratual` | Revisão Contratual | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `comunicacao-clientes` | Comunicação com Clientes | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `financeiro` | Análise Financeira | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `estrategia-processual` | Estratégia Processual | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `traducao-juridica` | Tradução Jurídica | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |
| `compliance` | Compliance | `agents.ts` | `agents-registry.ts` | ⏸️ Inativo |

---

## 🔧 Configuração e Uso

### Inicialização

```typescript
// Frontend: Hook inicializa agentes
const {
  agents,           // Lista de agentes com estado
  taskQueue,        // Fila de tarefas
  addTask,          // Adicionar tarefa
  toggleAgent,      // Ativar/desativar
  useRealAI,        // Modo IA real
  toggleRealAI      // Toggle IA real
} = useAutonomousAgents()
```

### Modo IA Real vs Simulado

**Simulado (Padrão):**
- Usa `processTaskWithAI()` do core
- Respostas simuladas baseadas em tipo de tarefa
- Não consome API externa
- Ideal para desenvolvimento

**IA Real:**
- Usa `processTaskWithRealAI()` via Spark LLM
- Consulta registry para prompts e tools
- Respostas contextualizadas e precisas
- Requer configuração de API keys

### Ativação de Agente

```typescript
// Ativar agente especializado
toggleAgent('redacao-peticoes')

// Criar tarefa para agente
addTask({
  id: crypto.randomUUID(),
  agentId: 'redacao-peticoes',
  type: 'draft-petition',
  priority: 'high',
  status: 'queued',
  createdAt: new Date().toISOString(),
  data: {
    processNumber: '1234567-89.2025.8.26.0000',
    petitionType: 'contestacao'
  }
})
```

---

## 📊 Métricas e Monitoramento

### Métricas de Agente

```typescript
agent: {
  tasksCompleted: number    // Total de tarefas concluídas
  tasksToday: number        // Tarefas hoje
  lastActivity: string      // Última atividade
  status: AgentStatus       // Status atual
}
```

### Métricas de Orquestração

```typescript
orchestrator.getMetrics(): {
  totalTasksProcessed: number
  successRate: number
  averageProcessingTime: number
  activeAgents: number
  queuedTasks: number
}
```

### Activity Log

```typescript
activityLog: Array<{
  id: string
  agentId: string
  timestamp: string
  action: string
  result: 'success' | 'warning' | 'error'
}>
```

---

## 🔒 Segurança e Boas Práticas

### Human-in-the-Loop

Tarefas que **sempre** pausam para revisão:
- Prioridade `critical`
- Falhas múltiplas (≥3 tentativas)
- Tipos sensíveis:
  - `petition-filing`
  - `contract-signing`
  - `payment-processing`
  - `client-communication`
  - `legal-advice`

### Retry Logic

```typescript
// Configuração de retry
task: {
  retryCount: number
  maxRetries: number  // Padrão: 3
}

// Backoff exponencial
retryDelay = baseDelay * (2 ^ retryCount)
```

### Circuit Breaker

```typescript
// Proteção de APIs externas
circuitBreaker: {
  states: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
  failureThreshold: 5
  timeout: 60000
  resetTimeout: 30000
}
```

---

## 📚 Documentação Relacionada

- [AGENTS_SYSTEM.md](./AGENTS_SYSTEM.md) - Documentação técnica completa
- [TODOS_OS_15_AGENTES.md](./TODOS_OS_15_AGENTES.md) - Guia dos 15 agentes
- [REVISAO_COMPLETA_APP.md](./REVISAO_COMPLETA_APP.md) - Revisão do sistema

---

## 🎉 Conclusão

A arquitetura unificada combina o melhor de ambas as implementações:

- **Core (src/lib/):** Runtime robusto, orquestração, state management
- **Registry (lib/ai/):** Prompts profissionais, tools, personalidades

Ambos trabalham em harmonia para fornecer um sistema de agentes IA completo, escalável e pronto para produção.

---

**Última atualização:** 23/11/2025
**Versão:** 2.0 Unificada
**Status:** ✅ Produção

---

# Instruções para o Copilot

1. **Contexto do Projeto:**
   - Este projeto é um assistente jurídico baseado em IA, integrado ao sistema PJe.
   - O assistente é composto por múltiplos agentes, cada um com funções específicas (ex: análise de processos, gestão de prazos).

2. **Objetivos do Copilot:**
   - Ajudar na escrita e revisão de código, especialmente nas linguagens e frameworks utilizados no projeto (TypeScript, React, etc.).
   - Sugerir melhorias na arquitetura do código, garantindo boas práticas de desenvolvimento.
   - Auxiliar na criação de documentação técnica e de usuário.

3. **Informações Adicionais:**
   - O projeto já possui uma arquitetura definida, com agentes core e agents registry.
   - Existem 15 agentes implementados, cada um com sua personalidade e conjunto de permissões.
   - O sistema possui integração com APIs externas para funcionalidades como consulta de processos e envio de mensagens.

4. **Restrições:**
   - O código deve ser escrito em TypeScript.
   - Devem ser respeitadas as estruturas de pastas e arquivos já existentes no projeto.
   - É importante manter a consistência com o estilo de código já utilizado.

5. **Exemplos de Comandos Úteis:**
   - `git status`: Verifica o estado atual do repositório.
   - `git add .`: Adiciona todas as mudanças ao staging.
   - `git commit -m "mensagem"`: Faz um commit das mudanças.
   - `git push`: Envia as mudanças para o repositório remoto.
