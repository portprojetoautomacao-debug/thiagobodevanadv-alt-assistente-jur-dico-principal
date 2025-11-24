#!/bin/bash

# Script Principal de Gerenciamento de Agentes GitLab Kubernetes
# Interface unificada para todas as operações de gerenciamento

set -e

echo "🚀 Gerenciamento Completo de Agentes GitLab Kubernetes"
echo "===================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

# Função para título
title() {
    echo -e "${PURPLE}🔧 $1${NC}"
}

# Função para info
info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Verificar dependências
check_dependencies() {
    log "Verificando dependências..."

    local missing_deps=()

    # Verificar GitLab CLI
    if ! command -v glab &> /dev/null; then
        missing_deps+=("GitLab CLI (glab)")
    fi

    # Verificar kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi

    # Verificar git
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Dependências faltando:"
        for dep in "${missing_deps[@]}"; do
            echo "  • $dep"
        done
        echo ""
        echo "📦 INSTALAÇÃO:"
        echo "• GitLab CLI: curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash"
        echo "• kubectl: https://kubernetes.io/docs/tasks/tools/"
        echo "• git: sudo apt-get install git"
        exit 1
    fi

    success "Todas as dependências estão instaladas"
}

# Verificar autenticação
check_authentication() {
    log "Verificando autenticação..."

    local auth_ok=true

    # Verificar GitLab CLI
    if ! glab auth status &> /dev/null; then
        warning "GitLab CLI não autenticado"
        echo "Execute: glab auth login"
        auth_ok=false
    else
        success "GitLab CLI autenticado"
    fi

    # Verificar cluster Kubernetes
    if ! kubectl cluster-info &> /dev/null; then
        warning "Cluster Kubernetes não acessível"
        auth_ok=false
    else
        success "Cluster Kubernetes acessível"
    fi

    if [ "$auth_ok" = false ]; then
        echo ""
        warning "Algumas autenticações estão faltando"
        read -p "Continuar mesmo assim? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Menu principal
show_main_menu() {
    echo ""
    title "MENU PRINCIPAL - GERENCIAMENTO DE AGENTES"
    echo "=========================================="
    echo ""
    echo "🤖 GERENCIAMENTO GERAL:"
    echo "1. 📋 Gerenciar agentes (ver, configurar, atividade)"
    echo "2. 🏥 Verificar saúde dos agentes"
    echo ""
    echo "🐛 DEBUGGING:"
    echo "3. 🐛 Debug de agentes (logs, níveis de log)"
    echo ""
    echo "🔐 SEGURANÇA:"
    echo "4. 🔄 Reset de tokens dos agentes"
    echo ""
    echo "🗑️  MANUTENÇÃO:"
    echo "5. 🗑️  Remover agentes"
    echo ""
    echo "📊 MONITORAMENTO:"
    echo "6. 📊 Status geral do sistema"
    echo "7. 📜 Ver logs do sistema"
    echo ""
    echo "ℹ️  INFORMAÇÕES:"
    echo "8. 📖 Documentação e ajuda"
    echo "9. 🚪 Sair"
    echo ""
}

# Executar script de gerenciamento
run_management_script() {
    if [ -f "./manage-gitlab-agents.sh" ]; then
        ./manage-gitlab-agents.sh
    else
        error "Script manage-gitlab-agents.sh não encontrado"
    fi
}

# Executar script de health check
run_health_check() {
    if [ -f "./health-check-agents.sh" ]; then
        ./health-check-agents.sh
    else
        error "Script health-check-agents.sh não encontrado"
    fi
}

# Executar script de debug
run_debug_script() {
    if [ -f "./debug-gitlab-agents.sh" ]; then
        ./debug-gitlab-agents.sh
    else
        error "Script debug-gitlab-agents.sh não encontrado"
    fi
}

# Executar script de reset de tokens
run_token_reset() {
    if [ -f "./reset-agent-tokens.sh" ]; then
        ./reset-agent-tokens.sh
    else
        error "Script reset-agent-tokens.sh não encontrado"
    fi
}

# Executar script de remoção
run_removal_script() {
    if [ -f "./remove-gitlab-agents.sh" ]; then
        ./remove-gitlab-agents.sh
    else
        error "Script remove-gitlab-agents.sh não encontrado"
    fi
}

# Status geral do sistema
system_status() {
    log "Verificando status geral do sistema..."

    echo ""
    title "STATUS GERAL DO SISTEMA"
    echo "========================"

    # Status do Git
    echo ""
    info "GIT:"
    if git status &>/dev/null; then
        branch=$(git branch --show-current)
        echo "  ✅ Repositório OK - Branch: $branch"

        # Verificar mudanças não commitadas
        if git diff --quiet && git diff --staged --quiet; then
            echo "  ✅ Working directory limpo"
        else
            warning "  ⚠️  Há mudanças não commitadas"
        fi
    else
        error "  ❌ Repositório Git não encontrado"
    fi

    # Status dos agentes
    echo ""
    info "AGENTES GITLAB:"
    agent_count=$(find .gitlab/agents -name "config.yaml" 2>/dev/null | wc -l)
    echo "  📊 Agentes configurados: $agent_count/7"

    if glab auth status &>/dev/null 2>&1; then
        gitlab_agents=$(glab cluster agent list 2>/dev/null | grep -c -E "(assistente-juridico|agente-)" || echo "0")
        echo "  🌐 Agentes no GitLab: $gitlab_agents"
    else
        warning "  ⚠️  GitLab CLI não autenticado"
    fi

    # Status do cluster
    echo ""
    info "CLUSTER KUBERNETES:"
    if kubectl cluster-info &>/dev/null; then
        node_count=$(kubectl get nodes --no-headers 2>/dev/null | wc -l)
        echo "  ✅ Cluster acessível - Nodes: $node_count"

        # Verificar namespace gitlab-agent
        if kubectl get namespace gitlab-agent &>/dev/null; then
            pod_count=$(kubectl get pods -n gitlab-agent --no-headers 2>/dev/null | wc -l)
            echo "  📦 Namespace gitlab-agent OK - Pods: $pod_count"
        else
            warning "  ⚠️  Namespace gitlab-agent não existe"
        fi
    else
        error "  ❌ Cluster não acessível"
    fi

    # Status dos scripts
    echo ""
    info "SCRIPTS:"
    local scripts=("manage-gitlab-agents.sh" "health-check-agents.sh" "debug-gitlab-agents.sh" "reset-agent-tokens.sh" "remove-gitlab-agents.sh")
    for script in "${scripts[@]}"; do
        if [ -x "$script" ]; then
            echo "  ✅ $script (executável)"
        else
            echo "  ❌ $script (não executável)"
        fi
    done

    echo ""
    success "Status verificado"
}

# Ver logs do sistema
view_system_logs() {
    log "Visualizando logs do sistema..."

    echo ""
    title "LOGS DO SISTEMA"
    echo "================"

    echo "1. 📜 Logs do Git (últimos commits)"
    echo "2. 📜 Logs do Kubernetes (pods do agente)"
    echo "3. 📜 Logs do GitLab CLI"
    echo "4. 📜 Logs de autenticação"
    echo "5. 🔙 Voltar"
    echo ""

    read -p "Escolha uma opção (1-5): " choice

    case $choice in
        1)
            echo ""
            info "ÚLTIMOS COMMITS:"
            git log --oneline -10
            ;;
        2)
            echo ""
            info "LOGS DOS PODS DO AGENTE:"
            if kubectl get namespace gitlab-agent &>/dev/null; then
                pods=$(kubectl get pods -n gitlab-agent --no-headers -o custom-columns=":metadata.name" 2>/dev/null)
                if [ -n "$pods" ]; then
                    for pod in $pods; do
                        echo ""
                        echo "📦 Pod: $pod"
                        kubectl logs --tail=20 "$pod" -n gitlab-agent 2>/dev/null || echo "Erro ao obter logs"
                    done
                else
                    warning "Nenhum pod encontrado"
                fi
            else
                error "Namespace gitlab-agent não existe"
            fi
            ;;
        3)
            echo ""
            info "LOGS DO GITLAB CLI:"
            if command -v glab &> /dev/null; then
                glab --version
                echo ""
                glab auth status 2>&1
            else
                error "GitLab CLI não instalado"
            fi
            ;;
        4)
            echo ""
            info "LOGS DE AUTENTICAÇÃO:"
            echo "GitLab CLI:"
            glab auth status 2>&1 || echo "Não autenticado"
            echo ""
            echo "Kubernetes:"
            kubectl cluster-info 2>&1 || echo "Cluster não acessível"
            ;;
        5) return ;;
        *) warning "Opção inválida" ;;
    esac
}

