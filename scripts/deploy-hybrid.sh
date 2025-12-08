#!/bin/bash

# Deploy Script for Hybrid Architecture
# Configures Qdrant Cloud + DSPy Bridge + Railway

set -e  # Exit on error

echo "🚀 DEPLOY - ARQUITETURA HÍBRIDA"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    echo "Execute: cp .env.example .env"
    exit 1
fi

# Load environment variables
source .env

echo "📋 CHECKLIST DE PRÉ-REQUISITOS"
echo "------------------------------"

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js não instalado${NC}"
    exit 1
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python $(python3 --version)${NC}"
else
    echo -e "${RED}❌ Python3 não instalado${NC}"
    exit 1
fi

# Check npm dependencies
if [ -d node_modules ]; then
    echo -e "${GREEN}✅ npm packages instalados${NC}"
else
    echo -e "${YELLOW}⚠️  Instalando npm packages...${NC}"
    npm install
fi

# Check Python venv
if [ -d venv ]; then
    echo -e "${GREEN}✅ Python venv criado${NC}"
else
    echo -e "${YELLOW}⚠️  Criando Python venv...${NC}"
    python3 -m venv venv
    source venv/bin/activate
    pip install -q dspy-ai fastapi uvicorn qdrant-client
fi

echo ""
echo "🔧 CONFIGURAÇÃO DOS SERVIÇOS"
echo "---------------------------"

# 1. Qdrant Cloud
echo ""
echo "1️⃣  QDRANT VECTOR DATABASE"
if [ -z "$QDRANT_URL" ] || [ "$QDRANT_URL" == "http://localhost:6333" ]; then
    echo -e "${YELLOW}⚠️  Qdrant configurado para local${NC}"
    echo "   Para produção, use Qdrant Cloud:"
    echo "   1. Crie conta em: https://cloud.qdrant.io"
    echo "   2. Crie cluster (free tier 1GB)"
    echo "   3. Atualize QDRANT_URL e QDRANT_API_KEY no .env"
else
    echo -e "${GREEN}✅ Qdrant Cloud configurado${NC}"
    echo "   URL: $QDRANT_URL"
fi

# 2. DSPy Bridge
echo ""
echo "2️⃣  DSPY BRIDGE"
if [ "$DSPY_BRIDGE_URL" == "http://localhost:8765" ]; then
    echo -e "${YELLOW}⚠️  DSPy configurado para local${NC}"
    echo "   Para produção, deploy no Railway:"
    echo ""
    echo "   📦 DEPLOY NO RAILWAY:"
    echo "   --------------------"
    echo "   1. Crie conta em: https://railway.app"
    echo "   2. Novo projeto → Deploy from GitHub repo"
    echo "   3. Selecione este repositório"
    echo "   4. Configure variáveis:"
    echo "      - DSPY_API_TOKEN=$DSPY_API_TOKEN"
    echo "      - DSPY_PORT=8765"
    echo "      - ALLOWED_ORIGINS=https://assistente-juridico-p.vercel.app"
    echo "   5. Start command: python3 scripts/dspy_bridge.py"
    echo "   6. Copie a URL gerada para DSPY_BRIDGE_URL no .env"
    echo ""
else
    echo -e "${GREEN}✅ DSPy Bridge em produção${NC}"
    echo "   URL: $DSPY_BRIDGE_URL"
fi

# 3. Vercel
echo ""
echo "3️⃣  VERCEL DEPLOYMENT"
echo "   Adicione as variáveis de ambiente no Vercel Dashboard:"
echo "   https://vercel.com/your-project/settings/environment-variables"
echo ""
echo "   Variáveis necessárias:"
echo "   ---------------------"
echo "   QDRANT_URL=$QDRANT_URL"
echo "   QDRANT_API_KEY=***"
echo "   QDRANT_COLLECTION=$QDRANT_COLLECTION"
echo "   AUTOGEN_API_KEY=***"
echo "   DSPY_BRIDGE_URL=$DSPY_BRIDGE_URL"
echo "   DSPY_API_TOKEN=***"
echo "   GEMINI_API_KEY=*** (já configurado)"
echo ""

# 4. Test local
echo ""
echo "🧪 TESTES LOCAIS"
echo "---------------"
read -p "Executar testes de integração? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run test:integration 2>&1 || echo -e "${YELLOW}⚠️  Alguns testes falharam (serviços podem não estar rodando)${NC}"
fi

echo ""
echo "✅ DEPLOY CONFIGURADO!"
echo "====================="
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Configure Qdrant Cloud (se ainda não fez)"
echo "2. Deploy DSPy Bridge no Railway (se ainda não fez)"
echo "3. Adicione env vars no Vercel Dashboard"
echo "4. Execute: git push origin main"
echo "5. Vercel fará deploy automático!"
echo ""
