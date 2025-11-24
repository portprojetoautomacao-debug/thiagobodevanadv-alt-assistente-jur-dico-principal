#!/bin/bash

# Script para gerenciar agentes GitLab Kubernetes
# Implementa operações da documentação oficial

set -e

echo "🔧 Gerenciamento de Agentes GitLab Kubernetes"
echo "============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Função para sucesso
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Função para erro
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para aviso
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se GitLab CLI está instalado
check_glab() {
    if ! command -v glab &> /dev/null; then
        error "GitLab CLI não encontrado"
        echo "Instale com: curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash"
        exit 1
    fi
}

# Verificar autenticação
check_auth() {
    if ! glab auth status &> /dev/null; then
        error "Não autenticado no GitLab CLI"
        echo "Execute: glab auth login"
        exit 1
    fi
}

# Menu principal
show_menu() {
    echo "📋 OPERAÇÕES DISPONÍVEIS:"
    echo "========================="
    echo ""
    echo "1. 👁️  Ver agentes (status e versão)"
    echo "2. ⚙️  Configurar agente (editar config.yaml)"
    echo "3. 🔍 Ver agentes compartilhados"
    echo "4. 📊 Ver atividade do agente"
    echo "5. 🐛 Debug do agente (alterar log level)"
    echo "6. 🔄 Reset token do agente"
    echo "7. 🗑️  Remover agente"
    echo "8. 📈 Status geral dos agentes"
    echo "9. 🚪 Sair"
    echo ""
}

# Ver agentes
view_agents() {
    log "Verificando agentes..."
    echo ""

    if glab cluster agent list 2>/dev/null; then
        success "Lista de agentes obtida com sucesso"
    else
        warning "Erro ao obter lista de agentes"
        echo "Verifique se está no diretório correto do projeto"
    fi
}

# Configurar agente
configure_agent() {
    log "Configurando agente..."
    echo ""

    echo "🤖 AGENTES DISPONÍVEIS:"
    glab cluster agent list | grep -E "(NAME|assistente-juridico|agente-)" | head -10
    echo ""

    read -p "Digite o nome do agente para configurar: " agent_name

    if [ -z "$agent_name" ]; then
        warning "Nome do agente não fornecido"
        return
    fi

    config_file=".gitlab/agents/$agent_name/config.yaml"

    if [ -f "$config_file" ]; then
        echo "📝 Arquivo de configuração encontrado: $config_file"
        echo ""
        echo "Conteúdo atual:"
        echo "==============="
        cat "$config_file"
        echo ""
        echo "==============="
        echo ""

        read -p "Deseja editar o arquivo? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} "$config_file"
            success "Arquivo editado. Faça commit das mudanças."
        fi
    else
        error "Arquivo de configuração não encontrado: $config_file"
    fi
}

# Ver agentes compartilhados
view_shared_agents() {
    log "Verificando agentes compartilhados..."
    echo ""

    warning "Nota: Agentes compartilhados aparecem automaticamente"
    warning "na aba 'Agent' quando autorizados via ci_access/user_access"
    echo ""

    echo "🔍 Agentes que podem ser compartilhados:"
    echo "========================================"

    # Listar agentes locais
    for agent_dir in .gitlab/agents/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            if [ -f "$config_file" ]; then
                echo "🤖 $agent_name"

                # Verificar se tem ci_access ou user_access
                if grep -q "ci_access:" "$config_file" 2>/dev/null; then
                    echo "   ✅ CI/CD access configurado"
                fi

                if grep -q "user_access:" "$config_file" 2>/dev/null; then
                    echo "   ✅ User access configurado"
                fi

                echo ""
            fi
        fi
    done
}

# Ver atividade do agente
view_agent_activity() {
    log "Verificando atividade do agente..."
    echo ""

    echo "📊 Para ver a atividade do agente:"
    echo "=================================="
    echo ""
    echo "1. Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. Navegue: Operate > Kubernetes clusters"
    echo ""
    echo "3. Selecione a aba 'Agent'"
    echo ""
    echo "4. Clique no agente desejado"
    echo ""
    echo "5. Veja a seção 'Activity' para:"
    echo "   • Eventos de registro"
    echo "   • Eventos de conexão"
    echo "   • Status de conexão"
    echo ""

    warning "Nota: A atividade mostra eventos da última semana"
}

# Debug do agente
debug_agent() {
    log "Configurando debug do agente..."
    echo ""

    echo "🐛 NÍVEIS DE LOG DISPONÍVEIS:"
    echo "============================="
    echo "• error (padrão para gRPC)"
    echo "• info (padrão geral)"
    echo "• debug (detalhado)"
    echo "• warn"
    echo ""

    echo "📝 CONFIGURAÇÃO NO config.yaml:"
    echo "==============================="
    echo "observability:"
    echo "  logging:"
    echo "    level: debug        # debug, info, warn, error"
    echo "    grpc_level: warn    # error, warn, info, debug"
    echo ""

    read -p "Digite o nome do agente para configurar debug: " agent_name

    if [ -z "$agent_name" ]; then
        warning "Nome do agente não fornecido"
        return
    fi

    config_file=".gitlab/agents/$agent_name/config.yaml"

    if [ -f "$config_file" ]; then
        echo "🔍 Verificando configuração atual..."
        if grep -q "observability:" "$config_file" 2>/dev/null; then
            echo "⚙️  Configuração de observabilidade encontrada:"
            grep -A 10 "observability:" "$config_file"
        else
            echo "📝 Adicionando configuração de debug..."
            echo "" >> "$config_file"
            cat >> "$config_file" << 'EOF'
observability:
  logging:
    level: debug
    grpc_level: warn
EOF
            success "Configuração de debug adicionada"
            echo ""
            echo "🔍 Para ver os logs após commit:"
            echo "kubectl logs -f -l=app=gitlab-agent -n gitlab-agent"
        fi
    else
        error "Arquivo de configuração não encontrado: $config_file"
    fi
}

