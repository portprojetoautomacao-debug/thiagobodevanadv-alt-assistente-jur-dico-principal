#!/bin/bash
# Script de verificação de variáveis de ambiente

echo "🔍 Verificando configurações de ambiente..."
echo ""

# Carregar .env.local
if [ -f .env.local ]; then
  source .env.local
  echo "✅ Arquivo .env.local encontrado"
else
  echo "❌ Arquivo .env.local não encontrado"
  exit 1
fi

echo ""
echo "📋 Status das Variáveis:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Upstash Redis
if [ -n "$UPSTASH_REDIS_REST_URL" ]; then
  echo "✅ UPSTASH_REDIS_REST_URL: Configurado"
else
  echo "❌ UPSTASH_REDIS_REST_URL: NÃO configurado"
fi

if [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo "✅ UPSTASH_REDIS_REST_TOKEN: Configurado"
else
  echo "❌ UPSTASH_REDIS_REST_TOKEN: NÃO configurado"
fi

# Gemini API
if [ -n "$GEMINI_API_KEY" ]; then
  echo "✅ GEMINI_API_KEY: Configurado"
elif [ -n "$VITE_GEMINI_API_KEY" ]; then
  echo "✅ VITE_GEMINI_API_KEY: Configurado"
else
  echo "❌ GEMINI_API_KEY ou VITE_GEMINI_API_KEY: NÃO configurado"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Testar conectividade
if [ -n "$UPSTASH_REDIS_REST_URL" ] && [ -n "$UPSTASH_REDIS_REST_TOKEN" ]; then
  echo "🧪 Testando conexão Upstash Redis..."
  response=$(curl -s -w "\n%{http_code}" -X POST "$UPSTASH_REDIS_REST_URL/ping" \
    -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" 2>/dev/null)
  http_code=$(echo "$response" | tail -1)

  if [ "$http_code" = "200" ]; then
    echo "✅ Upstash Redis: Conectado com sucesso"
  else
    echo "❌ Upstash Redis: Erro de conexão (HTTP $http_code)"
  fi
fi

echo ""
echo "💡 Para aplicar as mudanças no servidor Vite:"
echo "   1. Pare o servidor: Ctrl+C na task 'auto-dev'"
echo "   2. Reinicie: npm run dev"
echo ""
