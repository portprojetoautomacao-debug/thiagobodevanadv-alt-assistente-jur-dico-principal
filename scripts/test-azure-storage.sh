#!/bin/bash
# Script de teste rápido para Azure Storage

echo "🧪 Testando integração Azure Storage..."
echo ""

# Verificar se Azurite está rodando
echo "1️⃣ Verificando Azurite (localhost:10000)..."
if nc -z 127.0.0.1 10000 2>/dev/null; then
  echo "   ✅ Azurite está rodando!"
else
  echo "   ❌ Azurite NÃO está rodando"
  echo "   💡 Inicie com:"
  echo "      docker run -d --name azurite -p 10000:10000 -p 10001:10001 -p 10002:10002 \\"
  echo "        mcr.microsoft.com/azure-storage/azurite:3.28.0 \\"
  echo "        azurite-blob --blobHost 0.0.0.0 --loose --skipApiVersionCheck"
  exit 1
fi

echo ""
echo "2️⃣ Verificando dependências Node.js..."
if npm list @azure/storage-blob &>/dev/null; then
  echo "   ✅ @azure/storage-blob instalado"
else
  echo "   ⚠️  @azure/storage-blob NÃO instalado"
  echo "   💡 Instale com: npm install @azure/storage-blob formidable @types/formidable"
fi

echo ""
echo "3️⃣ Verificando variáveis de ambiente..."
if grep -q "AZURE_STORAGE_CONNECTION_STRING" .env 2>/dev/null; then
  echo "   ✅ AZURE_STORAGE_CONNECTION_STRING configurada"
else
  echo "   ❌ AZURE_STORAGE_CONNECTION_STRING não encontrada no .env"
  exit 1
fi

echo ""
echo "4️⃣ Testando conexão com Azurite..."
curl -s -X HEAD http://127.0.0.1:10000/devstoreaccount1?comp=list >/dev/null
if [ $? -eq 0 ]; then
  echo "   ✅ Conexão com Azurite OK!"
else
  echo "   ❌ Erro ao conectar com Azurite"
  exit 1
fi

echo ""
echo "✅ Tudo pronto! Execute: npm run dev"
echo ""
echo "📖 Documentação:"
echo "   - Setup completo: docs/AZURE_STORAGE_SETUP.md"
echo "   - Azurite quickstart: docs/AZURITE_QUICKSTART.md"
echo ""
