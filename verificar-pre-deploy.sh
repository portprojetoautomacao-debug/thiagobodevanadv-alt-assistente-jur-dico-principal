#!/bin/bash

# Script de Verificação de Deploy
# Verifica se todas as configurações necessárias estão corretas antes de fazer deploy

echo "🔍 Verificando configurações para deploy..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0
SUCCESS=0

# Função para verificar arquivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Arquivo encontrado: $1"
        ((SUCCESS++))
        return 0
    else
        echo -e "${RED}✗${NC} Arquivo não encontrado: $1"
        ((ERRORS++))
        return 1
    fi
}

# Função para verificar conteúdo
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $3"
        ((SUCCESS++))
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $3 - Não encontrado"
        ((WARNINGS++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 1. Arquivos de Configuração"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "package.json"
check_file "vite.config.ts"
check_file ".env.example"
check_file "render.yaml"
check_file "netlify.toml"
check_file "vercel.json"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 2. package.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_content "package.json" '"build".*vite build' "Build script configurado"
check_content "package.json" '"start".*serve' "Start script configurado"
check_content "package.json" '"node".*20' "Node.js 20 especificado"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌍 3. Variáveis de Ambiente"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Arquivo .env encontrado (para desenvolvimento local)"
    ((SUCCESS++))
    
    # Verificar variáveis críticas
    check_content ".env" "VITE_GOOGLE_CLIENT_ID" "VITE_GOOGLE_CLIENT_ID definida"
    check_content ".env" "VITE_REDIRECT_URI" "VITE_REDIRECT_URI definida"
    check_content ".env" "GITHUB_TOKEN" "GITHUB_TOKEN definida"
    check_content ".env" "GITHUB_RUNTIME_PERMANENT_NAME" "GITHUB_RUNTIME_PERMANENT_NAME definida"
else
    echo -e "${YELLOW}⚠${NC} Arquivo .env não encontrado (normal para CI/CD)"
    echo "   Para desenvolvimento local, copie .env.example para .env"
    ((WARNINGS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  4. Build do Projeto"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Tentando fazer build do projeto..."
if npm run build > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓${NC} Build executado com sucesso!"
    ((SUCCESS++))
    
    # Verificar se a pasta dist foi criada
    if [ -d "dist" ]; then
        echo -e "${GREEN}✓${NC} Pasta dist/ criada"
        ((SUCCESS++))
        
        # Verificar se index.html existe
        if [ -f "dist/index.html" ]; then
            echo -e "${GREEN}✓${NC} dist/index.html encontrado"
            ((SUCCESS++))
        else
            echo -e "${RED}✗${NC} dist/index.html não encontrado"
            ((ERRORS++))
        fi
        
        # Contar arquivos gerados
        ASSET_COUNT=$(find dist -type f | wc -l)
        echo -e "${BLUE}ℹ${NC} Total de arquivos gerados: $ASSET_COUNT"
    else
        echo -e "${RED}✗${NC} Pasta dist/ não foi criada"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Erro ao fazer build do projeto"
    echo "Veja o log completo em: /tmp/build.log"
    ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 5. Documentação de Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_file "GUIA_DEPLOY_RENDER.md"
check_file "GUIA_DEPLOY_NETLIFY.md"
check_file "GUIA_DEPLOY_RAILWAY.md"
check_file "PLATAFORMAS_DEPLOY_GRATIS.md"
check_file "ESCOLHA_PLATAFORMA_DEPLOY.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESUMO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✓${NC} Sucessos: $SUCCESS"
echo -e "${YELLOW}⚠${NC} Avisos: $WARNINGS"
echo -e "${RED}✗${NC} Erros: $ERRORS"

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ TUDO PRONTO PARA DEPLOY!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════${NC}"
    echo ""
    echo "📖 Próximos passos:"
    echo ""
    echo "1. Escolha sua plataforma:"
    echo "   → Render: GUIA_DEPLOY_RENDER.md"
    echo "   → Netlify: GUIA_DEPLOY_NETLIFY.md"
    echo "   → Railway: GUIA_DEPLOY_RAILWAY.md"
    echo "   → Vercel: GUIA_RAPIDO_DEPLOY.md"
    echo ""
    echo "2. Ou veja a comparação:"
    echo "   → ESCOLHA_PLATAFORMA_DEPLOY.md"
    echo "   → PLATAFORMAS_DEPLOY_GRATIS.md"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════${NC}"
    echo -e "${RED}❌ EXISTEM ERROS QUE PRECISAM SER CORRIGIDOS${NC}"
    echo -e "${RED}════════════════════════════════════════════════${NC}"
    echo ""
    echo "Por favor, corrija os erros acima antes de fazer deploy."
    echo ""
    exit 1
fi
