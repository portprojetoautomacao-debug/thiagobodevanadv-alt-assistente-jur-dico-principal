#!/bin/bash
# Script de Configuração Automatizada Railway + Vercel
# Data: 10/12/2024
# Descrição: Configura integração híbrida DSPy Bridge

set -e  # Exit on error

echo "🚀 Iniciando configuração Railway + Vercel..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_ID="a364e7f2-c234-477b-8dac-918f00f64737"
VERCEL_URL="https://assistente-juridico-p.vercel.app"

# ======================================
# ETAPA 1: Verificar CLI Railway
# ======================================
echo "📦 1/6 - Verificando Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI não encontrada. Instalando...${NC}"
    npm install -g @railway/cli
    echo -e "${GREEN}✅ Railway CLI instalada!${NC}"
else
    echo -e "${GREEN}✅ Railway CLI já instalada!${NC}"
fi
echo ""

# ======================================
# ETAPA 2: Verificar autenticação
# ======================================
echo "🔐 2/6 - Verificando autenticação Railway..."
if railway whoami &> /dev/null; then
    USER=$(railway whoami)
    echo -e "${GREEN}✅ Autenticado como: $USER${NC}"
else
    echo -e "${YELLOW}⚠️  Não autenticado. Executando login...${NC}"
    echo -e "${YELLOW}   ℹ️  Uma janela do browser será aberta.${NC}"
    echo -e "${YELLOW}   ℹ️  Faça login e retorne ao terminal.${NC}"
    echo ""
    railway login

    if railway whoami &> /dev/null; then
        USER=$(railway whoami)
        echo -e "${GREEN}✅ Login realizado com sucesso! Usuário: $USER${NC}"
    else
        echo -e "${RED}❌ Falha no login. Execute manualmente: railway login${NC}"
        exit 1
    fi
fi
echo ""

# ======================================
# ETAPA 3: Conectar ao projeto
# ======================================
echo "🔗 3/6 - Conectando ao projeto gentle-vision..."
if railway link -p $PROJECT_ID &> /dev/null; then
    echo -e "${GREEN}✅ Projeto conectado com sucesso!${NC}"
else
    echo -e "${RED}❌ Falha ao conectar. Verifique o ID do projeto.${NC}"
    exit 1
fi

# Verificar status
railway status
echo ""

# ======================================
# ETAPA 4: Gerar e configurar variáveis
# ======================================
echo "⚙️  4/6 - Configurando variáveis de ambiente..."

# Gerar token seguro
DSPY_TOKEN=$(openssl rand -base64 32)
echo -e "${GREEN}✅ Token gerado: ${DSPY_TOKEN:0:10}...${NC}"

# Verificar se GEMINI_API_KEY existe localmente
if [ -f .env ]; then
    source .env
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY não encontrada.${NC}"
    echo -e "${YELLOW}   Obtenha gratuitamente em: https://aistudio.google.com/app/apikey${NC}"
    read -p "Cole sua GEMINI_API_KEY aqui: " GEMINI_INPUT
    GEMINI_API_KEY=$GEMINI_INPUT
fi

# Configurar variáveis no Railway
echo "Configurando variáveis..."
railway variables set DSPY_API_TOKEN="$DSPY_TOKEN"
railway variables set DSPY_PORT=8765
railway variables set ALLOWED_ORIGINS="$VERCEL_URL"
railway variables set GEMINI_API_KEY="$GEMINI_API_KEY"
railway variables set DSPY_LM_MODEL="openai/gpt-3.5-turbo"
railway variables set NODE_ENV="production"

echo -e "${GREEN}✅ Variáveis configuradas no Railway!${NC}"
echo ""

# ======================================
# ETAPA 5: Deploy
# ======================================
echo "🚢 5/6 - Realizando deploy no Railway..."
echo -e "${YELLOW}⏳ Isso pode levar 2-5 minutos...${NC}"
echo ""

railway up

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
else
    echo -e "${RED}❌ Falha no deploy. Verifique os logs:${NC}"
    echo -e "${YELLOW}   railway logs --tail 100${NC}"
    exit 1
fi
echo ""

# Aguardar deploy estabilizar
echo "⏳ Aguardando deploy estabilizar (15s)..."
sleep 15

