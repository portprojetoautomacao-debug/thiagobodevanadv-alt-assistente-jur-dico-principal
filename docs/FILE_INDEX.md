# 📁 Índice Completo de Arquivos - Assistente Jurídico PJe

> Gerado automaticamente em: 26/11/2025
> Total de arquivos TypeScript/TSX: ~190

---

## 🏷️ Legenda de Tags

| Tag | Significado |
|-----|-------------|
| `#api` | Função serverless (Vercel) |
| `#frontend` | Componente React |
| `#hook` | Custom React Hook |
| `#lib` | Biblioteca/Utilitário |
| `#ai` | Funcionalidade de IA |
| `#agent` | Agente autônomo |
| `#integration` | Integração externa |
| `#test` | Arquivo de teste |
| `#config` | Configuração |
| `#ui` | Componente UI (shadcn) |
| `#cron` | Tarefa agendada |
| `#auth` | Autenticação |
| `#legal` | Funcionalidade jurídica |
| `#djen` | Integração DJEN/PJe |
| `#calendar` | Calendário/Prazos |
| `#financial` | Financeiro |
| `#deprecated` | Arquivo obsoleto |

---

## 📂 Estrutura por Diretório

### `/api` - Funções Serverless Vercel
> 23 endpoints ativos

#### `/api/_lib` - Utilitários Serverless
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `circuit-breaker.ts` | `#api` `#lib` `#ai` | Circuit breaker para resiliência de APIs |
| `djen-client.ts` | `#api` `#lib` `#djen` `#legal` | Cliente DJEN para serverless |
| `kv-utils.ts` | `#api` `#lib` | Utilitários Upstash Redis KV |

#### `/api/agents` - Endpoints de Agentes
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `log.ts` | `#api` `#agent` | Log de atividades dos agentes |

#### `/api/auth` - Autenticação
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `github.ts` | `#api` `#auth` | OAuth GitHub |
| `gitlab.ts` | `#api` `#auth` | OAuth GitLab |

#### `/api/intimacoes` - Intimações
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `pendente.ts` | `#api` `#legal` `#djen` | Intimações pendentes |

#### `/api/tarefas` - Tarefas
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `criar.ts` | `#api` `#integration` | Criar tarefas (Todoist) |

#### `/api/whatsapp` - WhatsApp
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `send.ts` | `#api` `#integration` | Envio de mensagens WhatsApp |

#### `/api` - Raiz
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `agents.ts` | `#api` `#agent` `#ai` | API principal de agentes IA |
| `backup.ts` | `#api` `#lib` | Backup de dados |
| `cron.ts` | `#api` `#cron` `#djen` | Tarefas agendadas (DJEN monitor, reset diário) |
| `expedientes.ts` | `#api` `#legal` | Expedientes judiciais |
| `gitlab-webhook.ts` | `#api` `#integration` | Webhook GitLab CI/CD |
| `kv.ts` | `#api` `#lib` | API Upstash Redis KV |
| `lawyers.ts` | `#api` `#legal` | Gestão de advogados monitorados |
| `legal-services.ts` | `#api` `#legal` `#djen` | Serviços jurídicos (prazos, DJEN) |
| `llm-proxy.ts` | `#api` `#ai` | Proxy para LLM |
| `notifications.ts` | `#api` `#integration` | Sistema de notificações |
| `observability.ts` | `#api` `#ai` `#lib` | Observabilidade (circuit breakers, traces) |
| `pje.ts` | `#api` `#legal` `#djen` | Integração PJe |
| `spark-proxy.ts` | `#api` `#ai` | Proxy Spark LLM |
| `status.ts` | `#api` `#lib` | Health check da API |
| `todoist-webhook.ts` | `#api` `#integration` | Webhook Todoist |
| `todoist-webhook.test.ts` | `#api` `#test` | Testes webhook Todoist |
| `todoist.ts` | `#api` `#integration` | API Todoist |
| `vercel-webhook.ts` | `#api` `#integration` | Webhook Vercel deploy |
| `webhook.ts` | `#api` `#integration` | Webhook genérico |

---

### `/lib` - Bibliotecas Compartilhadas

