# 🤖 Delegação para Agente de Nuvem - Migração Microsoft Multi-Agent Engine

> **Data de Criação**: 2025-12-17
> **Status**: ✅ APROVADO PARA EXECUÇÃO
> **PR Aprovado**: #443
> **Agente Responsável**: `agentepersonalizado` (Manutenção e Monitoramento)

---

## 📋 Resumo Executivo

Este documento delega formalmente a execução do **Plano de Migração Microsoft Multi-Agent Engine** ao agente de nuvem configurado. A delegação foi aprovada após revisão completa do PR #443 e validação das instruções do Copilot.

---

## ✅ Validações Concluídas (Pré-Delegação)

### 1. Documentação Atualizada
- [x] `.github/copilot-instructions.md` - Regras de migração adicionadas
- [x] Princípio fundamental: USAR agentes Microsoft, NÃO criar novos
- [x] Princípio da Integração: "Estender, não modificar. Conectar, não substituir. Alimentar, não recriar."
- [x] Fluxo correto vs fluxo errado documentado
- [x] Checklist de integração correta definido

### 2. Infraestrutura Configurada
- [x] `.github/cloud-agents-config.yml` - Permissões unrestricted
- [x] GitHub Actions com permissões de escrita total
- [x] Vercel com deploy automático habilitado
- [x] Cron jobs configurados (DJEN, DataJud, filas de agentes)
- [x] Secrets sincronizados automaticamente

### 3. Agente Personalizado Pronto
- [x] `.github/agents/agentepersonalizado.agent.md` - Configurado
- [x] Capacidades: Monitoramento 24/7, correção de bugs, deploy automático
- [x] Ferramentas habilitadas: get_errors, read_file, run_in_terminal, etc
- [x] SLA definido: P0 < 30min, P1 < 2h, P2 < 24h

### 4. Aprovações Obtidas
- [x] PR #443 revisado e aprovado pelo operador humano
- [x] Plano de migração validado
- [x] Estratégia de integração aprovada (conectores, não modificações)

---

## 🎯 Tarefas Delegadas ao Agente de Nuvem

### Fase 1: Validação de Ambiente (IMEDIATO)

**Objetivo**: Garantir que infraestrutura atual está estável antes de iniciar migração.

```bash
# 1. Verificar saúde do sistema atual
curl -I https://assistente-juridico-github.vercel.app/api/health

# 2. Verificar Vercel deployments
vercel ls

# 3. Monitorar logs por 5 minutos (detectar erros ativos)
vercel logs --follow --since 5m

# 4. Verificar Sentry (últimas 24h)
# Dashboard: https://sentry.io/organizations/thiagobodevan/issues/

# 5. Validar SonarCloud Quality Gate
# Dashboard: https://sonarcloud.io/project/overview?id=thiagobodevanadv-alt-assistente-jur-dico-principal
```

**Critérios de Aprovação para Prosseguir**:
- ✅ Health check retornando 200 OK
- ✅ Zero erros P0/P1 no Sentry (últimas 24h)
- ✅ Último deploy successful
- ✅ Testes passando (366+ unitários)

**Se critérios NÃO forem atendidos**:
1. 🛑 **PARAR migração**
2. 🔧 **Corrigir problemas** usando workflow de correção de bugs
3. 🔄 **Re-validar** antes de prosseguir

---

### Fase 2: Preparação para Migração (Semana 1)

**Objetivo**: Configurar infraestrutura Azure sem modificar sistema atual.

#### 2.1. Clone Microsoft Multi-Agent Engine

```bash
# Verificar se repositório já existe
ls -la Multi-Agent-Custom-Automation-Engine-Solution-Accelerator/

# Se não existir, clonar
git clone https://github.com/microsoft/Multi-Agent-Custom-Automation-Engine-Solution-Accelerator.git
cd Multi-Agent-Custom-Automation-Engine-Solution-Accelerator
```

#### 2.2. Deploy Base Microsoft (SEM MODIFICAÇÕES)

⚠️ **REGRA CRÍTICA**: NÃO modificar código do Microsoft Multi-Agent Engine

