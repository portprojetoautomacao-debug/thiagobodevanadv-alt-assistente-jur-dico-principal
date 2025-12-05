---
applyTo: "**"
---

# 🚨 OBJETIVO ATUAL: MODO MANUTENÇÃO - PRODUÇÃO ESTÁVEL

> **⚠️ ATENÇÃO MÁXIMA - LEIA ANTES DE QUALQUER AÇÃO**
>
> **O desenvolvimento de novas funcionalidades está ENCERRADO.**
>
> **Todas as features já foram implementadas e estão em produção.**
>
> **O objetivo agora é EXCLUSIVAMENTE manter o sistema funcionando de forma estável.**

## 🎯 Diretrizes de Manutenção

### ✅ O QUE FAZER:

- **Corrigir bugs** que afetem funcionalidades existentes
- **Manter compatibilidade** com todas as integrações (DJEN, DataJud, Google Calendar, etc.)
- **Garantir que os testes passem** - não introduzir regressões
- **Atualizar dependências** apenas quando necessário para segurança ou compatibilidade
- **Monitorar e resolver** erros de produção (Sentry, logs)
- **Manter a documentação** atualizada com correções

### ❌ O QUE NÃO FAZER:

- **NÃO adicionar novas funcionalidades** - o escopo está fechado
- **NÃO refatorar código** que está funcionando - "if it ain't broke, don't fix it"
- **NÃO alterar arquitetura** ou estrutura de pastas
- **NÃO adicionar novos agentes** ou modificar comportamento dos existentes
- **NÃO alterar fluxos de automação** que estão operando corretamente
- **NÃO introduzir novas dependências** sem necessidade crítica

### 🔧 Critérios para Alterações:

1. **Impacto em produção**: A mudança resolve um problema real em produção?
2. **Risco mínimo**: A alteração é cirúrgica e não afeta outras partes do sistema?
3. **Testes passando**: Todos os testes continuam funcionando após a mudança?
4. **Rollback fácil**: Se der problema, podemos reverter rapidamente?

### 📊 Prioridade de Correções:

| Prioridade     | Tipo                                | Ação                     |
| -------------- | ----------------------------------- | ------------------------ |
| 🔴 **Crítica** | Sistema fora do ar, perda de dados  | Corrigir IMEDIATAMENTE   |
| 🟠 **Alta**    | Funcionalidade principal quebrada   | Corrigir em até 24h      |
| 🟡 **Média**   | Bug que afeta UX mas tem workaround | Corrigir quando possível |
| 🟢 **Baixa**   | Melhorias cosméticas, typos         | Avaliar necessidade      |

---

# Copilot Instructions for Assistente Jurídico PJe

Este documento fornece instruções detalhadas para o GitHub Copilot trabalhar efetivamente com o repositório **Assistente Jurídico PJe**.

---

## 📋 Visão Geral do Projeto

**Assistente Jurídico PJe** é um sistema inteligente e completo de gestão jurídica para escritórios de advocacia, construído com React, TypeScript e Vite.

### 🆕 Resumo Operational para Copilot

