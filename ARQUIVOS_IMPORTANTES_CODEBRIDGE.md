# 📁 Arquivos Importantes para CodeBridge

> **Objetivo**: Lista de arquivos essenciais para usar com CodeBridge (botão direito → Copy + AI Prompt)
>
> **Como usar**: Clique com botão direito no arquivo/pasta e selecione "Copy + AI Prompt"

---

## 🎯 CORE DO SISTEMA (Mais Importantes)

### 📋 Configuração Principal
```
📄 package.json                    # Dependências e scripts NPM
📄 tsconfig.json                   # Configuração TypeScript
📄 vite.config.ts                  # Build e otimizações
📄 vercel.json                     # Deploy e cron jobs
📄 .env.example                    # Variáveis de ambiente
```

### 🤖 Sistema de Agentes IA
```
📂 src/lib/
  📄 agents.ts                     # ⭐ Definição dos 15 agentes
  📄 gemini-service.ts             # ⭐ Integração Gemini 2.5 Pro
  📄 autonomous-agents.ts          # Orquestração de agentes
  📄 agent-executor.ts             # Execução de tarefas
  📄 qdrant-service.ts             # Busca vetorial (jurisprudência)
  📄 datajud-service.ts            # API DataJud CNJ
  📄 djen-api.ts                   # DJEN monitoring
```

### ✏️ Editor de Minutas (CKEditor 5)
```
📂 src/components/
  📄 MinutasManagerV2.tsx          # ⭐ Gestão de minutas (467 linhas)

📂 src/components/editor/
  📄 ProfessionalEditor.tsx        # ⭐ CKEditor 5 + IA (623 linhas)
  📄 index.ts                      # Exports do editor

📂 src/hooks/
  📄 use-auto-minuta.ts            # ⭐ Criação automática de minutas

📂 src/services/
  📄 minuta-service.ts             # CRUD centralizado de minutas
```

### 📝 Templates e Documentos
```
📂 src/lib/
  📄 document-templates.ts         # 8 templates jurídicos
  📄 template-variables.ts         # Sistema de variáveis {{}}
```

---

## 🔌 INTEGRAÇÕES EXTERNAS

### 🌐 APIs Backend (Vercel Functions)
```
📂 api/
  📄 agents.ts                     # ⭐ Endpoints de agentes
  📄 expedientes.ts                # CRUD de expedientes
  📄 pje-sync.ts                   # Sync com extensão Chrome PJe
  📄 emails.ts                     # Envio de emails (Resend)
  📄 cron.ts                       # ⭐ Jobs agendados (10+)
  📄 health.ts                     # Health check
```

### 🔍 Monitoramento (DJEN/DataJud)
```
📂 src/lib/
  📄 djen-api.ts                   # Diário de Justiça Eletrônico
  📄 datajud-api.ts                # API DataJud CNJ
  📄 datajud-service.ts            # Integração completa
```

### 📅 Google Calendar
```
📂 src/lib/
  📄 google-calendar-service.ts   # Sincronização de prazos
  📄 google-auth.ts               # OAuth 2.0
```

### 🔒 Segurança e Compliance
```
📂 src/services/
  📄 error-tracking.ts            # Sentry + PII filtering
  📄 monitoring.ts                # OpenTelemetry

📂 src/lib/
  📄 lgpd-compliance.ts           # Sanitização LGPD
```

---

## 🧪 TESTES E QUALIDADE

### 🧪 Testes
```
📄 vitest.config.ts               # Config Vitest principal
📄 playwright.config.ts           # Config testes E2E
📂 tests/                         # Testes unitários
📂 src/__tests__/                 # Testes por componente
```

### 📊 Análise de Código
```
📄 eslint.config.js               # ESLint rules
📄 .prettierrc                    # Code formatting
📄 sonar-project.properties       # SonarCloud config
```

---

## 🎨 COMPONENTES UI (React)

### 📱 Páginas Principais
```
📂 src/components/
  📄 Dashboard.tsx                # Dashboard principal
  📄 ProcessList.tsx              # Lista de processos
  📄 ProcessDetails.tsx           # Detalhes do processo
  📄 ExpedientePanel.tsx          # Painel de expedientes
  📄 AILegalChat.tsx              # Chat com Harvey Specter
```

### 🎨 UI Components (shadcn)
```
📂 src/components/ui/
  📄 button.tsx                   # Botões
  📄 dialog.tsx                   # Modais
  📄 toast.tsx                    # Notificações
  📄 tabs.tsx                     # Tabs
  📄 card.tsx                     # Cards
```

---

## 🗄️ ESTADO E PERSISTÊNCIA

### 💾 Hooks de Estado
```
📂 src/hooks/
  📄 use-processes.ts             # ⭐ Gestão de processos
  📄 use-expedientes.ts           # Gestão de expedientes
  📄 use-autonomous-agents.ts     # ⭐ Orquestração de agentes
  📄 use-kv.ts                    # Upstash Redis KV
  📄 use-auto-minuta.ts           # Criação automática minutas
```

### 🔄 Serviços
```
📂 src/services/
  📄 process-service.ts           # CRUD processos
  📄 expediente-service.ts        # CRUD expedientes
  📄 minuta-service.ts            # CRUD minutas
  📄 kv-service.ts                # Redis operations
```

---

## 🌐 EXTENSÃO CHROME PJE SYNC

