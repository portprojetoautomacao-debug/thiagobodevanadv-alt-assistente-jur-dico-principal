#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 VERIFICAÇÃO GitLab Auto DevOps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PROJECT_ID="thiagobodevan-a11y%2Fassistente-juridico-p"
GITLAB_TOKEN_FILE=".gitlab-token"

# Verificar se o token existe
if [ ! -f "$GITLAB_TOKEN_FILE" ]; then
    echo "❌ Token GitLab não encontrado em $GITLAB_TOKEN_FILE"
    echo ""
    echo "Para verificar a configuração, você precisa:"
    echo "1. Criar um Personal Access Token em: https://gitlab.com/-/profile/personal_access_tokens"
    echo "2. Salvar o token em: $GITLAB_TOKEN_FILE"
    echo "3. Executar este script novamente"
    echo ""
    exit 1
fi

GITLAB_TOKEN=$(cat "$GITLAB_TOKEN_FILE")

echo "✅ Token GitLab encontrado"
echo ""

# Verificar variáveis CI/CD
echo "📋 Verificando variáveis CI/CD..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/variables")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Erro ao buscar variáveis (HTTP $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    exit 1
fi

echo "✅ Variáveis CI/CD configuradas:"
echo ""

# Verificar KUBE_INGRESS_BASE_DOMAIN
if echo "$BODY" | jq -e '.[] | select(.key=="KUBE_INGRESS_BASE_DOMAIN")' > /dev/null 2>&1; then
    DOMAIN=$(echo "$BODY" | jq -r '.[] | select(.key=="KUBE_INGRESS_BASE_DOMAIN") | .value')
    echo "  ✅ KUBE_INGRESS_BASE_DOMAIN = $DOMAIN"
else
    echo "  ❌ KUBE_INGRESS_BASE_DOMAIN não configurada"
    echo ""
    echo "     Configure manualmente em:"
    echo "     https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/settings/ci_cd"
    echo ""
fi

# Listar todas as variáveis
echo ""
echo "📝 Todas as variáveis configuradas:"
echo "$BODY" | jq -r '.[] | "  - \(.key) = \(.value // "***masked***")"' 2>/dev/null
echo ""

# Verificar Auto DevOps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Verificando Auto DevOps..."
echo ""

PROJECT_INFO=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID")

AUTO_DEVOPS_ENABLED=$(echo "$PROJECT_INFO" | jq -r '.auto_devops_enabled')
AUTO_DEVOPS_DEPLOY_STRATEGY=$(echo "$PROJECT_INFO" | jq -r '.auto_devops_deploy_strategy')

if [ "$AUTO_DEVOPS_ENABLED" = "true" ]; then
    echo "✅ Auto DevOps: ATIVO"
    echo "   Estratégia de deploy: $AUTO_DEVOPS_DEPLOY_STRATEGY"
else
    echo "⚠️  Auto DevOps: INATIVO"
    echo ""
    echo "   Para ativar:"
    echo "   1. Acesse: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/settings/ci_cd"
    echo "   2. Expanda 'Auto DevOps'"
    echo "   3. Marque 'Default to Auto DevOps pipeline'"
    echo "   4. Clique em 'Save changes'"
fi

echo ""

# Verificar último pipeline
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Último Pipeline..."
echo ""

PIPELINE_RESPONSE=$(curl -s --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/$PROJECT_ID/pipelines?per_page=1")

PIPELINE_STATUS=$(echo "$PIPELINE_RESPONSE" | jq -r '.[0].status')
PIPELINE_ID=$(echo "$PIPELINE_RESPONSE" | jq -r '.[0].id')
PIPELINE_REF=$(echo "$PIPELINE_RESPONSE" | jq -r '.[0].ref')
PIPELINE_CREATED=$(echo "$PIPELINE_RESPONSE" | jq -r '.[0].created_at')

if [ "$PIPELINE_STATUS" != "null" ]; then
    echo "  Pipeline #$PIPELINE_ID"
    echo "  Branch: $PIPELINE_REF"
    echo "  Status: $PIPELINE_STATUS"
    echo "  Criado: $PIPELINE_CREATED"
    echo ""
    echo "  🔗 Ver pipeline: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/pipelines/$PIPELINE_ID"
else
    echo "  ℹ️  Nenhum pipeline encontrado"
    echo ""
    echo "  Para disparar um pipeline:"
    echo "  git commit --allow-empty -m 'Trigger pipeline'"
    echo "  git push origin main"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificação concluída!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
