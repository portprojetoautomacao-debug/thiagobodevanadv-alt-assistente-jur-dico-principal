# 🚀 Guia Completo: GitLab Workflow no VS Code

## ✅ Configuração Inicial

Seu token do GitLab foi configurado com sucesso!

**Token**: `glpat-TyuAdkI93U_tsO0s6QexmG86MQp1Oml4ZThxCw.01.12094aj61`  
**URL**: https://gitlab.com  
**Projeto**: 76287668 (portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal)

---

## 🔐 Adicionar Conta no VS Code

### Passo 1: Abrir Command Palette
- **Windows/Linux**: `Ctrl + Shift + P`
- **Mac**: `Cmd + Shift + P`

### Passo 2: Adicionar Conta
1. Digite: `GitLab: Add Account`
2. Pressione **Enter**
3. Cole o token completo quando solicitado:
   ```
   glpat-TyuAdkI93U_tsO0s6QexmG86MQp1Oml4ZThxCw.01.12094aj61
   ```
4. Confirme a URL: `https://gitlab.com`

✅ Pronto! A extensão está conectada.

---

## 📊 Ver Status do Pipeline

### Na Barra de Status (parte inferior)
Você verá automaticamente o status do último pipeline:

- 🔴 **Pipeline Failed** - Pipeline falhou
- ✅ **Pipeline Passed** - Pipeline passou
- ⏳ **Pipeline Running** - Pipeline executando
- ⏸️ **Pipeline Pending** - Pipeline pendente
- 🚫 **Pipeline Canceled** - Pipeline cancelado
- ⏭️ **Pipeline Skipped** - Pipeline pulado

**Clique no status** para ver opções rápidas.

---

## 🎯 Comandos Principais

### 1. Ver Pipeline Atual
```
Command Palette > GitLab: View Latest Pipeline on GitLab
```
Abre o pipeline no navegador.

### 2. Criar Novo Pipeline
```
Command Palette > GitLab: Create New Pipeline from Current Branch
```
Inicia um novo pipeline para a branch atual.

### 3. Cancelar Pipeline
```
Command Palette > GitLab: Cancel Last Pipeline
```

### 4. Retentar Pipeline
```
Command Palette > GitLab: Retry Last Pipeline
```
Útil quando um pipeline falha por erro temporário.

### 5. Baixar Artefatos
```
Command Palette > GitLab: Download Artifacts from Latest Pipeline
```
Baixa os artefatos do último pipeline em ZIP ou JSON.

---

## 🔍 Ver Jobs do CI/CD

### Na Sidebar (menu lateral esquerdo)

1. Clique no ícone **GitLab Workflow** (🦊)
2. Expanda **"For current branch"**
3. Você verá todos os jobs do pipeline:
   - ✅ Jobs bem-sucedidos
   - ❌ Jobs com falha
   - ⚠️ Jobs com falhas permitidas
   - ⏳ Jobs em execução

**Clique em um job** para ver o log completo em uma nova aba.

### Pipelines Downstream (a jusante)
- Aparecem sob o pipeline principal
- Clique nas setas para expandir/colapsar
- Selecione para ver logs

---

## 🧪 Validar Configuração CI/CD

### Testar `.gitlab-ci.yml` Localmente

1. Abra o arquivo `.gitlab-ci.yml`
2. Certifique-se de que a aba está em foco
3. Abra Command Palette: `Ctrl+Shift+P`
4. Digite: `GitLab: Validate GitLab CI Config`
5. Pressione **Enter**

A extensão mostrará um alerta se houver erros na configuração.

---

## 🔀 Ver Configuração Mesclada (Merged)

Se seu `.gitlab-ci.yml` usa `include` ou referências:

1. Abra o arquivo `.gitlab-ci.yml`
2. No canto superior direito, clique em:
   **"Mostrar Configuração CI/CD do GitLab Mesclada"**
   
Uma nova aba `.gitlab-ci (Merged).yml` será aberta com toda a configuração resolvida.

---

## ⚡ Autocompletar Variáveis CI/CD

Ao editar `.gitlab-ci.yml`:

1. Digite `$CI_` ou qualquer variável
2. A extensão mostrará sugestões automaticamente
3. Use as **setas** para navegar
4. Pressione **Enter** para selecionar

**Variáveis comuns**:
- `$CI_COMMIT_SHA` - Hash do commit
- `$CI_COMMIT_REF_NAME` - Nome da branch
- `$CI_PIPELINE_ID` - ID do pipeline
- `$CI_JOB_NAME` - Nome do job
- `$CI_PROJECT_NAME` - Nome do projeto

---

## 🔔 Notificações de Pipeline

### Ativar Alertas no VS Code

1. Vá em: **Code > Settings > Settings** (ou `Ctrl+,`)
2. Busque por: `GitLab Workflow`
3. Marque: **"Show Pipeline Update Notifications"**

Agora você receberá notificações quando:
- Pipeline iniciar
- Pipeline concluir (sucesso/falha)
- Jobs importantes mudarem de status

---

## 🛠️ Configurações Úteis

### Arquivo `.vscode/settings.json`

