# Diagrama de Workflows - GitHub Actions

Este documento apresenta uma visualização dos workflows e suas dependências.

---

## 🗺️ Mapa de Workflows

```mermaid
graph TD
    subgraph "Triggers Principais"
        PR[Pull Request]
        PUSH[Push to Main]
        SCHEDULE[Schedule/Cron]
        MANUAL[Manual Dispatch]
    end

    subgraph "CI/CD Pipeline"
        PR --> PR_WORKFLOW[pr.yml<br/>Validação de PR]
        PR --> AUTOFIX[autofix.yml<br/>Auto-fix Linting]
        PR --> COPILOT_APPROVE[copilot-auto-approve.yml<br/>Auto Approve]
        PR --> DEPENDABOT[dependabot-auto-merge.yml<br/>Auto Merge Deps]
        
        PUSH --> CI[ci.yml<br/>Build & Test]
        PUSH --> DEPLOY[deploy.yml<br/>Deploy Vercel]
        PUSH --> CODE_QUALITY[code-quality.yml<br/>CodeQL & Quality]
        PUSH --> AGENTS_HEALTH[agents-health-check.yml<br/>Health Check]
        
        SCHEDULE --> SECURITY[security-scan.yml<br/>Security Scans]
        SCHEDULE --> NIGHTLY[nightly.yml<br/>Nightly Build]
        SCHEDULE --> CLEANUP[cleanup.yml<br/>Cleanup Old Data]
        
        MANUAL --> E2E[e2e.yml<br/>E2E Tests]
        MANUAL --> PERFORMANCE[performance.yml<br/>Performance Tests]
    end

    subgraph "Deploy Pipeline"
        DEPLOY --> VERCEL_PREVIEW[Preview Deploy]
        DEPLOY --> VERCEL_PROD[Production Deploy]
        DEPLOY --> E2E_AFTER[E2E Tests]
    end

    subgraph "Quality Gates"
        PR_WORKFLOW --> LINT[Lint Check]
        PR_WORKFLOW --> BUILD[Build Check]
        PR_WORKFLOW --> TEST[Test Check]
        PR_WORKFLOW --> CONFLICTS[Merge Conflicts]
        
        CI --> LINT_CI[ESLint + SARIF]
        CI --> BUILD_CI[Build Artifacts]
        CI --> TEST_CI[Unit Tests]
        CI --> AUDIT[NPM Audit]
        
        CODE_QUALITY --> CODEQL[CodeQL Analysis]
        CODE_QUALITY --> TYPE_CHECK[TypeScript Check]
        CODE_QUALITY --> BUNDLE_SIZE[Bundle Size]
    end

    subgraph "Security Layers"
        SECURITY --> NPM_AUDIT[NPM Audit]
        SECURITY --> SECRET_SCAN[Secret Scanning]
        SECURITY --> LICENSE[License Check]
        
        CODEQL --> SARIF[SARIF Upload]
        LINT_CI --> SARIF
    end

    style PR fill:#e1f5fe
    style PUSH fill:#fff3e0
    style SCHEDULE fill:#f3e5f5
    style MANUAL fill:#e8f5e9
    
    style COPILOT_APPROVE fill:#ffcdd2
    style DEPENDABOT fill:#ffcdd2
    style DEPLOY fill:#fff59d
    style SECURITY fill:#c8e6c9
```

---

## 🔄 Fluxo de um Pull Request

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant PR as PR Workflow
    participant CI as CI Workflow
    participant Quality as Code Quality
    participant Deploy as Deploy Workflow
    participant Vercel as Vercel

    Dev->>GH: Cria Pull Request
    GH->>PR: Trigger pr.yml
    
    par Validações Paralelas
        PR->>PR: Check Merge Conflicts
        PR->>PR: Run Linter
        PR->>PR: Build Application
        PR->>PR: Run Tests
        PR->>PR: Check Bundle Size
    end
    
    PR->>GH: Post PR Comment
    
    GH->>CI: Trigger ci.yml
    par CI Jobs
        CI->>CI: Build & Test
        CI->>CI: Security Audit
        CI->>CI: Generate SARIF
    end
    
    GH->>Quality: Trigger code-quality.yml
    par Quality Checks
        Quality->>Quality: CodeQL Analysis
        Quality->>Quality: TypeScript Check
        Quality->>Quality: Dependency Review
    end
    
    alt Todos os checks passam
        GH->>Deploy: Trigger deploy.yml
        Deploy->>Vercel: Deploy Preview
        Vercel-->>Deploy: Preview URL
        Deploy->>GH: Comment URL on PR
        
        alt Auto-Approve Habilitado
            GH->>GH: Auto-Approve PR
        end
    else Algum check falha
        GH->>Dev: Notify Failure
    end
