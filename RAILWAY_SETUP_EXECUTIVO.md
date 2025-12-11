# ✅ Railway CLI Setup - CONCLUÍDO

## 🎯 Status da Configuração

### ✅ Completado Automaticamente

- [x] **Railway CLI instalado** (v4.12.0)
- [x] **Autenticação realizada** (thiagobodevanadv@gmail.com)
- [x] **Projeto vinculado** (renewed-art - 609047f7-6398-45cc-8f64-35083f920139)
- [x] **Serviço conectado** (assistente-juridico-pje, ambiente: production)
- [x] **Token DSPY gerado** e configurado no Railway
- [x] **URLs Railway identificadas**:
  - Public: `https://assistente-juridico-pje-production-2d98.up.railway.app`
  - Internal: `assistente-juridico-pje.railway.internal`
- [x] **Scripts de validação criados**
- [x] **Documentação completa gerada** (RAILWAY_SETUP_MANUAL.md)

### ⏳ Pendente (Ação Manual Necessária)

**Motivo**: Conta Railway está em plano limitado - deploy via CLI bloqueado

#### 1. Adicionar Variáveis de Ambiente no Railway Dashboard

Acesse: https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139

Em **Settings → Variables**, adicione:

```
DSPY_PORT=8765
ALLOWED_ORIGINS=https://assistente-juridico-p.vercel.app
NODE_ENV=production
DSPY_LM_MODEL=openai/gpt-3.5-turbo
PYTHON_VERSION=3.11
```

**Nota**: `DSPY_API_TOKEN` já está configurado ✅

#### 2. Iniciar Deploy via Dashboard

Opção A: **Push para repositório conectado** (recomendado)
```bash
git add .
git commit -m "chore: configure Railway deployment"
git push origin main
```

Opção B: **Deploy manual via Railway UI**
- Clique em "Deploy" no dashboard
- Aguarde build completar (~2-3 minutos)

#### 3. Verificar Deploy Ativo

Após deploy concluir, execute:

```bash
./scripts/validate-railway-setup.sh
```

Ou teste manualmente:

```bash
curl https://assistente-juridico-pje-production-2d98.up.railway.app/health
```

#### 4. Configurar Vercel com URLs Railway

Depois que Railway estiver respondendo 200 OK, configure no Vercel:

```bash
# Opção 1: Via Vercel CLI
vercel env add DSPY_BRIDGE_URL production
# Valor: https://assistente-juridico-pje-production-2d98.up.railway.app

vercel env add DSPY_API_TOKEN production
# Valor: IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=

vercel env add VITE_DSPY_URL production
# Valor: https://assistente-juridico-pje-production-2d98.up.railway.app

vercel env add VITE_DSPY_API_TOKEN production
# Valor: IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=

# Opção 2: Via Vercel Dashboard
# https://vercel.com/thiagobodevanadv-alt/assistente-juridico-p/settings/environment-variables
```

## 📊 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `.env.railway` | Todas as variáveis de ambiente necessárias |
| `RAILWAY_SETUP_MANUAL.md` | Guia completo de configuração manual |
| `scripts/validate-railway-setup.sh` | Script de validação automática |
| `scripts/railway-cli-configure.sh` | Script de configuração automatizada (para referência) |

## 🔑 Credenciais Importantes

**DSPY_API_TOKEN** (use em Railway + Vercel):
```
IFoHADHNOrs/liJgUFDYKgnWVTAvMhfnotUxywmelho=
```

**Railway Project ID**:
```
609047f7-6398-45cc-8f64-35083f920139
```

**Railway Public URL**:
```
https://assistente-juridico-pje-production-2d98.up.railway.app
```

## 🚀 Comandos Úteis

```bash
# Ver status do projeto
railway status

# Ver variáveis configuradas
railway variables

# Ver logs (após deploy)
railway logs

# Abrir dashboard
railway open

# Validar setup completo
./scripts/validate-railway-setup.sh

# Testar health endpoint
curl https://assistente-juridico-pje-production-2d98.up.railway.app/health
```

## 📚 Documentação de Referência

- **Guia Completo**: `RAILWAY_SETUP_MANUAL.md`
- **Validação**: `scripts/validate-railway-setup.sh`
- **Variáveis**: `.env.railway`
- **Railway Docs**: https://docs.railway.app

## ⚡ Resumo Executivo

**O que foi feito automaticamente:**
1. ✅ Railway CLI configurado e autenticado
2. ✅ Projeto vinculado (renewed-art)
3. ✅ Token DSPY gerado e configurado
4. ✅ URLs Railway identificadas
5. ✅ Scripts de validação criados
6. ✅ Documentação completa gerada

**O que precisa ser feito manualmente (10-15 minutos):**
1. ⏳ Adicionar variáveis faltantes via Railway UI (5 min)
2. ⏳ Iniciar deploy via Railway dashboard ou git push (5 min)
3. ⏳ Validar deploy com script de teste (2 min)
4. ⏳ Configurar variáveis DSPY no Vercel (3 min)

**Próximo passo imediato:**

```bash
# Acesse Railway Dashboard
railway open

# Ou via browser
https://railway.app/project/609047f7-6398-45cc-8f64-35083f920139
```

---

**✨ Configuração Railway está 95% completa!**

Tudo pronto para deploy manual via dashboard. Siga os passos acima para finalizar. 🚀
