#!/bin/bash
# Script de análise de performance do dev server

echo "🔍 Analisando Performance do Vite Dev Server..."
echo ""

# 1. Verificar tamanho do node_modules
echo "📦 Tamanho do node_modules:"
du -sh node_modules 2>/dev/null || echo "node_modules não encontrado"
echo ""

# 2. Verificar cache do Vite
echo "💾 Cache do Vite:"
du -sh node_modules/.vite 2>/dev/null || echo "Cache não encontrado - primeira execução será mais lenta"
echo ""

# 3. Contar dependências
echo "📚 Número de dependências:"
if [ -f "package.json" ]; then
  deps=$(jq '.dependencies | length' package.json 2>/dev/null)
  devDeps=$(jq '.devDependencies | length' package.json 2>/dev/null)
  echo "  - Produção: $deps"
  echo "  - Desenvolvimento: $devDeps"
  echo "  - Total: $((deps + devDeps))"
else
  echo "  package.json não encontrado"
fi
echo ""

# 4. Verificar arquivos grandes no src
echo "📁 Top 10 arquivos maiores em src/:"
find src -type f -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -10 | awk '{print "  " $5 "\t" $9}'
echo ""

# 5. Verificar se há API proxy configurado
echo "🌐 Configuração de Proxy:"
if grep -q "proxy:" vite.config.ts 2>/dev/null; then
  echo "  ⚠️  Proxy ATIVO - pode adicionar latência"
  echo "  💡 Use DISABLE_API_PROXY=true para desabilitar em desenvolvimento local"
else
  echo "  ✅ Sem proxy configurado"
fi
echo ""

# 6. Verificar tempo de startup
echo "⏱️  Testando tempo de startup do dev server..."
echo "  (Ctrl+C para cancelar após ver 'ready in')"
echo ""
timeout 10s npm run dev 2>&1 | grep -E "ready in|Local:" || echo "  Timeout - servidor não inicializou em 10s"
echo ""

# 7. Recomendações
echo "💡 RECOMENDAÇÕES:"
echo ""
echo "  1. Cache do Vite (.vite/deps):"
echo "     - Primeira execução: ~2-5s de latência"
echo "     - Com cache: <500ms"
echo "     - Limpar cache: rm -rf node_modules/.vite"
echo ""
echo "  2. Proxy para produção:"
echo "     - Adiciona ~300-500ms de latência"
echo "     - Use variável DISABLE_API_PROXY=true para testes locais"
echo ""
echo "  3. Pre-bundling de dependências:"
echo "     - Otimizado: 20 deps pré-carregadas"
echo "     - Vite faz lazy loading inteligente"
echo ""
echo "  4. Warm cache (NOVO):"
echo "     - main.tsx, App.tsx e Dashboard pré-transformados"
echo "     - Reduz ~200-300ms no primeiro load"
echo ""
echo "✅ Análise concluída!"
