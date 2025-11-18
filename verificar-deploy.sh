#!/bin/bash

# =============================================================================
# Script de Verificação de Configuração de Deploy - Assistente Jurídico PJe
# =============================================================================
# Este script verifica se tudo está configurado corretamente para deploy
# Uso: ./verificar-deploy.sh
# =============================================================================

# Don't exit on error - we want to collect all issues
set +e

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

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  Verificação de Configuração de Deploy${NC}"
echo -e "${BLUE}  Assistente Jurídico PJe${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""

# Função para imprimir sucesso
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((SUCCESS++))
}

# Função para imprimir erro
print_error() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

# Função para imprimir aviso
print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Função para imprimir info
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# =============================================================================
# 1. Verificar Node.js e npm
# =============================================================================
echo -e "\n${BLUE}[1/8] Verificando Node.js e npm...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js instalado: $NODE_VERSION"
    
    # Verificar se é v20.x
    if [[ $NODE_VERSION == v20.* ]]; then
        print_success "Versão do Node.js compatível (20.x)"
    else
        print_warning "Versão do Node.js não é 20.x (encontrado: $NODE_VERSION)"
        print_info "Considere usar Node.js 20.x para consistência com produção"
    fi
else
    print_error "Node.js não encontrado. Instale: https://nodejs.org"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm instalado: $NPM_VERSION"
    
    # Verificar se npm >= 10.0.0
    NPM_MAJOR=$(echo $NPM_VERSION | cut -d. -f1)
    if [ "$NPM_MAJOR" -ge 10 ]; then
        print_success "Versão do npm compatível (>=10.0.0)"
    else
        print_warning "npm versão < 10.0.0. Considere atualizar: npm install -g npm@latest"
    fi
else
    print_error "npm não encontrado"
fi

# =============================================================================
# 2. Verificar arquivos de configuração essenciais
# =============================================================================
echo -e "\n${BLUE}[2/8] Verificando arquivos de configuração...${NC}"

if [ -f "package.json" ]; then
    print_success "package.json encontrado"
    
    # Verificar engines
    if grep -q '"node".*"20.x"' package.json; then
        print_success "Node engine configurado para 20.x"
    else
        print_warning "Node engine não está configurado para 20.x"
    fi
else
    print_error "package.json não encontrado"
fi

if [ -f "vercel.json" ]; then
    print_success "vercel.json encontrado"
    
    # Verificar buildCommand
    if grep -q '"buildCommand"' vercel.json; then
        print_success "buildCommand configurado"
    else
        print_warning "buildCommand não encontrado no vercel.json"
    fi
    
    # Verificar outputDirectory
    if grep -q '"outputDirectory".*"dist"' vercel.json; then
        print_success "outputDirectory configurado para 'dist'"
    else
        print_warning "outputDirectory pode não estar configurado corretamente"
    fi
else
    print_error "vercel.json não encontrado"
fi

if [ -f "runtime.config.json" ]; then
    print_success "runtime.config.json encontrado"
    
    # Extrair app ID
    if command -v jq &> /dev/null; then
        APP_ID=$(jq -r '.app' runtime.config.json 2>/dev/null)
        if [ -n "$APP_ID" ] && [ "$APP_ID" != "null" ]; then
            print_success "Runtime app ID: $APP_ID"
        else
            print_error "app ID não encontrado no runtime.config.json"
        fi
    else
        print_info "Instale 'jq' para validação mais detalhada: sudo apt-get install jq"
    fi
else
    print_error "runtime.config.json não encontrado"
fi

if [ -f ".env.example" ]; then
    print_success ".env.example encontrado"
else
    print_warning ".env.example não encontrado (recomendado para documentação)"
fi

# =============================================================================
# 3. Verificar .gitignore
# =============================================================================
echo -e "\n${BLUE}[3/8] Verificando .gitignore...${NC}"

