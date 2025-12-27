# 🔧 Guia de Configuração - Serviços Opcionais

**Data:** 15/12/2024  
**Modo:** Manutenção - Produção Estável

---

## 📋 Visão Geral

Este guia ajuda a configurar os **3 serviços opcionais avançados**:

1. **Qdrant** - Vector Database para pesquisa semântica de jurisprudência
2. **DSPy Bridge** - Serviço Python para otimização de prompts
3. **Resend** - Email API para notificações e comunicação com clientes

---

## 1️⃣ QDRANT - Vector Database

### 📊 O que é?
Banco de dados vetorial para busca semântica de precedentes, jurisprudências e documentos jurídicos.

### 🎯 Quando usar?
- ✅ Se você precisa de pesquisa semântica avançada
- ✅ Se quer o agente `pesquisa-juris` conectado ao Qdrant
- ✅ Se tem >1000 documentos jurídicos para indexar
- ❌ Não precisa se usar apenas busca básica

### 🚀 Como configurar?

#### Passo 1: Criar conta Qdrant Cloud (GRATUITO)
```bash
# 1. Acesse: https://cloud.qdrant.io
# 2. Crie conta (gratuito - 1GB)
# 3. Crie um cluster:
#    - Nome: assistente-juridico
#    - Região: us-east4-0 (GCP) - mais próximo do Brasil
#    - Tier: Free (1GB)
```

#### Passo 2: Obter credenciais
```bash
# No dashboard do Qdrant:
# 1. Copie a URL do cluster (ex: https://4aee698c-xxx.us-east4-0.gcp.cloud.qdrant.io:6333)
# 2. Gere uma API Key (Dashboard > API Keys > Create)
```

#### Passo 3: Configurar variáveis de ambiente
```bash
# Crie/edite o arquivo .env.local
cat >> .env.local << 'EOF'

# Qdrant Cloud Configuration
VITE_QDRANT_URL=https://SEU-CLUSTER-ID.us-east4-0.gcp.cloud.qdrant.io:6333
VITE_QDRANT_API_KEY=sua-api-key-aqui
VITE_QDRANT_COLLECTION=legal_docs
EOF
```

#### Passo 4: Inicializar collection
```bash
# Rodar script de inicialização
npm run qdrant:init

# Ou manualmente:
node scripts/init-qdrant-collection.ts
```

#### Passo 5: Popular com dados (OPCIONAL)
```bash
# DRY RUN (teste antes)
npm run qdrant:populate:dry-run

# População real (cuidado - pode demorar)
npm run qdrant:populate-datajud
```

### ✅ Testar configuração
```bash
# Teste de conexão
curl -sS "$VITE_QDRANT_URL/collections" \
  -H "api-key: $VITE_QDRANT_API_KEY"

# Deve retornar: {"status":"ok","result":{"collections":[...]}}
```

### 📊 Verificar status
```bash
# Ver collections existentes
npm run qdrant:test

# Ver documentação completa
cat docs/QDRANT_SETUP_CHECKLIST.md
```

---

## 2️⃣ DSPY BRIDGE - Otimização de Prompts

### 📊 O que é?
Serviço Python que otimiza automaticamente prompts dos agentes, reduzindo uso de tokens em 90%.

### 🎯 Quando usar?
- ✅ Se você está gastando muito com API do Gemini
- ✅ Se quer respostas mais precisas dos agentes
- ✅ Se tem infraestrutura Python (Docker/Railway)
- ❌ Não precisa se usar apenas funcionalidades básicas

### 🚀 Como configurar?

#### Opção A: Deploy no Railway (RECOMENDADO)

```bash
# 1. Acesse: https://railway.app
# 2. Crie novo projeto
# 3. Deploy from GitHub:
#    - Repositório: seu-fork/assistente-juridico-p
#    - Root Directory: /
#    - Start Command: python3 scripts/dspy_bridge.py

# 4. Configure variáveis de ambiente no Railway:
DSPY_API_TOKEN=$(openssl rand -hex 32)
DSPY_PORT=8765
GEMINI_API_KEY=sua-gemini-api-key
ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
```

