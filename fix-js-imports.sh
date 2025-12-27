#!/bin/bash
# Script para remover extensões .js de imports TypeScript
# Necessário para compatibilidade com moduleResolution: node16

echo "🔧 Removendo extensões .js de imports TypeScript..."

# Remover .js de imports relativos (../ e ./)
find api src -name "*.ts" -o -name "*.tsx" | while read -r file; do
  if grep -q '\.js["'"'"']' "$file"; then
    echo "  ✓ Corrigindo: $file"
    # Remover .js de imports que terminam com .js" ou .js'
    sed -i 's/from ["'"'"']\(\.\.\/[^"'"'"']*\)\.js["'"'"']/from "\1"/g' "$file"
    sed -i 's/from ["'"'"']\(\.\/[^"'"'"']*\)\.js["'"'"']/from "\1"/g' "$file"
  fi
done

echo "✅ Concluído! Verificando resultado..."
remaining=$(find api src -name "*.ts" -o -name "*.tsx" | xargs grep -l '\.js["'"'"']' | wc -l)
echo "📊 Arquivos restantes com .js: $remaining"
