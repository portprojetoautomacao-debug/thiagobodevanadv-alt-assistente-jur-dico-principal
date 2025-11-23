# Plano de Correções Imediatas - GitHub Actions

**Data:** 23/11/2025  
**Prioridade:** CRÍTICA  
**Tempo Estimado:** 1 semana (40 horas)

---

## 🎯 Objetivo

Implementar correções urgentes de segurança e otimizações de alto impacto nos workflows do GitHub Actions, com foco em:
1. Eliminar riscos de segurança identificados
2. Reduzir tempo de CI em 50%
3. Melhorar confiabilidade dos workflows

---

## 📋 Checklist de Correções

### 1. Segurança - pull_request_target (CRÍTICO)

**Arquivos:**
- `.github/workflows/copilot-auto-approve.yml`
- `.github/workflows/dependabot-auto-merge.yml`

**Problema:**
Uso de `pull_request_target` permite execução de código não confiável com acesso a secrets.

**Solução Proposta:**

#### Opção A: Trocar para `pull_request` (RECOMENDADO)
```yaml
# copilot-auto-approve.yml - ANTES
on:
  pull_request_target:
    types: [opened, synchronize, reopened]

# copilot-auto-approve.yml - DEPOIS
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write  # Apenas o necessário

jobs:
  check-tests:
    if: github.actor == 'github-actions[bot]'
    # Agora é seguro fazer checkout do código do PR
```

#### Opção B: Adicionar validação rigorosa (se pull_request_target for necessário)
```yaml
on:
  pull_request_target:
    types: [opened, synchronize, reopened]

jobs:
  security-check:
    runs-on: ubuntu-latest
    steps:
      # NÃO fazer checkout do código do PR
      - name: Validate PR source
        run: |
          # Verificar que o PR vem do mesmo repositório
          if [ "${{ github.event.pull_request.head.repo.full_name }}" != "${{ github.repository }}" ]; then
            echo "❌ PR from fork - aborting for security"
            exit 1
          fi
```

**Status:** [ ] Implementar  
**Prazo:** 2 dias  
**Responsável:** TBD

---

### 2. Segurança - Vazamento de Secrets em Logs

**Arquivo:** `.github/workflows/deploy.yml` (linha ~179)

**Problema:**
```yaml
# RISCO: Token pode aparecer em logs se comando falhar
DEPLOYMENT_URL=$($DEPLOY_CMD 2>&1 | tee /dev/stderr | grep -o 'https://[^ ]*' | tail -1)
```

**Solução:**
```yaml
- name: Deploy to Vercel
  id: deploy
  run: |
    # Token via variável de ambiente (não aparece em logs)
    if [[ "${{ github.event_name }}" == "pull_request" ]]; then
      vercel deploy --yes 2>&1 | tee deploy.log
    else
      vercel deploy --prod --yes 2>&1 | tee deploy.log
    fi
    
    # Extrair URL do log
    DEPLOYMENT_URL=$(grep -o 'https://[^ ]*vercel.app[^ ]*' deploy.log | tail -1)
    echo "url=$DEPLOYMENT_URL" >> $GITHUB_OUTPUT
    rm deploy.log  # Limpar arquivo com possíveis secrets
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

**Status:** [ ] Implementar  
**Prazo:** 1 dia  
**Responsável:** TBD

---

### 3. Otimização - Build Compartilhado

**Arquivos Afetados:**
- `.github/workflows/ci.yml`
- `.github/workflows/pr.yml`
- `.github/workflows/code-quality.yml`

**Problema:**
Cada workflow faz build separadamente, desperdiçando ~3-4 minutos por workflow.

**Solução:**

#### Criar job de build reutilizável
```yaml
# .github/workflows/ci.yml
jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_GOOGLE_CLIENT_ID: 'dummy-client-id'
          VITE_GOOGLE_API_KEY: 'dummy-api-key'
          VITE_REDIRECT_URI: 'http://localhost:5173'
          VITE_APP_ENV: 'ci'
      
      - name: Generate cache key
        id: cache-key
        run: echo "key=dist-${{ github.sha }}" >> $GITHUB_OUTPUT
      
      - name: Cache build
        uses: actions/cache/save@v4
        with:
          path: dist/
          key: ${{ steps.cache-key.outputs.key }}

  lint:
    needs: build
    steps:
      - uses: actions/checkout@v4
      
      - name: Restore build cache
        uses: actions/cache/restore@v4
        with:
          path: dist/
          key: ${{ needs.build.outputs.cache-key }}
          fail-on-cache-miss: true
      
      - name: Run linter
        run: npm run lint

  test:
    needs: build
    steps:
      - uses: actions/checkout@v4
      
      - name: Restore build cache
        uses: actions/cache/restore@v4
        with:
          path: dist/
          key: ${{ needs.build.outputs.cache-key }}
          fail-on-cache-miss: true
      
      - name: Run tests
        run: npm test
