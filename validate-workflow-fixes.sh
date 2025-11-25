#!/bin/bash

# Script para validar correções dos workflows do GitHub Actions
# Assistente Jurídico PJe - Validação de Correções

set -e

echo "🔍 Validando correções dos workflows do GitHub Actions..."
echo "======================================================="

WORKFLOW_DIR=".github/workflows"
ISSUES_FIXED=0
ISSUES_FOUND=0

# Função para verificar se arquivo contém string
check_contains() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    if grep -q "$pattern" "$file"; then
        echo "✅ $description - OK"
        ((ISSUES_FIXED++))
    else
        echo "❌ $description - FALHA"
        ((ISSUES_FOUND++))
    fi
}

# Função para verificar se arquivo NÃO contém string
check_not_contains() {
    local file="$1"
    local pattern="$2"
    local description="$3"

    if ! grep -q "$pattern" "$file"; then
        echo "✅ $description - OK"
        ((ISSUES_FIXED++))
    else
        echo "❌ $description - FALHA"
        ((ISSUES_FOUND++))
    fi
}

echo ""
echo "1️⃣ Verificando correções de segurança crítica:"
echo "============================================="

# 1. pull_request_target → pull_request
echo "🔒 Correção pull_request_target:"
check_not_contains "$WORKFLOW_DIR/copilot-auto-approve.yml" "pull_request_target" "copilot-auto-approve.yml usa pull_request (seguro)"
check_not_contains "$WORKFLOW_DIR/dependabot-auto-merge.yml" "pull_request_target" "dependabot-auto-merge.yml usa pull_request (seguro)"

# 2. Vazamento de secrets no deploy
echo ""
echo "🔐 Correção vazamento de secrets:"
check_not_contains "$WORKFLOW_DIR/deploy.yml" "tee /dev/stderr" "deploy.yml não usa tee que vaza secrets"
check_contains "$WORKFLOW_DIR/deploy.yml" "rm -f deploy.log" "deploy.yml limpa arquivo de log"

# 3. Cache duplicado
echo ""
echo "⚡ Correção cache duplicado:"
check_not_contains "$WORKFLOW_DIR/ci.yml" "Cache dependencies" "ci.yml não tem cache duplicado"

# 4. Validação real de testes no auto-approve
echo ""
echo "🧪 Correção validação de testes:"
check_contains "$WORKFLOW_DIR/copilot-auto-approve.yml" "npm test -- --run" "copilot-auto-approve.yml executa testes reais"
check_contains "$WORKFLOW_DIR/copilot-auto-approve.yml" "npm run lint" "copilot-auto-approve.yml executa lint real"
check_not_contains "$WORKFLOW_DIR/copilot-auto-approve.yml" 'echo "tests-passed=true"' "copilot-auto-approve.yml não força aprovação"

# 5. Dependabot para GitHub Actions
echo ""
echo "🤖 Dependabot para GitHub Actions:"
check_contains ".github/dependabot.yml" "github-actions" "dependabot.yml inclui GitHub Actions"

echo ""
echo "📊 Resumo da Validação:"
echo "======================"
echo "✅ Correções aplicadas: $ISSUES_FIXED"
echo "❌ Problemas restantes: $ISSUES_FOUND"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo ""
    echo "🎉 Todas as correções foram aplicadas com sucesso!"
    echo ""
    echo "📋 Correções implementadas:"
    echo "=========================="
    echo "1. ✅ Segurança: pull_request_target → pull_request"
    echo "2. ✅ Segurança: Removido vazamento de secrets no deploy"
    echo "3. ✅ Performance: Removido cache duplicado"
    echo "4. ✅ Qualidade: Validação real de testes no auto-approve"
    echo "5. ✅ Manutenção: Dependabot para GitHub Actions"
    echo ""
    echo "🚀 Workflows estão seguros e otimizados!"
else
    echo ""
    echo "⚠️ Alguns problemas ainda precisam ser corrigidos."
    echo "Execute novamente após aplicar as correções restantes."
    exit 1
fi

echo ""
echo "📝 Próximos passos recomendados:"
echo "================================"
echo "1. Testar workflows em uma branch de desenvolvimento"
echo "2. Monitorar performance dos pipelines"
echo "3. Revisar permissões dos workflows conforme necessário"
echo "4. Configurar alerts para falhas críticas"
echo ""
echo "🔗 Links úteis:"
echo "==============="
echo "• GitHub Actions Security: https://docs.github.com/en/actions/security-guides"
echo "• Dependabot: https://docs.github.com/en/code-security/dependabot"
echo "• Workflow Best Practices: https://docs.github.com/en/actions/using-workflows"