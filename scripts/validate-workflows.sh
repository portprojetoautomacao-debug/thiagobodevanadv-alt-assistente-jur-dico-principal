#!/bin/bash

# 🔍 Script de Validação de Workflows do GitHub Actions
# Verifica se todos os workflows seguem as boas práticas de autenticação

set -euo pipefail

WORKFLOW_DIR=".github/workflows"
ISSUES_FOUND=0
WARNINGS_FOUND=0

echo "🔍 Verificando workflows em ${WORKFLOW_DIR}/"
echo ""

# Cores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar cada workflow
check_workflow() {
    local file="$1"
    local filename=$(basename "$file")
    local issues=0
    local warnings=0

    echo -e "${BLUE}📄 Analisando: ${filename}${NC}"

    # 1. Verificar se usa actions/checkout
    if grep -q "uses: actions/checkout" "$file"; then

        # 2. Verificar se tem token configurado quando usa fetch-depth: 0
        if grep -A5 "uses: actions/checkout" "$file" | grep -q "fetch-depth: 0"; then
            if ! grep -A10 "uses: actions/checkout" "$file" | grep -q "token:"; then
                echo -e "${YELLOW}  ⚠️  WARNING: Checkout com fetch-depth: 0 mas sem token explícito${NC}"
                echo "     Linha: $(grep -n 'uses: actions/checkout' "$file" | head -1 | cut -d: -f1)"
                ((warnings++))
            fi
        fi

        # 3. Verificar se usa git fetch sem configurar credenciais
        if grep -q "git fetch" "$file"; then
            if ! grep -B20 "git fetch" "$file" | grep -q "git config.*insteadOf"; then
                echo -e "${RED}  ❌ ISSUE: Usa 'git fetch' sem configurar credenciais git${NC}"
                echo "     Linha: $(grep -n 'git fetch' "$file" | head -1 | cut -d: -f1)"
                ((issues++))
            fi

            # Verificar se tem tratamento de erro
            if ! grep -A2 "git fetch" "$file" | grep -qE "if.*!.*git fetch|git fetch.*\|\|"; then
                echo -e "${YELLOW}  ⚠️  WARNING: 'git fetch' sem tratamento de erro${NC}"
                echo "     Linha: $(grep -n 'git fetch' "$file" | head -1 | cut -d: -f1)"
                ((warnings++))
            fi
        fi

        # 4. Verificar se usa git clone (não recomendado em workflows)
        if grep -q "git clone" "$file"; then
            echo -e "${RED}  ❌ ISSUE: Usa 'git clone' ao invés de actions/checkout${NC}"
            echo "     Linha: $(grep -n 'git clone' "$file" | head -1 | cut -d: -f1)"
            ((issues++))
        fi
    fi

    # 5. Verificar permissões do workflow
    if ! grep -q "permissions:" "$file"; then
        echo -e "${YELLOW}  ⚠️  WARNING: Workflow sem declaração explícita de permissões${NC}"
        ((warnings++))
    fi

    # Resumo do arquivo
    if [ $issues -eq 0 ] && [ $warnings -eq 0 ]; then
        echo -e "${GREEN}  ✅ Nenhum problema encontrado${NC}"
    fi

    echo ""

    # Retornar contadores
    echo "$issues $warnings"
}

# Verificar todos os arquivos .yml no diretório de workflows
total_files=0
shopt -s nullglob  # Retornar lista vazia se nenhum arquivo corresponder
for workflow in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
    [ -f "$workflow" ] || continue

    ((total_files++))

    # Chamar função de verificação e capturar resultado
    result=$(check_workflow "$workflow")
    file_issues=$(echo "$result" | awk '{print $1}')
    file_warnings=$(echo "$result" | awk '{print $2}')

    ((ISSUES_FOUND += file_issues))
    ((WARNINGS_FOUND += file_warnings))
done

# Relatório final
echo "════════════════════════════════════════════════════════"
echo "📊 RELATÓRIO FINAL"
echo "════════════════════════════════════════════════════════"
echo "Total de workflows analisados: $total_files"
echo ""

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os workflows estão OK!${NC}"
    exit 0
else
    if [ $ISSUES_FOUND -gt 0 ]; then
        echo -e "${RED}❌ Issues críticos encontrados: $ISSUES_FOUND${NC}"
    fi

    if [ $WARNINGS_FOUND -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Avisos encontrados: $WARNINGS_FOUND${NC}"
    fi

    echo ""
    echo "📚 Consulte a documentação para correções:"
    echo "   docs/WORKFLOW_FIX_REPOSITORY_NOT_FOUND.md"

    # Retornar erro se houver issues críticos
    if [ $ISSUES_FOUND -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
fi
