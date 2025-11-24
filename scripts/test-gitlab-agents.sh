#!/bin/bash

# Script para testar conectividade dos agentes GitLab após registro
# Este script verifica se os agentes recém-registrados estão funcionando

set -e

echo "🧪 Testando conectividade dos agentes GitLab recém-registrados..."
echo ""

# Aguardar um pouco para os agentes se conectarem
echo "⏳ Aguardando agentes se conectarem (30 segundos)..."
sleep 30

# Verificar status dos agentes
echo "🔍 Verificando status dos agentes..."

# Verificar pods dos agentes
echo ""
echo "📦 Verificando pods dos agentes:"
kubectl get pods -A | grep gitlab-agent || echo "ℹ️ Aguardando pods dos agentes..."

# Verificar se os agentes estão respondendo
echo ""
echo "🌐 Testando conectividade dos agentes:"

AGENTS_TO_TEST=(
    "agente-desenvolvimento:desenvolvimento"
    "agente-qa:qa"
    "agente-producao:production"
)

for agent_info in "${AGENTS_TO_TEST[@]}"; do
    IFS=':' read -r agent_name namespace <<< "$agent_info"

    echo "🔍 Testando agente: $agent_name (namespace: $namespace)"

    # Verificar se o pod existe
    pod_count=$(kubectl get pods -n "$namespace" --no-headers 2>/dev/null | grep -c gitlab-agent || echo "0")

    if [ "$pod_count" -gt "0" ]; then
        echo "  ✅ Pod encontrado no namespace $namespace"

        # Verificar status do pod
        pod_status=$(kubectl get pods -n "$namespace" --no-headers | grep gitlab-agent | awk '{print $3}')
        echo "  📊 Status do pod: $pod_status"

        if [ "$pod_status" == "Running" ]; then
            echo "  ✅ Agente $agent_name está rodando!"
        else
            echo "  ⚠️  Agente $agent_name com status: $pod_status"
        fi
    else
        echo "  ❌ Nenhum pod encontrado para $agent_name"
    fi

    echo ""
done

# Verificar conectividade geral
echo "🔗 Verificando conectividade geral do cluster:"
kubectl cluster-info || echo "❌ Problemas de conectividade"

echo ""
echo "📋 Resumo do teste:"
echo ""

# Contar agentes conectados
connected_agents=$(kubectl get pods -A --no-headers | grep -c gitlab-agent || echo "0")
echo "🤖 Agentes com pods rodando: $connected_agents"

# Verificar se todos os namespaces têm agentes
echo ""
echo "🏗️  Verificação por ambiente:"
for agent_info in "${AGENTS_TO_TEST[@]}"; do
    IFS=':' read -r agent_name namespace <<< "$agent_info"

    pod_count=$(kubectl get pods -n "$namespace" --no-headers 2>/dev/null | grep -c gitlab-agent || echo "0")
    if [ "$pod_count" -gt "0" ]; then
        echo "  ✅ $namespace: Agente presente"
    else
        echo "  ❌ $namespace: Agente ausente"
    fi
done

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Se algum agente não estiver conectado, verifique o registro no GitLab"
echo "2. Execute: ./verify-gitlab-agents.sh (para status completo)"
echo "3. Teste um pipeline CI/CD para validar funcionamento"
echo "4. Monitore logs dos agentes: kubectl logs -n <namespace> <pod-name>"

echo ""
echo "💡 DICAS DE DEBUG:"
echo "- Verifique se os tokens foram usados corretamente"
echo "- Confirme se o namespace correto foi especificado"
echo "- Verifique logs do GitLab para erros de registro"
echo "- Aguarde alguns minutos após o registro"