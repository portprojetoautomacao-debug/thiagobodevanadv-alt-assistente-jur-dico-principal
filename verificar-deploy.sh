#!/bin/bash

# ============================================================================
# Script de Verificação Pré-Deploy - Assistente Jurídico PJe
# ============================================================================
# Este script verifica se tudo está pronto para o deployment na Vercel
# Execute antes de fazer o deploy: ./verificar-deploy.sh
# ============================================================================

set -e

echo "======================================================================"
echo "🔍 Verificação Pré-Deploy - Assistente Jurídico PJe"
echo "======================================================================"
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

# Função para log de sucesso
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((SUCCESS++))
}

# Função para log de erro
log_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# Função para log de aviso
log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Função para log de info
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verificando Arquivos de Configuração"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar package.json
if [ -f "package.json" ]; then
    log_success "package.json encontrado"
else
    log_error "package.json não encontrado"
fi

# Verificar vercel.json
if [ -f "vercel.json" ]; then
    log_success "vercel.json encontrado"
else
    log_error "vercel.json não encontrado"
fi

# Verificar runtime.config.json
if [ -f "runtime.config.json" ]; then
    log_success "runtime.config.json encontrado"
    
    # Extrair app name
    RUNTIME_NAME=$(cat runtime.config.json | grep -o '"app": *"[^"]*"' | sed 's/"app": *"\([^"]*\)"/\1/')
    if [ -n "$RUNTIME_NAME" ]; then
        log_info "  Runtime name: $RUNTIME_NAME"
    else
        log_warning "  Não foi possível extrair runtime name"
    fi
else
    log_error "runtime.config.json não encontrado"
fi

# Verificar .env.example
if [ -f ".env.example" ]; then
    log_success ".env.example encontrado"
else
    log_warning ".env.example não encontrado (não é crítico)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Verificando Estrutura de Diretórios"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar diretório src
if [ -d "src" ]; then
    log_success "Diretório src/ encontrado"
else
    log_error "Diretório src/ não encontrado"
fi

# Verificar diretório api
if [ -d "api" ]; then
    log_success "Diretório api/ encontrado"
    
    # Verificar arquivos essenciais da API
    if [ -f "api/kv.ts" ]; then
        log_success "  api/kv.ts encontrado"
    else
        log_error "  api/kv.ts não encontrado"
    fi
    
    if [ -f "api/llm-proxy.ts" ] || [ -f "api/llm-proxy.js" ]; then
        log_success "  api/llm-proxy encontrado"
    else
        log_error "  api/llm-proxy não encontrado"
    fi
    
    if [ -f "api/spark-proxy.ts" ] || [ -f "api/spark-proxy.js" ]; then
        log_success "  api/spark-proxy encontrado"
    else
        log_error "  api/spark-proxy não encontrado"
    fi
else
    log_error "Diretório api/ não encontrado"
fi

# Verificar node_modules
if [ -d "node_modules" ]; then
    log_success "node_modules/ encontrado (dependências instaladas)"
else
    log_warning "node_modules/ não encontrado - execute 'npm install'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Verificando Configuração do Package.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar script de build
if grep -q '"build"' package.json; then
    BUILD_SCRIPT=$(grep '"build"' package.json | head -1)
    log_success "Script 'build' definido"
    log_info "  $BUILD_SCRIPT"
else
    log_error "Script 'build' não definido em package.json"
fi

# Verificar engines
if grep -q '"engines"' package.json; then
    log_success "Engines definidos"
    NODE_VERSION=$(grep -A 2 '"engines"' package.json | grep '"node"' | sed 's/.*: *"\([^"]*\)".*/\1/')
    if [ -n "$NODE_VERSION" ]; then
        log_info "  Node.js: $NODE_VERSION"
    fi
else
    log_warning "Engines não definidos (recomendado especificar versão do Node)"
fi

# Verificar type: module
if grep -q '"type": *"module"' package.json; then
    log_success "Type 'module' configurado (ES modules)"
else
    log_warning "Type 'module' não configurado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Testando Build Local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Executando npm run build..."

# Executar build
if npm run build > /tmp/build.log 2>&1; then
    log_success "Build executado com sucesso"
    
    # Verificar se dist foi criado
    if [ -d "dist" ]; then
        log_success "Diretório dist/ criado"
        
        # Verificar index.html
        if [ -f "dist/index.html" ]; then
            log_success "  dist/index.html criado"
        else
            log_error "  dist/index.html não encontrado"
        fi
        
        # Contar arquivos em dist
        FILE_COUNT=$(find dist -type f | wc -l)
        log_info "  Total de arquivos: $FILE_COUNT"
    else
        log_error "Diretório dist/ não foi criado"
    fi
else
    log_error "Build falhou - veja os erros em /tmp/build.log"
    echo ""
    echo "Últimas 20 linhas do log de build:"
    tail -20 /tmp/build.log
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Verificando Segurança (npm audit)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AUDIT_OUTPUT=$(npm audit --json)
VULNERABILITIES=$(echo "$AUDIT_OUTPUT" | grep -o '"total":[0-9]*' | tail -1 | sed 's/"total"://')

if [ "$VULNERABILITIES" = "0" ]; then
    log_success "Nenhuma vulnerabilidade encontrada"
else
    log_warning "$VULNERABILITIES vulnerabilidades encontradas"
    log_info "Execute 'npm audit' para detalhes"
    log_info "Execute 'npm audit fix' para tentar correção automática"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. Checklist de Variáveis de Ambiente para Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_info "Variáveis OBRIGATÓRIAS que devem estar na Vercel:"
echo ""
echo "  1. GITHUB_RUNTIME_PERMANENT_NAME"
if [ -n "$RUNTIME_NAME" ]; then
    echo "     Valor sugerido: $RUNTIME_NAME"
    echo "     (extraído de runtime.config.json)"
else
    echo "     Valor: <verificar runtime.config.json>"
fi
echo ""
echo "  2. GITHUB_TOKEN"
echo "     Obter em: https://github.com/settings/tokens"
echo "     Escopos necessários: repo, workflow"
echo ""

log_info "Variáveis OPCIONAIS (recomendadas para produção):"
echo ""
echo "  3. VITE_GOOGLE_CLIENT_ID (para Google OAuth)"
echo "  4. VITE_REDIRECT_URI (URL do seu app Vercel)"
echo "  5. VITE_APP_ENV=production"
echo ""

log_warning "IMPORTANTE: Certifique-se de adicionar essas variáveis na Vercel ANTES do deploy!"
log_info "Acesse: https://vercel.com/dashboard → Seu Projeto → Settings → Environment Variables"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Resumo da Verificação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}Sucessos:${NC} $SUCCESS"
echo -e "${YELLOW}Avisos:${NC} $WARNINGS"
echo -e "${RED}Erros:${NC} $ERRORS"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Projeto pronto para deploy na Vercel!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Verifique se as variáveis de ambiente estão configuradas na Vercel"
    echo "2. Execute: vercel --prod"
    echo "   OU faça push para o GitHub (se tiver CI/CD configurado)"
    echo ""
    echo "📚 Documentação: VERCEL_ENV_CHECKLIST.md"
    exit 0
else
    echo -e "${RED}✗ Projeto tem problemas que precisam ser resolvidos${NC}"
    echo ""
    echo "Corrija os erros acima antes de fazer o deploy."
    exit 1
fi
