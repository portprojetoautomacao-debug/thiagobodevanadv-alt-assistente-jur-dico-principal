# 🔧 Solução: SonarLint Command Not Found

## 🎯 Problema

```
Erro ao executar o comando SonarLint.ConnectToSonarCloud: 
command 'SonarLint.ConnectToSonarCloud' not found.
```

## ✅ Solução: Use a Interface Visual!

**O comando não existe!** A configuração correta é através da **interface visual CONNECTED MODE**.

Veja o guia completo: **`SONARQUBE_INTERFACE_VISUAL.md`**

## 🚀 Passos Rápidos

### 1️⃣ Abrir Interface CONNECTED MODE

**Opção A**: Clique no ícone **SonarQube** na Activity Bar (barra lateral esquerda)

**Opção B**: `Ctrl+Shift+P` → `SonarLint: Focus on SonarQube Setup View`

### 2️⃣ Adicionar Conexão

1. Clique em **"Add SonarQube Cloud Connection"**
2. Preencha:
   - **Organization**: `thiagobodevan-a11y-assistente-juridico-p`
   - **Token**: Seu token do SonarCloud
   - **Name**: `SonarCloud` (opcional)
3. Clique em **"Save Connection"**

### 3️⃣ Bind Projeto

1. Clique em **"Bind Project"**
2. Selecione: `portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal`
3. Confirme

**Pronto!** Veja o status na barra inferior do VS Code.

Em vez de usar o comando, configure diretamente no arquivo de configuração:

#### Passo 1: Gerar Token

1. Acesse: https://sonarcloud.io/account/security
2. Gere um **User Token** chamado `vscode-assistente-juridico`
3. **Copie o token**

#### Passo 2: Configurar Token

**Opção A: Via Settings UI**

1. `Ctrl+Shift+P` → `Preferences: Open Settings (UI)`
2. Busque: `sonarlint connected`
3. Clique em **"Edit in settings.json"**
4. Adicione:

```json
{
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p",
      "token": "seu_token_aqui"
    }
  ],
  "sonarlint.connectedMode.project": {
    "projectKey": "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal",
    "connectionId": "thiagobodevan-a11y-assistente-juridico-p"
  }
}
```

**Opção B: Via .env (Mais Seguro)**

1. Crie/edite o arquivo `.env`:
   ```bash
   echo "SONARQUBE_TOKEN=seu_token_aqui" >> .env
   ```

2. As configurações já estão apontando para `${env:SONARQUBE_TOKEN}`

#### Passo 3: Verificar Conexão

1. **Abra a paleta de comandos**: `Ctrl+Shift+P`
2. **Digite**: `SonarLint`
3. **Veja os comandos disponíveis**:
   - `SonarLint: Analyze Current File`
   - `SonarLint: Show All Locations`
   - `SonarLint: Update All Bindings`

### Solução 4: Reinstalar Extensão (Último Recurso)

Se nada funcionar:

```bash
# Desinstalar
code --uninstall-extension sonarsource.sonarlint-vscode

# Instalar novamente
code --install-extension sonarsource.sonarlint-vscode

# Recarregar
# Ctrl+Shift+P → Developer: Reload Window
```

## 🎯 Comandos SonarLint Disponíveis

Após recarregar o VS Code, estes comandos devem estar disponíveis:

| Comando | Descrição |
|---------|-----------|
| `SonarLint: Analyze Current File` | Analisa arquivo atual |
| `SonarLint: Show All Locations` | Mostra todas as localizações de issues |
| `SonarLint: Show Rule Description` | Exibe descrição da regra |
| `SonarLint: Update All Bindings` | Atualiza binding com SonarCloud |
| `SonarLint: Clear Diagnostics` | Limpa diagnósticos |
| `SonarLint: Show SonarLint Output` | Exibe log da extensão |
| `SonarLint: Connect to SonarQube or SonarCloud` | Conectar (pode ter nome diferente) |

## 🔍 Verificação Rápida

### 1. Verificar se extensão está ativa

```bash
code --list-extensions | grep sonarlint
```

**Saída esperada:**
```
sonarsource.sonarlint-vscode
```

### 2. Verificar configuração

```bash
cat .vscode/settings.json | grep -A 10 sonarlint
```

### 3. Testar análise

1. Abra qualquer arquivo `.ts` ou `.tsx`
2. Pressione `Ctrl+Shift+P`
3. Digite: `SonarLint: Analyze Current File`
4. Veja os resultados no painel **Problems** (`Ctrl+Shift+M`)

## ⚡ Atalho Rápido: Análise Automática

Você **não precisa** executar o comando manualmente! A análise automática já está configurada:

```json
{
  "sonarlint.analyser.automaticAnalysis.enabled": true,
  "sonarlint.analyser.analyzeOnSave.enabled": true,
  "sonarlint.analyser.analyzeOnCommit.enabled": true
}
```

**Como usar:**

1. **Abra um arquivo** `.ts` ou `.tsx`
2. **Faça uma modificação**
3. **Salve** (`Ctrl+S`)
4. **Veja os issues** automaticamente no painel **Problems**

## 🌐 Alternativa: Usar SonarCloud Web

Se a extensão não funcionar imediatamente, você pode usar o SonarCloud web:

1. Acesse: https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
2. Faça login
3. Veja análises após cada push no GitHub

## 📊 Verificar se está funcionando

### Teste Simples

1. **Crie um arquivo de teste**: `test-sonar.ts`

```typescript
// Este código tem problemas que o SonarLint deve detectar
function teste() {
  var x = 10; // SonarLint deve sugerir 'const' ou 'let'
  console.log(x); // console.log em código de produção
  return x;
}

const resultado = teste();
console.log(resultado); // Variável não usada
```

2. **Salve o arquivo** (`Ctrl+S`)
3. **Veja o painel Problems** (`Ctrl+Shift+M`)
4. **Deve aparecer** warnings do SonarLint (ícone SonarLint ao lado)

### Resultado Esperado

```
⚠️ Replace "var" with "const" or "let". (typescript:S3504)
⚠️ Remove this commented out code. (typescript:S125)
💡 'resultado' is declared but its value is never read. (typescript:S1481)
```

## 🎯 Próximos Passos

1. ✅ **Recarregar VS Code** (`Ctrl+Shift+P` → `Reload Window`)
2. ✅ **Aguardar** SonarLint inicializar (veja status bar)
3. ✅ **Configurar token** no `.env` (se ainda não fez)
4. ✅ **Testar análise** com arquivo de teste
5. ✅ **Verificar painel Problems** para ver issues

## 📚 Documentação

- **SonarLint VS Code**: https://www.sonarsource.com/products/sonarlint/features/visual-studio-code/
- **Connected Mode**: https://docs.sonarsource.com/sonarlint/vs-code/team-features/connected-mode/
- **SonarCloud**: https://sonarcloud.io/

---

**Atualizado em**: 06/12/2024  
**SonarLint Version**: v4.35.1  
**Status**: Extensão instalada, recarregamento necessário
