#!/bin/bash

# Script para reset de tokens de agentes GitLab Kubernetes
# Implementa processo de reset sem downtime conforme documentação

set -e

echo "🔄 Reset de Tokens - Agentes GitLab Kubernetes"
echo "=============================================="
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

# Verificar GitLab CLI
check_glab() {
    if ! command -v glab &> /dev/null; then
        error "GitLab CLI não encontrado"
        echo "Instale com: curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash"
        exit 1
    fi

    if ! glab auth status &> /dev/null; then
        error "Não autenticado no GitLab CLI"
        echo "Execute: glab auth login"
        exit 1
    fi
}

# Listar agentes e tokens
list_agents_and_tokens() {
    log "Listando agentes e tokens..."

    echo "🤖 AGENTES E TOKENS:"
    echo "===================="

    if glab cluster agent list 2>/dev/null; then
        glab cluster agent list | while read -r line; do
            if [[ $line == *"assistente-juridico"* ]] || [[ $line == *"agente-"* ]]; then
                agent_name=$(echo "$line" | awk '{print $1}')
                echo ""
                echo "🤖 Agente: $agent_name"

                # Obter tokens do agente
                if glab cluster agent get "$agent_name" 2>/dev/null; then
                    echo "  🔑 Tokens ativos:"
                    glab cluster agent get "$agent_name" | grep -A 5 "Access tokens" | tail -5 | sed 's/^/    /'
                else
                    echo "  ❌ Erro ao obter tokens"
                fi
            fi
        done
    else
        error "Erro ao listar agentes"
    fi
}

# Reset token via UI (orientação)
reset_token_ui() {
    log "Orientação para reset via GitLab UI..."

    echo "🔄 PROCESSO DE RESET VIA UI:"
    echo "============================"
    echo ""
    echo "1. 📱 Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. 🧭 Navegue:"
    echo "   Operate > Kubernetes clusters"
    echo ""
    echo "3. 📋 Selecione a aba 'Agent'"
    echo ""
    echo "4. 🤖 Clique no agente desejado"
    echo ""
    echo "5. 🔑 Vá para aba 'Access tokens'"
    echo ""
    echo "6. ➕ Clique 'Create token'"
    echo ""
    echo "7. 📝 Preencha:"
    echo "   • Name: [novo-token-$(date +%Y%m%d)]"
    echo "   • Description: Reset token $(date)"
    echo ""
    echo "8. ✅ Clique 'Create token'"
    echo ""
    echo "9. 🔒 Guarde o token gerado com segurança"
    echo ""
    echo "10. 🔄 Use o novo token para atualizar o agente no cluster"
    echo ""
    echo "11. 🗑️  Revogue o token antigo quando confirmar funcionamento"
    echo ""

    warning "💡 DICAS IMPORTANTES:"
    echo "• Um agente pode ter no máximo 2 tokens ativos"
    echo "• Não há downtime durante o reset"
    echo "• Teste o novo token antes de revogar o antigo"
    echo "• Tokens expiram após 1 ano por padrão"
}

# Reset token via CLI (experimental)
reset_token_cli() {
    log "Tentando reset via GitLab CLI..."

    warning "⚠️  FUNCIONALIDADE EXPERIMENTAL"
    echo "Esta funcionalidade pode não estar disponível na versão atual do GitLab CLI"
    echo ""

    echo "🤖 AGENTES DISPONÍVEIS:"
    glab cluster agent list | grep -E "(NAME|assistente-juridico|agente-)" | head -10
    echo ""

    read -p "Digite o nome do agente: " agent_name

    if [ -z "$agent_name" ]; then
        warning "Nome do agente não fornecido"
        return
    fi

    echo "🔄 Criando novo token para: $agent_name"
    echo ""

    # Tentar criar token via CLI
    if glab cluster agent token create "$agent_name" "reset-token-$(date +%Y%m%d)" \
        --description "Token reset $(date)" 2>/dev/null; then

        success "Novo token criado com sucesso"
        echo ""
        echo "📋 PRÓXIMOS PASSOS:"
        echo "==================="
        echo "1. Use o novo token para atualizar o agente no cluster"
        echo "2. Teste a conectividade"
        echo "3. Revogue tokens antigos se necessário"
    else
        error "Erro ao criar token via CLI"
        echo ""
        echo "🔄 Use o método via UI do GitLab"
        reset_token_ui
    fi
}

