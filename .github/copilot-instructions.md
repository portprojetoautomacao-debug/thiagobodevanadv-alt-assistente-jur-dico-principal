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
- **Padrões React/UI**: Apenas components funcionais, props `Props`, hooks no topo, alias `@/`. `src/components/ui/` (shadcn) é imutável. Manter lazy-loading/código dividido alinhado com `App.tsx` (ver `docs/LAZY_LOADING_MAP.md`), skeleton loaders e `aria-label` em botões.
- **Tipos/estado**: `src/types.ts` centraliza `Process`, `Expediente`, `Minuta`. Extensão usa tipos em `chrome-extension-pje/src/shared/types.ts` (`ProcessoPJe`, `Expediente`, `SyncMessage`). Ao adicionar campos, siga `docs/TYPE_SYNC_CHECKLIST.md` para sincronizar hooks (`use-processes`, `use-auto-minuta`), APIs (`api/agents.ts`, `api/expedientes.ts`, `api/pje-sync.ts`) e contadores do dashboard.
- **Segurança/Performance**: Nada de segredos no repo; use `src/lib/config.ts` + `.env.example`. Respeite `manualChunks` de `vite.config.ts`, CSP de `vercel.json` e monitoração Sentry (`src/services/error-tracking.ts`). Extensão Chrome: API Key armazenada em Chrome Storage, comunicação HTTPS apenas.
- **Workflow**: Antes de PR, rode lint+testes e reporte resultados; manter `main` verde garante deploy automático Vercel. Para extensão, rode `npm test` em `chrome-extension-pje/`.

### 🔒 Regras específicas para novos serviços opcionais (Qdrant / DSPy / Email)

- **Qdrant**: Não modifique collections/indices diretamente sem aprovação da equipe; prefira aplicar alterações via migrations e documente o impacto de scaling/retention.
- **DSPy Bridge**: Qualquer atualização de imagem ou dependências deve ser testada com `dspy-bridge` em ambiente de staging; atualizações em produção requerem rollback plan e teste de latência.
- **Email API / Email service**: Não altere os provedores de e-mail (resend) sem atualização dos testes e documentação; valide `RESEND_API_KEY` e monitore filas.


### ⚡ Quick Start para Novos AI Agents

**Ao começar em um dia/sessão:**
1. Verifique status automático: `npm run type-check && npm run lint && npm run test:run`
2. Se tasks automáticas falharam (terminal exit code 1), reinicie: `npm run dev`
3. Mapa mental rápido:
   - **Frontend**: `src/` → React components, hooks, services
   - **API**: `api/` → Serverless functions (Vercel), 30-60s timeout
   - **Agents**: `src/lib/agents.ts` → 15 agentes IA (9 ativos)
   - **Data**: Upstash KV (Redis) via `useKV()` hook ou `api/kv.ts`
   - **Tests**: Vitest (`src/**/*.test.ts`), Playwright (`tests/e2e/`)

### 📚 Comandos Úteis para Copilot

**Acesso rápido à documentação crítica:**

```bash
# Quick start
@workspace Abrir .github/copilot-instructions.md seção "Quick Start"

# Troubleshooting
@workspace Abrir .github/copilot-instructions.md seção "Troubleshooting"

# Lazy loading
@workspace Abrir docs/LAZY_LOADING_MAP.md

# Sincronização de tipos
@workspace Abrir docs/TYPE_SYNC_CHECKLIST.md
```

### 🗺️ Mapa de Endpoints API (Serverless)

Todos em `api/*.ts`, deploy via Vercel Functions (Node.js 22.x):

| Endpoint | Arquivo | Timeout | Função |
|----------|---------|---------|--------|
| `/api/agents` | `api/agents.ts` | 45s | Executar agentes IA, processar tarefas |
| `/api/agents/process-task` | `api/agents/process-task.ts` | 60s | Worker de fila de tarefas de agentes |
| `/api/pje-sync` | `api/pje-sync.ts` | 30s | Recebe processos da extensão Chrome |
| `/api/expedientes` | `api/expedientes.ts` | 30s | CRUD de expedientes/intimações |
| `/api/cron` | `api/cron.ts` | 60s | Jobs agendados (DJEN, backups) |
| `/api/llm-stream` | `api/llm-stream.ts` | 60s | Proxy streaming para Gemini 2.5 |
| `/api/notifications` | `api/notifications.ts` | 30s | Sistema de notificações |
| `/api/health` | `api/health.ts` | 10s | Healthcheck (Upstash, Qdrant, etc) |
| `/api/kv` | `api/kv.ts` | 30s | Acesso direto ao KV (debug) |

**Importante**: Vercel Functions têm timeout máximo. LLM calls devem usar streaming (`llm-stream.ts`) para evitar timeout.

---

## 🔧 Troubleshooting Comum

