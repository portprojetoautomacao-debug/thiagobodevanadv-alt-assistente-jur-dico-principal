#!/bin/bash
# Script para verificar integridade do código e integrações
# Uso: ./check-code-integrity.sh [--mock-only|--integration-only|--all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
MOCK_COUNT=0
INTEGRATION_ISSUES=0
WARNINGS=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     🔍 Verificação de Integridade do Código               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==========================================
# 1. DETECTAR DADOS MOCKADOS
# ==========================================

check_mock_data() {
  echo -e "${YELLOW}📊 Verificando dados mockados/simulados...${NC}"
  echo ""
  
  # Padrões para buscar
  PATTERNS=(
    "mockData"
    "fakeData"
    "dummyData"
    "MOCK_"
    "FAKE_"
    "simulad"
    "fictíci"
  )
  
  echo "Arquivos com possíveis dados simulados:"
  echo "----------------------------------------"
  
  for pattern in "${PATTERNS[@]}"; do
    RESULTS=$(grep -rln "$pattern" src/ api/ lib/ 2>/dev/null | grep -v "\.test\.\|\.spec\.\|node_modules\|sample-data\.ts" || true)
    if [ -n "$RESULTS" ]; then
      for file in $RESULTS; do
        echo -e "  ${YELLOW}⚠️${NC} $file (padrão: $pattern)"
        MOCK_COUNT=$((MOCK_COUNT + 1))
      done
    fi
  done
  
  # Verificar CPF/CNPJ hardcoded
  CPF_FILES=$(grep -rln "[0-9]\{3\}\.[0-9]\{3\}\.[0-9]\{3\}-[0-9]\{2\}" src/ api/ lib/ 2>/dev/null | grep -v test || true)
  if [ -n "$CPF_FILES" ]; then
    echo ""
    echo "Arquivos com possíveis CPFs hardcoded:"
    for file in $CPF_FILES; do
      echo -e "  ${RED}❌${NC} $file"
      MOCK_COUNT=$((MOCK_COUNT + 1))
    done
  fi
  
  echo ""
  if [ $MOCK_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum dado mockado suspeito encontrado${NC}"
  else
    echo -e "${YELLOW}⚠️  Total de ocorrências: $MOCK_COUNT${NC}"
  fi
  echo ""
}

# ==========================================
# 2. VERIFICAR INTEGRAÇÕES
# ==========================================

check_integrations() {
  echo -e "${YELLOW}🔗 Verificando integrações entre módulos...${NC}"
  echo ""
  
  echo "Status das Integrações:"
  echo "------------------------"
  
  # AIAgents -> use-autonomous-agents
  if grep -q "useAutonomousAgents" src/components/AIAgents.tsx 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} AIAgents.tsx → use-autonomous-agents"
  else
    echo -e "  ${RED}❌${NC} AIAgents.tsx → use-autonomous-agents (DESCONECTADO)"
    INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
  fi
  
  # use-autonomous-agents -> API
  if grep -q "fetch\|api/" src/hooks/use-autonomous-agents.ts 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} use-autonomous-agents → API calls"
  else
    echo -e "  ${YELLOW}⚠️${NC} use-autonomous-agents → API calls (verificar)"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # DJEN em api/cron.ts
  if grep -q "djen\|DJEN\|DJENComunicacao" api/cron.ts 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} api/cron.ts → DJEN Client"
  else
    echo -e "  ${RED}❌${NC} api/cron.ts → DJEN Client (DESCONECTADO)"
    INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
  fi
  
  # DJEN em api/legal-services.ts
  if grep -q "djen\|DJEN" api/legal-services.ts 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} api/legal-services.ts → DJEN"
  else
    echo -e "  ${YELLOW}⚠️${NC} api/legal-services.ts → DJEN (verificar)"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # KV Utils -> Upstash
  if grep -q "@upstash/redis\|UPSTASH" api/_lib/kv-utils.ts api/kv.ts 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} KV Utils → Upstash Redis"
  else
    echo -e "  ${RED}❌${NC} KV Utils → Upstash Redis (DESCONECTADO)"
    INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
  fi
  
  # ProcessCRM -> useKV
  if grep -q "useKV" src/components/ProcessCRM.tsx 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} ProcessCRM.tsx → useKV"
  else
    echo -e "  ${YELLOW}⚠️${NC} ProcessCRM.tsx → useKV (verificar)"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # Dashboard -> useKV
  if grep -q "useKV" src/components/Dashboard.tsx 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} Dashboard.tsx → useKV"
  else
    echo -e "  ${YELLOW}⚠️${NC} Dashboard.tsx → useKV (verificar)"
    WARNINGS=$((WARNINGS + 1))
  fi
  
  # DeadlineCalculator -> api/legal-services
  if grep -q "legal-services\|calcular.*prazo" src/components/DeadlineCalculator.tsx 2>/dev/null; then
    echo -e "  ${GREEN}✅${NC} DeadlineCalculator → API Legal Services"
  else
    echo -e "  ${YELLOW}⚠️${NC} DeadlineCalculator → API (pode usar cálculo local)"
  fi
  
  echo ""
}

