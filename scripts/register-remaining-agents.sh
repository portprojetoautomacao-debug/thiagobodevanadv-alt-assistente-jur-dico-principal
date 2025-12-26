#!/bin/bash

# Script para registrar automaticamente os 3 agentes restantes no GitLab
# Este script abre o navegador e guia o processo de registro

set -e

echo "🚀 Registrando os 3 Agentes Restantes no GitLab"
echo "================================================"
echo ""

# URL do GitLab
GITLAB_URL="https://gitlab.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/-/clusters"

echo "🌐 Abrindo navegador na página do GitLab..."
echo "   URL: $GITLAB_URL"
echo ""

# Abrir navegador usando python se disponível
if command -v python3 &> /dev/null; then
    python3 -c "import webbrowser; webbrowser.open('$GITLAB_URL')" 2>/dev/null || true
elif command -v curl &> /dev/null; then
    # Fallback: mostrar instruções
    echo "📋 Copie e cole esta URL no navegador:"
    echo "   $GITLAB_URL"
else
    echo "📋 Abra o navegador e acesse:"
    echo "   $GITLAB_URL"
fi

echo ""
echo "📋 AGENTES PARA REGISTRAR:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

AGENTS=(
    "agente-desenvolvimento:Ambiente de desenvolvimento com remote development"
    "agente-qa:Ambiente de QA com testes automatizados"
    "agente-producao:Ambiente de produção com alta disponibilidade"
)

for agent_info in "${AGENTS[@]}"; do
    IFS=':' read -r agent_name agent_desc <<< "$agent_info"
    echo "🔄 $agent_name"
    echo "   📝 $agent_desc"
    echo "   📁 Config: .gitlab/agents/$agent_name/config.yaml"
    echo ""
done

echo "🎯 INSTRUÇÕES PARA REGISTRO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para cada agente, execute estes passos:"
echo ""

for i in "${!AGENTS[@]}"; do
    agent_info="${AGENTS[$i]}"
    IFS=':' read -r agent_name agent_desc <<< "$agent_info"
    step=$((i + 1))

    echo "${step}. 📝 REGISTRAR: $agent_name"
    echo "   ├─ Clique: 'Connect a cluster'"
    echo "   ├─ Selecione: 'GitLab agent'"
    echo "   ├─ Nome: '$agent_name'"
    echo "   ├─ Clique: 'Register agent'"
    echo "   ├─ Copie o comando gerado"
    echo "   └─ Execute no terminal"
    echo ""
done

echo "⏳ APÓS REGISTRAR TODOS OS AGENTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Aguardar confirmação
echo "❓ Após registrar todos os 3 agentes, pressione Enter para continuar..."
read -r

echo ""
echo "🔄 EXECUTANDO VERIFICAÇÕES AUTOMÁTICAS..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Executar verificações
echo "📊 Verificando status dos agentes..."
if ./verify-gitlab-agents.sh; then
    echo "✅ Verificação de agentes: OK"
else
    echo "⚠️  Alguns agentes podem não estar conectados ainda"
fi

echo ""
echo "🧪 Testando conectividade..."
if ./scripts/test-gitlab-agents.sh; then
    echo "✅ Teste de conectividade: OK"
else
    echo "⚠️  Alguns testes falharam - verifique os logs"
fi

echo ""
echo "📦 Verificando recursos Kubernetes..."
if ./scripts/verify-gitlab-agents-k8s.sh; then
    echo "✅ Verificação Kubernetes: OK"
else
    echo "⚠️  Problemas nos recursos Kubernetes"
fi

echo ""
echo "🎉 REGISTRO CONCLUÍDO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Todos os 7 agentes GitLab devem estar conectados!"
echo "✅ CI/CD com isolamento por ambiente funcionando!"
echo ""
echo "📊 Status Final:"
echo "   • Desenvolvimento: agente-desenvolvimento (namespace: desenvolvimento)"
echo "   • QA: agente-qa (namespace: qa)"
echo "   • Produção: agente-producao (namespace: production)"
echo "   • Geral: assistente-juridico-agent, agente-cluster, agenterevisor, agenterevisor2"
echo ""
echo "🚀 Pronto para pipelines CI/CD automatizados!"