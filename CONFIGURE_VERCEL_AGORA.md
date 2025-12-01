# 🚀 INSTRUÇÕES URGENTES - Configure Agora no Vercel

## ⏰ AÇÃO IMEDIATA NECESSÁRIA

O código foi corrigido e está deployando agora. **MAS você precisa adicionar as variáveis de ambiente no Vercel para o login funcionar!**

---

## 📋 Passo a Passo (5 minutos)

### 1️⃣ Acesse as Configurações do Vercel

Clique neste link:
👉 **https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables**

### 2️⃣ Adicione a Variável VITE_GOOGLE_CLIENT_ID

1. Clique em **"Add New"**
2. Preencha:
   - **Name**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: Cole o Client ID do Google
   - **Environments**: Selecione **Production, Preview, Development** (todos)
3. Clique em **Save**

### 3️⃣ (Opcional) Adicione VITE_REDIRECT_URI

1. Clique em **"Add New"** novamente
2. Preencha:
   - **Name**: `VITE_REDIRECT_URI`
   - **Value**: `https://assistente-juridico-p.vercel.app`
   - **Environments**: Apenas **Production**
3. Clique em **Save**

### 4️⃣ Aguarde o Deploy Automático

- O Vercel vai redeploy automaticamente após salvar as variáveis
- Aguarde ~2 minutos
- Acompanhe em: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/deployments

---

## 🔑 Como Obter o Google Client ID

### Se você JÁ TEM o Client ID:

- Use o mesmo que está no `.env` local (se houver)
- Ou pegue do Google Cloud Console

### Se você NÃO TEM o Client ID:

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Clique em **"+ CREATE CREDENTIALS"**
3. Selecione **"OAuth client ID"**
4. Escolha **"Web application"**
5. Nome: `Assistente Jurídico PJe - Produção`
6. Em **Authorized JavaScript origins**, adicione:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```
7. Em **Authorized redirect URIs**, adicione:
   ```
   https://assistente-juridico-p.vercel.app
   https://assistente-juridico-github.vercel.app
   ```
8. Clique em **CREATE**
9. Copie o **Client ID** (formato: `xxx.apps.googleusercontent.com`)

---

## ✅ Verificação Final

Após configurar e aguardar o deploy:

1. Acesse: **https://assistente-juridico-p.vercel.app**
2. A página deve carregar (não ficar travada)
3. Deve aparecer o botão **"Sign in with Google"**
4. Ao clicar, o popup do Google deve abrir
5. Faça login
6. Dashboard deve carregar ✅

---

## 🆘 Ajuda Rápida

### O que está acontecendo agora?

- ✅ Código corrigido e em deploy
- ⏳ Aguardando você configurar variáveis no Vercel
- ⏳ Aguardando você autorizar URLs no Google Cloud Console

### Por que preciso fazer isso?

Por segurança, credenciais OAuth não ficam no código (git). Elas ficam como **variáveis de ambiente** no Vercel.

### Quanto tempo leva?

- Configurar variáveis: **2 minutos**
- Deploy automático: **2 minutos**
- **Total: ~5 minutos**

---

## 📞 Ainda com Dúvidas?

Execute o diagnóstico local:

```bash
./check-oauth-config.sh
```

Veja o guia completo:

```bash
cat OAUTH_VERCEL_FIX.md
```

---

**🎯 RESUMO**: Configure as variáveis agora no Vercel → Aguarde deploy → Teste o app!
