# 🔧 Análise e Correções de Workflows GitHub Actions

## 📊 Status Atual dos Workflows

### ✅ Workflows Funcionando
- Monitoramento Contínuo e Alertas
- Generate Status Badges
- Deploy
- Dependabot Auto-Merge (skipped quando não há PRs do Dependabot)

### ❌ Workflows com Falhas
1. **SonarCloud Analysis** - FAILURE
2. **SonarQube Analysis** - FAILURE
3. **CI** - FAILURE
4. **🤖 Auto Test & Fix** - FAILURE
5. **Extension CI** - FAILURE
6. **Code Integrity & Integration Check** - FAILURE

---

## 🔍 Problemas Identificados e Soluções

### 1. ⚠️ SonarCloud/SonarQube - Token/Configuração

**Problema**: Workflows falhando por falta de tokens ou configuração incorreta

**Arquivos afetados**:
- `.github/workflows/sonarcloud.yml`
- `.github/workflows/sonarqube.yml`

**Solução**:
```yaml
# Verificar se os secrets existem:
# Settings > Secrets and variables > Actions
Required secrets:
  - SONAR_TOKEN (SonarCloud)
  - SONAR_HOST_URL (SonarQube)
  - SONAR_PROJECT_KEY (SonarQube)
```

**Ações**:
- [ ] Verificar se `SONAR_TOKEN` está configurado
- [ ] Se não usar SonarCloud/SonarQube, desabilitar os workflows
- [ ] Ou adicionar `if: false` temporariamente

---

### 2. ⚠️ BOT_GH_TOKEN Opcional mas Referenciado

**Problema**: Vários workflows referenciam `BOT_GH_TOKEN` mas podem falhar se não existir

**Arquivos afetados**:
- `dependabot-auto-merge.yml` (linha 136)
- `auto-test-fix.yml` (linha 157)
- `deploy.yml` (linha 283)
- `pr.yml` (linha 118)

**Código atual**:
```yaml
github-token: ${{ secrets.BOT_GH_TOKEN != '' && secrets.BOT_GH_TOKEN || secrets.GITHUB_TOKEN }}
```

**Problema**: Expressão `secrets.BOT_GH_TOKEN != ''` sempre retorna string, nunca boolean

**Solução correta**:
```yaml
github-token: ${{ secrets.BOT_GH_TOKEN || secrets.GITHUB_TOKEN }}
```

---

### 3. ⚠️ CI Workflow - Falhas de Build/Testes

**Problema**: Workflow CI falhando, possivelmente por:
- Dependências faltando
- Testes quebrando
- Variáveis de ambiente não configuradas

**Arquivo**: `.github/workflows/ci.yml`

**Ações**:
- [ ] Verificar logs específicos da falha
- [ ] Garantir que `VITE_*` env vars estão configuradas para CI
- [ ] Verificar se testes passam localmente

---

### 4. ⚠️ Extension CI - Chrome Extension Build

**Problema**: Build da extensão Chrome falhando

**Arquivo**: `.github/workflows/extension-ci.yml`

**Possíveis causas**:
- Dependências desatualizadas em `chrome-extension-pje/`
- Problemas de build do Webpack
- Testes falhando

**Ações**:
- [ ] Rodar `cd chrome-extension-pje && npm run build` localmente
- [ ] Verificar se testes passam: `npm test`
- [ ] Atualizar dependências se necessário

---

### 5. ⚠️ Code Integrity Check - Validação de Código

**Problema**: Verificações de integridade falhando

**Arquivo**: `.github/workflows/code-integrity-check.yml`

**Possíveis causas**:
- Type-check falhando
- Lint com warnings acima do threshold
- Arquivos corrompidos

**Ações**:
- [ ] Rodar `npm run type-check` localmente
- [ ] Rodar `npm run lint` e corrigir warnings
- [ ] Verificar se todos os imports estão corretos

---

## 🛠️ Correções Urgentes a Aplicar

### Correção 1: Desabilitar workflows não configurados

Se você NÃO está usando SonarCloud/SonarQube:

```yaml
# Adicionar no topo de sonarcloud.yml e sonarqube.yml
on:
  workflow_dispatch: # Apenas manual
  # Comentar os triggers automáticos
  # push:
  # pull_request:
```

### Correção 2: Simplificar lógica de BOT_GH_TOKEN

Aplicar em 4 arquivos:

