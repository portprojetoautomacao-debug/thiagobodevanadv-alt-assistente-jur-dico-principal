#!/bin/bash

# Script para verificar a configuração da API do Gemini
# Uso: ./verificar-gemini.sh

echo "🔍 Verificando configuração da API do Gemini..."
echo ""

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado"
    echo "📝 Crie o arquivo .env a partir do .env.example:"
    echo "   cp .env.example .env"
    echo ""
    exit 1
fi

# Verificar se a variável VITE_GEMINI_API_KEY existe no .env
if grep -q "VITE_GEMINI_API_KEY=" .env; then
    # Extrair o valor da chave
    GEMINI_KEY=$(grep "VITE_GEMINI_API_KEY=" .env | cut -d '=' -f2)
    
    # Verificar se não está vazia ou é o valor padrão
    if [ -z "$GEMINI_KEY" ] || [ "$GEMINI_KEY" = "your-gemini-api-key-here" ]; then
        echo "⚠️  VITE_GEMINI_API_KEY encontrada mas não configurada"
        echo "📝 Edite o arquivo .env e adicione sua chave da API do Gemini"
        echo "   Obtenha sua chave em: https://aistudio.google.com/app/apikey"
        echo ""
        exit 1
    else
        echo "✅ VITE_GEMINI_API_KEY encontrada no .env"
        # Mostrar apenas os primeiros e últimos caracteres
        KEY_LENGTH=${#GEMINI_KEY}
        if [ $KEY_LENGTH -gt 10 ]; then
            MASKED_KEY="${GEMINI_KEY:0:6}...${GEMINI_KEY: -4}"
            echo "   Chave: $MASKED_KEY"
        fi
        echo ""
    fi
else
    echo "❌ VITE_GEMINI_API_KEY não encontrada no .env"
    echo "📝 Adicione a seguinte linha ao arquivo .env:"
    echo "   VITE_GEMINI_API_KEY=sua-chave-aqui"
    echo ""
    exit 1
fi

# Verificar se .env está no .gitignore
if grep -q "^\.env$" .gitignore; then
    echo "🔒 Segurança: .env está protegido no .gitignore"
else
    echo "⚠️  ATENÇÃO: .env NÃO está no .gitignore!"
    echo "   Adicione '.env' ao arquivo .gitignore para proteger suas chaves"
fi

echo ""
echo "📚 Para mais informações, consulte: GEMINI_API_SETUP.md"
echo ""
echo "✨ Configuração verificada com sucesso!"
echo "   Reinicie o servidor de desenvolvimento se necessário: npm run dev"