### 📦 Chrome Extension
```
📂 chrome-extension-pje/
  📄 manifest.json                # Manifest v3
  📄 README.md                    # Documentação
  📄 INSTALL.md                   # Guia instalação

📂 chrome-extension-pje/src/
  📄 background.ts                # Service Worker
  📄 content.ts                   # Content Script
  📄 popup.tsx                    # UI da extensão

📂 chrome-extension-pje/src/shared/
  📄 types.ts                     # Tipos compartilhados
```

---

## 📚 DOCUMENTAÇÃO

### 📖 Docs Principais
```
📄 README.md                      # ⭐ Documentação completa
📄 COMECE_AQUI.md                 # Quick start
📄 AUTO_MODE_README.md            # Sistema automático
📄 TODOS_OS_15_AGENTES.md         # ⭐ Detalhes dos agentes
📄 CHANGELOG.md                   # Histórico de mudanças
```

### 🏗️ Arquitetura
```
📂 docs/
  📄 UPGRADE_AGENTES_RESUMO_COMPLETO.md  # ⭐ Arquitetura híbrida
  📄 QDRANT_DATAJUD_AUTOMATION.md        # População automática
  📄 QDRANT_AGENTS_STATUS.md             # Status integração Qdrant
  📄 FLUXO_MINUTAS_AUTOMATICAS.md        # Fluxo de minutas
  📄 MCP_SETUP.md                        # GitHub MCP Server
```

---

## 🚀 SCRIPTS ÚTEIS

### 🔧 Automação
```
📂 scripts/
  📄 populate-qdrant-datajud.ts   # População Qdrant
  📄 init-qdrant-collection.ts    # Setup Qdrant
  📄 test-qdrant-connection.ts    # Validação Qdrant
  📄 sonar-auto-analyze.sh        # Análise SonarCloud
  📄 auto-test-watcher.sh         # Watch de testes
```

---

## 💡 CASOS DE USO POR PERSONA

### 🏗️ Architect (Análise de Arquitetura)
```
Recomendados:
1. src/lib/agents.ts
2. docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md
3. vite.config.ts
4. api/cron.ts
5. src/hooks/use-autonomous-agents.ts
```

### 👨‍💻 Senior Engineer (Code Review)
```
Recomendados:
1. src/components/MinutasManagerV2.tsx
2. src/components/editor/ProfessionalEditor.tsx
3. src/lib/gemini-service.ts
4. src/hooks/use-auto-minuta.ts
5. api/agents.ts
```

### 🔒 Security Auditor (Segurança)
```
Recomendados:
1. src/services/error-tracking.ts
2. src/lib/lgpd-compliance.ts
3. api/emails.ts
4. vercel.json
5. .env.example
```

### 🧪 Test Engineer (Testes)
```
Recomendados:
1. vitest.config.ts
2. playwright.config.ts
3. src/__tests__/
4. tests/
5. scripts/auto-test-watcher.sh
```

---

## 🎯 WORKFLOWS RECOMENDADOS

### 1️⃣ Revisar Sistema de Agentes
```bash
# Botão direito em:
src/lib/agents.ts +
src/lib/autonomous-agents.ts +
docs/TODOS_OS_15_AGENTES.md

# Persona: "Architect"
# Prompt: "Como melhorar escalabilidade deste sistema?"
```

### 2️⃣ Otimizar Editor de Minutas
```bash
# Botão direito em:
src/components/MinutasManagerV2.tsx +
src/components/editor/ProfessionalEditor.tsx

# Persona: "Senior Engineer"
# Prompt: "Identifique gargalos de performance"
```

### 3️⃣ Auditar Segurança
```bash
# Botão direito em:
src/services/error-tracking.ts +
src/lib/lgpd-compliance.ts

# Persona: "Security Auditor"
# Prompt: "Liste vulnerabilidades de segurança"
```

### 4️⃣ Gerar Documentação
```bash
# Botão direito em:
src/lib/gemini-service.ts

# Persona: "Documentation Writer"
# Prompt: "Gere README técnico completo"
```

---

## ⚙️ CONFIGURAÇÕES RECOMENDADAS

### CodeBridge Settings (JSON)
```json
{
  "codeBridge.copy.includeStats": true,
  "codeBridge.copy.removeLeadingWhitespace": true,
  "codeBridge.copy.maxFileSize": 500000,
  "codeBridge.copy.lineWarningLimit": 10000,
  "codeBridge.tree.style": "modern",
  "codeBridge.tree.maxDepth": 4,
  "codeBridge.generator.overwriteExisting": false
}
```

---

## 🔥 TOP 10 ARQUIVOS MAIS IMPORTANTES

1. **src/lib/agents.ts** - Definição dos 15 agentes IA
2. **src/components/MinutasManagerV2.tsx** - Gestão de minutas
3. **src/components/editor/ProfessionalEditor.tsx** - Editor CKEditor 5
4. **api/agents.ts** - Backend de agentes
5. **src/hooks/use-autonomous-agents.ts** - Orquestração
6. **src/lib/gemini-service.ts** - Integração IA
7. **api/cron.ts** - Jobs agendados
8. **docs/UPGRADE_AGENTES_RESUMO_COMPLETO.md** - Arquitetura
9. **README.md** - Documentação completa
10. **vite.config.ts** - Build e otimizações

---

**Criado em**: 12/12/2025
**Atualizado**: Sessão atual
**Propósito**: Guia rápido para usar CodeBridge no projeto
