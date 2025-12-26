#!/bin/bash

# Script para criar labels necessárias para o Dependabot
# Uso: ./scripts/create-github-labels.sh [GITHUB_TOKEN] [REPO_OWNER] [REPO_NAME]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função de log
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Obter parâmetros
GITHUB_TOKEN="${1:-$GITHUB_TOKEN}"
REPO_OWNER="${2:-portprojetoautomacao-debug}"
REPO_NAME="${3:-thiagobodevanadv-alt-assistente-jur-dico-principal}"

# Validar token
if [ -z "$GITHUB_TOKEN" ]; then
  log_error "GITHUB_TOKEN não fornecido. Use: ./scripts/create-github-labels.sh <token> [owner] [repo]"
  exit 1
fi

API_URL="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/labels"

# Labels a serem criadas
declare -A LABELS=(
  ["automated"]="7057ff|Criado/atualizado automaticamente"
  ["automerge"]="0e8a16|Pode ser merged automaticamente"
  ["npm"]="cb2431|Atualizações de pacotes npm"
  ["dependencies"]="0366d6|Atualizações de dependências"
  ["docker"]="1d76db|Relacionado ao Docker"
  ["devcontainer"]="5319e7|Relacionado ao dev container"
  ["github-actions"]="000000|Atualizações de GitHub Actions"
  ["ci/cd"]="fbca04|CI/CD e automação"
  ["python"]="3572a5|Relacionado ao Python"
  ["backend"]="d73a4a|Código do backend"
)

log_info "Criando labels no repositório ${REPO_OWNER}/${REPO_NAME}..."
echo ""

# Criar cada label
for label_name in "${!LABELS[@]}"; do
  IFS='|' read -r color description <<< "${LABELS[$label_name]}"

  # Verificar se a label já existe
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "${API_URL}/${label_name}")

  if [ "$response" == "200" ]; then
    log_warn "Label '${label_name}' já existe. Atualizando..."

    # Atualizar label existente
    curl -s -X PATCH \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "${API_URL}/${label_name}" \
      -d "{\"color\":\"${color}\",\"description\":\"${description}\"}" > /dev/null

    log_info "✓ Label '${label_name}' atualizada"
  else
    # Criar nova label
    result=$(curl -s -X POST \
      -H "Authorization: token ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      "${API_URL}" \
      -d "{\"name\":\"${label_name}\",\"color\":\"${color}\",\"description\":\"${description}\"}")

    if echo "$result" | grep -q '"name"'; then
      log_info "✓ Label '${label_name}' criada com sucesso"
    else
      log_error "✗ Falha ao criar label '${label_name}'"
      echo "$result"
    fi
  fi
done

echo ""
log_info "Processo concluído!"
log_info "Verifique as labels em: https://github.com/${REPO_OWNER}/${REPO_NAME}/labels"
