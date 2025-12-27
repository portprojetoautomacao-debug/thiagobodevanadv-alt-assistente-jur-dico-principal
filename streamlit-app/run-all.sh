#!/bin/bash

echo "🚀 Iniciando Backend + Frontend..."
echo ""

# Navegar para diretório
cd "$(dirname "$0")"

# Ativar ambiente virtual
source venv/bin/activate

# Função para cleanup
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Iniciar Backend FastAPI
echo "📡 [1/2] Iniciando Backend FastAPI..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Verificar se backend iniciou
if ! curl -s http://localhost:8000/api/health > /dev/null; then
    echo "❌ Erro: Backend não respondeu no health check"
    echo "   Verifique o log: tail backend/backend.log"
    echo "   Porta 8000 pode estar em uso: lsof -i:8000"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend rodando (PID: $BACKEND_PID)"
echo "   📡 http://localhost:8000/api"
echo ""

# 2. Iniciar Streamlit
echo "🎨 [2/2] Iniciando Streamlit..."
streamlit run app.py --server.port=8501 --server.address=0.0.0.0 &
FRONTEND_PID=$!

# Aguardar Streamlit iniciar
sleep 5

echo "✅ Streamlit rodando (PID: $FRONTEND_PID)"
echo "   🎨 http://localhost:8501"
echo ""

echo "========================================="
echo "✅ SISTEMA COMPLETO RODANDO!"
echo "========================================="
echo ""
echo "🔗 URLs:"
echo "   Backend API:  http://localhost:8000"
echo "   Backend Docs: http://localhost:8000/api/docs"
echo "   Streamlit:    http://localhost:8501"
echo ""
echo "Pressione Ctrl+C para parar ambos os serviços"
echo ""

# Aguardar
wait