- **Arquitetura**: Frontend React 19 + TypeScript + Vite em `src/`, backend serverless em `api/` (Vercel Functions). Persistência principal via Upstash Redis/KV (`api/kv.ts`, `src/hooks/use-kv.ts`).
- **Fluxo de agentes**: DJEN/DataJud alimenta `expedientes`, `use-autonomous-agents` cria tarefas para 15 agentes descritos em `src/lib/agents.ts`/`TODOS_OS_15_AGENTES.md`. `redacao-peticoes` usa Gemini 2.5 (`src/lib/gemini-service.ts`) e entrega minutas ao `MinutasManager` com campos `criadoPorAgente`, `confidence`, `templateId`, `status`.
- **Conectividade dos agentes**: Todos os agentes devem manter comunicação por streaming (tempo real) com os serviços centrais; qualquer novo agente precisa expor interface streaming compatível com `use-autonomous-agents`.
- **Editor/Documentos**: `src/components/editor/TiptapEditor.tsx`, `src/components/MinutasManager.tsx`, `src/lib/document-templates.ts` controlam commandos `/ai` e placeholders `{{variavel}}`. Alterou template? atualize `replaceTemplateVariables` + `docs/FLUXO_MINUTAS_AUTOMATICAS.md`.
- **Integrações críticas**: Google OAuth/Calendar (`src/lib/google-calendar-service.ts`), DJEN/DataJud (`src/lib/djen-api.ts`, `src/lib/datajud-api.ts`), Todoist apenas via stub `src/lib/todoist-stub.ts` no client (pacote official restrito a `/api`).
- **Cron/automação**: Jobs descritos em `api/cron.ts` e `vercel.json` (DJEN monitor, filas de agentes, backup). Novos jobs exigem atualizar ambos + README.
- **Build/Testes**: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`. Scripts novos precisam refletir em `.github/workflows/*`.
- **Padrões React/UI**: Apenas components funcionais, props `Props`, hooks no topo, alias `@/`. `src/components/ui/` (shadcn) é imutável. Manter lazy-loading/código dividido alinhado com `App.tsx`, skeleton loaders e `aria-label` em botões.
- **Tipos/estado**: `src/types.ts` centraliza `Process`, `Expediente`, `Minuta`. Ao adicionar campos, sincronize hooks (`use-processes`, `use-auto-minuta`), APIs (`api/agents.ts`, `api/expedientes.ts`) e contadores do dashboard.
- **Segurança/Performance**: Nada de segredos no repo; use `src/lib/config.ts` + `.env.example`. Respeite `manualChunks` de `vite.config.ts`, CSP de `vercel.json` e monitoração Sentry (`src/services/error-tracking.ts`).
- **Workflow**: Antes de PR, rode lint+testes e reporte resultados; manter `main` verde garante deploy automático Vercel.

### 🌐 URLs de Produção

- **App Principal**: https://assistente-juridico-p.vercel.app/
- **App Alternativo**: https://assistente-juridico-github.vercel.app/
- **API Health**: https://assistente-juridico-p.vercel.app/api/health

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

#### 🚨 Relatório Diário Obrigatório

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

**IMPORTANTE**: O Copilot deve informar ao usuário sobre qualquer problema detectado e propor correções automáticas.

### 🎯 Prioridades do Sistema Automático

1. **Manter automação ativa** - Nunca desabilitar recursos automáticos
2. **Verificar diariamente** - Checklist obrigatório antes de qualquer ação
3. **Corrigir automaticamente** - Aplicar correções sem perguntar
4. **Reportar status** - Informar usuário sobre estado do sistema
5. **Documentar mudanças** - Atualizar documentação quando modificar automação

---

## Making Changes

### ⚡ Sistema Automático - Regras Específicas para Copilot

**ANTES DE QUALQUER AÇÃO**, o Copilot deve:

1. **Executar verificação diária** dos recursos automáticos
2. **Gerar relatório interno** do status do sistema
3. **Corrigir automaticamente** qualquer problema detectado
4. **Informar ao usuário** sobre o status dos recursos automáticos

#### 🔧 Regras para Modificações no Sistema Automático

- **Nunca desabilitar** recursos automáticos sem justificativa técnica
- **Sempre testar** mudanças nos arquivos de configuração automática
- **Atualizar documentação** quando modificar automação
- **Manter compatibilidade** com tasks existentes
- **Priorizar estabilidade** sobre novas features

#### 📊 Relatórios de Status Automáticos

Quando solicitado ou detectando problemas, o Copilot deve fornecer relatórios como:

```
🚀 STATUS DO SISTEMA AUTOMÁTICO

✅ OPERACIONAL
- Tasks automáticas: 25/25 funcionando
- Auto-save: Ativado (1s delay)
- Format on save: Ativado
- ESLint auto-fix: Ativado
- TypeScript check: OK
- Testes automáticos: OK

⚠️ ATENÇÃO NECESSÁRIA
- [Item específico que precisa atenção]

🔧 CORREÇÕES APLICADAS
- [Correções realizadas automaticamente]
```

### 📝 Padrões de Desenvolvimento Automático

- 🤖 **15 Agentes de IA Autônomos** trabalhando 24/7
- 💬 **Assistente Jurídico IA** (Harvey Specter chatbot com Donna)
- 📊 **Dashboard Inteligente** com métricas em tempo real
- 📁 **CRM de Processos** com Kanban drag-and-drop (@dnd-kit)
- ⏰ **Calculadora de Prazos** com feriados nacionais/estaduais/municipais
- 📅 **Google Calendar** integração bidirecional
- 📰 **DJEN/DataJud** monitoramento automático de publicações
- 💰 **Gestão Financeira** com relatórios e analytics
- 📝 **Minutas e Documentos** com templates e Google Docs
- 🔔 **Sistema de Notificações** para prazos urgentes
- 🎨 **PWA** com suporte offline e instalação
- 📱 **Design Responsivo** mobile-first
- ✏️ **Edição Colaborativa** humano + agentes IA
- 🔐 **Controle de Autonomia** configurável por funcionalidade

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

## 🤖 Sistema de 15 Agentes IA

O sistema inclui 15 agentes de IA especializados, cada um com funções específicas para automação jurídica:

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

#### 12. Análise Financeira (`financeiro`)

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

### 🔧 Como Usar os Agentes

#### Ativando/Desativando Agentes

```typescript
import { useAutonomousAgents } from "@/hooks/use-autonomous-agents";

const { agents, toggleAgent } = useAutonomousAgents();
// toggleAgent('harvey') - ativa/desativa o agente Harvey
```

#### Criando Tarefas para Agentes

```typescript
import { useAutonomousAgents } from "@/hooks/use-autonomous-agents";

const { addTask } = useAutonomousAgents();

const task = {
  id: crypto.randomUUID(),
  agentId: "harvey",
  type: "analyze-performance",
  priority: "high",
  status: "queued",
  data: { description: "Analisar performance do escritório" },
};

addTask(task);
```

#### Status dos Agentes

- ✅ **5 agentes ativos** por padrão (Harvey, Justin-e, Análise Documental, Monitor DJEN, Gestão de Prazos)
- ⏸️ **10 agentes especializados** (ativar quando necessário)
- 📊 **100% implementados** e testados

---

## ✏️ Editor Tiptap com IA - Redação Automática de Minutas

O sistema inclui um **editor de texto rico profissional (Tiptap)** com integração de IA, permitindo que os agentes autônomos **redijam minutas automaticamente** e que operadores humanos possam revisar e editar.

### 🔧 Arquitetura da Integração

```
Monitor DJEN → Mrs. Justin-e → Expediente → Tarefa DRAFT_PETITION → Agente 'redacao-peticoes'
                                                                            ↓
                                                                    Gera minuta com IA
                                                                            ↓
                                              ┌─────────────────────────────┼─────────────────────────────┐
                                              ↓                                                           ↓
                                    Backend (api/agents.ts)                              Frontend (use-auto-minuta)
                                    Salva no KV                                          Detecta e notifica
                                              ↓                                                           ↓
                                              └───────────────> MinutasManager (Editor Tiptap) <──────────┘
                                                                        ↓
                                                              Operador revisa/aprova
```

### 📦 Componentes do Editor

| Arquivo                                  | Descrição                                  |
| ---------------------------------------- | ------------------------------------------ |
| `src/components/editor/TiptapEditor.tsx` | Editor WYSIWYG com toolbar e integração IA |
| `src/components/editor/index.ts`         | Exports do módulo editor                   |
| `src/lib/document-templates.ts`          | 8 templates jurídicos pré-definidos        |
| `src/hooks/use-auto-minuta.ts`           | Hook para criação automática de minutas    |
| `src/components/MinutasManager.tsx`      | Painel de gestão de minutas com Tiptap     |

### ✨ Funcionalidades do Editor

#### Formatação

- **Texto**: Negrito, itálico, sublinhado, tachado, destaque
- **Estrutura**: Títulos H1-H3, parágrafos, listas, citações, código
- **Alinhamento**: Esquerda, centro, direita, justificado
- **Cores**: 19 cores de texto disponíveis
- **Mídia**: Links e imagens
- **Histórico**: Desfazer/Refazer
- **Contadores**: Palavras e caracteres em tempo real

#### Comandos de IA

| Comando         | Função                                   |
| --------------- | ---------------------------------------- |
| **Expandir**    | Desenvolve texto de forma mais detalhada |
| **Resumir**     | Condensa texto de forma concisa          |
| **Formalizar**  | Reescreve em linguagem jurídica formal   |
| **Corrigir**    | Corrige gramática e ortografia           |
| **Gerar Texto** | Cria conteúdo a partir de prompt livre   |

### 📝 Templates Jurídicos Disponíveis

| Template                     | Tipo         | Variáveis Principais                          |
| ---------------------------- | ------------ | --------------------------------------------- |
| Petição Inicial              | `peticao`    | autor, reu, processo, comarca, fatos, pedidos |
| Contestação                  | `peticao`    | autor, reu, processo, vara, defesa            |
| Manifestação Processual      | `peticao`    | autor, reu, processo, manifestacao            |
| Contrato de Honorários       | `contrato`   | advogado, cliente, valor, objeto              |
| Procuração Ad Judicia        | `procuracao` | outorgante, outorgado, poderes                |
| Procuração Poderes Especiais | `procuracao` | outorgante, outorgado, poderes_especiais      |
| Recurso de Apelação          | `recurso`    | apelante, apelado, processo, razoes           |
| Parecer Jurídico             | `parecer`    | consulente, materia, conclusao                |

### 🔄 Sistema de Variáveis

Templates usam sintaxe `{{variavel}}` para substituição automática:

```html
<p>Exmo. Sr. Dr. Juiz de Direito da {{vara}}</p>
<p><strong>{{autor.nome}}</strong>, já qualificado nos autos...</p>
<p>Processo nº {{processo.numero}}</p>
```

**Variáveis automáticas quando vinculado a processo:**

- `{{processo.numero}}` - Número CNJ
- `{{processo.titulo}}` - Título do processo
- `{{autor.nome}}` - Nome do autor
- `{{reu.nome}}` - Nome do réu
- `{{comarca}}` - Comarca
- `{{vara}}` - Vara

### 🤖 Fluxo de Criação Automática de Minutas

1. **Detecção**: Monitor DJEN encontra intimação
2. **Análise**: Mrs. Justin-e identifica necessidade de resposta
3. **Tarefa**: Sistema cria `DRAFT_PETITION` para agente `redacao-peticoes`
4. **Redação**: Agente usa IA (Gemini/GPT) para gerar minuta
5. **Salvamento**:
   - Backend salva no KV com `criadoPorAgente: true`
   - Frontend detecta via hook `use-auto-minuta`
6. **Notificação**: Toast "📝 Nova minuta criada!"
7. **Revisão**: Operador abre minuta no editor Tiptap
8. **Aprovação**: Muda status para 'finalizada'

### 📊 Tipos e Status de Minutas

**Tipos disponíveis:**

```typescript
tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
```

**Status de workflow:**

```typescript
status: "rascunho" |
  "em-revisao" |
  "pendente-revisao" |
  "finalizada" |
  "arquivada";
```

### 🔧 Tipo Minuta (TypeScript)

```typescript
interface Minuta {
  id: string;
  titulo: string;
  processId?: string;
  tipo: "peticao" | "contrato" | "parecer" | "recurso" | "procuracao" | "outro";
  conteudo: string;
  status:
    | "rascunho"
    | "em-revisao"
    | "pendente-revisao"
    | "finalizada"
    | "arquivada";
  criadoEm: string;
  atualizadoEm: string;
  autor: string;
  googleDocsId?: string;
  googleDocsUrl?: string;
  // Campos para integração com agentes IA
  criadoPorAgente?: boolean;
  agenteId?: string;
  templateId?: string;
  expedienteId?: string;
  variaveis?: Record<string, string>;
}
```

### 💻 Como Usar o Editor

#### Usando o TiptapEditor em um componente:

```tsx
import { TiptapEditor } from "@/components/editor/TiptapEditor";

function MyComponent() {
  const [content, setContent] = useState("<p>Conteúdo inicial</p>");

  const handleAIGenerate = async (prompt: string) => {
    const response = await fetch("/api/llm-proxy", {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  };

  return (
    <TiptapEditor
      content={content}
      onChange={setContent}
      placeholder="Digite ou use /ai para comandos de IA..."
      onAIGenerate={handleAIGenerate}
      variables={{ "processo.numero": "1234567-89.2024" }}
    />
  );
}
```

#### Usando o hook de auto-minuta:

```tsx
import { useAutoMinuta } from "@/hooks/use-auto-minuta";

function Dashboard() {
  const {
    minutasTotal, // Total de minutas no sistema
    minutasPendentesRevisao, // Aguardando revisão humana
    minutasCriadasPorAgente, // Criadas automaticamente por IA
    processedTasksCount, // Tarefas de redação processadas
  } = useAutoMinuta();

  return (
    <div>
      <p>Total: {minutasTotal}</p>
      <p>Pendentes: {minutasPendentesRevisao}</p>
      <p>Criadas por IA: {minutasCriadasPorAgente}</p>
    </div>
  );
}
```

#### Usando templates:

```typescript
import {
  documentTemplates,
  getTemplateById,
  replaceTemplateVariables,
  extractUnfilledVariables,
} from "@/lib/document-templates";

// Listar todos os templates
console.log(documentTemplates);

// Buscar template específico
const template = getTemplateById("peticao-inicial");

// Substituir variáveis
const content = replaceTemplateVariables(template.content, {
  "autor.nome": "João Silva",
  "reu.nome": "Empresa XYZ",
  "processo.numero": "1234567-89.2024.5.02.0999",
});

// Ver variáveis não preenchidas
const unfilled = extractUnfilledVariables(content);
// ['comarca', 'vara', 'fatos', 'pedidos']
```

### 📋 Dependências Tiptap Instaladas

```json
{
  "@tiptap/react": "^3.11.x",
  "@tiptap/starter-kit": "^3.11.x",
  "@tiptap/pm": "^3.11.x",
  "@tiptap/extension-placeholder": "^3.11.x",
  "@tiptap/extension-highlight": "^3.11.x",
  "@tiptap/extension-typography": "^3.11.x",
  "@tiptap/extension-text-align": "^3.11.x",
  "@tiptap/extension-underline": "^3.11.x",
  "@tiptap/extension-link": "^3.11.x",
  "@tiptap/extension-image": "^3.11.x",
  "@tiptap/extension-color": "^3.11.x",
  "@tiptap/extension-text-style": "^3.11.x",
  "@tiptap/extension-table": "^3.11.x",
  "@tiptap/extension-task-list": "^3.11.x",
  "@tiptap/extension-task-item": "^3.11.x",
  "@tiptap/extension-bubble-menu": "^3.11.x",
  "@tiptap/extension-floating-menu": "^3.11.x"
}
```

---

## 🛠️ Technology Stack

### Frontend

| Tecnologia            | Versão  | Uso                          |
| --------------------- | ------- | ---------------------------- |
| React                 | 19.0.0  | Framework principal          |
| TypeScript            | 5.5.0   | Tipagem estática             |
| Vite                  | 6.3.5   | Build tool e dev server      |
| Tailwind CSS          | 4.1.11  | Estilização utility-first    |
| shadcn/ui             | v4      | Componentes UI (Radix-based) |
| Framer Motion         | 12.6.2  | Animações fluidas            |
| Recharts              | 2.15.1  | Gráficos e visualizações     |
| React Hook Form       | 7.54.2  | Gerenciamento de formulários |
| Zod                   | 3.25.76 | Validação de schemas         |
| @dnd-kit              | 6.3.1   | Drag and drop (Kanban)       |
| Phosphor Icons        | 2.1.7   | Ícones principais            |
| Lucide React          | 0.484.0 | Ícones secundários           |
| @tanstack/react-query | 5.83.1  | Data fetching e cache        |

### Backend (Vercel Serverless)

| Tecnologia       | Versão | Uso                    |
| ---------------- | ------ | ---------------------- |
| Node.js          | 22.x   | Runtime (obrigatório)  |
| Vercel Functions | -      | API serverless         |
| Upstash Redis    | 1.35.6 | KV storage persistente |
| @vercel/node     | 5.5.6  | Runtime serverless     |

### Integrações Externas

| Serviço               | Propósito                              |
| --------------------- | -------------------------------------- |
| Google OAuth 2.0      | Autenticação de usuários               |
| Google Calendar API   | Sincronização de eventos/prazos        |
| Google Docs API       | Edição de minutas                      |
| DJEN/DataJud API      | Monitoramento de publicações jurídicas |
| Todoist API           | Gestão de tarefas (server-side only)   |
| Sentry                | Error tracking e monitoring            |
| Vercel Speed Insights | Performance monitoring                 |

### 🧠 Motor de IA - Gemini 2.5 Pro

> **⚠️ IMPORTANTE**: O sistema foi migrado do **Spark** para o **Gemini 2.5 Pro**.

| Item               | Status                                                    |
| ------------------ | --------------------------------------------------------- |
| **Spark (antigo)** | ❌ Descontinuado - Arquivos mantidos para compatibilidade |
| **Gemini 2.5 Pro** | ✅ Ativo - Motor principal de IA                          |

**Arquivos do Gemini:**

- `src/lib/gemini-service.ts` - Serviço principal
- `src/lib/gemini-config.ts` - Configurações do modelo
- `src/lib/ai-providers.ts` - Abstração de provedores

**Arquivos Legados (Spark) - NÃO USAR para novas features:**

- `src/lib/spark-client-fixes.ts` - Patches legados
- `spark.meta.json` - Metadados antigos

### 📦 Stubs para APIs Server-Side Only

Algumas APIs externas só funcionam no servidor (Vercel Functions). Para evitar erros no browser, usamos **stubs**:

#### Todoist API Stub (`src/lib/todoist-stub.ts`)

O pacote `@doist/todoist-api-typescript` **não funciona no browser**. Usamos um stub que:

1. **Exporta tipos compatíveis** (`Task`, `Project`, `Section`, `Label`, `Comment`)
2. **Fornece funções utilitárias** (`getTaskUrl`, `getProjectUrl`)
3. **Lança erros claros** se alguém tentar usar `TodoistApi` no client

```typescript
// ❌ ERRADO - Não funciona no browser
import { TodoistApi } from "@doist/todoist-api-typescript";
const api = new TodoistApi(apiKey); // Error!

// ✅ CORRETO - Use o stub para tipos e utils
import { Task, Project, getTaskUrl } from "@/lib/todoist-stub";

// ✅ CORRETO - Use API routes para operações
const tasks = await fetch("/api/todoist-tasks").then((r) => r.json());
```

**Regras para Todoist:**

- **Client-side**: Use apenas tipos e utils do stub + chamadas a `/api/todoist-*`
- **Server-side** (`/api/*.ts`): Pode usar `@doist/todoist-api-typescript` diretamente

**Nota:** Endpoints Todoist (`/api/todoist-*`) foram desabilitados. Use o stub apenas para tipos no client-side.

### DevOps & CI/CD

| Ferramenta     | Uso                        |
| -------------- | -------------------------- |
| GitHub Actions | 23 workflows automatizados |
| GitLab CI/CD   | Pipeline secundário        |
| Playwright     | Testes E2E                 |
| Vitest         | Testes unitários           |
| ESLint 9       | Linting com flat config    |
| Prettier       | Formatação de código       |

### Monitoring & Observability

| Ferramenta                    | Versão/Status | Uso                                  |
| ----------------------------- | ------------- | ------------------------------------ |
| Sentry                        | Latest        | Error tracking e performance         |
| Sentry AI Agents Monitoring   | v2.0.0 ✅     | Monitoramento de agentes IA          |
| OpenTelemetry                 | Spec 1.0      | Convenções semânticas                |
| Vercel Speed Insights         | Integrado     | Core Web Vitals                      |

#### 🔍 Sentry AI Agents Monitoring v2

**Status**: ✅ Fase 1 completa - Harvey Specter instrumentado

**Arquivos principais:**
- `src/lib/sentry-gemini-integration-v2.ts` - API oficial OpenTelemetry (448 linhas)
- `src/hooks/use-ai-streaming.ts` - Hook instrumentado com `createChatSpan()`
- `src/components/HarveySpecterChat.tsx` - Tracking de conversação
- `docs/SENTRY_AI_MONITORING.md` - Guia completo v2.0.0
- `docs/SENTRY_AI_TESTING_GUIDE.md` - Guia de testes

**Funções disponíveis:**
```typescript
import {
  createInvokeAgentSpan,  // Rastrear agente completo
  createChatSpan,          // Rastrear chamada LLM
  createExecuteToolSpan,   // Rastrear tool calling
  createHandoffSpan,       // Marcar handoff entre agentes
  useAIInstrumentation,    // Hook React
} from "@/lib/sentry-gemini-integration-v2";
```

**Convenções OpenTelemetry:**
- Operations: `gen_ai.invoke_agent`, `gen_ai.chat`, `gen_ai.execute_tool`, `gen_ai.handoff`
- Atributos: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.*`
- Conversação: `conversation.session_id`, `conversation.turn`

**Progresso de migração:**
- ✅ Fase 1: Harvey Specter (1/15 agentes)
- ⏳ Fase 2: Mrs. Justin-e, Redação, Monitor DJEN + tool calling + handoffs
- ⏳ Fase 3: 12 agentes restantes + LGPD
- ⏳ Fase 4: Alertas, runbooks, produção

**Dashboard:** Sentry.io → Insights → AI → AI Agents

## 📁 Project Structure

```
assistente-juridico-p/
├── .github/
│   ├── copilot-instructions.md  # Este arquivo
│   └── workflows/               # 23 GitHub Actions
│       ├── ci.yml               # CI principal
│       ├── deploy.yml           # Deploy Vercel
│       ├── e2e.yml              # Testes E2E
│       ├── security-scan.yml    # Scans de segurança
│       └── ...
├── api/                         # Vercel Serverless Functions
│   ├── agents.ts                # Gerenciamento de agentes (45s timeout)
│   ├── cron.ts                  # Jobs agendados (10 actions)
│   ├── djen-sync.ts             # Sync DJEN (60s timeout)
│   ├── expedientes.ts           # Gestão de expedientes/intimações
│   ├── kv.ts                    # KV storage proxy
│   ├── legal-services.ts        # Serviços jurídicos (prazos, etc)
│   ├── llm-proxy.ts             # Proxy para LLM (40s timeout)
│   ├── llm-stream.ts            # Streaming de LLM
│   ├── observability.ts         # Métricas e monitoramento
│   ├── status.ts                # Health check
│   └── lib/                     # Libs compartilhadas
├── src/
│   ├── components/              # 90+ componentes React
│   │   ├── ui/                  # shadcn/ui (NÃO MODIFICAR)
│   │   ├── Dashboard.tsx        # Dashboard principal
│   │   ├── ProcessCRM.tsx       # CRM com Kanban
│   │   ├── AIAgents.tsx         # Painel de agentes IA
│   │   ├── CalculadoraPrazos.tsx # Calculadora de prazos
│   │   ├── Calendar.tsx         # Agenda com Google Calendar
│   │   ├── FinancialManagement.tsx # Gestão financeira
│   │   ├── DJENPublicationsWidget.tsx # Widget publicações
│   │   ├── ExpedientePanel.tsx  # Painel de expedientes
│   │   ├── Donna.tsx            # Chatbot IA
│   │   ├── MinutasManager.tsx   # Gestão de minutas
│   │   └── ...
│   ├── hooks/                   # Custom hooks
│   │   ├── use-autonomous-agents.ts  # Lógica dos agentes IA
│   │   ├── use-kv.ts            # KV storage
│   │   ├── use-processes.ts     # Gerenciamento de processos
│   │   ├── use-notifications.ts # Notificações
│   │   ├── use-analytics.ts     # Analytics
│   │   └── ...
│   ├── lib/                     # Utilitários e serviços
│   │   ├── agents.ts            # Core dos agentes (15 agentes)
│   │   ├── config.ts            # Configurações centralizadas
│   │   ├── datajud-api.ts       # API DataJud
│   │   ├── djen-api.ts          # API DJEN
│   │   ├── google-calendar-service.ts # Serviço Google Calendar
│   │   ├── premonicao-service.ts # Premonição jurídica (IA)
│   │   ├── prazos.ts            # Cálculo de prazos
│   │   ├── llm-client.ts        # Cliente LLM
│   │   └── utils.ts             # Utilitários gerais
│   ├── services/
│   │   └── error-tracking.ts    # Sentry
│   ├── types.ts                 # Tipos TypeScript
│   ├── App.tsx                  # App principal (lazy loading)
│   ├── main.tsx                 # Entry point
│   └── index.css                # Estilos globais + Tailwind
├── public/                      # Assets estáticos
├── tests/                       # Testes E2E (Playwright)
├── vercel.json                  # Config Vercel completa
├── vite.config.ts               # Config Vite otimizada
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 💻 Development Commands

```bash
# Instalação
npm install

# Desenvolvimento
npm run dev              # http://localhost:5173

# Build
npm run build            # TypeScript + Vite build
npm run preview          # Preview do build

# Testes
npm run test             # Vitest watch mode
npm run test:run         # Rodar testes uma vez
npm run test:ui          # Interface visual de testes
npm run test:coverage    # Relatório de cobertura
npm run test:api         # Testes de API
npm run test:all         # Todos os testes
npm run test:e2e         # Playwright E2E

# Qualidade de código
npm run lint             # ESLint (max 150 warnings)
npm run format           # Prettier

# Utilitários
npm run optimize         # Otimizar dependências
npm run kill             # Kill porta 5000
```

## Code Style and Conventions

### TypeScript

- **Strict null checks enabled** - Always handle null/undefined cases
- Use type inference where possible, explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use const assertions for literal types

### React

- **Functional components only** - No class components
- Use React hooks (useState, useEffect, useCallback, useMemo, etc.)
- Custom hooks should start with `use` prefix
- Component file names in PascalCase matching component name
- Props interfaces named with `Props` suffix (e.g., `DashboardProps`)

### Naming Conventions

- **Components**: PascalCase (e.g., `ProcessCRM.tsx`, `AIAgents.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-autonomous-agents.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Types/Interfaces**: PascalCase (e.g., `ProcessData`, `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE

### Component Structure

```tsx
// Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {
    // logic
  };

  // Render
  return <div>{/* JSX */}</div>;
}
```

### Path Aliases

- Use `@/` for imports from `src/` directory
- Example: `import { Button } from '@/components/ui/button'`

## Security Requirements

⚠️ **CRITICAL SECURITY RULES** - Never violate these:

1. **Never commit credentials or secrets**

   - OAuth credentials go in `.env` (already in `.gitignore`)
   - Never hardcode API keys, client IDs, or secrets
   - Use environment variables via `src/lib/config.ts`

2. **Environment Variables**

   - Prefix with `VITE_` for client-side access
   - Reference example: `.env.example`
   - Required variables:
     ```
     VITE_GOOGLE_CLIENT_ID=
     VITE_GOOGLE_API_KEY=
     VITE_REDIRECT_URI=
     VITE_APP_ENV=
     ```

3. **OAuth Security**

   - Different credentials for dev/production
   - Never share credentials in comments, documentation, or code
   - See `OAUTH_SETUP.md` for setup instructions

4. **Dependency Security**
   - Run `npm audit` before adding dependencies
   - Keep dependencies updated
   - Review package permissions

## Testing

### Test Structure

- Test files use `.test.ts` or `.test.tsx` extension
- Place tests adjacent to the code they test
- Example: `src/lib/djen-api.test.ts`

### Running Tests

- **Unit Tests**: Vitest with coverage reporting
- **API Tests**: Separate config for backend functions
- **E2E Tests**: Playwright for browser automation
- **UI Tests**: Vitest UI for interactive testing

### Test Commands

```bash
npm run test:all         # Run complete test suite
npm run test:coverage    # Generate coverage reports
npm run test:e2e         # End-to-end browser tests
```

## Building and Linting

### Build Process

1. TypeScript compilation: `tsc -b --noCheck`
2. Vite build: `vite build`
3. Output: `dist/` directory (ignored by git)

### Linting

- ESLint 9 with flat config
- React hooks rules enforced
- React refresh rules enforced
- Run before committing: `npm run lint`

### Type Checking

- TypeScript strict null checks enabled
- Module resolution: bundler mode
- No emit (Vite handles compilation)

## State Management

### Upstash Redis KV Storage

- Use `useKV` hook from `@/hooks/use-kv` para estado persistente
- Backend serverless via `/api/kv` com Upstash Redis
- Client faz chamadas HTTP para a API

### Example Usage

```tsx
import { useKV } from "@/hooks/use-kv";

