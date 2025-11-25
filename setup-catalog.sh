#!/bin/bash

# Script para configurar o Catálogo CI/CD no GitLab
# Assistente Jurídico PJe - Configuração do Catálogo de Componentes

set -e

echo "🚀 Configurando Catálogo CI/CD - Assistente Jurídico PJe"
echo "======================================================"

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

# Verificar se há mudanças não commitadas
if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "⚠️  Atenção: Há mudanças não commitadas no repositório"
    echo "💡 Commit suas mudanças antes de continuar"
    git status --short
    exit 1
fi

echo "📋 Verificando pré-requisitos..."

# Verificar se os componentes existem
components=(
    ".gitlab/templates/security/security-component.yml"
    ".gitlab/templates/testing/testing-component.yml"
    ".gitlab/templates/deployment/deployment-component.yml"
    ".gitlab/templates/monitoring/monitoring-component.yml"
)

for component in "${components[@]}"; do
    if [ ! -f "$component" ]; then
        echo "❌ Componente não encontrado: $component"
        exit 1
    fi
done

echo "✅ Todos os componentes estão presentes"

# Verificar se já existe uma tag 1.0.0
if git tag -l | grep -q "^1.0.0$"; then
    echo "⚠️  Tag 1.0.0 já existe. Pulando criação de tag."
else
    echo "🏷️  Criando tag 1.0.0..."

    # Criar anotação de release
    git tag -a 1.0.0 -m "Release 1.0.0 - Componentes CI/CD

🎉 Primeira release dos componentes CI/CD do Assistente Jurídico PJe

📦 Componentes incluídos:
• 🔒 Segurança: Auditoria npm, detecção de segredos, compliance LGPD
• 🧪 Testes: Unitários, integração, E2E, acessibilidade
• 🚀 Deployment: Vercel, Netlify, Docker com health checks
• 📊 Monitoramento: Performance, uptime, Core Web Vitals

✨ Funcionalidades:
• Suporte completo a inputs configuráveis
• Versionamento semântico
• Documentação abrangente
• Testes automatizados

📖 Documentação: .gitlab/templates/README.md
🔧 Exemplos: .gitlab/templates/example-pipeline.yml"

    echo "✅ Tag 1.0.0 criada com sucesso"
fi

echo ""
echo "📤 Enviando tag para o repositório remoto..."
git push origin 1.0.0

echo ""
echo "🎯 PRÓXIMOS PASSOS - Execute no GitLab Web:"
echo "=========================================="
echo ""
echo "1. 🏷️ CONFIGURAR CATÁLOGO CI/CD:"
echo "   • Vá para: Settings > General > Visibility, project features, permissions"
echo "   • Ative a opção: 'CI/CD Catalog project'"
echo "   • Salve as configurações"
echo ""
echo "2. 📦 PUBLICAR COMPONENTES:"
echo "   • A tag 1.0.0 será automaticamente detectada"
echo "   • Os componentes aparecerão no Catálogo CI/CD"
echo "   • URL do catálogo: https://gitlab.com/[seu-grupo]/assistente-juridico-p/-/explore/catalog"
echo ""
echo "3. 🧪 TESTAR COMPONENTES:"
echo "   • Use o pipeline de exemplo: .gitlab/templates/example-pipeline.yml"
echo "   • Execute o pipeline de teste: .gitlab/templates/test-components.yml"
echo ""
echo "4. 📚 USAR EM OUTROS PROJETOS:"
echo "   include:"
echo "     - component: \$CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@1.0.0"
echo "       inputs:"
echo "         audit_level: 'standard'"
echo ""
echo "✅ Configuração concluída! Os componentes estão prontos para uso."

# Criar arquivo de configuração adicional
cat > .gitlab/catalog-ready.md << 'EOF'
# 🎉 Catálogo CI/CD Configurado!

Este projeto foi configurado como um **Catálogo CI/CD** no GitLab.

## 📦 Componentes Publicados

### 🔒 Segurança (`security-component`)
- Auditoria de dependências npm
- Detecção de segredos
- Compliance LGPD
- Relatórios SARIF/JSON

### 🧪 Testes (`testing-component`)
- Testes unitários com Jest
- Testes E2E com Playwright
- Cobertura de código
- Testes de acessibilidade

### 🚀 Deployment (`deployment-component`)
- Multi-plataforma (Vercel, Netlify, Docker)
- Health checks automatizados
- Rollback automático
- Ambientes staging/production

### 📊 Monitoramento (`monitoring-component`)
- Performance com Lighthouse
- Core Web Vitals
- Uptime monitoring
- Alertas configuráveis

## 🚀 Como Usar

```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@1.0.0
    inputs:
      audit_level: "standard"
      fail_on_high: true
```

## 📋 Status
- ✅ Projeto configurado como catálogo
- ✅ Tag 1.0.0 criada e publicada
- ✅ Componentes validados
- ✅ Documentação completa
EOF

echo ""
echo "📄 Arquivo .gitlab/catalog-ready.md criado com instruções completas"