#!/bin/bash

# 🔍 Script de Auditoria de Acessibilidade
# Verifica problemas comuns de acessibilidade no código React/TSX

echo "🔍 Auditoria de Acessibilidade - Assistente Jurídico PJe"
echo "========================================================="
echo ""

# Cores para output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Contadores
total_issues=0

# 1. Verificar botões sem aria-label (icon-only)
echo "1️⃣ Verificando botões icon-only sem aria-label..."
icon_buttons=$(grep -rn 'size="icon"' src/ --include="*.tsx" | grep -v 'aria-label' | wc -l)
if [ $icon_buttons -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Encontrados $icon_buttons botões icon-only sem aria-label${NC}"
  echo "   Arquivos afetados:"
  grep -rn 'size="icon"' src/ --include="*.tsx" | grep -v 'aria-label' | head -5
  echo ""
  total_issues=$((total_issues + icon_buttons))
else
  echo -e "${GREEN}✅ Todos os botões icon-only possuem aria-label${NC}"
fi
echo ""

# 2. Verificar imagens sem alt
echo "2️⃣ Verificando imagens sem atributo alt..."
imgs_no_alt=$(grep -rn '<img' src/ --include="*.tsx" | grep -v 'alt=' | wc -l)
if [ $imgs_no_alt -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Encontradas $imgs_no_alt imagens sem atributo alt${NC}"
  echo "   Arquivos afetados:"
  grep -rn '<img' src/ --include="*.tsx" | grep -v 'alt=' | head -5
  echo ""
  total_issues=$((total_issues + imgs_no_alt))
else
  echo -e "${GREEN}✅ Todas as imagens possuem atributo alt${NC}"
fi
echo ""

# 3. Verificar inputs sem labels
echo "3️⃣ Verificando inputs sem labels associados..."
inputs_no_label=$(grep -rn '<input' src/ --include="*.tsx" | grep -v 'aria-label\|id=' | wc -l)
if [ $inputs_no_label -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Encontrados $inputs_no_label inputs sem label ou aria-label${NC}"
  echo "   Nota: Verifique se estão usando React Hook Form com <FormField>"
  total_issues=$((total_issues + inputs_no_label))
else
  echo -e "${GREEN}✅ Todos os inputs possuem labels${NC}"
fi
echo ""

# 4. Verificar links sem texto
echo "4️⃣ Verificando links sem texto descritivo..."
links_no_text=$(grep -rn '<a' src/ --include="*.tsx" | grep -c '<a[^>]*href[^>]*>[ ]*<' || true)
if [ $links_no_text -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Encontrados $links_no_text links possivelmente sem texto${NC}"
  total_issues=$((total_issues + links_no_text))
else
  echo -e "${GREEN}✅ Todos os links possuem texto descritivo${NC}"
fi
echo ""

# 5. Verificar elementos com role sem aria-label
echo "5️⃣ Verificando elementos com role personalizado..."
role_elements=$(grep -rn 'role=' src/ --include="*.tsx" | grep -v 'aria-label\|aria-labelledby' | wc -l)
if [ $role_elements -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Encontrados $role_elements elementos com role sem aria-label${NC}"
  total_issues=$((total_issues + role_elements))
else
  echo -e "${GREEN}✅ Elementos com role possuem labels${NC}"
fi
echo ""

# 6. Verificar uso de onClick em divs/spans
echo "6️⃣ Verificando uso incorreto de onClick em elementos não-interativos..."
onclick_divs=$(grep -rn 'onClick=' src/ --include="*.tsx" | grep -E '<div|<span' | wc -l)
if [ $onclick_divs -gt 0 ]; then
  echo -e "${RED}❌ Encontrados $onclick_divs divs/spans com onClick (use <button> ou role/tabindex)${NC}"
  total_issues=$((total_issues + onclick_divs))
else
  echo -e "${GREEN}✅ Não há divs/spans com onClick${NC}"
fi
echo ""

# Resumo
echo "========================================================="
echo "📊 RESUMO DA AUDITORIA"
echo "========================================================="
if [ $total_issues -eq 0 ]; then
  echo -e "${GREEN}✅ Nenhum problema crítico de acessibilidade encontrado!${NC}"
  echo ""
  echo "Recomendações adicionais:"
  echo "1. Execute Lighthouse para validação completa"
  echo "2. Teste com leitor de tela (NVDA/JAWS)"
  echo "3. Valide contraste de cores em webaim.org/resources/contrastchecker/"
else
  echo -e "${RED}⚠️  Total de problemas potenciais: $total_issues${NC}"
  echo ""
  echo "🔧 PRÓXIMOS PASSOS:"
  echo "1. Revise os arquivos listados acima"
  echo "2. Adicione aria-label em botões icon-only"
  echo "3. Adicione atributo alt em todas as imagens"
  echo "4. Use elementos semânticos corretos (<button> ao invés de <div onClick>)"
  echo "5. Execute: npm run build && npm run preview"
  echo "6. Teste com Lighthouse após correções"
fi
echo ""

# Criar relatório
echo "📄 Gerando relatório detalhado..."
{
  echo "# Relatório de Auditoria de Acessibilidade"
  echo "Data: $(date)"
  echo ""
  echo "## Problemas Encontrados: $total_issues"
  echo ""
  echo "### 1. Botões sem aria-label"
  grep -rn 'size="icon"' src/ --include="*.tsx" | grep -v 'aria-label' || echo "Nenhum problema encontrado"
  echo ""
  echo "### 2. Imagens sem alt"
  grep -rn '<img' src/ --include="*.tsx" | grep -v 'alt=' || echo "Nenhum problema encontrado"
  echo ""
  echo "### 3. Divs/Spans com onClick"
  grep -rn 'onClick=' src/ --include="*.tsx" | grep -E '<div|<span' || echo "Nenhum problema encontrado"
} > accessibility-audit-report.md

echo -e "${GREEN}✅ Relatório salvo em: accessibility-audit-report.md${NC}"
echo ""

exit 0
