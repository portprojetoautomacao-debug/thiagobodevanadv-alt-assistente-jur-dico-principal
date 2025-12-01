# 🔍 Debug OAuth em Produção

## ✅ Configurações Confirmadas

- ✅ Código corrigido e deployado (commit `bdc6aa7`)
- ✅ `VITE_GOOGLE_CLIENT_ID` configurado no Vercel
- ✅ URLs de produção habilitadas no código:
  - `assistente-juridico-p.vercel.app`
  - `assistente-juridico-github.vercel.app`

---

## 🧪 Teste Passo a Passo

### 1. Abra o Console do Browser (F12)

1. Acesse: https://assistente-juridico-p.vercel.app
2. Pressione **F12** para abrir DevTools
3. Vá na aba **Console**
4. Vá na aba **Network**

### 2. Verifique os Erros no Console

Procure por mensagens de erro como:

```
❌ "Google OAuth não está configurado"
   → SOLUÇÃO: Variável VITE_GOOGLE_CLIENT_ID não está chegando no build
   → Verifique se redeploy foi feito após adicionar variável

❌ "Invalid OAuth client"
   → SOLUÇÃO: Client ID incorreto ou URL não autorizada no Google Console

❌ "Origin mismatch" ou "redirect_uri_mismatch"
   → SOLUÇÃO: Adicione as URLs no Google Cloud Console

❌ "Failed to load gsi/client"
   → SOLUÇÃO: Script do Google bloqueado por CSP ou firewall
```

### 3. Verifique o Network (Rede)

Na aba **Network**, procure por:

```
✅ accounts.google.com/gsi/client  → Status 200
   Se falhar: Problema de firewall/CSP

✅ Requests para https://assistente-juridico-p.vercel.app/api/*
   Se 401/403: Problema de autenticação backend
```

### 4. Verifique Variáveis de Ambiente

Abra o console e digite:

```javascript
// Cole isso no console do browser
console.log(
  "Client ID:",
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20) + "..."
);
console.log("Env:", import.meta.env.MODE);
console.log("Hostname:", window.location.hostname);
```

**Resultado esperado:**

```
Client ID: 123456789012-abc... (primeiros 20 chars)
Env: production
Hostname: assistente-juridico-p.vercel.app
```

**Se mostrar `undefined`:**

- ❌ Variável não está no build
- ✅ SOLUÇÃO: Force redeploy no Vercel

---

## 🔧 Soluções Rápidas

### Problema: Variável não aparece no build

**Causa**: Deploy foi feito ANTES de adicionar a variável

**Solução**:

1. Vá em: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/deployments
2. Clique no último deployment
3. Clique no botão **"Redeploy"** (canto superior direito)
4. Aguarde 2 minutos
5. Teste novamente

### Problema: "Origin mismatch"

**Solução**:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique no seu OAuth 2.0 Client ID
3. Em **Authorized JavaScript origins**, certifique-se que tem:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```
4. Em **Authorized redirect URIs**, adicione também:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```
5. Clique em **SAVE**
6. Aguarde 5 minutos para propagar
7. Teste novamente

### Problema: Script do Google não carrega

**Causa**: Bloqueado por AdBlocker ou CSP

**Solução**:

1. Desabilite AdBlocker/uBlock temporariamente
2. Teste em aba anônima
3. Teste em outro browser (Chrome/Firefox)

---

## 📊 Checklist de Verificação

Execute este checklist:

- [ ] Abri F12 → Console no browser
- [ ] Verifiquei se `VITE_GOOGLE_CLIENT_ID` aparece (console.log)
- [ ] Verifiquei erros no Console
- [ ] Verifiquei Network → gsi/client carrega (200)
- [ ] Testei com AdBlocker desabilitado
- [ ] Fiz redeploy após adicionar variável
- [ ] URLs estão autorizadas no Google Cloud Console
- [ ] Aguardei 5 minutos após salvar no Google Console

---

## 🎯 Teste Final

Se tudo estiver OK, você deve ver:

1. ✅ Página carrega normalmente (sem "carregando infinito")
2. ✅ Botão "Sign in with Google" aparece
3. ✅ Ao clicar, popup do Google abre
4. ✅ Faz login
5. ✅ Dashboard aparece

---

## 📸 Capturas de Tela Úteis

### Console OK:

```
✅ No errors
✅ Client ID: 123456...
✅ Script loaded: accounts.google.com/gsi/client
```

### Console COM PROBLEMA:

```
❌ Error: Google OAuth não está configurado
❌ TypeError: Cannot read property 'initialize' of undefined
❌ Failed to load resource: accounts.google.com/gsi/client
```

---

## 🆘 Ainda não Funciona?

Execute este comando no console do browser e me envie a saída:

```javascript
console.log(
  JSON.stringify(
    {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.substring(0, 20),
      mode: import.meta.env.MODE,
      hostname: window.location.hostname,
      hasGoogle: !!window.google,
      errors: document.querySelector(".text-destructive")?.textContent,
    },
    null,
    2
  )
);
```

---

**Última atualização**: 2024-12-01  
**Commit**: bdc6aa7
