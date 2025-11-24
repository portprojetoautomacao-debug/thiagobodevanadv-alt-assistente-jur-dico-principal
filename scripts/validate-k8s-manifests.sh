#!/bin/bash

# Script para simular aplicação dos manifestos Kubernetes
# Use este script quando não houver cluster Kubernetes disponível

set -e

echo "🔍 Verificando estrutura dos manifestos Kubernetes..."

# Verificar se os arquivos existem
echo "📁 Verificando arquivos de manifestos:"

files=(
    "k8s/dev/namespace.yaml"
    "k8s/dev/rbac.yaml"
    "k8s/dev/network-policy.yaml"
    "k8s/qa/namespace.yaml"
    "k8s/qa/rbac.yaml"
    "k8s/qa/network-policy.yaml"
    "k8s/production/namespace.yaml"
    "k8s/production/rbac.yaml"
    "k8s/production/network-policy.yaml"
    "k8s/shared/configmaps.yaml"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file - OK"
    else
        echo "❌ $file - MISSING"
        exit 1
    fi
done

echo ""
echo "📋 Validação YAML:"

# Verificar sintaxe YAML (se yq estiver disponível)
if command -v yq &> /dev/null; then
    echo "🔍 Validando sintaxe YAML com yq..."
    for file in "${files[@]}"; do
        if yq eval '.' "$file" > /dev/null 2>&1; then
            echo "✅ $file - YAML válido"
        else
            echo "❌ $file - YAML inválido"
            exit 1
        fi
    done
else
    echo "⚠️ yq não encontrado - pulando validação YAML"
fi

echo ""
echo "📊 Resumo dos manifestos criados:"
echo ""
echo "Namespaces:"
echo "- desenvolvimento (desenvolvimento)"
echo "- qa (testes)"
echo "- production (produção)"
echo ""
echo "RBAC:"
echo "- ClusterRoles: gitlab-agent-desenvolvimento, gitlab-agent-qa, gitlab-agent-production"
echo "- ServiceAccounts: gitlab-agent (um por namespace)"
echo "- ClusterRoleBindings: vinculando roles aos service accounts"
echo ""
echo "Network Policies:"
echo "- Desenvolvimento: permissivo com isolamento"
echo "- QA: balanceado"
echo "- Produção: restritivo com alta segurança"
echo ""
echo "ConfigMaps:"
echo "- Configurações específicas por ambiente"
echo ""
echo "✅ Todos os manifestos estão prontos!"
echo ""
echo "🚀 Para aplicar em um cluster Kubernetes real:"
echo "1. Certifique-se de que tem acesso ao cluster (kubectl cluster-info)"
echo "2. Execute: ./scripts/apply-k8s-manifests.sh"
echo "3. Verifique: ./scripts/verify-gitlab-agents-k8s.sh"
echo ""
echo "📖 Documentação: docs/KUBERNETES_MANIFESTOS.md"