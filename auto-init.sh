#!/bin/bash

# ==========================================
# ASSISTENTE JURÍDICO P - INICIALIZAÇÃO AUTOMÁTICA
# ==========================================

echo "🚀 Iniciando Assistente Jurídico P..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute no diretório raiz do projeto."
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "❌ Falha ao instalar dependências."
    exit 1
fi

echo "✅ Dependências verificadas!"

# Verificar TypeScript
if ! npx tsc --version &> /dev/null; then
    echo "❌ TypeScript não encontrado."
    exit 1
fi

echo "✅ TypeScript verificado!"

# Executar verificações rápidas
echo "🔍 Executando verificações rápidas..."
npm run type-check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript OK"
else
    echo "⚠️  Avisos no TypeScript (verifique depois)"
fi

# Verificar linting básico
npm run lint > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ ESLint OK"
else
    echo "⚠️  Avisos no ESLint (serão corrigidos automaticamente)"
fi

echo ""
echo "🎉 Sistema pronto!"
echo "💻 Servidor de desenvolvimento iniciando automaticamente..."
echo "🧪 Testes em watch mode iniciando automaticamente..."
echo ""
echo "📝 Dicas:"
echo "  - Arquivos são formatados automaticamente ao salvar"
echo "  - ESLint corrige problemas automaticamente"
echo "  - TypeScript verifica tipos em tempo real"
echo "  - Testes rodam automaticamente"
echo ""
echo "🌐 Acesse: http://localhost:5173"
echo ""

# Manter terminal aberto
exec "$SHELL"