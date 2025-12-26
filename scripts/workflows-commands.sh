#!/bin/bash

# 🚀 Comandos Úteis - Workflows Seguros e Branch Protection
# Referência rápida para gerenciar workflows e branch protection
# Uso: source scripts/workflows-commands.sh

echo "📋 Comandos Úteis - Workflows Seguros"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# BRANCH PROTECTION
# ============================================================================

alias branch-protect="echo '🔐 Aplicando proteção de branch...'; ./scripts/configure-branch-protection.sh"

alias branch-status="echo '📊 Status da proteção de branch:'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/branches/main/protection | jq '.required_status_checks, .required_pull_request_reviews'"

alias branch-rules="echo '📜 Regras de proteção:'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/branches/main/protection | jq"

# ============================================================================
# WORKFLOWS
# ============================================================================

alias workflows-list="echo '📋 Workflows disponíveis:'; gh workflow list"

alias workflows-status="echo '📊 Status dos workflows:'; gh run list --limit 10"

alias workflows-view="gh run view --log"

alias workflows-cancel="gh run cancel"

alias workflows-rerun="gh run rerun"

# ============================================================================
# CI/CD
# ============================================================================

alias ci-logs="echo '🔍 Logs do CI:'; gh run list --workflow=ci.yml --limit 5"

alias ci-latest="echo '📊 Último CI:'; gh run view \$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')"

alias deploy-logs="echo '🚀 Logs de deploy:'; gh run list --workflow=deploy.yml --limit 5"

alias deploy-latest="echo '📊 Último deploy:'; gh run view \$(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')"

# ============================================================================
# DEPENDABOT
# ============================================================================

alias dependabot-prs="echo '🤖 PRs do Dependabot:'; gh pr list --author 'app/dependabot'"

alias dependabot-merge="echo '✅ Mergeando PR do Dependabot...'; gh pr merge --auto --squash"

alias dependabot-status="echo '📊 Status dos PRs do Dependabot:'; gh pr list --author 'app/dependabot' --json number,title,state,statusCheckRollup"

# ============================================================================
# SECRETS
# ============================================================================

alias secrets-list="echo '🔐 Secrets configurados:'; gh secret list"

alias secrets-set="gh secret set"

alias secrets-delete="gh secret delete"

# ============================================================================
# PULL REQUESTS
# ============================================================================

alias pr-create="gh pr create --fill"

alias pr-list="gh pr list"

alias pr-view="gh pr view"

alias pr-checks="gh pr checks"

alias pr-merge="gh pr merge --squash"

# ============================================================================
# CACHE
# ============================================================================

alias cache-list="echo '💾 Caches disponíveis:'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/caches | jq '.actions_caches[] | {id, key, size_in_bytes}'"

alias cache-delete="echo '🗑️  Deletando cache...'; gh api --method DELETE /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/caches"

alias cache-clear-all="echo '🗑️  Limpando todos os caches...'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/caches | jq -r '.actions_caches[].id' | xargs -I {} gh api --method DELETE /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/caches/{}"

# ============================================================================
# AMBIENTES
# ============================================================================

alias env-list="echo '🌍 Ambientes configurados:'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/environments | jq '.environments[] | {name, protection_rules}'"

alias env-secrets="echo '🔐 Secrets do ambiente:'; gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/environments/production/secrets | jq"

# ============================================================================
# TESTES
# ============================================================================

alias test-unit="npm run test:run"

alias test-e2e="npm run test:e2e"

alias test-all="npm run test:all"

alias test-coverage="npm run test:coverage"

# ============================================================================
# BUILD E LINT
# ============================================================================

alias lint-fix="npm run lint:fix"

alias lint-check="npm run lint"

alias build-prod="npm run build"

alias build-dev="npm run dev"

# ============================================================================
# UTILITÁRIOS
# ============================================================================

# Verificar status completo do repositório
function repo-status() {
    echo -e "${GREEN}📊 STATUS COMPLETO DO REPOSITÓRIO${NC}"
    echo "======================================"
    echo ""
    
    echo -e "${YELLOW}🔐 Branch Protection:${NC}"
    gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/branches/main/protection --silent && echo "✅ Configurado" || echo "❌ Não configurado"
    echo ""
    
    echo -e "${YELLOW}🤖 Dependabot PRs:${NC}"
    gh pr list --author 'app/dependabot' --json number,title | jq -r '.[] | "  - #\(.number): \(.title)"'
    echo ""
    
    echo -e "${YELLOW}🚀 Últimos Workflows:${NC}"
    gh run list --limit 5 --json name,status,conclusion,createdAt | jq -r '.[] | "  - \(.name): \(.status) (\(.conclusion // "in-progress"))"'
    echo ""
    
    echo -e "${YELLOW}🔐 Secrets Configurados:${NC}"
    gh secret list | head -10
    echo ""
    
    echo -e "${YELLOW}💾 Cache:${NC}"
    CACHE_COUNT=$(gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/caches | jq '.total_count')
    echo "  Total de caches: $CACHE_COUNT"
    echo ""
    
    echo -e "${GREEN}✅ Verificação completa!${NC}"
}

# Verificar se CI passou
function ci-passed() {
    local sha=${1:-$(git rev-parse HEAD)}
    echo "🔍 Verificando CI para commit $sha..."
    
    gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/commits/$sha/check-runs \
        | jq -r '.check_runs[] | select(.name == "Build and Test") | .conclusion' \
        | grep -q "success" \
        && echo "✅ CI passou!" \
        || echo "❌ CI falhou ou ainda rodando"
}

