#!/bin/bash
# Script para testar geração de arquivos SARIF localmente
# Autor: Sistema de Manutenção
# Data: 26/12/2025

set -e

echo "🧪 Testando Geração de Arquivos SARIF"
echo "======================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se arquivo foi criado
check_file() {
    local file=$1
    local name=$2

    if [[ -f "$file" ]]; then
        local size=$(du -h "$file" | cut -f1)
        echo -e "${GREEN}✅ $name gerado com sucesso${NC} (tamanho: $size)"

        # Validar se é JSON válido
        if jq empty "$file" 2>/dev/null; then
            echo -e "${GREEN}   └─ JSON válido${NC}"
        else
            echo -e "${RED}   └─ ⚠️  JSON inválido!${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ $name NÃO foi gerado${NC}"
        return 1
    fi
}

# Limpar arquivos SARIF antigos
echo "🧹 Limpando arquivos SARIF antigos..."
rm -f eslint-results.sarif tsc-results.sarif vitest-results.sarif
echo ""

# Teste 1: ESLint SARIF
echo "📋 Teste 1: Gerando ESLint SARIF"
echo "--------------------------------"
if npm run lint:sarif 2>/dev/null; then
    check_file "eslint-results.sarif" "ESLint SARIF"
else
    echo -e "${YELLOW}⚠️  ESLint teve erros, mas tentando gerar SARIF mesmo assim...${NC}"
    npm run lint:sarif || echo -e "${RED}❌ Falha ao gerar SARIF${NC}"
    check_file "eslint-results.sarif" "ESLint SARIF"
fi
echo ""

# Teste 2: TypeScript SARIF
echo "📋 Teste 2: Gerando TypeScript SARIF"
echo "------------------------------------"
if npm run tsc:sarif 2>/dev/null; then
    check_file "tsc-results.sarif" "TypeScript SARIF"
else
    echo -e "${YELLOW}⚠️  TypeScript check teve erros, mas SARIF pode ter sido gerado${NC}"
    check_file "tsc-results.sarif" "TypeScript SARIF" || echo -e "${YELLOW}   └─ Sem SARIF gerado (esperado se não há erros)${NC}"
fi
echo ""

# Teste 3: Vitest SARIF (se existir)
echo "📋 Teste 3: Gerando Vitest SARIF (opcional)"
echo "-------------------------------------------"
if command -v npm run test:sarif &> /dev/null; then
    npm run test:sarif 2>/dev/null || echo -e "${YELLOW}⚠️  Script test:sarif não encontrado ou falhou${NC}"
    check_file "vitest-results.sarif" "Vitest SARIF" || echo -e "${YELLOW}   └─ Vitest SARIF não gerado (opcional)${NC}"
else
    echo -e "${YELLOW}⚠️  Script test:sarif não encontrado${NC}"
fi
echo ""

# Resumo final
echo "======================================"
echo "📊 Resumo dos Testes"
echo "======================================"

SARIF_COUNT=0
if [[ -f "eslint-results.sarif" ]]; then
    ((SARIF_COUNT++))
fi
if [[ -f "tsc-results.sarif" ]]; then
    ((SARIF_COUNT++))
fi
if [[ -f "vitest-results.sarif" ]]; then
    ((SARIF_COUNT++))
fi

echo -e "Arquivos SARIF gerados: ${GREEN}$SARIF_COUNT${NC}"
echo ""

if [[ $SARIF_COUNT -gt 0 ]]; then
    echo -e "${GREEN}✅ Geração de SARIF funcionando!${NC}"
    echo ""
    echo "📁 Arquivos gerados:"
    ls -lh *-results.sarif 2>/dev/null || true
    exit 0
else
    echo -e "${RED}❌ Nenhum arquivo SARIF foi gerado!${NC}"
    echo ""
    echo "🔧 Possíveis causas:"
    echo "  - Formatter SARIF não instalado"
    echo "  - Scripts não configurados no package.json"
    echo "  - Erros críticos impedindo geração"
    exit 1
fi
