#!/bin/bash

# Script de Setup Rápido: Cline com Kimi K2 Thinking
# Configura Cline como agente autônomo no VS Code

set -e

echo "🤖 Setup: Cline Autonomous Agent com Kimi K2 Thinking"
echo "====================================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Detectar ambiente
if [ -n "$CODESPACES" ] || [ -f "/.dockerenv" ]; then
    echo -e "${BLUE}ℹ️  Ambiente Codespaces/DevContainer detectado${NC}"
    VSCODE_DIR="/home/node/.vscode-remote/data/Machine"
else
    VSCODE_DIR="$HOME/.vscode/User"
fi

# 1. Pedir API Key
echo -e "${YELLOW}📝 Configuração de Credenciais${NC}"
echo ""
echo "Acesse: https://ai.azure.com/ → Deployments → Kimi-K2-Thinking"
echo "Copie o valor do campo 'Key'"
echo ""
read -sp "Cole sua Azure AI Foundry API Key: " AZURE_KEY
echo ""
echo ""

if [ -z "$AZURE_KEY" ]; then
    echo -e "${RED}❌ API Key não fornecida. Abortando.${NC}"
    exit 1
fi

# 2. Criar diretório de configuração
echo -e "${BLUE}📁 Preparando configuração do Cline...${NC}"
mkdir -p "$VSCODE_DIR"

# 3. Criar settings.json para Cline
SETTINGS_FILE="$VSCODE_DIR/settings.json"

# Ler settings existente ou criar novo
if [ -f "$SETTINGS_FILE" ]; then
    echo -e "${BLUE}📝 Atualizando settings.json existente...${NC}"
    cp "$SETTINGS_FILE" "$SETTINGS_FILE.backup"
else
    echo "{}" > "$SETTINGS_FILE"
fi

# Adicionar configuração Cline usando jq (se disponível) ou Python
if command -v jq &> /dev/null; then
    # Usar jq
    jq '. + {
      "cline.apiProvider": "azure-openai",
      "cline.azureOpenAI": {
        "endpoint": "https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions",
        "apiKey": "'"$AZURE_KEY"'",
        "deployment": "Kimi-K2-Thinking",
        "apiVersion": "2024-05-01-preview"
      },
      "cline.modelId": "Kimi-K2-Thinking",
      "cline.maxTokens": 8000,
      "cline.temperature": 0.7,
      "cline.autoApprove": false,
      "cline.alwaysAllowWriteOnly": false,
      "cline.customInstructions": "Você é um agente autônomo especializado em desenvolvimento jurídico.\n\nSEMPRE siga as regras em .github/copilot-instructions.md:\n- TypeScript strict mode\n- Padrões React 19 com componentes funcionais\n- Compatibilidade Vercel serverless\n- MODO MANUTENÇÃO: apenas corrigir bugs, não adicionar features\n- Validar tipos e rodar testes após modificações\n\nAntes de qualquer mudança:\n1. Ler .github/copilot-instructions.md\n2. Verificar padrões do código existente\n3. Rodar type-check e testes\n4. Documentar mudanças críticas"
    }' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp" && mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
else
    # Usar Python
    python3 << EOF
import json
import sys

settings_file = "$SETTINGS_FILE"

try:
    with open(settings_file, 'r') as f:
        settings = json.load(f)
except:
    settings = {}

settings.update({
    "cline.apiProvider": "azure-openai",
    "cline.azureOpenAI": {
        "endpoint": "https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions",
        "apiKey": "$AZURE_KEY",
        "deployment": "Kimi-K2-Thinking",
        "apiVersion": "2024-05-01-preview"
    },
    "cline.modelId": "Kimi-K2-Thinking",
    "cline.maxTokens": 8000,
    "cline.temperature": 0.7,
    "cline.autoApprove": False,
    "cline.alwaysAllowWriteOnly": False,
    "cline.customInstructions": """Você é um agente autônomo especializado em desenvolvimento jurídico.

SEMPRE siga as regras em .github/copilot-instructions.md:
- TypeScript strict mode
- Padrões React 19 com componentes funcionais
- Compatibilidade Vercel serverless
- MODO MANUTENÇÃO: apenas corrigir bugs, não adicionar features
- Validar tipos e rodar testes após modificações

Antes de qualquer mudança:
1. Ler .github/copilot-instructions.md
2. Verificar padrões do código existente
3. Rodar type-check e testes
4. Documentar mudanças críticas"""
})

with open(settings_file, 'w') as f:
    json.dump(settings, f, indent=2)
EOF
fi

