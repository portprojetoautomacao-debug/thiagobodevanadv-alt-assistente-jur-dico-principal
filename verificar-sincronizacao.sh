#!/bin/bash

# Script de Verificação de Sincronização e Configuração
# Este script verifica se o projeto está corretamente configurado para sincronização

echo "🔍 Verificando configuração do projeto..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
OK=0
WARN=0
ERROR=0

# Função para verificação
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((OK++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((ERROR++))
    fi
}

check_warn() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((OK++))
    else
        echo -e "${YELLOW}⚠️  $2${NC}"
        ((WARN++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 VERIFICAÇÃO DE ARQUIVOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica se .env existe
if [ -f ".env" ]; then
    check 0 "Arquivo .env existe"
else
    check 1 "Arquivo .env NÃO encontrado"
    echo -e "   ${BLUE}→ Execute: cp .env.example .env${NC}"
fi

# Verifica se .gitignore existe
if [ -f ".gitignore" ]; then
    check 0 "Arquivo .gitignore existe"
else
    check 1 "Arquivo .gitignore NÃO encontrado"
fi

# Verifica se .env está no .gitignore
if grep -q "^\.env$" .gitignore 2>/dev/null; then
    check 0 ".env está protegido no .gitignore"
else
    check 1 ".env NÃO está no .gitignore (RISCO DE SEGURANÇA!)"
    echo -e "   ${BLUE}→ Execute: echo '.env' >> .gitignore${NC}"
fi

# Verifica se package.json existe
if [ -f "package.json" ]; then
    check 0 "package.json existe"
else
    check 1 "package.json NÃO encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    # Verifica VITE_GEMINI_API_KEY (obrigatória)
    if grep -q "^VITE_GEMINI_API_KEY=AIza" .env 2>/dev/null; then
        check 0 "VITE_GEMINI_API_KEY configurada"
    elif grep -q "^VITE_GEMINI_API_KEY=" .env 2>/dev/null; then
        check 1 "VITE_GEMINI_API_KEY existe mas parece inválida"
        echo -e "   ${BLUE}→ Obtenha em: https://aistudio.google.com/app/apikey${NC}"
    else
        check 1 "VITE_GEMINI_API_KEY NÃO configurada"
        echo -e "   ${BLUE}→ Obtenha em: https://aistudio.google.com/app/apikey${NC}"
    fi

    # Verifica variáveis opcionais
    if grep -q "^VITE_GOOGLE_CLIENT_ID=" .env 2>/dev/null; then
        check_warn 0 "VITE_GOOGLE_CLIENT_ID configurada (opcional)"
    else
        check_warn 1 "VITE_GOOGLE_CLIENT_ID não configurada (opcional)"
    fi

    if grep -q "^VITE_DATAJUD_API_KEY=" .env 2>/dev/null; then
        check_warn 0 "VITE_DATAJUD_API_KEY configurada (opcional)"
    else
        check_warn 1 "VITE_DATAJUD_API_KEY não configurada (opcional)"
    fi
else
    echo -e "${RED}❌ Arquivo .env não encontrado - impossível verificar variáveis${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 VERIFICAÇÃO DO GIT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica se Git está inicializado
if [ -d ".git" ]; then
    check 0 "Repositório Git inicializado"
    
    # Verifica remote
    if git remote -v | grep -q "origin"; then
        REMOTE_URL=$(git remote get-url origin)
        check 0 "Remote 'origin' configurado"
        echo -e "   ${BLUE}→ URL: $REMOTE_URL${NC}"
    else
        check 1 "Remote 'origin' NÃO configurado"
        echo -e "   ${BLUE}→ Execute: git remote add origin https://github.com/USER/REPO.git${NC}"
    fi
    
    # Verifica branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    if [ ! -z "$CURRENT_BRANCH" ]; then
        check 0 "Branch atual: $CURRENT_BRANCH"
    else
        check_warn 1 "Nenhuma branch ativa"
    fi
    
    # Verifica status
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        check 0 "Nenhuma alteração pendente"
    else
        check_warn 1 "Existem alterações não commitadas"
        echo -e "   ${BLUE}→ Execute: git status${NC}"
    fi
else
    check 1 "Git NÃO inicializado"
    echo -e "   ${BLUE}→ Execute: git init${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 VERIFICAÇÃO DE DEPENDÊNCIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verifica se node_modules existe
if [ -d "node_modules" ]; then
    check 0 "node_modules existe"
else
    check 1 "node_modules NÃO encontrado"
    echo -e "   ${BLUE}→ Execute: npm install${NC}"
fi

# Verifica se o comando npm existe
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check 0 "npm instalado (v$NPM_VERSION)"
else
    check 1 "npm NÃO instalado"
fi

# Verifica se o comando node existe
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check 0 "Node.js instalado ($NODE_VERSION)"
else
    check 1 "Node.js NÃO instalado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✅ OK: $OK${NC}"
echo -e "${YELLOW}⚠️  Avisos: $WARN${NC}"
echo -e "${RED}❌ Erros: $ERROR${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 PRÓXIMOS PASSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERROR -gt 0 ]; then
    echo -e "${RED}Existem problemas críticos que precisam ser resolvidos!${NC}"
    echo ""
    echo "📖 Para mais informações, consulte:"
    echo "   → SINCRONIZACAO_REPOSITORIO.md"
    echo "   → GEMINI_QUICK_START.md"
    echo ""
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}Configuração básica OK, mas algumas funcionalidades opcionais não estão configuradas.${NC}"
    echo ""
    echo "Para configurar funcionalidades opcionais:"
    echo "   → Google OAuth: OAUTH_SETUP.md"
    echo "   → DataJud API: DATAJUD_SETUP.md"
    echo ""
else
    echo -e "${GREEN}🎉 Tudo configurado corretamente!${NC}"
    echo ""
    echo "Você pode iniciar o desenvolvimento:"
    echo "   → npm run dev"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 DOCUMENTAÇÃO ÚTIL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "• Sincronização: SINCRONIZACAO_REPOSITORIO.md"
echo "• Gemini API: GEMINI_QUICK_START.md"
echo "• Deploy Vercel: VERCEL_DEPLOYMENT.md"
echo "• Status Geral: STATUS.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
