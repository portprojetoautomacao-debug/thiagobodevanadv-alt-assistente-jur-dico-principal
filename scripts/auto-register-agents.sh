#!/bin/bash

# Script para registro SEMI-automático dos agentes GitLab
# GitLab CLI não permite criar agentes via API, então guia o processo manual

set -e

echo "🚀 Guia de Registro Automático dos Agentes GitLab"
echo "=================================================="
echo ""

# Verificar se glab está instalado
if ! command -v glab &> /dev/null; then
    echo "❌ GitLab CLI (glab) não encontrado."
    echo "📦 Execute: ./scripts/register-gitlab-agents.sh (modo manual)"
    exit 1
fi

echo "✅ GitLab CLI encontrado!"

# Verificar autenticação
if ! glab auth status &> /dev/null; then
    echo "❌ GitLab CLI não está autenticado."
    echo ""
    echo "🔐 Execute primeiro:"
    echo "   glab auth login"
    echo "   - Escolha: GitLab.com"
    echo "   - Método: Personal Access Token"
    echo "   - Token: (crie em https://gitlab.com/-/profile/personal_access_tokens)"
    echo "   - Permissões: api, read_repository, write_repository"
    exit 1
fi

echo "✅ GitLab CLI autenticado!"

# Lista de agentes para registrar
AGENTS=(
    "agente-desenvolvimento:desenvolvimento"
    "agente-qa:qa"
    "agente-producao:production"
)

echo ""
echo "📋 AGENTES PARA REGISTRAR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name namespace <<< "$agent_info"
    echo "• $agent_name (namespace: $namespace)"
done

echo ""
echo "🔄 VERIFICANDO STATUS ATUAL..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar agentes existentes
EXISTING_AGENTS=$(glab cluster agent list -R portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal 2>/dev/null | grep -E "(assistente-juridico-agent|agente-cluster|agenterevisor)" | wc -l)

echo "🤖 Agentes já registrados: $EXISTING_AGENTS/7"

echo ""
echo "🌐 INSTRUÇÕES PARA REGISTRO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣ Abra o navegador e acesse:"
echo "   https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/clusters"
echo ""
echo "2️⃣ Para cada agente, clique 'Connect a cluster' → 'GitLab agent'"
echo ""

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name namespace <<< "$agent_info"

    echo "📝 REGISTRAR: $agent_name"
    echo "   • Nome: $agent_name"
    echo "   • Ambiente: $namespace"
    echo "   • Config: .gitlab/agents/$agent_name/config.yaml"
    echo ""
    echo "   PASSOS:"
    echo "   1. Digite o nome: '$agent_name'"
    echo "   2. Clique 'Register agent'"
    echo "   3. Copie o comando gerado"
    echo "   4. Execute o comando no terminal"
    echo ""
done

echo "⏳ APÓS REGISTRAR TODOS OS AGENTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Execute os testes automáticos:"
echo ""
echo "🔍 Verificar status:"
echo "   ./verify-gitlab-agents.sh"
echo ""
echo "🧪 Testar conectividade:"
echo "   ./scripts/test-gitlab-agents.sh"
echo ""
echo "📊 Verificar recursos K8s:"
echo "   ./scripts/verify-gitlab-agents-k8s.sh"
echo ""

# Aguardar confirmação do usuário
echo "❓ Após registrar todos os agentes no GitLab, pressione Enter para continuar com os testes..."
read -r

echo ""
echo "🔄 EXECUTANDO TESTES AUTOMÁTICOS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Executar verificações
echo "📊 Verificando status dos agentes..."
./verify-gitlab-agents.sh

echo ""
echo "🧪 Testando conectividade..."
./scripts/test-gitlab-agents.sh

echo ""
echo "📦 Verificando recursos Kubernetes..."
./scripts/verify-gitlab-agents-k8s.sh

echo ""
echo "🎉 PROCESSO CONCLUÍDO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Todos os 7 agentes GitLab devem estar conectados!"
echo "✅ Ambientes isolados: desenvolvimento, qa, production"
echo "✅ RBAC e Network Policies aplicadas"
echo ""
echo "🚀 Pronto para CI/CD com isolamento por ambiente!"