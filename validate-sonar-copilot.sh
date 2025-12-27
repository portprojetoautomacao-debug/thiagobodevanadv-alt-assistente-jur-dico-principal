#!/bin/bash

# ============================================
# 🔍 SONAR COPILOT ASSISTANT - VALIDATION SCRIPT
# ============================================
# Este script valida a configuração do Sonar Copilot Assistant

set -e

echo "🔍 Validando configuração do Sonar Copilot Assistant..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
SUCCESS=0

# ============================================
# 1. Verificar arquivos de configuração
# ============================================
echo "📁 Verificando arquivos de configuração..."

if [ -f ".vscode/sonar-copilot-assistant.json" ]; then
  echo -e "${GREEN}✅ .vscode/sonar-copilot-assistant.json encontrado${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ .vscode/sonar-copilot-assistant.json NÃO encontrado${NC}"
  ((ERRORS++))
fi

if [ -f ".vscode/sonar-copilot-assistant.user.example.json" ]; then
  echo -e "${GREEN}✅ .vscode/sonar-copilot-assistant.user.example.json encontrado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  .vscode/sonar-copilot-assistant.user.example.json NÃO encontrado${NC}"
  ((WARNINGS++))
fi

if [ -f "docs/SONAR_COPILOT_ASSISTANT_SETUP.md" ]; then
  echo -e "${GREEN}✅ docs/SONAR_COPILOT_ASSISTANT_SETUP.md encontrado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  docs/SONAR_COPILOT_ASSISTANT_SETUP.md NÃO encontrado${NC}"
  ((WARNINGS++))
fi

if [ -f "docs/SONAR_COPILOT_QUICK_START.md" ]; then
  echo -e "${GREEN}✅ docs/SONAR_COPILOT_QUICK_START.md encontrado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  docs/SONAR_COPILOT_QUICK_START.md NÃO encontrado${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================
# 2. Verificar diretórios
# ============================================
echo "📂 Verificando diretórios..."

if [ -d ".sonar-copilot/training" ]; then
  echo -e "${GREEN}✅ .sonar-copilot/training/ existe${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  .sonar-copilot/training/ NÃO existe (será criado na primeira execução)${NC}"
  ((WARNINGS++))
fi

if [ -d ".sonar-copilot/logs" ]; then
  echo -e "${GREEN}✅ .sonar-copilot/logs/ existe${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  .sonar-copilot/logs/ NÃO existe (será criado na primeira execução)${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================
# 3. Verificar .gitignore
# ============================================
echo "🔒 Verificando .gitignore..."

if grep -q "sonar-copilot-assistant.user.json" .gitignore; then
  echo -e "${GREEN}✅ .gitignore contém sonar-copilot-assistant.user.json${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ .gitignore NÃO contém sonar-copilot-assistant.user.json${NC}"
  echo -e "${YELLOW}   Adicione: .vscode/sonar-copilot-assistant.user.json${NC}"
  ((ERRORS++))
fi

if grep -q ".sonar-copilot/logs" .gitignore; then
  echo -e "${GREEN}✅ .gitignore contém .sonar-copilot/logs${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ .gitignore NÃO contém .sonar-copilot/logs${NC}"
  echo -e "${YELLOW}   Adicione: .sonar-copilot/logs/${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 4. Verificar configurações do SonarCloud
# ============================================
echo "☁️  Verificando configurações do SonarCloud..."

CONFIG_FILE=".vscode/sonar-copilot-assistant.json"

# Organization: portprojetoautomacao-debug (GitHub Owner)
if grep -q "portprojetoautomacao-debug" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Organization key configurado (portprojetoautomacao-debug)${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Organization key NÃO configurado (esperado: portprojetoautomacao-debug)${NC}"
  ((ERRORS++))
fi

# Project Key: portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal (SonarCloud)
if grep -q "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Project key configurado (portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal)${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Project key NÃO configurado (esperado: portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal)${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 5. Verificar GitHub Integration
# ============================================
echo "🐙 Verificando integração GitHub..."

# GitHub Repository: portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal
if grep -q "portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Repository GitHub configurado (portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal)${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ Repository GitHub NÃO configurado (esperado: portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal)${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 6. Verificar Copilot Guidelines
# ============================================
echo "📋 Verificando Copilot Guidelines..."

if grep -q ".github/copilot-instructions.md" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Guidelines path configurado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  Guidelines path NÃO configurado${NC}"
  ((WARNINGS++))
fi

if [ -f ".github/copilot-instructions.md" ]; then
  echo -e "${GREEN}✅ .github/copilot-instructions.md existe${NC}"
  ((SUCCESS++))
else
  echo -e "${RED}❌ .github/copilot-instructions.md NÃO existe${NC}"
  ((ERRORS++))
fi

echo ""

# ============================================
# 7. Verificar Test Configuration
# ============================================
echo "🧪 Verificando configuração de testes..."

if grep -q "vitest" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Framework de testes (Vitest) configurado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  Framework de testes NÃO configurado${NC}"
  ((WARNINGS++))
fi

if grep -q "npm run test:run" "$CONFIG_FILE"; then
  echo -e "${GREEN}✅ Comando de teste configurado${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  Comando de teste NÃO configurado${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================
# 8. Verificar .env.example
# ============================================
echo "🔐 Verificando .env.example..."

if grep -q "SONAR_ORGANIZATION" .env.example; then
  echo -e "${GREEN}✅ .env.example contém variáveis Sonar${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  .env.example NÃO contém variáveis Sonar (opcional)${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================
# 9. Verificar README.md
# ============================================
echo "📖 Verificando documentação no README.md..."

if grep -q "Sonar Copilot Assistant" README.md; then
  echo -e "${GREEN}✅ README.md menciona Sonar Copilot Assistant${NC}"
  ((SUCCESS++))
else
  echo -e "${YELLOW}⚠️  README.md NÃO menciona Sonar Copilot Assistant${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================
# RELATÓRIO FINAL
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RELATÓRIO DE VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Sucessos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo -e "${RED}❌ Erros: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}🎉 Configuração válida! Sonar Copilot Assistant está pronto para uso.${NC}"
  echo ""
  echo "📚 Próximos passos:"
  echo "1. Instale a extensão no VS Code"
  echo "2. Configure tokens em User Settings (veja docs/SONAR_COPILOT_QUICK_START.md)"
  echo "3. Teste a conexão"
  echo "4. Comece a usar!"
  exit 0
else
  echo -e "${RED}⚠️  Configuração incompleta. Corrija os erros acima.${NC}"
  echo ""
  echo "📖 Veja a documentação:"
  echo "- docs/SONAR_COPILOT_QUICK_START.md"
  echo "- docs/SONAR_COPILOT_ASSISTANT_SETUP.md"
  exit 1
fi