#### `/lib/ai` - Sistema de Agentes IA
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `agent-orchestrator.ts` | `#lib` `#ai` `#agent` | Orquestrador multi-agentes (LangGraph patterns) |
| `agents-registry.ts` | `#lib` `#ai` `#agent` | Registro de agentes disponíveis |
| `circuit-breaker.ts` | `#lib` `#ai` | Circuit breaker com logs detalhados |
| `core-agent.ts` | `#lib` `#ai` `#agent` | Classe base SimpleAgent (ReAct pattern) |
| `http-llm-client.ts` | `#lib` `#ai` | Cliente HTTP para LLMs |
| `orchestrator-examples.ts` | `#lib` `#ai` `#agent` | Exemplos de orquestração |
| `tools.ts` | `#lib` `#ai` `#agent` | Ferramentas disponíveis para agentes |

#### `/lib/api` - Clientes de API
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `datajud-client.ts` | `#lib` `#integration` `#legal` | Cliente API DataJud |
| `djen-client.ts` | `#lib` `#djen` `#legal` | Cliente API DJEN (Comunica PJe) |
| `kv-utils.ts` | `#lib` | Utilitários KV para backend |

---

### `/src` - Frontend React

#### `/src/components` - Componentes Principais
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `AIAgents.tsx` | `#frontend` `#ai` `#agent` | Painel de agentes IA |
| `AIContractAnalyzer.tsx` | `#frontend` `#ai` `#legal` | Analisador de contratos com IA |
| `AIDocumentSummarizer.tsx` | `#frontend` `#ai` `#legal` | Resumidor de documentos |
| `AIEmailDrafter.tsx` | `#frontend` `#ai` | Redator de emails com IA |
| `AILegalResearch.tsx` | `#frontend` `#ai` `#legal` | Pesquisa jurídica com IA |
| `AdvancedNLPDashboard.tsx` | `#frontend` `#ai` | Dashboard NLP avançado |
| `AgentMetrics.tsx` | `#frontend` `#ai` `#agent` | Métricas dos agentes |
| `AgentOrchestrationPanel.tsx` | `#frontend` `#ai` `#agent` | Painel de orquestração |
| `AgentStatusFloater.tsx` | `#frontend` `#ai` `#agent` | Status flutuante dos agentes |
| `AnalyticsDashboard.tsx` | `#frontend` `#lib` | Dashboard de analytics |
| `AssistenteIA.tsx` | `#frontend` `#ai` | Assistente IA (Harvey Specter) |
| `AudioTranscription.tsx` | `#frontend` `#ai` | Transcrição de áudio |
| `BatchAnalysis.tsx` | `#frontend` `#ai` | Análise em lote |
| `CadastrarCliente.tsx` | `#frontend` `#legal` | Cadastro de clientes |
| `CalculadoraPrazos.tsx` | `#frontend` `#legal` `#calendar` | Calculadora de prazos |
| `Calendar.tsx` | `#frontend` `#calendar` `#integration` | Calendário Google |
| `ColorPreview.tsx` | `#frontend` `#ui` | Preview de cores |
| `ConfigurationError.tsx` | `#frontend` `#lib` | Erro de configuração |
| `ConfirmDialog.tsx` | `#frontend` `#ui` | Dialog de confirmação |
| `DJENConsulta.tsx` | `#frontend` `#djen` `#legal` | Consulta DJEN |
| `DJENPublicationsWidget.tsx` | `#frontend` `#djen` `#legal` | Widget publicações DJEN |
| `Dashboard.tsx` | `#frontend` | Dashboard principal |
| `DashboardAdvbox.tsx` | `#frontend` | Dashboard estilo Advbox |
| `DashboardCharts.tsx` | `#frontend` | Gráficos do dashboard |
| `DataInitializer.tsx` | `#frontend` `#lib` | Inicializador de dados |
| `DataManager.tsx` | `#frontend` `#lib` | Gerenciador de dados |
| `DatabaseQueries.tsx` | `#frontend` `#lib` | Queries de banco |
| `DatajudChecklist.tsx` | `#frontend` `#legal` `#integration` | Checklist DataJud |
| `DeadlineCalculator.tsx` | `#frontend` `#legal` `#calendar` | Calculador de prazos |
| `DocumentCheckAgent.tsx` | `#frontend` `#ai` `#agent` | Agente verificador de docs |
| `DocumentTemplates.tsx` | `#frontend` `#legal` | Templates de documentos |
| `DocumentUploader.tsx` | `#frontend` `#lib` | Upload de documentos |
| `Donna.tsx` | `#frontend` `#ai` `#agent` | Agente Donna (secretária IA) |
| `ExpedientePanel.tsx` | `#frontend` `#legal` | Painel de expedientes |
| `FinancialManagement.tsx` | `#frontend` `#financial` | Gestão financeira |
| `FinancialManagementAdvbox.tsx` | `#frontend` `#financial` | Financeiro estilo Advbox |
| `FluentAnimationsShowcase.tsx` | `#frontend` `#ui` | Showcase animações |
| `FluentMotion.tsx` | `#frontend` `#ui` | Componente de animação |
| `GeminiExample.tsx` | `#frontend` `#ai` | Exemplo Gemini |
| `GitHubAuth.tsx` | `#frontend` `#auth` | Login GitHub |
| `GitLabAuth.tsx` | `#frontend` `#auth` | Login GitLab |
| `GoogleAuth.tsx` | `#frontend` `#auth` `#integration` | Login Google |
| `HumanAgentCollaboration.tsx` | `#frontend` `#ai` `#agent` | Colaboração humano-agente |
| `KeyboardShortcutsDialog.tsx` | `#frontend` `#ui` | Atalhos de teclado |
| `KnowledgeBase.tsx` | `#frontend` `#ai` | Base de conhecimento |
| `LLMObservabilityDashboard.tsx` | `#frontend` `#ai` | Observabilidade LLM |
| `Login.tsx` | `#frontend` `#auth` | Tela de login |
| `MinutasManager.tsx` | `#frontend` `#legal` | Gerenciador de minutas |
| `MrsJustinEModal.tsx` | `#frontend` `#ai` | Modal Mrs. Justin E |
| `MultiSourcePublications.tsx` | `#frontend` `#djen` `#legal` | Publicações multi-fonte |
| `NotificationSettings.tsx` | `#frontend` `#lib` | Configurações de notificação |
| `OfficeManagement.tsx` | `#frontend` `#legal` | Gestão do escritório |
| `PDFUploader.tsx` | `#frontend` `#lib` | Upload de PDFs |
| `PremonicaoModal.tsx` | `#frontend` `#ai` `#legal` | Modal Premonição |
| `ProcessCRM.tsx` | `#frontend` `#legal` | CRM de processos (Kanban) |
| `ProcessCRMAdvbox.tsx` | `#frontend` `#legal` | CRM estilo Advbox |
| `ProcessDetailsDialog.tsx` | `#frontend` `#legal` | Detalhes do processo |
| `ProcessDialog.tsx` | `#frontend` `#legal` | Dialog de processo |
| `RealAIControlPanel.tsx` | `#frontend` `#ai` `#agent` | Painel controle IA real |
| `Sidebar.tsx` | `#frontend` `#ui` | Barra lateral |
| `TracingDashboard.tsx` | `#frontend` `#ai` | Dashboard de tracing |

