#!/bin/bash

# Script para registrar agentes GitLab restantes
# Este script ajuda a registrar os 3 agentes que ainda não estão conectados

set -e

echo "🚀 Registrando agentes GitLab restantes..."
echo ""

# Lista de agentes para registrar
AGENTS_TO_REGISTER=(
    "agente-desenvolvimento:Ambiente de desenvolvimento com remote development"
    "agente-qa:Ambiente de QA com testes automatizados"
    "agente-producao:Ambiente de produção com alta disponibilidade"
)

echo "📋 Agentes que serão registrados:"
for agent_info in "${AGENTS_TO_REGISTER[@]}"; do
    IFS=':' read -r agent_name agent_desc <<< "$agent_info"
    echo "  • $agent_name - $agent_desc"
done

echo ""
echo "🔑 Para registrar cada agente, siga estes passos:"
echo ""

for agent_info in "${AGENTS_TO_REGISTER[@]}"; do
    IFS=':' read -r agent_name agent_desc <<< "$agent_info"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 Registrando: $agent_name"
    echo "📄 Descrição: $agent_desc"
    echo ""

    # Verificar se o diretório existe
    if [ -d ".gitlab/agents/$agent_name" ]; then
        echo "✅ Diretório encontrado: .gitlab/agents/$agent_name"

        # Verificar se config.yaml existe
        if [ -f ".gitlab/agents/$agent_name/config.yaml" ]; then
            echo "✅ Arquivo config.yaml encontrado"
        else
            echo "❌ Arquivo config.yaml não encontrado"
            continue
        fi
    else
        echo "❌ Diretório não encontrado: .gitlab/agents/$agent_name"
        continue
    fi

    echo ""
    echo "🌐 Passos para registrar no GitLab:"
    echo ""
    echo "1. Acesse: https://gitlab.com/thiagobodevan-a11y/assistente-juridico-p/-/clusters"
    echo "2. Clique em 'Connect a cluster'"
    echo "3. Selecione 'GitLab agent'"
    echo "4. Digite o nome do agente: '$agent_name'"
    echo "5. Clique em 'Register agent'"
    echo ""
    echo "6. Copie o comando de registro que aparecerá:"
    echo "   gitlab-agent register --token <TOKEN> --agent $agent_name"
    echo ""
    echo "7. Execute o comando no terminal (será algo como):"
    echo "   🔒 Comando de registro (execute no terminal):"
    echo ""

    # Simular o comando (o usuário precisará copiar do GitLab)
    echo "   gitlab-agent register --token YOUR_TOKEN_HERE --agent $agent_name"
    echo ""
    echo "8. Aguarde a confirmação de que o agente foi registrado"
    echo ""

    # Perguntar se quer continuar
    read -p "✅ Agente $agent_name preparado. Pressione Enter para continuar com o próximo agente..."
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Todos os agentes foram preparados para registro!"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Registre cada agente no GitLab seguindo as instruções acima"
echo "2. Execute: ./verify-gitlab-agents.sh"
echo "3. Verifique se todos os 7 agentes estão conectados"
echo "4. Teste um pipeline CI/CD para validar o funcionamento"
echo ""
echo "💡 DICAS:"
echo "- Cada agente precisa de um token único do GitLab"
echo "- Os tokens são gerados automaticamente na interface do GitLab"
echo "- Guarde os tokens em local seguro após o registro"
echo "- Os agentes se conectarão automaticamente após o registro"