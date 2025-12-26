# SonarQube MCP Server - Guia de Configuração

## 📋 Visão Geral

O **SonarQube MCP Server** permite que o GitHub Copilot acesse análises de código do SonarCloud/SonarQube em tempo real, fornecendo insights sobre qualidade de código, bugs e vulnerabilidades.

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```bash
# SonarQube MCP Server
SONARQUBE_URL=https://sonarcloud.io
SONARQUBE_TOKEN=your-sonarqube-user-token
SONARQUBE_ORGANIZATION=your-organization-key
SONARQUBE_PROJECT_KEY=your-project-key
```

**⚠️ IMPORTANTE:**
- Use **User Token** (não Project Token) do SonarCloud
- Obtenha em: https://sonarcloud.io/account/security
- O prefixo deve ser `SONARQUBE_` (não `SONAR_`)

### 2. Iniciar o Servidor

```bash
# Método 1: Via script
./scripts/start-sonar-mcp.sh

# Método 2: Via VS Code Task
# Ctrl+Shift+P → "Tasks: Run Task" → "Start SonarQube MCP"

# Método 3: Manualmente
export $(grep SONARQUBE .env.local | xargs)
node scripts/sonar-mcp-server.js
```

## 🚀 Uso com GitHub Copilot

### Comandos Disponíveis

1. **Listar Issues do Projeto**
   ```
   @workspace Quais são as issues críticas do SonarQube?
   ```

2. **Analisar Arquivo Específico**
   ```
   @workspace Verificar issues do SonarQube em src/lib/agents.ts
   ```

3. **Buscar Issues por Severidade**
   ```
   @workspace Listar todas as issues BLOCKER e CRITICAL
   ```

4. **Analisar Lista de Arquivos**
   ```
   @workspace Analisar SonarQube: src/hooks/use-processes.ts, api/agents.ts
   ```

### Fluxo de Trabalho Recomendado

1. **Antes de Iniciar Tarefa:**
   - Desabilitar análise automática (se disponível)
   - Verificar issues existentes do SonarQube

2. **Durante o Desenvolvimento:**
   - Copilot sugere correções baseadas nas rules do SonarQube
   - Issues são mostradas em contexto do código

3. **Após Completar Tarefa:**
   - Analisar arquivos modificados
   - Reabilitar análise automática

## 🔧 Troubleshooting

### Erro: "Project Key is required"

**Causa:** Variável `SONARQUBE_PROJECT_KEY` não está configurada

**Solução:**
```bash
# Verificar se está configurado
echo $SONARQUBE_PROJECT_KEY

# Se vazio, adicionar ao .env.local
echo "SONARQUBE_PROJECT_KEY=your-project-key" >> .env.local

# Reiniciar servidor
./scripts/start-sonar-mcp.sh
```

### Erro: "Not authorized"

**Causa:** Token inválido ou é Project Token (não User Token)

**Solução:**
1. Acesse: https://sonarcloud.io/account/security
2. Gere um novo **User Token** (não Project Token)
3. Atualize `SONARQUBE_TOKEN` no `.env.local`
4. Reinicie o servidor

### Erro: "Project not found"

**Causa:** Project key incorreto

**Solução:**
```bash
# Buscar project key correto
# Via Copilot:
@workspace Buscar meu projeto no SonarQube

# Via SonarCloud UI:
# https://sonarcloud.io/organizations/YOUR-ORG/projects
```

### Servidor não inicia

**Verificações:**
```bash
# 1. Verificar se Node.js está instalado
node --version

# 2. Verificar se variáveis estão carregadas
./scripts/start-sonar-mcp.sh

# 3. Ver logs de erro
cat scripts/sonar-mcp-server.js | grep -A 5 "console.error"
```

## 📊 Integração com VS Code

### Configurar como Task

Adicione ao `.vscode/tasks.json`:

```json
{
  "label": "Start SonarQube MCP",
  "type": "shell",
  "command": "./scripts/start-sonar-mcp.sh",
  "isBackground": true,
  "group": "build",
  "problemMatcher": []
}
```

### Usar com MCP Settings

Adicione ao `.vscode/mcp.json`:

```json
{
  "servers": {
    "sonarqube": {
      "type": "stdio",
      "command": "./scripts/start-sonar-mcp.sh",
      "env": {
        "SONARQUBE_URL": "${input:sonarqube_url}",
        "SONARQUBE_TOKEN": "${input:sonarqube_token}",
        "SONARQUBE_ORGANIZATION": "${input:sonarqube_org}",
        "SONARQUBE_PROJECT_KEY": "${input:sonarqube_project}"
      }
    }
  }
}
```

## 📚 Referências

- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [SonarQube Web API](https://docs.sonarqube.org/latest/extend/web-api/)
- [Instruções do MCP](.github/instructions/sonarqube_mcp.instructions.md)
- [Servidor MCP](scripts/sonar-mcp-server.js)

## 🔐 Segurança

**⚠️ NUNCA commite tokens no repositório!**

- ✅ Tokens devem estar apenas em `.env.local` (ignorado pelo git)
- ✅ Use User Tokens com permissões mínimas necessárias
- ✅ Rotacione tokens regularmente
- ❌ Não compartilhe tokens em PRs ou issues

## 🎯 Melhores Práticas

1. **Execute análise SonarQube antes de cada PR**
   ```bash
   npm run sonar:analyze
   ```

2. **Configure Quality Gate no SonarCloud**
   - Define critérios mínimos de qualidade
   - Bloqueia PRs com issues críticas

3. **Use regras personalizadas**
   - Configure rules específicas do projeto
   - Desabilite rules não aplicáveis

4. **Monitore métricas de qualidade**
   - Code Coverage
   - Code Smells
   - Security Hotspots
   - Technical Debt

---

**Última atualização:** 26/12/2024
