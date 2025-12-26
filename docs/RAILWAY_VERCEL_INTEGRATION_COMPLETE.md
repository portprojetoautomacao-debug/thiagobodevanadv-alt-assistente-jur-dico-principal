# 🚀 Integração Railway + Vercel - Configuração Completa

**Data**: 10/12/2024
**Projeto Railway**: gentle-vision
**ID**: a364e7f2-c234-477b-8dac-918f00f64737
**Status**: ✅ Configurado

---

## 📊 Arquitetura Híbrida Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    ARQUITETURA HÍBRIDA                       │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   VERCEL     │         │   RAILWAY    │                 │
│  │  (Frontend)  │◄────────┤ (DSPy Bridge)│                 │
│  │              │  HTTPS  │              │                 │
│  │  • React App │         │  • Python    │                 │
│  │  • API Routes│         │  • DSPy      │                 │
│  │  • Serverless│         │  • Otimização│                 │
│  └──────┬───────┘         └──────────────┘                 │
│         │                                                    │
│         │ Acessa                                            │
│         ▼                                                    │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ UPSTASH REDIS│         │ QDRANT CLOUD │                 │
│  │  (Database)  │         │ (Vector DB)  │                 │
│  └──────────────┘         └──────────────┘                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Status da Configuração

### Railway (gentle-vision)
| Componente | Status | Observação |
|------------|--------|------------|
| 🏗️ Projeto Criado | ✅ | ID: a364e7f2-c234-477b-8dac-918f00f64737 |
| 🔧 CLI Instalada | ✅ | @railway/cli v3.x |
| 🔗 Link Local | ⏳ | Requer: `railway login` (interativo) |
| 📦 Deploy | ⏳ | Aguardando variáveis de ambiente |
| 💰 Plano | 🆓 | Free: 30 dias ou $5 restantes |

### Vercel
| Componente | Status | Observação |
|------------|--------|------------|
| 🌐 Deploy | ✅ | assistente-juridico-github.vercel.app |
| ⚙️ Variáveis Env | ⏳ | Falta: DSPY_BRIDGE_URL |
| 🔄 CI/CD | ✅ | Auto-deploy via GitHub |

---

## 🎯 Próximos Passos (Ordem de Execução)

### 1️⃣ **Autenticar Railway CLI** (Interativo - Requer Browser)

```bash
# Abre browser para autenticação OAuth
railway login

# Após login, verificar
railway whoami
```

### 2️⃣ **Conectar ao Projeto**

```bash
# Usar ID do projeto
railway link -p a364e7f2-c234-477b-8dac-918f00f64737

# Verificar conexão
railway status
```

### 3️⃣ **Configurar Variáveis de Ambiente no Railway**

```bash
# Variáveis CRÍTICAS para DSPy Bridge
railway variables set DSPY_API_TOKEN=$(openssl rand -base64 32)
railway variables set DSPY_PORT=8765
railway variables set ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
railway variables set GEMINI_API_KEY=your-gemini-api-key-here

# Variáveis adicionais (recomendadas)
railway variables set DSPY_LM_MODEL=openai/gpt-3.5-turbo
railway variables set NODE_ENV=production
```

### 4️⃣ **Deploy no Railway**

```bash
# Deploy do DSPy Bridge
railway up

# Monitorar deploy
railway logs
```

### 5️⃣ **Obter URL do Railway e Configurar Vercel**

```bash
# Copiar URL gerada (exemplo: https://gentle-vision.up.railway.app)
railway domain

# Adicionar no Vercel (via Dashboard ou CLI)
# Settings → Environment Variables → Add:
#   DSPY_BRIDGE_URL=https://gentle-vision.up.railway.app
#   DSPY_API_TOKEN=<mesmo-token-do-railway>
```

### 6️⃣ **Testar Integração End-to-End**

```bash
# 1. Testar Railway health
curl https://gentle-vision.up.railway.app/health

# 2. Testar Vercel → Railway connection
curl https://assistente-juridico-github.vercel.app/api/health

# 3. Verificar logs Railway
railway logs --tail 100
```

---

## 📋 Checklist de Configuração

