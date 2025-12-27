#!/bin/bash

echo "========================================="
echo "🚀 SETUP COMPLETO - STREAMLIT + BACKEND"
echo "========================================="
echo ""

# Navegar para diretório
cd "$(dirname "$0")"

# 1. SETUP STREAMLIT
echo "📦 [1/2] Configurando Streamlit..."
echo ""

if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Instalando dependências Streamlit..."
pip install -r requirements.txt -q

if [ $? -ne 0 ]; then
    echo "❌ Erro ao instalar dependências Streamlit"
    exit 1
fi

echo "✅ Streamlit configurado"
echo ""

# 2. SETUP BACKEND FASTAPI
echo "🔧 [2/2] Configurando Backend FastAPI..."
echo ""

if [ -f "backend/requirements.txt" ]; then
    echo "Instalando dependências FastAPI..."
    pip install -r backend/requirements.txt -q

    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências FastAPI"
        exit 1
    fi
fi

echo "✅ Backend FastAPI configurado"
echo ""

# 3. DRIVERS
echo "🎭 Instalando drivers Playwright..."
playwright install chromium --quiet

# 4. VERIFICAR .ENV
if [ ! -f ".env" ]; then
    echo "⚠️  Criando .env a partir do template..."
    cp .env.example .env
    echo ""
    echo "📝 AÇÃO NECESSÁRIA:"
    echo "   Edite .env com suas credenciais antes de executar!"
    echo ""
fi

echo "========================================="
echo "✅ SETUP COMPLETO!"
echo "========================================="
echo ""
echo "Para executar:"
echo ""
echo "  1. BACKEND FASTAPI (Terminal 1):"
echo "     cd backend && ./run-backend.sh"
echo "     Acesso: http://localhost:8000"
echo ""
echo "  2. STREAMLIT APP (Terminal 2):"
echo "     ./run.sh"
echo "     Acesso: http://localhost:8501"
echo ""
echo "Ou execute ambos automaticamente:"
echo "  ./run-all.sh"
echo ""
