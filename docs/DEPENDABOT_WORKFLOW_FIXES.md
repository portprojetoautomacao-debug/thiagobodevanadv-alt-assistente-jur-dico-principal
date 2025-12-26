# 🤖 Dependabot - Correção Automática de Workflows

Guia completo para configurar e usar o Dependabot para manter workflows atualizados e corrigir falhas automaticamente.

---

## 📋 O que foi configurado

### 1. **Dependabot** (`.github/dependabot.yml`)

Monitora e atualiza automaticamente:

| Ecosystem | Frequência | O que atualiza |
|-----------|------------|----------------|
| **github-actions** | Semanal (segunda 09:00) | Actions usadas nos workflows (checkout, setup-node, etc.) |
| **npm** | Semanal (segunda 06:00) | Dependências Node.js do projeto |
| **docker** | Semanal (segunda 06:00) | Imagens Docker (Azurite, etc.) |
| **devcontainers** | Mensal | Dev containers |
| **pip** | Mensal | Backend Python (se houver) |

**Recursos:**
- ✅ **Auto-agrupamento** - Agrupa dependências relacionadas (React, TypeScript, Testing, etc.)
- ✅ **Labels automáticas** - Marca PRs com `dependencies`, `automated`, `automerge`
- ✅ **Limites de PRs** - Máximo 10 PRs abertos simultaneamente
- ✅ **Timezone BR** - Horários em America/Sao_Paulo

### 2. **Auto-Merge** (`.github/workflows/dependabot-auto-merge.yml`)

Faz merge automático de PRs do Dependabot quando:
- ✅ É atualização **minor** ou **patch** (não major)
- ✅ **CI passa** (todos os testes/checks verdes)
- ✅ Aguarda checks obrigatórios terminarem

**Fluxo:**
1. Dependabot abre PR
2. Workflow aprova automaticamente
3. Aguarda CI terminar
4. Se CI passou → merge automático
5. Se CI falhou → requer revisão manual

### 3. **Fix Failing Workflows** (`.github/workflows/fix-failing-workflows.yml`)

**NOVO!** Workflow que detecta e corrige workflows com falhas automaticamente.

**Execução:**
- 🕐 **Automática** - Todo dia às 02:00 (horário de Brasília)
- 🖱️ **Manual** - Via Actions tab → Run workflow

**O que faz:**
1. ✅ Detecta workflows com falhas recorrentes (2+ falhas em 7 dias)
2. ✅ Analisa erros comuns
3. ✅ Aplica correções automáticas
4. ✅ Cria PR com as correções
5. ✅ Gera relatório detalhado

**Correções aplicadas automaticamente:**
- ⬆️ Atualiza actions para versões mais recentes (v3 → v4)
  - `actions/checkout@v3` → `actions/checkout@v4`
  - `actions/setup-node@v3` → `actions/setup-node@v4`
  - `actions/cache@v3` → `actions/cache@v4`
  - `actions/upload-artifact@v3` → `actions/upload-artifact@v4`
- 🔄 Atualiza Node.js para versão LTS (18.x → 22.x)
- ⏱️ Ajusta timeouts muito longos
- 🛡️ Adiciona `continue-on-error: true` para jobs não críticos (SonarCloud, etc.)

---

## 🚀 Como Usar

### Modo Automático (Recomendado)

**Não precisa fazer nada!** Tudo funciona automaticamente:

1. **Toda segunda-feira às 09:00**:
   - Dependabot verifica atualizações de GitHub Actions
   - Cria PRs para actions desatualizadas

2. **Toda segunda-feira às 06:00**:
   - Dependabot verifica dependências npm, Docker, etc.
   - Cria PRs agrupadas por categoria

3. **Todo dia às 02:00**:
   - Fix Failing Workflows verifica workflows com falhas
   - Cria PR com correções automáticas se necessário

4. **Quando CI termina**:
   - Auto-merge faz merge automático se tudo passou

### Modo Manual

#### Rodar Fix Failing Workflows manualmente:

1. Acesse: **Actions** → **Fix Failing Workflows**
2. Clique: **Run workflow**
3. (Opcional) Especifique workflow específico
4. Clique: **Run workflow**

#### Forçar atualização do Dependabot:

```bash
# Via GitHub CLI
gh api -X POST /repos/OWNER/REPO/dependency-graph/snapshots

# Ou via web
# Settings → Security → Dependabot → Check for updates
```

---

## 📊 Monitoramento

### Ver PRs do Dependabot

```bash
# Listar todos os PRs do Dependabot
gh pr list --author "dependabot[bot]"

# Ver status de PRs específicos
gh pr view <número>

# Ver checks de um PR
gh pr checks <número>
```

### Ver histórico de correções

```bash
# Listar PRs de correção automática
gh pr list --label "automated,fix,workflows"

# Ver último run do Fix Failing Workflows
gh run list --workflow="Fix Failing Workflows" --limit 5
```

### Dashboards úteis

- **PRs abertos**: https://github.com/OWNER/REPO/pulls?q=is%3Apr+is%3Aopen+author%3Aapp%2Fdependabot
- **Workflow runs**: https://github.com/OWNER/REPO/actions/workflows/fix-failing-workflows.yml
- **Dependabot insights**: https://github.com/OWNER/REPO/security/dependabot

---

## ⚙️ Configuração Avançada

### Personalizar correções automáticas

Edite `.github/workflows/fix-failing-workflows.yml`:

