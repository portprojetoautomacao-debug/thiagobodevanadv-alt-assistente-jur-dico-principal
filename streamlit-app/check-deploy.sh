#!/bin/bash

echo "🔍 VERIFICAÇÃO DE DEPLOY"
echo "========================================="
echo ""

# 1. Backend
echo "1️⃣ Backend FastAPI:"
BACKEND_STATUS=$(curl -s http://localhost:8000/api/health 2>&1)
if echo "$BACKEND_STATUS" | grep -qE '"status":\s*"ok"'; then
    echo "   ✅ ONLINE - http://localhost:8000"
    echo "   Backend: $(echo "$BACKEND_STATUS" | grep -o '"backend":"[^"]*"' | cut -d'"' -f4)"
else
    echo "   ❌ OFFLINE ou resposta inválida"
    echo "   Debug: $BACKEND_STATUS"
fi
echo ""

# 2. Streamlit
echo "2️⃣ Streamlit App:"
STREAMLIT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8501)
if [ "$STREAMLIT_STATUS" = "200" ]; then
    echo "   ✅ ONLINE - http://localhost:8501"
else
    echo "   ❌ OFFLINE (código: $STREAMLIT_STATUS)"
fi
echo ""

# 3. Agentes
echo "3️⃣ Agentes IA:"
AGENTS_COUNT=$(curl -s http://localhost:8000/api/agents | grep -o '"total":[0-9]*' | cut -d':' -f2)
if [ -n "$AGENTS_COUNT" ]; then
    echo "   ✅ $AGENTS_COUNT agentes disponíveis"
else
    echo "   ❌ Erro ao listar agentes"
fi
echo ""

# 4. Teste de execução
echo "4️⃣ Teste de Execução (Harvey):"
EXEC_TEST=$(curl -s -X POST http://localhost:8000/api/agents/process-task \
  -H "Content-Type: application/json" \
  -d '{"agentId":"harvey","task":{"input":"Teste rápido"}}' | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$EXEC_TEST" = "true" ]; then
    echo "   ✅ Agente executado com sucesso"
else
    echo "   ❌ Erro na execução"
fi
echo ""

echo "========================================="
echo "📊 RESUMO:"
echo "   Backend: $([ "$BACKEND_STATUS" != "" ] && echo "✅" || echo "❌")"
echo "   Streamlit: $([ "$STREAMLIT_STATUS" = "200" ] && echo "✅" || echo "❌")"
echo "   Agentes: $([ -n "$AGENTS_COUNT" ] && echo "✅" || echo "❌")"
echo "   Execução: $([ "$EXEC_TEST" = "true" ] && echo "✅" || echo "❌")"
echo ""
echo "🔗 Acesse: http://localhost:8501"
echo ""
