#!/bin/bash

echo "========================================="
echo "🚀 ASSISTENTE JURÍDICO - STREAMLIT SETUP"
echo "========================================="
echo ""

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.11+"
    exit 1
fi

echo "✅ Python encontrado: $(python3 --version)"
echo ""

# Navegar para diretório streamlit-app
cd "$(dirname "$0")"

# Criar ambiente virtual
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual..."
    python3 -m venv venv
    echo "✅ Ambiente virtual criado"
else
    echo "✅ Ambiente virtual já existe"
fi

# Ativar ambiente
echo "🔌 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📥 Instalando dependências..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "❌ Erro ao instalar dependências"
    exit 1
fi

# Instalar drivers Playwright
echo "🎭 Instalando drivers Playwright..."
if playwright install chromium --with-deps 2>/dev/null; then
    echo "✅ Playwright instalado com sucesso"
else
    echo "⚠️  Aviso: Erro ao instalar Playwright. Execute manualmente se necessário:"
    echo "    playwright install chromium --with-deps"
fi

# Verificar .env
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "📋 Copiando .env.example para .env..."
    cp .env.example .env
    echo "✅ .env criado. EDITE com suas credenciais antes de executar!"
    echo ""
    echo "Variáveis obrigatórias:"
    echo "  - REACT_API_URL"
    echo "  - GEMINI_API_KEY"
    echo "  - UPSTASH_REDIS_REST_URL"
    echo "  - UPSTASH_REDIS_REST_TOKEN"
    echo ""
fi

echo "========================================="
echo "✅ SETUP COMPLETO!"
echo "========================================="
echo ""
echo "Para executar o app:"
echo "  1. Edite .env com suas credenciais"
echo "  2. Execute: ./run.sh"
echo ""
echo "Ou manualmente:"
echo "  source venv/bin/activate"
echo "  streamlit run app.py"
echo ""