# Documentação e ajuda
show_documentation() {
    log "Mostrando documentação..."

    echo ""
    title "DOCUMENTAÇÃO E AJUDA"
    echo "===================="

    echo "📚 DOCUMENTAÇÃO OFICIAL:"
    echo "https://docs.gitlab.com/ee/user/clusters/agent/"
    echo ""

    echo "🔧 SCRIPTS DISPONÍVEIS:"
    echo ""

    echo "🤖 manage-gitlab-agents.sh"
    echo "  • Ver agentes e status de conexão"
    echo "  • Configurar agentes (editar config.yaml)"
    echo "  • Ver agentes compartilhados"
    echo "  • Ver atividade dos agentes"
    echo ""

    echo "🏥 health-check-agents.sh"
    echo "  • Verificar saúde geral dos agentes"
    echo "  • Validar configurações RBAC"
    echo "  • Verificar conectividade GitLab"
    echo "  • Verificar recursos do cluster"
    echo ""

    echo "🐛 debug-gitlab-agents.sh"
    echo "  • Configurar níveis de log"
    echo "  • Ver logs em tempo real"
    echo "  • Verificar status de debug"
    echo ""

    echo "🔄 reset-agent-tokens.sh"
    echo "  • Reset de tokens via UI (recomendado)"
    echo "  • Reset via CLI (experimental)"
    echo "  • Atualizar agentes com novos tokens"
    echo "  • Revogar tokens antigos"
    echo ""

    echo "🗑️  remove-gitlab-agents.sh"
    echo "  • Remover agentes via UI"
    echo "  • Remover via GraphQL API"
    echo "  • Limpar recursos do cluster"
    echo "  • Remover arquivos locais"
    echo ""

    echo "💡 DICAS IMPORTANTES:"
    echo "• Sempre faça backup antes de remover agentes"
    echo "• Teste novos tokens antes de revogar antigos"
    echo "• Monitore logs durante troubleshooting"
    echo "• Use GitLab UI para operações críticas"
    echo ""

    echo "🆘 SUPORTE:"
    echo "• Documentação: https://docs.gitlab.com"
    echo "• Fórum: https://forum.gitlab.com"
    echo "• Issues: https://gitlab.com/gitlab-org/gitlab/-/issues"
}

# Loop principal
check_dependencies
check_authentication

while true; do
    show_main_menu
    read -p "Escolha uma opção (1-9): " choice

    case $choice in
        1) run_management_script ;;
        2) run_health_check ;;
        3) run_debug_script ;;
        4) run_token_reset ;;
        5) run_removal_script ;;
        6) system_status ;;
        7) view_system_logs ;;
        8) show_documentation ;;
        9) success "Saindo..."; exit 0 ;;
        *) warning "Opção inválida. Tente novamente." ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    clear
done