const { data: processes, setData: setProcesses } = useKV<Process[]>(
  "processes",
  []
);
```

## UI Components

### shadcn/ui Components

- Located in `src/components/ui/`
- **DO NOT modify** these files directly
- Regenerate using shadcn CLI if needed
- Customize via Tailwind classes in parent components

### Tailwind CSS

- Version 4 with `@tailwindcss/vite` plugin
- Custom theme in `tailwind.config.js`
- Use utility classes, avoid custom CSS when possible
- Responsive design: mobile-first approach

## Common Patterns

### Form Validation

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  field: z.string().min(1, "Required"),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### API Calls

- Use `fetch` API or libraries compatible with Vite
- Handle loading, error, and success states
- Use React Query for complex data fetching

### Error Handling

- Use Error Boundaries for component errors
- See `ErrorFallback.tsx` for reference
- Provide user-friendly error messages
- Log errors for debugging

## Integration Points

### Google OAuth

- Authentication via `GoogleAuth.tsx`
- Config in `src/lib/config.ts`
- Documentation: `OAUTH_SETUP.md`

### Google Calendar

- Bidirectional sync
- Documentation: `GOOGLE_CALENDAR_INTEGRATION.md`

### DJEN/DataJud

- Legal publication monitoring
- Documentation: `DJEN_DOCUMENTATION.md`

### AI Features

- **Gemini 2.5 Pro** - Motor principal de IA (substituiu Spark)
- Sistema de 15 agentes autônomos
- Ver `AIAgents.tsx`, `use-autonomous-agents.ts` e `src/lib/gemini-service.ts`

## Deployment & Integrations

### Vercel Deployment

- **Region**: São Paulo (gru1) for Brazil compliance
- **Functions**: Serverless API routes with custom timeouts
- **Cron Jobs**: Automated DJEN monitoring (daily at 11:00 BRT)
- **Security Headers**: HSTS, CSP, CORS configured
- **Environment**: Production builds optimized

### Cron Jobs Configurados (Automação 100%)

| Job                       | Schedule (UTC)  | Horário BRT  | Função                                  |
| ------------------------- | --------------- | ------------ | --------------------------------------- |
| DJEN Monitor (manhã)      | `0 12 * * *`    | 09:00        | Verifica publicações diárias do DJEN    |
| DJEN Monitor (tarde)      | `0 20 * * *`    | 17:00        | Segunda verificação diária do DJEN      |
| Daily Reset               | `0 0 * * *`     | 21:00        | Reset de contadores dos agentes         |
| **Process Agent Queue**   | `*/15 * * * *`  | A cada 15min | Processa fila de tarefas dos agentes IA |
| **Process Notifications** | `*/5 * * * *`   | A cada 5min  | Envia emails e webhooks pendentes       |
| **Calendar Sync**         | `0 */2 * * *`   | A cada 2h    | Sincroniza prazos com Google Calendar   |
| **Backup**                | `0 3 * * *`     | 00:00        | Backup automático dos dados do KV       |
| **DataJud Monitor**       | `0 16 * * *`    | 13:00        | Verifica movimentações no DataJud       |
| **Deadline Alerts**       | `0 55 11 * * *` | 08:55        | Envia alertas de prazos urgentes        |
| **Watchdog**              | `*/30 * * * *`  | A cada 30min | Monitoramento de saúde do sistema       |

### API Endpoints (Vercel Functions)

| Endpoint              | Método          | Timeout | Função                      |
| --------------------- | --------------- | ------- | --------------------------- |
| `/api/status`         | GET             | 30s     | Health check                |
| `/api/kv`             | GET/POST/DELETE | 30s     | KV storage CRUD             |
| `/api/expedientes`    | GET             | 30s     | Lista expedientes           |
| `/api/djen-sync`      | POST            | 60s     | Força sync DJEN             |
| `/api/cron`           | GET             | 30s     | Jobs agendados (10 actions) |
| `/api/agents`         | GET/POST        | 45s     | Gerenciar agentes           |
| `/api/legal-services` | GET/POST        | 30s     | Serviços jurídicos          |
| `/api/llm-proxy`      | POST            | 40s     | Proxy para LLM              |
| `/api/llm-stream`     | POST            | 40s     | Streaming de LLM            |
| `/api/observability`  | GET             | 30s     | Métricas e observabilidade  |

### Rewrites (Proxy)

```
/_spark/llm         → /api/llm-proxy
/_spark/kv/:key*    → /api/kv
/api/health         → /api/status?type=health
/api/deadline/calculate → /api/legal-services?service=deadline
```

### GitLab CI/CD

- **Agents**: 7 autonomous agents for development workflow
- **Kubernetes**: Minikube cluster with RBAC
- **Auto DevOps**: Automated pipelines and deployments
- **Security Scanning**: Integrated vulnerability checks

### External APIs

- **DJEN/DataJud**: CNJ public API for legal publications
- **Google Calendar**: Bidirectional synchronization
- **Upstash Redis**: Serverless KV storage
- **Sentry**: Error tracking and monitoring

### Environment Variables

Required for full functionality:

```env
# Core
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=
VITE_REDIRECT_URI=

