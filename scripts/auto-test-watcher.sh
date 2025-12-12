#!/bin/bash
###############################################################################
# Auto Test Watcher - Executador automático de testes com notificações Copilot
# Monitora mudanças no código e executa testes automaticamente
###############################################################################

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
WATCH_MODE=${WATCH_MODE:-"smart"}  # smart, unit, api, all
DEBOUNCE_TIME=${DEBOUNCE_TIME:-3}  # segundos
AUTO_REPORT=${AUTO_REPORT:-"true"}

# Diretórios
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RESULTS_DIR="${PROJECT_ROOT}/.test-results"
COPILOT_DIR="${PROJECT_ROOT}/.copilot-notifications"

# Criar diretórios
mkdir -p "$RESULTS_DIR" "$COPILOT_DIR"

###############################################################################
# Funções
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}     🤖 AUTO TEST WATCHER - Monitoramento Automático          ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

check_dependencies() {
    log "Verificando dependências..."

    if ! command -v npm &> /dev/null; then
        error "npm não encontrado"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado"
        exit 1
    fi

    success "Dependências OK"
}

run_tests_smart() {
    log "Executando testes inteligentes..."

    # Detectar quais arquivos mudaram (funciona mesmo em repositório novo/sem commits)
    CHANGED_FILES=$(git status --porcelain | awk '{print $2}')

    if echo "$CHANGED_FILES" | grep -q "^api/"; then
        log "Mudanças em API detectadas - executando testes de API"
        npm run test:api:safe 2>&1 | tee "$RESULTS_DIR/latest-api-run.log"
    elif echo "$CHANGED_FILES" | grep -q "^src/"; then
        log "Mudanças em frontend detectadas - executando testes unitários"
        npm run test:run:safe 2>&1 | tee "$RESULTS_DIR/latest-unit-run.log"
    elif echo "$CHANGED_FILES" | grep -q "^chrome-extension-pje/"; then
        log "Mudanças em extensão Chrome detectadas - executando testes da extensão"
        npm run test:chrome 2>&1 | tee "$RESULTS_DIR/latest-chrome-run.log"
    else
        log "Executando todos os testes..."
        npm run test:run:safe 2>&1 | tee "$RESULTS_DIR/latest-all-run.log"
    fi
}

run_tests_unit() {
    log "Executando testes unitários..."
    npm run test:run:safe 2>&1 | tee "$RESULTS_DIR/latest-unit-run.log"
}

run_tests_api() {
    log "Executando testes de API..."
    npm run test:api:safe 2>&1 | tee "$RESULTS_DIR/latest-api-run.log"
}

run_tests_all() {
    log "Executando todos os testes..."
    npm run test:all:safe 2>&1 | tee "$RESULTS_DIR/latest-all-run.log"
}

send_to_copilot() {
    local status=$1
    local message=$2

    log "Enviando resultados para Copilot..."

    cat > "$COPILOT_DIR/test-notification.json" <<EOF
{
  "type": "test-watcher",
  "timestamp": "$(date -Iseconds)",
  "status": "$status",
  "message": "$message",
  "mode": "$WATCH_MODE",
  "logs": {
    "latest": ".test-results/latest-test-results.json",
    "summary": ".test-results/latest-test-summary.txt"
  },
  "action_required": $([ "$status" = "failed" ] && echo "true" || echo "false")
}
EOF

    if [ "$status" = "failed" ]; then
        error "$message"
        echo -e "\n💬 ${YELLOW}Peça ajuda ao Copilot:${NC}"
        echo "   @workspace analisar falhas nos testes"
    else
        success "$message"
    fi
}

