#!/bin/bash

# Script para gerar comandos de registro dos agentes restantes
# Baseado na documentação do GitLab que o usuário mostrou

set -e

echo "🔧 Gerando Comandos de Registro dos Agentes"
echo "==========================================="
echo ""

echo "📋 Baseado na documentação do GitLab, os comandos de registro seguem este formato:"
echo "   gitlab-agent register --token <TOKEN> --agent <AGENT_NAME>"
echo ""

echo "🌐 Para obter os tokens, acesse:"
echo "   https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/clusters"
echo ""

echo "📝 AGENTES PARA REGISTRAR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AGENTS=(
    "agente-desenvolvimento:Ambiente de desenvolvimento"
    "agente-qa:Ambiente de QA e testes"
    "agente-producao:Ambiente de produção"
)

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_desc <<< "$agent_info"
    echo ""
    echo "🔄 $agent_name"
    echo "   📝 $agent_desc"
    echo "   📁 Config: .gitlab/agents/$agent_name/config.yaml"
    echo ""
    echo "   COMANDO A EXECUTAR:"
    echo "   gitlab-agent register --token YOUR_TOKEN_HERE --agent $agent_name"
    echo ""
    echo "   PASSOS:"
    echo "   1. No GitLab: Clusters → Connect a cluster → GitLab agent"
    echo "   2. Nome: '$agent_name'"
    echo "   3. Register agent"
    echo "   4. Copie o token do comando gerado"
    echo "   5. Substitua YOUR_TOKEN_HERE no comando acima"
    echo "   6. Execute o comando no terminal"
    echo ""
done

echo "✅ APÓS REGISTRAR TODOS OS AGENTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Execute as verificações:"
echo ""
echo "🔍 Status completo:"
echo "   ./verify-gitlab-agents.sh"
echo ""
echo "🧪 Teste de conectividade:"
echo "   ./scripts/test-gitlab-agents.sh"
echo ""
echo "📦 Recursos Kubernetes:"
echo "   ./scripts/verify-gitlab-agents-k8s.sh"
echo ""

echo "💡 DICAS IMPORTANTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "• Cada agente precisa de um token único do GitLab"
echo "• Os tokens são gerados automaticamente na interface"
echo "• Execute um comando por vez"
echo "• Aguarde alguns segundos entre registros"
echo "• Verifique se o cluster Kubernetes está rodando"
echo ""

echo "🚀 PRONTO PARA REGISTRAR OS AGENTES!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"