```bash
# Instalar Azure Developer CLI (se necessário)
curl -fsSL https://aka.ms/install-azd.sh | bash

# Login Azure
azd auth login

# Deploy em ambiente sandbox (teste primeiro)
azd up --environment sandbox

# Aguardar provisioning (15-20 min)
# - Cosmos DB
# - Azure AI Search
# - Container Apps
# - Storage Account
# - Application Insights
```

**Validações Pós-Deploy**:
```bash
# Verificar URL de produção
azd show

# Testar endpoints básicos
curl -I https://<CONTAINER_APP_URL>/health

# Verificar agentes Microsoft disponíveis
# (consultar documentação do engine)
```

#### 2.3. Documentar Agentes Microsoft Existentes

⚠️ **CRÍTICO**: Mapear quais agentes Microsoft correspondem às nossas 15 funções.

**Criar arquivo**: `/docs/MAPEAMENTO_AGENTES_MICROSOFT.md`

```markdown
# Mapeamento: Agentes Atuais → Agentes Microsoft

| Função Atual | Agente Microsoft Equivalente | ID/Nome Canônico |
|--------------|------------------------------|------------------|
| analise_documental | Document Processing Agent | doc-processor-001 |
| gestao_prazos | Task Management Agent | task-manager-001 |
| redacao_peticoes | Document Generation Agent | doc-generator-001 |
| pesquisa_juris | Research Agent + Azure AI Search | research-001 |
| monitor_djen | Event Ingestion Agent | event-ingest-001 |
| ... | ... | ... |

**ATENÇÃO**: NÃO criar agentes customizados. USAR agentes Microsoft existentes.
```

---

### Fase 3: Integração Brasil (Semana 2)

**Objetivo**: Criar conectores que ALIMENTAM agentes Microsoft (não os substituem).

#### 3.1. DJEN Connector (Extensão BR)

**Criar**: `src/backend/v3/agents/extensoes_brasil/djen_connector.py`

```python
"""
DJEN Connector - EXTENSÃO para Microsoft Multi-Agent Engine
NÃO modifica sistema base, apenas adiciona capacidade brasileira
"""
from semantic_kernel.agents import Agent

class DJENConnectorAgent(Agent):
    """
    Conecta DJEN ao sistema Microsoft (extensão BR)
    Formata publicações DJEN para schema Microsoft
    """
    def __init__(self, kernel):
        super().__init__(
            name="DJEN Connector",
            description="Conecta DJEN ao sistema Microsoft (extensão BR)",
            kernel=kernel
        )
    
    async def process_publication(self, djen_data: dict):
        """
        Recebe publicação DJEN e formata para agentes Microsoft
        """
        # Formatar para schema Microsoft
        formatted = self._format_to_microsoft_schema(djen_data)
        
        # Enviar para agente Microsoft existente (NÃO criar novo)
        await self.kernel.invoke_agent(
            agent_id="<ID_AGENTE_MICROSOFT_DOCUMENT_PROCESSING>",
            data=formatted
        )
    
    def _format_to_microsoft_schema(self, djen_data: dict):
        """Converte formato DJEN → formato Microsoft"""
        return {
            "document_type": "legal_publication",
            "source": "DJEN_BR",
            "content": djen_data.get("teor"),
            "metadata": {
                "court": djen_data.get("tribunal"),
                "process_number": djen_data.get("numeroProcesso"),
                "publication_date": djen_data.get("dataPublicacao")
            }
        }
```

#### 3.2. DataJud Connector (Extensão BR)

**Criar**: `src/backend/v3/agents/extensoes_brasil/datajud_connector.py`

```python
"""
DataJud Connector - EXTENSÃO para Microsoft Multi-Agent Engine
Conecta API DataJud do CNJ aos agentes Microsoft
"""
from semantic_kernel.agents import Agent

class DataJudConnectorAgent(Agent):
    """
    Conecta DataJud ao sistema Microsoft (extensão BR)
    Busca jurisprudências e alimenta Azure AI Search
    """
    def __init__(self, kernel):
        super().__init__(
            name="DataJud Connector",
            description="Conecta DataJud ao sistema Microsoft (extensão BR)",
            kernel=kernel
        )
    
    async def fetch_and_index(self, query: str):
        """
        Busca jurisprudências no DataJud e indexa no Azure AI Search
        """
        # Buscar no DataJud (API pública CNJ)
        results = await self._fetch_datajud(query)
        
        # Formatar para Azure AI Search (NÃO usar Qdrant)
        formatted = self._format_for_azure_search(results)
        
        # Indexar no Azure AI Search (já configurado no Microsoft Engine)
        await self.kernel.invoke_service(
            service_id="azure-ai-search",
            operation="index_documents",
            data=formatted
        )
```

