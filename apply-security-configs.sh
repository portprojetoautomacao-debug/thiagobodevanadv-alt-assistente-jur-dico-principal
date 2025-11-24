#!/bin/bash

# Script para aplicar configurações de segurança GitLab Agents
# Implementa RBAC e personificação conforme documentação oficial

set -e

echo "🔒 Aplicando Configurações de Segurança GitLab Agents"
echo "===================================================="
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

# Verificar se kubectl está disponível
log "Verificando kubectl..."
if ! command -v kubectl &> /dev/null; then
    error "kubectl não encontrado"
    exit 1
fi

# Aplicar RBAC de segurança
log "Aplicando RBAC de segurança..."
if kubectl apply -f k8s/shared/rbac-security.yaml; then
    success "RBAC de segurança aplicado com sucesso"
else
    error "Falha ao aplicar RBAC de segurança"
    exit 1
fi

# Aplicar manifests dos namespaces
log "Aplicando manifests dos namespaces..."
for env in dev qa production; do
    if [ -f "k8s/$env/namespace.yaml" ]; then
        kubectl apply -f "k8s/$env/namespace.yaml"
        success "Namespace $env aplicado"
    fi
done

# Aplicar network policies
log "Aplicando Network Policies..."
for env in dev qa production; do
    if [ -f "k8s/$env/network-policy.yaml" ]; then
        kubectl apply -f "k8s/$env/network-policy.yaml"
        success "Network Policy $env aplicada"
    fi
done

# Aplicar RBAC específico por ambiente
log "Aplicando RBAC por ambiente..."
for env in dev qa production; do
    if [ -f "k8s/$env/rbac.yaml" ]; then
        kubectl apply -f "k8s/$env/rbac.yaml"
        success "RBAC $env aplicado"
    fi
done

# Aplicar ConfigMaps compartilhados
log "Aplicando ConfigMaps..."
if [ -f "k8s/shared/configmaps.yaml" ]; then
    kubectl apply -f "k8s/shared/configmaps.yaml"
    success "ConfigMaps aplicados"
fi

echo ""
success "🎉 Todas as configurações de segurança foram aplicadas!"
echo ""
echo "📋 CONFIGURAÇÕES IMPLEMENTADAS:"
echo "==============================="
echo ""
echo "🔐 Personificação (Impersonation):"
echo "   - Trabalhos CI/CD personificam identidade gitlab:ci_job"
echo "   - Agentes personificam identidade gitlab:agent:<nome>"
echo ""
echo "🏗️  Controle de Acesso por Ambiente:"
echo "   - Desenvolvimento: Permissões completas (create, update, delete)"
echo "   - QA: Permissões limitadas (apenas patch, sem delete)"
echo "   - Produção: Apenas leitura (get, list, watch)"
echo ""
echo "🌐 Restrições de Ambiente:"
echo "   - Desenvolvimento: development, dev, review/*"
echo "   - QA: qa, staging, test (apenas branches protegidas)"
echo "   - Produção: production, prod (apenas branches protegidas)"
echo ""
echo "🔒 Network Policies:"
echo "   - Isolamento completo entre namespaces"
echo "   - Controle de tráfego por ambiente"
echo ""
echo "📊 PRÓXIMOS PASSOS:"
echo "==================="
echo ""
echo "1. Conectar agentes no GitLab:"
echo "   ./connect-gitlab-agents.sh"
echo ""
echo "2. Testar segurança:"
echo "   ./scripts/test-gitlab-agents.sh"
echo ""
echo "3. Verificar permissões:"
echo "   kubectl auth can-i --as=gitlab:ci_job get pods -n desenvolvimento"
echo "   kubectl auth can-i --as=gitlab:ci_job delete pods -n production"
echo ""
echo "4. Executar pipeline de teste:"
echo "   git add . && git commit -m 'Security configs' && git push"