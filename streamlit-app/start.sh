#!/bin/bash
# Script de inicialização para Render
# Inicia backend FastAPI em background e depois Streamlit

set -e

echo "🚀 Iniciando Assistente Jurídico PJe..."

# 1. Iniciar backend FastAPI em background
echo "📡 Iniciando backend FastAPI..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Aguardar backend estar pronto
echo "⏳ Aguardando backend..."
sleep 5

# Verificar se backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Erro: Backend não iniciou"
    exit 1
fi

echo "✅ Backend rodando (PID: $BACKEND_PID)"

# 2. Iniciar Streamlit
echo "🎨 Iniciando Streamlit..."
streamlit run app.py --server.port ${PORT:-8501} --server.address 0.0.0.0

# Se Streamlit morrer, matar backend também
kill $BACKEND_PID 2>/dev/null || true
