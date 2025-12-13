# ✅ Checklist Completo - Azure DevOps + Monitoring

**Status do Projeto**: Implementação Completa  
**Data**: 2024-01-XX  
**Responsável**: DevOps Team

---

## 📊 Status Geral

| Fase | Status | Progresso |
|------|--------|-----------|
| **Implementação** | ✅ Completo | 100% |
| **Validação Local** | ⏳ Pendente | 0% |
| **Deploy Azure** | ⏳ Pendente | 0% |
| **Configuração DevOps** | ⏳ Pendente | 0% |
| **Treinamento Equipe** | ⏳ Pendente | 0% |

---

## 🎯 Fase 1: Imediato (HOJE - 30 min)

### **Passo 1.1: Instalar Dependências** ✅

```bash
npm install --save @microsoft/applicationinsights-web @microsoft/applicationinsights-react-js history
```

**Status**: ✅ Concluído  
**Arquivos Modificados**: `package.json`

---

### **Passo 1.2: Executar Validação Local** ⏳

```bash
npm run azure:validate
```

**Status**: ⏳ Pendente  
**Ações Necessárias**:
- [ ] Executar comando acima
- [ ] Revisar output
- [ ] Corrigir erros se houver

**Resultado Esperado**:
```
✅ Passaram: 15-20 testes
⚠️ Alguns testes podem falhar (normal antes do deploy)
```

---

### **Passo 1.3: Obter Subscription ID** ⏳

```powershell
# Login no Azure
az login

# Listar subscriptions
az account list --output table

# Copiar SubscriptionId
```

**Status**: ⏳ Pendente  
**Ações Necessárias**:
- [ ] Executar `az login`
- [ ] Copiar Subscription ID
- [ ] Salvar em local seguro

---

## 🚀 Fase 2: Curto Prazo (1-2 dias)

### **Passo 2.1: Criar Recursos no Azure** ⏳

```powershell
cd scripts
.\setup-azure-complete.ps1 -SubscriptionId "SUA-SUBSCRIPTION-ID-AQUI"
```

**Status**: ⏳ Pendente  
**Tempo Estimado**: 3-5 minutos  
**Recursos Criados**:
- [ ] Resource Group: `assistente-juridico-rg`
- [ ] Application Insights: `assistente-juridico-insights`
- [ ] Load Testing: `assistente-juridico-load-test`
- [ ] Dashboard: `Assistente-Juridico-Agents-Dashboard`

**Resultado Esperado**:
```
✅ SETUP CONCLUÍDO COM SUCESSO!
📊 Recursos Criados: 4/4
🔐 Variáveis Configuradas: .env.local atualizado
```

---

### **Passo 2.2: Configurar Vercel** ⏳

```
1. Acessar: https://vercel.com/dashboard
2. Projeto: assistente-juridico-github
3. Settings → Environment Variables → Add New
4. Nome: VITE_AZURE_INSIGHTS_CONNECTION_STRING
5. Valor: (colar connection string do passo anterior)
6. Environments: Production, Preview, Development
7. Salvar e Re-deploy
```

**Status**: ⏳ Pendente  
**Ações Necessárias**:
- [ ] Acessar dashboard Vercel
- [ ] Adicionar variável
- [ ] Re-deploy aplicação
- [ ] Aguardar deploy completo (2-3 min)

---

### **Passo 2.3: Validar Application Insights** ⏳

```
1. Acessar: https://portal.azure.com
2. Application Insights → assistente-juridico-insights
3. Live Metrics → Aguardar 2-3 minutos
4. Verificar se dados aparecem
```

**Status**: ⏳ Pendente  
**Ações Necessárias**:
- [ ] Abrir Portal Azure
- [ ] Navegar para Application Insights
- [ ] Verificar Live Metrics
- [ ] Confirmar dados aparecendo

**Resultado Esperado**:
- ✅ Live Metrics mostrando dados em tempo real
- ✅ Server requests aparecendo
- ✅ Dependencies sendo trackadas

---

### **Passo 2.4: Configurar Azure DevOps Project** ⏳

```
1. Acessar: https://dev.azure.com
2. New Project → "Assistente Jurídico PJe"
3. Import Repository from GitHub
4. URL: https://github.com/thiagobodevanadv-alt/assistente-jur-dico-principal
```

**Status**: ⏳ Pendente  
**Tempo Estimado**: 10 minutos  
**Ações Necessárias**:
- [ ] Criar projeto Azure DevOps
- [ ] Importar repositório
- [ ] Configurar Service Connection (Azure)
- [ ] Configurar Service Connection (GitHub)

---

### **Passo 2.5: Criar Variable Group** ⏳