# Storage
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI - Gemini (principal motor de IA)
GEMINI_API_KEY=

# Monitoring
SENTRY_DSN=

# Email (optional)
RESEND_API_KEY=
```

## Performance & Lighthouse Optimizations

### Scores Atuais (Lighthouse CI)

| Categoria      | Score | Meta |
| -------------- | ----- | ---- |
| Performance    | 85+   | 90+  |
| Accessibility  | 94+   | 100  |
| Best Practices | 79+   | 85+  |
| SEO            | 92+   | 95+  |
| PWA            | ✅    | ✅   |

### Otimizações Implementadas

#### Critical CSS Inline

- CSS crítico inline no `index.html` para First Contentful Paint (FCP)
- Loader animado visível imediatamente
- Reduz render-blocking resources

#### Code Splitting Otimizado

```typescript
// vite.config.ts - Chunks nomeados
manualChunks: {
  'react-vendor': ['react', 'react-dom', '@phosphor-icons/react'],
  'ui-vendor': ['@radix-ui/...'],
  'animation': ['framer-motion'],
  'dnd': ['@dnd-kit/...'],
  'date-utils': ['date-fns'],
  'css-utils': ['clsx', 'class-variance-authority', 'tailwind-merge'],
  'sentry': ['@sentry/react'],
  'toasts': ['sonner'],
  'editor': ['@tiptap/...'],
  'three': ['three']
}
```

#### Lazy Loading

- **Sentry**: Carregado dinamicamente, não bloqueia o bundle principal
- **Componentes pesados**: React.lazy() para AIAgents, CalculadoraPrazos, etc.
- **Imagens**: Loading="lazy" em todas as imagens

#### Preconnect & DNS Prefetch

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://api.datajud.cnj.jus.br" />
```