# Reset token do agente
reset_agent_token() {
    log "Resetando token do agente..."
    echo ""

    warning "IMPORTANTE: Um agente pode ter apenas 2 tokens ativos"
    echo ""

    echo "🔄 PROCESSO DE RESET:"
    echo "===================="
    echo ""
    echo "1. Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. Navegue: Operate > Kubernetes clusters > Agent"
    echo ""
    echo "3. Selecione o agente desejado"
    echo ""
    echo "4. Vá para aba 'Access tokens'"
    echo ""
    echo "5. Clique 'Create token'"
    echo ""
    echo "6. Preencha nome e descrição (opcional)"
    echo ""
    echo "7. Clique 'Create token'"
    echo ""
    echo "8. Use o novo token para atualizar o agente no cluster"
    echo ""
    echo "9. Revogue o token antigo quando confirmar que o novo funciona"
    echo ""

    warning "Nota: Não há downtime durante o reset"
}

# Remover agente
remove_agent() {
    log "Removendo agente..."
    echo ""

    error "⚠️  ATENÇÃO: Esta operação é irreversível!"
    echo ""

    echo "🗑️  PROCESSO DE REMOÇÃO:"
    echo "========================"
    echo ""
    echo "1. Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. Navegue: Operate > Kubernetes clusters > Agent"
    echo ""
    echo "3. Na tabela, localize o agente"
    echo ""
    echo "4. Na coluna 'Options', clique nos 3 pontos (⋯)"
    echo ""
    echo "5. Selecione 'Delete agent'"
    echo ""
    echo "6. Confirme a remoção"
    echo ""

    warning "Nota: O agente é removido do GitLab, mas os recursos"
    warning "no cluster Kubernetes devem ser limpos manualmente"
    echo ""
    echo "🧹 LIMPEZA MANUAL NO CLUSTER:"
    echo "kubectl delete -n gitlab-kubernetes-agent -f ./resources.yml"
    echo ""

    read -p "Tem certeza que deseja continuar? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Digite o nome do agente para remover: " agent_name

        if [ -z "$agent_name" ]; then
            warning "Operação cancelada"
            return
        fi

        # Remover arquivos locais
        agent_dir=".gitlab/agents/$agent_name"
        if [ -d "$agent_dir" ]; then
            echo "🗑️  Removendo arquivos locais..."
            rm -rf "$agent_dir"
            success "Arquivos locais removidos: $agent_dir"
        else
            warning "Diretório do agente não encontrado: $agent_dir"
        fi

        echo ""
        warning "Agora complete a remoção no GitLab web interface"
    else
        success "Operação cancelada"
    fi
}

# Status geral
general_status() {
    log "Verificando status geral dos agentes..."
    echo ""

    # Verificar arquivos de configuração
    echo "📁 ARQUIVOS DE CONFIGURAÇÃO:"
    echo "============================"

    agent_count=0
    for agent_dir in .gitlab/agents/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            config_file="$agent_dir/config.yaml"

            if [ -f "$config_file" ]; then
                echo "✅ $agent_name - Configurado"
                ((agent_count++))
            else
                echo "❌ $agent_name - Sem config.yaml"
            fi
        fi
    done

    echo ""
    echo "📊 RESUMO:"
    echo "=========="
    echo "• Total de agentes configurados: $agent_count"
    echo "• Agentes esperados: 7"
    echo ""

    # Verificar cluster
    echo "🏗️  CLUSTER KUBERNETES:"
    echo "======================"

    if kubectl cluster-info &>/dev/null; then
        echo "✅ Cluster acessível"
        node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        echo "📊 Nodes disponíveis: $node_count"
    else
        echo "❌ Cluster não acessível"
    fi

    echo ""
    echo "🔗 CONEXÃO GITLAB:"
    echo "=================="

    if glab auth status &>/dev/null; then
        echo "✅ GitLab CLI autenticado"
    else
        echo "❌ GitLab CLI não autenticado"
    fi
}

# Loop principal
check_glab
check_auth

while true; do
    show_menu
    read -p "Escolha uma opção (1-9): " choice

    case $choice in
        1) view_agents ;;
        2) configure_agent ;;
        3) view_shared_agents ;;
        4) view_agent_activity ;;
        5) debug_agent ;;
        6) reset_agent_token ;;
        7) remove_agent ;;
        8) general_status ;;
        9) success "Saindo..."; exit 0 ;;
        *) warning "Opção inválida. Tente novamente." ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    clear
done