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
- **Extensão Chrome PJe Sync**: Projeto separado em `chrome-extension-pje/` com Manifest v3, TypeScript, Webpack. Content Script extrai processos do PJe, Background Service Worker sincroniza com `/api/pje-sync`, Popup UI configura API Key. 31 testes, build em `dist/`. Documentação: `chrome-extension-pje/README.md` e `INSTALL.md`.
- **Fluxo de agentes**: DJEN/DataJud/Chrome Extension alimenta `expedientes`, `use-autonomous-agents` cria tarefas para 15 agentes descritos em `src/lib/agents.ts`/`TODOS_OS_15_AGENTES.md`. `redacao-peticoes` usa Gemini 2.5 (`src/lib/gemini-service.ts`) e entrega minutas ao `MinutasManager` com campos `criadoPorAgente`, `confidence`, `templateId`, `status`.
- **Conectividade dos agentes**: Todos os agentes devem manter comunicação por streaming (tempo real) com os serviços centrais; qualquer novo agente precisa expor interface streaming compatível com `use-autonomous-agents`.
- **Editor/Documentos**: `src/components/editor/TiptapEditor.tsx`, `src/components/MinutasManager.tsx`, `src/lib/document-templates.ts` controlam commandos `/ai` e placeholders `{{variavel}}`. Alterou template? atualize `replaceTemplateVariables` + `docs/FLUXO_MINUTAS_AUTOMATICAS.md`.
 - **Integrações críticas**: Google OAuth/Calendar (`src/lib/google-calendar-service.ts`), DJEN/DataJud (`src/lib/djen-api.ts`, `src/lib/datajud-api.ts`), PJe via Chrome Extension (`chrome-extension-pje/`, endpoint `/api/pje-sync`), Qdrant (`src/lib/qdrant-service.ts` - optional, cloud), DSPy Bridge (`scripts/dspy_bridge.py` - optional, Railway), Email API (`api/emails.ts`), Todoist apenas via stub `src/lib/todoist-stub.ts` no client (pacote official restrito a `/api`).
- **Cron/automação**: Jobs descritos em `api/cron.ts` e `vercel.json` (DJEN monitor, filas de agentes, backup). Novos jobs exigem atualizar ambos + README.
- **Build/Testes**: `npm run dev`, `npm run build`, `npm run lint`, `npm run test`, `npm run test:e2e`. Extensão Chrome: `cd chrome-extension-pje && npm run build`. Scripts novos precisam refletir em `.github/workflows/*`.
- **Padrões React/UI**: Apenas components funcionais, props `Props`, hooks no topo, alias `@/`. `src/components/ui/` (shadcn) é imutável. Manter lazy-loading/código dividido alinhado com `App.tsx`, skeleton loaders e `aria-label` em botões.
- **Tipos/estado**: `src/types.ts` centraliza `Process`, `Expediente`, `Minuta`. Extensão usa tipos em `chrome-extension-pje/src/shared/types.ts` (`ProcessoPJe`, `Expediente`, `SyncMessage`). Ao adicionar campos, sincronize hooks (`use-processes`, `use-auto-minuta`), APIs (`api/agents.ts`, `api/expedientes.ts`, `api/pje-sync.ts`) e contadores do dashboard.
- **Segurança/Performance**: Nada de segredos no repo; use `src/lib/config.ts` + `.env.example`. Respeite `manualChunks` de `vite.config.ts`, CSP de `vercel.json` e monitoração Sentry (`src/services/error-tracking.ts`). Extensão Chrome: API Key armazenada em Chrome Storage, comunicação HTTPS apenas.
- **Workflow**: Antes de PR, rode lint+testes e reporte resultados; manter `main` verde garante deploy automático Vercel. Para extensão, rode `npm test` em `chrome-extension-pje/`.

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
5. **DSPy Bridge não responde**: Reiniciar serviço Railway ou alertar operador; se deploy local, usar `systemctl restart dspy-bridge.service` (prod) ou `python3 scripts/dspy_bridge.py` para testes locais
6. **Qdrant indisponível**: Verificar logs da instância Qdrant Cloud, chaves e quota; em caso de erro, notificar operador e escalar a instância
7. **Email SEND falha**: Verificar `RESEND_API_KEY` e logs do provedor; reprocessar fila se houver backlog; se o provider estiver fora, use stub temporário e avise o operador

**IMPORTANTE**: O Copilot deve informar ao usuário sobre qualquer problema detectado e propor correções automáticas.

### 🎯 Prioridades do Sistema Automático

1. **Manter automação ativa** - Nunca desabilitar recursos automáticos sem justificativa técnica
2. **Verificar diariamente** - Checklist obrigatório antes de qualquer ação
3. **Corrigir automaticamente** - Aplicar correções sem perguntar
4. **Reportar status** - Informar usuário sobre estado do sistema
5. **Documentar mudanças** - Atualizar documentação quando modificar automação

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
- Registrar (log) ações que envolvam escrita no repositório para fins de auditoria, incluindo quem autorizou a operação.

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

### 🔍 SonarCloud MCP Server - Análise de Código

