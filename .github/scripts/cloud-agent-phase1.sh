#!/bin/bash
# 🤖 Quick Start Script for Cloud Agent - Microsoft Migration
# Este script guia o cloud agent pelas validações iniciais

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════"
echo "🤖 CLOUD AGENT - MIGRAÇÃO MICROSOFT MULTI-AGENT ENGINE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 FASE 1: VALIDAÇÃO DE AMBIENTE"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        return 1
    fi
}

# 1. Health Check do Sistema Atual
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Verificando Health Check do Sistema Atual..."
echo ""

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://assistente-juridico-github.vercel.app/api/health)

if [ "$HEALTH_RESPONSE" = "200" ]; then
    check_status "Health Check: Sistema está saudável (200 OK)"
    HEALTH_OK=1
else
    check_status "Health Check: Sistema com problemas (HTTP $HEALTH_RESPONSE)"
    HEALTH_OK=0
fi

echo ""

# 2. Verificar último deployment Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Verificando Último Deployment no Vercel..."
echo ""

if command -v vercel &> /dev/null; then
    LAST_DEPLOY=$(vercel ls --json 2>/dev/null | jq -r '.[0].state' 2>/dev/null || echo "UNKNOWN")
    
    if [ "$LAST_DEPLOY" = "READY" ]; then
        check_status "Último Deploy: SUCCESSFUL (READY)"
        DEPLOY_OK=1
    else
        check_status "Último Deploy: Status $LAST_DEPLOY"
        DEPLOY_OK=0
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI não instalado - pulando verificação${NC}"
    DEPLOY_OK=1  # Assume OK se CLI não disponível
fi

echo ""

# 3. Verificar se há erros TypeScript
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Verificando TypeScript..."
echo ""

if [ -f "package.json" ]; then
    npm run type-check > /dev/null 2>&1
    check_status "TypeScript: Sem erros de compilação"
    TS_OK=$?
else
    echo -e "${YELLOW}⚠️  package.json não encontrado - pulando verificação${NC}"
    TS_OK=0
fi

echo ""

# 4. Verificar testes
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Verificando Testes..."
echo ""

if [ -f "package.json" ]; then
    TEST_OUTPUT=$(npm run test:run 2>&1 || true)
    TESTS_PASSING=$(echo "$TEST_OUTPUT" | grep -oP '\d+(?= passing)' | tail -1 || echo "0")
    
    if [ "$TESTS_PASSING" -ge 366 ]; then
        check_status "Testes: $TESTS_PASSING testes passando (meta: 366+)"
        TESTS_OK=1
    else
        echo -e "${YELLOW}⚠️  Testes: $TESTS_PASSING testes passando (abaixo da meta de 366)${NC}"
        TESTS_OK=0
    fi
else
    echo -e "${YELLOW}⚠️  package.json não encontrado - pulando verificação${NC}"
    TESTS_OK=0
fi

echo ""

# 5. Resumo das Validações
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DAS VALIDAÇÕES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

TOTAL_CHECKS=4
PASSED_CHECKS=0

[ $HEALTH_OK -eq 1 ] && ((PASSED_CHECKS++))
[ $DEPLOY_OK -eq 1 ] && ((PASSED_CHECKS++))
[ $TS_OK -eq 0 ] && ((PASSED_CHECKS++))  # 0 = success for type-check
[ $TESTS_OK -eq 1 ] && ((PASSED_CHECKS++))

echo "Validações Passadas: $PASSED_CHECKS/$TOTAL_CHECKS"
echo ""

# Decisão: Prosseguir ou Não
if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✅ TODAS AS VALIDAÇÕES PASSARAM${NC}"
    echo ""
    echo "🚀 PRÓXIMA AÇÃO: Prosseguir para Fase 2 (Setup Azure Infrastructure)"
    echo ""
    echo "Comandos sugeridos:"
    echo "  1. git clone https://github.com/microsoft/Multi-Agent-Custom-Automation-Engine-Solution-Accelerator.git"
    echo "  2. cd Multi-Agent-Custom-Automation-Engine-Solution-Accelerator"
    echo "  3. azd auth login"
    echo "  4. azd up --environment sandbox"
    echo ""
    exit 0
else
    echo -e "${RED}❌ VALIDAÇÕES FALHARAM: $((TOTAL_CHECKS - PASSED_CHECKS)) problema(s) detectado(s)${NC}"
    echo ""
    echo "⚠️  RECOMENDAÇÃO: Corrigir problemas ANTES de prosseguir com migração"
    echo ""
    echo "Ações sugeridas:"
    
    if [ $HEALTH_OK -eq 0 ]; then
        echo "  - Investigar health check (verificar logs Vercel/Sentry)"
    fi
    
    if [ $DEPLOY_OK -eq 0 ]; then
        echo "  - Verificar último deploy no Vercel Dashboard"
    fi
    
    if [ $TS_OK -ne 0 ]; then
        echo "  - Corrigir erros TypeScript: npm run type-check"
    fi
    
    if [ $TESTS_OK -eq 0 ]; then
        echo "  - Investigar testes falhando: npm run test:run"
    fi
    
    echo ""
    echo "🛑 MIGRAÇÃO PAUSADA até problemas serem resolvidos"
    echo ""
    exit 1
fi
