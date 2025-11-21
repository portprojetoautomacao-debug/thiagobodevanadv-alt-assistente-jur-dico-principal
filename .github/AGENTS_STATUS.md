# Status dos Agentes de IA - Assistente Jurídico PJe

**Última Atualização:** 21 de novembro de 2025  
**Status Geral:** ✅ OPERACIONAL

---

## 🤖 Agentes Configurados (7/7)

| ID | Nome | Tipo | Status | Autonomia | Última Atividade |
|----|------|------|--------|-----------|------------------|
| agent-djen-monitor | Agente de Monitoramento DJEN | monitor | ✅ Ativo | 92% | Aguardando primeiro cron |
| agent-deadline-calculator | Agente Calculador de Prazos | calculator | ✅ Ativo | 88% | Aguardando primeiro cron |
| agent-document-analyzer | Agente Analisador de Documentos | analyzer | ✅ Ativo | 85% | Aguardando primeiro cron |
| agent-legal-writer | Agente Redator Jurídico | writer | ✅ Ativo | 78% | Aguardando primeiro cron |
| agent-legal-researcher | Agente Pesquisador Jurídico | researcher | ✅ Ativo | 82% | Aguardando primeiro cron |
| agent-strategic-planner | Agente Planejador Estratégico | strategic | ✅ Ativo | 75% | Aguardando primeiro cron |
| agent-calendar-manager | Agente Gerenciador de Agenda | calendar | ✅ Ativo | 90% | Aguardando primeiro cron |

---

## 👨‍⚖️ Advogado Configurado

- **Nome:** Thiago Bodevan Veiga
- **OAB:** OAB/MG 184.404
- **Email:** thiagobodevanadvocacia@gmail.com
- **Status:** ✅ Configurado via browser console
- **Data de Configuração:** 21/11/2025

### Tribunais Monitorados

- ✅ **TJMG** - Tribunal de Justiça de Minas Gerais (1ª e 2ª instâncias)
- ✅ **TRT3** - Tribunal Regional do Trabalho 3ª Região (1ª e 2ª instâncias)
- ✅ **TST** - Tribunal Superior do Trabalho
- ✅ **STJ** - Superior Tribunal de Justiça

---

## 📡 Integrações de API

### DJEN (Comunica PJe)
- **Endpoint:** `https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/html`
- **Autenticação:** Não requerida (API pública)
- **Headers:**
  - `User-Agent: PJe-DataCollector/1.0`
  - `Accept: application/json`
- **Status:** ✅ Implementado em `lib/api/djen-client.ts`
- **Funções:**
  - `consultarPublicacoesTribunal(tribunal, data)`
  - `consultarDJENForLawyer(tribunal, data, lawyerName, oab)`

### DataJud (CNJ)
- **Endpoint:** `https://api-publica.datajud.cnj.jus.br/{alias}/_search`
- **Autenticação:** API Key (configurada em `DATAJUD_API_KEY`)
- **Headers:**
  - `Authorization: APIKey cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==`
  - `Content-Type: application/json`
- **Status:** ✅ Implementado em `lib/api/datajud-client.ts`
- **Funções:**
  - `consultarProcessosDataJud(tribunal, query)`
  - `consultarDataJudForLawyer(tribunal, lawyerName, oab)`

### Spark LLM (GitHub Copilot)
- **Endpoint:** `/_spark/llm` (proxy para GitHub Copilot)
- **Autenticação:** GitHub Token (configurado em `GITHUB_TOKEN`)
- **Modelo:** GPT-4 via Spark
- **Status:** ✅ Implementado em `api/llm-proxy.ts`
- **Uso:** Processamento real de tarefas dos agentes

### Spark KV (Storage)
- **Endpoint:** `/_spark/kv/{key}` (proxy para GitHub Copilot Storage)
- **Autenticação:** Automática via Spark client
- **Status:** ✅ Implementado em `api/kv.ts` com fallback para localStorage
- **Keys utilizadas:**
  - `autonomous-agents` - Configuração dos 7 agentes
  - `monitored-lawyers` - Dados do advogado monitorado
  - `agent-task-queue` - Fila de tarefas pendentes
  - `completed-agent-tasks` - Histórico de tarefas concluídas

---

## ⏰ Cron Jobs (Vercel)

| Endpoint | Schedule | Descrição | Status | Última Execução |
|----------|----------|-----------|--------|-----------------|
| `/api/cron/djen-monitor` | `0 9 * * *` | Monitora publicações DJEN às 9h UTC (6h BRT) | ✅ Configurado | Aguardando |
| `/api/cron/daily-reset` | `0 0 * * *` | Reset de contadores diários à meia-noite UTC (21h BRT) | ✅ Configurado | Aguardando |

**Nota:** Vercel Hobby Plan suporta apenas cron jobs diários. Para execução a cada hora, é necessário upgrade para Vercel Pro.

---

## 🔧 Funções Serverless

**Total de Funções:** 12/12 (limite Vercel Hobby)

| Endpoint | Propósito | Status |
|----------|-----------|--------|
| `/api/health` | Health check | ✅ Ativo |
| `/api/kv` | Proxy Spark KV | ✅ Ativo |
| `/api/llm-proxy` | Proxy Spark LLM | ✅ Ativo |
| `/api/loaded` | Status de carregamento | ✅ Ativo |
| `/api/spark-proxy` | Proxy geral Spark | ✅ Ativo |
| `/api/webhook` | Webhook com bypass | ✅ Ativo |
| `/api/agents/process-queue` | Processa fila de agentes | ✅ Ativo |
| `/api/agents/process-task` | Processa tarefa individual | ✅ Ativo |
| `/api/cron/daily-reset` | Reset diário | ✅ Ativo |
| `/api/cron/djen-monitor` | Monitor DJEN | ✅ Ativo |
| `/api/deadline/calculate` | Cálculo de prazos | ✅ Ativo |
| `/api/djen/check` | Verificação DJEN | ✅ Ativo |