#### 3.3. PJe Sync Endpoint (Extensão BR)

**Criar**: `src/backend/v3/api/extensoes_brasil/pje_webhook.py`

```python
"""
PJe Sync Endpoint - EXTENSÃO para Microsoft Multi-Agent Engine
Recebe dados da Chrome Extension e formata para agentes Microsoft
"""
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/extensoes/brasil", tags=["brasil"])

@router.post("/pje-sync")
async def receber_processos_pje(processos: list[dict]):
    """
    Endpoint que RECEBE dados do PJe (Chrome Extension)
    e ALIMENTA agentes Microsoft existentes
    """
    try:
        for processo in processos:
            # Formatar para schema Microsoft
            formatted = _format_processo_to_microsoft(processo)
            
            # Enviar para agente Microsoft (não criar novo)
            await microsoft_orchestrator.process(
                agent_id="<ID_AGENTE_MICROSOFT_TASK_MANAGEMENT>",
                data=formatted
            )
        
        return {"status": "success", "processed": len(processos)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def _format_processo_to_microsoft(processo: dict):
    """Converte formato PJe → formato Microsoft"""
    return {
        "task_type": "legal_process",
        "source": "PJE_BR",
        "process_number": processo.get("numero"),
        "deadline": processo.get("prazo"),
        "priority": "high" if processo.get("urgente") else "normal"
    }
```

#### 3.4. Webhook DJEN → Microsoft

**Configurar**: Webhook no DJEN para enviar publicações direto ao conector

```bash
# Configurar no painel DJEN:
# URL: https://<AZURE_CONTAINER_APP_URL>/extensoes/brasil/djen-feed
# Method: POST
# Headers: Authorization: Bearer <TOKEN>
```

---

### Fase 4: Extensões de Prompts (SE NECESSÁRIO)

**Objetivo**: Adicionar contexto jurídico BR aos agentes Microsoft (último recurso).

**Criar**: `src/backend/v3/config/prompt_extensions_br.py`

```python
"""
Extensões de Prompts - Contexto Jurídico Brasileiro
APENAS estender prompts, NÃO substituir agentes
"""

BRAZILIAN_LEGAL_CONTEXT = """
Contexto adicional para sistema jurídico brasileiro:
- Prazos processuais seguem CPC (Código de Processo Civil)
- Considerar feriados nacionais e estaduais
- DJEN = Diário de Justiça Eletrônico Nacional
- DataJud = Base de jurisprudências do CNJ
- PJe = Processo Judicial Eletrônico
- Comarca, Vara, Instância: estrutura judiciária BR
"""

def extend_agent_prompt(agent, context_type: str):
    """
    Estende prompt de agente Microsoft com contexto BR
    NÃO modifica lógica do agente, apenas adiciona contexto
    """
    if context_type == "legal_brazilian":
        agent.system_prompt += BRAZILIAN_LEGAL_CONTEXT
    
    return agent
```

**USAR APENAS SE**:
- Agente Microsoft existe mas não entende contexto BR
- Erro recorrente por falta de contexto
- Aprovação humana obtida

---

### Fase 5: Migração de Dados (Semana 4)

**Objetivo**: Migrar dados do Upstash KV → Cosmos DB (usando schema Microsoft).

#### 5.1. Script de Migração

**Criar**: `scripts/migrate_upstash_to_cosmos.py`

