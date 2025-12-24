#!/bin/bash
# Script de Verificação Pós-Correções
# Verifica se as correções dos erros do console foram aplicadas corretamente

echo "🔍 VERIFICAÇÃO PÓS-CORREÇÕES - $(date '+%d/%m/%Y %H:%M:%S')"
echo "================================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se arquivo existe
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Arquivo existe: $1"
        return 0
    else
        echo -e "${RED}✗${NC} Arquivo não encontrado: $1"
        return 1
    fi
}

# Função para verificar se string existe em arquivo
check_string_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Correção aplicada em $1"
        return 0
    else
        echo -e "${RED}✗${NC} Correção NÃO encontrada em $1"
        return 1
    fi
}

# Contador de erros
ERRORS=0

echo "1️⃣ Verificando arquivos modificados..."
echo "----------------------------------------"
check_file "api/llm-proxy.ts" || ((ERRORS++))
check_file "src/lib/real-agent-client.ts" || ((ERRORS++))
check_file "src/hooks/use-autonomous-agents.ts" || ((ERRORS++))
check_file "CORRECOES_CONSOLE_ERRORS_2024-12-24.md" || ((ERRORS++))
echo ""

echo "2️⃣ Verificando correção: Detecção de ambiente..."
echo "----------------------------------------"
check_string_in_file "api/llm-proxy.ts" "req.headers.host?.includes(\":517\")" || ((ERRORS++))
check_string_in_file "api/llm-proxy.ts" "Modo desenvolvimento - API Key não exigida" || ((ERRORS++))
echo ""

echo "3️⃣ Verificando correção: Fallback de API keys..."
echo "----------------------------------------"
check_string_in_file "api/llm-proxy.ts" "GEMINI_API_KEY_DEV" || ((ERRORS++))
check_string_in_file "api/llm-proxy.ts" "hasAnyKey" || ((ERRORS++))
echo ""

echo "4️⃣ Verificando correção: Mensagem de API key expirada..."
echo "----------------------------------------"
check_string_in_file "src/lib/real-agent-client.ts" "API Key do Gemini EXPIRADA" || ((ERRORS++))
check_string_in_file "src/lib/real-agent-client.ts" "makersuite.google.com/app/apikey" || ((ERRORS++))
echo ""

echo "5️⃣ Verificando correção: Throttling de logs..."
echo "----------------------------------------"
check_string_in_file "src/hooks/use-autonomous-agents.ts" "__lastAgentsLogTime" || ((ERRORS++))
check_string_in_file "src/hooks/use-autonomous-agents.ts" "10000" || ((ERRORS++))
echo ""

echo "6️⃣ Verificando variável de ambiente..."
echo "----------------------------------------"
if [ -f ".env" ]; then
    if grep -q "VITE_GEMINI_API_KEY=" .env; then
        API_KEY=$(grep "VITE_GEMINI_API_KEY=" .env | cut -d'=' -f2 | tr -d ' ')
        if [ -z "$API_KEY" ] || [ "$API_KEY" = "your-gemini-api-key-here" ]; then
            echo -e "${YELLOW}⚠${NC}  VITE_GEMINI_API_KEY está vazia ou usa placeholder"
            echo "   Ação necessária: Configure uma API key válida no arquivo .env"
            ((ERRORS++))
        else
            echo -e "${GREEN}✓${NC} VITE_GEMINI_API_KEY configurada (${#API_KEY} caracteres)"
        fi
    else
        echo -e "${RED}✗${NC} VITE_GEMINI_API_KEY não encontrada no .env"
        echo "   Crie o arquivo .env com base no .env.example"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC}  Arquivo .env não encontrado"
    echo "   Execute: cp .env.example .env"
    ((ERRORS++))
fi
echo ""

echo "7️⃣ Verificando servidor de desenvolvimento..."
echo "----------------------------------------"
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Servidor rodando na porta 5173"

    # Testa endpoint de saúde
    if command -v curl &> /dev/null; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✓${NC} Endpoint respondendo corretamente (HTTP $HTTP_CODE)"
        else
            echo -e "${YELLOW}⚠${NC}  Endpoint retornou HTTP $HTTP_CODE"
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC}  Servidor não está rodando"
    echo "   Execute: npm run dev"
fi
echo ""

echo "================================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ TODAS AS VERIFICAÇÕES PASSARAM!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Verifique se API key do Gemini está configurada e válida"
    echo "2. Reinicie o servidor: npm run dev"
    echo "3. Teste os agentes no navegador"
    echo "4. Monitore o console - logs devem estar limpos"
else
    echo -e "${RED}❌ ENCONTRADOS $ERRORS PROBLEMA(S)${NC}"
    echo ""
    echo "Ações corretivas necessárias:"
    echo "1. Revise os erros acima"
    echo "2. Configure .env com API keys válidas"
    echo "3. Execute novamente este script"
fi
echo "================================================================"
echo ""

exit $ERRORS