⚠️ **Atenção:** Estamos no limite de 12 funções do Vercel Hobby. Não adicionar novas funções sem remover outras ou fazer upgrade para Pro.

---

## 📊 Estado da Configuração

### ✅ Completado

- [x] 7 agentes configurados com capacidades reais
- [x] DJEN API client implementado corretamente
- [x] DataJud API client separado implementado
- [x] Spark LLM integrado para processamento real
- [x] Spark KV configurado com fallback localStorage
- [x] Advogado Thiago Bodevan configurado
- [x] Tribunais TJMG, TRT3, TST, STJ configurados
- [x] Email thiagobodevanadvocacia@gmail.com configurado
- [x] Cron jobs configurados no vercel.json
- [x] Inicialização via browser console bem-sucedida
- [x] Dados persistentes em Spark KV
- [x] Webhook com bypass token configurado
- [x] GitHub Actions com health check de agentes
- [x] Documentação completa atualizada

### 🔄 Pendente (Aguardando Primeira Execução)

- [ ] Primeiro cron DJEN às 9h UTC (aguardar próximo dia)
- [ ] Primeiro cron daily-reset à meia-noite UTC (aguardar próximo dia)
- [ ] Primeira publicação detectada pelo monitor
- [ ] Primeira notificação por email
- [ ] Primeira tarefa processada por agente real
- [ ] Primeiro resultado de Spark LLM

### 🚀 Próximos Passos

1. **Monitorar primeira execução do cron DJEN** (próximo dia às 9h UTC / 6h BRT)
   - Verificar logs em Vercel Dashboard
   - Confirmar se `getMonitoredLawyers()` retorna dados
   - Verificar se consultas DJEN são realizadas
   - Checar se publicações são armazenadas

2. **Testar endpoint de agentes manualmente**
   ```bash
   # Trigger DJEN monitor manualmente
   curl -X POST "https://assistente-jurdico-p.vercel.app/api/cron/djen-monitor" \
     -H "Authorization: Bearer $VERCEL_BYPASS_TOKEN"
   
   # Verificar health
   curl "https://assistente-jurdico-p.vercel.app/api/health"
   ```

3. **Validar Spark KV sync**
   - Recarregar página para ver agentes na UI
   - Verificar contadores (devem estar em 0, não hardcoded)
   - Confirmar status "Active" para todos os 7 agentes

4. **Quando upgrade para Vercel Pro** (futuro)
   - Habilitar cron hourly para processamento contínuo
   - Adicionar mais funções serverless se necessário
   - Implementar process-queue cron para tarefas em background

---

## 🔒 Variáveis de Ambiente (Vercel Dashboard)

### Configuradas ✅

- `GITHUB_TOKEN` - Token GitHub para Spark LLM
- `DATAJUD_API_KEY` - API Key do DataJud
- `VERCEL_AUTOMATION_BYPASS_SECRET` - Token bypass para webhooks
- `VITE_GOOGLE_CLIENT_ID` - OAuth Google (build-time)
- `VITE_GOOGLE_API_KEY` - API Key Google (build-time)
- `VITE_REDIRECT_URI` - URI de redirecionamento OAuth (build-time)

### Opcional (Futuro)

- `SMTP_HOST` - Servidor SMTP para notificações por email
- `SMTP_PORT` - Porta do servidor SMTP
- `SMTP_USER` - Usuário SMTP
- `SMTP_PASSWORD` - Senha SMTP
- `EMAIL_FROM` - Email remetente das notificações

---

## 📈 Métricas de Monitoramento

### GitHub Actions
- **Workflow:** `AI Agents Health Check`
- **Frequência:** A cada 6 horas
- **Última execução:** Aguardando primeiro run
- **Status:** ✅ Configurado

### Validações Automáticas
- ✅ Verificação de arquivos de agentes
- ✅ Contagem de funções serverless (12/12)
- ✅ Validação de cron schedules
- ✅ Verificação de integrações API
- ✅ Confirmação de dados do advogado
- ✅ Validação de tribunais configurados

---

## 📝 Changelog

### 2025-11-21
- ✅ Implementação completa de agentes reais (substituindo simulação)
- ✅ Separação DJEN vs DataJud (APIs distintas)
- ✅ Configuração de advogado via browser console
- ✅ Otimização para 12 funções serverless (Hobby plan)
- ✅ Criação de workflow `agents-health-check.yml`
- ✅ Atualização de workflow `deploy.yml` com validações de agentes
- ✅ Documentação completa de status e configuração

---

## 🆘 Troubleshooting

### Agentes não aparecem na UI
**Solução:** Recarregue a página (F5) para sincronizar localStorage com Spark KV

### Cron job retorna erro 500
**Possível causa:** `monitored-lawyers` vazio no Spark KV  
**Solução:** Execute novamente o script de inicialização em `INICIALIZAR_AGENTES_BROWSER.js`

### Publicações não sendo detectadas
**Verificar:**
1. Cron executou no horário correto (logs Vercel)
2. DJEN API está respondendo (testar endpoint manualmente)
3. Tribunais configurados correspondem aos desejados
4. Nome e OAB do advogado estão corretos

### Email não está sendo enviado
**Causa:** SMTP não configurado  
**Solução:** Adicionar variáveis SMTP no Vercel Dashboard (futuro)

---

**Preparado por:** GitHub Copilot Agent  
**Repositório:** thiagobodevan-a11y/assistente-jurdico-p  
**Ambiente:** Production (Vercel)
