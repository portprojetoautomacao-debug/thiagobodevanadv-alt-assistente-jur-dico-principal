#!/bin/bash

# Script para executar todos os testes com pytest
# Gera relatório de cobertura e resumo

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Executando Suite de Testes Completa${NC}\n"

# Diretório do script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Verificar se pytest está instalado
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}❌ pytest não encontrado. Instalando...${NC}"
    pip install pytest pytest-cov pytest-asyncio pytest-mock
fi

# Criar diretório para relatórios
mkdir -p test-reports

echo -e "${BLUE}📋 Executando testes unitários...${NC}\n"

# Executar testes com cobertura
pytest tests/ \
    --verbose \
    --cov=lib \
    --cov=backend \
    --cov-report=html:test-reports/htmlcov \
    --cov-report=term-missing \
    --cov-report=xml:test-reports/coverage.xml \
    --junitxml=test-reports/junit.xml \
    --tb=short \
    2>&1 | tee test-reports/test-output.log

# Capturar código de saída
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BLUE}📊 Gerando resumo...${NC}\n"

# Contar testes
TOTAL_TESTS=$(grep -c "test_" tests/*.py || echo "0")
PASSED_TESTS=$(grep -o "passed" test-reports/test-output.log | wc -l || echo "0")
FAILED_TESTS=$(grep -o "failed" test-reports/test-output.log | wc -l || echo "0")
SKIPPED_TESTS=$(grep -o "skipped" test-reports/test-output.log | wc -l || echo "0")

# Extrair cobertura
COVERAGE=$(grep -oP "TOTAL.*\K\d+" test-reports/test-output.log | tail -1 || echo "0")

# Gerar resumo
cat > test-reports/summary.txt <<EOF
========================================
📊 RESUMO DOS TESTES
========================================

Data: $(date '+%Y-%m-%d %H:%M:%S')

Testes Executados:
  ✅ Passou:   $PASSED_TESTS
  ❌ Falhou:   $FAILED_TESTS
  ⏭️  Pulou:    $SKIPPED_TESTS
  📋 Total:    $TOTAL_TESTS

Cobertura de Código: ${COVERAGE}%

Relatórios Gerados:
  - HTML: test-reports/htmlcov/index.html
  - XML:  test-reports/coverage.xml
  - JUnit: test-reports/junit.xml
  - Log:  test-reports/test-output.log

========================================
EOF

# Exibir resumo
cat test-reports/summary.txt

# Verificar se atingiu meta de cobertura (70%)
if [ "$COVERAGE" -ge 70 ]; then
    echo -e "\n${GREEN}✅ Meta de cobertura atingida! (${COVERAGE}% >= 70%)${NC}"
else
    echo -e "\n${RED}⚠️ Cobertura abaixo da meta (${COVERAGE}% < 70%)${NC}"
fi

# Exibir resultado final
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✅ Todos os testes passaram!${NC}\n"
else
    echo -e "\n${RED}❌ Alguns testes falharam!${NC}\n"
    exit $TEST_EXIT_CODE
fi

echo -e "${BLUE}📁 Relatórios salvos em: test-reports/${NC}\n"
