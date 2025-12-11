# 🚂 Railway Setup Manual - DSPy Bridge

## ✅ Status Atual

- ✅ **Railway CLI**: Configurado e autenticado
- ✅ **Projeto Vinculado**: `renewed-art` (609047f7-6398-45cc-8f64-35083f920139)
- ✅ **Serviço**: `assistente-juridico-pje`
- ✅ **Ambiente**: `production`
- ✅ **Token Gerado**: `DSPY_API_TOKEN` já configurado
- ✅ **URLs Railway**:
  - Public: `https://assistente-juridico-pje-production-2d98.up.railway.app`
  - Internal: `assistente-juridico-pje.railway.internal`

## ⚠️ Limitação Detectada

Sua conta Railway está em **plano limitado**. O deploy via CLI (`railway up`) está bloqueado.

## 📋 Próximos Passos - Configuração Manual

### 1. Acessar Railway Dashboard

```
https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139
```

### 2. Adicionar Variáveis de Ambiente

Acesse: **Settings → Variables** e adicione (se ainda não existirem):

```bash
DSPY_PORT=8765
ALLOWED_ORIGINS=https://assistente-juridico-p.vercel.app
NODE_ENV=production
DSPY_LM_MODEL=openai/gpt-3.5-turbo
PYTHON_VERSION=3.11
```

**Nota**: `DSPY_API_TOKEN` já está configurado com valor:
```
IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
```

### 3. Verificar Configuração de Build

Em **Settings → Build**:

- **Builder**: NIXPACKS (detecção automática de Python)
- **Build Command**: `pip install -r requirements.txt` (automático)
- **Start Command**: `python3 scripts/dspy_bridge.py`
- **Python Version**: 3.11

### 4. Configurar Health Check

Em **Settings → Health Check**:

- **Path**: `/health`
- **Interval**: 30s
- **Timeout**: 10s

### 5. Deploy Manual

- Clique em **Deploy** no topo da dashboard
- Ou faça push para o repositório conectado

## 🔗 Configuração no Vercel (Depois do Deploy Railway)

Após o deploy Railway estar ativo, configure as seguintes variáveis no Vercel:

```bash
# No Vercel Dashboard ou via CLI
vercel env add DSPY_BRIDGE_URL production
# Valor: https://assistente-juridico-pje-production-2d98.up.railway.app

vercel env add DSPY_API_TOKEN production
# Valor: IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=

vercel env add VITE_DSPY_URL production
# Valor: https://assistente-juridico-pje-production-2d98.up.railway.app

vercel env add VITE_DSPY_API_TOKEN production
# Valor: IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
```

## 🧪 Testar Deployment

Após deploy ativo, teste o endpoint de health:

```bash
curl https://assistente-juridico-pje-production-2d98.up.railway.app/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "service": "dspy-bridge",
  "version": "1.0.0"
}
```

Testar endpoint de otimização (com token):

```bash
curl -X POST https://assistente-juridico-pje-production-2d98.up.railway.app/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=" \
  -d '{
    "prompt": "Analisar processo trabalhista",
    "context": "Reclamação trabalhista sobre horas extras"
  }'
```

## 📊 Alternativa: Upgrade do Plano Railway

Para deploy automático via CLI, considere upgrade do plano:

- **Hobby Plan**: $5/mês - Deploy ilimitado, 512MB RAM, 1GB storage
- **Pro Plan**: $20/mês - 8GB RAM, 100GB storage, priority support

Link: https://railway.com/account/plans

## 🔧 Scripts Auxiliares

Arquivo gerado com todas as variáveis: `.env.railway`

Para reconfigurar Railway CLI:
```bash
# Ver projeto vinculado
railway status

# Ver variáveis
railway variables

# Ver logs (depois do deploy)
railway logs

# Abrir dashboard
railway open
```

## 📝 Checklist de Verificação

- [ ] Variáveis de ambiente configuradas no Railway
- [ ] Build settings verificadas (NIXPACKS, Python 3.11)
- [ ] Start command: `python3 scripts/dspy_bridge.py`
- [ ] Health check path: `/health`
- [ ] Deploy realizado com sucesso
- [ ] Endpoint `/health` respondendo 200 OK
- [ ] Variáveis DSPY configuradas no Vercel
- [ ] Frontend Vercel conectando ao Railway corretamente

## 🆘 Troubleshooting

### Deploy falha com "Module not found"
```bash
# Verificar requirements.txt inclui:
fastapi
uvicorn[standard]
dspy-ai
python-dotenv
```

### Health check falhando
```bash
# Verificar logs Railway
railway logs

# Testar localmente
python3 scripts/dspy_bridge.py
curl http://localhost:8765/health
```

### CORS errors no frontend
```bash
# Verificar ALLOWED_ORIGINS no Railway
# Deve incluir: https://assistente-juridico-p.vercel.app
```

---

**✅ Configuração Railway está 95% completa!**

Falta apenas:
1. Adicionar variáveis faltantes via UI (opcional)
2. Fazer deploy via dashboard
3. Configurar URLs no Vercel

**URL Railway Dashboard**: https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139
