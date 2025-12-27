# 🔐 Configuração do GitHub OAuth

## 📋 URLs de Configuração

### Para o GitHub App:

**URL da página inicial:**
```
https://assistente-juridico-github.vercel.app
```

**URL de retorno de chamada (OAuth callback):**
```
https://assistente-juridico-github.vercel.app/api/auth/github/callback
```

**URL de configuração (opcional):**
```
https://assistente-juridico-github.vercel.app/settings
```

---

## 🚀 Passo a Passo Completo

### 1. Criar GitHub App

1. Acesse: https://github.com/settings/apps/new

2. Preencha os campos:

   **Basic Information:**
   - **Nome do aplicativo**: `Assistente Jurídico PJe`
   - **Homepage URL**: `https://assistente-juridico-github.vercel.app`
   - **Descrição**: `Sistema inteligente de gestão jurídica com IA`

   **Identificação e autorização de usuários:**
   - ✅ Marque: "Solicitar autorização do usuário (OAuth) durante a instalação"
   - **Callback URL**: `https://assistente-juridico-github.vercel.app/api/auth/github/callback`
   - ✅ Marque: "Expirar tokens de autorização do usuário" (para refresh tokens)

   **Após a instalação:**
   - **URL de configuração**: `https://assistente-juridico-github.vercel.app/settings` (opcional)

   **Webhook:**
   - ❌ Desmarque "Ativo" (não precisamos de webhooks por enquanto)

   **Permissões:**
   - **Account permissions:**
     - Email addresses: `Read-only`
   - **Repository permissions:** (nenhuma necessária inicialmente)

   **Onde instalar:**
   - ✅ Marque: "Somente nesta conta" (para testes)

3. Clique em **"Create GitHub App"**

### 2. Obter Credenciais

Após criar o app, você verá:

1. **App ID**: Anote (ex: `123456`)
2. **Client ID**: Anote (ex: `Iv1.abc123def456`)
3. **Client Secret**:
   - Clique em "Generate a new client secret"
   - Copie e salve (só aparece uma vez!)

### 3. Configurar no Vercel

1. Acesse: https://vercel.com/thiagos-projects-9834ca6f/assistente-juridico-github/settings/environment-variables

2. Adicione as variáveis:

   ```bash
   # GitHub OAuth
   GITHUB_CLIENT_ID=Iv1.abc123def456
   GITHUB_CLIENT_SECRET=seu-client-secret-aqui

   # URL da aplicação (para redirects)
   VERCEL_URL=https://assistente-juridico-github.vercel.app
   ```

3. Clique em **"Save"**

4. **Redeploy** a aplicação para aplicar as variáveis

### 4. Configurar Localmente (Desenvolvimento)

Crie um arquivo `.env` na raiz do projeto:

```bash
# .env
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=seu-client-secret-aqui
VERCEL_URL=http://localhost:5173
```

**⚠️ IMPORTANTE:** Adicione `.env` ao `.gitignore` (já está)

### 5. Testar Localmente

```bash
# Instalar dependências
npm install

# Rodar em modo dev
npm run dev

# Testar OAuth
# Acesse: http://localhost:5173/api/auth/github/login
```

---

## 🧪 Testando a Integração

### 1. Fluxo Completo

```bash
# 1. Iniciar autenticação
GET http://localhost:5173/api/auth/github/login
# → Redireciona para github.com/login/oauth/authorize

# 2. Usuário autoriza no GitHub
# → GitHub redireciona para /api/auth/github/callback?code=...

# 3. Callback processa e retorna
# → Redireciona para / com token nos query params
```

### 2. Verificar Callback

```bash
# Após autorizar no GitHub, você deve ver:
https://assistente-juridico-github.vercel.app/?github_token=gho_...&github_user=seu-username&github_name=Seu+Nome
```

### 3. Debugar Erros

Se aparecer `?error=github_auth_failed`:

1. **Verificar Client ID e Secret** no Vercel
2. **Verificar Callback URL** no GitHub App
3. **Ver logs** no Vercel: https://vercel.com/thiagos-projects-9834ca6f/assistente-juridico-github/logs

---

## 🔒 Segurança

### ⚠️ IMPORTANTE: Token Handling

**Estado atual (para desenvolvimento rápido):**
- ✅ Token retorna nos query parameters
- ❌ Não é seguro para produção

**TODO para produção:**
1. Implementar cookies HTTP-only
2. Usar sessão server-side
3. Implementar CSRF tokens
4. Adicionar rate limiting

### Exemplo de Cookie Seguro (TODO)

```typescript
// api/auth/github/callback.ts
import cookie from 'cookie';

// ...após obter accessToken

res.setHeader(
  'Set-Cookie',
  cookie.serialize('github_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  })
);

return res.redirect('/');
```

---

## 📁 Arquivos Criados

### 1. `/api/auth/github/login.ts`
Inicia o fluxo OAuth (redireciona para GitHub)

### 2. `/api/auth/github/callback.ts`
Processa o callback e troca code por token

### 3. Este arquivo
Documentação de setup

---

## 🔄 Fluxo Completo OAuth

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ 1. Clica "Login com GitHub"
       ▼
┌─────────────────────────────────┐
│ GET /api/auth/github/login      │
│ - Gera state (CSRF)             │
│ - Redireciona para GitHub       │
└──────────────┬──────────────────┘
               │
               ▼
       ┌──────────────┐
       │   GitHub     │ 2. Usuário autoriza
       └──────┬───────┘
              │
              ▼
┌───────────────────────────────────────┐
│ GET /api/auth/github/callback         │
│ - Recebe code                         │
│ - Troca por access_token              │
│ - Busca dados do usuário              │
│ - Cria sessão                         │
│ - Redireciona para app com token     │
└──────────────┬────────────────────────┘
               │
               ▼
       ┌──────────────┐
       │  Dashboard   │ 3. Usuário autenticado
       └──────────────┘
```

---

## 🎯 Resumo Rápido

**URLs para configurar no GitHub:**
- Homepage: `https://assistente-juridico-github.vercel.app`
- Callback: `https://assistente-juridico-github.vercel.app/api/auth/github/callback`

**Variáveis no Vercel:**
```bash
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=seu-secret-aqui
VERCEL_URL=https://assistente-juridico-github.vercel.app
```

**Testar:**
```bash
# Produção
https://assistente-juridico-github.vercel.app/api/auth/github/login

# Local
http://localhost:5173/api/auth/github/login
```

---

## 📚 Recursos

- **GitHub Apps Docs**: https://docs.github.com/en/apps
- **OAuth Flow**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- **Scopes**: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps

---

**Criado em:** 23/12/2025
**Versão:** 1.0
**Status:** ✅ Pronto para usar
