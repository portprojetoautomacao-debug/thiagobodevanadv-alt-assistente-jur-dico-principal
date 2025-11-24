# 🚀 Workflows Avançados de CI/CD - Assistente Jurídico PJe

Este repositório contém uma suíte completa de workflows de CI/CD avançados para o sistema **Assistente Jurídico PJe**, executados em um runner self-hosted Linux x64 com capacidades ilimitadas.

## 📋 Visão Geral dos Workflows

### 🎯 Workflows Principais

| Workflow | Descrição | Trigger | Status |
|----------|-----------|---------|--------|
| [`ci-cd-complete.yml`](.github/workflows/ci-cd-complete.yml) | CI/CD completo com build, test, quality gates e deploy | Push/PR | ✅ Ativo |
| [`deploy-rollback.yml`](.github/workflows/deploy-rollback.yml) | Deploy automatizado com rollback automático | Push + Manual | ✅ Ativo |
| [`monitoring-alerts.yml`](.github/workflows/monitoring-alerts.yml) | Monitoramento contínuo e alertas | Schedule + Manual | ✅ Ativo |
| [`backup-recovery.yml`](.github/workflows/backup-recovery.yml) | Backup e recuperação de dados | Schedule + Manual | ✅ Ativo |
| [`code-quality-analysis.yml`](.github/workflows/code-quality-analysis.yml) | Análise completa de qualidade de código | Push/PR | ✅ Ativo |
| [`performance-optimization.yml`](.github/workflows/performance-optimization.yml) | Otimização de performance e bundle analysis | Push/PR | ✅ Ativo |
| [`vercel-webhook-automation.yml`](.github/workflows/vercel-webhook-automation.yml) | Automação baseada em webhooks do Vercel | Webhook | ✅ Ativo |

### 🔧 Workflows de Suporte

| Workflow | Descrição | Status |
|----------|-----------|--------|
| [`test-runner.yml`](.github/workflows/test-runner.yml) | Teste e validação do runner self-hosted | ✅ Ativo |
| [`vercel-webhook-automation.yml`](.github/workflows/vercel-webhook-automation.yml) | Automação baseada em webhooks do Vercel | ✅ Ativo |

## 🏗️ Infraestrutura

### Self-Hosted Runner
- **Sistema**: Ubuntu 24.04 LTS (Linux x64)
- **Capacidades**: CPU/RAM ilimitadas, armazenamento dedicado
- **Ferramentas**: Docker, Node.js 22.x, Python, ferramentas de build
- **Localização**: `/workspaces/assistente-juridico-p/actions-runner/`

### Tecnologias Suportadas
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js APIs, Redis (Upstash)
- **Testing**: Vitest, Playwright, Lighthouse
- **Deploy**: Vercel, Docker
- **Monitoring**: Health checks, performance monitoring

## 🔐 Configuração de Secrets Avançados

Para funcionalidades avançadas do workflow de automação Vercel, configure estes secrets opcionais:

### Secrets Necessários
```bash
# Habilita rollback automático em caso de falha
AUTO_ROLLBACK_ENABLED=true

# Webhook para notificações (Slack, Discord, Teams)
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK
```

### Como Configurar
1. Acesse: **Repositório → Settings → Secrets and variables → Actions**
2. Clique: **"New repository secret"**
3. Adicione cada secret conforme especificado acima

**📖 Documentação completa:** [`GITHUB_SECRETS_SETUP.md`](../GITHUB_SECRETS_SETUP.md)

## 🚀 Como Usar

### 1. CI/CD Completo (`ci-cd-complete.yml`)
**Executa automaticamente em:**
- Push para `main` ou `staging`
- Pull requests para `main`

**Recursos:**
- ✅ Build e testes automatizados
- ✅ Análise de qualidade (ESLint, TypeScript)
- ✅ Testes unitários e E2E
- ✅ Deploy para staging/production
- ✅ Relatórios SARIF para GitHub Security