watch_and_run() {
    print_header

    log "Modo: $WATCH_MODE"
    log "Debounce: ${DEBOUNCE_TIME}s"
    log "Auto-report: $AUTO_REPORT"
    echo ""

    check_dependencies

    log "Iniciando monitoramento de testes..."
    log "Pressione Ctrl+C para parar"
    echo ""

    # Executar testes inicialmente
    case "$WATCH_MODE" in
        smart)
            run_tests_smart
            ;;
        unit)
            run_tests_unit
            ;;
        api)
            run_tests_api
            ;;
        all)
            run_tests_all
            ;;
        *)
            error "Modo desconhecido: $WATCH_MODE"
            exit 1
            ;;
    esac

    # Verificar resultado inicial
    if [ $? -eq 0 ]; then
        send_to_copilot "passed" "✅ Testes iniciais passaram"
    else
        send_to_copilot "failed" "❌ Testes iniciais falharam"
    fi

    # Watch mode contínuo
    if [ "$WATCH_MODE" = "unit" ]; then
        log "Iniciando watch mode contínuo..."
        npm test 2>&1 | while IFS= read -r line; do
            echo "$line"
            # Enviar para Copilot quando testes terminarem
            if echo "$line" | grep -q "Test Files.*passed"; then
                send_to_copilot "passed" "✅ Testes passaram em watch mode"
            elif echo "$line" | grep -q "Test Files.*failed"; then
                send_to_copilot "failed" "❌ Testes falharam em watch mode"
            fi
        done
    else
        # Watch manual com inotify (se disponível) ou polling
        if command -v inotifywait &> /dev/null; then
            log "Usando inotifywait para monitoramento em tempo real"

            inotifywait -m -r -e modify,create,delete \
                --exclude '(node_modules|\.git|dist|coverage|\.next)' \
                "$PROJECT_ROOT" | while read -r directory event filename; do

                if [[ "$filename" =~ \.(ts|tsx|js|jsx)$ ]]; then
                    log "Mudança detectada: $directory$filename"
                    sleep "$DEBOUNCE_TIME"

                    case "$WATCH_MODE" in
                        smart) run_tests_smart ;;
                        api) run_tests_api ;;
                        all) run_tests_all ;;
                    esac

                    if [ $? -eq 0 ]; then
                        send_to_copilot "passed" "✅ Testes passaram após mudança"
                    else
                        send_to_copilot "failed" "❌ Testes falharam após mudança"
                    fi
                fi
            done
        else
            warning "inotifywait não disponível - usando polling a cada 30s"

            while true; do
                sleep 30

                case "$WATCH_MODE" in
                    smart) run_tests_smart ;;
                    unit) run_tests_unit ;;
                    api) run_tests_api ;;
                    all) run_tests_all ;;
                esac

                if [ $? -eq 0 ]; then
                    send_to_copilot "passed" "✅ Testes passaram (polling)"
                else
                    send_to_copilot "failed" "❌ Testes falharam (polling)"
                fi
            done
        fi
    fi
}

show_help() {
    cat << EOF
🤖 Auto Test Watcher - Executador automático de testes

USO:
    $0 [OPTIONS]

OPÇÕES:
    --mode <mode>       Modo de execução: smart, unit, api, all (padrão: smart)
    --debounce <secs>   Tempo de debounce em segundos (padrão: 3)
    --no-report         Desabilitar relatórios automáticos
    --help              Mostrar esta ajuda

MODOS:
    smart     Detecta mudanças e executa testes relevantes
    unit      Executa apenas testes unitários (watch mode contínuo)
    api       Executa apenas testes de API
    all       Executa todos os testes

EXEMPLOS:
    $0                                    # Modo smart (padrão)
    $0 --mode unit                        # Watch contínuo de testes unitários
    $0 --mode api --debounce 5            # API tests com debounce de 5s
    $0 --mode all --no-report             # Todos os testes sem relatório

VARIÁVEIS DE AMBIENTE:
    WATCH_MODE          Modo de execução (smart, unit, api, all)
    DEBOUNCE_TIME       Tempo de debounce em segundos
    AUTO_REPORT         Ativar/desativar relatórios (true/false)

SAÍDA:
    .test-results/                Logs e resultados dos testes
    .copilot-notifications/       Notificações para Copilot

EOF
}

###############################################################################
# Main
###############################################################################

# Parse argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            WATCH_MODE="$2"
            shift 2
            ;;
        --debounce)
            DEBOUNCE_TIME="$2"
            shift 2
            ;;
        --no-report)
            AUTO_REPORT="false"
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            error "Opção desconhecida: $1"
            show_help
            exit 1
            ;;
    esac
done

# Trap para cleanup
cleanup() {
    echo ""
    log "Parando monitoramento de testes..."
    exit 0
}

trap cleanup SIGINT SIGTERM

# Executar
watch_and_run
