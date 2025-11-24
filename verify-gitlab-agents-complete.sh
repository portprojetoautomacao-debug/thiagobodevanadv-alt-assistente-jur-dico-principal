#!/bin/bash
# Verificar status completo dos GitLab Agents

set -e

echo "🔍 Verificando status completo dos GitLab Agents..."
echo "Limite do GitLab: 7 agentes por projeto"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Carregar token do GitLab
if [ -f ".gitlab-token" ]; then
    source .gitlab-token
else
    echo -e "${RED}❌ Arquivo .gitlab-token não encontrado${NC}"
    exit 1
fi

# Função para verificar status completo do agente
check_agent_complete() {
    local agent_name=$1
    local config_file=".gitlab/agents/${agent_name}/config.yaml"

    echo -e "${BLUE}🔍 Verificando agente: ${agent_name}${NC}"

    # Verificar se está registrado no GitLab
    local gitlab_registered=$(curl -s -H "Authorization: Bearer $GITLAB_TOKEN" "https://gitlab.com/api/v4/projects/$PROJECT_ID/cluster_agents" | jq -r ".[] | select(.name == \"$agent_name\") | .name")

    if [ "$gitlab_registered" = "$agent_name" ]; then
        echo -e "  ${GREEN}✅ Registrado no GitLab${NC}"
    else
        echo -e "  ${RED}❌ Não registrado no GitLab${NC}"
        return 1
    fi

    # Verificar arquivo de configuração
    if [ -f "$config_file" ]; then
        echo -e "  ${GREEN}✅ Configuração existe${NC}"

        # Verificar se tem ci_access
        if grep -q "ci_access:" "$config_file"; then
            echo -e "  ${GREEN}✅ CI/CD access configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  CI/CD access não configurado${NC}"
        fi

        # Verificar se tem user_access
        if grep -q "user_access:" "$config_file"; then
            echo -e "  ${GREEN}✅ User access configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  User access não configurado${NC}"
        fi

        # Verificar se tem gitops
        if grep -q "gitops:" "$config_file"; then
            echo -e "  ${GREEN}✅ GitOps configurado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  GitOps não configurado${NC}"
        fi

        # Verificar se tem remote_development
        if grep -q "remote_development:" "$config_file"; then
            echo -e "  ${GREEN}✅ Remote Development habilitado${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Remote Development não configurado${NC}"
        fi

    else
        echo -e "  ${RED}❌ Arquivo de configuração não encontrado${NC}"
    fi

    echo ""
}

# Obter lista de agentes registrados no GitLab
echo "📊 VERIFICANDO REGISTRO NO GITLAB:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

registered_agents=$(curl -s -H "Authorization: Bearer $GITLAB_TOKEN" "https://gitlab.com/api/v4/projects/$PROJECT_ID/cluster_agents" | jq -r '.[].name')

echo "Agentes registrados no GitLab:"
for agent in $registered_agents; do
    echo -e "  ${GREEN}✅ $agent${NC}"
done

agent_count=$(echo "$registered_agents" | wc -l)
echo ""
echo -e "${BLUE}Total de agentes registrados: $agent_count/7${NC}"
echo ""

# Verificar agentes específicos
echo "📋 VERIFICAÇÃO DETALHADA DOS AGENTES:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

all_agents=("assistente-juridico-agent" "agente-cluster" "agenterevisor" "agenterevisor2" "agente-desenvolvimento" "agente-qa" "agente-producao")

for agent in "${all_agents[@]}"; do
    check_agent_complete "$agent"
done

# Status final
echo "🎯 STATUS FINAL:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$agent_count" -eq 7 ]; then
    echo -e "${GREEN}✅ Todos os 7 agentes estão registrados no GitLab!${NC}"
    echo ""
    echo "📝 PRÓXIMOS PASSOS:"
    echo "1. Configurar tokens de acesso para cada agente"
    echo "2. Testar conectividade dos agentes com o cluster Kubernetes"
    echo "3. Configurar RBAC e permissões específicas"
    echo "4. Executar pipelines de teste"
else
    echo -e "${YELLOW}⚠️  Ainda faltam agentes para registrar${NC}"
    echo ""
    echo "📝 AGENTES FALTANDO:"
    for agent in "${all_agents[@]}"; do
        if ! echo "$registered_agents" | grep -q "^$agent$"; then
            echo -e "  ${RED}❌ $agent${NC}"
        fi
    done
fi

echo ""
echo "💡 DICAS DE CONFIGURAÇÃO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "- Use namespaces diferentes por ambiente"
echo "- Configure RBAC específico por agente"
echo "- Habilite GitOps apenas onde necessário"
echo "- Monitore recursos e limits por agente"
echo "- Use secrets para credenciais sensíveis"