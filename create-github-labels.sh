#!/bin/bash
# Script para criar labels padrão no GitHub

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🏷️  Criando labels padrão no GitHub...${NC}\n"

# Verificar se gh está instalado
if ! command -v gh &> /dev/null; then
  echo -e "${YELLOW}❌ GitHub CLI (gh) não está instalado${NC}"
  echo -e "${YELLOW}📦 Instale com: sudo apt install gh${NC}"
  exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
  echo -e "${YELLOW}❌ GitHub CLI não está autenticado${NC}"
  echo -e "${YELLOW}🔑 Execute: gh auth login${NC}"
  exit 1
fi

# Array de labels (nome, cor, descrição)
declare -a labels=(
  "auto-created|0e8a16|Issues criadas automaticamente pelo sistema"
  "needs-triage|fbca04|Precisa de análise e priorização"
  "priority:high|d73a4a|Prioridade alta - resolver urgente"
  "urgente|d73a4a|Urgente - ação imediata necessária"
  "juridico|0e8a16|Relacionado a questões jurídicas ou compliance"
  "security|d73a4a|Vulnerabilidade ou questão de segurança"
  "performance|fbca04|Problema de performance ou otimização"
  "accessibility|0075ca|Questão de acessibilidade (a11y)"
  "testing|0e8a16|Relacionado a testes"
  "documentation|0075ca|Melhorias ou correções na documentação"
  "refactor|fbca04|Refatoração de código"
  "breaking-change|d73a4a|Mudança que quebra compatibilidade"
  "enhancement|a2eeef|Nova feature ou melhoria"
  "question|d876e3|Dúvida ou pergunta"
  "lgpd|0e8a16|Relacionado a LGPD e proteção de dados"
  "compliance|0e8a16|Conformidade regulatória"
  "debt|fbca04|Débito técnico"
  "cleanup|fbca04|Limpeza de código ou refatoração menor"
  "automated|0e8a16|PRs e issues automatizados"
  "dependencies|0366d6|Atualizações de dependências"
  "docker|0db7ed|Relacionado a Docker e containers"
  "npm|cb3837|Dependências npm"
  "devcontainer|2088ff|Configuração de Dev Container"
  "github-actions|2088ff|GitHub Actions workflows"
  "ci/cd|2088ff|Integração e deployment contínuo"
  "python|3776ab|Código Python"
  "backend|fbca04|Backend e APIs"
)

CREATED=0
SKIPPED=0

# Criar cada label
for label in "${labels[@]}"; do
  IFS='|' read -r name color description <<< "$label"
  
  # Verificar se label já existe
  if gh label list --limit 1000 | grep -q "^$name"; then
    echo -e "${YELLOW}⏭️  Label '$name' já existe${NC}"
    ((SKIPPED++))
  else
    # Criar label
    if gh label create "$name" --color "$color" --description "$description" 2>/dev/null; then
      echo -e "${GREEN}✅ Criada: $name${NC}"
      ((CREATED++))
    else
      echo -e "${YELLOW}⚠️  Erro ao criar: $name${NC}"
    fi
  fi
done

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Labels criadas: $CREATED${NC}"
echo -e "${YELLOW}⏭️  Labels existentes: $SKIPPED${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${GREEN}🎉 Configuração de labels concluída!${NC}"
echo -e "${BLUE}🔗 Ver todas: gh label list${NC}\n"