#### `/src/components/archive` - Componentes Arquivados
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `ClientesView.tsx` | `#frontend` `#deprecated` | View de clientes (arquivado) |
| `PrazosView.tsx` | `#frontend` `#deprecated` | View de prazos (arquivado) |
| `ProcessosView.tsx` | `#frontend` `#deprecated` | View de processos (arquivado) |

#### `/src/components/dashboard` - Dashboard Componentes
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `DashboardActions.tsx` | `#frontend` | Ações do dashboard |
| `DashboardDeadlines.tsx` | `#frontend` `#calendar` | Prazos do dashboard |
| `DashboardStats.tsx` | `#frontend` | Estatísticas |
| `DashboardStats.test.tsx` | `#frontend` `#test` | Testes estatísticas |

#### `/src/components/ui` - Componentes UI (shadcn/ui)
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `accordion.tsx` | `#ui` | Accordion |
| `accordion.test.tsx` | `#ui` `#test` | Teste accordion |
| `alert-dialog.tsx` | `#ui` | Dialog de alerta |
| `alert.tsx` | `#ui` | Componente alerta |
| `badge.tsx` | `#ui` | Badge |
| `badge-utils.ts` | `#ui` `#lib` | Utilitários badge |
| `button.tsx` | `#ui` | Botão |
| `button.test.tsx` | `#ui` `#test` | Teste botão |
| `button-utils.ts` | `#ui` `#lib` | Utilitários botão |
| `card.tsx` | `#ui` | Card |
| `checkbox.tsx` | `#ui` | Checkbox |
| `dialog.tsx` | `#ui` | Dialog |
| `info-tooltip.tsx` | `#ui` | Tooltip informativo |
| `input.tsx` | `#ui` | Input |
| `label.tsx` | `#ui` | Label |
| `progress.tsx` | `#ui` | Barra de progresso |
| `scroll-area.tsx` | `#ui` | Área de scroll |
| `select.tsx` | `#ui` | Select |
| `separator.tsx` | `#ui` | Separador |
| `sheet.tsx` | `#ui` | Sheet/Drawer |
| `skeleton.tsx` | `#ui` | Skeleton loading |
| `sonner.tsx` | `#ui` | Toast (Sonner) |
| `switch.tsx` | `#ui` | Switch |
| `table.tsx` | `#ui` | Tabela |
| `tabs.tsx` | `#ui` | Tabs |
| `textarea.tsx` | `#ui` | Textarea |
| `tooltip.tsx` | `#ui` | Tooltip |