#### Opção B: Local (Desenvolvimento)

```bash
# 1. Ativar ambiente virtual
source /workspaces/assistente-jur-dico-principal/.venv/bin/activate

# 2. Instalar dependências Python
pip install dspy-ai google-generativeai flask flask-cors

# 3. Gerar token seguro
export DSPY_API_TOKEN=$(openssl rand -hex 32)
echo "DSPY_API_TOKEN=$DSPY_API_TOKEN" >> .env.local

# 4. Iniciar bridge
python3 scripts/dspy_bridge.py

# Deve exibir:
# * Running on http://localhost:8765
```

#### Passo 2: Configurar frontend

```bash
# Adicione ao .env.local:
cat >> .env.local << 'EOF'

# DSPy Bridge Configuration
VITE_DSPY_URL=http://localhost:8765
# OU se no Railway:
# VITE_DSPY_URL=https://seu-app.railway.app

VITE_DSPY_API_TOKEN=seu-token-gerado-acima
DSPY_API_TOKEN=seu-token-gerado-acima
EOF
```

### ✅ Testar configuração
```bash
# Teste local
curl -sS http://localhost:8765/health

# Teste Railway
curl -sS https://seu-app.railway.app/health

# Deve retornar: {"status":"healthy","timestamp":"..."}
```

### 📊 Verificar status
```bash
# Ver documentação completa
cat scripts/dspy_bridge.py

# Logs do Railway
railway logs
```

---

## 3️⃣ RESEND - Email API

### 📊 O que é?
API moderna de envio de emails para notificações, comunicação com clientes e alertas de prazos.

### 🎯 Quando usar?
- ✅ Se você precisa enviar emails automáticos (intimações, prazos)
- ✅ Se quer notificar clientes sobre andamentos processuais
- ✅ Se usa o agente `comunicacao-clientes`
- ❌ Não precisa se não usa comunicação automática

### 🚀 Como configurar?

#### Passo 1: Criar conta Resend (GRATUITO)
```bash
# 1. Acesse: https://resend.com
# 2. Crie conta (gratuito - 100 emails/dia)
# 3. Verifique seu domínio (ou use resend.dev para testes)
```

#### Passo 2: Obter API Key
```bash
# No dashboard do Resend:
# 1. Settings > API Keys
# 2. Create API Key
# 3. Copie a key (começa com "re_")
```

#### Passo 3: Configurar variáveis de ambiente
```bash
# Adicione ao .env.local:
cat >> .env.local << 'EOF'

# Resend Email API
RESEND_API_KEY=re_sua_api_key_aqui
RESEND_FROM_EMAIL=noreply@seudominio.com
# OU para testes:
# RESEND_FROM_EMAIL=onboarding@resend.dev
EOF
```

#### Passo 4: Atualizar código (se necessário)

O código já deve ter suporte. Verificar em `api/emails.ts`:

```typescript
// Exemplo de uso
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL,
  to: 'cliente@example.com',
  subject: 'Nova Intimação Recebida',
  html: '<p>Você tem uma nova intimação...</p>'
});
```

### ✅ Testar configuração
```bash
# Teste via curl (substituir valores)
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "onboarding@resend.dev",
    "to": "seu-email@example.com",
    "subject": "Teste Resend",
    "html": "<p>Email de teste funcionando!</p>"
  }'

# Ou via endpoint da API:
curl -X POST http://localhost:5173/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{"to": "seu-email@example.com"}'
```

### 📊 Verificar status
```bash
# Dashboard Resend
# https://resend.com/emails

# Verificar logs
# https://resend.com/logs

# API health check
curl http://localhost:5173/api/emails/health
```

---

## 🎯 VERIFICAÇÃO COMPLETA - Todos os Serviços

### Script de Teste Automático

