#!/bin/bash

echo "🚀 Iniciando Backend Python FastAPI..."
echo ""

# Navegar para diretório backend
cd "$(dirname "$0")"

# Ativar ambiente virtual (se existir)
if [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

# Instalar dependências do backend
if [ -f "requirements.txt" ]; then
    echo "📦 Instalando dependências do backend..."
    pip install -r requirements.txt -q
fi

# Executar FastAPI
echo ""
echo "✅ Backend rodando em:"
echo "   📡 API: http://localhost:8000"
echo "   📚 Docs: http://localhost:8000/api/docs"
echo "   ❤️  Health: http://localhost:8000/api/health"
echo ""

python main.py
