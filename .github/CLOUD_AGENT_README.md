# 🤖 Cloud Agent Migration Guide - Quick Reference

> **Para**: Cloud Agent `agentepersonalizado`
> **De**: Operador Humano (Thiago Bodevan)
> **Data**: 2025-12-17
> **Status**: ✅ APROVADO PARA EXECUÇÃO

---

## 🎯 Missão

Executar a migração do **Assistente Jurídico PJe** do stack atual (React + Vercel + Upstash) para o **Microsoft Multi-Agent Custom Automation Engine + Azure**, seguindo rigorosamente os princípios de integração e preservação do código Microsoft.

---

## 📚 Documentação Essencial (Ler PRIMEIRO)

### 1. Delegação Completa
📄 **Arquivo**: `.github/CLOUD_AGENT_DELEGATION.md`

**Conteúdo**:
- Todas as 6 fases detalhadas
- Checklist completo de cada fase
- Procedimentos de emergência
- Métricas de sucesso
- Critérios de validação

### 2. Status da Migração
📄 **Arquivo**: `.github/MIGRATION_STATUS.md`

**Conteúdo**:
- Progresso atual
- Próximas ações
- Riscos e mitigações
- Métricas comparativas

### 3. Instruções do Copilot
📄 **Arquivo**: `.github/copilot-instructions.md`

**Conteúdo**:
- Princípio fundamental: USAR agentes Microsoft, NÃO criar novos
- Princípio da integração: "Estender, não modificar"
- Regras de preservação do Microsoft Multi-Agent Engine

### 4. Configuração de Permissões
📄 **Arquivo**: `.github/cloud-agents-config.yml`

**Conteúdo**:
- Permissões unrestricted
- Seção 9: Delegação ativa
- Autorização formal

---

## 🚀 Como Começar

### Passo 1: Ler Documentação (5 min)

```bash
# Ler delegação completa
cat .github/CLOUD_AGENT_DELEGATION.md

# Ler status atual
cat .github/MIGRATION_STATUS.md

# Ler princípios de integração
grep -A 20 "PRINCÍPIO FUNDAMENTAL" .github/copilot-instructions.md
```

### Passo 2: Executar Fase 1 - Validação (10-15 min)

```bash
# Opção 1: Script automatizado
./.github/scripts/cloud-agent-phase1.sh

# Opção 2: Manual
curl -I https://assistente-juridico-github.vercel.app/api/health
vercel ls
npm run type-check
npm run test:run
```

**Critérios para Prosseguir**:
- ✅ Health check: 200 OK
- ✅ Último deploy: Successful
- ✅ TypeScript: Sem erros
- ✅ Testes: 366+ passando

**Se QUALQUER critério falhar**:
1. 🛑 PARAR migração
2. 🔧 Corrigir usando workflow de manutenção
3. 🔄 Re-executar validações

### Passo 3: Atualizar Status (2 min)

```bash
# Atualizar MIGRATION_STATUS.md
echo "Fase 1: ✅ CONCLUÍDA - $(date)" >> .github/MIGRATION_STATUS.md
git add .github/MIGRATION_STATUS.md
git commit -m "chore: Update migration status - Phase 1 completed"
git push
```

---

## ⚠️ REGRAS CRÍTICAS (NÃO VIOLAR)

### 🚨 Regra #1: Preservar Microsoft Multi-Agent Engine

**NUNCA**:
- ❌ Modificar código core do Microsoft Multi-Agent Engine
- ❌ Alterar workflows existentes da Microsoft
- ❌ Mudar lógica de orquestração
- ❌ Refatorar arquitetura base
- ❌ Criar agentes customizados

**SEMPRE**:
- ✅ Criar conectores/adaptadores
- ✅ Estender via interfaces de extensão
- ✅ Formatar dados para schema Microsoft
- ✅ Alimentar agentes Microsoft existentes

### 🚨 Regra #2: Integração, Não Substituição

**Princípio**:
> "Estender, não modificar. Conectar, não substituir. Alimentar, não recriar."

**Na prática**:
- ✅ DJEN Connector → formata publicações → envia para agente Microsoft
- ✅ DataJud Connector → busca jurisprudências → indexa no Azure AI Search
- ✅ PJe Sync Endpoint → recebe processos → alimenta agente Microsoft

