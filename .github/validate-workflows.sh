#!/bin/bash

# Script de validação dos workflows GitHub Actions
# Verifica sintaxe, práticas recomendadas e configurações

set -e

echo "🔍 Validando workflows GitHub Actions..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
PASSED=0

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se yq está instalado (para parsing YAML)
if ! command_exists yq; then
    echo -e "${YELLOW}⚠️  Warning: 'yq' não encontrado. Alguns testes serão limitados.${NC}"
    echo "   Instale com: brew install yq (macOS) ou snap install yq (Linux)"
    echo ""
fi

# 1. Verificar se todos os workflows têm sintaxe YAML válida
echo "1️⃣  Verificando sintaxe YAML..."
WORKFLOW_DIR=".github/workflows"

if [ ! -d "$WORKFLOW_DIR" ]; then
    echo -e "${RED}❌ Diretório $WORKFLOW_DIR não encontrado!${NC}"
    exit 1
fi

WORKFLOW_COUNT=0
for workflow in "$WORKFLOW_DIR"/*.yml; do
    if [ -f "$workflow" ]; then
        WORKFLOW_COUNT=$((WORKFLOW_COUNT + 1))
        
        # Verificar sintaxe básica com Python (disponível na maioria dos sistemas)
        if command_exists python3; then
            if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
                echo -e "   ${GREEN}✓${NC} $(basename $workflow)"
                PASSED=$((PASSED + 1))
            else
                echo -e "   ${RED}✗${NC} $(basename $workflow) - Sintaxe YAML inválida"
                ERRORS=$((ERRORS + 1))
            fi
        else
            echo -e "   ${BLUE}○${NC} $(basename $workflow) - Pulado (Python não disponível)"
        fi
    fi
done

echo ""
echo "   Total de workflows: $WORKFLOW_COUNT"
echo ""

# 2. Verificar práticas recomendadas
echo "2️⃣  Verificando práticas recomendadas..."

check_workflow_practice() {
    local workflow=$1
    local pattern=$2
    local message=$3
    local level=$4  # "error" ou "warning"
    
    if grep -q "$pattern" "$workflow"; then
        echo -e "   ${GREEN}✓${NC} $(basename $workflow): $message"
        PASSED=$((PASSED + 1))
    else
        if [ "$level" = "error" ]; then
            echo -e "   ${RED}✗${NC} $(basename $workflow): $message (faltando)"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "   ${YELLOW}⚠${NC}  $(basename $workflow): $message (recomendado)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
}

for workflow in "$WORKFLOW_DIR"/*.yml; do
    if [ -f "$workflow" ]; then
        # Verificar se tem concurrency group (recomendado)
        check_workflow_practice "$workflow" "concurrency:" "tem concurrency group" "warning"
        
        # Verificar se tem permissions definidas (boa prática)
        check_workflow_practice "$workflow" "permissions:" "tem permissions definidas" "warning"
    fi
done

echo ""

# 3. Verificar se há workflows duplicados ou redundantes
echo "3️⃣  Verificando duplicações..."

# Contar workflows por tipo
CI_COUNT=$(find "$WORKFLOW_DIR" -name "*ci*.yml" -o -name "*build*.yml" | wc -l)
DEPLOY_COUNT=$(find "$WORKFLOW_DIR" -name "*deploy*.yml" | wc -l)
SECURITY_COUNT=$(find "$WORKFLOW_DIR" -name "*security*.yml" -o -name "*audit*.yml" | wc -l)

echo "   CI/Build workflows: $CI_COUNT"
echo "   Deploy workflows: $DEPLOY_COUNT"
echo "   Security workflows: $SECURITY_COUNT"

if [ $CI_COUNT -gt 2 ]; then
    echo -e "   ${YELLOW}⚠️  Múltiplos workflows de CI detectados. Considere consolidar.${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# 4. Verificar secrets necessários
echo "4️⃣  Verificando referências a secrets..."

REQUIRED_SECRETS=(
    "VERCEL_TOKEN"
    "VERCEL_ORG_ID"
    "VERCEL_PROJECT_ID"
    "VITE_GOOGLE_CLIENT_ID"
    "VITE_GOOGLE_API_KEY"
)

echo "   Secrets referenciados nos workflows:"
for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -r "secrets\.$secret" "$WORKFLOW_DIR" >/dev/null 2>&1; then
        echo -e "   ${BLUE}●${NC} $secret (usado)"
    else
        echo -e "   ${YELLOW}○${NC} $secret (não usado)"
    fi
done

echo ""

# 5. Verificar se há TODOs ou FIXMEs nos workflows
echo "5️⃣  Verificando TODOs/FIXMEs..."

TODO_COUNT=$(grep -r "TODO\|FIXME\|XXX\|HACK" "$WORKFLOW_DIR" 2>/dev/null | wc -l)

if [ "$TODO_COUNT" -gt 0 ]; then
    echo -e "   ${YELLOW}⚠️  $TODO_COUNT TODO/FIXME encontrados:${NC}"
    grep -rn "TODO\|FIXME\|XXX\|HACK" "$WORKFLOW_DIR" 2>/dev/null | while read -r line; do
        echo "      $line"
    done
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "   ${GREEN}✓${NC} Nenhum TODO/FIXME encontrado"
    PASSED=$((PASSED + 1))
fi

echo ""

# 6. Verificar tamanho dos workflows
echo "6️⃣  Verificando tamanho dos workflows..."

for workflow in "$WORKFLOW_DIR"/*.yml; do
    if [ -f "$workflow" ]; then
        LINES=$(wc -l < "$workflow")
        if [ "$LINES" -gt 500 ]; then
            echo -e "   ${YELLOW}⚠${NC}  $(basename $workflow): $LINES linhas (considere dividir)"
            WARNINGS=$((WARNINGS + 1))
        elif [ "$LINES" -gt 300 ]; then
            echo -e "   ${BLUE}○${NC} $(basename $workflow): $LINES linhas"
        else
            echo -e "   ${GREEN}✓${NC} $(basename $workflow): $LINES linhas"
            PASSED=$((PASSED + 1))
        fi
    fi
done

echo ""

# 7. Verificar documentação
echo "7️⃣  Verificando documentação..."

if [ -f "$WORKFLOW_DIR/README.md" ]; then
    echo -e "   ${GREEN}✓${NC} README.md dos workflows existe"
    PASSED=$((PASSED + 1))
    
    # Verificar se todos os workflows estão documentados
    for workflow in "$WORKFLOW_DIR"/*.yml; do
        WORKFLOW_NAME=$(basename "$workflow")
        if grep -q "$WORKFLOW_NAME" "$WORKFLOW_DIR/README.md"; then
            echo -e "      ${GREEN}✓${NC} $WORKFLOW_NAME documentado"
        else
            echo -e "      ${YELLOW}⚠${NC}  $WORKFLOW_NAME não documentado"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "   ${YELLOW}⚠️  README.md dos workflows não encontrado${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "   ${GREEN}✓ Passou:     $PASSED${NC}"
echo -e "   ${YELLOW}⚠ Avisos:     $WARNINGS${NC}"
echo -e "   ${RED}✗ Erros:      $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ Validação falhou com $ERRORS erro(s)!${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Validação passou com $WARNINGS aviso(s)${NC}"
    echo "   Considere revisar os avisos acima"
    exit 0
else
    echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
    exit 0
fi