echo -e "${GREEN}✅ Configuração do Cline criada${NC}"

# 4. Atualizar .env do projeto
echo -e "${BLUE}📝 Atualizando .env do projeto...${NC}"

ENV_FILE="/workspaces/assistente-jur-dico-principal/.env"

if [ ! -f "$ENV_FILE" ]; then
    cp /workspaces/assistente-jur-dico-principal/.env.example "$ENV_FILE"
fi

# Adicionar variáveis se não existirem
if ! grep -q "VITE_AZURE_AI_FOUNDRY_KEY" "$ENV_FILE"; then
    cat >> "$ENV_FILE" << EOF

# Azure AI Foundry - Kimi K2 Thinking (Cline Agent)
VITE_AZURE_AI_FOUNDRY_ENDPOINT=https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions
VITE_AZURE_AI_FOUNDRY_KEY=$AZURE_KEY
VITE_KIMI_MODEL_NAME=Kimi-K2-Thinking
VITE_KIMI_API_VERSION=2024-05-01-preview
EOF
fi

echo -e "${GREEN}✅ .env atualizado${NC}"
echo ""

# 5. Instruções de instalação
echo -e "${YELLOW}📦 Instalando extensão Cline...${NC}"
echo ""

if command -v code &> /dev/null; then
    if code --list-extensions | grep -q "saoudrizwan.claude-dev"; then
        echo -e "${GREEN}✅ Extensão Cline já instalada!${NC}"
    else
        echo -e "${BLUE}📦 Instalando Cline...${NC}"
        code --install-extension saoudrizwan.claude-dev || {
            echo -e "${YELLOW}⚠️  Instalação automática falhou.${NC}"
            echo ""
            echo "Instale manualmente:"
            echo "1. Ctrl+Shift+X"
            echo "2. Buscar 'Cline'"
            echo "3. Instalar 'Cline' by Saoud Rizwan"
        }
    fi
else
    echo "Instale manualmente:"
    echo "1. Ctrl+Shift+X"
    echo "2. Buscar 'Cline'"
    echo "3. Instalar 'Cline' by Saoud Rizwan"
fi

echo ""
echo -e "${GREEN}🎉 Setup do Cline concluído!${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${BLUE}🤖 Como usar o Cline:${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Abrir Cline:"
echo "   - Pressione Ctrl+Shift+P"
echo "   - Digite 'Cline: Open'"
echo "   - Ou clique no ícone Cline na sidebar"
echo ""
echo "2️⃣  Comandos de Exemplo:"
echo ""
echo "   🔍 ANÁLISE:"
echo "   \"Analise use-processes.ts e liste todos os type errors\""
echo ""
echo "   🐛 CORREÇÃO:"
echo "   \"Corrija todos os testes falhando em tests/\""
echo ""
echo "   ⚙️  IMPLEMENTAÇÃO:"
echo "   \"Implemente validação Zod para Process em types.ts\""
echo ""
echo "   🧪 TESTES:"
echo "   \"Adicione testes E2E para o fluxo de login com Playwright\""
echo ""
echo "   🏗️  REFATORAÇÃO:"
echo "   \"Refatore MinutasManager seguindo as instruções do projeto\""
echo ""
echo "   📦 WORKFLOW COMPLETO:"
echo "   \"Implemente autenticação OAuth do Google com testes\""
echo ""
echo "3️⃣  Recursos do Cline:"
echo "   ✅ Lê e modifica arquivos automaticamente"
echo "   ✅ Roda comandos no terminal (npm test, lint, build)"
echo "   ✅ Cria novos arquivos e pastas"
echo "   ✅ Faz commits git (opcional)"
echo "   ✅ Usa as instruções do projeto automaticamente"
echo ""
echo "4️⃣  Segurança:"
echo "   ⚠️  Cline pede aprovação antes de:"
echo "   - Modificar arquivos"
echo "   - Rodar comandos no terminal"
echo "   - Fazer commits git"
echo ""
echo "   💡 Configuração atual:"
echo "   - Auto-approve: DESATIVADO (seguro)"
echo "   - Sempre revisar mudanças antes de aplicar"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${YELLOW}📚 Recursos Adicionais:${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Documentação:"
echo "  docs/KIMI_K2_SETUP_COPILOT.md"
echo ""
echo "GitHub:"
echo "  https://github.com/saoudrizwan/claude-dev"
echo ""
echo "Configuração:"
echo "  $SETTINGS_FILE"
echo ""
echo -e "${GREEN}✨ Pronto para usar! Abra o Cline e comece a programar!${NC}"
echo ""