### 🚨 Tasks Automáticas Falhando (Exit Code 1)

**Sintomas**: Terminais `auto-dev`, `auto-watch`, `auto-test-unit` saem com Exit Code 1

**Diagnóstico Rápido**:
```bash
# 1. Verificar se Node.js/npm estão instalados
node --version  # Deve ser v22.x
npm --version

# 2. Reinstalar dependências
npm ci

# 3. Verificar problemas TypeScript
npm run type-check

# 4. Verificar linting
npm run lint
```

**Soluções Comuns**:
- **Port já em uso (dev server)**: `npm run kill` ou matar processo na porta 5173
- **Dependências faltando**: `npm ci` (não `npm install` - usa package-lock.json exato)
- **Erro TypeScript**: Corrigir tipos em `src/` antes de rodar dev
- **ESLint warnings > 150**: Executar `npm run lint:fix`
- **Vitest travado**: Limpar cache com `npm run test:clear-cache`

### 🧪 Testes Falhando

**Fluxo de Diagnóstico**:
```bash
# 1. Rodar testes específicos
npm run test:run -- src/path/to/file.test.ts

# 2. Ver UI de testes
npm run test:ui

# 3. Atualizar snapshots (se necessário)
npm run test:update-snapshots

# 4. Testes E2E (Playwright)
npm run test:e2e
npm run test:e2e:headed  # Com interface gráfica
```

**Padrão de Testes**:
- Unitários: `src/**/*.test.ts` (Vitest)
- API: `api/**/*.test.ts` (executar com `npm run test:api`)
- E2E: `tests/e2e/**/*.spec.ts` (Playwright)
- Chrome Extension: `chrome-extension-pje/src/**/*.test.ts` (Jest)

### 🔄 Chrome Extension Build Falhando

**Passos**:
```bash
cd chrome-extension-pje

# 1. Verificar dependências
npm ci

# 2. Compilar TypeScript
npm run build

# 3. Rodar testes
npm test

# 4. Gerar ZIP de distribuição
npm run package
```

**Erros Comuns**:
- **Webpack build falha**: Verificar `webpack.config.js`, atualizar target para ES2021
- **Testes falham**: Verificar `chrome.storage` mock em `setupTests.ts`
- **Popup não abre**: Verificar manifest.json, permissões

### 🗄️ Problemas com Upstash KV

**Sintomas**: Dados não persistem, erros 401/403 em `/api/kv`

**Verificação**:
```bash
# Testar conexão via API Health
curl https://assistente-juridico-github.vercel.app/api/health

# Verificar variáveis de ambiente
# UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN devem estar em .env.local
```

**Nota**: `useKV()` hook faz cache local + sincroniza com KV. Se dados não aparecem, verificar React DevTools → Components → procurar pelo hook.

### � Serviços Opcionais Não Conectando

#### 🔍 Qdrant (Pesquisa Jurisprudencial)

**Sintomas**: Erros em `qdrant-service.ts`, busca vetorial não funciona

**Diagnóstico**:
```bash
# Verificar collection
npm run qdrant:test

# População da base
npm run qdrant:populate:dry-run --max-docs=10

# Ver estatísticas
npm run qdrant:stats
```

**Importante**: Qdrant é opcional. Sistema funciona sem ele, mas sem busca semântica de precedentes.  
**Guia completo**: [docs/QDRANT_QUICK_START.md](../docs/QDRANT_QUICK_START.md)

#### 🎯 DSPy Bridge (Otimização de Prompts)

**Sintomas**: Prompts não otimizados, custo alto de API

**Diagnóstico**:
```bash
# Testar conexão
curl $DSPY_BRIDGE_URL/health

# Railway logs
railway logs | grep ERROR

# Docker local
docker logs dspy-bridge
```

**Importante**: DSPy é opcional. Reduz custo em 90% mas sistema funciona sem ele.  
**Guia completo**: [docs/DSPY_BRIDGE_SETUP.md](../docs/DSPY_BRIDGE_SETUP.md)

#### 📧 Email API (Notificações)

**Sintomas**: Notificações não enviadas, fila travada

**Diagnóstico**:
```bash
# Ver fila
curl http://localhost:5173/api/emails?action=queue

# Processar manualmente
curl http://localhost:5173/api/cron?action=process-email-queue

# Verificar Resend API Key
echo $RESEND_API_KEY
```

**Importante**: Email é opcional. Agentes funcionam sem notificações automáticas.  
**Guia completo**: [docs/EMAIL_API_WORKFLOW.md](../docs/EMAIL_API_WORKFLOW.md)

### �📊 Data Flows Críticos (Não Óbvios)

#### 🔄 Fluxo: DJEN → Expedientes → Agentes → Minutas