if [ -f ".gitignore" ]; then
    print_success ".gitignore encontrado"
    
    # Verificar entradas importantes
    if grep -q "^\.env$\|^\.env\.local$" .gitignore; then
        print_success ".env está no .gitignore (segurança OK)"
    else
        print_error ".env NÃO está no .gitignore - RISCO DE SEGURANÇA!"
        print_info "Adicione '.env' ao .gitignore imediatamente"
    fi
    
    if grep -q "node_modules" .gitignore; then
        print_success "node_modules está no .gitignore"
    else
        print_warning "node_modules deveria estar no .gitignore"
    fi
    
    if grep -q "dist" .gitignore; then
        print_success "dist está no .gitignore"
    else
        print_warning "dist deveria estar no .gitignore"
    fi
else
    print_error ".gitignore não encontrado"
fi

# =============================================================================
# 4. Verificar dependências
# =============================================================================
echo -e "\n${BLUE}[4/8] Verificando dependências...${NC}"

if [ -d "node_modules" ]; then
    print_success "node_modules encontrado"
else
    print_warning "node_modules não encontrado. Execute: npm install"
fi

if [ -f "package-lock.json" ]; then
    print_success "package-lock.json encontrado"
else
    print_warning "package-lock.json não encontrado. Execute: npm install"
fi

# =============================================================================
# 5. Verificar estrutura de diretórios
# =============================================================================
echo -e "\n${BLUE}[5/8] Verificando estrutura de diretórios...${NC}"

if [ -d "src" ]; then
    print_success "Diretório src/ encontrado"
else
    print_error "Diretório src/ não encontrado"
fi

if [ -d "api" ]; then
    print_success "Diretório api/ encontrado (serverless functions)"
else
    print_warning "Diretório api/ não encontrado"
fi

if [ -f "index.html" ]; then
    print_success "index.html encontrado"
else
    print_error "index.html não encontrado"
fi

# =============================================================================
# 6. Testar build local
# =============================================================================
echo -e "\n${BLUE}[6/8] Testando build local...${NC}"

