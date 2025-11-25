#!/bin/bash

# Script para configurar Auto DevOps no GitLab
# Assistente Jurídico PJe - Configuração Híbrida Auto DevOps + Componentes

set -e

echo "🚀 Configurando Auto DevOps para Assistente Jurídico PJe..."
echo "=========================================================="

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

echo "📋 Verificando configuração atual..."

# Verificar se já existe .gitlab-ci.yml
if [ -f ".gitlab-ci.yml" ]; then
    echo "⚠️  Já existe um .gitlab-ci.yml customizado"
    echo ""
    echo "Escolha uma opção:"
    echo "1. Manter pipeline customizado (recomendado para controle total)"
    echo "2. Migrar para Auto DevOps (mais simples, menos controle)"
    echo "3. Criar configuração híbrida (melhor dos dois mundos)"
    echo ""
    read -p "Digite sua escolha (1/2/3): " choice

    case $choice in
        1)
            echo "✅ Mantendo pipeline customizado"
            echo "💡 O Auto DevOps pode ser usado como fallback se remover o .gitlab-ci.yml"
            exit 0
            ;;
        2)
            echo "🔄 Migrando para Auto DevOps..."
            echo "📋 Fazer backup do pipeline atual..."
            cp .gitlab-ci.yml .gitlab-ci.yml.backup
            rm .gitlab-ci.yml
            ;;
        3)
            echo "🔄 Criando configuração híbrida..."
            # Manter .gitlab-ci.yml e adicionar auto-devops-config.yml
            ;;
        *)
            echo "❌ Opção inválida"
            exit 1
            ;;
    esac
fi

echo ""
echo "📝 Instruções para configurar Auto DevOps no GitLab:"
echo "=================================================="
echo ""
echo "1. 📋 Acesse seu projeto no GitLab:"
echo "   https://gitlab.com/[seu-usuario]/assistente-juridico-p"
echo ""
echo "2. 🔧 Vá para Settings > CI/CD > Auto DevOps:"
echo "   - Habilite 'Default to Auto DevOps pipeline'"
echo "   - Configure o domínio base (opcional)"
echo "   - Escolha estratégia de implantação: Rolling ou Manual"
echo ""
echo "3. 🌐 Configure cluster Kubernetes (para deploy):"
echo "   - Vá para Infrastructure > Kubernetes clusters"
echo "   - Adicione cluster GKE, EKS ou self-hosted"
echo "   - Configure namespace e service account"
echo ""
echo "4. 🔐 Configure variáveis de ambiente:"
echo "   - CI/CD > Variables"
echo "   - Adicione credenciais necessárias"
echo ""
echo "5. 🚀 Configure domínios personalizados:"
echo "   - Settings > Pages"
echo "   - Adicione domínio para staging e produção"
echo ""
echo "6. 📊 Configure monitoramento:"
echo "   - Settings > Integrations"
echo "   - Configure Prometheus, Sentry, etc."
echo ""

# Configurar variáveis específicas para jurídico
echo "⚖️ Configurando variáveis específicas para aplicação jurídica..."
echo ""

VARIABLES=(
    "LEGAL_COMPLIANCE_ENABLED=1:::Variável:::Habilita auditorias LGPD"
    "LGPD_AUDIT_ENABLED=1:::Variável:::Auditoria de dados pessoais"
    "BACKUP_ENABLED=1:::Variável:::Backup automático de dados"
    "NOTIFICATIONS_ENABLED=1:::Variável:::Notificações de deploy"
    "STAGING_ENABLED=1:::Variável:::Habilita ambiente staging"
    "PRODUCTION_ENABLED=1:::Variável:::Habilita ambiente produção"
    "CANARY_ENABLED=0:::Variável:::Desabilita canary (pode ser habilitado depois)"
    "INCREMENTAL_ROLLOUT_ENABLED=1:::Variável:::Rollout incremental"
    "AUTO_DEVOPS_DEPLOY_STRATEGY=rolling:::Variável:::Estratégia rolling"
)

echo "📋 Variáveis recomendadas para configurar no GitLab:"
echo "=================================================="
for var in "${VARIABLES[@]}"; do
    IFS=':::' read -r key type description <<< "$var"
    echo "• $key ($type)"
    echo "  📝 $description"
    echo ""
done

echo "🔧 Configurações de segurança recomendadas:"
echo "=========================================="
echo "• SAST_EXCLUDED_PATHS: node_modules,dist,.git"
echo "• SECRET_DETECTION_EXCLUDED_PATHS: .env*,*.key,secrets/"
echo "• DEPENDENCY_SCANNING_DISABLED: false"
echo ""

echo "📊 Configurações de performance:"
echo "==============================="
echo "• BROWSER_PERFORMANCE_DISABLED: false"
echo "• LOAD_PERFORMANCE_DISABLED: false"
echo ""

echo "🎯 Benefícios do Auto DevOps para aplicações jurídicas:"
echo "======================================================"
echo ""
echo "✅ Detecta automaticamente React/TypeScript"
echo "✅ Build e deploy sem configuração complexa"
echo "✅ Security scanning integrado (SAST, DAST, secrets)"
echo "✅ Performance testing automático"
echo "✅ Deploy para Kubernetes com uma linha"
echo "✅ Rollback automático em falhas"
echo "✅ Ambientes staging/produção separados"
echo "✅ Integração com monitoring e alertas"
echo ""
echo "⚖️ Recursos específicos para jurídico:"
echo "===================================="
echo "• Auditoria LGPD automática"
echo "• Backup de dados jurídicos"
echo "• Notificações de compliance"
echo "• Deploy seguro com validações"
echo ""

echo "🚀 Próximos passos:"
echo "=================="
echo ""
echo "1. Configure as variáveis acima no GitLab"
echo "2. Habilite o Auto DevOps no projeto"
echo "3. Configure cluster Kubernetes (se quiser deploy automático)"
echo "4. Faça um commit de teste para acionar o pipeline"
echo "5. Monitore os resultados e ajuste conforme necessário"
echo ""

echo "📚 Documentação adicional:"
echo "========================="
echo ""
echo "• Auto DevOps: https://docs.gitlab.com/ee/topics/autodevops/"
echo "• Kubernetes: https://docs.gitlab.com/ee/user/infrastructure/clusters/"
echo "• CI/CD Variables: https://docs.gitlab.com/ee/ci/variables/"
echo ""

echo "✅ Configuração do Auto DevOps preparada!"
echo ""
echo "💡 Dica: Comece com Auto DevOps para simplicidade,"
echo "   depois migre para componentes customizados quando precisar de mais controle."