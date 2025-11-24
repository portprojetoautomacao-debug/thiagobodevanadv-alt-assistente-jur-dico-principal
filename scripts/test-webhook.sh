#!/bin/bash

# Script para testar o Webhook do GitHub
# Uso: ./scripts/test-webhook.sh

set -e

WEBHOOK_URL="https://assistente-juridico-p.vercel.app/api/webhook"

echo "🔍 Testando Webhook do GitHub..."
echo ""
echo "📡 URL: $WEBHOOK_URL"
echo ""

# Teste 1: Verificar se o endpoint responde
echo "✅ Teste 1: Verificando se o endpoint está acessível..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$WEBHOOK_URL")

if [ "$response" = "200" ]; then
  echo "   ✓ Endpoint respondeu com 200 OK"
else
  echo "   ✗ Endpoint respondeu com código: $response"
  exit 1
fi

# Teste 2: Verificar conteúdo da resposta
echo ""
echo "✅ Teste 2: Verificando conteúdo da resposta..."
content=$(curl -s "$WEBHOOK_URL")
echo "   Resposta: $content"

# Teste 3: Simular um payload de webhook do GitHub (evento push)
echo ""
echo "✅ Teste 3: Simulando evento 'push' do GitHub..."
push_payload='{
  "ref": "refs/heads/main",
  "before": "0000000000000000000000000000000000000000",
  "after": "1111111111111111111111111111111111111111",
  "repository": {
    "name": "assistente-jurdico-p",
    "full_name": "thiagobodevan-a11y/assistente-jurdico-p"
  },
  "pusher": {
    "name": "test-user",
    "email": "test@example.com"
  },
  "commits": [
    {
      "message": "test: webhook configuration",
      "author": {
        "name": "Test User",
        "email": "test@example.com"
      }
    }
  ]
}'

response=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-$(date +%s)" \
  -d "$push_payload" \
  "$WEBHOOK_URL")

if [ "$response" = "200" ] || [ "$response" = "204" ]; then
  echo "   ✓ Webhook aceitou o payload (HTTP $response)"
else
  echo "   ⚠ Webhook respondeu com código: $response"
fi

echo ""
echo "🎉 Teste concluído!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Configure o webhook no GitHub: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/hooks"
echo "   2. Use a URL: $WEBHOOK_URL"
echo "   3. Selecione Content-Type: application/json"
echo "   4. Marque os eventos desejados"
echo ""