Suas configurações atuais:

```json
{
  "gitlab.instanceUrl": "https://gitlab.com",
  "gitlab.pipelineGitRemoteName": "origin",
  "gitlab.showPipelineUpdateNotifications": true,
  "gitlab.showStatusBarLinks": true,
  "gitlab.showIssueLinkOnStatusBar": false,
  "gitlab.showMrStatusOnStatusBar": true,
  "gitlab.remoteName": "origin"
}
```

### Personalizar:

- **`showPipelineUpdateNotifications`**: Mostrar notificações de pipeline
- **`showStatusBarLinks`**: Mostrar links na barra de status
- **`showMrStatusOnStatusBar`**: Mostrar status de Merge Request
- **`showIssueLinkOnStatusBar`**: Mostrar link de issue

---

## 🔗 Comandos Rápidos do Git

### Fazer Push com Token

```bash
git push
```
O token já está configurado automaticamente.

### Verificar Remotes

```bash
git remote -v
```

Você verá:
```
gitlab  https://oauth2:TOKEN@gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal.git (fetch)
gitlab  https://oauth2:TOKEN@gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal.git (push)
```

---

## 📚 Recursos Adicionais

### Atalhos de Teclado Úteis

| Ação | Atalho |
|------|--------|
| Command Palette | `Ctrl+Shift+P` (Win/Linux) / `Cmd+Shift+P` (Mac) |
| Abrir Terminal | `` Ctrl+` `` |
| Ver Sidebar GitLab | `Ctrl+Shift+G` então clique no ícone GitLab |

### Ver Pipeline no GitLab (Web)

Clique na barra de status ou use:
```
https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/pipelines
```

---

## 🆘 Solução de Problemas

### Token Não Funciona?

1. Verifique se o token está correto em `.gitlab-token`
2. Execute novamente: `./setup-gitlab-vscode.sh`
3. Remova e adicione a conta:
   - `GitLab: Remove Account`
   - `GitLab: Add Account`

### Pipeline Não Aparece?

1. Certifique-se de estar na branch correta
2. Verifique se há commits recentes
3. Recarregue a extensão: `Developer: Reload Window`

### Autocompletar Não Funciona?

Certifique-se de que:
- O arquivo termina com `.yml` ou `.yaml`
- O arquivo começa com `.gitlab-ci`
- Exemplos válidos: `.gitlab-ci.yml`, `.gitlab-ci.production.yml`

---

## 🎓 Exemplos de Uso

### 1. Workflow Típico de Desenvolvimento

```bash
# 1. Criar nova branch
git checkout -b feature/nova-funcionalidade

# 2. Fazer alterações no código
# ... editar arquivos ...

# 3. Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push
git push -u origin feature/nova-funcionalidade
```

No VS Code:
1. A barra de status mostrará "Pipeline Running"
2. Clique para ver detalhes
3. Abra a sidebar GitLab para ver jobs
4. Clique em um job para ver logs

### 2. Debugar Pipeline Falho

1. **Ver o erro**:
   - Barra de status: clique em "Pipeline Failed"
   - Sidebar: expanda o pipeline e clique no job vermelho
   
2. **Analisar o log**:
   - Procure por linhas com `ERROR` ou `FAILED`
   - Verifique a última linha executada

3. **Corrigir**:
   - Edite o arquivo problemático
   - Commit e push

4. **Retentar**:
   - Command Palette: `GitLab: Retry Last Pipeline`

### 3. Validar CI Antes de Commit

Antes de fazer push:

1. Abra `.gitlab-ci.yml`
2. `Ctrl+Shift+P` > `GitLab: Validate GitLab CI Config`
3. Corrija erros se houver
4. Commit e push

---

## 🔒 Segurança

⚠️ **IMPORTANTE**:

- ✅ O arquivo `.gitlab-token` está no `.gitignore`
- ✅ Nunca commite tokens ou credenciais
- ✅ O token tem escopo limitado ao projeto
- ✅ Rotacione o token periodicamente

Para criar um novo token:
1. GitLab > Settings > Access Tokens
2. Crie token com escopos: `api`, `read_repository`, `write_repository`
3. Atualize em `.gitlab-token`
4. Execute `./setup-gitlab-vscode.sh`

---

## ✨ Dicas Pro

1. **Atalhos Personalizados**: Configure em `Keyboard Shortcuts`
   - Ex: `Ctrl+Alt+P` para criar pipeline

2. **Múltiplos Projetos**: Adicione várias contas GitLab

3. **Snippets CI/CD**: Crie snippets para jobs comuns

4. **Integration com GitHub**: Use ambas extensões simultaneamente

---

## 📞 Suporte

- **Documentação Oficial**: https://docs.gitlab.com/ee/editor_extensions/visual_studio_code/
- **Issues da Extensão**: https://gitlab.com/gitlab-org/gitlab-vscode-extension/-/issues
- **Projeto no GitLab**: https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal

---

**Data de Configuração**: 23 de novembro de 2025  
**Extensão**: GitLab Workflow (gitlab.gitlab-workflow)  
**Projeto**: assistente-juridico-p
