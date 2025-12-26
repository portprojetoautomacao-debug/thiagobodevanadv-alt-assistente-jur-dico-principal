#!/bin/bash

# ============================================
# 🔧 FIX SONARCLOUD ISSUES AUTOMATICALLY
# ============================================
# Corrige 75 problemas do SonarCloud automaticamente

echo "🔧 Corrigindo 75 problemas do SonarCloud..."
echo ""

FIXED=0

# Encontrar arquivos TypeScript/JavaScript (excluir node_modules, dist, coverage)
FILES=$(find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/coverage/*" \
  ! -path "*/coverage-api/*" \
  2>/dev/null)

echo "📁 Processando arquivos TypeScript/JavaScript..."

while IFS= read -r file; do
  [ -z "$file" ] && continue
  CHANGED=false

  # 1. charCodeAt() → codePointAt()
  if grep -q "\.charCodeAt(" "$file" 2>/dev/null; then
    sed -i 's/\.charCodeAt(/.codePointAt(/g' "$file"
    CHANGED=true
  fi

  # 2. String#replace() → String#replaceAll() (apenas com regex /g)
  # Nota: Só substituir replace por replaceAll quando tem flag 'g'
  # Exemplo: .replace(/pattern/g, '') → .replaceAll(/pattern/g, '')
  if grep -q "\.replace(" "$file" 2>/dev/null; then
    # Substituir apenas padrões com /g no final
    sed -i 's/\.replace(\([^)]*\)\/g,/\.replaceAll(\1\/g,/g' "$file"
    CHANGED=true
  fi

  # 3. parseFloat → Number.parseFloat
  if grep -q "parseFloat(" "$file" 2>/dev/null; then
    sed -i 's/\bparseFloat(/Number.parseFloat(/g' "$file"
    CHANGED=true
  fi

  # 4. parseInt → Number.parseInt
  if grep -q "parseInt(" "$file" 2>/dev/null; then
    sed -i 's/\bparseInt(/Number.parseInt(/g' "$file"
    CHANGED=true
  fi

  # 5. isFinite → Number.isFinite
  if grep -q "isFinite(" "$file" 2>/dev/null; then
    sed -i 's/\bisFinite(/Number.isFinite(/g' "$file"
    CHANGED=true
  fi

  if [ "$CHANGED" = true ]; then
    echo "✅ Corrigido: $file"
    ((FIXED++))
  fi
done <<< "$FILES"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RELATÓRIO FINAL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Arquivos corrigidos: $FIXED"
echo ""

if [ $FIXED -gt 0 ]; then
  echo "🎉 Correções aplicadas com sucesso!"
  echo ""
  echo "📝 Próximos passos:"
  echo "1. Validar: npm run type-check"
  echo "2. Testar: npm run test:run"
  echo "3. Commit: git add . && git commit -m 'fix: corrigir 75 problemas SonarCloud'"
else
  echo "✅ Nenhuma correção necessária!"
fi
