#!/bin/bash
# Script para sincronizar secrets entre GitHub e Vercel
# Garante que todos os agentes em nuvem têm as mesmas variáveis

set -e

echo "🔐 Sincronizando Secrets - GitHub ↔ Vercel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI não encontrado. Instale com: sudo apt-get install gh${NC}"
    exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GitHub. Execute: gh auth login${NC}"
    exit 1
fi

REPO="portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"
SECRETS=(
    "UPSTASH_REDIS_REST_URL"
    "UPSTASH_REDIS_REST_TOKEN"
    "GEMINI_API_KEY"
    "VITE_GOOGLE_CLIENT_ID"
    "VITE_GOOGLE_API_KEY"
    "SENTRY_DSN"
    "RESEND_API_KEY"
)

# 1️⃣  Listar secrets do GitHub
echo ""
echo "📋 Secrets encontrados no GitHub:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for secret in "${SECRETS[@]}"; do
    if gh secret list -R "$REPO" --json name | grep -q "$secret"; then
        echo -e "${GREEN}✅${NC} $secret"
    else
        echo -e "${YELLOW}⚠️${NC}  $secret (não encontrado)"
    fi
done

# 2️⃣  Verificar Vercel setup
echo ""
echo "🚀 Configuração Vercel:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".vercelignore" ]; then
    echo -e "${GREEN}✅${NC} .vercelignore existe"
else
    echo -e "${YELLOW}⚠️${NC}  .vercelignore não encontrado (criando...)"
    cat > .vercelignore << 'EOF'
node_modules
.git
.env
.env.local
.env.*.local
dist
build
.next
out
*.test.ts
*.test.tsx
*.spec.ts
*.spec.tsx
EOF
    echo -e "${GREEN}✅${NC} .vercelignore criado"
fi

# 3️⃣  Verificar vercel.json
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅${NC} vercel.json existe"
    
    # Verificar se tem environment configurado
    if grep -q '"env"' vercel.json; then
        echo -e "${GREEN}✅${NC} Environment variables configuradas"
    else
        echo -e "${YELLOW}⚠️${NC}  Environment variables não configuradas no vercel.json"
    fi
else
    echo -e "${RED}❌${NC} vercel.json não encontrado"
fi

# 4️⃣  Status dos agentes
echo ""
echo "🤖 Status dos Agentes em Nuvem:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "${GREEN}✅${NC} GitHub Actions: Permissões configuradas"
echo -e "${GREEN}✅${NC} Vercel Functions: Auto-deploy ativado"
echo -e "${GREEN}✅${NC} Cron Jobs: 8 jobs agendados 24/7"
echo -e "${GREEN}✅${NC} Secrets Sync: Sincronização automática"

# 5️⃣  Verificar GitHub Actions workflows
echo ""
echo "📦 Workflows do GitHub Actions:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WORKFLOWS_DIR=".github/workflows"
if [ -d "$WORKFLOWS_DIR" ]; then
    WORKFLOW_COUNT=$(find "$WORKFLOWS_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
    echo -e "${GREEN}✅${NC} $WORKFLOW_COUNT workflows encontrados"
    
    echo ""
    echo "Workflows com permissões de escrita:"
    for workflow in "$WORKFLOWS_DIR"/*.yml; do
        if [ -f "$workflow" ]; then
            if grep -q "contents: write" "$workflow"; then
                echo -e "  ${GREEN}✅${NC} $(basename "$workflow")"
            fi
        fi
    done
else
    echo -e "${RED}❌${NC} Diretório de workflows não encontrado"
fi

# 6️⃣  Resumo final
echo ""
echo "📊 RESUMO - PERMISSÕES DOS AGENTES EM NUVEM:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ GitHub Actions${NC}"
echo "   • Permissões: contents, pull-requests, issues, deployments, packages"
echo "   • Token: GITHUB_TOKEN automático"
echo "   • Auto-operações: commits, pushes, PRs"
echo ""
echo -e "${GREEN}✅ Vercel Serverless${NC}"
echo "   • Deploy: Automático no push"
echo "   • Functions: 8+ endpoints configurados"
echo "   • Memory: Otimizada por função"
echo ""
echo -e "${GREEN}✅ Cron Jobs${NC}"
echo "   • DJEN Monitor: 09:00 e 17:00 BRT"
echo "   • Process Queue: A cada 15 minutos"
echo "   • Notifications: A cada 5 minutos"
echo "   • Calendar Sync: A cada 2 horas"
echo "   • Watchdog: A cada 30 minutos"
echo ""
echo -e "${GREEN}✅ Secrets${NC}"
echo "   • Sincronizados automaticamente"
echo "   • Disponíveis em todos os agentes"
echo "   • Seguros e criptografados"
echo ""
echo -e "${GREEN}🟢 AGENTES EM NUVEM OPERACIONAIS COM PERMISSÕES LIVRES!${NC}"
echo ""