---

### `/src/hooks` - Custom React Hooks
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `use-agent-backup.ts` | `#hook` `#agent` | Backup de agentes |
| `use-analytics.ts` | `#hook` `#lib` | Analytics |
| `use-autonomous-agents.ts` | `#hook` `#agent` `#ai` | Controle agentes autônomos |
| `use-fluent-motion.ts` | `#hook` `#ui` | Animações fluentes |
| `use-keyboard-shortcuts.ts` | `#hook` `#ui` | Atalhos de teclado |
| `use-kv.ts` | `#hook` `#lib` | Acesso KV storage |
| `use-mobile.ts` | `#hook` `#ui` | Detecção mobile |
| `use-notifications.ts` | `#hook` `#lib` | Notificações |
| `use-processes.ts` | `#hook` `#legal` | Gestão de processos |
| `use-toast.ts` | `#hook` `#ui` | Toast notifications |
| `use-todoist.ts` | `#hook` `#integration` | Integração Todoist |
| `useErrorTracking.ts` | `#hook` `#lib` | Tracking de erros |

---

### `/src/lib` - Bibliotecas Frontend
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `agent-communication.ts` | `#lib` `#agent` | Comunicação entre agentes |
| `agent-tracing.ts` | `#lib` `#agent` `#ai` | Tracing de agentes |
| `agents.ts` | `#lib` `#agent` `#ai` | Sistema de agentes frontend |
| `agents.test.ts` | `#lib` `#test` | Testes agentes |
| `agents/todoist-agent.ts` | `#lib` `#agent` `#integration` | Agente Todoist |
| `agents/todoist-agent.test.ts` | `#lib` `#test` | Testes agente Todoist |
| `ai-providers.ts` | `#lib` `#ai` | Provedores de IA |
| `config.ts` | `#lib` `#config` | Configurações centralizadas |
| `data-initializer.ts` | `#lib` | Inicializador de dados |
| `datajud-api.ts` | `#lib` `#legal` `#integration` | API DataJud |
| `diario-oficial-api.ts` | `#lib` `#legal` `#djen` | API Diário Oficial |
| `djen-api.ts` | `#lib` `#djen` `#legal` | API DJEN frontend |
| `djen-api.test.ts` | `#lib` `#test` | Testes DJEN |
| `djen-monitor-agent.ts` | `#lib` `#agent` `#djen` | Agente monitor DJEN |
| `gemini-config.ts` | `#lib` `#ai` `#config` | Config Gemini |
| `gemini-service.ts` | `#lib` `#ai` | Serviço Gemini |
| `google-calendar-service.ts` | `#lib` `#calendar` `#integration` | Google Calendar |
| `google-docs-service.ts` | `#lib` `#integration` | Google Docs |
| `google-types.ts` | `#lib` `#integration` | Tipos Google |
| `llm-service.ts` | `#lib` `#ai` | Serviço LLM |
| `multi-source-publications.ts` | `#lib` `#djen` `#legal` | Publicações multi-fonte |
| `nlp-pipeline.ts` | `#lib` `#ai` | Pipeline NLP |
| `pje-api.ts` | `#lib` `#legal` `#djen` | API PJe |
| `prazos.ts` | `#lib` `#legal` `#calendar` | Cálculo de prazos |
| `prazos.test.ts` | `#lib` `#test` | Testes prazos |
| `premonicao-service.ts` | `#lib` `#ai` `#legal` | Serviço Premonição |
| `publication-sources-types.ts` | `#lib` `#djen` | Tipos fontes publicação |
| `real-agent-client.ts` | `#lib` `#agent` `#ai` | Cliente agentes reais |
| `sample-data.ts` | `#lib` | Dados de exemplo |
| `spark-client-fixes.ts` | `#lib` `#ai` | Fixes cliente Spark |
| `todoist-client.ts` | `#lib` `#integration` | Cliente Todoist |
| `todoist-client.test.ts` | `#lib` `#test` | Testes Todoist |
| `todoist-integration.ts` | `#lib` `#integration` | Integração Todoist |
| `todoist-integration.test.ts` | `#lib` `#test` | Testes integração |
| `todoist-stub.ts` | `#lib` `#integration` | Stub Todoist |
| `tracing.ts` | `#lib` `#ai` | Sistema de tracing |
| `utils.ts` | `#lib` | Utilitários gerais |

