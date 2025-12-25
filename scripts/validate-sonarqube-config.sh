#!/bin/bash
set -e

# ============================================================================
# Validação: Configuração SonarQube/SonarCloud
# ============================================================================
# Valida sonar-project.properties para garantir configuração correta
# Uso: ./scripts/validate-sonarqube-config.sh
# ============================================================================

echo "🔍 Validando configuração SonarQube..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# ============================================================================
# Verificar se arquivo existe
# ============================================================================

if [ ! -f "sonar-project.properties" ]; then
  echo -e "${RED}❌ Arquivo sonar-project.properties não encontrado!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ sonar-project.properties encontrado${NC}"
echo ""

# ============================================================================
# Validar ProjectKey e Organization
# ============================================================================

echo "📋 Verificando ProjectKey e Organization..."

PROJECT_KEY=$(grep "^sonar.projectKey=" sonar-project.properties | cut -d'=' -f2)
ORGANIZATION=$(grep "^sonar.organization=" sonar-project.properties | cut -d'=' -f2)

if [ "$PROJECT_KEY" = "portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal" ]; then
  echo -e "${GREEN}✅ ProjectKey correto: $PROJECT_KEY${NC}"
else
  echo -e "${RED}❌ ProjectKey incorreto: $PROJECT_KEY${NC}"
  echo -e "   Esperado: portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
  ((ERRORS++))
fi

if [ "$ORGANIZATION" = "thiagobodevanadv-alt" ]; then
  echo -e "${GREEN}✅ Organization correta: $ORGANIZATION${NC}"
else
  echo -e "${RED}❌ Organization incorreta: $ORGANIZATION${NC}"
  echo -e "   Esperado: thiagobodevanadv-alt"
  ((ERRORS++))
fi

echo ""

# ============================================================================
# Validar URLs do Repositório
# ============================================================================

echo "🔗 Verificando URLs do repositório..."

# Verificar URLs corretas (repositório atual)
CORRECT_REPO="portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"
INCORRECT_REPO="portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"

# Homepage
HOMEPAGE=$(grep "^sonar.links.homepage=" sonar-project.properties | cut -d'=' -f2-)
if echo "$HOMEPAGE" | grep -q "$CORRECT_REPO"; then
  echo -e "${GREEN}✅ Homepage URL correta${NC}"
elif echo "$HOMEPAGE" | grep -q "$INCORRECT_REPO"; then
  echo -e "${RED}❌ Homepage URL aponta para repositório antigo!${NC}"
  echo -e "   Atual: $HOMEPAGE"
  echo -e "   Deveria ser: https://github.com/$CORRECT_REPO"
  ((ERRORS++))
else
  echo -e "${YELLOW}⚠️  Homepage URL não reconhecida: $HOMEPAGE${NC}"
  ((WARNINGS++))
fi

# CI
CI_URL=$(grep "^sonar.links.ci=" sonar-project.properties | cut -d'=' -f2-)
if echo "$CI_URL" | grep -q "$CORRECT_REPO"; then
  echo -e "${GREEN}✅ CI URL correta${NC}"
elif echo "$CI_URL" | grep -q "$INCORRECT_REPO"; then
  echo -e "${RED}❌ CI URL aponta para repositório antigo!${NC}"
  echo -e "   Atual: $CI_URL"
  echo -e "   Deveria ser: https://github.com/$CORRECT_REPO/actions"
  ((ERRORS++))
else
  echo -e "${YELLOW}⚠️  CI URL não reconhecida: $CI_URL${NC}"
  ((WARNINGS++))
fi

# SCM
SCM_URL=$(grep "^sonar.links.scm=" sonar-project.properties | cut -d'=' -f2-)
if echo "$SCM_URL" | grep -q "$CORRECT_REPO"; then
  echo -e "${GREEN}✅ SCM URL correta${NC}"
elif echo "$SCM_URL" | grep -q "$INCORRECT_REPO"; then
  echo -e "${RED}❌ SCM URL aponta para repositório antigo!${NC}"
  echo -e "   Atual: $SCM_URL"
  echo -e "   Deveria ser: https://github.com/$CORRECT_REPO"
  ((ERRORS++))
