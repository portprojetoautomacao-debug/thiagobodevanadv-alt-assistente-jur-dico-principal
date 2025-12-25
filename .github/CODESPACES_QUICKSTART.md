# ⚡ Início Rápido - GitHub Codespaces + Copilot

**Tempo estimado: 5 minutos** ⏱️

Configure o GitHub Codespaces para trabalhar com **Copilot com máxima autonomia** em 3 passos simples.

---

## 🎯 Passo 1: Criar Personal Access Token (PAT)

### Por que preciso disso?
Para que o Copilot possa criar branches, PRs e fazer commits automaticamente.

### Como fazer:

1. **Acesse**: https://github.com/settings/tokens/new

2. **Preencha**:
   - **Note**: `Copilot Codespaces - Assistente Jurídico`
   - **Expiration**: `90 days` (ou `No expiration`)
   
3. **Selecione scopes** (marque os checkboxes):
   ```
   ☑ repo (Full control of private repositories)
   ☑ workflow (Update GitHub Action workflows)
   ☑ write:packages (Upload packages)
   ☑ read:org (Read org and team membership)
   ☑ gist (Create gists)
   ```

4. **Clique**: `Generate token`

5. **COPIE O TOKEN** (você só verá uma vez!)
   - Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Guarde em local seguro!** 🔐

---

## 🔑 Passo 2: Adicionar Token aos Codespaces Secrets

### Opção A: Via GitHub CLI (Recomendado)

```bash
# Instalar GitHub CLI (se não tiver)
# macOS/Linux
brew install gh

# Windows
winget install GitHub.cli

# Autenticar
gh auth login

# Adicionar secret
gh secret set GITHUB_TOKEN --user
# Cole o token quando solicitado
```

### Opção B: Via Web UI

1. **Acesse**: https://github.com/settings/codespaces

2. **Vá em**: `Codespaces secrets`

3. **Clique**: `New secret`

4. **Preencha**:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Cole o token (`ghp_xxx...`)
   - **Repository access**: `Selected repositories` → Selecione `assistente-juridico-p`

5. **Clique**: `Add secret`

---

## 🚀 Passo 3: Criar e Usar o Codespace

### Criar Codespace

**Opção 1: Via Web UI (Mais fácil)**

1. Acesse: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
2. Clique no botão verde **"Code"**
3. Vá na aba **"Codespaces"**
4. Clique em **"Create codespace on main"**
5. ☕ Aguarde 2-3 minutos (primeira vez)

**Opção 2: Via GitHub CLI**

```bash
# Criar codespace
gh codespace create --repo portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal

# Abrir no VS Code Desktop
gh codespace code

# Ou abrir no browser
gh codespace code --web
```

**Opção 3: Botão README (Um clique!)**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/codespaces/new)

### Verificar Configuração

Quando o Codespace abrir, execute:

```bash
./test-codespaces-config.sh
```

**Resultado esperado:**
```
=========================================
🎉 TUDO CONFIGURADO CORRETAMENTE!
=========================================

✅ GitHub Copilot pode trabalhar com MÁXIMA AUTONOMIA!
```

---

## 🧪 Testar o Copilot

### Teste 1: Edição Automática

Abra o **Copilot Chat** (Ctrl+Shift+I ou Cmd+Shift+I) e digite:

```
Crie um arquivo teste-copilot.md com uma lista de 5 benefícios do Codespaces
```

**Resultado esperado:**
- ✅ Arquivo criado **sem confirmação**
- ✅ Conteúdo escrito automaticamente
- ✅ Arquivo salvo e aparece no Git

### Teste 2: Terminal Automático

No **Copilot Chat**, digite:

```
Execute npm run lint --silent e me mostre o resultado
```

**Resultado esperado:**
- ✅ Comando executado **sem confirmação**
- ✅ Output mostrado no chat
- ✅ Exit code informado

### Teste 3: Coding Agent

No **Copilot Chat**, digite:

```
@workspace Encontre todos os arquivos com comentários TODO e crie uma issue para cada um
```

**Resultado esperado:**
- ✅ Copilot busca arquivos
- ✅ Lista TODOs encontrados
- ✅ Oferece para criar issues automaticamente

---

## ✅ Pronto!

Agora você tem um **ambiente completo** onde o GitHub Copilot pode:

- ✅ **Editar arquivos** sem pedir permissão
- ✅ **Executar comandos** no terminal automaticamente
- ✅ **Criar branches e PRs** via Coding Agent
- ✅ **Formatar e corrigir** código automaticamente
- ✅ **Rodar testes e builds** quando necessário

---

## 📚 Próximos Passos

### Para Trabalho Diário

```bash
# Abrir Codespace existente
gh codespace code

# Listar todos os Codespaces
gh codespace list

# Parar Codespace (economizar horas)
gh codespace stop -c CODESPACE_NAME

# Deletar Codespace
gh codespace delete -c CODESPACE_NAME
```

### Dicas de Uso

1. **Auto-save está ativo**: Não precisa Ctrl+S, salva automaticamente
2. **Tasks automáticas rodando**: Dev server, testes, linting já estão ativos
3. **Terminal integrado**: Use o terminal do VS Code para melhor integração
4. **Git smart commit**: Stage automático ao fazer commit

### Recursos Avançados

- 📖 **Guia completo**: [CODESPACES_SETUP.md](.github/CODESPACES_SETUP.md)
- 🐛 **Troubleshooting**: [CODESPACES_SETUP.md#troubleshooting](.github/CODESPACES_SETUP.md#troubleshooting)
- 🤖 **Instruções Copilot**: [copilot-instructions.md](.github/copilot-instructions.md)

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

**❌ Token inválido**
```bash
# Verificar se token está definido
gh auth status

# Re-autenticar
gh auth login
```

**❌ Copilot não sugere código**
```
1. Command Palette (Ctrl+Shift+P)
2. Digite: "Developer: Reload Window"
3. Teste novamente
```

**❌ Tasks não rodando**
```bash
# Rodar manualmente
npm run dev &
npm run test &
```

### Documentação Oficial

- [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Copilot Coding Agent](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-coding-agent)

---

**🎉 Aproveite o poder da automação!** 🚀
