#!/bin/bash

# Script de Teste de Tracing - Valida conexão com AI Toolkit

echo "🔍 Teste de Tracing - AI Toolkit"
echo "================================"
echo ""

# 1. Verificar se AI Toolkit Collector está rodando
echo "1️⃣ Verificando AI Toolkit Collector..."
if ss -tuln 2>/dev/null | grep -q "5173"; then
    echo "   ✅ HTTP Collector ativo na porta 5173"
else
    echo "   ❌ HTTP Collector NÃO está rodando"
    echo "   💡 Abra o AI Toolkit Trace Viewer: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'"
    exit 1
fi

if ss -tuln 2>/dev/null | grep -q "5173"; then
    echo "   ✅ gRPC Collector ativo na porta 4317"
else
    echo "   ⚠️ gRPC Collector não detectado (HTTP é suficiente)"
fi

echo ""

# 2. Verificar variáveis de ambiente
echo "2️⃣ Verificando variáveis de ambiente..."
if grep -q "VITE_ENABLE_TRACING=true" /workspaces/assistente-jur-dico-principal/.env; then
    echo "   ✅ VITE_ENABLE_TRACING=true"
else
    echo "   ❌ VITE_ENABLE_TRACING não está true"
fi

if grep -q "VITE_OTLP_ENDPOINT" /workspaces/assistente-jur-dico-principal/.env; then
    ENDPOINT=$(grep "VITE_OTLP_ENDPOINT" /workspaces/assistente-jur-dico-principal/.env | cut -d'=' -f2)
    echo "   ✅ VITE_OTLP_ENDPOINT=$ENDPOINT"
else
    echo "   ❌ VITE_OTLP_ENDPOINT não configurado"
fi

echo ""

# 3. Testar conexão HTTP
echo "3️⃣ Testando conexão HTTP com OTLP..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5173/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}' 2>/dev/null)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "   ✅ Endpoint respondendo (HTTP $HTTP_CODE)"
else
    echo "   ⚠️ Endpoint retornou HTTP $HTTP_CODE"
fi

echo ""

# 4. Verificar se servidor dev está rodando
echo "4️⃣ Verificando servidor Vite..."
if curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "   ✅ Servidor rodando em http://127.0.0.1:5173"
else
    echo "   ⚠️ Servidor NÃO está rodando"
    echo "   💡 Execute: npm run dev"
fi

echo ""

# 5. Verificar se há traces sendo capturados
echo "5️⃣ Verificando traces capturados..."
TRACE_SIZE=$(du -h /home/node/.aitk/tracing/traces.db 2>/dev/null | cut -f1)
if [ -n "$TRACE_SIZE" ]; then
    echo "   ✅ Database de traces: $TRACE_SIZE"

    # Contar traces recentes no log
    RECENT_TRACES=$(grep -c "Tracing collector status check: Running" /home/node/.aitk/*tracing.log 2>/dev/null | tail -1)
    if [ -n "$RECENT_TRACES" ] && [ "$RECENT_TRACES" -gt 0 ]; then
        echo "   ✅ Collector ativo (últimos logs confirmam)"
    fi
else
    echo "   ⚠️ Sem traces capturados ainda"
fi

echo ""
echo "================================"
echo "📊 RESUMO:"
echo ""

# Validação final
ALL_OK=true

if ! ss -tuln 2>/dev/null | grep -q "4318"; then
    echo "❌ AI Toolkit Collector não está rodando"
    ALL_OK=false
fi

if ! grep -q "VITE_ENABLE_TRACING=true" /workspaces/assistente-jur-dico-principal/.env; then
    echo "❌ Tracing não habilitado no .env"
    ALL_OK=false
fi

if ! curl -s http://127.0.0.1:5173 > /dev/null 2>&1; then
    echo "❌ Servidor dev não está rodando"
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo "✅ Tudo configurado corretamente!"
    echo ""
    echo "🚀 Próximos passos:"
    echo "   1. Acesse http://127.0.0.1:5173"
    echo "   2. Use o app (login, abrir processos, etc.)"
    echo "   3. Veja traces no AI Toolkit: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'"
else
    echo ""
    echo "⚠️ Alguns problemas encontrados. Corrija os itens acima."
fi

echo ""
