# 🔧 Correção Google OAuth no Vercel

## 🐛 Problema Identificado

O app fica **"carregando infinitamente"** em produção (Vercel) e **não abre o popup do Google** para login.

### Causas Raiz

1. ❌ **Código bloqueava produção** - `GoogleAuth.tsx` tratava `assistente-juridico-p.vercel.app` como ambiente de desenvolvimento
2. ❌ **Variáveis de ambiente não configuradas** - `VITE_GOOGLE_CLIENT_ID` ausente no Vercel
3. ❌ **URLs não autorizadas** - Google Cloud Console não tinha as URLs de produção autorizadas

---

## ✅ Correções Aplicadas

### 1. Código Corrigido ✅

**Arquivo**: `src/components/GoogleAuth.tsx`

```typescript
// ✅ ANTES: Bloqueava assistente-juridico-p.vercel.app
if (hostname.includes('vercel.app') &&
  hostname !== 'assistente-juridico-github.vercel.app' &&
  !hostname.startsWith('assistente-juridico-github.')) {
  return true  // ❌ Tratava como dev
}

// ✅ DEPOIS: Permite ambas URLs de produção
const PRODUCTION_URLS = [
  'assistente-juridico-p.vercel.app',
  'assistente-juridico-github.vercel.app'
]

if (PRODUCTION_URLS.includes(hostname)) {
  return false  // ✅ Permite login
}
```

---

## 🔑 Configuração Necessária no Vercel

### Passo 1: Adicionar Variáveis de Ambiente

1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables

2. Adicione as seguintes variáveis:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `VITE_GOOGLE_CLIENT_ID` | `[SEU-CLIENT-ID].apps.googleusercontent.com` | Production, Preview, Development |
| `VITE_REDIRECT_URI` | `https://assistente-juridico-p.vercel.app` | Production |
| `VITE_GOOGLE_API_KEY` | `[SUA-API-KEY]` (opcional) | Production, Preview, Development |

3. Clique em **Save**

### Passo 2: Redeploy

```bash
# Opção 1: Via Git
git add .
git commit -m "fix: corrigir OAuth para produção Vercel"
git push

# Opção 2: Via Vercel Dashboard
# Vá em Deployments → Latest → Redeploy
```

---

## 📝 Configuração Google Cloud Console

### URLs que DEVEM estar autorizadas

1. Acesse: https://console.cloud.google.com/apis/credentials

2. Selecione seu projeto

3. Clique no **Client ID OAuth 2.0**

4. Em **Authorized JavaScript origins**, adicione:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```

5. Em **Authorized redirect URIs**, adicione:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```

6. Clique em **Save**

---

## 🧪 Como Testar

### 1. Verificar Variáveis (Local)
```bash
./check-oauth-config.sh
```

### 2. Testar em Produção
1. Acesse: https://assistente-juridico-p.vercel.app
2. Aguarde carregar
3. Clique no botão **"Sign in with Google"**
4. ✅ Popup do Google deve abrir
5. Faça login
6. ✅ App deve carregar dashboard

---

## 🔍 Troubleshooting

### Erro: "Origin mismatch"
**Causa**: URL não autorizada no Google Cloud Console  
**Solução**: Adicione a URL exata nas configurações OAuth (passo acima)

### Erro: "Missing client ID"
**Causa**: Variável `VITE_GOOGLE_CLIENT_ID` não configurada no Vercel  
**Solução**: Adicione a variável e faça redeploy

### Popup não abre
**Causa**: Script do Google bloqueado por CSP ou AdBlocker  
**Solução**: 
- Desabilite AdBlocker temporariamente
- Verifique console do browser (F12) por erros CSP

### App fica carregando
**Causa**: Código ainda está bloqueando produção  
**Solução**: 
- Verifique se o commit foi deployado
- Force refresh (Ctrl+Shift+R)
- Limpe cache do browser

---

## 📊 Checklist de Produção

- [x] Código corrigido em `GoogleAuth.tsx`
- [ ] Variáveis configuradas no Vercel
- [ ] URLs autorizadas no Google Cloud Console
- [ ] Deploy realizado
- [ ] Teste em https://assistente-juridico-p.vercel.app
- [ ] Teste em https://assistente-juridico-github.vercel.app

---

## 🎯 Resultado Esperado

Após configuração:

1. ✅ App carrega normalmente em produção
2. ✅ Botão "Sign in with Google" aparece
3. ✅ Popup do Google abre ao clicar
4. ✅ Login funciona corretamente
5. ✅ Dashboard carrega após autenticação

---

## 📞 Suporte

Se o problema persistir após seguir este guia:

1. Verifique logs do Vercel: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/logs
2. Verifique console do browser (F12 → Console)
3. Rode diagnóstico: `./check-oauth-config.sh`
4. Verifique se commit foi deployado em: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/deployments

---

**Data**: 2024-12-01  
**Status**: ✅ Correção de código aplicada, aguardando configuração de variáveis Vercel