```
Azure DevOps → Pipelines → Library → New variable group
Nome: production-secrets
```

**Variáveis a Adicionar**:
- [ ] `VERCEL_TOKEN` (Secret)
- [ ] `VERCEL_ORG_ID` (Regular)
- [ ] `VERCEL_PROJECT_ID` (Regular)
- [ ] `VITE_GOOGLE_CLIENT_ID` (Secret)
- [ ] `VITE_GOOGLE_API_KEY` (Secret)
- [ ] `VITE_AZURE_INSIGHTS_CONNECTION_STRING` (Secret)
- [ ] `SUBSCRIPTION_ID` (Regular)

**Status**: ⏳ Pendente

---

### **Passo 2.6: Criar Pipeline** ⏳

```
1. Azure DevOps → Pipelines → New Pipeline
2. Where is your code? → Azure Repos Git
3. Select repository → assistente-jur-dico-principal
4. Configure → Existing Azure Pipelines YAML file
5. Path: /azure-pipelines.yml
6. Run
```

**Status**: ⏳ Pendente  
**Tempo Estimado**: 8-12 minutos (primeiro build)  
**Ações Necessárias**:
- [ ] Criar pipeline
- [ ] Aguardar primeiro build
- [ ] Verificar que todos os stages passaram
- [ ] Revisar logs se houver falhas

---

### **Passo 2.7: Verificar Dashboard** ⏳

```
1. Portal Azure → Dashboards
2. Selecionar: Assistente-Juridico-Agents-Dashboard
3. Verificar 11 widgets funcionando
```

**Widgets a Verificar**:
- [ ] 📊 Tarefas Concluídas
- [ ] ⏱️ Tempo Médio
- [ ] ❌ Taxa de Erro
- [ ] 📈 Eventos Timeline
- [ ] ✅ Status Tarefas
- [ ] 📩 Intimações
- [ ] 📝 Minutas
- [ ] 🐛 Erros Recentes
- [ ] 🌐 APIs
- [ ] 💾 Redis
- [ ] ⚡ Performance

**Status**: ⏳ Pendente

---

## 📊 Fase 3: Médio Prazo (1 semana)

### **Passo 3.1: Executar Load Test Baseline** ⏳

```bash
npm run azure:load-test
```

**Status**: ⏳ Pendente  
**Tempo Estimado**: 5-10 minutos (execução do teste)  
**Ações Necessárias**:
- [ ] Executar comando
- [ ] Aguardar conclusão
- [ ] Revisar resultados no Portal Azure
- [ ] Documentar baseline metrics

**Métricas a Documentar**:
- [ ] Response Time P95: ____ms
- [ ] Error Rate: ____%
- [ ] Throughput: ____req/s
- [ ] Concurrent Users Supported: ____

---

### **Passo 3.2: Configurar Action Groups** ⏳

```powershell
az monitor action-group create \
  --name "AgentsAlerts-ActionGroup" \
  --resource-group assistente-juridico-rg \
  --short-name "AgentsAlert" \
  --action email admin thiagobodevanadvocacia@gmail.com \
  --action webhook webhook-alert "https://assistente-juridico-github.vercel.app/api/notifications/send"
```

**Status**: ⏳ Pendente  
**Ações Necessárias**:
- [ ] Executar comando acima
- [ ] Testar envio de email
- [ ] Testar webhook
- [ ] Vincular aos alertas existentes

---

### **Passo 3.3: Ajustar Thresholds de Alertas** ⏳

**Alertas a Revisar**:
- [ ] HighErrorRate-Agents (atual: >10%)
- [ ] SlowAgentProcessing (atual: >5s)
- [ ] CriticalExceptions-Agents (atual: >5 em 5min)

**Processo**:
1. Coletar métricas por 3-5 dias
2. Calcular baseline real
3. Ajustar thresholds baseado em dados reais
4. Documentar novos valores

**Status**: ⏳ Pendente

---

### **Passo 3.4: Treinar Equipe** ⏳

**Sessões de Treinamento**:
- [ ] **Sessão 1**: Navegação no Dashboard (1h)
- [ ] **Sessão 2**: Interpretando Métricas (1h)
- [ ] **Sessão 3**: Respondendo a Alertas (30min)
- [ ] **Sessão 4**: Queries Customizadas (30min)

**Materiais**:
- ✅ Guia de Treinamento: `docs/AZURE_TRAINING_GUIDE.md`
- [ ] Apresentação de slides (a criar)
- [ ] Vídeo tutorial (a criar)
- [ ] FAQ (a criar)

**Status**: ⏳ Pendente

---

## 🎯 Fase 4: Longo Prazo (1 mês)

### **Passo 4.1: Migrar Completamente para Azure Pipelines** ⏳