```

**Impacto:**
- Redução de 50-60% no tempo total de CI
- Economia de ~800-1000 minutos Actions/mês

**Status:** [ ] Implementar  
**Prazo:** 3 dias  
**Responsável:** TBD

---

### 4. Otimização - Remover Cache Duplicado

**Arquivos:**
- `.github/workflows/ci.yml` (linhas 36-45)
- `.github/workflows/deploy.yml` (linhas 49-58)

**Problema:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    cache: 'npm'  # ✅ Já faz cache

- name: Cache dependencies  # ❌ DUPLICADO!
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.npm
```

**Solução:**
Remover o step `Cache dependencies` - o `setup-node` já faz isso.

**Status:** [ ] Implementar  
**Prazo:** 1 hora  
**Responsável:** TBD

---

### 5. Correção - Validação Real de Testes no Auto-Approve

**Arquivo:** `.github/workflows/copilot-auto-approve.yml`

**Problema:**
```yaml
- name: Set tests passed
  id: check-status
  run: echo "tests-passed=true" >> $GITHUB_OUTPUT  # ❌ SEMPRE TRUE!
```

**Solução:**
```yaml
- name: Run tests
  id: run-tests
  run: |
    if npm test -- --run; then
      echo "tests-passed=true" >> $GITHUB_OUTPUT
    else
      echo "tests-passed=false" >> $GITHUB_OUTPUT
      exit 1
    fi
  continue-on-error: true

- name: Check lint
  id: check-lint
  run: |
    if npm run lint; then
      echo "lint-passed=true" >> $GITHUB_OUTPUT
    else
      echo "lint-passed=false" >> $GITHUB_OUTPUT
      exit 1
    fi
  continue-on-error: true

- name: Evaluate approval
  id: check-status
  run: |
    if [[ "${{ steps.run-tests.outputs.tests-passed }}" == "true" ]] && \
       [[ "${{ steps.check-lint.outputs.lint-passed }}" == "true" ]]; then
      echo "tests-passed=true" >> $GITHUB_OUTPUT
    else
      echo "tests-passed=false" >> $GITHUB_OUTPUT
      exit 1
    fi
```

**Status:** [ ] Implementar  
**Prazo:** 2 horas  
**Responsável:** TBD

---

### 6. Adicionar Dependabot para GitHub Actions

**Arquivo:** `.github/dependabot.yml` (criar se não existir)

**Solução:**
```yaml
version: 2
updates:
  # Atualizar dependências npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "npm"
    open-pull-requests-limit: 10

  # NOVO: Atualizar GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "github-actions"
    open-pull-requests-limit: 5
```

**Status:** [ ] Implementar  
**Prazo:** 15 minutos  
**Responsável:** TBD

---

### 7. Adicionar Timeouts Faltantes

**Arquivos:**
- `.github/workflows/code-quality.yml` - job `type-check`
- `.github/workflows/e2e.yml` - reduzir timeout de 60 para 30 min
- Outros jobs sem timeout explícito

**Solução:**
```yaml
jobs:
  type-check:
    timeout-minutes: 10  # ADICIONAR
    steps: ...

  e2e-tests:
    timeout-minutes: 30  # REDUZIR de 60
    steps: ...
```

**Status:** [ ] Implementar  
**Prazo:** 1 hora  
**Responsável:** TBD

---

### 8. Melhorar SARIF Generation

**Arquivos:**
- `.github/workflows/ci.yml` (linhas 160-180)
- `.github/workflows/code-quality.yml` (linhas 165-183)

**Problema:**
```yaml
run: |
  npm run lint:sarif || {
    echo '{"version":"2.1.0","runs":[]}' > eslint-results.sarif  # ❌ Mascara erros
  }
continue-on-error: true  # ❌ Permite falhas
```

**Solução:**
```yaml
- name: Run ESLint with SARIF output
  id: eslint
  run: npm run lint:sarif
  continue-on-error: true  # OK para não bloquear workflow

- name: Check if SARIF was generated
  run: |
    if [ ! -f "eslint-results.sarif" ]; then
      echo "❌ SARIF file was not generated - ESLint may have failed"
      echo "Check ESLint configuration and ensure it can output SARIF format"
      exit 1
    fi

- name: Upload SARIF file
  if: always() && hashFiles('eslint-results.sarif') != ''
  uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: eslint-results.sarif
    category: eslint
```

