#!/bin/bash
# Script de teste local para Azure Storage (simula CI/CD)

set -e

echo "🧪 Azure Storage - Teste Local Completo"
echo "========================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 1. Verificar se Azurite está rodando
log_info "1️⃣ Verificando Azurite..."
if nc -z 127.0.0.1 10000 2>/dev/null; then
    log_info "✅ Azurite está rodando na porta 10000"
else
    log_warn "❌ Azurite NÃO está rodando"
    log_info "Iniciando Azurite com Docker..."

    # Verificar se Docker está disponível
    if ! command -v docker &> /dev/null; then
        log_error "Docker não encontrado! Instale Docker ou inicie Azurite manualmente."
        exit 1
    fi

    # Iniciar Azurite
    docker run -d \
        --name azurite-test \
        -p 10000:10000 \
        -p 10001:10001 \
        -p 10002:10002 \
        mcr.microsoft.com/azure-storage/azurite:latest

    # Aguardar Azurite ficar pronto
    log_info "⏳ Aguardando Azurite iniciar..."
    timeout 30 bash -c 'until curl -f http://localhost:10000/devstoreaccount1?comp=list &>/dev/null; do sleep 1; done'
    log_info "✅ Azurite iniciado com sucesso!"
fi

echo ""

# 2. Verificar dependências
log_info "2️⃣ Verificando dependências Node.js..."
if [ ! -d "node_modules/@azure/storage-blob" ]; then
    log_warn "@azure/storage-blob não encontrado"
    log_info "Instalando dependências..."
    npm install @azure/storage-blob formidable @types/formidable
else
    log_info "✅ Dependências instaladas"
fi

echo ""

# 3. Exportar variáveis de ambiente
log_info "3️⃣ Configurando variáveis de ambiente..."
export AZURE_STORAGE_CONNECTION_STRING="AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
export VITE_AZURE_STORAGE_CONNECTION_STRING="AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEhRtFSBP;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
export AZURE_STORAGE_CONTAINER_NAME="process-documents"
export VITE_USE_AZURITE="true"
log_info "✅ Variáveis configuradas"

echo ""

# 4. Rodar testes unitários
log_info "4️⃣ Executando testes unitários..."
if npm run test:run tests/azure-storage-service.test.ts 2>&1 | tee test-unit.log; then
    log_info "✅ Testes unitários passaram!"
else
    log_error "❌ Testes unitários falharam!"
    log_error "Veja detalhes em: test-unit.log"
    exit 1
fi

echo ""

# 5. Iniciar servidor dev em background
log_info "5️⃣ Iniciando servidor dev..."
npm run dev > dev-server.log 2>&1 &
DEV_SERVER_PID=$!

# Aguardar servidor iniciar
log_info "⏳ Aguardando servidor dev iniciar..."
timeout 30 bash -c 'until curl -f http://localhost:5173 &>/dev/null; do sleep 1; done' || {
    log_error "Servidor dev não iniciou no tempo esperado"
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
}
log_info "✅ Servidor dev rodando (PID: $DEV_SERVER_PID)"

echo ""

# 6. Rodar testes de integração
log_info "6️⃣ Executando testes de integração (API)..."
if npm run test:run tests/api/azure-upload.test.ts 2>&1 | tee test-integration.log; then
    log_info "✅ Testes de integração passaram!"
else
    log_error "❌ Testes de integração falharam!"
    log_error "Veja detalhes em: test-integration.log"
    # Cleanup
    kill $DEV_SERVER_PID 2>/dev/null || true
    exit 1
fi

echo ""

# 7. Cleanup
log_info "7️⃣ Limpando ambiente de teste..."
kill $DEV_SERVER_PID 2>/dev/null || true
log_info "✅ Servidor dev parado"

# Verificar se devemos parar Azurite
read -p "Parar container Azurite? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker stop azurite-test 2>/dev/null || true
    docker rm azurite-test 2>/dev/null || true
    log_info "✅ Azurite parado e removido"
else
    log_info "ℹ️  Azurite continua rodando (docker ps)"
fi

echo ""
log_info "=========================================="
log_info "✅ TODOS OS TESTES PASSARAM!"
log_info "=========================================="
echo ""
log_info "📊 Resultados:"
log_info "  - Testes unitários: test-unit.log"
log_info "  - Testes integração: test-integration.log"
log_info "  - Logs dev server: dev-server.log"
echo ""
