#!/bin/bash

# Script para verificar configuração dos secrets avançados no GitHub Actions
# Execute após configurar os secrets manualmente

echo "🔍 Verificando configuração dos secrets avançados..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Função para verificar se o secret existe (simulação)
check_secret() {
    local secret_name=$1
    echo -e "${YELLOW}ℹ️${NC}  Verificando secret: $secret_name"
    echo -e "${YELLOW}📝${NC} Para verificar se '$secret_name' foi configurado:"
    echo "   1. Vá para: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets/actions"
    echo "   2. Procure por '$secret_name' na lista"
    echo "   3. Se existir, está ✅ configurado"
    echo ""
}

echo "📋 Secrets necessários para funcionalidades avançadas:"
echo ""

check_secret "AUTO_ROLLBACK_ENABLED"
check_secret "NOTIFICATION_WEBHOOK_URL"

echo "🎯 Funcionalidades que serão ativadas:"
echo ""
echo "✅ Rollback automático em caso de falha de deployment"
echo "✅ Notificações via webhook (Slack/Discord/Teams)"
echo "✅ Métricas detalhadas de deployment"
echo ""

echo "🧪 Como testar:"
echo ""
echo "1. Faça um push para a branch main"
echo "2. Vá para Actions no GitHub"
echo "3. Observe o workflow 'vercel-webhook-automation.yml'"
echo "4. Verifique se as notificações chegam no seu canal"
echo ""

echo "📖 Documentação completa: GITHUB_SECRETS_SETUP.md"