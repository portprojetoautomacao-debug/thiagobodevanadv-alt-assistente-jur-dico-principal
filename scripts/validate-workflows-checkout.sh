#!/bin/bash
# Script para validar configuração de checkout em todos os workflows
# Autor: GitHub Copilot Assistant
# Data: 26/12/2025

set -euo pipefail

echo "🔍 Validando configuração de checkout em todos os workflows..."
echo ""

WORKFLOWS_DIR=".github/workflows"
ISSUES_FOUND=0
FILES_CHECKED=0

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar um arquivo de workflow
check_workflow() {
    local file="$1"
    local filename=$(basename "$file")

    FILES_CHECKED=$((FILES_CHECKED + 1))

    # Verificar se tem checkout
    if ! grep -q "uses: actions/checkout" "$file"; then
        echo -e "${YELLOW}⚠️  $filename: Sem step de checkout${NC}"
        return 0
    fi

    # Contar checkouts e fetch-depth
    checkout_lines=$(grep -n "uses: actions/checkout@v4" "$file" || true)

    if [ -z "$checkout_lines" ]; then
        echo -e "${GREEN}✅ $filename: Checkout OK (versão diferente de v4)${NC}"
        return 0
    fi

    has_issue=false

    # Para cada linha de checkout, verificar se tem fetch-depth nas próximas 5 linhas
    while IFS= read -r line; do
        line_num=$(echo "$line" | cut -d: -f1)

        # Pegar as próximas 5 linhas após o checkout
        next_lines=$(sed -n "${line_num},$((line_num + 5))p" "$file")

        if ! echo "$next_lines" | grep -q "fetch-depth:"; then
            if [ "$has_issue" = false ]; then
                echo -e "${RED}❌ $filename: Checkout sem fetch-depth${NC}"
                has_issue=true
                ISSUES_FOUND=$((ISSUES_FOUND + 1))
            fi
            echo "   Linha $line_num: Falta fetch-depth"
        fi

        if ! echo "$next_lines" | grep -q "token:"; then
            echo -e "${YELLOW}   ⚠️  Linha $line_num: Recomendado adicionar token explícito${NC}"
        fi
    done <<< "$checkout_lines"

    if [ "$has_issue" = false ]; then
        echo -e "${GREEN}✅ $filename: Checkout configurado corretamente${NC}"
    fi

    echo "📖 Consulte: docs/GITHUB_ACTIONS_CHECKOUT_FIX.md"
    exit 1
fi