**Workflows GitHub Actions a Desabilitar**:
- [ ] `.github/workflows/auto-test-fix.yml`
- [ ] `.github/workflows/backup-recovery.yml`
- [ ] `.github/workflows/security-scan.yml`

**Processo**:
1. Verificar que Azure Pipelines está 100% operacional
2. Executar 5-10 builds bem-sucedidos
3. Renomear workflows GitHub: `.yml` → `.yml.disabled`
4. Monitorar por 1 semana
5. Deletar workflows GitHub definitivamente

**Status**: ⏳ Pendente

---

### **Passo 4.2: Implementar Auto-Scaling** ⏳

**Estratégia**:
- Usar métricas do Application Insights
- Escalar baseado em CPU, Memory, Request Rate
- Configurar min/max instances

**Ferramentas**:
- Azure Monitor Autoscale
- Application Insights metrics

**Status**: ⏳ Pendente

---

### **Passo 4.3: Configurar Application Insights para Todas as APIs** ⏳

**APIs a Instrumentar**:
- [ ] `/api/agents`
- [ ] `/api/expedientes`
- [ ] `/api/pje-sync`
- [ ] `/api/djen`
- [ ] `/api/datajud`
- [ ] `/api/emails`
- [ ] `/api/health`

**Padrão a Implementar**:
```typescript
import { trackAPICall } from '@/lib/azure-insights';

export async function handler(req, res) {
  const startTime = Date.now();
  try {
    // ... lógica da API ...
    const duration = Date.now() - startTime;
    trackAPICall(req.url, req.method, 200, duration, true);
    return res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    trackAPICall(req.url, req.method, 500, duration, false);
    return res.status(500).json({ error });
  }
}
```

**Status**: ⏳ Pendente

---

### **Passo 4.4: Otimizar Custos** ⏳

**Ações**:
- [ ] Revisar uso de Application Insights (últimos 30 dias)
- [ ] Ajustar sampling percentage se necessário
- [ ] Configurar retention policies (padrão: 90 dias)
- [ ] Configurar billing alerts ($50/mês threshold)

**Ferramentas**:
- Azure Cost Management
- Application Insights Usage and Estimated Costs

**Status**: ⏳ Pendente

---

## 📈 Métricas de Sucesso

### **KPIs a Monitorar**

| Métrica | Target | Atual | Status |
|---------|--------|-------|--------|
| **Uptime** | >99.5% | - | ⏳ |
| **Response Time P95** | <3s | - | ⏳ |
| **Error Rate** | <2% | - | ⏳ |
| **Deployment Frequency** | >10/semana | - | ⏳ |
| **Mean Time to Recovery** | <15min | - | ⏳ |
| **Agent Task Success Rate** | >95% | - | ⏳ |

---

## 🔄 Próximas Revisões

| Revisão | Data | Responsável | Status |
|---------|------|-------------|--------|
| **Setup Inicial** | 2024-01-XX | DevOps | ⏳ Pendente |
| **Baseline Estabelecido** | 2024-01-XX+7d | DevOps | ⏳ Pendente |
| **Treinamento Concluído** | 2024-01-XX+14d | Tech Lead | ⏳ Pendente |
| **Migração Completa** | 2024-01-XX+30d | DevOps | ⏳ Pendente |

---

## 📚 Documentação de Referência

| Documento | Localização | Status |
|-----------|-------------|--------|
| **Guia de Migração Completo** | `docs/AZURE_MIGRATION_GUIDE.md` | ✅ Completo |
| **Guia Quickstart** | `docs/AZURE_QUICKSTART.md` | ✅ Completo |
| **Guia de Treinamento** | `docs/AZURE_TRAINING_GUIDE.md` | ✅ Completo |
| **Azure Pipelines YAML** | `azure-pipelines.yml` | ✅ Completo |
| **Load Testing Config** | `azure-load-testing.yaml` | ✅ Completo |
| **Dashboard Template** | `azure-dashboard-template.json` | ✅ Completo |
| **Setup Script** | `scripts/setup-azure-complete.ps1` | ✅ Completo |
| **Validation Script** | `scripts/validate-azure-integration.js` | ✅ Completo |

---

## 🆘 Suporte

**Em caso de problemas**:

1. **Consultar troubleshooting**: `docs/AZURE_MIGRATION_GUIDE.md` (seção Troubleshooting)
2. **Executar validação**: `npm run azure:validate`
3. **Verificar logs**: Portal Azure → Application Insights → Logs
4. **Contatar suporte**: thiagobodevanadvocacia@gmail.com

---

**Última Atualização**: 2024-01-XX  
**Versão do Checklist**: 1.0  
**Próxima Revisão**: 2024-01-XX+7d
