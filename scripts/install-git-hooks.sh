#!/bin/bash
# Script para instalar/configurar Git hooks automaticamente
# Uso: ./scripts/install-git-hooks.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Instalando Git hooks para garantir qualidade do código..."
echo ""

# Verificar se estamos em um repositório Git
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Erro: Não é um repositório Git!"
    echo "Execute este script dentro do diretório do projeto."
    exit 1
fi

# Criar diretório de hooks se não existir
mkdir -p "$HOOKS_DIR"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Instalar pre-commit hook
echo "📝 Instalando pre-commit hook..."
cat > "$HOOKS_DIR/pre-commit" << 'HOOK_EOF'
#!/bin/bash
# Pre-commit hook para executar testes antes de cada commit
# Este hook impede commits que quebram testes

set -e
set -o pipefail

echo "🔍 Pre-commit: Executando verificações..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se há arquivos staged
STAGED_FILES=$(git diff --cached --name-only)
if [ -z "$STAGED_FILES" ]; then
    echo "${YELLOW}⚠️  Nenhum arquivo staged para commit${NC}"
    exit 0
fi

# 2. Verificar se há mudanças em arquivos TypeScript/JavaScript
TS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -z "$TS_FILES" ]; then
    echo "${GREEN}✅ Nenhum arquivo TypeScript/JavaScript alterado - pulando testes${NC}"
    exit 0
fi

echo "${YELLOW}📝 Arquivos TypeScript/JavaScript modificados:${NC}"
echo "$TS_FILES"
echo ""

# 3. Executar type-check
echo "${YELLOW}🔎 Executando verificação de tipos...${NC}"
if ! npm run type-check 2>&1 | grep -v "^$"; then
    echo "${RED}❌ Type-check falhou! Corrija os erros de tipo antes de commitar.${NC}"
    exit 1
fi
echo "${GREEN}✅ Type-check passou${NC}"
echo ""

# 4. Executar lint apenas nos arquivos modificados
echo "${YELLOW}🧹 Executando lint nos arquivos modificados...${NC}"
EXISTING_TS_FILES=$(echo "$TS_FILES" | while read -r file; do
    [ -f "$file" ] && echo "$file"
done)

if [ -n "$EXISTING_TS_FILES" ]; then
    if ! npx eslint $EXISTING_TS_FILES --max-warnings 10; then
        echo "${RED}❌ Lint falhou! Corrija os problemas antes de commitar.${NC}"
        echo "${YELLOW}💡 Dica: Execute 'npm run lint:fix' para corrigir automaticamente${NC}"
        exit 1
    fi
    echo "${GREEN}✅ Lint passou${NC}"
else
    echo "${YELLOW}⚠️  Nenhum arquivo TS existente para lint${NC}"
fi
echo ""

# 5. Executar testes rápidos (apenas testes unitários, sem coverage)
echo "${YELLOW}🧪 Executando testes unitários...${NC}"
# Opção rápida para desenvolvedores: defina GIT_HOOKS_FAST=1 para pular testes pesados
if [ "${GIT_HOOKS_FAST}" = "1" ]; then
    echo "${YELLOW}⚡ Modo rápido ativado (GIT_HOOKS_FAST=1) — pulando execução completa dos testes${NC}"
    # Execute uma suíte reduzida (shard) para garantir rapidez no feedback local
    tmpfile=$(mktemp)
    # Rodar suíte rápida (apenas testes em src) para feedback local
    if ! npm run test:fast >"$tmpfile" 2>&1; then
        tail -n 20 "$tmpfile"
        rm -f "$tmpfile"
        echo "${RED}❌ Testes rápidos (shard) falharam! Corrija antes de commitar.${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