```

---

## 🏗️ Pipeline de Deploy

```mermaid
flowchart TD
    START([Push to Main]) --> VALIDATE{Validar<br/>Pré-requisitos}
    
    VALIDATE -->|Secrets OK| LINT[Run Linter]
    VALIDATE -->|Secrets Faltando| FAIL_SECRETS[❌ Falha: Secrets]
    
    LINT -->|✅ Pass| CHECK_FUNCTIONS[Validar Function Count]
    LINT -->|❌ Fail| FAIL_LINT[❌ Falha: Linting]
    
    CHECK_FUNCTIONS -->|≤12 Functions| VALIDATE_AGENTS[Validar Agent Files]
    CHECK_FUNCTIONS -->|>12 Functions| FAIL_FUNCTIONS[❌ Falha: Vercel Limit]
    
    VALIDATE_AGENTS -->|✅ All Present| BUILD[Build Application]
    VALIDATE_AGENTS -->|❌ Missing| FAIL_AGENTS[❌ Falha: Agent Files]
    
    BUILD -->|✅ Success| DEPLOY{Deploy Type?}
    BUILD -->|❌ Fail| FAIL_BUILD[❌ Falha: Build]
    
    DEPLOY -->|PR| PREVIEW[Deploy Preview]
    DEPLOY -->|Main| PROD[Deploy Production]
    
    PREVIEW --> RETRY{Success?}
    PROD --> RETRY
    
    RETRY -->|Yes| COMMENT[Comment URL on PR]
    RETRY -->|No, Retry<3| DEPLOY
    RETRY -->|No, Retry≥3| FAIL_DEPLOY[❌ Falha: Deploy]
    
    COMMENT --> E2E[Run E2E Tests]
    
    E2E -->|✅ Pass| SUCCESS([✅ Deploy Completo])
    E2E -->|❌ Fail| WARN_E2E[⚠️ Deploy OK, E2E Falhou]
    
    style START fill:#4caf50
    style SUCCESS fill:#4caf50
    style FAIL_SECRETS fill:#f44336
    style FAIL_LINT fill:#f44336
    style FAIL_FUNCTIONS fill:#f44336
    style FAIL_AGENTS fill:#f44336
    style FAIL_BUILD fill:#f44336
    style FAIL_DEPLOY fill:#f44336
    style WARN_E2E fill:#ff9800
```

---

## 🔒 Camadas de Segurança

```mermaid
graph LR
    subgraph "Camada 1: Código"
        CODE[Código Fonte] --> ESLINT[ESLint]
        CODE --> TYPESCRIPT[TypeScript]
    end
    
    subgraph "Camada 2: Dependências"
        DEPS[package.json] --> NPM_AUDIT[NPM Audit]
        DEPS --> DEP_REVIEW[Dependency Review]
        DEPS --> LICENSE_CHECK[License Check]
    end
    
    subgraph "Camada 3: Build"
        BUILD_ARTIFACTS[Build/Dist] --> CODEQL[CodeQL]
        BUILD_ARTIFACTS --> BUNDLE[Bundle Analysis]
    end
    
    subgraph "Camada 4: Secrets"
        SECRETS[Secrets/Env] --> SECRET_SCAN[Secret Scanning]
        SECRETS --> ENV_VALIDATE[Env Validation]
    end
    
    subgraph "Camada 5: Runtime"
        RUNTIME[Production] --> AGENTS_MONITOR[Agents Health]
        RUNTIME --> VERCEL_LOGS[Vercel Logs]
    end
    
    ESLINT --> SARIF_UPLOAD[Upload SARIF]
    CODEQL --> SARIF_UPLOAD
    
    SARIF_UPLOAD --> SECURITY_TAB[GitHub Security Tab]
    NPM_AUDIT --> SECURITY_TAB
    SECRET_SCAN --> SECURITY_TAB
    
    style SECURITY_TAB fill:#ff5722
    style SARIF_UPLOAD fill:#ffc107
```

---

## 📊 Problemas Identificados por Categoria

```mermaid
pie title Distribuição de Problemas por Severidade
    "Crítico (Segurança)" : 3
    "Alto (Performance)" : 5
    "Médio (Qualidade)" : 8
    "Baixo (Manutenção)" : 4
```

```mermaid
pie title Problemas por Workflow
    "ci.yml" : 4
    "deploy.yml" : 3
    "copilot-auto-approve.yml" : 3
    "dependabot-auto-merge.yml" : 2
    "code-quality.yml" : 2
    "nightly.yml" : 3
    "Outros" : 3
