#!/bin/bash

# Script de teste para o endpoint de emails
# Uso: bash scripts/test-email-endpoint.sh [seu-email@example.com]

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Email para teste (pega do argumento ou usa variável de ambiente)
TEST_EMAIL="${1:-${TEST_EMAIL_ADDRESS}}"

# Se não tiver email, pedir
if [ -z "$TEST_EMAIL" ]; then
  echo -e "${YELLOW}ℹ️  Nenhum email fornecido${NC}"
  read -p "Digite seu email para teste: " TEST_EMAIL
fi

if [ -z "$TEST_EMAIL" ]; then
  echo -e "${RED}❌ Email é obrigatório${NC}"
  exit 1
fi

echo -e "${BLUE}📧 Email Service Test Suite${NC}"
echo "=================================="
echo -e "Endpoint: ${BLUE}http://localhost:3000/api/emails${NC}"
echo -e "Email de teste: ${YELLOW}$TEST_EMAIL${NC}"
echo ""

# Função para fazer requisição
send_email_test() {
  local test_name="$1"
  local type="$2"
  local payload="$3"

  echo -e "${BLUE}▶️  Teste: $test_name${NC}"
  echo "   Tipo: $type"

  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    http://localhost:3000/api/emails)

  echo "   Response: $response"
  
  success=$(echo "$response" | jq -r '.success // false')
  if [ "$success" = "true" ]; then
    echo -e "   ${GREEN}✅ SUCESSO${NC}"
  else
    echo -e "   ${RED}❌ FALHOU${NC}"
  fi
  echo ""
}

# Verificar se servidor está rodando
echo -e "${YELLOW}🔍 Verificando se servidor está rodando...${NC}"
if ! curl -s http://localhost:3000/api/status > /dev/null 2>&1; then
  echo -e "${RED}❌ Servidor não está rodando em http://localhost:3000${NC}"
  echo -e "${YELLOW}Execute: ${BLUE}npm run dev${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Servidor está rodando${NC}\n"

# Teste 1: Email de teste simples
send_email_test \
  "Email de Teste Simples" \
  "test" \
  "{\"type\": \"test\", \"to\": \"$TEST_EMAIL\"}"

# Teste 2: Notificação
send_email_test \
  "Email de Notificação" \
  "notification" \
  "{
    \"type\": \"notification\",
    \"to\": \"$TEST_EMAIL\",
    \"subject\": \"Nova Petição Disponível\",
    \"message\": \"Uma nova petição foi redacionada pelo agente IA e aguarda sua revisão.\",
    \"actionUrl\": \"https://assistente-juridico-github.vercel.app/minutas\"
  }"

# Teste 3: Alerta Urgente
send_email_test \
  "Alerta de Prazo Urgente" \
  "urgent" \
  "{
    \"type\": \"urgent\",
    \"to\": \"$TEST_EMAIL\",
    \"processNumber\": \"1234567-89.2024.5.02.0999\",
    \"deadline\": \"2024-12-25\"
  }"

# Teste 4: Resumo Diário
send_email_test \
  "Resumo Diário" \
  "daily_summary" \
  "{
    \"type\": \"daily_summary\",
    \"to\": \"$TEST_EMAIL\",
    \"summary\": {
      \"totalProcesses\": 15,
      \"newIntimations\": 3,
      \"deadlineAlerts\": 2,
      \"completedTasks\": 8,
      \"pendingReview\": 1
    }
  }"

# Teste 5: Verificar erros
echo -e "${BLUE}▶️  Teste: Validação de Erros${NC}"
echo "   Tentando sem tipo..."
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"to\": \"$TEST_EMAIL\"}" \
  http://localhost:3000/api/emails)
  
if echo "$response" | grep -q "obrigatório"; then
  echo -e "   ${GREEN}✅ Validação funcionando${NC}"
else
  echo -e "   ${RED}❌ Validação falhou${NC}"
fi

echo ""
echo -e "${BLUE}=================================="
echo -e "✅ Testes Concluídos!${NC}"
echo ""
echo -e "${YELLOW}💡 Próximas etapas:${NC}"
echo "   1. Adicione as secrets no GitHub: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets"
echo "   2. Faça deploy no Vercel: git push origin main"
echo "   3. Teste no Vercel: POST https://assistente-juridico-github.vercel.app/api/emails"
echo ""
echo -e "${YELLOW}📊 Para monitorar emails no Resend:${NC}"
echo "   Visite: https://resend.com/emails"