O projeto está integrado com SonarCloud via MCP Server para análise contínua de qualidade de código.

#### 📊 Configuração Principal

| Configuração | Valor |
|--------------|-------|
| **URL** | `https://sonarcloud.io` |
| **Organization** | `thiagobodevan-a11y-assistente-juridico-p` |
| **Project Key** | `thiagobodevan-a11y_assistente-juridico-p` |
| **Connected Mode** | ✅ Ativado |

**Dashboard:** https://sonarcloud.io/project/overview?id=thiagobodevan-a11y_assistente-juridico-p

#### 📁 Arquivos de Configuração

| Arquivo | Descrição |
|---------|-----------|
| `.vscode/mcp.json` | Configuração MCP Server principal |
| `.vscode/sonar-copilot-assistant.json` | Integração Sonar + Copilot + Git |
| `.vscode/settings.json` | SonarLint Connected Mode |
| `.github/instructions/sonarqube_mcp.instructions.md` | Instruções de uso das ferramentas MCP |

#### 🔧 Ferramentas MCP Disponíveis

| Ferramenta | Uso |
|------------|-----|
| `search_my_sonarqube_projects` | Buscar projetos disponíveis no SonarCloud |
| `search_sonar_issues_in_projects` | Buscar issues (bugs, vulnerabilities, code smells) |
| `analyze_file_list` | Analisar arquivos modificados após edição |
| `toggle_automatic_analysis` | Ativar/desativar análise automática |

#### ⚡ Workflow de Análise

**Ao iniciar uma tarefa:**
1. Desabilitar análise automática: `toggle_automatic_analysis` (se existir)
2. Realizar modificações de código
3. Ao finalizar: `analyze_file_list` nos arquivos modificados
4. Re-habilitar análise automática: `toggle_automatic_analysis`

**Para buscar issues:**
```bash
# Buscar projetos
search_my_sonarqube_projects

# Buscar issues por severidade
search_sonar_issues_in_projects (severities: BLOCKER, CRITICAL, MAJOR)
```

#### 🎯 Filtros de Issues Configurados

```json
{
  "defaultSeverities": ["BLOCKER", "CRITICAL", "MAJOR"],
  "excludeResolved": true,
  "focusOnNewCode": true,
  "excludePatterns": ["**/node_modules/**", "**/dist/**", "**/*.test.ts"],
  "includePatterns": ["src/**/*.ts", "src/**/*.tsx", "api/**/*.ts"]
}
```

#### 🔑 Autenticação

- **Tipo de Token**: USER token (não project token)
- **Gerar Token**: https://sonarcloud.io/account/security
- **Armazenamento**: User Settings do VS Code (não workspace settings)
- **Erro comum**: `SonarQube answered with Not authorized` → verificar tipo de token

#### 📋 SonarLint Connected Mode (settings.json)

```json
"sonarlint.connectedMode.connections.sonarcloud": [
  {
    "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
    "connectionId": "thiagobodevan-a11y-assistente-juridico-p"
  }
],
"sonarlint.connectedMode.project": {
  "connectionId": "thiagobodevan-a11y-assistente-juridico-p",
  "projectKey": "thiagobodevan-a11y_assistente-juridico-p"
}
```

#### 🤖 Sonar Copilot Assistant Features

| Feature | Status | Descrição |
|---------|--------|-----------|
| **Smart Fix** | ✅ Ativo | Fix automático com confirmação |
| **Batch Processing** | ✅ Ativo | Processar múltiplos issues |
| **Auto Branch** | ✅ Ativo | Criar branch `fix/sonar-*` |
| **Auto Commit** | ✅ Ativo | Commit com template padronizado |
| **Test Verification** | ✅ Ativo | Rodar testes antes de commit |
| **AI Training** | ✅ Ativo | Aprender com fixes aprovados |

**Diretório de treinamento IA:** `.sonar-copilot/training`

#### 🌐 SonarCloud API - Endpoints Úteis

A API REST do SonarCloud pode ser usada para consultas diretas. Base URL: `https://sonarcloud.io/api`

**Autenticação:**
```bash
# Usar token como usuário, senha vazia
curl -u "SEU_TOKEN:" "https://sonarcloud.io/api/..."
```

**Endpoints principais:**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/issues/search` | GET | Buscar issues do projeto |
| `/api/measures/component` | GET | Métricas (duplicação, cobertura, etc.) |
| `/api/project_analyses/search` | GET | Histórico de análises |
| `/api/qualitygates/project_status` | GET | Status do Quality Gate |
| `/api/hotspots/search` | GET | Security Hotspots |
| `/api/sources/lines` | GET | Código fonte com anotações |

**Exemplos de uso:**

```bash
# Buscar issues OPEN ordenados por severidade
curl -u "TOKEN:" "https://sonarcloud.io/api/issues/search?\
componentKeys=thiagobodevan-a11y_assistente-juridico-p&\
statuses=OPEN&\
ps=100&\
s=SEVERITY&\
asc=false"

# Buscar métricas de duplicação e cobertura
curl -u "TOKEN:" "https://sonarcloud.io/api/measures/component?\
component=thiagobodevan-a11y_assistente-juridico-p&\
metricKeys=duplicated_lines_density,coverage,bugs,vulnerabilities,code_smells"