# Criar PR de teste
function create-test-pr() {
    echo "🧪 Criando PR de teste..."
    
    git checkout -b test-pr-$(date +%s)
    echo "# Test PR - $(date)" >> README.md
    git add README.md
    git commit -m "test: PR de teste para validar workflows"
    git push -u origin HEAD
    gh pr create --fill --draft
    
    echo "✅ PR de teste criado! Verifique os workflows."
}

# Validar configuração completa
function validate-setup() {
    echo -e "${GREEN}🔍 VALIDANDO CONFIGURAÇÃO COMPLETA${NC}"
    echo "======================================"
    echo ""
    
    local errors=0
    
    # Branch protection
    echo -n "🔐 Branch protection... "
    if gh api /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/branches/main/protection --silent 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Execute: ./scripts/configure-branch-protection.sh${NC}"
        ((errors++))
    fi
    
    # Secrets
    echo -n "🔐 VERCEL_TOKEN... "
    if gh secret list | grep -q "VERCEL_TOKEN"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Configure o secret VERCEL_TOKEN${NC}"
        ((errors++))
    fi
    
    echo -n "🔐 VERCEL_ORG_ID... "
    if gh secret list | grep -q "VERCEL_ORG_ID"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Configure o secret VERCEL_ORG_ID${NC}"
        ((errors++))
    fi
    
    echo -n "🔐 VERCEL_PROJECT_ID... "
    if gh secret list | grep -q "VERCEL_PROJECT_ID"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Configure o secret VERCEL_PROJECT_ID${NC}"
        ((errors++))
    fi
    
    # Workflows
    echo -n "📋 Workflows configurados... "
    if [ -f ".github/workflows/ci.yml" ] && [ -f ".github/workflows/deploy.yml" ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌ Workflows faltando${NC}"
        ((errors++))
    fi
    
    echo ""
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}🎉 Tudo configurado corretamente!${NC}"
        return 0
    else
        echo -e "${RED}⚠️  $errors problema(s) encontrado(s)${NC}"
        return 1
    fi
}

# Limpar workflows antigos (falhas)
function cleanup-failed-runs() {
    echo "🧹 Limpando workflows falhos..."
    
    gh run list --status failure --json databaseId --jq '.[].databaseId' \
        | xargs -I {} gh api --method DELETE /repos/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/runs/{}
    
    echo "✅ Workflows falhos removidos!"
}

# ============================================================================
# HELP
# ============================================================================

function workflows-help() {
    echo -e "${GREEN}🚀 Comandos Úteis - Workflows Seguros${NC}"
    echo "======================================"
    echo ""
    echo -e "${YELLOW}Branch Protection:${NC}"
    echo "  branch-protect     - Aplicar proteção de branch"
    echo "  branch-status      - Ver status da proteção"
    echo "  branch-rules       - Ver regras detalhadas"
    echo ""
    echo -e "${YELLOW}Workflows:${NC}"
    echo "  workflows-list     - Listar workflows"
    echo "  workflows-status   - Status dos workflows"
    echo "  workflows-view     - Ver logs de um workflow"
    echo "  workflows-cancel   - Cancelar workflow"
    echo "  workflows-rerun    - Re-executar workflow"
    echo ""
    echo -e "${YELLOW}CI/CD:${NC}"
    echo "  ci-logs            - Logs do CI"
    echo "  ci-latest          - Último CI executado"
    echo "  deploy-logs        - Logs de deploy"
    echo "  deploy-latest      - Último deploy"
    echo ""
    echo -e "${YELLOW}Dependabot:${NC}"
    echo "  dependabot-prs     - Listar PRs do Dependabot"
    echo "  dependabot-merge   - Mergear PR do Dependabot"
    echo "  dependabot-status  - Status dos PRs"
    echo ""
    echo -e "${YELLOW}Secrets:${NC}"
    echo "  secrets-list       - Listar secrets"
    echo "  secrets-set        - Definir secret"
    echo "  secrets-delete     - Deletar secret"
    echo ""
    echo -e "${YELLOW}Pull Requests:${NC}"
    echo "  pr-create          - Criar PR"
    echo "  pr-list            - Listar PRs"
    echo "  pr-view            - Ver detalhes de um PR"
    echo "  pr-checks          - Ver checks de um PR"
    echo "  pr-merge           - Mergear PR"
    echo ""
    echo -e "${YELLOW}Cache:${NC}"
    echo "  cache-list         - Listar caches"
    echo "  cache-delete       - Deletar cache específico"
    echo "  cache-clear-all    - Limpar todos os caches"
    echo ""
    echo -e "${YELLOW}Funções Úteis:${NC}"
    echo "  repo-status        - Status completo do repo"
    echo "  ci-passed [sha]    - Verificar se CI passou"
    echo "  create-test-pr     - Criar PR de teste"
    echo "  validate-setup     - Validar configuração"
    echo "  cleanup-failed-runs- Limpar workflows falhos"
    echo ""
    echo -e "${YELLOW}Ajuda:${NC}"
    echo "  workflows-help     - Esta mensagem"
    echo ""
}

# Mostrar help ao carregar
workflows-help

echo ""
echo -e "${GREEN}✅ Comandos carregados! Digite 'workflows-help' para ver a lista completa.${NC}"
