#!/bin/bash
# Script para aplicar patches em node_modules após npm install
# Corrige erros de JSDoc em bibliotecas externas

set -e

BODY_PARSER_FILE="node_modules/body-parser/index.js"

if [ -f "$BODY_PARSER_FILE" ]; then
    echo "🔧 Aplicando patch em body-parser..."

    # Corrigir JSDoc do bodyParser() removendo @param que não existe
    sed -i 's/@param {object} \[options\]//' "$BODY_PARSER_FILE"

    echo "✅ Patch aplicado com sucesso em body-parser"
else
    echo "⚠️  body-parser não encontrado - execute npm install primeiro"
fi
