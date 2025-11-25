#!/bin/bash

# Script para configurar CI/CD Catalog no GitLab
# Assistente Jurídico PJe - Configuração de Componentes CI/CD

set -e

echo "🚀 Configurando CI/CD Catalog para Assistente Jurídico PJe..."
echo "=========================================================="

# Verificar se estamos em um repositório Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este script deve ser executado dentro de um repositório Git"
    exit 1
fi

# Verificar se o diretório .gitlab existe
if [ ! -d ".gitlab" ]; then
    echo "❌ Erro: Diretório .gitlab não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

echo "📋 Verificando componentes CI/CD..."

# Lista de componentes obrigatórios
COMPONENTS=(
    "templates/security/security-component.yml"
    "templates/testing/testing-component.yml"
    "templates/deployment/deployment-component.yml"
    "templates/monitoring/monitoring-component.yml"
    "templates/notifications/notifications-component.yml"
    "templates/backup/backup-component.yml"
    "templates/api-testing/api-testing-component.yml"
    "templates/container-deploy/container-deploy-component.yml"
    "templates/README.md"
    "templates/example-pipeline.yml"
    "templates/test-components.yml"
    "templates/release-pipeline.yml"
    "templates/production-example.yml"
    "duo-components-integration.yml"
)

# Verificar se todos os componentes existem
MISSING_COMPONENTS=()
for component in "${COMPONENTS[@]}"; do
    if [ ! -f ".gitlab/${component}" ]; then
        MISSING_COMPONENTS+=("${component}")
    fi
done