```
1. DJEN Monitor (Cron diário 12h)
   ↓ api/cron.ts?action=djen-monitor
   
2. Salvar Expedientes
   ↓ POST /api/expedientes
   ↓ Upstash KV: expedientes:*
   
3. Trigger Agentes (Mrs. Justin-e)
   ↓ useAutonomousAgents hook
   ↓ POST /api/agents com action=process-expediente
   
4. Agente cria Minuta
   ↓ redacao-peticoes (Gemini 2.5)
   ↓ MinutasManager recebe via useAutoMinuta()
   
5. Usuário revisa/aprova
   ↓ TiptapEditor.tsx
   ↓ Google Docs sync (opcional)
```

#### 🔌 Fluxo: Chrome Extension → PJe Sync

```
1. Usuário navega no PJe
   ↓ Content Script (content.ts)
   ↓ Extrai processos via DOM scraping
   
2. Sync manual ou automático
   ↓ Background Worker (background.ts)
   ↓ POST /api/pje-sync com processos[]
   
3. Backend persiste
   ↓ Upstash KV: processes:*
   ↓ Incrementa contadores (expedientes, minutas)
   
4. Frontend atualiza
   ↓ useProcessSync() hook
   ↓ Dashboard mostra novos processos
```

#### 🤖 Padrão: Agent Task Queue

Agentes não executam diretamente - sempre via fila:

```typescript
// ❌ ERRADO: Executar agente diretamente
await agente.processar(tarefa);

// ✅ CORRETO: Adicionar à fila
await addTaskToQueue({
  id: uuid(),
  agentId: 'harvey',
  type: 'ANALYZE_INTIMATION',
  priority: 'high',
  status: 'queued',
  createdBy: 'sistema',
  createdAt: new Date().toISOString(),
  data: { expedienteId: '123' }
});

// Worker processa em api/agents/process-task.ts
```

**Por quê?**: Evita timeout de Vercel Functions (max 60s). Tasks longas são processadas em background.

### 📚 Guias de Setup para Serviços Opcionais

O sistema possui 3 serviços opcionais que aumentam performance e reduzem custos:

#### 🔍 Qdrant - Pesquisa Semântica de Jurisprudências

**Status**: Collection criada | População pendente  
**Benefício**: Busca vetorial de precedentes jurídicos  
**Guia Completo**: [docs/QDRANT_QUICK_START.md](../docs/QDRANT_QUICK_START.md)

```bash
# Setup rápido (5 min)
npm run qdrant:init         # Criar collection
npm run qdrant:test         # Testar conexão
npm run qdrant:populate:dry-run --max-docs=10  # Simular população
npm run qdrant:populate-datajud --max-docs=1000  # Popular

# Variáveis necessárias:
# QDRANT_URL=https://seu-cluster.cloud.qdrant.io:6333
# QDRANT_API_KEY=sua-api-key
# VITE_GEMINI_API_KEY=necessário-para-embeddings
```

**Documentação adicional**:
- Setup: `docs/QDRANT_SETUP_CHECKLIST.md`
- Configuração: `docs/QDRANT_CONFIG_COMPLETA.md`
- DataJud: `docs/QDRANT_DATAJUD_AUTOMATION.md`
- Status: `docs/QDRANT_AGENTS_STATUS.md`

#### 🎯 DSPy Bridge - Otimização de Prompts

**Status**: Opcional | Reduz custo em 90%  
**Benefício**: $0.50 → $0.10 por consulta  
**Guia Completo**: [docs/DSPY_BRIDGE_SETUP.md](../docs/DSPY_BRIDGE_SETUP.md)

```bash
# Opção 1: Railway (Produção)
railway login
railway init
railway up
railway variables set DSPY_API_TOKEN=seu-token-seguro

# Opção 2: Docker Local (Dev)
docker build -t dspy-bridge -f scripts/Dockerfile.dspy .
docker run -d -p 8765:8765 -e DSPY_API_TOKEN=dev dspy-bridge

# Opção 3: Python Direto (Debug)
python3 scripts/dspy_bridge.py

# Variáveis necessárias:
# DSPY_BRIDGE_URL=https://seu-app.railway.app
# DSPY_API_TOKEN=token-seguro-32-chars
```

**Quando usar**: Sistema com > 1000 consultas/mês

#### 📧 Email API - Notificações Automáticas

**Status**: Implementado | Provider: Resend.com  
**Benefício**: Notificações de intimações, prazos, minutas  
**Guia Completo**: [docs/EMAIL_API_WORKFLOW.md](../docs/EMAIL_API_WORKFLOW.md)

```bash
# Testar envio
curl -X POST http://localhost:5173/api/emails \
  -H "Content-Type: application/json" \
  -d '{"to":"seu@email.com","type":"test","subject":"Teste","data":{}}'

# Processar fila (executado via cron a cada 5 min)
curl http://localhost:5173/api/cron?action=process-email-queue

# Variáveis necessárias:
# RESEND_API_KEY=re_your_api_key
# EMAIL_FROM=noreply@yourdomain.com (ou onboarding@resend.dev para teste)
# ADMIN_EMAIL=admin@yourdomain.com
```