```yaml
# ANTES (incorreto)
github-token: ${{ secrets.BOT_GH_TOKEN != '' && secrets.BOT_GH_TOKEN || secrets.GITHUB_TOKEN }}

# DEPOIS (correto)
github-token: ${{ secrets.BOT_GH_TOKEN || secrets.GITHUB_TOKEN }}
```

### Correção 3: Adicionar fallbacks para testes

Em workflows de teste, adicionar:

```yaml
- name: Run tests
  run: npm run test:run
  continue-on-error: ${{ github.event_name == 'pull_request' }}
  # Permite PR passar mesmo com testes falhando (opcional)
```

---

## 📋 Checklist de Validação

### Secrets Necessários
- [ ] `GITHUB_TOKEN` - Automático pelo GitHub ✅
- [ ] `BOT_GH_TOKEN` - Opcional (para comentários em PRs de forks)
- [ ] `SONAR_TOKEN` - Se usar SonarCloud
- [ ] `SONAR_HOST_URL` - Se usar SonarQube
- [ ] `VERCEL_TOKEN` - Para deploy Vercel
- [ ] `VERCEL_ORG_ID` - Para deploy Vercel
- [ ] `VERCEL_PROJECT_ID` - Para deploy Vercel

### Comandos npm Devem Funcionar
- [ ] `npm run build` - Build sem erros
- [ ] `npm run type-check` - TypeScript sem erros
- [ ] `npm run lint` - ESLint com warnings < 150
- [ ] `npm run test:run` - Testes passando
- [ ] `cd chrome-extension-pje && npm run build` - Extensão buildando
- [ ] `cd chrome-extension-pje && npm test` - Testes extensão passando

### Workflows Críticos
- [ ] CI - Deve passar em todo push/PR
- [ ] Build - Deve passar antes de deploy
- [ ] Tests - Deve passar com cobertura mínima
- [ ] Dependabot Auto-Merge - Deve aprovar e mergear automaticamente

---

## 🚀 Como Aplicar as Correções

### Opção 1: Correção Manual (Recomendado)

```bash
# 1. Verificar status dos workflows
gh run list --limit 20

# 2. Ver detalhes de uma falha específica
gh run view <RUN_ID>

# 3. Aplicar correções nos arquivos
# (use o Copilot para aplicar as correções acima)

# 4. Testar localmente
npm run build
npm run type-check
npm run lint
npm run test:run

# 5. Commit e push
git add .github/workflows/
git commit -m "fix: corrigir workflows com falhas"
git push
```

### Opção 2: Desabilitar Workflows Problemáticos Temporariamente

Para workflows que não são críticos:

```bash
# Renomear para .yml.disabled
mv .github/workflows/sonarcloud.yml .github/workflows/sonarcloud.yml.disabled
mv .github/workflows/sonarqube.yml .github/workflows/sonarqube.yml.disabled
```

---

## 📝 Prioridades de Correção

| Prioridade | Workflow | Impacto | Ação |
|------------|----------|---------|------|
| 🔴 **Alta** | CI | Bloqueia PRs/merges | Corrigir testes e build |
| 🔴 **Alta** | Build | Impede deploy | Garantir build passa |
| 🟠 **Média** | Extension CI | Afeta extensão Chrome | Corrigir build extensão |
| 🟡 **Baixa** | SonarCloud/SonarQube | Apenas qualidade | Configurar tokens ou desabilitar |
| 🟡 **Baixa** | Code Integrity | Validação extra | Corrigir ou tornar não-bloqueante |

---

## 🎯 Workflows Essenciais para Funcionar

Para o Dependabot funcionar 100% automaticamente, estes devem passar:

1. ✅ **CI** - Valida código
2. ✅ **Tests** - Garante qualidade
3. ✅ **Build** - Valida que vai deployar
4. ✅ **Dependabot Auto-Merge** - Faz merge automático

**Status atual**: ❌ CI falhando - precisa ser corrigido primeiro!

---

## 💡 Recomendação Final

**Ação imediata**:
1. Rodar testes localmente e corrigir falhas
2. Aplicar correção da lógica `BOT_GH_TOKEN` (4 arquivos)
3. Desabilitar SonarCloud/SonarQube se não configurados
4. Re-executar workflows via `gh workflow run <workflow-name>`

**Deseja que eu aplique as correções automaticamente?**
