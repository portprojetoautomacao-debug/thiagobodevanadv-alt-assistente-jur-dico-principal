#!/bin/bash
# Script de validação completa do setup de testes E2E

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VALIDAÇÃO COMPLETA DO SETUP DE TESTES E2E"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

check_ok() {
    echo -e "${GREEN}✅ $1${NC}"
    SUCCESS=$((SUCCESS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

check_error() {
    echo -e "${RED}❌ $1${NC}"
    ERRORS=$((ERRORS + 1))
}

echo "📋 1. VERIFICANDO ARQUIVOS DE CONFIGURAÇÃO..."
echo ""

# Verificar .env
if [ -f .env ]; then
    check_ok "Arquivo .env encontrado"
    
    # Verificar variáveis críticas
    if grep -q "TEST_USER_EMAIL" .env; then
        EMAIL=$(grep "TEST_USER_EMAIL" .env | cut -d '=' -f2 | tr -d ' ')
        if [ -n "$EMAIL" ]; then
            check_ok "TEST_USER_EMAIL configurado: $EMAIL"
        else
            check_warn "TEST_USER_EMAIL vazio no .env"
        fi
    else
        check_warn "TEST_USER_EMAIL não encontrado no .env"
    fi
    
    if grep -q "VITE_AUTH_MODE" .env; then
        MODE=$(grep "VITE_AUTH_MODE" .env | cut -d '=' -f2 | tr -d ' ')
        if [ -n "$MODE" ]; then
            check_ok "VITE_AUTH_MODE: $MODE"
        else
            check_warn "VITE_AUTH_MODE vazio (padrão: simple)"
        fi
    else
        check_warn "VITE_AUTH_MODE não configurado (padrão: simple)"
    fi
else
    check_error "Arquivo .env não encontrado - execute: cp .env.example .env"
fi

echo ""
echo "📦 2. VERIFICANDO DEPENDÊNCIAS..."
echo ""

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_ok "Node.js instalado: $NODE_VERSION"
else
    check_error "Node.js não encontrado"
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_ok "npm instalado: $NPM_VERSION"
else
    check_error "npm não encontrado"
fi

# Verificar Playwright
if npx playwright --version &>/dev/null 2>&1; then
    PW_VERSION=$(npx playwright --version)
    check_ok "Playwright instalado: $PW_VERSION"
else
    check_warn "Playwright não encontrado - execute: npm install"
fi

echo ""
echo "🌐 3. VERIFICANDO BROWSERS..."
echo ""

# Verificar browsers instalados
if [ -d ~/.cache/ms-playwright ] || [ -d ~/Library/Caches/ms-playwright ]; then
    if npx playwright list-files 2>/dev/null | grep -q "chromium"; then
        check_ok "Browser Chromium instalado"
    else
        check_warn "Browser Chromium não encontrado"
    fi
    
    if npx playwright list-files 2>/dev/null | grep -q "firefox"; then
        check_ok "Browser Firefox instalado"
    else
        check_warn "Browser Firefox não encontrado"
    fi
else
    check_warn "Cache de browsers não encontrado - execute: npx playwright install"
fi

echo ""
echo "📁 4. VERIFICANDO ESTRUTURA DE TESTES..."
echo ""

# Verificar diretório de testes
if [ -d tests/e2e ]; then
    check_ok "Diretório tests/e2e/ existe"
    
    # Contar arquivos de teste
    TEST_COUNT=$(find tests/e2e -name "*.spec.ts" | wc -l)
    check_ok "Encontrados $TEST_COUNT arquivo(s) de teste"
    
    # Verificar global-setup
    if [ -f tests/e2e/global-setup.ts ]; then
        check_ok "global-setup.ts encontrado"
    else
        check_warn "global-setup.ts não encontrado"
    fi
    
    # Verificar storageState
    if [ -f tests/e2e/storageState.json ]; then
        check_ok "storageState.json existe (sessão salva)"
    else
        check_warn "storageState.json não existe (será criado no primeiro teste)"
    fi
else
    check_error "Diretório tests/e2e/ não encontrado"
fi

# Verificar playwright.config.ts
if [ -f playwright.config.ts ]; then
    check_ok "playwright.config.ts encontrado"
else
    check_error "playwright.config.ts não encontrado"
fi

echo ""
echo "🔧 5. VERIFICANDO SCRIPTS NPM..."
echo ""

# Verificar scripts no package.json
if grep -q "\"test:e2e\"" package.json; then
    check_ok "Script test:e2e configurado"
else
    check_error "Script test:e2e não encontrado no package.json"
fi

if grep -q "\"test:e2e:headed\"" package.json; then
    check_ok "Script test:e2e:headed configurado"
else
    check_warn "Script test:e2e:headed não encontrado"
fi

if grep -q "\"test:e2e:debug\"" package.json; then
    check_ok "Script test:e2e:debug configurado"
else
    check_warn "Script test:e2e:debug não encontrado"
fi

echo ""
echo "🌍 6. VERIFICANDO CONECTIVIDADE..."
echo ""

# Verificar se servidor dev está rodando
if curl -s http://127.0.0.1:5173 >/dev/null 2>&1; then
    check_ok "Servidor dev respondendo em http://127.0.0.1:5173"
else
    check_warn "Servidor dev não está rodando (será iniciado automaticamente)"
fi

# Verificar API health
if curl -s http://127.0.0.1:5173/api/health >/dev/null 2>&1; then
    check_ok "API /api/health respondendo"
else
    check_warn "API /api/health não respondendo"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO DA VALIDAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ Sucessos: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARNINGS${NC}"
echo -e "${RED}❌ Erros: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ SISTEMA PRONTO PARA TESTES E2E!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🚀 COMANDOS DISPONÍVEIS:"
    echo "   npm run test:e2e          # Executar testes (headless)"
    echo "   npm run test:e2e:headed   # Ver browser durante testes"
    echo "   npm run test:e2e:debug    # Modo debug com inspector"
    echo "   npm run test:e2e:ui       # Interface interativa"
    echo "   npm run test:e2e:auto     # Script automático com setup"
    echo ""
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${RED}❌ CORREÇÕES NECESSÁRIAS${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🔧 AÇÕES SUGERIDAS:"
    
    if [ ! -f .env ]; then
        echo "   1. cp .env.example .env"
    fi
    
    if ! npx playwright --version &>/dev/null 2>&1; then
        echo "   2. npm install"
    fi
    
    if ! npx playwright list-files 2>/dev/null | grep -q "chromium"; then
        echo "   3. npx playwright install chromium firefox"
    fi
    
    echo ""
    echo "   Após correções, execute novamente: ./validate-e2e-setup.sh"
    echo ""
    exit 1
fi
