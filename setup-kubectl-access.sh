#!/bin/bash

# Script para configurar acesso local ao cluster Kubernetes via GitLab CLI
# Implementa as instruções da documentação oficial

set -e

echo "🔗 Configurando Acesso Local ao Cluster Kubernetes"
echo "=================================================="
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
log "Verificando GitLab CLI..."
if ! command -v glab &> /dev/null; then
    warning "GitLab CLI não encontrado"
    echo ""
    echo "📦 INSTALAÇÃO DO GITLAB CLI:"
    echo "curl -s https://gitlab.com/cli/cli/-/raw/main/scripts/install.sh | bash"
    echo ""
    echo "Ou baixe de: https://gitlab.com/cli/cli/-/releases"
    exit 1
fi

success "GitLab CLI encontrado"

# Verificar autenticação
log "Verificando autenticação no GitLab..."
if ! glab auth status &> /dev/null; then
    warning "Não autenticado no GitLab CLI"
    echo ""
    echo "🔐 AUTENTICAÇÃO NECESSÁRIA:"
    echo "glab auth login"
    echo ""
    echo "Ou com token:"
    echo "glab auth login --token YOUR_TOKEN"
    exit 1
fi

success "Autenticado no GitLab"

# Listar agentes disponíveis
log "Listando agentes disponíveis..."
echo ""
glab cluster agent list

echo ""
echo "📋 SELECIONE O AGENTE PARA CONFIGURAR:"
echo "======================================"
echo ""
echo "🤖 AGENTES DISPONÍVEIS:"
echo "   1. assistente-juridico-agent (desenvolvimento remoto)"
echo "   2. agente-cluster (gerenciamento geral)"
echo "   3. agente-desenvolvimento (desenvolvimento)"
echo "   4. agente-qa (testes)"
echo "   5. agente-producao (produção)"
echo "   6. agenterevisor (revisão)"
echo "   7. agenterevisor2 (revisão)"
echo ""

read -p "Digite o ID do agente (número da primeira coluna): " agent_id

if [ -z "$agent_id" ]; then
    error "ID do agente não fornecido"
    exit 1
fi

# Configurar kubeconfig
log "Configurando kubeconfig para o agente $agent_id..."
echo ""

warning "IMPORTANTE: Esta configuração:"
warning "  - Cria um personal access token válido até o fim do dia"
warning "  - Configura kubectl para usar o agente como credential plugin"
warning "  - Permite acesso direto ao cluster via kubectl"
echo ""

read -p "Continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operação cancelada."
    exit 0
fi

# Executar configuração
log "Executando: glab cluster agent update-kubeconfig --agent $agent_id --use-context"
if glab cluster agent update-kubeconfig --agent "$agent_id" --use-context; then
    success "Kubeconfig configurado com sucesso!"
else
    error "Falha ao configurar kubeconfig"
    exit 1
fi

# Testar conexão
log "Testando conexão com o cluster..."
echo ""
if kubectl get nodes; then
    success "Conexão com cluster estabelecida!"
    echo ""
    echo "🎯 COMANDOS DISPONÍVEIS:"
    echo "========================"
    echo ""
    echo "📊 Ver recursos:"
    echo "   kubectl get pods -A"
    echo "   kubectl get deployments -A"
    echo ""
    echo "🔍 Ver logs de agentes:"
    echo "   kubectl logs -n desenvolvimento -l app=gitlab-agent"
    echo "   kubectl logs -n qa -l app=gitlab-agent"
    echo "   kubectl logs -n production -l app=gitlab-agent"
    echo ""
    echo "⚙️  Gerenciar recursos:"
    echo "   kubectl get pods -n desenvolvimento"
    echo "   kubectl describe pod <pod-name> -n desenvolvimento"
    echo ""
    echo "🔐 Ver permissões:"
    echo "   kubectl auth can-i get pods"
    echo "   kubectl auth can-i create deployments -n desenvolvimento"
else
    error "Falha na conexão com o cluster"
    echo ""
    echo "🔧 POSSÍVEIS SOLUÇÕES:"
    echo "   1. Verifique se o agente está conectado no GitLab"
    echo "   2. Confirme se o token ainda é válido"
    echo "   3. Execute novamente: glab cluster agent update-kubeconfig --agent $agent_id"
fi

echo ""
success "Configuração de acesso local concluída!"
echo ""
echo "💡 DICAS:"
echo "========"
echo "• O token expira diariamente - renove com o mesmo comando"
echo "• Use diferentes contextos para diferentes agentes"
echo "• Configure aliases no seu shell para facilitar o uso"