- ❌ NÃO criar "DJEN Agent" customizado
- ❌ NÃO criar "DataJud Agent" customizado
- ❌ NÃO reimplementar funcionalidades Microsoft

### 🚨 Regra #3: Validar ANTES de Prosseguir

**Checklist em CADA Fase**:
- [ ] TypeScript compila sem erros
- [ ] Testes passam (366+)
- [ ] Build funciona
- [ ] Health check retorna 200 OK
- [ ] Sentry sem novos erros P0/P1

**Se validação FALHAR**:
1. 🛑 NÃO prosseguir
2. 🔍 Investigar causa
3. 🔧 Corrigir problema
4. 🔄 Re-validar

---

## 📋 Checklist Rápido por Fase

### ☐ Fase 1: Validação de Ambiente (10-15 min)
- [ ] Executar `.github/scripts/cloud-agent-phase1.sh`
- [ ] Todas as validações passaram?
- [ ] Atualizar `MIGRATION_STATUS.md`
- [ ] ✅ APROVADO para Fase 2

### ☐ Fase 2: Setup Azure Infrastructure (20-30 min)
- [ ] Clone Microsoft Multi-Agent Engine
- [ ] `azd auth login`
- [ ] `azd up --environment sandbox`
- [ ] Validar URLs Azure
- [ ] Documentar agentes Microsoft disponíveis
- [ ] Criar `docs/MAPEAMENTO_AGENTES_MICROSOFT.md`
- [ ] ✅ APROVADO para Fase 3

### ☐ Fase 3: Integrações Brasil (2-3 horas)
- [ ] Criar `src/backend/v3/agents/extensoes_brasil/djen_connector.py`
- [ ] Criar `src/backend/v3/agents/extensoes_brasil/datajud_connector.py`
- [ ] Criar `src/backend/v3/api/extensoes_brasil/pje_webhook.py`
- [ ] Configurar webhook DJEN
- [ ] Testar integração end-to-end
- [ ] ✅ APROVADO para Fase 4

### ☐ Fase 4: Extensões de Prompts (30-60 min) - OPCIONAL
- [ ] Avaliar se necessário
- [ ] Se SIM: criar `src/backend/v3/config/prompt_extensions_br.py`
- [ ] Se SIM: obter aprovação humana
- [ ] ✅ APROVADO para Fase 5

### ☐ Fase 5: Migração de Dados (1-2 horas)
- [ ] Backup Upstash completo
- [ ] Criar `scripts/migrate_upstash_to_cosmos.py`
- [ ] Executar dry-run
- [ ] Executar migração real
- [ ] Validar contagens (origem = destino)
- [ ] Testar rollback
- [ ] ✅ APROVADO para Fase 6

### ☐ Fase 6: Cutover e Monitoramento (24 horas)
- [ ] Deploy Azure em produção
- [ ] Blue-green: 10% tráfego
- [ ] Monitorar por 1 hora
- [ ] Se OK: aumentar para 50%
- [ ] Monitorar por 2 horas
- [ ] Se OK: aumentar para 100%
- [ ] Monitorar por 24 horas
- [ ] ✅ MIGRAÇÃO CONCLUÍDA

---

## 🆘 Quando Pedir Ajuda ao Operador Humano

### Situações que Requerem Aprovação

1. 🔴 **P0: Sistema fora do ar**
   - Ação: Rollback imediato + notificar
   - SLA: < 30 min

2. 🟠 **P1: Funcionalidade crítica quebrada**
   - Ação: Investigar + notificar se > 30 min
   - SLA: < 2h

3. 🟡 **Decisão arquitetural**
   - Ação: Documentar opções + notificar
   - Aguardar aprovação humana

4. 🔵 **Agente Microsoft não existe**
   - Ação: Buscar equivalente + documentar
   - Se não encontrar: notificar (NÃO criar customizado)

5. ⚪ **Incerteza sobre causa raiz**
   - Ação: Documentar investigação + notificar
   - Não adivinhar correção

---

## 📞 Template de Notificação ao Operador

