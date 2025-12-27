#!/bin/bash
# Script de Validação Final - Frontend Streamlit
# Executa todos os testes necessários para validar o sistema

echo "🔍 INICIANDO VALIDAÇÃO DO FRONTEND STREAMLIT"
echo "=============================================="
echo ""

cd /workspaces/thiagobodevanadv-alt-assistente-jur-dico-principal/streamlit-app

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de testes
PASSED=0
FAILED=0

# Função para testar
test_command() {
    local description=$1
    local command=$2

    echo -n "Testando: $description... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "📦 1. DEPENDÊNCIAS"
echo "-------------------"
test_command "Streamlit instalado" "python -c 'import streamlit'"
test_command "Pandas instalado" "python -c 'import pandas'"
test_command "Plotly instalado" "python -c 'import plotly'"
test_command "Google GenAI instalado" "python -c 'import google.generativeai'"
test_command "LangChain instalado" "python -c 'import langchain'"
test_command "Requests instalado" "python -c 'import requests'"
echo ""

echo "🔧 2. MÓDULOS INTERNOS"
echo "----------------------"
test_command "Config carregável" "python -c 'from lib.config import APP_CONFIG'"
test_command "BackendClient carregável" "python -c 'from lib.backend_client import BackendClient'"
test_command "BaseAgent carregável" "python -c 'from lib.agents.base_agent import BaseAgent'"
test_command "Harvey Agent carregável" "python -c 'from lib.agents.harvey import HarveyAgent'"
test_command "Justine Agent carregável" "python -c 'from lib.agents.justine import JustineAgent'"
echo ""

echo "📄 3. PÁGINAS STREAMLIT"
echo "-----------------------"
test_command "app.py existe" "test -f app.py"
test_command "Dashboard existe" "test -f pages/dashboard.py"
test_command "Processos existe" "test -f 'pages/1_📋_Processos.py'"
test_command "Expedientes existe" "test -f 'pages/2_📨_Expedientes.py'"
test_command "Agentes IA existe" "test -f 'pages/3_🤖_Agentes_IA.py'"
test_command "Automações existe" "test -f 'pages/4_🔍_Automações.py'"
test_command "Análises ML existe" "test -f 'pages/5_📊_Análises_ML.py'"
test_command "Configurações existe" "test -f 'pages/6_⚙️_Configurações.py'"
echo ""

echo "🤖 4. AGENTES (16 AGENTES)"
echo "--------------------------"
test_command "Harvey (1/16)" "test -f lib/agents/harvey.py"
test_command "Justine (2/16)" "test -f lib/agents/justine.py"
test_command "Redação (3/16)" "test -f lib/agents/redacao.py"
test_command "Pesquisa (4/16)" "test -f lib/agents/pesquisa.py"
test_command "Análise Doc (5/16)" "test -f lib/agents/analise_doc.py"
test_command "Monitor DJEN (6/16)" "test -f lib/agents/monitor_djen.py"
test_command "Prazos (7/16)" "test -f lib/agents/prazos.py"
test_command "Organização (8/16)" "test -f lib/agents/organizacao.py"
test_command "Análise Risco (9/16)" "test -f lib/agents/analise_risco.py"
test_command "Revisão Contratual (10/16)" "test -f lib/agents/revisao_contratual.py"
test_command "Comunicação (11/16)" "test -f lib/agents/comunicacao.py"
test_command "Financeiro (12/16)" "test -f lib/agents/financeiro.py"
test_command "Estratégia (13/16)" "test -f lib/agents/estrategia.py"
test_command "Tradução (14/16)" "test -f lib/agents/traducao.py"
test_command "Compliance (15/16)" "test -f lib/agents/compliance.py"
test_command "Análise Sentença (16/16)" "test -f lib/agents/analise_sentenca.py"
echo ""

echo "📚 5. DOCUMENTAÇÃO"
echo "------------------"
test_command "README existe" "test -f README.md"
test_command "FRONTEND_COMPLETO existe" "test -f FRONTEND_COMPLETO.md"
test_command "GUIA_RAPIDO existe" "test -f GUIA_RAPIDO.md"
test_command "ANALISE_ESTADO_ATUAL existe" "test -f ANALISE_ESTADO_ATUAL.md"
test_command "CORRECOES_APLICADAS existe" "test -f CORRECOES_APLICADAS.md"
echo ""

echo "⚙️ 6. CONFIGURAÇÕES"
echo "-------------------"
test_command ".env.example existe" "test -f .env.example"
test_command "requirements.txt existe" "test -f requirements.txt"
test_command "pytest.ini existe" "test -f pytest.ini"
echo ""

echo "=============================================="
echo "📊 RESULTADO FINAL"
echo "=============================================="
echo ""
echo -e "Testes passaram: ${GREEN}$PASSED${NC}"
echo -e "Testes falharam: ${RED}$FAILED${NC}"
echo ""

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM ($PERCENTAGE%)${NC}"
    echo ""
    echo "🚀 Sistema pronto para execução:"
    echo "   streamlit run app.py"
    exit 0
elif [ $PERCENTAGE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  QUASE LÁ! ($PERCENTAGE% completo)${NC}"
    echo ""
    echo "Alguns testes falharam, mas o sistema pode funcionar."
    echo "Revise os erros acima."
    exit 1
else
    echo -e "${RED}❌ MUITOS TESTES FALHARAM ($PERCENTAGE%)${NC}"
    echo ""
    echo "Sistema não está pronto. Corrija os erros acima."
    exit 2
fi
