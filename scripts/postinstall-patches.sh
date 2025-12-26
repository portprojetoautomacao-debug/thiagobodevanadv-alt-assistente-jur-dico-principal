#!/bin/bash
# Script para aplicar patches em node_modules após npm install
# Corrige erros de TypeScript em bibliotecas externas

set -e

echo "🔧 Aplicando patches em node_modules..."

# Patch 1: body-parser/index.js - Remover @param incorreto
BODY_PARSER_INDEX="node_modules/body-parser/index.js"
if [ -f "$BODY_PARSER_INDEX" ]; then
    sed -i 's/@param {object} \[options\]//' "$BODY_PARSER_INDEX"
    echo "✅ Patch 1/3: body-parser/index.js"
fi

# Patch 2: body-parser/lib/types/json.js - Adicionar type guard
BODY_PARSER_JSON="node_modules/body-parser/lib/types/json.js"
if [ -f "$BODY_PARSER_JSON" ]; then
    sed -i "s/if (first !== '{' && first !== '\['/if (typeof first === 'string' \&\& first !== '{' \&\& first !== '\['/" "$BODY_PARSER_JSON"
    echo "✅ Patch 2/3: body-parser/lib/types/json.js"
fi

# Patch 3: events/events.js - Desabilitar type checking
EVENTS_JS="node_modules/events/events.js"
if [ -f "$EVENTS_JS" ]; then
    if ! grep -q "@ts-nocheck" "$EVENTS_JS"; then
        sed -i '1i// @ts-nocheck' "$EVENTS_JS"
        echo "✅ Patch 3/3: events/events.js - @ts-nocheck adicionado"
    else
        echo "✅ Patch 3/3: events/events.js - Já possui @ts-nocheck"
    fi
fi

echo "✅ Todos os patches aplicados com sucesso!"