```python
"""
Migração Upstash KV → Cosmos DB (Microsoft Schema)
ATENÇÃO: Executar em horário de baixo tráfego
"""
import asyncio
from upstash_redis import Redis
from azure.cosmos import CosmosClient

async def migrate_data():
    """
    Migra dados mantendo compatibilidade com schema Microsoft
    """
    # 1. Conectar Upstash (origem)
    upstash = Redis(url=UPSTASH_URL, token=UPSTASH_TOKEN)
    
    # 2. Conectar Cosmos DB (destino)
    cosmos = CosmosClient(COSMOS_URL, COSMOS_KEY)
    database = cosmos.get_database_client("legal-assistant")
    
    # 3. Migrar processos
    processes = upstash.scan(match="processes:*")
    for key in processes:
        data = upstash.get(key)
        # Converter para schema Microsoft
        formatted = _convert_to_microsoft_schema(data)
        # Inserir no Cosmos DB
        await database.upsert_item(formatted)
    
    # 4. Validar migração (comparar contagens)
    upstash_count = len(list(upstash.scan(match="processes:*")))
    cosmos_count = database.query_items("SELECT COUNT(*) FROM c")
    assert upstash_count == cosmos_count, "Contagens não batem!"
```

#### 5.2. Rollback Plan

**Criar**: `scripts/rollback_to_upstash.sh`

```bash
#!/bin/bash
# Rollback: Cosmos DB → Upstash KV (caso necessário)

echo "⚠️  ROLLBACK INICIADO"

# 1. Desabilitar writes no Cosmos DB
curl -X POST https://<AZURE_URL>/admin/disable-writes

# 2. Re-ativar Upstash como primary
export PRIMARY_DB=upstash

# 3. Re-deploy versão anterior
vercel rollback

# 4. Validar
curl https://assistente-juridico-github.vercel.app/api/health

echo "✅ ROLLBACK CONCLUÍDO"
```

---

### Fase 6: Cutover e Monitoramento (Semana 4)

**Objetivo**: Fazer switch para novo sistema com zero downtime.

#### 6.1. Pre-Cutover Checklist

```bash
# 1. Backup final Upstash
npm run backup:upstash

# 2. Validar Cosmos DB está 100% sincronizado
npm run validate:cosmos-sync

# 3. Testar endpoints Microsoft em staging
curl https://<AZURE_STAGING_URL>/api/health

# 4. Chrome Extension apontando para novo endpoint
# Atualizar manifest.json: host_permissions para Azure URL
```

#### 6.2. Cutover (Blue-Green)

```bash
# 1. Deploy novo backend (Azure) em paralelo
azd deploy --environment production

# 2. Switch DNS/routing (gradual: 10% → 50% → 100%)
# Vercel Edge Config: route 10% to Azure, 90% to Vercel

# 3. Monitorar por 1 hora
vercel logs --follow & azd logs --follow

# 4. Se OK, aumentar para 50%
# Se ERRO, rollback imediato para 0%

# 5. Se 50% OK por 2 horas, ir para 100%
```

#### 6.3. Post-Cutover Monitoring (24 horas)

```bash
# Executar a cada 5 minutos:
while true; do
  # Health check
  curl -I https://<AZURE_URL>/api/health
  
  # Sentry errors
  sentry-cli issues list --limit 10
  
  # Azure Application Insights
  az monitor app-insights metrics show \
    --app assistente-juridico \
    --metric requests/failed
  
  sleep 300
done
```

---

## 📊 Métricas de Sucesso

### KPIs da Migração

| Métrica | Meta | Como Medir |
|---------|------|------------|
| **Uptime** | 99.9% | Azure Application Insights |
| **Latência P95** | < 2s | Azure Application Insights |
| **Erros** | < 0.1% | Sentry + Azure |
| **Testes Passando** | 100% (366+) | GitHub Actions |
| **SLA de Agentes** | P0 < 30min | Cloud agent SLA tracking |

### Alertas Críticos

**Configurar no Azure Monitor**:
```yaml
alerts:
  - name: "API Error Rate > 1%"
    severity: critical
    action: rollback + notify
  
  - name: "Latency P95 > 5s"
    severity: high
    action: investigate + notify
  
  - name: "Cosmos DB throttling"
    severity: medium
    action: scale up + notify
```

---

## 🚨 Procedimentos de Emergência

### Cenário 1: Azure Fora do Ar