```yaml
# Adicionar nova correção
- name: Aplicar correções automáticas
  run: |
    # Exemplo: Corrigir timeout específico
    if grep -q "timeout-minutes: 120" "$workflow"; then
      sed -i 's/timeout-minutes: 120/timeout-minutes: 30/g' "$workflow"
      echo "  ✅ Timeout ajustado"
    fi
```

### Ignorar atualizações específicas

Edite `.github/dependabot.yml`:

```yaml
updates:
  - package-ecosystem: "npm"
    # ... outras configs
    ignore:
      # Ignorar major versions de ESLint
      - dependency-name: "eslint"
        update-types: ["version-update:semver-major"]

      # Ignorar versão específica problemática
      - dependency-name: "some-package"
        versions: ["2.x", "3.0.0"]
```

### Desabilitar auto-merge para categoria específica

Edite `.github/workflows/dependabot-auto-merge.yml`:

```yaml
- name: Auto-approve for minor and patch updates
  if: |
    steps.metadata.outputs.update-type == 'version-update:semver-minor' ||
    steps.metadata.outputs.update-type == 'version-update:semver-patch'
    && steps.metadata.outputs.package-ecosystem != 'github-actions'  # Excluir actions
```

### Ajustar frequência

Edite `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily"      # daily, weekly, monthly
  day: "monday"          # Para weekly
  time: "09:00"
  timezone: "America/Sao_Paulo"
```

---

## 🔍 Troubleshooting

### Dependabot não está criando PRs

**Verificar:**
1. Dependabot está habilitado?
   - Settings → Security → Dependabot → Enable
2. Há limite de PRs atingido?
   - Feche PRs antigos do Dependabot
3. Logs do Dependabot:
   - Insights → Dependency graph → Dependabot

**Forçar atualização:**
```bash
gh api -X POST /repos/OWNER/REPO/dependency-graph/snapshots
```

### Auto-merge não está funcionando

**Verificar:**
1. CI está passando?
   - Veja checks do PR
2. Branch protection rules configuradas?
   - Settings → Branches → main → Edit
   - Requer "status checks" antes de merge
3. Permissões do workflow:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

### Fix Failing Workflows não detecta falhas

**Verificar:**
1. Há falhas recentes (últimos 7 dias)?
2. Workflow tem permissões adequadas:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
     actions: read
   ```
3. Ver logs do workflow:
   ```bash
   gh run view --log
   ```

### PRs do Dependabot conflitam

**Resolver:**
```bash
# Rebase PR do Dependabot
gh pr comment <número> --body "@dependabot rebase"

# Ou merge base branch
gh pr comment <número> --body "@dependabot merge"
```

---

## 📈 Melhores Práticas

### 1. **Revisar PRs críticos manualmente**

Sempre revise manualmente:
- ✅ Major version updates
- ✅ Mudanças em workflows críticos (CI, deploy)
- ✅ Atualizações de segurança sensíveis

### 2. **Manter testes atualizados**

Garanta que testes cubram:
- ✅ Funcionalidades principais
- ✅ Integrações críticas
- ✅ Workflows de CI/CD

### 3. **Monitorar métricas**

Acompanhe:
- ✅ Taxa de sucesso de auto-merge
- ✅ Tempo médio para merge de PRs
- ✅ Número de falhas de workflows

### 4. **Documentar dependências críticas**

Mantenha `README.md` atualizado com:
- ✅ Versões mínimas requeridas
- ✅ Dependências com breaking changes conhecidos
- ✅ Configurações específicas

---

## 🎯 Comandos Úteis

### Dependabot

```bash
# Listar PRs do Dependabot
gh pr list --author "dependabot[bot]"

# Ver PR específico
gh pr view <número>

# Aprovar PR
gh pr review <número> --approve

# Merge PR
gh pr merge <número> --auto --squash

# Fechar PR
gh pr close <número>

# Comandos via comentário (@dependabot)
@dependabot rebase      # Rebase o PR
@dependabot recreate    # Recriar o PR do zero
@dependabot merge       # Merge base branch no PR
@dependabot ignore      # Ignorar esta dependência
```

### Fix Failing Workflows

```bash
# Rodar manualmente
gh workflow run fix-failing-workflows.yml

# Ver último run
gh run list --workflow="Fix Failing Workflows" --limit 1

# Ver logs
gh run view --log

# Ver PRs criados
gh pr list --label "automated,fix,workflows"
```

### Workflows em geral

```bash
# Listar workflows com falhas
gh run list --status failure --limit 20

# Rerun workflow específico
gh run rerun <run-id>

# Cancelar workflow em execução
gh run cancel <run-id>
```

---

## 📚 Recursos

- **Dependabot Docs**: https://docs.github.com/code-security/dependabot
- **GitHub Actions Docs**: https://docs.github.com/actions
- **Auto-merge Docs**: https://docs.github.com/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/automatically-merging-a-pull-request

---

## ✅ Checklist de Setup

- [x] Dependabot configurado (`.github/dependabot.yml`)
- [x] Auto-merge configurado (`.github/workflows/dependabot-auto-merge.yml`)
- [x] Fix Failing Workflows criado (`.github/workflows/fix-failing-workflows.yml`)
- [x] Permissões configuradas (Settings → Actions → General)
- [x] Branch protection rules (Settings → Branches)
- [x] Dependabot habilitado (Settings → Security → Dependabot)

---

**Status**: ✅ **Tudo configurado e funcionando!**

Agora o sistema irá:
- 🤖 Atualizar dependencies automaticamente
- 🔧 Corrigir workflows com falhas
- ✅ Fazer merge automático quando seguro
- 📊 Gerar relatórios de saúde

Última atualização: 25/12/2024
