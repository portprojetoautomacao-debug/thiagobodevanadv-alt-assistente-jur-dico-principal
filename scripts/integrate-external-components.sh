#!/bin/bash

# ============================================================
# Script para Integração de Componentes Externos de Editor
# ============================================================
#
# Este script facilita a integração de componentes específicos
# do repositório externo no projeto atual.
#
# Uso: ./scripts/integrate-external-components.sh [arquivo]
# ============================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}🔧 Integração de Componentes Externos${NC}"
echo -e "${BLUE}============================================================${NC}"

# Configurações
REPO_URL="https://github.com/thiagobodevanadv-alt/Multi-Agent-Custom-Automation-Engine-Solution.git"
CLONE_DIR="/tmp/external-editor-integration"
TARGET_DIR="src/components/editor/external"

# Verifica se foi passado arquivo específico
if [ -z "$1" ]; then
  echo -e "${YELLOW}ℹ️  Nenhum arquivo específico foi fornecido${NC}"
  echo -e "${YELLOW}   Listando componentes disponíveis...${NC}"

  # Clone temporário para listar
  rm -rf "$CLONE_DIR"
  git clone --depth 1 "$REPO_URL" "$CLONE_DIR" 2>/dev/null

  echo -e "\n${BLUE}📁 Componentes de Editor disponíveis:${NC}"
  cd "$CLONE_DIR"
  find . -type f \( -name "*editor*.tsx" -o -name "*editor*.ts" -o -name "*Editor*.tsx" -o -name "*Editor*.ts" \) ! -path "*/node_modules/*" ! -path "*/.git/*" | nl -w2 -s'. '

  echo -e "\n${YELLOW}💡 Uso: ./scripts/integrate-external-components.sh <caminho_do_arquivo>${NC}"
  echo -e "${YELLOW}   Exemplo: ./scripts/integrate-external-components.sh ./src/components/RichEditor.tsx${NC}"

  rm -rf "$CLONE_DIR"
  exit 0
fi

FILE_PATH="$1"

echo -e "\n${YELLOW}📥 Preparando integração do arquivo:${NC}"
echo -e "${BLUE}   $FILE_PATH${NC}"

# Clone o repositório
echo -e "\n${YELLOW}📥 Clonando repositório...${NC}"
rm -rf "$CLONE_DIR"
git clone --depth 1 "$REPO_URL" "$CLONE_DIR" 2>/dev/null

# Verifica se o arquivo existe
if [ ! -f "$CLONE_DIR/$FILE_PATH" ]; then
  echo -e "${RED}❌ Arquivo não encontrado: $FILE_PATH${NC}"
  rm -rf "$CLONE_DIR"
  exit 1
fi

# Cria diretório de destino
mkdir -p "$TARGET_DIR"

# Copia o arquivo
FILENAME=$(basename "$FILE_PATH")
TARGET_FILE="$TARGET_DIR/$FILENAME"

echo -e "\n${YELLOW}📋 Copiando arquivo...${NC}"
cp "$CLONE_DIR/$FILE_PATH" "$TARGET_FILE"

echo -e "${GREEN}✅ Arquivo copiado para: $TARGET_FILE${NC}"

# Análise de dependências
echo -e "\n${YELLOW}🔍 Analisando dependências...${NC}"
echo -e "\n${BLUE}📦 Imports encontrados:${NC}"
grep -E "^import" "$TARGET_FILE" | sort | uniq

# Verifica se há dependências não instaladas
echo -e "\n${YELLOW}⚠️  Verificando dependências...${NC}"

# Lista de editores conhecidos
KNOWN_EDITORS=("@tiptap" "lexical" "slate" "prosemirror" "quill" "tinymce" "draft-js")

for editor in "${KNOWN_EDITORS[@]}"; do
  if grep -q "$editor" "$TARGET_FILE"; then
    if ! grep -q "$editor" "package.json"; then
      echo -e "${RED}❌ Dependência não instalada: $editor${NC}"
      echo -e "${YELLOW}   Execute: npm install ${editor}${NC}"
    else
      echo -e "${GREEN}✅ Dependência já instalada: $editor${NC}"
    fi
  fi
done

# Cria arquivo de documentação
DOC_FILE="$TARGET_DIR/README.md"
cat > "$DOC_FILE" << EOF
# 📦 Componentes Externos Integrados

## 🔍 Origem

**Repositório**: [Multi-Agent-Custom-Automation-Engine-Solution](https://github.com/thiagobodevanadv-alt/Multi-Agent-Custom-Automation-Engine-Solution)
**Data de Integração**: $(date)

---

## 📁 Arquivos Integrados

### \`$FILENAME\`

**Caminho Original**: \`$FILE_PATH\`
**Caminho Atual**: \`$TARGET_FILE\`

#### Dependências Identificadas

\`\`\`typescript
$(grep -E "^import" "$TARGET_FILE" | sort | uniq)
\`\`\`

#### Próximos Passos

- [ ] Revisar código para compatibilidade
- [ ] Instalar dependências faltantes
- [ ] Adaptar imports para aliases do projeto (\`@/\`)
- [ ] Testar integração
- [ ] Adicionar testes unitários
- [ ] Atualizar documentação

---

## 🔧 Como Usar

\`\`\`typescript
import { ComponentName } from '@/components/editor/external/$FILENAME';

// Exemplo de uso
<ComponentName {...props} />
\`\`\`

---

## ⚠️ Notas Importantes

- **Licença**: Verificar licença do componente original
- **Compatibilidade**: Testar com CKEditor 5 atual
- **Performance**: Monitorar impacto no bundle size
- **Manutenção**: Componente externo pode não receber atualizações

EOF

echo -e "\n${GREEN}✅ Documentação criada em: $DOC_FILE${NC}"

# Cria arquivo de exemplo de uso
EXAMPLE_FILE="$TARGET_DIR/example-usage.tsx"
cat > "$EXAMPLE_FILE" << 'EOF'
/**
 * Exemplo de uso de componentes externos integrados
 *
 * Este arquivo demonstra como usar os componentes importados
 * do repositório Multi-Agent-Custom-Automation-Engine-Solution
 */

import React from 'react';

// TODO: Importar componente específico
// import { ExternalEditor } from './external/ComponentName';

export function ExampleUsageExternalEditor() {
  return (
    <div className="example-external-editor">
      {/* TODO: Implementar uso do componente externo */}
      <p>Componente externo será integrado aqui</p>
    </div>
  );
}
EOF

echo -e "${GREEN}✅ Exemplo de uso criado em: $EXAMPLE_FILE${NC}"

# Limpeza
rm -rf "$CLONE_DIR"

echo -e "\n${GREEN}✅ Integração concluída!${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "\n${YELLOW}📖 Próximos passos:${NC}"
echo -e "   1. Revisar arquivo copiado: ${BLUE}$TARGET_FILE${NC}"
echo -e "   2. Ler documentação: ${BLUE}$DOC_FILE${NC}"
echo -e "   3. Instalar dependências faltantes"
echo -e "   4. Adaptar imports (\`@/\` alias)"
echo -e "   5. Testar integração"
echo -e "   6. Executar testes: ${BLUE}npm run test${NC}"
echo -e "${BLUE}============================================================${NC}\n"
