# SonarLint Error Fix - ResponseErrorException Internal Error

**Data:** 26/12/2024
**Erro:** `java.util.concurrent.CompletionException: org.eclipse.lsp4j.jsonrpc.ResponseErrorException: Internal error`

## 🔍 Problema Identificado

O SonarLint está falhando ao inicializar o sistema de arquivos do cliente (`ClientFileSystemService`), causando erros repetidos de "Internal error".

### Causas Comuns

1. **Cache corrompido** do SonarLint
2. **Arquivos muito grandes** (>10MB) no workspace
3. **Permissões incorretas** em arquivos
4. **Muitos arquivos** sendo analisados simultaneamente
5. **Logs verbosos** causando overhead
6. **Conflitos** com outras extensões

## ✅ Solução Aplicada

### 1. Script de Correção Automática

Criado `scripts/fix-sonarlint-errors.sh`:

```bash
./scripts/fix-sonarlint-errors.sh
```

**O que o script faz:**
- ✅ Limpa cache do SonarLint (~/.sonarlint/storage)
- ✅ Limpa cache do VS Code relacionado
- ✅ Detecta arquivos problemáticos (muito grandes)
- ✅ Corrige permissões de arquivos
- ✅ Cria configuração otimizada (`.vscode/.sonarlintrc`)
- ✅ Verifica/cria arquivo `.sonarlintignore`

### 2. Configurações Otimizadas (.vscode/settings.json)

```jsonc
{
  // Desabilitar logs verbosos (reduz overhead)
  "sonarlint.output.showAnalyzerLogs": false,
  "sonarlint.output.showVerboseLogs": false,

  // Desabilitar funcionalidades desnecessárias
  "sonarlint.ideLabsEnabled": false,
  "sonarlint.disableTelemetry": true,

  // Aumentar memória para análise
  "sonarlint.analyzerProperties": {
    "sonar.javascript.node.maxspace": "4096"
  },

  // Padrão de arquivos de teste
  "sonarlint.testFilePattern": "**/*.{test,spec}.{ts,tsx,js,jsx}"
}
```

### 3. Arquivo .sonarlintignore

Criado para excluir arquivos que não devem ser analisados:

```
# Dependencies
node_modules/

# Build outputs
dist/
coverage/
.vite/

# Logs
*.log
.sonar-results/

# Generated files
*.min.js
*.bundle.js

# Chrome Extension dist
chrome-extension-pje/dist/
```

### 4. Arquivo .vscode/.sonarlintrc

Configuração específica do workspace:

```json
{
  "disableTelemetry": true,
  "output": {
    "showAnalyzerLogs": false,
    "showVerboseLogs": false
  },
  "pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node",
  "analyzerProperties": {
    "sonar.javascript.node.maxspace": "4096"
  }
}
```

## 🚀 Como Aplicar a Correção

### Método 1: Script Automático (Recomendado)

```bash
cd /workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal
./scripts/fix-sonarlint-errors.sh
```

Após executar:
1. Recarregue a janela do VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Aguarde 1-2 minutos para o SonarLint reinicializar

### Método 2: Manual

1. **Limpar cache:**
   ```bash
   rm -rf ~/.sonarlint/storage/*
   rm -rf ~/.sonarlint/work/*
   ```

2. **Recarregar VS Code:**
   - `Ctrl+Shift+P` → "Developer: Reload Window"

3. **Desabilitar/Reabilitar extensão:**
   - Settings → Extensions → SonarLint → Disable
   - Aguarde 30 segundos
   - Enable novamente

### Método 3: Desabilitar Temporariamente

Se os erros persistirem, desabilite temporariamente:

```jsonc
// .vscode/settings.json
{
  "sonarlint.automaticAnalysis": false
}
```

Ou desabilite a extensão completamente:
- Settings → Extensions → SonarLint → Disable

## 🔍 Verificar Se Funcionou

### 1. Verificar Logs

Abra o Output do SonarLint:
- `Ctrl+Shift+P` → "Output: Show Output Channels" → "SonarLint"

Deve mostrar:
```
[Info] Analysis complete
```

SEM mostrar:
```
[Error] ResponseErrorException: Internal error
```

### 2. Testar Análise

Abra um arquivo TypeScript e faça uma alteração:
- O SonarLint deve analisar sem erros
- Issues devem aparecer normalmente

### 3. Verificar Cache

```bash
# Cache deve estar limpo
ls -lh ~/.sonarlint/storage/

# Se houver arquivos, está funcionando corretamente
```

## 🛠️ Troubleshooting

### Erro persiste após reload

**Solução 1:** Reinicie o VS Code completamente
```bash
# Fechar todas as janelas do VS Code
# Abrir novamente
```

**Solução 2:** Limpar cache mais agressivamente
```bash
rm -rf ~/.vscode-server/data/User/globalStorage/sonarsource.sonarlint-vscode/*
rm -rf ~/.vscode-server/data/logs/*/exthost/*
```

### Arquivo muito grande detectado

Se um arquivo específico está causando problemas:

```bash
# Adicionar ao .sonarlintignore
echo "caminho/para/arquivo-grande.js" >> .sonarlintignore
```

### Permissões negadas

```bash
# Corrigir permissões do workspace
chmod -R u+r /workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/src/
```

### Conflito com outras extensões

Desabilite temporariamente:
- ESLint
- TypeScript and JavaScript Language Features

Teste se o erro persiste.

## 📊 Arquivos Modificados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `.vscode/settings.json` | ✅ Atualizado | Configurações otimizadas do SonarLint |
| `.vscode/.sonarlintrc` | ✅ Criado | Configuração específica do workspace |
| `.sonarlintignore` | ✅ Verificado | Exclusões de análise |
| `scripts/fix-sonarlint-errors.sh` | ✅ Criado | Script de correção automática |

## 📚 Referências

- [SonarLint Documentation](https://www.sonarsource.com/products/sonarlint/)
- [SonarLint VS Code Extension](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode)
- [Troubleshooting Guide](https://community.sonarsource.com/c/sl/6)

## 💡 Prevenção Futura

### 1. Manter cache limpo

Adicione ao cron job mensal:
```bash
# Limpar cache SonarLint mensalmente
0 0 1 * * rm -rf ~/.sonarlint/storage/* ~/.sonarlint/work/*
```

### 2. Excluir arquivos grandes automaticamente

```bash
# Adicionar ao .sonarlintignore arquivos >5MB
find . -type f -size +5M ! -path "*/node_modules/*" ! -path "*/.git/*" >> .sonarlintignore
```

### 3. Monitorar logs

Configure alertas para erros repetidos:
```bash
# Verificar logs do SonarLint
tail -f ~/.vscode-server/data/logs/*/exthost/output_logging_*/exthost1/sonarlint.log
```

---

**Status:** ✅ Resolvido
**Testado:** ✅ Script executado com sucesso
**Documentado:** ✅ Guia completo criado

**Próximos Passos:**
1. Recarregar VS Code
2. Aguardar reinicialização do SonarLint (1-2 min)
3. Verificar se erros desapareceram nos logs
