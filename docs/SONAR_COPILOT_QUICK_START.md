# ⚡ Sonar Copilot Assistant - Quick Start

## 🚀 Setup em 5 Minutos

### 1️⃣ Instalar Extensão (1 min)

```bash
# No VS Code:
Ctrl+Shift+X → Pesquisar "Sonar Copilot Assistant" → Install
```

### 2️⃣ Gerar Tokens (3 min)

#### SonarCloud Token:
1. Acesse: https://sonarcloud.io/account/security
2. Clique em **Generate Token**
3. Nome: `sonar-copilot-vscode`
4. Copie o token: `31097bf9cd97f8ea63eb4573d33816b8f8a1d455` (exemplo)

#### GitHub PAT:
1. Acesse: https://github.com/settings/tokens/new
2. Scopes: ✅ `repo`, ✅ `user`
3. Clique em **Generate token**
4. Copie o token: `ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 3️⃣ Configurar User Settings (1 min)

```bash
# Abra User Settings (JSON):
Ctrl+Shift+P → "Preferences: Open User Settings (JSON)"

# Cole no final do arquivo:
{
  "sonarCopilot.authentication.token": "SEU_TOKEN_SONARCLOUD",
  "sonarCopilot.github.personalAccessToken": "SEU_GITHUB_PAT"
}
```

### 4️⃣ Testar Conexão (30s)

```bash
1. Clique no ícone "Sonar Copilot" na Activity Bar
2. Clique em "Test Connection"
3. ✅ Deve mostrar: "Connection successful!"
```

---

## 📊 Primeiro Fix (2 min)

### Workflow Básico:

```bash
1. Abra o dashboard do Sonar Copilot (ícone na Activity Bar)
2. Clique em "Scan Issues" → aguarde 5-15s
3. Selecione um issue MAJOR ou CRITICAL
4. Clique em "Fix"
5. Revise o diff gerado pelo Copilot
6. Aceite ou rejeite
7. Testes rodam automaticamente
8. Commit é criado automaticamente
```

### Atalhos de Teclado:

| Atalho | Ação |
|--------|------|
| `Ctrl+Shift+P` → "Sonar Copilot" | Abrir dashboard |
| `Ctrl+Shift+P` → "Scan Issues" | Escanear issues |
| `F2` no issue | Fix rápido |

---

## 🎯 Filtros Úteis

### Por Severidade:
- 🔴 **Blocker** - Bugs críticos que impedem produção
- 🟠 **Critical** - Bugs sérios que afetam funcionalidade
- 🟡 **Major** - Problemas importantes de qualidade
- 🔵 **Minor** - Problemas menores de código
- ⚪ **Info** - Informações/sugestões

### Por Tipo:
- 🐛 **Bug** - Erros de código
- 🛡️ **Vulnerability** - Problemas de segurança
- 🧹 **Code Smell** - Problemas de design/manutenibilidade
- 🔒 **Security Hotspot** - Revisão de segurança necessária

---

## 🔧 Comandos Essenciais

### Scan & Fix:
```bash
# Scan completo
Ctrl+Shift+P → "Scan Issues"

# Fix único
Selecione issue → "Fix"

# Fix em lote (mesmo arquivo)
Filtre por arquivo → "Fix All"

# Fix em lote (mesma rule)
Filtre por rule → "Fix All"

# Fix customizado
Marque checkboxes → "Fix Selected"
```

### Git Automation:
```bash
# Branch automático: fix/sonar-{ruleKey}
# Commit automático: "fix: {ruleKey} - {message}"
# Push manual: git push origin <branch>
```

---

## ⚙️ Configurações Rápidas

### Arquivo: `.vscode/sonar-copilot-assistant.json`

```jsonc
{
  // 🎯 Fix direto (sem confirmação)
  "sonarCopilot.smartFix.confirmBeforeFix": false,

  // ✅ Commit automático
  "sonarCopilot.git.autoCommit": true,

  // ❌ PR manual (revisar antes)
  "sonarCopilot.git.autoCreatePR": false,

  // 🔴 Focar em issues críticos
  "sonarCopilot.issueFilters.defaultSeverities": ["BLOCKER", "CRITICAL", "MAJOR"]
}
```

---

## 🧪 Testes Automáticos

Após cada fix, roda automaticamente:

```bash
npm run test:run  # Testes unitários
```

Se falhar:
- ❌ Commit não é criado
- 🔍 Revise o erro
- 🔧 Ajuste o fix manualmente

---

## 🆘 Troubleshooting Rápido

### ❌ "Connection Failed"
```bash
# Verificar:
1. Token está em User Settings? (não workspace)
2. Token válido? (teste em https://sonarcloud.io)
3. Organization key correto?
```

### ❌ "No Issues Found"
```bash
# Forçar re-análise:
1. https://sonarcloud.io → Seu projeto
2. "Re-analyze"
3. Volte ao VS Code → "Refresh"
```

### ❌ "GitHub PR Failed"
```bash
# Verificar:
1. PAT tem scope 'repo'?
2. PAT não expirou?
3. Repository correto no settings.json?
```

---

## 📚 Links Úteis

- 📖 [Guia Completo](./SONAR_COPILOT_ASSISTANT_SETUP.md)
- 🔑 [SonarCloud Tokens](https://sonarcloud.io/account/security)
- 🐙 [GitHub PAT](https://github.com/settings/tokens)
- 📊 [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal)

---

## 🎯 Próximos Passos

1. ✅ **Setup completo** (já feito? 5 min)
2. ✅ **Primeiro fix** (2 min)
3. ✅ **Review PR** (1 min)
4. 🔄 **Repetir diariamente** (10 min/dia)

**Total:** 8 minutos para estar produtivo! 🚀

---

**Dúvidas?** Veja o [Guia Completo](./SONAR_COPILOT_ASSISTANT_SETUP.md) ou abra uma issue.