if [ -d "node_modules" ]; then
    print_info "Executando npm run build..."
    
    if npm run build &> /tmp/build-output.log; then
        print_success "Build executado com sucesso"
        
        # Verificar se dist foi criado
        if [ -d "dist" ]; then
            print_success "Diretório dist/ criado"
            
            # Verificar arquivos essenciais em dist
            if [ -f "dist/index.html" ]; then
                print_success "dist/index.html criado"
            else
                print_error "dist/index.html não foi criado"
            fi
            
            if ls dist/assets/*.js 1> /dev/null 2>&1; then
                print_success "Arquivos JavaScript gerados em dist/assets/"
            else
                print_error "Arquivos JavaScript não foram gerados"
            fi
            
            if ls dist/assets/*.css 1> /dev/null 2>&1; then
                print_success "Arquivos CSS gerados em dist/assets/"
            else
                print_warning "Arquivos CSS não foram gerados"
            fi
        else
            print_error "Diretório dist/ não foi criado após build"
        fi
    else
        print_error "Build falhou. Verifique os erros em /tmp/build-output.log"
        print_info "Execute: npm run build"
        ((ERRORS++))
    fi
else
    print_warning "Pulando teste de build (execute npm install primeiro)"
fi

# =============================================================================
# 7. Verificar vulnerabilidades
# =============================================================================
echo -e "\n${BLUE}[7/8] Verificando vulnerabilidades de segurança...${NC}"

if [ -d "node_modules" ]; then
    print_info "Executando npm audit..."
    
    # Executar npm audit e capturar resultado
    AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || true)
    
    if command -v jq &> /dev/null; then
        VULNS=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.total' 2>/dev/null || echo "0")
        HIGH=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.high' 2>/dev/null || echo "0")
        CRITICAL=$(echo "$AUDIT_OUTPUT" | jq -r '.metadata.vulnerabilities.critical' 2>/dev/null || echo "0")
        
        if [ "$VULNS" = "0" ] || [ -z "$VULNS" ]; then
            print_success "Nenhuma vulnerabilidade encontrada"
        else
            if [ "$CRITICAL" != "0" ] && [ -n "$CRITICAL" ]; then
                print_error "$CRITICAL vulnerabilidades CRÍTICAS encontradas"
            fi
            if [ "$HIGH" != "0" ] && [ -n "$HIGH" ]; then
                print_error "$HIGH vulnerabilidades HIGH encontradas"
            fi
            print_warning "Total de $VULNS vulnerabilidades. Execute: npm audit fix"
        fi
    else
        # Fallback sem jq
        if npm audit | grep -q "found 0 vulnerabilities"; then
            print_success "Nenhuma vulnerabilidade encontrada"
        else
            print_warning "Vulnerabilidades detectadas. Execute: npm audit"
        fi
    fi
else
    print_warning "Pulando audit (execute npm install primeiro)"
fi

# =============================================================================
# 8. Verificar variáveis de ambiente
# =============================================================================
echo -e "\n${BLUE}[8/8] Verificando variáveis de ambiente...${NC}"

print_info "Verificando variáveis necessárias no .env.example..."

# Variáveis críticas
declare -a CRITICAL_VARS=(
    "GITHUB_RUNTIME_PERMANENT_NAME"
    "GITHUB_TOKEN"
)

declare -a RECOMMENDED_VARS=(
    "VITE_GOOGLE_CLIENT_ID"
    "VITE_REDIRECT_URI"
    "VITE_APP_ENV"
)

if [ -f ".env.example" ]; then
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "^$var=" .env.example || grep -q "^# $var=" .env.example; then
            print_success "$var documentado em .env.example"
        else
            print_warning "$var não encontrado em .env.example"
        fi
    done
    
    for var in "${RECOMMENDED_VARS[@]}"; do
        if grep -q "^$var=" .env.example || grep -q "^# $var=" .env.example || grep -q "^VITE_" .env.example; then
            print_info "$var documentado (opcional)"
        fi
    done
else
    print_warning ".env.example não encontrado para verificação"
fi

# Verificar se existe .env local (não deve ser commitado)
if [ -f ".env" ]; then
    print_info "Arquivo .env encontrado (OK para desenvolvimento local)"
    
    # Verificar se está no .gitignore
    if git check-ignore .env &> /dev/null; then
        print_success ".env está sendo ignorado pelo git (seguro)"
    else
        print_error ".env NÃO está sendo ignorado pelo git - RISCO DE SEGURANÇA!"
    fi
else
    print_info "Arquivo .env não encontrado (será necessário para desenvolvimento local)"
fi

# =============================================================================
# Resumo Final
# =============================================================================
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}  Resumo da Verificação${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "Sucessos:  ${GREEN}$SUCCESS${NC}"
echo -e "Avisos:    ${YELLOW}$WARNINGS${NC}"
echo -e "Erros:     ${RED}$ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✓ TUDO OK!${NC} Seu projeto está pronto para deploy."
        echo ""
        echo -e "Próximos passos:"
        echo -e "  1. Configure variáveis de ambiente no Vercel"
        echo -e "  2. Execute: ${BLUE}git push${NC} para fazer deploy"
        echo -e "  3. Monitore o build em: https://vercel.com/dashboard"
    else
        echo -e "${YELLOW}⚠ ATENÇÃO!${NC} Projeto OK mas há $WARNINGS avisos."
        echo -e "Revise os avisos acima antes de fazer deploy."
    fi
else
    echo -e "${RED}✗ ERROS ENCONTRADOS!${NC}"
    echo -e "Corrija os $ERRORS erros acima antes de fazer deploy."
    exit 1
fi

echo ""
echo -e "Documentação completa: ${BLUE}GUIA_DEPLOY_VERCEL_COMPLETO.md${NC}"
echo ""