### 2. Deploy com Rollback (`deploy-rollback.yml`)
**Triggers:**
- Push para `main` (deploy automático)
- Manual via GitHub Actions

**Recursos:**
- 🚀 Deploy para staging e production
- 🔄 Rollback automático em caso de falha
- 🧪 Testes de smoke pós-deploy
- 📊 Health checks automatizados
- 📢 Notificações Slack/Teams/Email

**Uso manual:**
```yaml
# Via GitHub Actions interface ou CLI
gh workflow run deploy-rollback.yml -f environment=production
```

### 3. Monitoramento Contínuo (`monitoring-alerts.yml`)
**Executa automaticamente:**
- A cada 15 minutos (health checks)
- Manual para verificações específicas

**Monitora:**
- 🏥 Health da aplicação
- 📈 Performance (Lighthouse)
- 🔒 Segurança (vulnerabilidades)
- 📦 Dependências desatualizadas

**Uso manual:**
```bash
gh workflow run monitoring-alerts.yml -f check_type=security
```

### 4. Backup e Recuperação (`backup-recovery.yml`)
**Executa automaticamente:**
- Backup diário às 2:00 AM
- Limpeza automática (30 dias retenção)

**Recursos:**
- 💾 Backup completo (Redis, configs, arquivos)
- 🔄 Backup incremental
- 🧪 Teste de restauração
- ☁️ Upload para GitHub Releases
- 📊 Relatórios de backup

### 6. Automação Vercel Webhook (`vercel-webhook-automation.yml`)
**Executa automaticamente:**
- Acionado por webhooks do Vercel via `repository_dispatch`
- Processa eventos de deployment em tempo real

**Recursos:**
- 🎯 **Monitoramento de Deployments**: Acompanha status em tempo real
- 🚨 **Detecção de Falhas**: Cria issues automaticamente em caso de falha
- 🔄 **Rollback Automático**: Opcional, para versões anteriores estáveis
- 🧪 **Testes de Smoke**: Validação automática após deploy
- 📊 **Métricas de Deployment**: Registro detalhado de performance
- 📢 **Notificações**: Integração com Slack/Discord/Teams

**Eventos Processados:**
- `deployment.succeeded` → ✅ Deploy bem-sucedido
- `deployment.failed` → 🚨 Deploy falhou + rollback opcional
- `deployment.created` → 📦 Deploy iniciado
- `deployment.cancelled` → ❌ Deploy cancelado

**Configuração necessária:**
```bash
# No Vercel (Environment Variables)
GITHUB_TOKEN=your_github_token
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=assistente-juridico-p

# No GitHub (Secrets - opcional)
NOTIFICATION_WEBHOOK_URL=https://hooks.slack.com/...
AUTO_ROLLBACK_ENABLED=true
```

### 7. Análise de Qualidade (`code-quality-analysis.yml`)
**Executa automaticamente em:**
- Push e pull requests

**Analisa:**
- 🔍 Linting e type checking
- 🧩 Complexidade ciclomática
- 🧪 Cobertura de testes (80% mínimo)
- 🔒 Segurança e vulnerabilidades

### 6. Otimização de Performance (`performance-optimization.yml`)
**Executa automaticamente em:**
- Push para `main`

**Analisa:**
- 📦 Tamanho do bundle
- ⚡ Performance (Lighthouse, Web Vitals)
- 🔧 Otimizações de build
- 📊 Comparação com baseline

## ⚙️ Configuração

### Secrets Necessários
Configure estes secrets no repositório GitHub:

```bash
# Vercel
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID

# URLs de produção/staging
PRODUCTION_URL
STAGING_URL

# Redis (Upstash)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
UPSTASH_REDIS_REST_URL_STAGING
UPSTASH_REDIS_REST_TOKEN_STAGING

# Notificações (opcional)
SLACK_WEBHOOK_URL
TEAMS_WEBHOOK_URL
```

### Variáveis de Ambiente
```bash
# Configurar em GitHub repository settings
NODE_ENV=production
VITE_APP_ENV=production
```

