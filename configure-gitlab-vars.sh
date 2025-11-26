#!/bin/bash
# Script completo para configurar TODAS as variáveis no GitLab CI/CD

set -e

echo "🔧 Configurando TODAS as variáveis no GitLab CI/CD..."
echo ""

# Solicitar token do GitLab
if [ -f .gitlab-token ]; then
    source .gitlab-token
else
    echo "❌ Arquivo .gitlab-token não encontrado!"
    echo "Crie o arquivo com: echo 'GITLAB_TOKEN=seu-token-aqui' > .gitlab-token"
    exit 1
fi

PROJECT_ID=76287668

# Função para criar variável
create_variable() {
    local key="$1"
    local value="$2"
    local protected="${3:-false}"
    local masked="${4:-false}"

    echo "📝 Configurando: $key"

    response=$(curl -s -X POST \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        --header "Content-Type: application/json" \
        --data "{\"key\": \"$key\", \"value\": \"$value\", \"protected\": $protected, \"masked\": $masked}" \
        "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" 2>/dev/null)

    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "✅ $key configurada com sucesso"
    else
        echo "❌ Falha ao configurar $key"
    fi
}

echo "🔑 Configurando variáveis ESSENCIAIS..."
echo ""

# GitHub Integration
# NOTA: Defina GITHUB_TOKEN via variável de ambiente ou substitua pelo seu token
create_variable "GITHUB_TOKEN" "${GITHUB_TOKEN:-YOUR_GITHUB_TOKEN_HERE}" true true
create_variable "GITHUB_REPO_OWNER" "thiagobodevan-a11y" false false
create_variable "GITHUB_REPO_NAME" "assistente-juridico-p" false false

# GitLab
create_variable "GITLAB_TOKEN" "$GITLAB_TOKEN" true true

# Sistema
create_variable "NODE_ENV" "production" false false
create_variable "VERCEL_ENV" "production" false false

# Kubernetes
create_variable "KUBE_INGRESS_BASE_DOMAIN" "assistente-juridico-p.vercel.app" false false
create_variable "AUTO_DEVOPS_PLATFORM_TARGET" "kubernetes" false false
create_variable "AUTO_DEVOPS_DEPLOY_STRATEGY" "continuous" false false

echo ""
echo "🤖 Configurando variáveis dos AGENTES IA..."
echo ""

# Agentes
create_variable "AGENTS_ENABLED" "true" false false
create_variable "SPARK_KV_ENABLED" "true" false false

# DJEN
create_variable "DJEN_ENABLED" "true" false false
create_variable "DJEN_API_KEY" "" false true  # Deixe vazio para configurar manualmente

# APIs Jurídicas
create_variable "DATAJUD_API_KEY" "" false true
create_variable "PJE_CREDENTIALS" "" false true

# LLM
create_variable "GEMINI_API_KEY" "" false true

# WhatsApp
create_variable "EVOLUTION_API_URL" "" false false
create_variable "EVOLUTION_API_KEY" "" false true

# Todoist
create_variable "TODOIST_API_TOKEN" "" false true

# Redis
create_variable "UPSTASH_REDIS_REST_URL" "" false false
create_variable "UPSTASH_REDIS_REST_TOKEN" "" false true

echo ""
echo "🔐 Configurando variáveis de SEGURANÇA..."
echo ""

# Webhooks
create_variable "WEBHOOK_SECRET" "" true true
create_variable "VERCEL_WEBHOOK_SECRET" "" true true
create_variable "TODOIST_WEBHOOK_SECRET" "" true true

# Push Notifications
create_variable "VAPID_PUBLIC_KEY" "" false false

echo ""
echo "📱 Configurando variáveis do FRONTEND..."
echo ""

# Google OAuth (placeholders - configure manualmente)
create_variable "VITE_GOOGLE_CLIENT_ID" "" false false
create_variable "VITE_GOOGLE_API_KEY" "" false false
create_variable "VITE_REDIRECT_URI" "https://assistente-juridico-p.vercel.app" false false
create_variable "VITE_APP_ENV" "production" false false

# GitHub OAuth (opcional)
create_variable "VITE_GITHUB_OAUTH_CLIENT_ID" "" false false
create_variable "GITHUB_OAUTH_CLIENT_SECRET" "" false true

echo ""
echo "📊 Configurando variáveis de MONITORAMENTO..."
echo ""

create_variable "VITE_SENTRY_DSN" "https://glet_11997d8fcca1f917be020f0d22aa5175@observe.gitlab.com:443/errortracking/api/v1/projects/76299042" false false
create_variable "VITE_APP_VERSION" "1.0.0" false false

echo ""
echo "🔍 Verificando configuração..."
echo ""

# Verificar variáveis configuradas
VARIABLES=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
    "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables" 2>/dev/null)

COUNT=$(echo "$VARIABLES" | jq -r 'length' 2>/dev/null || echo "0")
echo "📊 Total de variáveis configuradas: $COUNT"

echo ""
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo ""
echo "1️⃣  CONFIGURAR VALORES MANUAIS:"
echo "   • VITE_GOOGLE_CLIENT_ID"
echo "   • VITE_GOOGLE_API_KEY" 
echo "   • GEMINI_API_KEY"
echo "   • DJEN_API_KEY"
echo "   • EVOLUTION_API_KEY"
echo "   • TODOIST_API_TOKEN"
echo "   • UPSTASH_REDIS_REST_*"
echo ""
echo "2️⃣  VERIFICAR CONFIGURAÇÃO:"
echo "   • Vá para: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/settings/ci_cd"
echo "   • Verifique se todas as variáveis foram criadas"
echo ""
echo "3️⃣  TESTAR PIPELINE:"
echo "   • Faça um commit para testar o pipeline"
echo ""
echo "⏰ Tempo estimado: 15-30 minutos"
