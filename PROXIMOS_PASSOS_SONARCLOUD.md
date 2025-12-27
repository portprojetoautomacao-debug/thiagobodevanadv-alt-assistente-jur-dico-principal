# 🎯 PRÓXIMOS PASSOS - Ativar SonarCloud MCP

## ✅ O que já está pronto

1. **Servidor MCP personalizado** criado em `/workspaces/assistente-juridico-p/scripts/sonar-mcp-server.js`
2. **Configuração MCP** atualizada em `.vscode/mcp.json`
3. **Build e testes** passando: 338 testes OK, 0 erros TypeScript
4. **Docker instalado** (mas limitado no dev container)

---

## 🔑 PASSO 1: Configurar Token do SonarCloud

### Gerar Token

1. Acesse: https://sonarcloud.io/account/security
2. Em "User Token", clique em **"Generate"**
3. Nome do token: `vscode-mcp-server`
4. Tipo: **USER token** (não project token)
5. Copie o token gerado

### Adicionar ao VS Code

**Pressione**: `Ctrl+Shift+P` → Digite: **"Preferences: Open User Settings (JSON)"**

Adicione estas linhas:

```json
{
  "terminal.integrated.env.linux": {
    "SONARQUBE_TOKEN": "COLE_SEU_TOKEN_AQUI"
  }
}
```

**Exemplo completo:**
```json
{
  "terminal.integrated.env.linux": {
    "SONARQUBE_TOKEN": "squ_1a2b3c4d5e6f7g8h9i0j"
  },
  "editor.formatOnSave": true
}
```

---

## 🔄 PASSO 2: Recarregar VS Code

Após salvar as configurações:

1. Pressione `Ctrl+Shift+P`
2. Digite: **"Developer: Reload Window"**
3. Aguarde o VS Code reiniciar

---

## 🧪 PASSO 3: Testar Integração

### Via Copilot Chat

Abra o Copilot Chat e teste:

```
@workspace Liste os issues críticos do SonarCloud
```

Ou:

```
@workspace Mostre as métricas do SonarCloud
```

### Verificar Logs

Se der erro:

1. Pressione `Ctrl+Shift+U` (abre Output)
2. No dropdown, selecione **"SonarQube"** ou **"MCP"**
3. Procure por erros

---

## 🐛 Troubleshooting

### Erro: "SONARQUBE_TOKEN não configurado"

**Solução**: Você esqueceu de adicionar o token nas User Settings (PASSO 1)

### Erro: "spawn node ENOENT"

**Solução**: Verifique o caminho do Node.js:
```bash
which node
```
E atualize em `.vscode/mcp.json` se necessário.

### Token expirado

**Solução**: Gere novo token e atualize User Settings.

---

## 📊 Ferramentas Disponíveis

Após configurar, você terá via Copilot:

| Ferramenta | Descrição | Exemplo de uso |
|------------|-----------|----------------|
| **list_issues** | Lista issues por severidade | "Mostre bugs críticos" |
| **get_metrics** | Métricas de qualidade | "Qual a cobertura de testes?" |

### Métricas Retornadas

- **bugs**: Quantidade de bugs
- **vulnerabilities**: Vulnerabilidades de segurança
- **code_smells**: Code smells
- **coverage**: Cobertura de testes (%)
- **duplicated_lines_density**: Duplicação de código (%)
- **sqale_index**: Débito técnico (minutos)

---

## 🔗 Links Úteis

- **Dashboard**: https://sonarcloud.io/project/overview?id=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
- **API Docs**: https://sonarcloud.io/web_api
- **Gerar Token**: https://sonarcloud.io/account/security
- **Documentação completa**: `SONARCLOUD_MCP_FIXED.md`

---

## 📋 Checklist

- [ ] Token gerado no SonarCloud
- [ ] Token adicionado em User Settings (JSON)
- [ ] VS Code recarregado
- [ ] Testado via Copilot Chat
- [ ] Logs verificados (sem erros)

---

**Data de criação**: $(date)
**Status**: ⏳ Aguardando configuração do usuário
**Duração estimada**: 5 minutos