# Atualizar agente com novo token
update_agent_token() {
    log "Atualizando agente com novo token..."

    echo "🤖 AGENTES DISPONÍVEIS:"
    glab cluster agent list | grep -E "(NAME|assistente-juridico|agente-)" | head -10
    echo ""

    read -p "Digite o nome do agente: " agent_name

    if [ -z "$agent_name" ]; then
        warning "Nome do agente não fornecido"
        return
    fi

    read -p "Digite o novo token: " new_token

    if [ -z "$new_token" ]; then
        warning "Token não fornecido"
        return
    fi

    # Verificar se estamos em um cluster Kubernetes
    if ! kubectl cluster-info &>/dev/null; then
        error "Cluster Kubernetes não acessível"
        return
    fi

    # Verificar se o agente está instalado
    if ! kubectl get namespace gitlab-agent &>/dev/null; then
        error "Namespace gitlab-agent não existe"
        return
    fi

    echo "🔄 Atualizando token do agente..."

    # Criar secret com novo token
    secret_name="gitlab-agent-token-$agent_name"

    kubectl create secret generic "$secret_name" \
        --from-literal=token="$new_token" \
        --namespace gitlab-agent \
        --dry-run=client -o yaml | kubectl apply -f -

    if [ $? -eq 0 ]; then
        success "Token atualizado no cluster"
        echo ""
        echo "⏳ Aguardando o agente aplicar as mudanças..."
        echo "Verifique os logs: kubectl logs -f -l=app=gitlab-agent -n gitlab-agent"
    else
        error "Erro ao atualizar token no cluster"
    fi
}

# Revogar token antigo
revoke_old_token() {
    log "Orientação para revogar token antigo..."

    echo "🗑️  REVOGANDO TOKEN ANTIGO:"
    echo "==========================="
    echo ""
    echo "1. 📱 Acesse o GitLab web:"
    echo "   https://gitlab.com/thiagobodevan-a11y-group/assistente-juridico-p"
    echo ""
    echo "2. 🧭 Navegue:"
    echo "   Operate > Kubernetes clusters > Agent"
    echo ""
    echo "3. 🤖 Selecione o agente"
    echo ""
    echo "4. 🔑 Vá para aba 'Access tokens'"
    echo ""
    echo "5. 📋 Localize o token antigo"
    echo ""
    echo "6. 🗑️  Clique no botão 'Revoke' (🗑️)"
    echo ""
    echo "7. ✅ Confirme a revogação"
    echo ""

    warning "⚠️  IMPORTANTE:"
    echo "• Só revogue o token antigo após confirmar que o novo funciona"
    echo "• Verifique os logs do agente para confirmar conectividade"
}

# Verificar status dos tokens
check_token_status() {
    log "Verificando status dos tokens..."

    echo "🔍 STATUS DOS TOKENS:"
    echo "====================="

    for agent_dir in .gitlab/agents/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")

            echo ""
            echo "🤖 Agente: $agent_name"

            # Verificar tokens via GitLab CLI
            if glab cluster agent get "$agent_name" 2>/dev/null; then
                token_count=$(glab cluster agent get "$agent_name" | grep -c "token")
                echo "  🔑 Tokens encontrados: $token_count"

                if [ "$token_count" -gt 1 ]; then
                    warning "  ⚠️  Mais de 1 token ativo (máximo recomendado: 2)"
                fi
            else
                echo "  ❌ Erro ao verificar tokens"
            fi
        fi
    done
}

# Menu principal
show_menu() {
    echo "🔄 MENU DE RESET DE TOKENS:"
    echo "==========================="
    echo ""
    echo "1. 📋 Listar agentes e tokens atuais"
    echo "2. 🔄 Reset token via GitLab UI (recomendado)"
    echo "3. ⚙️  Reset token via CLI (experimental)"
    echo "4. 🔑 Atualizar agente com novo token"
    echo "5. 🗑️  Revogar token antigo"
    echo "6. 📊 Verificar status dos tokens"
    echo "7. 🚪 Sair"
    echo ""
}

# Loop principal
check_glab

while true; do
    show_menu
    read -p "Escolha uma opção (1-7): " choice

    case $choice in
        1) list_agents_and_tokens ;;
        2) reset_token_ui ;;
        3) reset_token_cli ;;
        4) update_agent_token ;;
        5) revoke_old_token ;;
        6) check_token_status ;;
        7) success "Saindo..."; exit 0 ;;
        *) warning "Opção inválida. Tente novamente." ;;
    esac

    echo ""
    read -p "Pressione ENTER para continuar..."
    clear
done