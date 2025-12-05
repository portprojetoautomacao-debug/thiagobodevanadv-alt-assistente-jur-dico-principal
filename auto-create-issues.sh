#!/bin/bash

# ========================================
# 🤖 Auto-Create Issues from Code Comments
# ========================================
# 
# Cria issues automaticamente no GitHub a partir de
# comentários TODO, FIXME, PENDENTE, etc no código
#
# Uso: ./auto-create-issues.sh
# ========================================

set -e

echo "🔍 Procurando por triggers no código..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) não está instalado${NC}"
    echo "Instale com: https://cli.github.com/"
    exit 1
fi

# Verificar se está autenticado
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI não está autenticado${NC}"
    echo "Execute: gh auth login"
    exit 1
fi

# Padrão de busca (todos os triggers)
PATTERN='TODO|FIXME|ISSUE|HACK|PENDENTE|REVISAR|CORRIGIR|VERIFICAR|ATENÇÃO|URGENTE|BUG|JURIDICO|PRAZO|INTIMACAO|VALIDAR|COMPLIANCE|LGPD|SEGURANCA|REFACTOR|OPTIMIZE|DEPRECATED|BREAKING|PERFORMANCE|ACCESSIBILITY|A11Y|SECURITY|TEST|DOC|DOCS'

# Contador de issues criados
ISSUES_CREATED=0

# Buscar por triggers no código
echo -e "${BLUE}📂 Procurando em arquivos TypeScript, JavaScript, CSS, HTML...${NC}"

# Buscar em arquivos relevantes (excluir node_modules, dist, etc)
grep -rn -E "//\s*($PATTERN)" \
  --include="*.ts" \
  --include="*.tsx" \
  --include="*.js" \
  --include="*.jsx" \
  --include="*.css" \
  --include="*.scss" \
  --include="*.html" \
  --exclude-dir=node_modules \
  --exclude-dir=dist \
  --exclude-dir=.vite \
  --exclude-dir=coverage \
  --exclude-dir=.git \
  . 2>/dev/null | while IFS=: read -r file line content; do
  
  # Extrair tipo de trigger
  TRIGGER=$(echo "$content" | grep -oE "($PATTERN)" | head -1)
  
  # Limpar comentário
  COMMENT=$(echo "$content" | sed 's|^\s*//\s*||' | sed "s|^\s*$TRIGGER:\s*||")
  
  # Gerar título
  TITLE="[$TRIGGER] $COMMENT"
  
  # Limitar tamanho do título
  if [ ${#TITLE} -gt 100 ]; then
    TITLE="${TITLE:0:97}..."
  fi
  
  # Gerar corpo do issue
  BODY="**Detectado automaticamente no código**

📁 **Arquivo**: \`$file\`
📍 **Linha**: $line
🏷️ **Tipo**: $TRIGGER

---

### 📝 Comentário Original

\`\`\`typescript
$content
\`\`\`

---

### 🔗 Link para o código

[Ver no repositório](https://github.com/$GITHUB_REPOSITORY/blob/main/$file#L$line)

---

🤖 *Issue criado automaticamente pelo script auto-create-issues.sh*
"

  # Determinar labels baseado no trigger
  LABELS="auto-created,needs-triage"
  
  case $TRIGGER in
    URGENTE|CRITICAL)
      LABELS="$LABELS,priority:high,urgente"
      ;;
    BUG|FIXME|CORRIGIR)
      LABELS="$LABELS,bug"
      ;;
    JURIDICO|PRAZO|INTIMACAO|COMPLIANCE|LGPD)
      LABELS="$LABELS,juridico"
      ;;
    SECURITY|SEGURANCA)
      LABELS="$LABELS,security"
      ;;
    PERFORMANCE|OPTIMIZE)
      LABELS="$LABELS,performance"
      ;;
    ACCESSIBILITY|A11Y)
      LABELS="$LABELS,accessibility"
      ;;
    TEST)
      LABELS="$LABELS,testing"
      ;;
    DOC|DOCS)
      LABELS="$LABELS,documentation"
      ;;
    REFACTOR)
      LABELS="$LABELS,refactor"
      ;;
    DEPRECATED|BREAKING)
      LABELS="$LABELS,breaking-change"
      ;;
  esac
  
  # Criar issue (verificar se já existe antes)
  EXISTING=$(gh issue list --search "$TITLE" --json number --jq '.[0].number' 2>/dev/null || echo "")
  
  if [ -z "$EXISTING" ]; then
    echo -e "${GREEN}✅ Criando issue: $TITLE${NC}"
    
    gh issue create \
      --title "$TITLE" \
      --body "$BODY" \
      --label "$LABELS" \
      --assignee "@me" 2>/dev/null || {
        echo -e "${RED}❌ Erro ao criar issue: $TITLE${NC}"
        continue
      }
    
    ((ISSUES_CREATED++))
    
    # Pequeno delay para não sobrecarregar a API
    sleep 0.5
  else
    echo -e "${YELLOW}⏭️  Issue já existe: $TITLE (#$EXISTING)${NC}"
  fi
done

echo ""
echo -e "${GREEN}🎉 Concluído!${NC}"
echo -e "${BLUE}📊 Total de issues criados: $ISSUES_CREATED${NC}"
echo -e "${BLUE}🔗 Ver issues: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/issues${NC}"