**Status:** [ ] Implementar  
**Prazo:** 2 horas  
**Responsável:** TBD

---

## 📊 Resumo de Impacto

| Correção | Tipo | Impacto | Esforço | Prioridade |
|----------|------|---------|---------|------------|
| 1. pull_request_target | Segurança | Alto | 2 dias | CRÍTICA |
| 2. Vazamento de secrets | Segurança | Alto | 1 dia | CRÍTICA |
| 3. Build compartilhado | Performance | Muito Alto | 3 dias | ALTA |
| 4. Cache duplicado | Performance | Médio | 1 hora | ALTA |
| 5. Validação de testes | Funcional | Médio | 2 horas | ALTA |
| 6. Dependabot Actions | Manutenção | Médio | 15 min | ALTA |
| 7. Timeouts | Estabilidade | Baixo | 1 hora | MÉDIA |
| 8. SARIF generation | Qualidade | Médio | 2 horas | MÉDIA |

**Total de Esforço:** ~6.5 dias úteis (52 horas)

---

## 🚀 Cronograma de Implementação

### Semana 1

#### Dia 1-2: Correções de Segurança Críticas
- [ ] Revisar e corrigir `pull_request_target` (2 dias)
- [ ] Implementar proteção de secrets em logs (4 horas)

#### Dia 3-4: Otimizações de Performance
- [ ] Implementar build compartilhado (2 dias)
- [ ] Remover cache duplicado (1 hora)
- [ ] Adicionar timeouts (1 hora)

#### Dia 5: Correções Funcionais e Finais
- [ ] Corrigir validação de testes (2 horas)
- [ ] Melhorar SARIF generation (2 horas)
- [ ] Adicionar dependabot para Actions (15 min)
- [ ] Code review e testes (4 horas)

---

## ✅ Critérios de Aceitação

### Segurança
- [ ] Nenhum workflow usa `pull_request_target` sem validação rigorosa
- [ ] Secrets não podem vazar em logs
- [ ] Score de segurança aumenta de 6.5/10 para 8.5/10

### Performance
- [ ] Tempo médio de CI reduz de ~8min para ~4min
- [ ] Uso de minutos Actions/mês reduz em 40%
- [ ] Cache hit rate aumenta para >80%

### Qualidade
- [ ] Todos os workflows têm timeout apropriado
- [ ] Auto-approve valida testes de verdade
- [ ] SARIF generation não mascara erros
- [ ] Dependabot mantém Actions atualizadas

---

## 🧪 Plano de Testes

### Testes de Segurança
1. Criar PR de fork e verificar que não tem acesso a secrets
2. Simular falha de deploy e verificar que secrets não aparecem em logs
3. Verificar que auto-approve só aprova quando testes passam

### Testes de Performance
1. Comparar tempo de CI antes e depois
2. Verificar que builds não são duplicados
3. Validar que cache funciona corretamente

### Testes de Regressão
1. Executar todos os workflows manualmente
2. Verificar que PRs ainda funcionam normalmente
3. Validar que deploy ainda funciona
4. Confirmar que security scans ainda rodam

---

## 📝 Checklist de Validação Final

Antes de considerar concluído:

- [ ] Todas as correções implementadas
- [ ] Testes executados e passando
- [ ] Documentação atualizada (README.md dos workflows)
- [ ] Code review aprovado
- [ ] Métricas coletadas (tempo de CI, cache hit rate, etc.)
- [ ] Equipe treinada nas mudanças
- [ ] Rollback plan documentado

---

## 🔄 Rollback Plan

Em caso de problemas após implementação:

1. **Reverter commits:** Usar `git revert` nos commits das mudanças
2. **Backup dos workflows:** Manter cópia dos workflows originais em branch `backup/workflows-pre-optimization`
3. **Comunicação:** Notificar equipe sobre rollback
4. **Análise:** Documentar o que deu errado para correção futura

---

## 📞 Contatos e Responsabilidades

| Responsabilidade | Responsável | Backup |
|------------------|-------------|---------|
| Implementação | TBD | TBD |
| Code Review | TBD | TBD |
| Testes | TBD | TBD |
| Documentação | TBD | TBD |
| Deploy | TBD | TBD |

---

**Documento criado por:** GitHub Copilot AI Agent  
**Data:** 23/11/2025  
**Versão:** 1.0  
**Próxima revisão:** Após implementação