```bash
#!/bin/bash
# Nome: test-all-services.sh

echo "🔍 TESTANDO TODOS OS SERVIÇOS OPCIONAIS"
echo "========================================"
echo ""

# Carregar variáveis de ambiente
source .env.local 2>/dev/null || echo "⚠️ .env.local não encontrado"

# 1. Qdrant
echo "1️⃣ QDRANT:"
if [ -n "$VITE_QDRANT_URL" ] && [ -n "$VITE_QDRANT_API_KEY" ]; then
  QDRANT_TEST=$(curl -sS "$VITE_QDRANT_URL/collections" \
    -H "api-key: $VITE_QDRANT_API_KEY" 2>/dev/null)
  
  if echo "$QDRANT_TEST" | grep -q "status.*ok"; then
    echo "   ✅ Conectado - $(echo $QDRANT_TEST | jq -r '.result.collections | length') collections"
  else
    echo "   ❌ Falha na conexão"
  fi
else
  echo "   ⚠️ Não configurado"
fi

# 2. DSPy Bridge
echo ""
echo "2️⃣ DSPY BRIDGE:"
if [ -n "$VITE_DSPY_URL" ]; then
  DSPY_TEST=$(curl -sS "$VITE_DSPY_URL/health" 2>/dev/null)
  
  if echo "$DSPY_TEST" | grep -q "healthy"; then
    echo "   ✅ Serviço online"
  else
    echo "   ❌ Serviço offline"
  fi
else
  echo "   ⚠️ Não configurado"
fi

# 3. Resend
echo ""
echo "3️⃣ RESEND EMAIL:"
if [ -n "$RESEND_API_KEY" ]; then
  echo "   ✅ API Key configurada"
  echo "   📧 From: ${RESEND_FROM_EMAIL:-'não configurado'}"
else
  echo "   ⚠️ Não configurado"
fi

echo ""
echo "========================================"
echo "✅ Verificação completa!"
```

### Executar teste
```bash
chmod +x test-all-services.sh
./test-all-services.sh
```

---

## 📊 RESUMO DE VARIÁVEIS NECESSÁRIAS

### .env.local (Exemplo Completo)

```bash
# ============================================
# QDRANT - Vector Database
# ============================================
VITE_QDRANT_URL=https://4aee698c-xxx.us-east4-0.gcp.cloud.qdrant.io:6333
VITE_QDRANT_API_KEY=sua-api-key-qdrant
VITE_QDRANT_COLLECTION=legal_docs

# ============================================
# DSPY BRIDGE - Prompt Optimization
# ============================================
VITE_DSPY_URL=http://localhost:8765
# OU: https://seu-app.railway.app
VITE_DSPY_API_TOKEN=token-gerado-com-openssl
DSPY_API_TOKEN=token-gerado-com-openssl
DSPY_PORT=8765

# ============================================
# RESEND - Email API
# ============================================
RESEND_API_KEY=re_sua_api_key_resend
RESEND_FROM_EMAIL=noreply@seudominio.com

# ============================================
# GEMINI (OBRIGATÓRIO - já deve estar configurado)
# ============================================
GEMINI_API_KEY=sua-gemini-api-key
VITE_GEMINI_API_KEY=sua-gemini-api-key

# ============================================
# UPSTASH REDIS (OBRIGATÓRIO - já deve estar configurado)
# ============================================
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=seu-token-upstash
```

---

## 🚀 PRÓXIMOS PASSOS

### Se configurou tudo:
1. ✅ Reiniciar servidor dev: `npm run dev`
2. ✅ Testar cada serviço individualmente
3. ✅ Verificar logs de erro no console
4. ✅ Monitorar uso no Sentry (se configurado)

### Se não configurou nada:
- ⚠️ **OK!** Os serviços são **opcionais**
- ✅ O sistema funciona 100% sem eles
- 💡 Configure quando precisar das funcionalidades avançadas

---

## 📞 SUPORTE

**Problemas com Qdrant?**
- Docs: https://qdrant.tech/documentation/
- Status: docs/QDRANT_SETUP_CHECKLIST.md

**Problemas com DSPy Bridge?**
- Docs: scripts/dspy_bridge.py (comentários)
- Logs Railway: `railway logs`

**Problemas com Resend?**
- Docs: https://resend.com/docs
- Dashboard: https://resend.com/emails

---

**Guia criado por GitHub Copilot**  
**Modo:** Manutenção - Produção Estável  
**Data:** 2024-12-15 13:42 UTC
