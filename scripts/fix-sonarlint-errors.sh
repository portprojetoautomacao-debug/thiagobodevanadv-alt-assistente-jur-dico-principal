#!/bin/bash

# Fix SonarLint Internal Errors
# Script para corrigir erros do tipo "ResponseErrorException: Internal error"

set -e

echo "🔧 Corrigindo erros do SonarLint..."

# 1. Limpar cache do SonarLint
echo "📂 Limpando cache do SonarLint..."
rm -rf ~/.sonarlint/storage/* 2>/dev/null || true
rm -rf ~/.sonarlint/work/* 2>/dev/null || true
rm -rf ~/.vscode-server/data/User/globalStorage/sonarsource.sonarlint-vscode/* 2>/dev/null || true

# 2. Limpar cache do VS Code relacionado
echo "📂 Limpando cache do VS Code..."
rm -rf ~/.vscode-server/data/logs/*/exthost/* 2>/dev/null || true

# 3. Verificar arquivos problemáticos no workspace
echo "🔍 Verificando arquivos problemáticos..."
WORKSPACE_ROOT="/workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal"

# Arquivos muito grandes que podem causar problemas
find "$WORKSPACE_ROOT" -type f -size +10M 2>/dev/null | while read file; do
    echo "⚠️  Arquivo grande detectado: $file"
done

# Arquivos sem permissão de leitura
find "$WORKSPACE_ROOT" -type f ! -readable 2>/dev/null | while read file; do
    echo "⚠️  Arquivo sem permissão: $file"
    chmod +r "$file" 2>/dev/null || true
done

# 4. Criar arquivo de configuração otimizado
echo "⚙️  Criando configuração otimizada..."
cat > "$WORKSPACE_ROOT/.vscode/.sonarlintrc" <<'EOF'
{
  "disableTelemetry": true,
  "output": {
    "showAnalyzerLogs": false,
    "showVerboseLogs": false
  },
  "pathToNodeExecutable": "/usr/local/share/nvm/versions/node/v22.21.1/bin/node",
  "analyzerProperties": {
    "sonar.javascript.node.maxspace": "4096"
  }
}
EOF

echo "✅ Configuração criada: .vscode/.sonarlintrc"

# 5. Adicionar exclusões ao workspace
echo "⚙️  Configurando exclusões..."

# Verificar se já existe um .sonarlintignore
if [ ! -f "$WORKSPACE_ROOT/.sonarlintignore" ]; then
    cat > "$WORKSPACE_ROOT/.sonarlintignore" <<'EOF'
# SonarLint Ignore File
# Arquivos e diretórios que devem ser ignorados pela análise

# Dependencies
node_modules/
**/node_modules/

# Build outputs
dist/
build/
coverage/
coverage-api/
.vite/
.vercel/

# Logs
*.log
logs/
.sonar-results/

# Cache
.cache/
.eslintcache
.tsbuildinfo

# Generated files
*.min.js
*.bundle.js
*.chunk.js

# Test files (muito grandes)
**/*.test.ts.snap
**/__snapshots__/

# Documentation (não precisa análise)
docs/**/*.md
*.md

# Config files
*.config.js
*.config.ts
*.config.mjs

# Chrome Extension dist
chrome-extension-pje/dist/
EOF
    echo "✅ Arquivo .sonarlintignore criado"
else
    echo "ℹ️  Arquivo .sonarlintignore já existe"
fi

# 6. Reiniciar extensão (via comando do VS Code)
echo "🔄 Reiniciando SonarLint..."
echo ""
echo "═══════════════════════════════════════"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "═══════════════════════════════════════"
echo ""
echo "📋 Próximos passos:"
echo "1. Recarregue a janela do VS Code: Ctrl+Shift+P → 'Developer: Reload Window'"
echo "2. Ou reinicie o VS Code completamente"
echo "3. Aguarde o SonarLint reinicializar (pode levar 1-2 minutos)"
echo ""
echo "💡 Se os erros persistirem:"
echo "- Desabilite temporariamente: Settings → Extensions → SonarLint → Disable"
echo "- Aguarde 30 segundos"
echo "- Reabilite a extensão"
echo ""
