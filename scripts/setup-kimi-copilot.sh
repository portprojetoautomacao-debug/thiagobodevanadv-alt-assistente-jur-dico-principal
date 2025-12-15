#!/bin/bash

# Script de Setup Rápido: Kimi K2 Thinking como Copilot
# Configura Continue.dev com Azure AI Foundry

set -e

echo "🤖 Setup: Kimi K2 Thinking como Copilot no VS Code"
echo "=================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se é ambiente Codespaces/DevContainer
if [ -n "$CODESPACES" ] || [ -f "/.dockerenv" ]; then
    echo -e "${BLUE}ℹ️  Ambiente Codespaces/DevContainer detectado${NC}"
    CONTINUE_DIR="/home/node/.continue"
else
    CONTINUE_DIR="$HOME/.continue"
fi

# 1. Pedir API Key
echo -e "${YELLOW}📝 Primeiro, vamos configurar suas credenciais${NC}"
echo ""
echo "Acesse: https://ai.azure.com/ → Deployments → Kimi-K2-Thinking"
echo "Copie o valor do campo 'Key'"
echo ""
read -sp "Cole sua Azure AI Foundry API Key: " AZURE_KEY
echo ""

if [ -z "$AZURE_KEY" ]; then
    echo -e "${RED}❌ API Key não fornecida. Abortando.${NC}"
    exit 1
fi

# 2. Criar diretório Continue se não existir
if [ ! -d "$CONTINUE_DIR" ]; then
    echo -e "${BLUE}📁 Criando diretório Continue.dev...${NC}"
    mkdir -p "$CONTINUE_DIR"
fi

# 3. Criar config.json
echo -e "${BLUE}⚙️  Criando configuração Continue.dev...${NC}"

cat > "$CONTINUE_DIR/config.json" << EOF
{
  "models": [
    {
      "title": "Kimi K2 Thinking",
      "provider": "azure",
      "model": "Kimi-K2-Thinking",
      "apiBase": "https://thiagobodevanadv-1707-resource.services.ai.azure.com",
      "apiKey": "$AZURE_KEY",
      "apiVersion": "2024-05-01-preview",
      "contextLength": 128000,
      "completionOptions": {
        "temperature": 0.7,
        "topP": 0.95,
        "maxTokens": 4000
      }
    }
  ],
  "tabAutocompleteModel": {
    "title": "Kimi K2 Thinking",
    "provider": "azure",
    "model": "Kimi-K2-Thinking"
  },
  "allowAnonymousTelemetry": false,
  "customCommands": [
    {
      "name": "review",
      "description": "Revisar código seguindo padrões do projeto",
      "prompt": "Revise o código seguindo as instruções em .github/copilot-instructions.md. Foque em: TypeScript strict mode, padrões React 19, compatibilidade Vercel serverless."
    },
    {
      "name": "fix-tests",
      "description": "Corrigir testes falhando",
      "prompt": "Analise os testes falhando e corrija-os mantendo a cobertura. Use Vitest para frontend e Playwright para E2E."
    },
    {
      "name": "legal-analysis",
      "description": "Análise jurídica com raciocínio step-by-step",
      "prompt": "Analise este caso jurídico usando raciocínio passo-a-passo: 1) Fatos relevantes, 2) Questões jurídicas, 3) Precedentes aplicáveis, 4) Recomendação fundamentada."
    }
  ]
}
EOF

echo -e "${GREEN}✅ Configuração criada em: $CONTINUE_DIR/config.json${NC}"
echo ""

# 4. Atualizar .env do projeto
echo -e "${BLUE}📝 Atualizando .env do projeto...${NC}"

ENV_FILE="/workspaces/assistente-jur-dico-principal/.env"

if [ ! -f "$ENV_FILE" ]; then
    cp /workspaces/assistente-jur-dico-principal/.env.example "$ENV_FILE"
fi

# Adicionar/atualizar variáveis Kimi
if grep -q "VITE_AZURE_AI_FOUNDRY_KEY" "$ENV_FILE"; then
    sed -i "s|VITE_AZURE_AI_FOUNDRY_KEY=.*|VITE_AZURE_AI_FOUNDRY_KEY=$AZURE_KEY|g" "$ENV_FILE"
else
    echo "" >> "$ENV_FILE"
    echo "# Azure AI Foundry - Kimi K2 Thinking" >> "$ENV_FILE"
    echo "VITE_AZURE_AI_FOUNDRY_ENDPOINT=https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions" >> "$ENV_FILE"
    echo "VITE_AZURE_AI_FOUNDRY_KEY=$AZURE_KEY" >> "$ENV_FILE"
    echo "VITE_KIMI_MODEL_NAME=Kimi-K2-Thinking" >> "$ENV_FILE"
    echo "VITE_KIMI_API_VERSION=2024-05-01-preview" >> "$ENV_FILE"
fi

echo -e "${GREEN}✅ .env atualizado${NC}"
echo ""

# 5. Instruções de instalação da extensão
echo -e "${YELLOW}📦 Próximo passo: Instalar extensão Continue.dev${NC}"
echo ""
echo "Escolha um método:"
echo ""
echo "1️⃣  Via VS Code UI:"
echo "   - Pressione Ctrl+Shift+X"
echo "   - Busque 'Continue'"
echo "   - Clique em 'Install'"
echo ""
echo "2️⃣  Via terminal (se code CLI disponível):"
echo "   $ code --install-extension Continue.continue"
echo ""
echo "3️⃣  Via marketplace web:"
echo "   https://marketplace.visualstudio.com/items?itemName=Continue.continue"
echo ""

# 6. Verificar se extensão já está instalada
if command -v code &> /dev/null; then
    if code --list-extensions | grep -q "Continue.continue"; then
        echo -e "${GREEN}✅ Extensão Continue.dev já instalada!${NC}"
        EXTENSION_INSTALLED=true
    else
        echo -e "${BLUE}📦 Instalando extensão Continue.dev...${NC}"
        code --install-extension Continue.continue || {
            echo -e "${YELLOW}⚠️  Instalação automática falhou. Instale manualmente.${NC}"
            EXTENSION_INSTALLED=false
        }
    fi
fi

echo ""
echo -e "${GREEN}🎉 Setup concluído!${NC}"
echo ""
echo "═══════════════════════════════════════════════════"
echo -e "${BLUE}🚀 Como usar:${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Comandos básicos:"
echo "  Ctrl+L          → Abrir chat"
echo "  Ctrl+I          → Edit inline"
echo "  Tab             → Autocomplete"
echo ""
echo "Comandos customizados (no chat):"
echo "  /review         → Revisar código"
echo "  /fix-tests      → Corrigir testes"
echo "  /legal-analysis → Análise jurídica"
echo ""
echo "Exemplos de uso:"
echo "  Ctrl+L → 'Analise use-processes.ts e corrija type errors'"
echo "  Ctrl+I → 'Adicione validação Zod' (com código selecionado)"
echo "  /review → Revisa arquivo atual"
echo ""
echo -e "${YELLOW}📚 Documentação completa:${NC}"
echo "  docs/KIMI_K2_SETUP_COPILOT.md"
echo ""
echo -e "${GREEN}✨ Bom trabalho!${NC}"
