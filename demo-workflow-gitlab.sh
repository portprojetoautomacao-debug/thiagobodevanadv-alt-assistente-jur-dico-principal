#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════
# SCRIPT DE DEMONSTRAÇÃO: WORKFLOW PROFISSIONAL COM GITLAB
# ═══════════════════════════════════════════════════════════════════════
# Este script demonstra como usar o GitLab para desenvolvimento profissional
# ═══════════════════════════════════════════════════════════════════════

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DEMONSTRAÇÃO: WORKFLOW PROFISSIONAL COM GITLAB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
echo -e "${NC}"

# ═══════════════════════════════════════════════════════════════════════
# 1. CRIAR FEATURE BRANCH
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📝 PASSO 1: Criar Feature Branch${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "Digite o nome da feature (ex: busca-avancada): " FEATURE_NAME

if [ -z "$FEATURE_NAME" ]; then
    FEATURE_NAME="demo-feature"
fi

BRANCH_NAME="feature/${FEATURE_NAME}"

echo -e "${YELLOW}Criando branch: ${BRANCH_NAME}${NC}"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

echo -e "${GREEN}✅ Branch criada/selecionada: ${BRANCH_NAME}${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# 2. FAZER MUDANÇAS
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}✏️  PASSO 2: Fazer Alterações${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Criar arquivo de exemplo
mkdir -p src/features
cat > "src/features/${FEATURE_NAME}.ts" << 'TYPESCRIPT'
/**
 * Nova feature implementada
 * @example
 * const result = newFeature();
 */
export function newFeature(): string {
  return 'Feature implementada com sucesso!';
}

export default newFeature;
TYPESCRIPT

echo -e "${GREEN}✅ Arquivo criado: src/features/${FEATURE_NAME}.ts${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# 3. COMMIT COM CONVENTIONAL COMMITS
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}💾 PASSO 3: Commit (Conventional Commits)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

git add .

echo -e "${YELLOW}Tipos de commit:${NC}"
echo "  feat:     Nova funcionalidade"
echo "  fix:      Correção de bug"
echo "  docs:     Documentação"
echo "  style:    Formatação"
echo "  refactor: Refatoração"
echo "  test:     Testes"
echo "  chore:    Manutenção"
echo ""

read -p "Tipo do commit (feat/fix/docs/etc): " COMMIT_TYPE
if [ -z "$COMMIT_TYPE" ]; then
    COMMIT_TYPE="feat"
fi

read -p "Descrição do commit: " COMMIT_MSG
if [ -z "$COMMIT_MSG" ]; then
    COMMIT_MSG="adicionar ${FEATURE_NAME}"
fi

FULL_COMMIT="${COMMIT_TYPE}: ${COMMIT_MSG}"

git commit -m "$FULL_COMMIT"

echo -e "${GREEN}✅ Commit criado: ${FULL_COMMIT}${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# 4. PUSH E CRIAR MERGE REQUEST
# ═══════════════════════════════════════════════════════════════════════

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📤 PASSO 4: Push e Criar Merge Request${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}Fazendo push da branch...${NC}"
git push -u origin "$BRANCH_NAME"

echo -e "${GREEN}✅ Push completo!${NC}\n"

# Obter URL do projeto
PROJECT_URL=$(git remote get-url origin | sed 's/\.git$//')

echo -e "${CYAN}"
cat << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Abrir Merge Request no GitLab:
   ${PROJECT_URL}/-/merge_requests/new?merge_request[source_branch]=${BRANCH_NAME}

2️⃣  O GitLab automaticamente irá:
   ✅ Rodar todos os testes
   ✅ Verificar qualidade do código
   ✅ Fazer security scan
   ✅ Mostrar diff visual

3️⃣  Após aprovação do review:
   ✅ Merge para main
   ✅ Deploy automático para staging
   ✅ Notificações enviadas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TEMPLATE DO MERGE REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

O template já está configurado em:
.gitlab/merge_request_templates/default.md

Ao abrir o MR, você verá um checklist completo!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 WORKFLOW COMPLETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Developer              GitLab CI/CD           Reviewers
    │                        │                     │
    ├─ Create branch         │                     │
    ├─ Make changes          │                     │
    ├─ Commit & push ───────>│                     │
    │                        ├─ Run tests          │
    │                        ├─ Build app          │
    │                        ├─ Security scan      │
    │                        ├─ Create MR ────────>│
    │                        │                     ├─ Code review
    │                        │                     ├─ Approve
    │                        │<────────────────────┘
    │                        ├─ Merge to main
    │                        ├─ Deploy staging
    │                        └─ Notify team ──────>│

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
echo -e "${NC}"

echo -e "${PURPLE}💡 Dica: Use 'git log --oneline --graph' para ver o histórico${NC}\n"

# ═══════════════════════════════════════════════════════════════════════
# 5. OPÇÕES ADICIONAIS
# ═══════════════════════════════════════════════════════════════════════

echo -e "${YELLOW}Deseja voltar para a branch main? (y/n)${NC}"
read -r RESPONSE

if [[ "$RESPONSE" =~ ^[Yy]$ ]]; then
    git checkout main
    echo -e "${GREEN}✅ Voltou para branch main${NC}"
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Workflow demo completo!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
