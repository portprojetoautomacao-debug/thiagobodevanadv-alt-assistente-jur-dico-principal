#!/bin/bash

# ============================================
# 🔧 FIX ALL REPOSITORY NAMES
# ============================================
# Corrige todas as referências ao nome antigo do repositório

set -e

echo "🔧 Corrigindo todas as referências ao repositório..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Contadores
FIXED=0

# Padrões a substituir
declare -A REPLACEMENTS=(
  # GitHub URLs com barra
  ["portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"]="portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"
  ["portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"]="portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal"

  # SonarCloud project keys com underscore
  ["portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"]="portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
  ["portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"]="portprojetoautomacao-debug_thiagobodevanadv-alt-assistente-jur-dico-principal"
)

# Tipos de arquivo a processar
FILE_PATTERNS=(
  "*.sh"
  "*.md"
  "*.js"
  "*.mjs"
  "*.json"
  "*.ts"
  "*.yml"
  "*.yaml"
  "*.properties"
)

# Diretórios a ignorar
EXCLUDE_DIRS=(
  "node_modules"
  ".git"
  "dist"
  "coverage"
  "coverage-api"
  ".vscode-test"
  ".sonar"
)

# Construir find command
FIND_CMD="find . -type f \("
for i in "${!FILE_PATTERNS[@]}"; do
  if [ $i -eq 0 ]; then
    FIND_CMD="$FIND_CMD -name \"${FILE_PATTERNS[$i]}\""
  else
    FIND_CMD="$FIND_CMD -o -name \"${FILE_PATTERNS[$i]}\""
  fi
done
FIND_CMD="$FIND_CMD \)"

for dir in "${EXCLUDE_DIRS[@]}"; do
  FIND_CMD="$FIND_CMD ! -path \"*/$dir/*\""
done

echo "📁 Buscando arquivos para corrigir..."

# Executar find e armazenar arquivos
FILES=$(eval "$FIND_CMD")

if [ -z "$FILES" ]; then
  echo -e "${YELLOW}⚠️  Nenhum arquivo encontrado${NC}"
  exit 0
fi

# Processar cada arquivo
while IFS= read -r file; do
  [ -z "$file" ] && continue
  CHANGED=false

  for old in "${!REPLACEMENTS[@]}"; do
    new="${REPLACEMENTS[$old]}"

    # Verificar se o arquivo contém o padrão antigo
    if grep -q "$old" "$file" 2>/dev/null; then
      # Fazer substituição
      sed -i "s|$old|$new|g" "$file" 2>/dev/null || continue
      CHANGED=true
    fi
  done

  if [ "$CHANGED" = true ]; then
    echo -e "${GREEN}✅ Corrigido: $file${NC}"
    ((FIXED++))
  fi
done <<< "$FILES"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RELATÓRIO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Arquivos corrigidos: $FIXED${NC}"
echo ""

if [ $FIXED -gt 0 ]; then
  echo "🎉 Correções aplicadas com sucesso!"
  echo ""
  echo "📝 Próximos passos:"
  echo "1. Revise as mudanças: git diff"
  echo "2. Teste o sistema: npm run build && npm run test:run"
  echo "3. Commit: git add . && git commit -m 'fix: corrigir referências ao repositório'"
  echo "4. Push: git push"
else
  echo "✅ Nenhuma correção necessária - todos os arquivos já estão corretos!"
fi
