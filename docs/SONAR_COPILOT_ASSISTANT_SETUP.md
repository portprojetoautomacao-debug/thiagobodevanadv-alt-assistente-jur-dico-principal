# 🚀 Sonar Copilot Assistant - Guia de Configuração

## 📋 Visão Geral

Este projeto está configurado para usar o **Sonar Copilot Assistant**, uma extensão VS Code que integra:

- ✅ **SonarQube/SonarCloud** - Análise de qualidade de código
- 🤖 **GitHub Copilot** - Assistente de IA para correções
- 🐙 **Git/GitHub** - Automação de branches, commits e PRs
- 🧪 **Vitest** - Validação automática de testes

---

## ⚙️ Instalação (5 minutos)

### 1️⃣ Instalar Extensão

```bash
# No VS Code:
1. Abra Extensions (Ctrl+Shift+X)
2. Pesquise "Sonar Copilot Assistant"
3. Clique em "Install"
4. Recarregue o VS Code
```

### 2️⃣ Configurar Tokens (User Settings)

**IMPORTANTE:** Tokens devem ficar em **User Settings**, NÃO no workspace!

```bash
# Abra User Settings (JSON):
Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"
```

Copie e cole o conteúdo de `.vscode/sonar-copilot-assistant.user.example.json` e substitua os tokens:

```jsonc
{
  // 🔑 SONARCLOUD TOKEN
  // Gere em: https://sonarcloud.io/account/security
  "sonarCopilot.authentication.token": "31097bf9cd97f8ea63eb4573d33816b8f8a1d455",

  // 🐙 GITHUB PERSONAL ACCESS TOKEN
  // Gere em: https://github.com/settings/tokens/new
  // Scopes: repo, user, write:packages
  "sonarCopilot.github.personalAccessToken": "ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```

### 3️⃣ Gerar Tokens

#### SonarCloud Token:
1. Acesse: https://sonarcloud.io/account/security
2. Nome: `sonar-copilot-assistant-vscode`
3. Type: `User Token`
4. Scopes: `Analyze`, `Execute Analysis`
5. Clique em **Generate**
6. Copie o token

#### GitHub Personal Access Token (PAT):
1. Acesse: https://github.com/settings/tokens/new
2. Nome: `sonar-copilot-assistant`
3. Expiration: `No expiration` ou `90 days`
4. Scopes necessários:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Read user profile data)
   - ✅ `write:packages` (opcional, para publicar pacotes)
5. Clique em **Generate token**
6. Copie o token (começa com `ghp_`)

### 4️⃣ Verificar Configuração

```bash
# No VS Code:
1. Clique no ícone "Sonar Copilot Assistant" na Activity Bar (lateral esquerda)
2. Clique em "Server Configuration"
3. Clique em "Test Connection"
4. ✅ Deve mostrar: "Connection successful!"
```

---

## 🛠️ Workflow Automatizado

### 📊 Dashboard de Issues

1. **Abra o Dashboard:**
   - Clique no ícone do Sonar Copilot na Activity Bar
   - OU: `Ctrl+Shift+P` → "Sonar Copilot Assistant"

2. **Scan Issues:**
   - Clique em "Scan Issues"
   - Aguarde análise (5-15 segundos)
   - Issues aparecem agrupados por severidade

3. **Filtros disponíveis:**
   - 🔴 Blocker
   - 🟠 Critical
   - 🟡 Major
   - 🔵 Minor
   - ⚪ Info

### 🔧 Fix Automático

#### Opção 1: Fix Single Issue
```bash
1. Selecione um issue no dashboard
2. Clique em "Fix"
3. Copilot gera contexto e aplica correção
4. Revise o diff
5. Aceite ou rejeite
```

#### Opção 2: Fix All (mesmo arquivo)
```bash
1. Filtre issues por arquivo
2. Clique em "Fix All"
3. Copilot processa todos os issues do arquivo
4. Revise as mudanças
```

#### Opção 3: Fix All (mesma rule)
```bash
1. Filtre issues por rule (ex: typescript:S1117)
2. Clique em "Fix All"
3. Copilot aplica padrão em todos os arquivos
4. Revise em lote
```

#### Opção 4: Custom Selection
```bash
1. Marque checkbox dos issues desejados
2. Clique em "Fix Selected"
3. Copilot processa seleção customizada
```

### ✅ Validação e Commit

Após aplicar fixes:

