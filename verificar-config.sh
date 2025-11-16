#!/bin/bash

# Script de verificação de configuração do Spark Runtime
# Este script verifica se as variáveis de ambiente necessárias estão configuradas

echo "🔍 Verificando configuração do Spark Runtime..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

# Função para verificar variável de ambiente
check_env() {
    local var_name=$1
    local var_value=${!var_name}
    local is_required=${2:-true}
    
    if [ -z "$var_value" ]; then
        if [ "$is_required" = true ]; then
            echo -e "${RED}✗${NC} $var_name: ${RED}NÃO CONFIGURADA${NC} (obrigatória)"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠${NC} $var_name: não configurada (opcional)"
            ((WARNINGS++))
        fi
    else
        # Mascarar valores sensíveis
        if [[ $var_name == *"TOKEN"* ]] || [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"KEY"* ]]; then
            local masked_value="${var_value:0:8}..."
            echo -e "${GREEN}✓${NC} $var_name: configurada ($masked_value)"
        else
            echo -e "${GREEN}✓${NC} $var_name: $var_value"
        fi
    fi
}

echo "📋 Verificando variáveis obrigatórias para Vercel:"
echo ""

# Verificar variáveis obrigatórias
check_env "GITHUB_TOKEN" true
check_env "GITHUB_RUNTIME_PERMANENT_NAME" true
check_env "GITHUB_API_URL" false

echo ""
echo "📋 Verificando variáveis opcionais:"
echo ""

# Verificar variáveis opcionais
check_env "VITE_GOOGLE_CLIENT_ID" false
check_env "VITE_GOOGLE_API_KEY" false
check_env "VITE_DATAJUD_API_KEY" false

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar runtime.config.json
if [ -f "runtime.config.json" ]; then
    RUNTIME_ID=$(grep -o '"app": "[^"]*"' runtime.config.json | cut -d'"' -f4)
    if [ ! -z "$RUNTIME_ID" ]; then
        echo -e "${GREEN}✓${NC} runtime.config.json encontrado"
        echo "  Runtime ID: $RUNTIME_ID"
        
        # Comparar com variável de ambiente
        if [ ! -z "$GITHUB_RUNTIME_PERMANENT_NAME" ] && [ "$GITHUB_RUNTIME_PERMANENT_NAME" != "$RUNTIME_ID" ]; then
            echo -e "${YELLOW}⚠${NC} AVISO: GITHUB_RUNTIME_PERMANENT_NAME ($GITHUB_RUNTIME_PERMANENT_NAME) diferente do runtime.config.json ($RUNTIME_ID)"
            ((WARNINGS++))
        fi
    fi
else
    echo -e "${RED}✗${NC} runtime.config.json não encontrado"
    ((ERRORS++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Resumo
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as configurações estão corretas!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Adicione estas variáveis no Vercel (Settings → Environment Variables)"
    echo "2. Faça o redeploy do aplicativo"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuração completa com $WARNINGS aviso(s)${NC}"
    echo ""
    echo "As variáveis obrigatórias estão configuradas, mas há avisos."
    echo "Verifique as mensagens acima."
    exit 0
else
    echo -e "${RED}❌ Encontrados $ERRORS erro(s) e $WARNINGS aviso(s)${NC}"
    echo ""
    echo "Para corrigir os erros:"
    echo "1. Leia o arquivo LEIA_URGENTE.md"
    echo "2. Configure as variáveis de ambiente faltantes"
    echo "3. Execute este script novamente para verificar"
    exit 1
fi
