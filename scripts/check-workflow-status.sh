#!/bin/bash
# Script para verificar status do workflow de análise de qualidade
# Autor: Sistema de Manutenção
# Data: 27/12/2025

set -e

echo "🔍 Verificando Status do Workflow de Análise de Qualidade"
echo "=========================================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) não está instalado${NC}"
    echo ""
    echo "Para instalar: https://cli.github.com/"
    exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Não autenticado no GitHub CLI${NC}"
    echo ""
    echo "Para autenticar: gh auth login"
    exit 1
fi

echo -e "${BLUE}📊 Últimos Workflows de Análise de Qualidade${NC}"
echo "------------------------------------------------------------"

# Listar últimas 5 execuções do workflow
gh run list --workflow=code-quality-analysis.yml --limit 5 --json databaseId,displayTitle,conclusion,status,createdAt,headBranch --template '
{{- range . -}}
  {{- if eq .conclusion "success" -}}✅{{- else if eq .conclusion "failure" -}}❌{{- else if eq .conclusion "cancelled" -}}⏭️{{- else -}}⏳{{- end }}
  {{- .displayTitle }} ({{.headBranch}})
  {{- if .conclusion }} - {{.conclusion}}{{- else }} - {{.status}}{{- end }}
  {{- printf " - %s\n" .createdAt -}}
{{- end -}}
' || echo -e "${YELLOW}⚠️  Nenhuma execução encontrada ou erro ao buscar${NC}"

echo ""
echo -e "${BLUE}🔍 Status do Último Workflow${NC}"
echo "------------------------------------------------------------"

# Detalhes do último workflow
LAST_RUN=$(gh run list --workflow=code-quality-analysis.yml --limit 1 --json databaseId --jq '.[0].databaseId')

if [[ -n "$LAST_RUN" ]]; then
    echo -e "${GREEN}ID da Execução:${NC} $LAST_RUN"
    echo ""

    # Ver jobs do workflow
    gh run view "$LAST_RUN" --json jobs --jq '.jobs[] | "  \(.name): \(.conclusion // .status)"'

    echo ""
    echo -e "${BLUE}📝 Para ver logs completos:${NC}"
    echo "  gh run view $LAST_RUN --log"
    echo ""
    echo -e "${BLUE}🌐 Ver no GitHub:${NC}"
    gh run view "$LAST_RUN" --web 2>/dev/null || echo "  https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/runs/$LAST_RUN"
else
    echo -e "${YELLOW}⚠️  Nenhuma execução encontrada${NC}"
fi

echo ""
echo "=========================================================="
echo -e "${GREEN}✅ Verificação concluída${NC}"