```bash
# 1. Testes rodam automaticamente
npm run test:run

# 2. Se passar, commit é criado:
git branch fix/sonar-S1117-remove-unused-vars
git commit -m "fix: S1117 - Remove unused variables

SonarQube Rule: typescript:S1117
Severity: MAJOR

Co-authored-by: Sonar Copilot Assistant <sonar@assistant.ai>"

# 3. Push manual (PR não é criado automaticamente)
git push origin fix/sonar-S1117-remove-unused-vars
```

### 📝 Criar Pull Request (Manual)

```bash
# No GitHub:
1. Vá para: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/pulls
2. Clique em "New Pull Request"
3. Selecione a branch fix/sonar-*
4. Título e descrição são preenchidos automaticamente
5. Revise e clique em "Create Pull Request"
```

---

## 🎯 Configurações Personalizadas

### Arquivos de Configuração

| Arquivo | Descrição | Commitar? |
|---------|-----------|-----------|
| `.vscode/sonar-copilot-assistant.json` | Configurações do workspace | ✅ Sim |
| User Settings (JSON) | Tokens sensíveis | ❌ Não |
| `.github/copilot-instructions.md` | Guidelines do Copilot | ✅ Sim |
| `.sonar-copilot/training/` | Padrões aprendidos | ✅ Sim |

### Ajustar Comportamento

#### 🚀 Modo Agressivo (Fix All automático)
```jsonc
// .vscode/sonar-copilot-assistant.json
{
  "sonarCopilot.smartFix": {
    "confirmBeforeFix": false, // ✅ Fix direto
    "autoCommit": true,        // ✅ Commit automático
    "autoCreatePR": true       // ✅ PR automático
  }
}
```

#### 🛡️ Modo Conservador (Revisão manual)
```jsonc
{
  "sonarCopilot.smartFix": {
    "confirmBeforeFix": true,  // ⏸️ Pedir confirmação
    "autoCommit": false,       // ⏸️ Commit manual
    "autoCreatePR": false      // ⏸️ PR manual
  }
}
```

#### 🎯 Focar em Issues Críticos
```jsonc
{
  "sonarCopilot.issueFilters": {
    "defaultSeverities": ["BLOCKER", "CRITICAL"], // Apenas críticos
    "focusOnNewCode": true // Apenas código novo
  }
}
```

---

## 📊 Comparação de Performance

### ⏱️ Antes (Processo Manual)

| Etapa | Tempo |
|-------|-------|
| Navegar SonarQube UI | 1 min |
| Analisar issue | 1-5 min |
| Abrir arquivo no IDE | 30s-1min |
| Explicar para Copilot | 1 min |
| Copilot gerar fix | 20s-5min |
| Revisar e aplicar | 10s-2min |
| Rodar testes | 5-7 min |
| Git branch/commit/PR | 3-5 min |
| **TOTAL** | **11min - 26min** |

### ⚡ Depois (Sonar Copilot Assistant)

| Etapa | Tempo |
|-------|-------|
| Abrir dashboard | 20s |
| Scan issues | 5-15s |
| Selecionar issue | 10-30s |
| One-click fix | 3-5s |
| Copilot gerar fix | 20s-5min |
| Revisar e aplicar | 10s-2min |
| Testes automáticos | 4-6 min |
| Auto Git operations | 1 min |
| **TOTAL** | **7min - 18min** |

### 🎯 Ganho de Eficiência

- **Melhor caso:** 39% mais rápido (11min → 7min)
- **Pior caso:** 29% mais rápido (26min → 18min)
- **Média:** 35% mais rápido

**Benefícios adicionais:**
- ✅ Zero context switching
- ✅ Padrões consistentes
- ✅ Documentação automática
- ✅ Validação de testes integrada

---

## 🧪 Testing Integration

### Configuração Atual

O projeto usa **Vitest** para testes. Comandos configurados:

```bash
# Testes unitários
npm run test:run        # Roda todos os testes uma vez

# Cobertura
npm run test:coverage   # Gera relatório de cobertura

# Todos os testes
npm run test:all        # Unitários + API + E2E
```

### Thresholds de Cobertura

```jsonc
{
  "sonarCopilot.testing": {
    "coverageThreshold": {
      "statements": 80,  // 80% de statements
      "branches": 75,    // 75% de branches
      "functions": 80,   // 80% de funções
      "lines": 80        // 80% de linhas
    },
    "failOnCoverageDrop": false // Modo manutenção: não bloquear
  }
}
```