# ==========================================
# 3. VERIFICAR ENDPOINTS DA API
# ==========================================

check_api_endpoints() {
  echo -e "${YELLOW}📡 Verificando endpoints da API...${NC}"
  echo ""
  
  echo "Endpoints disponíveis:"
  echo "----------------------"
  
  API_FILES=$(find api -name "*.ts" 2>/dev/null | grep -v "_lib" || true)
  for file in $API_FILES; do
    if [ -f "$file" ]; then
      ENDPOINT=$(echo "$file" | sed 's|api/|/api/|' | sed 's|\.ts$||' | sed 's|/index$||')
      
      # Verificar se tem handler default export
      if grep -q "export default\|module.exports" "$file" 2>/dev/null; then
        echo -e "  ${GREEN}✅${NC} $ENDPOINT"
      else
        echo -e "  ${RED}❌${NC} $ENDPOINT (sem handler)"
        INTEGRATION_ISSUES=$((INTEGRATION_ISSUES + 1))
      fi
    fi
  done
  
  echo ""
}

# ==========================================
# 4. VERIFICAR CONSOLE.LOGS
# ==========================================

check_console_logs() {
  echo -e "${YELLOW}🖥️  Verificando console.log em produção...${NC}"
  echo ""
  
  CONSOLE_COUNT=$(grep -rn "console\.\(log\|debug\)" src/ 2>/dev/null | grep -v "\.test\.\|\.spec\.\|__test" | wc -l || echo "0")
  
  echo "Console statements em código de produção: $CONSOLE_COUNT"
  
  if [ "$CONSOLE_COUNT" -gt 30 ]; then
    echo -e "${YELLOW}⚠️  Considere reduzir console.log em produção${NC}"
    WARNINGS=$((WARNINGS + 1))
  else
    echo -e "${GREEN}✅ Quantidade aceitável${NC}"
  fi
  
  echo ""
}

# ==========================================
# 5. VERIFICAR SAMPLE-DATA USAGE
# ==========================================

check_sample_data() {
  echo -e "${YELLOW}📦 Verificando uso de sample-data...${NC}"
  echo ""
  
  SAMPLE_IMPORTS=$(grep -rln "from.*sample-data\|import.*sample-data" src/ api/ lib/ 2>/dev/null || true)
  
  if [ -n "$SAMPLE_IMPORTS" ]; then
    echo "Arquivos que importam sample-data:"
    for file in $SAMPLE_IMPORTS; do
      echo -e "  ${YELLOW}⚠️${NC} $file"
    done
    
    # Verificar se é condicional
    if grep -rq "NODE_ENV\|APP_ENV\|isDev\|isProduction" $SAMPLE_IMPORTS 2>/dev/null; then
      echo -e "\n${GREEN}✅ Uso parece ser condicional (dev/prod)${NC}"
    else
      echo -e "\n${YELLOW}⚠️  Verificar se uso é protegido por ambiente${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo -e "${GREEN}✅ sample-data não está sendo importado${NC}"
  fi
  
  echo ""
}

# ==========================================
# RELATÓRIO FINAL
# ==========================================

print_summary() {
  echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║                    📊 RESUMO                              ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  
  echo "Resultados:"
  echo "-----------"
  echo -e "  Dados mockados encontrados: ${YELLOW}$MOCK_COUNT${NC}"
  echo -e "  Problemas de integração:    ${RED}$INTEGRATION_ISSUES${NC}"
  echo -e "  Avisos:                     ${YELLOW}$WARNINGS${NC}"
  echo ""
  
  TOTAL_ISSUES=$((MOCK_COUNT + INTEGRATION_ISSUES + WARNINGS))
  
  if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Código está em boa forma!${NC}"
    exit 0
  elif [ $INTEGRATION_ISSUES -gt 0 ]; then
    echo -e "${RED}❌ Existem problemas de integração que precisam ser corrigidos${NC}"
    exit 1
  else
    echo -e "${YELLOW}⚠️  Existem avisos que devem ser revisados${NC}"
    exit 0
  fi
}

# ==========================================
# MAIN
# ==========================================

case "${1:-all}" in
  --mock-only)
    check_mock_data
    ;;
  --integration-only)
    check_integrations
    check_api_endpoints
    ;;
  --all|*)
    check_mock_data
    check_integrations
    check_api_endpoints
    check_console_logs
    check_sample_data
    print_summary
    ;;
esac
