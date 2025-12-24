#!/bin/bash

# ============================================================
# Script para Análise de Editor de Outro Repositório
# ============================================================
#
# Este script clona um repositório externo e analisa seus
# componentes de editor para integração no projeto atual.
#
# Uso: ./scripts/analyze-external-editor.sh
# ============================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}🔍 Análise de Editor Externo${NC}"
echo -e "${BLUE}============================================================${NC}"

# Configurações
REPO_URL="https://github.com/thiagobodevanadv-alt/Multi-Agent-Custom-Automation-Engine-Solution.git"
CLONE_DIR="/tmp/external-editor-analysis"
ANALYSIS_OUTPUT="docs/ANALISE_EDITOR_EXTERNO.md"

# Limpa análise anterior
rm -rf "$CLONE_DIR"
mkdir -p "$CLONE_DIR"

echo -e "\n${YELLOW}📥 Clonando repositório externo...${NC}"
git clone --depth 1 "$REPO_URL" "$CLONE_DIR" 2>/dev/null || {
  echo -e "${RED}❌ Erro ao clonar repositório${NC}"
  echo -e "${YELLOW}URL: $REPO_URL${NC}"
  exit 1
}

echo -e "${GREEN}✅ Repositório clonado com sucesso${NC}"

# Análise de componentes de editor
echo -e "\n${YELLOW}🔍 Procurando componentes de editor...${NC}"

cd "$CLONE_DIR"

# Encontra arquivos de editor
echo -e "\n${BLUE}📁 Arquivos de Editor encontrados:${NC}"
find . -type f \( -name "*editor*.tsx" -o -name "*editor*.ts" -o -name "*Editor*.tsx" -o -name "*Editor*.ts" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | while read file; do
  echo -e "${GREEN}  - $file${NC}"
done

# Cria relatório de análise
echo -e "\n${YELLOW}📝 Gerando relatório de análise...${NC}"

cat > "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT" << 'EOF'
# 🔍 Análise de Editor Externo

## 📋 Repositório Analisado

**URL**: https://github.com/thiagobodevanadv-alt/Multi-Agent-Custom-Automation-Engine-Solution.git
**Data da Análise**: $(date)

---

## 📁 Componentes de Editor Encontrados

EOF

# Lista arquivos de editor no relatório
find . -type f \( -name "*editor*.tsx" -o -name "*editor*.ts" -o -name "*Editor*.tsx" -o -name "*Editor*.ts" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | while read file; do
  echo "### \`$file\`" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

  # Conta linhas
  lines=$(wc -l < "$file")
  echo "**Linhas**: $lines" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

  # Extrai imports principais
  echo "**Imports principais**:" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo '```typescript' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  grep -E "^import" "$file" | head -10 >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT" || echo "Nenhum import encontrado" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo '```' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

  # Extrai exports/interfaces principais
  echo "**Exports/Interfaces**:" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo '```typescript' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  grep -E "^export (interface|type|class|function|const)" "$file" | head -10 >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT" || echo "Nenhum export encontrado" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo '```' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "---" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
done

# Procura por bibliotecas de editor
echo -e "\n${YELLOW}📦 Procurando dependências de editor no package.json...${NC}"

if [ -f "package.json" ]; then
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "## 📦 Dependências de Editor" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  echo '```json' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

  # Procura por editores conhecidos
  grep -E "(tiptap|lexical|slate|prosemirror|quill|ckeditor|tinymce|draft-js|@tiptap)" package.json >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT" || echo "Nenhuma dependência de editor conhecida encontrada" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

  echo '```' >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
fi

# Procura por hooks relacionados a editor
echo -e "\n${YELLOW}🪝 Procurando hooks relacionados a editor...${NC}"

echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
echo "## 🪝 Hooks Relacionados" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

find . -type f \( -name "use*.ts" -o -name "use*.tsx" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | grep -i editor | while read hook; do
  echo "- \`$hook\`" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
done

# Procura por utilitários de editor
echo -e "\n${YELLOW}🛠️ Procurando utilitários de editor...${NC}"

echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
echo "## 🛠️ Utilitários Encontrados" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
echo "" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"

find . -type f -name "*utils*.ts" ! -path "*/node_modules/*" ! -path "*/.git/*" | while read util; do
  if grep -q -i "editor" "$util"; then
    echo "- \`$util\`" >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT"
  fi
done

# Resumo e recomendações
cat >> "/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/$ANALYSIS_OUTPUT" << 'EOF'

---

## 🎯 Recomendações de Integração

### ✅ Componentes que podem ser aproveitados:

1. **Hooks Customizados**: Copiar hooks úteis de gerenciamento de estado do editor
2. **Utilitários**: Funções auxiliares para manipulação de texto/HTML
3. **Tipos TypeScript**: Interfaces e tipos reutilizáveis
4. **Extensões/Plugins**: Plugins customizados para funcionalidades específicas

### ⚠️ Cuidados na Integração:

- **Conflito de Dependências**: Verificar se as versões das bibliotecas são compatíveis
- **Estilos CSS**: Evitar conflitos de classes CSS
- **Performance**: Testar performance após integração
- **Licenças**: Verificar licenças de código de terceiros

### 🔄 Passos para Integração:

1. Revisar este relatório
2. Identificar componentes específicos desejados
3. Copiar arquivos necessários para `src/components/editor/`
4. Adaptar imports e tipos
5. Testar localmente
6. Criar testes unitários
7. Documentar mudanças

---

## 📚 Arquivos para Revisão Manual

Os arquivos identificados acima devem ser revisados manualmente para:
- Avaliar qualidade do código
- Verificar compatibilidade com CKEditor 5
- Identificar funcionalidades úteis
- Evitar duplicação de código existente

EOF

echo -e "${GREEN}✅ Relatório de análise gerado em:${NC}"
echo -e "${BLUE}   $ANALYSIS_OUTPUT${NC}"

# Limpeza
echo -e "\n${YELLOW}🧹 Limpando arquivos temporários...${NC}"
rm -rf "$CLONE_DIR"

echo -e "\n${GREEN}✅ Análise concluída!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "\n${YELLOW}📖 Próximos passos:${NC}"
echo -e "   1. Revisar o relatório: ${BLUE}$ANALYSIS_OUTPUT${NC}"
echo -e "   2. Identificar componentes úteis"
echo -e "   3. Executar: ${BLUE}./scripts/integrate-external-components.sh${NC}"
echo -e "${BLUE}============================================================${NC}\n"
