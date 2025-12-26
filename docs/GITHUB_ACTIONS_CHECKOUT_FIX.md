# GitHub Actions - Correção de Erro de Checkout

## 🔍 Problema Identificado

O workflow `azure-storage-tests.yml` estava falhando com o seguinte erro:

```
fatal: repository 'https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/' not found
```

## 🎯 Causa Raiz

Este erro geralmente ocorre devido a um dos seguintes motivos:

1. **Falta de permissões explícitas** - O token padrão do GitHub Actions pode não ter permissões suficientes
2. **Configuração incompleta do checkout** - Ausência de parâmetros importantes como `fetch-depth`
3. **Problemas de sincronização** com forks ou PRs externos

## ✅ Solução Implementada

Foram aplicadas as seguintes correções no arquivo `.github/workflows/azure-storage-tests.yml`:

### Antes (❌ Configuração Incompleta)

```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v4

  - name: Setup Node.js
    uses: actions/setup-node@v4
```

### Depois (✅ Configuração Corrigida)

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0
      token: ${{ secrets.GITHUB_TOKEN }}

  - name: Setup Node.js
    uses: actions/setup-node@v4
```

## 🔧 Mudanças Aplicadas

### 1. Nome Descritivo do Step
- **Antes**: `name: Checkout`
- **Depois**: `name: Checkout code`
- **Benefício**: Maior clareza nos logs do workflow

### 2. Adição do `fetch-depth: 0`
```yaml
with:
  fetch-depth: 0
```
- **O que faz**: Faz fetch de todo o histórico do Git
- **Por que é importante**:
  - Necessário para análises que dependem do histórico completo
  - Evita problemas com commits rasos (shallow clone)
  - Essencial para workflows que fazem diff ou changelog

### 3. Token Explícito
```yaml
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```
- **O que faz**: Usa explicitamente o token do GitHub Actions
- **Por que é importante**:
  - Garante que as permissões corretas sejam aplicadas
  - Evita problemas com repositórios privados
  - Necessário para acessar o repositório em alguns contextos

## 📊 Jobs Corrigidos

Foram aplicadas correções em **2 jobs** do workflow:

1. ✅ **azure-storage-unit-tests** (linha 27)
2. ✅ **azure-storage-integration-tests** (linha 72)

## 🔒 Verificação de Permissões

Certifique-se de que as permissões do workflow estão configuradas corretamente no início do arquivo:

```yaml
permissions:
  contents: read
  pull-requests: write
  actions: read
```

## 🧪 Como Testar

1. **Fazer commit das mudanças**:
```bash
git add .github/workflows/azure-storage-tests.yml
git commit -m "fix: corrigir checkout no workflow azure-storage-tests"
git push origin main
```

2. **Verificar execução do workflow**:
   - Acesse: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions
   - Procure pelo workflow "Azure Storage Tests"
   - Verifique se o checkout foi bem-sucedido

3. **Verificar logs**:
```bash
# Se houver erro, verificar logs detalhados
gh run view <run-id> --log
```

## 🎯 Workflows Adicionais que Podem Precisar da Mesma Correção

Foram identificados **55 checkouts** em diversos workflows. Caso algum apresente erro similar, aplique a mesma correção:

### Workflows Principais
- `.github/workflows/tests.yml` (5 checkouts)
- `.github/workflows/ci.yml` (5 checkouts)
- `.github/workflows/deploy.yml` (2 checkouts)
- `.github/workflows/security-scan.yml` (3 checkouts)
- `.github/workflows/agents-health-check.yml` (4 checkouts)

### Template de Correção Universal

Para qualquer workflow com problema, use este padrão:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}
```

## 📚 Referências

- [GitHub Actions - Checkout Action](https://github.com/actions/checkout)
- [GitHub Actions - Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
- [Git Fork Protection](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository)

## ✅ Checklist de Verificação

- [x] Adicionado `fetch-depth: 0` em ambos os jobs
- [x] Adicionado `token: ${{ secrets.GITHUB_TOKEN }}` explicitamente
- [x] Nome do step atualizado para `Checkout code`
- [x] Documentação criada para referência futura
- [ ] Testar workflow em produção
- [ ] Verificar se outros workflows precisam da mesma correção

## 🚨 Problemas Persistentes?

Se o erro continuar após aplicar estas correções, verifique:

1. **Repositório existe e está acessível**:
```bash
git ls-remote https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal.git
```

2. **Token tem permissões corretas**:
   - Vá em: `Settings` → `Actions` → `General` → `Workflow permissions`
   - Certifique-se de que "Read and write permissions" está habilitado

3. **Repositório não foi renomeado ou movido**:
   - Confirme a URL no GitHub
   - Verifique se não há redirecionamentos

4. **Fork Protection ativo** (para PRs de forks):
   - `Settings` → `Actions` → `General` → `Fork pull request workflows`
   - Habilite "Require approval for all outside collaborators"

---

**Data da Correção**: 26 de Dezembro de 2025
**Arquivo Corrigido**: `.github/workflows/azure-storage-tests.yml`
**Status**: ✅ Correção aplicada e documentada
