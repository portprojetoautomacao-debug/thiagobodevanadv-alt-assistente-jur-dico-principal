# 🎯 Configuração SonarLint - Método Oficial (Interface Visual)

> **Baseado na documentação oficial**: https://docs.sonarsource.com/sonarqube-for-vs-code/connect-your-ide/setup

## ⚠️ IMPORTANTE: Não Use Comandos!

O comando `SonarLint.ConnectToSonarCloud` **não existe** na versão atual do SonarLint.

A configuração correta é feita através da **interface visual CONNECTED MODE**.

---

## 📋 Passo a Passo Oficial

### 1️⃣ Gerar Token no SonarCloud

1. Acesse: **https://sonarcloud.io/account/security**
2. Faça login
3. Clique em **"Generate Tokens"** ou **"Generate Token"**
4. Preencha:
   - **Name**: `vscode-assistente-juridico`
   - **Type**: **User Token** (obrigatório!)
   - **Expires in**: 90 days ou No expiration
5. Clique em **"Generate"**
6. **COPIE O TOKEN** (você não poderá vê-lo novamente!)

---

### 2️⃣ Abrir Interface CONNECTED MODE

**Método 1: Via Activity Bar (Recomendado)**

1. Olhe para a **barra lateral esquerda** (Activity Bar)
2. Procure pelo ícone do **SonarQube** (pode estar no final)
3. Clique no ícone

**Método 2: Via Command Palette**

1. Pressione `Ctrl+Shift+P`
2. Digite: `SonarLint: Focus on SonarQube Setup View`
3. Pressione Enter

**Método 3: Via View Menu**

1. Menu: `View` → `Open View...`
2. Digite: `SonarQube Setup`
3. Selecione: `SONARQUBE SETUP: CONNECTED MODE`

---

### 3️⃣ Adicionar Conexão SonarCloud

Na interface **CONNECTED MODE**, você verá:

```
CONNECTED MODE
  └─ No connections configured

  [+ Add SonarQube Cloud Connection]
  [+ Add SonarQube Server Connection]
```

1. **Clique em**: `+ Add SonarQube Cloud Connection`

2. **Um formulário abrirá** pedindo:

   ```
   ┌─────────────────────────────────────────┐
   │ Add SonarQube Cloud Connection          │
   ├─────────────────────────────────────────┤
   │                                          │
   │ Organization Key: *                      │
   │ ┌─────────────────────────────────────┐ │
   │ │                                       │ │
   │ └─────────────────────────────────────┘ │
   │                                          │
   │ User Token: *                            │
   │ ┌─────────────────────────────────────┐ │
   │ │                                       │ │
   │ └─────────────────────────────────────┘ │
   │ [Generate Token]                         │
   │                                          │
   │ Connection Name: (optional)              │
   │ ┌─────────────────────────────────────┐ │
   │ │                                       │ │
   │ └─────────────────────────────────────┘ │
   │                                          │
   │ [ ] Enable notifications                 │
   │                                          │
   │ [Cancel]        [Save Connection]        │
   └─────────────────────────────────────────┘
   ```

3. **Preencha os campos**:

   - **Organization Key**: `thiagobodevan-a11y-assistente-juridico-p`
   - **User Token**: Cole o token gerado no passo 1
   - **Connection Name**: `SonarCloud Assistente Jurídico` (opcional)
   - **Enable notifications**: ✅ (recomendado)

4. **Clique em**: `Save Connection`

---

### 4️⃣ Fazer Binding do Projeto

Após salvar a conexão, a interface mostrará:

```
CONNECTED MODE
  └─ SonarCloud Assistente Jurídico (connected)
      └─ Projects
          [Bind Project to this Connection]
```

1. **Clique em**: `Bind Project to this Connection`

2. **Selecione o projeto** da lista:
   - Procure por: `portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal`
   - **Clique** no projeto

3. **Confirme o binding**

A interface agora mostrará:

```
CONNECTED MODE
  └─ SonarCloud Assistente Jurídico (connected)
      └─ Projects
          └─ assistente-juridico-p
              ├─ Project Key: portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
              └─ Binding: Active ✅
```

---

### 5️⃣ Verificar Conexão

**Na barra inferior (Status Bar)** do VS Code, você verá:

```
[SonarLint] main ← main (SonarCloud)  [Connected ✅]
```

Isso indica:
- ✅ Branch local: `main`
- ✅ Branch sincronizado no SonarCloud: `main`
- ✅ Status: Conectado