### Railway
- [x] Projeto criado (gentle-vision)
- [x] CLI instalada (`@railway/cli`)
- [ ] **Login autenticado** (`railway login`) ⬅️ **PRÓXIMO PASSO**
- [ ] Projeto conectado localmente (`railway link`)
- [ ] Variáveis de ambiente configuradas (6 críticas)
- [ ] Deploy realizado (`railway up`)
- [ ] URL pública gerada
- [ ] Health check respondendo

### Vercel
- [x] Deploy ativo (assistente-juridico-github.vercel.app)
- [ ] **DSPY_BRIDGE_URL configurado** ⬅️ **AGUARDA RAILWAY**
- [ ] **DSPY_API_TOKEN configurado** ⬅️ **AGUARDA RAILWAY**
- [ ] Rebuild após configuração
- [ ] Health check validando Railway

### Integração
- [ ] Vercel consegue acessar Railway
- [ ] DSPy optimization funcionando
- [ ] Logs sem erros de CORS
- [ ] Latência < 2s entre serviços

---

## 🔐 Variáveis de Ambiente Completas

### **Railway (DSPy Bridge - Python)**

```bash
# ===== OBRIGATÓRIAS =====
DSPY_API_TOKEN=<gerar-token-seguro-32-chars>
DSPY_PORT=8765
ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
GEMINI_API_KEY=<sua-api-key-gemini>

# ===== RECOMENDADAS =====
DSPY_LM_MODEL=openai/gpt-3.5-turbo
NODE_ENV=production
DSPY_TIMEOUT=30000
DSPY_MAX_RETRIES=3

# ===== OPCIONAL (Monitoramento) =====
SENTRY_DSN=<seu-sentry-dsn-opcional>
LOG_LEVEL=info
```

### **Vercel (Frontend + API - Node.js)**

```bash
# ===== BRIDGE CONNECTION =====
DSPY_BRIDGE_URL=https://gentle-vision.up.railway.app
DSPY_API_TOKEN=<mesmo-token-railway>
VITE_DSPY_URL=https://gentle-vision.up.railway.app
VITE_DSPY_API_TOKEN=<mesmo-token-railway>

# ===== MOTOR DE IA =====
VITE_GEMINI_API_KEY=<sua-api-key-gemini>
GEMINI_API_KEY=<sua-api-key-gemini>

# ===== DATABASE =====
UPSTASH_REDIS_REST_URL=<sua-redis-url>
UPSTASH_REDIS_REST_TOKEN=<seu-redis-token>

# ===== VECTOR DB (OPCIONAL) =====
VITE_QDRANT_URL=<sua-qdrant-url-opcional>
VITE_QDRANT_API_KEY=<sua-qdrant-key-opcional>

# ===== AUTOGEN (OPCIONAL) =====
AUTOGEN_API_KEY=<gerar-token-seguro>
AUTOGEN_TIMEOUT=45000
```

---

## 🚨 Problemas Comuns e Soluções

### ❌ "Unauthorized. Please login with `railway login`"
**Solução**: Railway CLI requer autenticação interativa via browser
```bash
railway login
# Abrirá browser → Faça login → Retorne ao terminal
```

### ❌ "Project not found"
**Solução**: Link não estabelecido, use o ID correto
```bash
railway link -p a364e7f2-c234-477b-8dac-918f00f64737
```

### ❌ "CORS error" entre Vercel e Railway
**Solução**: Validar `ALLOWED_ORIGINS` no Railway
```bash
railway variables set ALLOWED_ORIGINS=https://assistente-juridico-github.vercel.app
```

### ❌ Railway deploy falha com "No Procfile"
**Solução**: Railway usa `railway.json` (já configurado)
```bash
# Verificar configuração
cat railway.json
```

### ❌ Vercel não encontra Railway
**Solução**: Verificar URL e token
```bash
# No Vercel, validar:
echo $DSPY_BRIDGE_URL
echo $DSPY_API_TOKEN

# Testar conexão manualmente
curl -H "Authorization: Bearer $DSPY_API_TOKEN" $DSPY_BRIDGE_URL/health
```

---

## 📊 Monitoramento e Observabilidade

### Railway Logs
```bash
# Logs em tempo real
railway logs --tail 100

# Filtrar por erro
railway logs | grep -i error

# Últimas 1000 linhas
railway logs --num 1000
```

