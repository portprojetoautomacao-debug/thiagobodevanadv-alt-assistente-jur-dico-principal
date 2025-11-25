#!/bin/bash

# Script para migrar projeto do GitHub para GitLab
# Assistente Jurídico PJe - Migração para GitLab CI/CD

set -e

echo "🚀 Migração GitHub → GitLab - Assistente Jurídico PJe"
echo "===================================================="

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

# Obter informações atuais do repositório
CURRENT_URL=$(git config --get remote.origin.url)
echo "📍 Repositório atual: $CURRENT_URL"

if [[ $CURRENT_URL == https://gitlab.com/* ]]; then
    echo "✅ Já está no GitLab! Pulando migração."
    exit 0
fi

echo ""
echo "📋 Plano de Migração para GitLab:"
echo "=================================="

echo ""
echo "1️⃣ Criar projeto no GitLab:"
echo "   🔗 Acesse: https://gitlab.com"
echo "   ➕ Clique em 'New project'"
echo "   📁 Selecione 'Create blank project'"
echo "   📝 Nome: assistente-juridico-p"
echo "   🔒 Visibilidade: Public (ou Private conforme necessidade)"
echo "   ✅ Desmarque 'Initialize repository with a README'"
echo "   💾 Clique em 'Create project'"

echo ""
echo "2️⃣ Obter URL do novo repositório GitLab:"
echo "   📋 Copie a URL HTTPS do repositório criado"
echo "   📝 Ela deve ser algo como: https://gitlab.com/SEU_USUARIO/assistente-juridico-p.git"

echo ""
echo "3️⃣ Migrar código e histórico:"
echo "   🔄 Execute os comandos abaixo (substitua SEU_USUARIO):"

GITLAB_URL="https://gitlab.com/SEU_USUARIO/assistente-juridico-p.git"

echo ""
echo "   # Adicionar remote do GitLab"
echo "   git remote add gitlab $GITLAB_URL"
echo ""
echo "   # Push de todos os branches e tags"
echo "   git push gitlab --all"
echo "   git push gitlab --tags"
echo ""
echo "   # Definir GitLab como remote principal (opcional)"
echo "   git remote set-url origin $GITLAB_URL"
echo "   git remote remove github  # Se existir remote github"

echo ""
echo "4️⃣ Configurar CI/CD Catalog no GitLab:"
echo "   🔧 Acesse: https://gitlab.com/SEU_USUARIO/assistente-juridico-p/-/settings/ci_cd"
echo ""
echo "   📍 Vá para 'Components'"
echo "   ✅ Marque 'Enable components'"
echo "   📁 Base path: templates/"
echo ""
echo "   🏷️ Configure tags dos componentes:"
echo "   - security-component: 1.0.0"
echo "   - testing-component: 1.0.0"
echo "   - deployment-component: 1.0.0"
echo "   - monitoring-component: 1.0.0"
echo "   - api-testing-component: 1.0.0"
echo "   - backup-component: 1.0.0"
echo "   - container-deploy-component: 1.0.0"
echo "   - notifications-component: 1.0.0"

echo ""
echo "5️⃣ Testar CI/CD Catalog:"
echo "   🧪 Criar Merge Request de teste:"
echo "   git checkout -b test-catalog"
echo "   echo '# Test CI/CD Catalog' >> test-catalog.md"
echo "   git add test-catalog.md"
echo "   git commit -m 'test: validar CI/CD Catalog'"
echo "   git push gitlab test-catalog"
echo ""
echo "   🔗 Criar MR no GitLab e verificar pipeline"

echo ""
echo "6️⃣ Configurar integração (opcional):"
echo "   🔄 Mirror do GitHub para GitLab:"
echo "   - Settings > Repository > Mirroring repositories"
echo "   - Adicionar URL do GitHub como source"
echo "   - Configurar push automático"

echo ""
echo "📊 Benefícios da Migração:"
echo "=========================="
echo ""
echo "• 🚀 CI/CD Catalog: Componentes reutilizáveis"
echo "• 🔒 Segurança avançada: SAST, DAST, Secret Detection"
echo "• 📊 Analytics: DORA metrics, pipeline insights"
echo "• 🤖 Auto DevOps: Deploy automático"
echo "• 📦 Package Registry: NPM, Docker images"
echo "• 🔍 Container Scanning: Vulnerabilidades em containers"
echo "• 📈 Performance: Pipeline mais rápido e eficiente"

echo ""
echo "⚠️  Considerações Importantes:"
echo "=============================="
echo ""
echo "• 🔑 Mantenha as mesmas credenciais OAuth"
echo "• 🌐 Atualize webhooks se houver integrações"
echo "• 📋 Verifique se todas as branches foram migradas"
echo "• 🏷️ As tags serão preservadas na migração"
echo "• 🔐 Secrets e variáveis CI/CD precisarão ser reconfigurados"

echo ""
echo "🎯 Próximos Passos:"
echo "==================="
echo ""
echo "1. Criar projeto no GitLab conforme instruções acima"
echo "2. Executar comandos de migração do código"
echo "3. Configurar CI/CD Catalog"
echo "4. Testar pipeline com Merge Request"
echo "5. Atualizar documentação e README com nova URL"

echo ""
echo "📞 Suporte:"
echo "==========="
echo ""
echo "• 📚 Documentação GitLab: https://docs.gitlab.com/"
echo "• 🔄 Migração: https://docs.gitlab.com/ee/user/project/import/"
echo "• 📞 Suporte: https://gitlab.com/support"

echo ""
echo "✅ Preparado para migração! Execute os passos acima."

# Perguntar se quer prosseguir com configuração automática
echo ""
read -p "🔄 Deseja configurar a migração automaticamente? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo ""
    echo "🔧 Configuração automática iniciada..."

    # Solicitar URL do GitLab
    echo ""
    read -p "📝 Digite a URL do repositório GitLab (https://gitlab.com/SEU_USUARIO/assistente-juridico-p.git): " GITLAB_URL

    if [ -z "$GITLAB_URL" ]; then
        echo "❌ URL não fornecida. Saindo..."
        exit 1
    fi

    # Validar URL
    if [[ ! $GITLAB_URL =~ ^https://gitlab\.com/ ]]; then
        echo "❌ URL inválida. Deve começar com https://gitlab.com/"
        exit 1
    fi

    echo ""
    echo "🔄 Adicionando remote do GitLab..."
    git remote add gitlab "$GITLAB_URL" 2>/dev/null || echo "⚠️  Remote gitlab já existe"

    echo ""
    echo "📤 Enviando código para GitLab..."
    git push gitlab --all
    git push gitlab --tags

    echo ""
    echo "✅ Migração concluída!"
    echo ""
    echo "🎯 Agora acesse o GitLab e configure o CI/CD Catalog conforme instruções acima."
else
    echo ""
    echo "ℹ️  Migração manual selecionada. Siga as instruções acima."
fi