#### CSP Seguro (sem unsafe-eval)

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; ..."
```

- Removido `unsafe-eval` para melhorar Best Practices score
- Adicionado `base-uri 'self'` e `form-action 'self'`
- `upgrade-insecure-requests` habilitado

#### Acessibilidade

- Todos os botões de ícone têm `aria-label` + `title` fallback
- Estrutura semântica HTML5
- Suporte a navegação por teclado
- Contraste de cores adequado (WCAG AA)

### Ferramentas de Monitoramento

- **Vercel Speed Insights**: Métricas de Core Web Vitals
- **Sentry**: Error tracking e performance monitoring
- **Lighthouse CI**: Testes automatizados no CI/CD

## Documentation Files

- `PRD.md` - Product requirements
- `README.md` - Setup and overview
- `SECURITY.md` - Security policies
- `OAUTH_SETUP.md` - OAuth configuration guide
- `GOOGLE_CALENDAR_INTEGRATION.md` - Calendar integration
- `DJEN_DOCUMENTATION.md` - DJEN API integration
- `GUIA_CONFIGURACAO_VERCEL.md` - Vercel deployment guide
- `GITLAB_DUO_SETUP_COMPLETE.md` - GitLab Duo configuration
- `QUICKSTART.md` - Quick start guide
- `VERCEL_DEPLOYMENT_GUIDE.md` - Vercel deployment details
- `TODOS_OS_15_AGENTES.md` - Complete agents documentation (15 agentes)
- `AGENTS_SYSTEM.md` - Technical agents documentation
- `AGENTS_IMPROVEMENTS_SUMMARY.md` - Agents improvements summary
- `docs/FLUXO_MINUTAS_AUTOMATICAS.md` - **Fluxo completo de minutas automáticas** (Editor Tiptap, Templates, IA)

## Making Changes

### Before Starting

1. Read relevant documentation files
2. Understand the feature area
3. Check existing patterns in similar components
4. Review security requirements

### When Adding Features

1. Follow existing component structure
2. Use TypeScript strictly
3. Add proper error handling
4. Update types in `types.ts` if needed
5. Test in development mode
6. Ensure responsive design
7. Document complex logic

### When Fixing Bugs

1. Identify root cause
2. Add tests if missing
3. Fix with minimal changes
4. Verify fix doesn't break other features
5. Test edge cases

### When Refactoring

1. Maintain existing functionality
2. Keep changes focused and small
3. Update related documentation
4. Ensure types remain accurate
5. Test thoroughly

---

## 🤖 Comportamento do Copilot - Sistema Automático

### 📋 Verificação Diária Obrigatória

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

#### 🚨 Relatório Diário Obrigatório

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

**IMPORTANTE**: O Copilot deve informar ao usuário sobre qualquer problema detectado e propor correções automáticas.

### 🎯 Prioridades do Sistema Automático

1. **Manter automação ativa** - Nunca desabilitar recursos automáticos sem justificativa técnica
2. **Verificar diariamente** - Checklist obrigatório antes de qualquer ação
3. **Corrigir automaticamente** - Aplicar correções sem perguntar
4. **Reportar status** - Informar usuário sobre estado do sistema
5. **Documentar mudanças** - Atualizar documentação quando modificar automação

---

## Git Workflow

### Commits

- Clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

### Files to Ignore

Already in `.gitignore`:

- `node_modules/`
- `dist/`
- `.env`
- `*.local`
- Editor configs
- `packages/` (for workspaces)

### Files NOT to Commit

- Environment files (`.env`)
- Build artifacts (`dist/`, `dist-ssr/`)
- Dependency directories (`node_modules/`)
- Editor-specific files
- Credentials or secrets

## Performance Considerations

- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize images and assets
- Keep bundle size minimal
- Use code splitting where appropriate

## Accessibility

- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain sufficient color contrast

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020 target
- No IE11 support required

## Questions or Issues?

- Check relevant documentation files first
- Review existing similar code
- Ensure security guidelines are followed
- Test changes thoroughly before committing

## Comunicação e Idioma (Português)

- Responda sempre em Português do Brasil (pt-BR) nas mensagens de resposta, instruções, comentários e planos — tanto no Copilot Chat quanto nas operações de revisão e sugestões automáticas.
- Use linguagem clara, objetiva e direta. Se for necessário usar termos técnicos em inglês, explique-os em português entre parênteses.
- Ao apresentar passos (ex.: rodar build, executar lint, corrigir erros), forneça instruções passo a passo em português.
- Para mensagens de commit sugeridas ou descrições de PR, gere o texto em português e, opcionalmente, inclua uma tradução curta em inglês somente se solicitado.

> Nota: O VS Code já carrega este arquivo por padrão (configuração "GitHub > Copilot > Copilot Chat: Use Instruction Files"). O front matter `applyTo: "**"` garante que Chat, Coding Agent e Code Review consumam estas instruções sem qualquer ação adicional.