---

### 6️⃣ Testar Análise

1. **Abra** qualquer arquivo `.ts` ou `.tsx`
2. **Faça uma modificação** (ex: adicionar `var x = 10;`)
3. **Salve** o arquivo (`Ctrl+S`)
4. **Aguarde** alguns segundos
5. **Abra o painel Problems** (`Ctrl+Shift+M`)

**Você deve ver issues do SonarLint** com ícone específico:

```
⚠️ Replace "var" with "const" or "let". [typescript:S3504] (SonarLint)
```

---

## 🔧 Gerenciar Conexão

### Ver/Editar Conexão

1. Vá para **CONNECTED MODE** na Activity Bar
2. Clique no **ícone de lápis** ao lado da conexão
3. Edite as configurações
4. Clique em **"Update Connection"**

### Desconectar/Remover

1. Vá para **CONNECTED MODE**
2. Clique com botão direito na conexão
3. Selecione **"Remove Connection"**

### Atualizar Binding

O binding é atualizado automaticamente:
- ✅ A cada 1 hora
- ✅ Ao reiniciar o VS Code
- ✅ Manualmente: Clique em "Update Bindings"

---

## 📊 Configuração Automática (settings.json)

Se preferir, você pode configurar via `settings.json`:

```json
{
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p"
    }
  ],
  "sonarlint.connectedMode.project": {
    "projectKey": "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
  }
}
```

**Nota**: O token **não** deve estar no `settings.json` por segurança. 
A extensão pedirá o token ao conectar pela primeira vez.

---

## 🎯 Compartilhar Configuração com Time

### Método 1: Via Arquivo de Binding

A extensão cria automaticamente um arquivo `.sonarlint/binding.json` no projeto:

```json
{
  "connectionId": "thiagobodevan-a11y-assistente-juridico-p",
  "projectKey": "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
}
```

**Commite este arquivo** para o repositório. Outros desenvolvedores receberão:

```
📢 SonarLint: Shared binding configuration found!
   [Use Configuration] [Not Now] [Don't Ask Again]
```

### Método 2: Via settings.json do Workspace

No arquivo `.vscode/settings.json` (já configurado):

```json
{
  "sonarlint.connectedMode.connections.sonarcloud": [
    {
      "organizationKey": "thiagobodevan-a11y-assistente-juridico-p"
    }
  ],
  "sonarlint.connectedMode.project": {
    "projectKey": "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
  }
}
```

Cada desenvolvedor precisa adicionar seu **próprio token**.

---

## 🐛 Troubleshooting

### Interface CONNECTED MODE não aparece

1. Verifique se SonarLint está instalado:
   ```bash
   code --list-extensions | grep sonarlint
   ```

2. Recarregue o VS Code:
   ```
   Ctrl+Shift+P → Developer: Reload Window
   ```

3. Force a abertura da view:
   ```
   Ctrl+Shift+P → SonarLint: Focus on SonarQube Setup View
   ```

### Token não é aceito

- ✅ Use **User Token** (não Project Token ou Global Token)
- ✅ Verifique se copiou o token completo
- ✅ Teste o token manualmente:

```bash
curl -u "seu_token:" https://sonarcloud.io/api/authentication/validate
```

Resposta esperada: `{"valid":true}`

### Binding não funciona

1. Verifique se o projeto existe no SonarCloud:
   - https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal

2. Verifique se você tem permissão no projeto

3. Tente remover e adicionar a conexão novamente

### Issues não aparecem

1. Aguarde alguns segundos após salvar
2. Verifique se o arquivo tem extensão suportada (`.ts`, `.tsx`, `.js`, `.jsx`)
3. Veja o log: `Ctrl+Shift+P` → `SonarLint: Show SonarLint Output`
4. Force análise: `Ctrl+Shift+P` → `SonarLint: Analyze Current File`

---

## 📚 Referências Oficiais

- **Setup Guide**: https://docs.sonarsource.com/sonarqube-for-vs-code/connect-your-ide/setup
- **Connected Mode**: https://docs.sonarsource.com/sonarqube-for-vs-code/connect-your-ide/connected-mode
- **SonarCloud**: https://sonarcloud.io/
- **Generate Token**: https://sonarcloud.io/account/security

---

**Atualizado em**: 06/12/2024  
**Baseado em**: Documentação oficial SonarSource  
**Versão SonarLint**: 4.35.1