## 📊 Dashboards e Relatórios

### Artefatos Gerados
Cada workflow gera artefatos detalhados:
- **Relatórios de qualidade**: ESLint, cobertura, complexidade
- **Métricas de performance**: Lighthouse, Web Vitals, bundle size
- **Logs de deploy**: Health checks, testes de smoke
- **Relatórios de backup**: Status, tamanhos, integridade

### Visualização
- 📈 **GitHub Actions**: Logs e artefatos em tempo real
- 🔍 **GitHub Security**: Alertas de segurança e qualidade
- 📊 **GitHub Releases**: Histórico de backups
- 💬 **PR Comments**: Feedback automático nos pull requests

## 🚨 Alertas e Notificações

### Canais de Notificação
- **Slack**: Alertas críticos e resumos diários
- **Microsoft Teams**: Notificações de deploy e monitoramento
- **Email**: Relatórios semanais e alertas críticos
- **GitHub Issues**: Criação automática para problemas críticos

### Tipos de Alerta
- 🔴 **Crítico**: Falhas de deploy, vulnerabilidades críticas
- 🟠 **Alto**: Problemas de performance, segurança
- 🟡 **Médio**: Avisos de qualidade, dependências desatualizadas
- 🔵 **Info**: Relatórios diários, backups concluídos

## 🔧 Manutenção

### Runner Self-Hosted
```bash
# Verificar status do runner
cd actions-runner/
./run.sh

# Atualizar runner
./config.sh --unattended --replace

# Logs do runner
tail -f _diag/*.log
```

### Limpeza Automática
- **Backups**: Retenção de 30 dias
- **Artefatos**: Removidos após 30 dias
- **Logs**: Rotação automática
- **Cache**: Limpeza semanal

### Monitoramento da Infraestrutura
- CPU/Memória do runner
- Espaço em disco
- Status dos serviços
- Performance dos workflows

## 📈 Métricas e KPIs

### Qualidade de Código
- Cobertura de testes: >80%
- Complexidade ciclomática: <10
- Vulnerabilidades: 0 críticas
- Tempo de build: <5 min

### Performance
- Lighthouse Score: >90
- Bundle size: <2MB
- LCP: <2.5s
- CLS: <0.1

### Disponibilidade
- Uptime: >99.9%
- Tempo de deploy: <10 min
- Rollback automático: <5 min
- Backup diário: 100%

## 🆘 Troubleshooting

### Problemas Comuns

**Runner não conecta:**
```bash
# Verificar configuração
cd actions-runner/
./config.sh --check

# Reiniciar serviço
./svc.sh stop
./svc.sh start
```

**Deploy falha:**
- Verificar secrets do Vercel
- Checar logs do workflow
- Executar rollback manual se necessário

**Testes falham:**
- Verificar dependências
- Checar configuração do Vitest
- Validar ambiente de teste

**Performance degrada:**
- Verificar bundle size
- Analisar Lighthouse report
- Checar otimizações de build

### Suporte
- 📖 **Documentação**: Este README e arquivos individuais
- 🐛 **Issues**: Criar issue no repositório
- 📧 **Contato**: Equipe de desenvolvimento

## 🔄 Atualizações

### Versionamento
- Workflows versionados com releases
- Changelog em cada atualização
- Rollback automático para versões anteriores

### Melhorias Planejadas
- [ ] Integração com DataDog/New Relic
- [ ] Deploy canary com feature flags
- [ ] Análise de performance em tempo real
- [ ] Auto-scaling do runner baseado em carga

---

## 📝 Notas de Desenvolvimento

- **Idioma**: Todos os comentários e documentação em português brasileiro
- **Padrões**: Seguir convenções do projeto React/TypeScript
- **Segurança**: Nunca commitar secrets ou credenciais
- **Performance**: Otimizar para CI/CD rápido e eficiente

**Última atualização:** $(date)
**Versão:** 1.0.0