```markdown
## 🆘 Assistência Necessária - Migração Microsoft

**Fase**: [1-6]
**Problema**: [Descrição breve]
**Tentativas**: [O que já foi feito]
**Dúvida**: [O que precisa de decisão humana]
**Impacto**: [Usuários/features afetados]
**Urgência**: [P0/P1/P2/P3]

**Logs Relevantes**:
```
[colar logs aqui]
```

**Recomendação do Cloud Agent**: [Sua sugestão]

**Aguardando aprovação para**: [Ação específica]
```

---

## 📊 Métricas de Sucesso - Como Medir

### Durante Migração

| Métrica | Comando | Meta |
|---------|---------|------|
| Health Check | `curl -I https://assistente-juridico-github.vercel.app/api/health` | 200 OK |
| Testes | `npm run test:run` | 366+ passing |
| TypeScript | `npm run type-check` | 0 errors |
| Build | `npm run build` | Successful |

### Após Migração (Azure)

| Métrica | Comando | Meta |
|---------|---------|------|
| Health Check Azure | `curl -I https://<AZURE_URL>/api/health` | 200 OK |
| Latência | Azure Application Insights | P95 < 2s |
| Error Rate | Sentry + Azure | < 0.1% |
| Uptime | Azure Monitor | > 99.9% |

---

## 🔧 Scripts Úteis

### Validação Rápida
```bash
# Pipeline completo
npm run type-check && npm run lint && npm run test:run && npm run build
```

### Logs em Tempo Real
```bash
# Vercel (sistema atual)
vercel logs --follow --since 5m

# Azure (sistema novo)
azd logs --follow
```

### Health Checks
```bash
# Sistema atual
curl -I https://assistente-juridico-github.vercel.app/api/health

# Sistema novo (após deploy)
curl -I https://<AZURE_URL>/api/health
```

### Rollback de Emergência
```bash
# Executar se algo der errado
./scripts/rollback_to_upstash.sh
```

---

## 📁 Estrutura de Arquivos a Criar

### Fase 2
```
docs/
  └── MAPEAMENTO_AGENTES_MICROSOFT.md
```

### Fase 3
```
src/backend/v3/
  ├── agents/extensoes_brasil/
  │   ├── djen_connector.py
  │   └── datajud_connector.py
  └── api/extensoes_brasil/
      └── pje_webhook.py
```

### Fase 4 (Opcional)
```
src/backend/v3/
  └── config/
      └── prompt_extensions_br.py
```

### Fase 5
```
scripts/
  ├── migrate_upstash_to_cosmos.py
  └── rollback_to_upstash.sh
```

---

## ✅ Checklist Final ANTES de Considerar Concluído

### Funcionalidades
- [ ] DJEN monitor funcionando
- [ ] DataJud integration funcionando
- [ ] Chrome Extension sincronizando
- [ ] 15 funções mapeadas para agentes Microsoft
- [ ] Templates de petições compatíveis
- [ ] Cálculo de prazos BR funcionando
- [ ] Google Calendar sync ativo
- [ ] Notificações email funcionando

### Qualidade
- [ ] Todos os testes passando (366+)
- [ ] SonarCloud Quality Gate: PASSED
- [ ] Sentry: Zero P0/P1 (24h)
- [ ] TypeScript: Zero erros

### Performance
- [ ] Latência P95 < 2s
- [ ] Uptime > 99.9%
- [ ] Cosmos DB sem throttling
- [ ] Azure AI Search < 500ms

### Segurança
- [ ] Secrets não expostos
- [ ] Compliance LGPD mantido
- [ ] Audit logs habilitados
- [ ] Backups automáticos

---

## 🎯 Resumo para Iniciar AGORA

### 1. Leitura Obrigatória (5 min)
- `.github/CLOUD_AGENT_DELEGATION.md`
- `.github/MIGRATION_STATUS.md`

### 2. Primeira Ação (10 min)
```bash
./.github/scripts/cloud-agent-phase1.sh
```

### 3. Atualizar Status
```bash
echo "Fase 1: ✅ CONCLUÍDA - $(date)" >> .github/MIGRATION_STATUS.md
git add .github/MIGRATION_STATUS.md
git commit -m "chore: Phase 1 completed"
git push
```

### 4. Prosseguir para Fase 2
- Se validações OK: Executar fase 2
- Se validações FAIL: Corrigir bugs primeiro

---

**Boa sorte, Cloud Agent! 🚀**

**Lembre-se**: "Estender, não modificar. Conectar, não substituir. Alimentar, não recriar."