else
    # Executar apenas os testes relacionados aos arquivos staged (muito mais rápido que rodar a suíte inteira)
    STAGED_TESTS=$(echo "$TS_FILES" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
    RELATED_TESTS=""

    if [ -n "$STAGED_TESTS" ]; then
        RELATED_TESTS="$STAGED_TESTS"
    else
        # Para cada arquivo TypeScript modificado, procurar testes que referenciem o mesmo basename
        for f in $TS_FILES; do
            base=$(basename "$f" | sed 's/\.[^.]*$//')
            # procurar testes com o mesmo basename
            matches=$(git ls-files | grep -E "/${base}\\.(test|spec)\\.(ts|tsx|js|jsx)$" || true)
            if [ -n "$matches" ]; then
                RELATED_TESTS="$RELATED_TESTS $matches"
                continue
            fi
            # procurar testes no mesmo diretório
            dir=$(dirname "$f")
            matches=$(git ls-files "$dir" | grep -E '\.(test|spec)\.(ts|tsx|js|jsx)$' || true)
            if [ -n "$matches" ]; then
                RELATED_TESTS="$RELATED_TESTS $matches"
            fi
        done
    fi

    # Remover duplicatas
    RELATED_TESTS=$(echo "$RELATED_TESTS" | tr ' ' '\n' | sed '/^$/d' | sort -u | tr '\n' ' ')

    if [ -n "$RELATED_TESTS" ]; then
        echo "${YELLOW}⚡ Executando apenas testes relacionados: ${NC}"
        echo "$RELATED_TESTS"
        tmpfile=$(mktemp)
        if ! npm run test:run -- $RELATED_TESTS >"$tmpfile" 2>&1; then
            tail -n 20 "$tmpfile"
            rm -f "$tmpfile"
            echo "${RED}❌ Testes relacionados falharam! Corrija os testes antes de commitar.${NC}"
            exit 1
        fi
        rm -f "$tmpfile"
    else
        echo "${YELLOW}⚠️  Nenhum teste relacionado detectado - executando suíte reduzida (fast)${NC}"
        tmpfile=$(mktemp)
        if ! npm run test:fast >"$tmpfile" 2>&1; then
            tail -n 20 "$tmpfile"
            rm -f "$tmpfile"
            echo "${RED}❌ Testes (shard) falharam! Corrija antes de commitar.${NC}"
            exit 1
        fi
        rm -f "$tmpfile"
    fi
fi
echo "${GREEN}✅ Testes passaram${NC}"
echo ""

# 6. Sucesso!
echo "${GREEN}✅ Todas as verificações passaram! Prosseguindo com commit...${NC}"
exit 0
HOOK_EOF

chmod +x "$HOOKS_DIR/pre-commit"
echo "${GREEN}✅ Pre-commit hook instalado${NC}"
echo ""

# 2. Instalar pre-push hook
echo "📝 Instalando pre-push hook..."
cat > "$HOOKS_DIR/pre-push" << 'HOOK_EOF'
#!/bin/bash
# Pre-push hook para executar testes completos antes de push
# Este hook garante que apenas código testado e validado seja enviado ao repositório

set -e
set -o pipefail

echo "🚀 Pre-push: Executando verificações completas..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se há commits para push
COMMITS=$(git log @{u}.. --oneline 2>/dev/null || git log --oneline)
if [ -z "$COMMITS" ]; then
    echo "${YELLOW}⚠️  Nenhum commit novo para push${NC}"
    exit 0
fi

echo "${BLUE}📦 Commits que serão enviados:${NC}"
echo "$COMMITS"
echo ""

# 1. Build completo
echo "${YELLOW}🔨 Executando build completo...${NC}"
if [ "${GIT_HOOKS_FAST}" = "1" ]; then
    echo "${YELLOW}⚡ Modo rápido ativado (GIT_HOOKS_FAST=1) — pulando build completo${NC}"
else
        tmpfile=$(mktemp)
        if ! npm run build >"$tmpfile" 2>&1; then
            tail -n 20 "$tmpfile"
            rm -f "$tmpfile"
            echo "${RED}❌ Build falhou! Corrija os erros de build antes de fazer push.${NC}"
            exit 1
        fi
        rm -f "$tmpfile"
fi
echo "${GREEN}✅ Build passou${NC}"
echo ""

# 2. Type-check completo
echo "${YELLOW}🔎 Executando verificação de tipos completa...${NC}"
    tmpfile=$(mktemp)
    if ! npm run type-check >"$tmpfile" 2>&1; then
        tail -n 20 "$tmpfile"
        rm -f "$tmpfile"
        echo "${RED}❌ Type-check falhou! Corrija os erros de tipo antes de fazer push.${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
echo "${GREEN}✅ Type-check passou${NC}"
echo ""

# 3. Lint completo
echo "${YELLOW}🧹 Executando lint completo...${NC}"
    tmpfile=$(mktemp)
    if ! npm run lint >"$tmpfile" 2>&1; then
        tail -n 20 "$tmpfile"
        rm -f "$tmpfile"
        echo "${RED}❌ Lint falhou! Corrija os problemas antes de fazer push.${NC}"
        echo "${YELLOW}💡 Dica: Execute 'npm run lint:fix' para corrigir automaticamente${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
echo "${GREEN}✅ Lint passou${NC}"
echo ""

# 4. Testes unitários completos
echo "${YELLOW}🧪 Executando testes unitários completos...${NC}"
if [ "${GIT_HOOKS_SKIP_TESTS}" = "1" ]; then
    echo "${YELLOW}⚠️  GIT_HOOKS_SKIP_TESTS=1 — pulando testes unitários no hook${NC}"
elif [ "${GIT_HOOKS_SKIP_UNIT_TESTS}" = "1" ]; then
    echo "${YELLOW}⚠️  GIT_HOOKS_SKIP_UNIT_TESTS=1 — pulando testes unitários no hook${NC}"
else
if [ "${GIT_HOOKS_FAST}" = "1" ]; then
    echo "${YELLOW}⚡ Modo rápido ativado — executando apenas smoke tests${NC}"
    echo "${YELLOW}⚠️  Executando suíte reduzida (fast) para feedback rápido${NC}"
    tmpfile=$(mktemp)
    if ! timeout --preserve-status 20m npm run test:fast >"$tmpfile" 2>&1; then
        tail -n 30 "$tmpfile"
        rm -f "$tmpfile"
        echo "${YELLOW}💡 Se o hook travar com frequência, use GIT_HOOKS_SKIP_UNIT_TESTS=1 ou faça push manual após rodar os testes.${NC}"
        echo "${RED}❌ Testes (shard) falharam! Corrija antes de fazer push.${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
else
    tmpfile=$(mktemp)
    if ! timeout --preserve-status 20m npm run test:run >"$tmpfile" 2>&1; then
        tail -n 30 "$tmpfile"
        rm -f "$tmpfile"
        echo "${YELLOW}💡 Se o hook travar com frequência, use GIT_HOOKS_SKIP_UNIT_TESTS=1 ou faça push manual após rodar os testes.${NC}"
        echo "${RED}❌ Testes unitários falharam! Corrija os testes antes de fazer push.${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
fi
fi
echo "${GREEN}✅ Testes unitários passaram${NC}"
echo ""

# 5. Testes de API
echo "${YELLOW}🔌 Executando testes de API...${NC}"
    tmpfile=$(mktemp)
    if ! npm run test:api >"$tmpfile" 2>&1; then
        tail -n 30 "$tmpfile"
        rm -f "$tmpfile"
        echo "${RED}❌ Testes de API falharam! Corrija os testes antes de fazer push.${NC}"
        exit 1
    fi
    rm -f "$tmpfile"
echo "${GREEN}✅ Testes de API passaram${NC}"
echo ""

# 6. Verificar se package-lock.json está sincronizado
if git diff --name-only @{u}.. | grep -q "package.json"; then
    if ! git diff --name-only @{u}.. | grep -q "package-lock.json"; then
        echo "${RED}❌ package.json foi modificado mas package-lock.json não!${NC}"
        echo "${YELLOW}💡 Execute 'npm install' para atualizar package-lock.json${NC}"
        exit 1
    fi
    echo "${GREEN}✅ package.json e package-lock.json sincronizados${NC}"
    echo ""
fi

# 7. Resumo final
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ TODAS AS VERIFICAÇÕES PASSARAM!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "${BLUE}📤 Prosseguindo com push para o repositório remoto...${NC}"
exit 0
HOOK_EOF

chmod +x "$HOOKS_DIR/pre-push"
echo "${GREEN}✅ Pre-push hook instalado${NC}"
echo ""

# 3. Mostrar resumo
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ Git hooks instalados com sucesso!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Hooks instalados:"
echo "  • pre-commit  - Executa type-check, lint e testes antes de cada commit"
echo "  • pre-push    - Executa build completo e todos os testes antes de push"
echo ""
echo "${YELLOW}💡 Dicas:${NC}"
echo "  • Para pular hooks temporariamente: git commit --no-verify"
echo "  • Para testar hooks manualmente: .git/hooks/pre-commit"
echo "  • Para desinstalar: rm .git/hooks/pre-commit .git/hooks/pre-push"
echo ""
