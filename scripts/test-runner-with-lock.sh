#!/bin/bash
###############################################################################
# Test Runner com Lock Global
# Previne execuções simultâneas de testes que podem causar SIGTERM/conflitos
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE="${PROJECT_ROOT}/.test-results/.global-test.lock"
LOCK_PID_FILE="${PROJECT_ROOT}/.test-results/.global-test.pid"

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

cleanup_lock() {
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
        log "Lock removido"
    fi
    if [ -f "$LOCK_PID_FILE" ]; then
        rm -f "$LOCK_PID_FILE"
    fi
}

# Trap para cleanup em caso de erro ou interrupção
trap cleanup_lock EXIT SIGINT SIGTERM

# Criar diretório se não existir
mkdir -p "${PROJECT_ROOT}/.test-results"

# Verificar se já existe um lock
if [ -f "$LOCK_FILE" ]; then
    LOCK_PID=$(cat "$LOCK_PID_FILE" 2>/dev/null || echo "")

    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        error "Testes já estão em execução (PID: $LOCK_PID)"
        warning "Para forçar execução, remova o lock: rm $LOCK_FILE $LOCK_PID_FILE"
        exit 1
    else
        warning "Lock órfão encontrado (processo não existe mais), removendo..."
        cleanup_lock
    fi
fi

# Criar lock
echo $$ > "$LOCK_PID_FILE"
touch "$LOCK_FILE"
log "Lock adquirido (PID: $$)"

# Executar comando passado como argumento
if [ $# -eq 0 ]; then
    error "Uso: $0 <comando de teste>"
    error "Exemplo: $0 npm run test:run"
    exit 1
fi

log "Executando: $*"
echo ""

# Executar comando e capturar exit code
"$@"
EXIT_CODE=$?

# Limpar lock (feito automaticamente pelo trap, mas garantimos aqui também)
cleanup_lock

if [ $EXIT_CODE -eq 0 ]; then
    success "Testes concluídos com sucesso"
else
    error "Testes falharam com código $EXIT_CODE"
fi

exit $EXIT_CODE