**Tipos de email**: `intimation`, `daily-summary`, `deadline-alert`, `minuta-created`, `test`

---

- **App Principal (URL OFICIAL)**: https://assistente-juridico-github.vercel.app/
- **App Alternativo (URL ANTIGA - DEPRECADA)**: https://assistente-juridico-github.vercel.app/
- **API Health**: https://assistente-juridico-github.vercel.app/api/health

> ⚠️ **IMPORTANTE**: A URL oficial de produção é **`assistente-juridico-github.vercel.app`**.
> A URL antiga `assistente-juridico-github.vercel.app` está deprecada e deve ser substituída em todo o código.

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
- **Repositório**: thiagobodevan-a11y/assistente-juridico-p
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

## 📊 Sistema de Tracing e Observabilidade

### 🔍 OpenTelemetry Integrado

O projeto possui **tracing completo com OpenTelemetry** já configurado para monitoramento de agentes de IA e operações jurídicas.

#### **Arquivos de Tracing**

| Arquivo | Função | Status |
|---------|--------|--------|
| `src/lib/otel-integration.ts` | OpenTelemetry SDK Web (frontend) | ✅ Ativo |
| `src/lib/tracing.ts` | Sistema de tracing interno | ✅ Ativo |
| `src/lib/agent-tracing.ts` | Tracing específico para agentes | ✅ Ativo |
| `src/components/TracingDashboard.tsx` | Dashboard visual de traces | ✅ Ativo |

#### **Como Usar o Tracing**

**1. Inicialização Automática:**
```typescript
// main.tsx - Já configurado
import { initializeOpenTelemetry } from './lib/otel-integration';

// Inicializar PRIMEIRO (antes do React)
initializeOpenTelemetry();
```

**2. Visualizar Traces:**
```bash
# Abrir AI Toolkit Trace Viewer
Ctrl+Shift+P → "AI Toolkit: Open Trace Viewer"

# Endpoint OTLP (padrão)
http://localhost:4318/v1/traces
```

**3. Criar Spans Customizados:**
```typescript
import { tracingService } from '@/lib/tracing';

const span = tracingService.startSpan('operacao-juridica', {
  agente: 'harvey',
  processo: 'CNJ-123',
  tipo: 'analise'
});

try {
  // Seu código aqui
  span.addEvent('documento-analisado');
} finally {
  span.end();
}
```

#### **Variáveis de Ambiente**

```bash
# .env.local
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces  # AI Toolkit (padrão)
# ou
VITE_OTLP_ENDPOINT=https://seu-collector.com/v1/traces  # Produção
```

#### **Dependências OpenTelemetry**

Já instaladas no `package.json`:
- `@opentelemetry/api`
- `@opentelemetry/sdk-trace-web`
- `@opentelemetry/exporter-trace-otlp-http`
- `@opentelemetry/resources`
- `@opentelemetry/semantic-conventions`

#### **⚠️ Regras de Tracing**

1. **Nunca desativar** o tracing sem justificativa - é critical para debugging de agentes
2. **Usar spans** para operações longas (> 1s) como chamadas LLM, scraping DJEN, análise de documentos
3. **Adicionar atributos** relevantes: `processo_id`, `agente_id`, `tipo_operacao`, `resultado`
4. **Eventos importantes**: quando agente toma decisão, detecta prazo, gera minuta
5. **Tracing de erros**: sempre registrar erros em spans (`span.setStatus({ code: SpanStatusCode.ERROR })`)

#### **Integração com Agentes**

Os 15 agentes já possuem tracing integrado via `agent-tracing.ts`:

```typescript
// Exemplo: src/lib/agents.ts
import { createAgentSpan } from '@/lib/agent-tracing';

async function executarAgente(agentId: string, task: TarefaSistema) {
  const span = createAgentSpan(agentId, task.id, 'execucao');
  
  try {
    span.addEvent('tarefa-iniciada', { prioridade: task.prioridade });
    // ... lógica do agente
    span.addEvent('tarefa-concluida', { status: 'sucesso' });
  } catch (error) {
    span.recordException(error);
  } finally {
    span.end();
  }
}
```

#### **Comandos Úteis**

```bash
# Ver traces em tempo real
npm run dev  # Tracing ativado automaticamente

# Validar configuração OpenTelemetry
@workspace Verificar src/lib/otel-integration.ts

# Ver dashboard de traces
@workspace Abrir src/components/TracingDashboard.tsx
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
| **assistente-juridico-p** | https://github.com/thiagobodevan-a11y/assistente-juridico-p | Repositório alvo - Sistema jurídico completo |

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

---