```bash
# 1. ROLLBACK IMEDIATO
./scripts/rollback_to_upstash.sh

# 2. Notificar operador humano
curl -X POST https://hooks.slack.com/... \
  -d '{"text": "🔴 ROLLBACK: Azure fora do ar"}'

# 3. Investigar causa raiz
azd logs --follow | grep ERROR
```

### Cenário 2: Migração de Dados Corrompida

```bash
# 1. PARAR novos writes
curl -X POST https://<AZURE_URL>/admin/readonly-mode

# 2. Restaurar backup Upstash
npm run restore:upstash-backup

# 3. Re-executar migração com fixes
npm run migrate:upstash-to-cosmos --dry-run
npm run migrate:upstash-to-cosmos --force
```

### Cenário 3: Agentes Microsoft Não Funcionam

```bash
# 1. Verificar quais agentes estão disponíveis
azd show --output json | jq '.agents'

# 2. Se agente esperado não existe:
#    - NÃO criar agente customizado
#    - Buscar agente equivalente na documentação Microsoft
#    - Ajustar mapeamento em /docs/MAPEAMENTO_AGENTES_MICROSOFT.md

# 3. Se NENHUM agente funciona:
#    - ROLLBACK imediato
#    - Reportar issue ao Microsoft
```

---

## 📋 Checklist Final de Validação

Antes de considerar migração concluída, validar:

### Funcionalidades Críticas
- [ ] Monitoramento DJEN funcionando (2 execuções diárias)
- [ ] DataJud integration funcionando (pesquisa jurisprudencial)
- [ ] Chrome Extension PJe sincronizando processos
- [ ] 15 funções de agentes mapeadas para agentes Microsoft
- [ ] Templates de petições compatíveis com formato Microsoft
- [ ] Cálculo de prazos BR funcionando
- [ ] Google Calendar sync ativo
- [ ] Notificações por email funcionando

### Performance
- [ ] Latência P95 < 2s
- [ ] Uptime > 99.9% (últimas 24h)
- [ ] Cosmos DB sem throttling
- [ ] Azure AI Search respondendo < 500ms

### Segurança
- [ ] Secrets não expostos
- [ ] Compliance LGPD mantido
- [ ] Audit logs habilitados e funcionando
- [ ] Backups automáticos configurados

### Qualidade
- [ ] Todos os testes passando (366+ unitários)
- [ ] SonarCloud Quality Gate: PASSED
- [ ] Sentry: Zero erros P0/P1 (últimas 24h)
- [ ] TypeScript: Zero erros

---

## 🤖 Autorização para Agente de Nuvem

**Operador Humano**: Thiago Bodevan
**Data de Aprovação**: 2025-12-17
**PR Aprovado**: #443

**Delegação Autorizada**:
✅ Agente de nuvem (`agentepersonalizado`) está AUTORIZADO a executar todas as fases deste plano, com as seguintes condições:

1. **SEMPRE seguir** princípio da integração: "Estender, não modificar. Conectar, não substituir. Alimentar, não recriar."
2. **NUNCA modificar** código core do Microsoft Multi-Agent Engine
3. **SEMPRE criar** conectores/adaptadores (não agentes customizados)
4. **SEMPRE validar** antes de prosseguir para próxima fase
5. **ROLLBACK IMEDIATO** se qualquer métrica crítica falhar

**Limitações**:
- ❌ NÃO pode criar agentes customizados (só conectores)
- ❌ NÃO pode modificar workflows Microsoft
- ❌ NÃO pode fazer deploy em produção sem validação prévia em staging
- ⚠️  DEVE notificar operador humano em casos de P0/P1

---

## 📞 Contato e Suporte

**Operador Humano**: Disponível via GitHub
**Escalação**: Para decisões arquiteturais críticas
**Documentação Microsoft**: https://learn.microsoft.com/semantic-kernel/

---

**Status**: ✅ PRONTO PARA EXECUÇÃO
**Próxima Ação**: Agente de nuvem deve começar pela Fase 1 (Validação de Ambiente)

---

*Este documento foi criado automaticamente pelo GitHub Copilot Coding Agent em 2025-12-17.*
