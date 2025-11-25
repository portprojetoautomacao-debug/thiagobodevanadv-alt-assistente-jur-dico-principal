# Componentes CI/CD - Assistente Jurídico PJe

Este repositório contém componentes reutilizáveis de CI/CD para aplicações jurídicas, seguindo as melhores práticas do GitLab CI/CD.

## 📦 Componentes Disponíveis

### 🔒 Segurança (`security-component`)
Componente abrangente para auditoria de segurança em aplicações jurídicas.

**Características:**
- Auditoria de dependências npm com níveis configuráveis
- Detecção de segredos usando TruffleHog
- Verificação de compliance LGPD
- Relatórios em múltiplos formatos (JSON, SARIF)

**Uso:**
```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/security/security-component@1.0.0
    inputs:
      audit_level: "standard"
      fail_on_high: true
      report_format: "sarif"
```

**Inputs:**
- `stage`: Stage onde executar (padrão: `security`)
- `audit_level`: Nível de auditoria (`basic`, `standard`, `advanced`)
- `fail_on_high`: Falhar em vulnerabilidades críticas (padrão: `true`)
- `report_format`: Formato do relatório (`json`, `sarif`, `text`)

---

### 🧪 Testes (`testing-component`)
Suite completa de testes para aplicações React/TypeScript.

**Características:**
- Testes unitários com Jest e cobertura
- Testes de integração com banco de dados
- Testes E2E com Playwright
- Testes de acessibilidade com Lighthouse

**Uso:**
```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/testing/testing-component@1.0.0
    inputs:
      test_type: "all"
      coverage_threshold: 85
      browser: "chromium"
```

**Inputs:**
- `stage`: Stage onde executar (padrão: `test`)
- `test_type`: Tipo de teste (`unit`, `integration`, `e2e`, `all`)
- `coverage_threshold`: Threshold de cobertura (%)
- `fail_on_coverage`: Falhar se abaixo do threshold
- `browser`: Browser para E2E (`chromium`, `firefox`, `webkit`)

---

### 🚀 Deployment (`deployment-component`)
Componente flexível para deployment em múltiplas plataformas.

**Características:**
- Suporte a Vercel, Netlify, Docker
- Health checks automatizados
- Rollback automático em falhas
- Smoke tests pós-deployment

**Uso:**
```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/deployment/deployment-component@1.0.0
    inputs:
      environment: "production"
      deploy_target: "vercel"
      health_check_url: "https://meu-app.vercel.app"
      rollback_on_failure: true
```

**Inputs:**
- `stage`: Stage onde executar (padrão: `deploy`)
- `environment`: Ambiente (`staging`, `production`, `preview`)
- `deploy_target`: Plataforma (`vercel`, `netlify`, `docker`, `kubernetes`)
- `health_check_url`: URL para health check
- `rollback_on_failure`: Rollback automático (padrão: `true`)
- `monitoring_enabled`: Habilitar monitoramento

---

### 📊 Monitoramento (`monitoring-component`)
Monitoramento abrangente de performance e disponibilidade.

**Características:**
- Análise de performance com Lighthouse
- Monitoramento de uptime
- Detecção de erros em logs
- Coleta de métricas Core Web Vitals

**Uso:**
```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/monitoring/monitoring-component@1.0.0
    inputs:
      monitoring_type: "advanced"
      alert_on_failure: true
      performance_baseline: 3000
      accessibility_threshold: 95
```

**Inputs:**
- `stage`: Stage onde executar (padrão: `monitor`)
- `monitoring_type`: Tipo de monitoramento (`basic`, `advanced`, `full`)
- `alert_on_failure`: Enviar alertas em falhas
- `performance_baseline`: Baseline de performance (ms)
- `accessibility_threshold`: Threshold de acessibilidade (%)

## 🚀 Guia de Uso

### Pré-requisitos

1. **Projeto configurado como Catálogo CI/CD:**
   ```bash
   # No GitLab: Settings > General > Visibility > CI/CD Catalog: ON
   ```

2. **Versão semântica nas tags:**
   ```bash
   git tag -a "1.0.0" -m "Release inicial dos componentes"
   git push origin 1.0.0
   ```

### Exemplo de Pipeline Completo

```yaml
stages: [security, test, build, deploy, monitor]

include:
  # Segurança
  - component: $CI_SERVER_FQDN/assistente-juridico-p/security/security-component@1.0.0
    inputs:
      audit_level: "standard"

  # Testes
  - component: $CI_SERVER_FQDN/assistente-juridico-p/testing/testing-component@1.0.0
    inputs:
      test_type: "all"
      coverage_threshold: 80

  # Deployment
  - component: $CI_SERVER_FQDN/assistente-juridico-p/deployment/deployment-component@1.0.0
    inputs:
      environment: "production"
      deploy_target: "vercel"
      health_check_url: "$CI_ENVIRONMENT_URL"

  # Monitoramento
  - component: $CI_SERVER_FQDN/assistente-juridico-p/monitoring/monitoring-component@1.0.0
    inputs:
      monitoring_type: "advanced"

# Build job personalizado
build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

# Deploy job personalizado (se necessário)
deploy-custom:
  stage: deploy
  script:
    - echo "Deploy customizado executado"
  dependencies:
    - build
  only:
    - main
```

## 🔧 Desenvolvimento e Teste

### Testando Componentes Localmente

```yaml
# .gitlab-ci.yml para teste
include:
  - local: '.gitlab/templates/security/security-component.yml'
    inputs:
      audit_level: "basic"

test-component:
  stage: test
  script:
    - echo "Testando componente localmente"
```

### Estrutura de Diretórios

```
.gitlab/
├── templates/
│   ├── security/
│   │   └── security-component.yml
│   ├── testing/
│   │   └── testing-component.yml
│   ├── deployment/
│   │   └── deployment-component.yml
│   └── monitoring/
│       └── monitoring-component.yml
└── README.md
```

## 📋 Checklist de Qualidade

- [x] **Inputs bem documentados** com valores padrão
- [x] **Nomes únicos de jobs** para evitar conflitos
- [x] **Gestão adequada de artefatos** com expiração
- [x] **Tratamento de erros** com `allow_failure` apropriado
- [x] **Dependências mínimas** entre componentes
- [x] **Uso de variáveis CI/CD** em vez de hardcoded
- [x] **Documentação completa** em português
- [x] **Testes automatizados** dos componentes
- [x] **Versionamento semântico** nas releases
- [x] **Segurança LGPD** considerada nos componentes

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie uma branch** para sua feature: `git checkout -b feature/novo-componente`
3. **Commit suas mudanças**: `git commit -am 'Adiciona novo componente'`
4. **Push para a branch**: `git push origin feature/novo-componente`
5. **Abra um Merge Request**

### Padrões de Código

- Usar **inputs** em vez de variáveis hardcoded
- Documentar **todos os inputs** com `description`
- Incluir **valores padrão** para inputs obrigatórios
- Usar **nomes descritivos** para jobs e stages
- Implementar **error handling** adequado
- Criar **artefatos** com tempo de expiração apropriado

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](../LICENSE) para detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a [documentação oficial do GitLab CI/CD](https://docs.gitlab.com/ee/ci/components/)
2. Abra uma issue no projeto
3. Consulte o [FAQ do GitLab CI/CD Catalog](https://docs.gitlab.com/ee/ci/components/#faq)

---

**Versão:** 1.0.0
**Última atualização:** $(date)
**Mantenedor:** Equipe Assistente Jurídico PJe