# ======================================
# ETAPA 6: Obter URL e instruções Vercel
# ======================================
echo "🌐 6/6 - Obtendo URL do Railway..."
RAILWAY_URL=$(railway domain 2>&1 | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo -e "${YELLOW}⚠️  URL não encontrada automaticamente.${NC}"
    echo -e "${YELLOW}   Execute: railway domain${NC}"
    RAILWAY_URL="<sua-url-railway-aqui>"
else
    echo -e "${GREEN}✅ URL Railway: $RAILWAY_URL${NC}"
fi
echo ""

# ======================================
# RESUMO E PRÓXIMOS PASSOS
# ======================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 CONFIGURAÇÃO RAILWAY COMPLETA!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 RESUMO DA CONFIGURAÇÃO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Projeto:     gentle-vision"
echo "  URL Railway: $RAILWAY_URL"
echo "  Status:      ✅ Deploy ativo"
echo "  Variáveis:   ✅ 6 configuradas"
echo ""
echo "🔐 CREDENCIAIS (GUARDE COM SEGURANÇA):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DSPY_API_TOKEN: $DSPY_TOKEN"
echo ""
echo "⚠️  COPIE ESTE TOKEN AGORA - Você precisará dele no Vercel!"
echo ""

# Salvar configuração em arquivo seguro
CONFIG_FILE=".railway-config.txt"
cat > $CONFIG_FILE << EOF
# Configuração Railway - gentle-vision
# Data: $(date)
# MANTENHA ESTE ARQUIVO SEGURO - NÃO COMMITE NO GIT

RAILWAY_PROJECT_ID=$PROJECT_ID
RAILWAY_URL=$RAILWAY_URL
DSPY_API_TOKEN=$DSPY_TOKEN
GEMINI_API_KEY=$GEMINI_API_KEY
VERCEL_URL=$VERCEL_URL
EOF

echo -e "${GREEN}✅ Configuração salva em: $CONFIG_FILE${NC}"
echo ""

# ======================================
# INSTRUÇÕES VERCEL
# ======================================
echo "🎯 PRÓXIMOS PASSOS - CONFIGURAR VERCEL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Acesse o Vercel Dashboard:"
echo "   https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables"
echo ""
echo "2️⃣  Adicione as seguintes variáveis:"
echo ""
echo "   DSPY_BRIDGE_URL=$RAILWAY_URL"
echo "   DSPY_API_TOKEN=$DSPY_TOKEN"
echo "   VITE_DSPY_URL=$RAILWAY_URL"
echo "   VITE_DSPY_API_TOKEN=$DSPY_TOKEN"
echo ""
echo "3️⃣  Salve e force rebuild:"
echo "   vercel --prod"
echo ""
echo "4️⃣  Teste a integração:"
echo "   curl $RAILWAY_URL/health"
echo "   curl $VERCEL_URL/api/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ======================================
# TESTES AUTOMÁTICOS
# ======================================
echo "🧪 EXECUTANDO TESTES AUTOMÁTICOS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Teste 1: Railway health check
echo "1️⃣  Testando Railway health check..."
if curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health" | grep -q "200"; then
    echo -e "${GREEN}   ✅ Railway respondendo corretamente!${NC}"
else
    echo -e "${YELLOW}   ⚠️  Railway ainda não está respondendo.${NC}"
    echo -e "${YELLOW}   Aguarde alguns minutos e teste manualmente:${NC}"
    echo -e "${YELLOW}   curl $RAILWAY_URL/health${NC}"
fi
echo ""

# Teste 2: Vercel health check
echo "2️⃣  Testando Vercel health check..."
if curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL/api/health" | grep -q "200"; then
    echo -e "${GREEN}   ✅ Vercel respondendo corretamente!${NC}"
else
    echo -e "${YELLOW}   ⚠️  Vercel não está respondendo.${NC}"
fi
echo ""

# Comandos úteis
echo "📚 COMANDOS ÚTEIS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ver logs Railway:    railway logs --tail 100"
echo "  Status Railway:      railway status"
echo "  Variáveis Railway:   railway variables"
echo "  Domínios Railway:    railway domain"
echo "  Rebuild Railway:     railway up"
echo ""
echo "  Deploy Vercel:       vercel --prod"
echo "  Logs Vercel:         vercel logs --follow"
echo "  Variáveis Vercel:    vercel env ls"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -e "${GREEN}✨ Configuração finalizada com sucesso!${NC}"
echo -e "${YELLOW}📖 Veja documentação completa em: docs/RAILWAY_VERCEL_INTEGRATION_COMPLETE.md${NC}"
echo ""