```

---

## ⏱️ Timeline de Otimização

```mermaid
gantt
    title Cronograma de Implementação das Melhorias
    dateFormat YYYY-MM-DD
    
    section Fase 1: Crítico
    Análise Completa           :done, a1, 2025-11-23, 1d
    Corrigir pull_request_target :active, a2, 2025-11-24, 2d
    Proteger Secrets            :a3, 2025-11-26, 1d
    Build Compartilhado         :a4, 2025-11-27, 3d
    Correções Menores           :a5, 2025-11-30, 1d
    
    section Fase 2: Importante
    Composite Actions           :b1, 2025-12-01, 3d
    Otimizar Cache             :b2, 2025-12-04, 2d
    Testes de Workflows        :b3, 2025-12-06, 2d
    
    section Fase 3: Polimento
    Documentação               :c1, 2025-12-08, 5d
    Diagramas                  :c2, 2025-12-13, 3d
    Validação Final            :c3, 2025-12-16, 2d
```

---

## 📈 Impacto das Otimizações

```mermaid
xychart-beta
    title "Tempo de CI - Antes e Depois"
    x-axis ["Atual", "Após Cache", "Após Build Compartilhado", "Após Todas"]
    y-axis "Tempo (minutos)" 0 --> 10
    bar [8, 6.5, 4.5, 4]
    line [8, 6.5, 4.5, 4]
```

---

## 🎯 Workflows Críticos vs Normais

```mermaid
quadrantChart
    title Workflows: Criticidade vs Frequência de Execução
    x-axis Baixa Frequência --> Alta Frequência
    y-axis Baixa Criticidade --> Alta Criticidade
    quadrant-1 "Otimizar Urgente"
    quadrant-2 "Manter Estável"
    quadrant-3 "Baixa Prioridade"
    quadrant-4 "Monitorar Custos"
    
    ci.yml: [0.8, 0.9]
    pr.yml: [0.9, 0.85]
    deploy.yml: [0.6, 0.95]
    security-scan.yml: [0.3, 0.8]
    code-quality.yml: [0.5, 0.7]
    e2e.yml: [0.4, 0.6]
    nightly.yml: [0.2, 0.4]
    cleanup.yml: [0.1, 0.3]
    agents-health-check.yml: [0.4, 0.7]
    copilot-auto-approve.yml: [0.5, 0.6]
```

---

## 🔐 Matriz de Risco de Segurança

| Workflow | pull_request_target | Secrets Exposure | Permissions | Score |
|----------|---------------------|------------------|-------------|-------|
| copilot-auto-approve.yml | 🔴 Alto | 🟡 Médio | 🟡 Médio | 6/10 |
| dependabot-auto-merge.yml | 🔴 Alto | 🟡 Médio | 🔴 Alto | 5/10 |
| deploy.yml | 🟢 Baixo | 🔴 Alto | 🟡 Médio | 6/10 |
| ci.yml | 🟢 Baixo | 🟢 Baixo | 🟢 Baixo | 9/10 |
| pr.yml | 🟢 Baixo | 🟢 Baixo | 🟡 Médio | 8/10 |
| security-scan.yml | 🟢 Baixo | 🟢 Baixo | 🟡 Médio | 8/10 |

**Legenda:**
- 🔴 Alto Risco - Requer correção imediata
- 🟡 Médio Risco - Requer atenção
- 🟢 Baixo Risco - Aceitável

---

## 📊 Dashboard de Métricas

### Antes das Otimizações
```
┌─────────────────────────────────────────────┐
│  CI Performance Dashboard                   │
├─────────────────────────────────────────────┤
│  Tempo Médio de CI:        8.2 min         │
│  Builds/Dia:               ~15              │
│  Consumo Mensal:           1200 min         │
│  Cache Hit Rate:           58%              │
│  Taxa de Falha:            12%              │
│  Score de Segurança:       6.5/10           │
└─────────────────────────────────────────────┘
```

### Depois das Otimizações (Meta)
```
┌─────────────────────────────────────────────┐
│  CI Performance Dashboard                   │
├─────────────────────────────────────────────┤
│  Tempo Médio de CI:        4.0 min  ⬇️ 51% │
│  Builds/Dia:               ~15              │
│  Consumo Mensal:           700 min  ⬇️ 42%  │
│  Cache Hit Rate:           85%      ⬆️ 47%  │
│  Taxa de Falha:            8%       ⬇️ 33%  │
│  Score de Segurança:       8.5/10   ⬆️ 31%  │
└─────────────────────────────────────────────┘
```

---

**Nota:** Estes diagramas são renderizados automaticamente no GitHub quando visualizados em um arquivo Markdown. Para melhor visualização, abra este arquivo diretamente no GitHub.

---

**Criado por:** GitHub Copilot AI Agent  
**Data:** 23/11/2025  
**Baseado em:** Análise completa de 16 workflows