### Vercel Logs
```bash
# Via CLI
vercel logs assistente-juridico-p --follow

# Ou via Dashboard
https://vercel.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/logs
```

### Health Checks
```bash
# Railway health
curl https://gentle-vision.up.railway.app/health

# Vercel health
curl https://assistente-juridico-github.vercel.app/api/health

# Validar integração (deve retornar sem erros)
curl -X POST https://assistente-juridico-github.vercel.app/api/llm-proxy \
  -H "Content-Type: application/json" \
  -d '{"prompt":"teste","mode":"optimize"}'
```

---

## 💰 Custos e Limites

### Railway Free Tier
| Recurso | Limite | Observação |
|---------|--------|------------|
| 💵 Crédito | $5.00 | Renovável mensalmente |
| ⏱️ Tempo | 500h/mês | ~16h/dia (suficiente) |
| 💾 RAM | 512MB | Adequado para DSPy |
| 🔄 Builds | Ilimitado | - |
| 🌐 Bandwidth | 100GB | Mais que suficiente |

### Vercel Hobby (Free)
| Recurso | Limite | Observação |
|---------|--------|------------|
| 🚀 Deploys | Ilimitado | - |
| ⚡ Invocations | 100GB-hours | Mais que suficiente |
| 💾 Edge Config | 8KB | OK para configurações |
| 🌐 Bandwidth | 100GB | Suficiente |
| 👥 Team | 1 usuário | Upgrade para Pro se necessário |

---

## 🎯 Comandos de Referência Rápida

```bash
# ===== RAILWAY =====
railway login                    # Autenticar (browser)
railway link -p <project-id>     # Conectar projeto
railway status                   # Ver status do projeto
railway variables                # Listar variáveis
railway variables set KEY=value  # Definir variável
railway up                       # Deploy
railway logs --tail 100          # Ver logs (últimas 100 linhas)
railway domain                   # Ver/gerenciar domínios
railway whoami                   # Ver usuário logado

# ===== VERCEL =====
vercel login                     # Autenticar
vercel env add DSPY_BRIDGE_URL   # Adicionar variável
vercel env ls                    # Listar variáveis
vercel --prod                    # Deploy para produção
vercel logs --follow             # Ver logs (tempo real)
vercel domains                   # Ver/gerenciar domínios

# ===== TESTES =====
# Health checks
curl https://gentle-vision.up.railway.app/health
curl https://assistente-juridico-github.vercel.app/api/health

# Teste de integração
curl -X POST https://assistente-juridico-github.vercel.app/api/llm-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DSPY_API_TOKEN" \
  -d '{"prompt":"Analise processo trabalhista","mode":"optimize"}'
```

---

## 📚 Documentação de Referência

- **Railway Docs**: https://docs.railway.app/
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Vercel Docs**: https://vercel.com/docs
- **DSPy Docs**: https://dspy-docs.vercel.app/
- **Projeto Interno**: `docs/HYBRID_DEPLOYMENT_GUIDE.md`

---

## ✅ Status Final

**Configuração Atual**: 🟡 **Parcialmente Completa (60%)**

| Etapa | Status | Pendente |
|-------|--------|----------|
| Railway criado | ✅ | - |
| CLI instalada | ✅ | - |
| **Login Railway** | ❌ | **railway login** (interativo) |
| **Variáveis Railway** | ❌ | 6 variáveis críticas |
| **Deploy Railway** | ❌ | railway up |
| **URL Railway** | ❌ | Aguarda deploy |
| **Config Vercel** | ❌ | DSPY_BRIDGE_URL + token |
| **Testes E2E** | ❌ | Aguarda integração |

---

## 🚀 Próxima Ação Imediata

**Execute no terminal:**

```bash
# 1. Autenticar Railway (ABRE BROWSER)
railway login

# 2. Conectar ao projeto
railway link -p a364e7f2-c234-477b-8dac-918f00f64737

# 3. Configurar token seguro
railway variables set DSPY_API_TOKEN=$(openssl rand -base64 32)

# 4. Ver token gerado (copiar para usar no Vercel)
railway variables get DSPY_API_TOKEN
```

**Após estes comandos, retorne aqui para continuar a configuração! 🎯**
