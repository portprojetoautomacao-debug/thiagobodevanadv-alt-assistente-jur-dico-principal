# Correção: SonarQube MCP - Project Key Required

**Data:** 26/12/2024
**Erro:** "Error fetching issues: Project Key is required in server configuration."

## 🔍 Problema Identificado

O servidor SonarQube MCP (`scripts/sonar-mcp-server.js`) estava procurando variáveis de ambiente com prefixo `SONARQUBE_*`, mas apenas variáveis com prefixo `SONAR_*` estavam configuradas.

## ✅ Solução Aplicada

### 1. Variáveis de Ambiente Adicionadas

Adicionadas as seguintes variáveis ao `.env.local`:

```bash
# SonarQube MCP Server (variáveis específicas para o MCP)
SONARQUBE_URL=https://sonarcloud.io
SONARQUBE_TOKEN=sqco_CnrgczDksDQ98hsZ04usL02I5mJS0QS5ryqcpxEr4c1kiuIOASAdGoLZZa2
SONARQUBE_ORGANIZATION=portprojetoautomacao-debug
SONARQUBE_PROJECT_KEY=portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal
```

### 2. Documentação Atualizada

- **`.env.example`**: Adicionada seção com documentação das variáveis `SONARQUBE_*`
- **`docs/SONARQUBE_MCP_SETUP.md`**: Criado guia completo de configuração

### 3. Script de Inicialização

Criado `scripts/start-sonar-mcp.sh`:
- Carrega variáveis de `.env.local`
- Valida configuração obrigatória
- Inicia servidor MCP

### 4. Task do VS Code

Adicionada task "Start SonarQube MCP Server" em `.vscode/tasks.json`:
- Permite iniciar via `Ctrl+Shift+P` → "Tasks: Run Task"
- Configurada como background task

### 5. Correções Técnicas

- **Arquivo renomeado**: `sonar-mcp-server.js` → `sonar-mcp-server.cjs`
  - Razão: projeto usa `"type": "module"` no package.json
  - CommonJS (`require`) não funciona em arquivos `.js`
- **Shebang corrigido**: Movido para primeira linha
- **Sintaxe `.env.local`**: Corrigido `EMAIL_FROM` com aspas duplas

## 🚀 Como Usar

### Iniciar Servidor

```bash
# Método 1: Script direto
./scripts/start-sonar-mcp.sh

# Método 2: VS Code Task
Ctrl+Shift+P → Tasks: Run Task → Start SonarQube MCP Server
```

### Verificar Status

```bash
# Ver variáveis carregadas
export $(grep SONARQUBE .env.local | xargs)
echo $SONARQUBE_PROJECT_KEY

# Testar conexão
curl -H "Authorization: Bearer $SONARQUBE_TOKEN" \
  "https://sonarcloud.io/api/issues/search?componentKeys=$SONARQUBE_PROJECT_KEY&ps=10"
```

### Usar com Copilot

```
@workspace Quais são as issues críticas do SonarQube?
@workspace Analisar issues em src/lib/agents.ts
```

## 📁 Arquivos Modificados

1. `.env.local` - Variáveis `SONARQUBE_*` adicionadas, `EMAIL_FROM` corrigido
2. `.env.example` - Documentação das variáveis MCP
3. `scripts/sonar-mcp-server.js` → `scripts/sonar-mcp-server.cjs` - Renomeado e corrigido
4. `scripts/start-sonar-mcp.sh` - Script de inicialização criado (novo)
5. `.vscode/tasks.json` - Task "Start SonarQube MCP Server" adicionada
6. `docs/SONARQUBE_MCP_SETUP.md` - Documentação completa criada (novo)

## ✅ Resultado

- ✅ Servidor inicia corretamente
- ✅ Variáveis carregadas: URL, Token, Organization, Project Key
- ✅ Logs de inicialização corretos
- ✅ Pronto para integração com Copilot

## 📚 Referências

- Documentação: `docs/SONARQUBE_MCP_SETUP.md`
- Instruções MCP: `.github/instructions/sonarqube_mcp.instructions.md`
- Servidor: `scripts/sonar-mcp-server.cjs`
- Script: `scripts/start-sonar-mcp.sh`

---

**Status:** ✅ Resolvido
**Testado:** ✅ Servidor iniciando corretamente
**Documentado:** ✅ Guia completo criado