### Execução Automática

Testes rodam automaticamente:
- ✅ Antes de commit
- ✅ Após aplicar fix
- ✅ Antes de criar PR (se habilitado)

---

## 🤖 AI Training & Learning

### Como Funciona

1. **Fix Aprovado:** Você aplica um fix sugerido
2. **Documentação:** Sistema salva o padrão em `.sonar-copilot/training/`
3. **Aprendizado:** Copilot usa esse padrão para issues similares
4. **Melhoria Contínua:** Cada fix aprovado melhora futuras sugestões

### Exemplo de Padrão Aprendido

```json
// .sonar-copilot/training/patterns/typescript-S1117.json
{
  "ruleKey": "typescript:S1117",
  "ruleName": "Variables should not be shadowed",
  "pattern": "rename-variable",
  "examples": [
    {
      "before": "function test(data) { const data = ...; }",
      "after": "function test(data) { const newData = ...; }",
      "approvedBy": "user",
      "approvedAt": "2025-12-05T20:00:00Z"
    }
  ]
}
```

---

## 🔧 Troubleshooting

### ❌ "Connection Failed"

```bash
# Verifique:
1. Token está em User Settings (não workspace)
2. Token tem scopes corretos
3. Organization key correto: thiagobodevan-a11y-assistente-juridico-p
4. Project key correto: portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
```

### ❌ "No Issues Found"

```bash
# Execute análise manual:
1. No SonarCloud: https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
2. Clique em "Re-analyze"
3. Aguarde análise completa
4. Volte ao VS Code e clique em "Refresh"
```

### ❌ "Tests Failed"

```bash
# Desabilite validação temporariamente:
{
  "sonarCopilot.testing": {
    "runBeforeCommit": false
  }
}
```

### ❌ "GitHub PR Failed"

```bash
# Verifique PAT:
1. Token tem scope 'repo'?
2. Token não expirou?
3. Repository correto: portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
```

---

## 📚 Recursos Adicionais

### Links Úteis

- 📖 [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal)
- 🔑 [SonarCloud Security Tokens](https://sonarcloud.io/account/security)
- 🐙 [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- 📋 [GitHub Repository](https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal)
- 🤖 [Copilot Instructions](/.github/copilot-instructions.md)

### Comandos VS Code

```bash
# Abrir dashboard
Ctrl+Shift+P → "Sonar Copilot Assistant"

# Scan issues
Ctrl+Shift+P → "Scan Issues"

# Configurar server
Ctrl+Shift+P → "Configure Server"

# Copilot Guidelines
Ctrl+Shift+P → "Copilot Guidelines"
```

---

## 🎓 Próximos Passos

1. ✅ **Instalar extensão** (5 min)
2. ✅ **Configurar tokens** (3 min)
3. ✅ **Test connection** (1 min)
4. ✅ **Primeiro scan** (30 seg)
5. ✅ **Aplicar primeiro fix** (2 min)
6. ✅ **Revisar PR gerado** (1 min)

**Total setup:** ~12 minutos

---

## 💡 Dicas de Uso

### 🏃 Quick Wins

1. **Issues críticos primeiro:** Filtre por `BLOCKER` e `CRITICAL`
2. **Same rule batch:** Fixe todos os issues da mesma rule de uma vez
3. **Auto-commit:** Deixe commits automáticos habilitados
4. **Review diário:** Reserve 10 minutos/dia para revisar issues novos

### 🚀 Maximizar Eficiência

1. **Guidelines atualizadas:** Mantenha `.github/copilot-instructions.md` sincronizado
2. **Training patterns:** Revise `.sonar-copilot/training/` periodicamente
3. **Batch fixes:** Use "Fix All" quando possível
4. **Test coverage:** Monitore cobertura para evitar regressões

### 🛡️ Modo Manutenção (Atual)

Como o projeto está em **Modo Manutenção:**

```jsonc
{
  "sonarCopilot.smartFix": {
    "confirmBeforeFix": false, // ✅ Fix direto (já validado)
    "generateTests": false,    // ❌ Não criar testes novos
    "autoCommit": true         // ✅ Commit automático
  }
}
```

---

**Configuração concluída! 🎉**

O Sonar Copilot Assistant está pronto para uso. Boa codificação! 🚀