else
  echo -e "${YELLOW}⚠️  SCM URL não reconhecida: $SCM_URL${NC}"
  ((WARNINGS++))
fi

# Issues
ISSUE_URL=$(grep "^sonar.links.issue=" sonar-project.properties | cut -d'=' -f2-)
if echo "$ISSUE_URL" | grep -q "$CORRECT_REPO"; then
  echo -e "${GREEN}✅ Issue URL correta${NC}"
elif echo "$ISSUE_URL" | grep -q "$INCORRECT_REPO"; then
  echo -e "${RED}❌ Issue URL aponta para repositório antigo!${NC}"
  echo -e "   Atual: $ISSUE_URL"
  echo -e "   Deveria ser: https://github.com/$CORRECT_REPO/issues"
  ((ERRORS++))
else
  echo -e "${YELLOW}⚠️  Issue URL não reconhecida: $ISSUE_URL${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================================================
# Validar Caminhos de Cobertura
# ============================================================================

echo "📊 Verificando caminhos de cobertura..."

COVERAGE_PATHS=$(grep "^sonar.javascript.lcov.reportPaths=" sonar-project.properties | cut -d'=' -f2)

if echo "$COVERAGE_PATHS" | grep -q "coverage-api/lcov.info"; then
  echo -e "${GREEN}✅ Coverage path API encontrado${NC}"
else
  echo -e "${YELLOW}⚠️  Coverage path API não encontrado${NC}"
  ((WARNINGS++))
fi

if echo "$COVERAGE_PATHS" | grep -q "chrome-extension-pje/coverage/lcov.info"; then
  echo -e "${GREEN}✅ Coverage path Chrome Extension encontrado${NC}"
else
  echo -e "${YELLOW}⚠️  Coverage path Chrome Extension não encontrado${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================================================
# Validar Quality Gate
# ============================================================================

echo "🚪 Verificando Quality Gate..."

QUALITY_GATE=$(grep "^sonar.qualitygate.wait=" sonar-project.properties | cut -d'=' -f2)

if [ "$QUALITY_GATE" = "true" ]; then
  echo -e "${GREEN}✅ Quality Gate habilitado (wait=true)${NC}"
else
  echo -e "${YELLOW}⚠️  Quality Gate desabilitado ou não configurado${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================================================
# Verificar Exclusões Críticas
# ============================================================================

echo "🔒 Verificando exclusões críticas..."

# Verificar node_modules
if grep -q "node_modules" sonar-project.properties; then
  echo -e "${GREEN}✅ node_modules excluído${NC}"
else
  echo -e "${RED}❌ node_modules NÃO está excluído!${NC}"
  ((ERRORS++))
fi

# Verificar dist/build
if grep -q "dist" sonar-project.properties; then
  echo -e "${GREEN}✅ dist/ excluído${NC}"
else
  echo -e "${YELLOW}⚠️  dist/ não está excluído${NC}"
  ((WARNINGS++))
fi

# Verificar testes
if grep -q "test.ts" sonar-project.properties; then
  echo -e "${GREEN}✅ Arquivos de teste excluídos${NC}"
else
  echo -e "${YELLOW}⚠️  Arquivos de teste podem não estar excluídos${NC}"
  ((WARNINGS++))
fi

echo ""

# ============================================================================
# Resumo Final
# ============================================================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo da Validação:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Erros Críticos: ${RED}$ERRORS${NC}"
echo -e "Avisos: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Configuração SonarQube válida!${NC}"
  echo ""
  echo "ℹ️  Próximos passos:"
  echo "   1. Commit das alterações"
  echo "   2. Push para GitHub"
  echo "   3. Aguardar execução do workflow SonarCloud"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Configuração SonarQube contém erros!${NC}"
  echo ""
  echo "ℹ️  Corrija os erros acima antes de prosseguir."
  echo ""
  exit 1
fi
