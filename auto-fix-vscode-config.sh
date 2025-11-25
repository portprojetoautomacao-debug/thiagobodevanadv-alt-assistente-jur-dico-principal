#!/bin/bash

# Script para corrigir automaticamente a configuração inválida do VS Code
# Assistente Jurídico PJe

echo "🔧 Correção Automática da Configuração VS Code"
echo "=============================================="

SETTINGS_FILE="$HOME/.vscode-remote/data/Machine/settings.json"

echo ""
echo "📁 Arquivo de configurações identificado:"
echo "   $SETTINGS_FILE"
echo ""

# Verificar se o arquivo existe
if [ ! -f "$SETTINGS_FILE" ]; then
    echo "❌ Arquivo de configurações não encontrado!"
    echo "   Criando arquivo com configurações padrão..."
    mkdir -p "$(dirname "$SETTINGS_FILE")"
    echo "{}" > "$SETTINGS_FILE"
fi

echo "🔍 Verificando configuração problemática..."

# Fazer backup do arquivo original
BACKUP_FILE="${SETTINGS_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
cp "$SETTINGS_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# Verificar se contém a configuração problemática
if grep -q '"\*\.copilotmd": "vscode\.markdown\.preview\.editor"' "$SETTINGS_FILE"; then
    echo "❌ Configuração problemática encontrada!"
    echo "🔧 Corrigindo configuração..."

    # Usar sed para substituir a configuração problemática
    sed -i 's/"\*\.copilotmd": "vscode\.markdown\.preview\.editor"/"*.copilotmd": "default"/g' "$SETTINGS_FILE"

    echo "✅ Configuração corrigida com sucesso!"
else
    echo "ℹ️ Configuração problemática não encontrada no arquivo."
    echo "   Verificando se há outras configurações *.copilotmd..."

    if grep -q '"\*\.copilotmd"' "$SETTINGS_FILE"; then
        echo "ℹ️ Outra configuração *.copilotmd encontrada. Verificando validade..."
        # Aqui poderia adicionar mais validações se necessário
    else
        echo "ℹ️ Nenhuma configuração *.copilotmd encontrada."
        echo "   Adicionando configuração padrão..."
        # Adicionar configuração padrão se não existir
        sed -i 's/^{$/{\n  "*.copilotmd": "default",/g' "$SETTINGS_FILE"
    fi
fi

echo ""
echo "📋 Conteúdo atual do arquivo de configurações:"
echo "=============================================="
cat "$SETTINGS_FILE"

echo ""
echo "🎯 VALIDAÇÃO FINAL:"
echo "==================="

# Verificar se a correção foi aplicada
if grep -q '"\*\.copilotmd": "default"' "$SETTINGS_FILE"; then
    echo "✅ Configuração corrigida com sucesso!"
    echo "   *.copilotmd agora usa 'default' (valor válido)"
elif grep -q '"\*\.copilotmd": "vscode\.markdown\.preview\.editor"' "$SETTINGS_FILE"; then
    echo "❌ Configuração ainda problemática!"
    echo "   Tente executar o script novamente ou corrija manualmente"
else
    echo "ℹ️ Configuração *.copilotmd não encontrada ou já corrigida"
fi

echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "==================="
echo "1. Reinicie o VS Code completamente"
echo "2. O erro deve desaparecer"
echo "3. Teste criando/abrir um arquivo .copilotmd (se necessário)"
echo ""

echo "💾 Backup salvo em: $BACKUP_FILE"
echo "   Use este arquivo se precisar reverter as mudanças"
echo ""

echo "🎉 Correção concluída!"