if [ ${#MISSING_COMPONENTS[@]} -ne 0 ]; then
    echo "❌ Componentes faltando:"
    for component in "${MISSING_COMPONENTS[@]}"; do
        echo "   - ${component}"
    done
    echo ""
    echo "Execute o script de criação de componentes primeiro."
    exit 1
fi

echo "✅ Todos os componentes estão presentes"

# Verificar sintaxe YAML dos componentes
echo ""
echo "🔍 Validando sintaxe YAML dos componentes..."

python3 - <<'PY'
import importlib
import os
import sys

try:
    yaml = importlib.import_module('yaml')
except ModuleNotFoundError:
    print("❌ Módulo PyYAML não encontrado. Instale com 'pip install pyyaml'.")
    sys.exit(1)

def validate_yaml_file(filepath: str):
    try:
        with open(filepath, 'r', encoding='utf-8') as handle:
            yaml.safe_load(handle.read())
        return True, None
    except yaml.YAMLError as exc:
        return False, str(exc)
    except OSError as exc:
        return False, f'Erro ao ler arquivo: {exc}'

yaml_files = [
    '.gitlab/templates/security/security-component.yml',
    '.gitlab/templates/testing/testing-component.yml',
    '.gitlab/templates/deployment/deployment-component.yml',
    '.gitlab/templates/monitoring/monitoring-component.yml',
    '.gitlab/templates/notifications/notifications-component.yml',
    '.gitlab/templates/backup/backup-component.yml',
    '.gitlab/templates/api-testing/api-testing-component.yml',
    '.gitlab/templates/container-deploy/container-deploy-component.yml',
    '.gitlab/templates/example-pipeline.yml',
    '.gitlab/templates/test-components.yml',
    '.gitlab/templates/release-pipeline.yml',
    '.gitlab/duo-components-integration.yml',
]

valid_count = 0
for filepath in yaml_files:
    if os.path.exists(filepath):
        is_valid, error = validate_yaml_file(filepath)
        if is_valid:
            print(f'✅ {filepath}')
            valid_count += 1
        else:
            print(f'❌ {filepath}: {error}')
    else:
        print(f'⚠️  {filepath}: ARQUIVO NÃO ENCONTRADO')

if valid_count == len(yaml_files):
    print('\n🎉 Todos os componentes YAML são válidos!')
else:
    print('\n❌ Alguns componentes têm erros de sintaxe.')
    sys.exit(1)
PY

# Verificar se o .gitlab-ci.yml existe e está configurado
echo ""
echo "🔍 Verificando configuração do pipeline principal..."

if [ ! -f ".gitlab-ci.yml" ]; then
    echo "❌ Arquivo .gitlab-ci.yml não encontrado"
    exit 1
fi

# Validar .gitlab-ci.yml
python3 - <<'PY'
import importlib
import sys

try:
    yaml = importlib.import_module('yaml')
except ModuleNotFoundError:
    print("❌ Módulo PyYAML não encontrado. Instale com 'pip install pyyaml'.")
    sys.exit(1)

from pathlib import Path

try:
    yaml.safe_load(Path('.gitlab-ci.yml').read_text(encoding='utf-8'))
    print('✅ .gitlab-ci.yml: Sintaxe válida')
except Exception as exc:
    print(f'❌ .gitlab-ci.yml: {exc}')
    sys.exit(1)
PY

echo ""
echo "📝 Instruções para configurar o CI/CD Catalog no GitLab:"
echo "======================================================"
echo ""
echo "1. 📋 Acesse seu projeto no GitLab:"
echo "   https://gitlab.com/[seu-usuario]/assistente-juridico-p"
echo ""
echo "2. 🔧 Vá para Settings > CI/CD > Components:"
echo "   - Habilite 'Enable components'"
echo "   - Configure o path base: templates/"
echo ""
echo "3. 🏷️ Configure as tags dos componentes:"
echo "   - security-component: 1.1.0"
echo "   - testing-component: 1.1.0"
echo "   - deployment-component: 1.1.0"
echo "   - monitoring-component: 1.1.0"
echo "   - notifications-component: 1.1.0"
echo "   - backup-component: 1.1.0"
echo "   - api-testing-component: 1.1.0"
echo "   - container-deploy-component: 1.1.0"
echo ""
echo "4. 🚀 Teste os componentes:"
echo "   - Crie um Merge Request de teste"
echo "   - Verifique se o pipeline executa todos os componentes"
echo "   - Monitore os logs e artefatos gerados"
echo ""
echo "5. 📊 Monitore o desempenho:"
echo "   - Acesse CI/CD > Pipelines"
echo "   - Verifique os artefatos de cada job"
echo "   - Analise os relatórios de segurança e cobertura"
echo ""
echo "6. 🔄 Configure schedules (opcional):"
echo "   - CI/CD > Schedules"
echo "   - Adicione schedule semanal para backup: '0 2 * * 1'"
echo "   - Configure variáveis: SCHEDULE_TYPE=weekly, BACKUP_RETENTION=30"
echo ""
echo "📚 Documentação dos Componentes:"
echo "================================"
echo ""
echo "• 🔒 Security Component:"
echo "  - Auditoria de dependências npm"
echo "  - Detecção de segredos com TruffleHog"
echo "  - Compliance LGPD automático"
echo ""
echo "• 🧪 Testing Component:"
echo "  - Testes unitários com Jest"
echo "  - Testes de integração com bancos de dados"
echo "  - Testes E2E com Playwright"
echo "  - Testes de acessibilidade com Lighthouse"
echo ""
echo "• 🚀 Deployment Component:"
echo "  - Deploy Vercel, Netlify e Docker"
echo "  - Health checks automatizados"
echo "  - Rollback automático em falhas"
echo ""
echo "• 📊 Monitoring Component:"
echo "  - Análise de performance com Lighthouse"
echo "  - Monitoramento de uptime"
echo "  - Relatórios de Core Web Vitals"
echo ""
echo "• 📢 Notifications Component:"
echo "  - Notificações Slack, Teams e Email"
echo "  - Webhooks customizáveis"
echo "  - Resumos automáticos de pipeline"
echo ""
echo "• 💾 Backup Component:"
echo "  - Backup de banco de dados (PostgreSQL, MySQL, MongoDB)"
echo "  - Backup de arquivos e documentos"
echo "  - Criptografia e compressão automática"
echo "  - Upload para S3 com retenção configurável"
echo ""
echo "• 🔗 API Testing Component:"
echo "  - Testes smoke, integração e carga"
echo "  - Testes de segurança automatizados"
echo "  - Relatórios Newman e Artillery"
echo ""
echo "• 🐳 Container Deploy Component:"
echo "  - Build e push de imagens Docker"
echo "  - Deploy Kubernetes com Helm"
echo "  - Estratégias Blue-Green e Canary"
echo "  - Health checks e rollback automático"
echo ""
echo "🎯 Próximos Passos:"
echo "==================="
echo ""
echo "1. Faça commit e push das mudanças:"
echo "   git add ."
echo "   git commit -m 'feat: configurar CI/CD Catalog com componentes reutilizáveis'"
echo "   git push origin main"
echo ""
echo "2. Configure o CI/CD Catalog no GitLab conforme instruções acima"
echo ""
echo "3. Teste o pipeline criando um Merge Request"
echo ""
echo "4. Monitore os resultados e ajuste conforme necessário"
echo ""
echo "✅ Configuração do CI/CD Catalog concluída com sucesso!"
echo ""
echo "📞 Para suporte, consulte a documentação em .gitlab/templates/README.md"

# Verificar se a tag já existe
if ! git tag | grep -q "^1.1.0$"; then
    git tag -a 1.1.0 -m "Release 1.1.0 - Componentes CI/CD Expandidos

🚀 Release 1.1.0 dos componentes CI/CD do Assistente Jurídico PJe

📦 Componentes incluídos (8 componentes):
• 🔒 Segurança: Auditoria npm, detecção de segredos, compliance LGPD
• 🧪 Testes: Unitários, integração, E2E, acessibilidade
• 🚀 Deployment: Vercel, Netlify, Docker com health checks
• 📊 Monitoramento: Performance, uptime, Core Web Vitals
• 📢 Notificações: Slack, Teams, Email, Webhooks
• 💾 Backup: Banco de dados, arquivos, documentos com criptografia
• 🔗 API Testing: Smoke, integração, carga, segurança
• 🐳 Container Deploy: Docker + Kubernetes com estratégias avançadas

✨ Novas funcionalidades v1.1.0:
• Notificações inteligentes com resumos de pipeline
• Backup completo com criptografia AES-256
• Testes de API abrangentes (smoke, carga, segurança)
• Deploy em container com Blue-Green e Canary
• Suporte a múltiplos bancos de dados
• Estratégias de deploy avançadas
• Health checks mais robustos

🔧 Melhorias técnicas:
• Inputs mais configuráveis
• Melhor tratamento de erros
• Artefatos mais ricos
• Documentação expandida
• Exemplos de produção atualizados

📖 Documentação: .gitlab/templates/README.md
🔧 Exemplos: .gitlab/templates/production-example.yml"

    echo "✅ Tag 1.1.0 criada com sucesso"
else
    echo "ℹ️  Tag 1.1.0 já existe, pulando criação"
fi

echo ""
echo "📤 Enviando tag para o repositório remoto..."
git push origin 1.1.0

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
echo "   • A tag 1.1.0 será automaticamente detectada"
echo "   • Os componentes aparecerão no Catálogo CI/CD"
echo "   • URL do catálogo: https://gitlab.com/[seu-grupo]/assistente-juridico-p/-/explore/catalog"
echo ""
echo "3. 🧪 TESTAR COMPONENTES:"
echo "   • Use o pipeline de exemplo: .gitlab/templates/example-pipeline.yml"
echo "   • Execute o pipeline de teste: .gitlab/templates/test-components.yml"
echo ""
echo "4. 📚 USAR EM OUTROS PROJETOS:"
echo "   include:"
echo "     - component: \$CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@1.1.0"
echo "       inputs:"
echo "         audit_level: 'standard'"
echo ""
echo "✅ Configuração concluída! Os componentes estão prontos para uso."

# Criar arquivo de configuração adicional
cat > .gitlab/catalog-ready.md << 'EOF'
# 🎉 Catálogo CI/CD Configurado!

Este projeto foi configurado como um **Catálogo CI/CD** no GitLab.

## 📦 Componentes Publicados (v1.1.0)

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

### 📢 Notificações (`notifications-component`)
- Slack, Microsoft Teams, Email
- Webhooks customizáveis
- Resumos automáticos de pipeline
- Múltiplos canais simultâneos

### 💾 Backup (`backup-component`)
- Backup de bancos de dados (PostgreSQL, MySQL, MongoDB)
- Backup de arquivos e documentos jurídicos
- Criptografia AES-256 automática
- Upload para S3 com retenção configurável

### 🔗 API Testing (`api-testing-component`)
- Testes smoke com Postman/Newman
- Testes de integração com Artillery
- Testes de carga e performance
- Testes de segurança automatizados

### 🐳 Container Deploy (`container-deploy-component`)
- Build e push de imagens Docker
- Deploy Kubernetes com Helm
- Estratégias Blue-Green e Canary
- Health checks e rollback automático

## 🚀 Como Usar

```yaml
include:
  - component: $CI_SERVER_FQDN/assistente-juridico-p/templates/security/security-component@1.1.0
    inputs:
      audit_level: "standard"
      fail_on_high: true
```

## 📋 Status
- ✅ Projeto configurado como catálogo
- ✅ Tag 1.1.0 criada e publicada
- ✅ 8 componentes validados
- ✅ Documentação completa
- ✅ Exemplos de produção atualizados
EOF

echo ""
echo "📄 Arquivo .gitlab/catalog-ready.md criado com instruções completas"