---

### `/src/services` - Serviços
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `error-tracking.ts` | `#lib` | Tracking de erros |

---

### `/tests/e2e` - Testes E2E (Playwright)
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `agents-ui.spec.ts` | `#test` `#agent` | Testes UI agentes |
| `app-flow.spec.ts` | `#test` | Testes fluxo app |
| `basic.spec.ts` | `#test` | Testes básicos |
| `forms.spec.ts` | `#test` | Testes formulários |
| `global-setup.ts` | `#test` `#config` | Setup global |
| `monitoring.spec.ts` | `#test` | Testes monitoramento |
| `navigation.spec.ts` | `#test` | Testes navegação |
| `todoist-flow.spec.ts` | `#test` `#integration` | Testes fluxo Todoist |

---

### `/scripts` - Scripts de Automação
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `init-real-agents.ts` | `#config` `#agent` | Inicializar agentes reais |
| `verify-upstash.ts` | `#config` `#lib` | Verificar Upstash Redis |

---

### `/backend` - Backend Node.js
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `src/server.ts` | `#lib` `#config` | Servidor backend |

---

### Raiz - Configurações
| Arquivo | Tags | Descrição |
|---------|------|-----------|
| `vite.config.ts` | `#config` | Configuração Vite |
| `vite-icon-optimizer.ts` | `#config` `#lib` | Otimizador de ícones |
| `vitest.config.ts` | `#config` `#test` | Configuração Vitest |
| `vitest.config.api.ts` | `#config` `#test` | Vitest para API |
| `vitest.config.node.ts` | `#config` `#test` | Vitest para Node |

---

## 📊 Estatísticas por Tag

| Tag | Quantidade |
|-----|------------|
| `#frontend` | ~70 |
| `#lib` | ~50 |
| `#ai` | ~40 |
| `#agent` | ~25 |
| `#ui` | ~30 |
| `#api` | ~25 |
| `#legal` | ~30 |
| `#djen` | ~15 |
| `#integration` | ~20 |
| `#test` | ~15 |
| `#hook` | ~12 |
| `#config` | ~10 |
| `#auth` | ~5 |
| `#calendar` | ~8 |
| `#financial` | ~2 |
| `#cron` | ~1 |

---

## 🔗 Dependências Entre Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  src/components/ ──► src/hooks/ ──► src/lib/                │
│         │                              │                     │
│         └──────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      API (Vercel)                           │
│  api/*.ts ──► api/_lib/ ──► lib/api/ & lib/ai/              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVIÇOS EXTERNOS                        │
│  Upstash Redis │ DJEN API │ DataJud │ Google │ Todoist     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Notas

1. **Arquivos `.disabled`**: Mantido apenas `api/agents-v2.ts.disabled` como referência futura
2. **Duplicados removidos**: `api/_djen-client.ts`, `api/_kv-utils.ts`, `lib/serverless/`, `src/lib/agent-orchestrator.ts`
3. **Componentes UI**: Não modificar diretamente - são gerados pelo shadcn/ui

---

*Última atualização: 26/11/2025*
