#!/bin/bash
# Script para configurar o GitLab Workflow no VS Code
# Este script configura o token e as credenciais do GitLab

set -e

echo "🔧 Configurando GitLab Workflow para VS Code..."

# Carregar variáveis do arquivo .gitlab-token
if [ -f .gitlab-token ]; then
    source .gitlab-token
    echo "✅ Token do GitLab carregado"
else
    echo "❌ Arquivo .gitlab-token não encontrado!"
    exit 1
fi

# Verificar se o token está definido
if [ -z "$GITLAB_TOKEN" ]; then
    echo "❌ GITLAB_TOKEN não está definido no arquivo .gitlab-token"
    exit 1
fi

# Configurar o git para usar o token
echo "🔐 Configurando Git com credenciais do GitLab..."
git config --global credential.helper store

# Adicionar o remote do GitLab se não existir
if ! git remote | grep -q "^gitlab$"; then
    echo "📡 Adicionando remote do GitLab..."
    git remote add gitlab https://oauth2:${GITLAB_TOKEN}@gitlab.com/thiagobodevan-a11y/assistente-juridico-p.git
    echo "✅ Remote 'gitlab' adicionado"
else
    echo "ℹ️  Remote 'gitlab' já existe"
fi

# Configurar o remote origin para usar o token
echo "🔄 Atualizando remote origin..."
git remote set-url origin https://oauth2:${GITLAB_TOKEN}@gitlab.com/thiagobodevan-a11y/assistente-juridico-p.git

echo ""
echo "✅ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Pressione Ctrl+Shift+P (ou Cmd+Shift+P no Mac)"
echo "2. Digite 'GitLab: Add Account'"
echo "3. Cole o token: ${GITLAB_TOKEN:0:20}..."
echo "4. Confirme a URL: $GITLAB_URL"
echo ""
echo "🎯 Recursos disponíveis:"
echo "   • Ver status do pipeline na barra inferior"
echo "   • Criar pipeline: Ctrl+Shift+P > 'GitLab: Create New Pipeline'"
echo "   • Ver jobs do CI/CD na sidebar"
echo "   • Autocompletar variáveis CI/CD"
echo "   • Validar .gitlab-ci.yml"
echo ""
