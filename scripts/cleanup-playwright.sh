#!/bin/bash
# Script de limpeza de processos Playwright/Chrome órfãos
# Uso: ./scripts/cleanup-playwright.sh

set -e

echo "🧹 Limpando processos Playwright/Chrome..."

# Matar processos órfãos (ignorar erros se não houver processos)
pkill -9 -f "chrome|chromium|playwright" 2>/dev/null || true

# Aguardar processos finalizarem
sleep 1

# Verificar se ainda há processos
REMAINING=$(ps aux | grep -E "chrome|chromium|playwright" | grep -v grep | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ Todos os processos foram finalizados"
else
    echo "⚠️  Ainda há $REMAINING processos em execução"
    ps aux | grep -E "chrome|chromium|playwright" | grep -v grep
fi

echo ""
echo "🗑️  Removendo diretórios de teste..."

# Remover diretórios de teste (se existirem)
rm -rf test-results playwright-report .playwright 2>/dev/null || true

echo "✅ Limpeza concluída!"
echo ""
echo "💡 Dica: Execute 'npx playwright install chromium' se os testes falharem"
