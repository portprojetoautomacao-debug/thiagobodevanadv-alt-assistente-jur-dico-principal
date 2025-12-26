#!/bin/bash

# Start SonarQube MCP Server
# Este script carrega as variáveis de ambiente e inicia o servidor MCP

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔧 Iniciando SonarQube MCP Server..."

# Carregar variáveis de ambiente
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  echo "📂 Carregando variáveis de .env.local..."
  export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep SONARQUBE | xargs)
else
  echo "⚠️  Arquivo .env.local não encontrado!"
  exit 1
fi

# Verificar variáveis obrigatórias
if [ -z "$SONARQUBE_TOKEN" ]; then
  echo "❌ ERRO: SONARQUBE_TOKEN não configurado"
  exit 1
fi

if [ -z "$SONARQUBE_PROJECT_KEY" ]; then
  echo "❌ ERRO: SONARQUBE_PROJECT_KEY não configurado"
  exit 1
fi

echo "✅ Configuração válida:"
echo "   URL: $SONARQUBE_URL"
echo "   Organization: $SONARQUBE_ORGANIZATION"
echo "   Project Key: $SONARQUBE_PROJECT_KEY"
echo "   Token: ${SONARQUBE_TOKEN:0:20}..."
echo ""

# Iniciar servidor
echo "🚀 Iniciando servidor MCP..."
node "$SCRIPT_DIR/sonar-mcp-server.cjs"