# Status do Quality Gate
curl -u "TOKEN:" "https://sonarcloud.io/api/qualitygates/project_status?\
projectKey=thiagobodevan-a11y_assistente-juridico-p"

# Security Hotspots
curl -u "TOKEN:" "https://sonarcloud.io/api/hotspots/search?\
projectKey=thiagobodevan-a11y_assistente-juridico-p&\
status=TO_REVIEW"
```

**Parâmetros comuns:**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `componentKeys` | Project key | `thiagobodevan-a11y_assistente-juridico-p` |
| `statuses` | Status dos issues | `OPEN`, `CONFIRMED`, `RESOLVED` |
| `severities` | Severidades | `BLOCKER`, `CRITICAL`, `MAJOR`, `MINOR`, `INFO` |
| `types` | Tipos | `BUG`, `VULNERABILITY`, `CODE_SMELL` |
| `ps` | Page size | `1` a `500` |
| `p` | Página | `1`, `2`, etc. |
| `s` | Sort field | `SEVERITY`, `CREATION_DATE`, `UPDATE_DATE` |
| `asc` | Ordem | `true` (ASC), `false` (DESC) |
| `branch` | Branch específica | `main`, `develop` |

**Métricas disponíveis:**

| Métrica | Descrição |
|---------|-----------|
| `duplicated_lines_density` | % de linhas duplicadas |
| `coverage` | Cobertura de testes |
| `bugs` | Contagem de bugs |
| `vulnerabilities` | Vulnerabilidades de segurança |
| `code_smells` | Code smells |
| `security_hotspots` | Security hotspots |
| `sqale_index` | Débito técnico (minutos) |
| `reliability_rating` | Rating A-E para bugs |
| `security_rating` | Rating A-E para vulnerabilidades |

**Documentação completa:** https://sonarcloud.io/web_api

#### ⚙️ Comandos Úteis para o Copilot

##### Análise de Migração

```
@workspace Quais hooks ainda não foram migrados para o padrão validated?
```

##### Análise de Monitoramento

```
@workspace Mostre todo código que envia spans para o Sentry
```

##### Análise de Schemas

```
@workspace Liste todos os schemas Zod e seus campos obrigatórios
```

##### Análise de Agentes IA

```
@workspace Quais agentes ainda não estão instrumentados com Sentry AI Monitoring?
```

##### Análise de Performance

```
@workspace Encontre componentes sem lazy loading que deveriam ter
```

### ⚙️ Regras para o Copilot

1. **Sempre prefira Serena** para buscas semânticas (não faça busca manual de texto)
2. **Use `@workspace`** antes de comandos de busca
3. **Valide resultados** do Serena antes de sugerir mudanças
4. **Não modifique arquivos** sem confirmar com o usuário
5. **Reporte erros** se o Serena não responder

### 🔐 Segurança

- Serena **não tem acesso de escrita** ao repositório
- Apenas **lê código** do workspace
- **Não envia dados** para servidores externos (roda localmente)
- Respeita `.gitignore` automaticamente

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

### 🔒 Regras específicas para novos serviços opcionais (Qdrant / DSPy / Email)

- **Qdrant**: Não modifique collections/indices diretamente sem aprovação da equipe; prefira aplicar alterações via migrations e documente o impacto de scaling/retention.
- **DSPy Bridge**: Qualquer atualização de imagem ou dependências deve ser testada com `dspy-bridge` em ambiente de staging; atualizações em produção requerem rollback plan e teste de latência.
- **Email API / Email service**: Não altere os provedores de e-mail (resend) sem atualização dos testes e documentação; valide `RESEND_API_KEY` e monitore filas.

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

### 🔄 Sugerindo Mudanças de Código

Ao sugerir mudanças no código, o Copilot deve:

1. **Buscar primeiro as funções similares** já existentes usando o Serena MCP Server
2. **Analisar o contexto** da função: parâmetros, tipos, lógica
3. **Manter estilo e convenções** do código existente
4. **Adicionar testes** para nova lógica ou alterações relevantes
5. **Documentar alterações** significativas

---

## Comunicação e Idioma (Português)

- Responda sempre em Português do Brasil (pt-BR) nas mensagens de resposta, instruções, comentários e planos — tanto no Copilot Chat quanto nas operações de revisão e sugestões automáticas.
- Use linguagem clara, objetiva e direta. Se for necessário usar termos técnicos em inglês, explique-os em português entre parênteses.
- Ao apresentar passos (ex.: rodar build, executar lint, corrigir erros), forneça instruções passo a passo em português.
- Para mensagens de commit sugeridas ou descrições de PR, gere o texto em português e, opcionalmente, inclua uma tradução curta em inglês somente se solicitado.

> Nota: O VS Code já carrega este arquivo por padrão (configuração "GitHub > Copilot > Copilot Chat: Use Instruction Files"). O front matter `applyTo: "**"` garante que Chat, Coding Agent e Code Review consumam estas instruções sem qualquer ação adicional.
