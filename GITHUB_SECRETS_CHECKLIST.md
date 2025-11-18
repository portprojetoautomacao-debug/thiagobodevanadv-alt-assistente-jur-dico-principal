# ✅ Checklist: GitHub Secrets Configuration

## 📋 Quick Setup Guide

Este documento é um guia rápido para configurar os secrets necessários para deploy automático.

---

## 🔑 Secrets Obrigatórios

Acesse: **GitHub → Settings → Secrets and variables → Actions → New repository secret**

### 1. Vercel Deploy Secrets

| Secret Name | Valor | Status | Onde Obter |
|-------------|-------|--------|------------|
| **VERCEL_TOKEN** | `ROh3NzABqd1N5Ksm68N3n68L` | ✅ Fornecido | [Vercel Settings → Tokens](https://vercel.com/account/tokens) |
| **VERCEL_ORG_ID** | `team_xxxxx` ou `user_xxxxx` | ⚠️ Pendente | Via `vercel link` ou Vercel Dashboard |
| **VERCEL_PROJECT_ID** | `prj_xxxxx` | ⚠️ Pendente | Via `vercel link` ou Vercel Dashboard |

### 2. Google OAuth Secrets

| Secret Name | Valor | Status | Onde Obter |
|-------------|-------|--------|------------|
| **VITE_GOOGLE_CLIENT_ID** | `xxxxx.apps.googleusercontent.com` | ⚠️ Pendente | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **VITE_GOOGLE_API_KEY** | `AIzaSyxxxxx` | ⚠️ Pendente | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **VITE_REDIRECT_URI** | `https://seu-app.vercel.app` | ⚠️ Pendente | URL do seu app na Vercel |

---

## 🚀 Passo a Passo Rápido

### Etapa 1: Obter IDs do Vercel

```bash
# 1. Instalar Vercel CLI
npm install -g vercel@latest

# 2. Fazer login
vercel login

# 3. Navegar até o projeto
cd /caminho/para/assistente-juridico-p

# 4. Vincular ao projeto
vercel link

# 5. Ver os IDs
cat .vercel/project.json
```

Saída esperada:
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxxx",    ← Use como VERCEL_ORG_ID
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxxx"   ← Use como VERCEL_PROJECT_ID
}
```

### Etapa 2: Adicionar Secrets no GitHub

1. Vá para: https://github.com/thiagobodevan-a11y/assistente-jurdico-p/settings/secrets/actions
2. Clique em **"New repository secret"**
3. Adicione cada secret da tabela acima
4. Salve cada um

### Etapa 3: Configurar Variáveis no Vercel

**Importante:** As variáveis de ambiente também devem estar no Vercel!

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione as seguintes variáveis:

```
VITE_GOOGLE_CLIENT_ID     = [seu-client-id].apps.googleusercontent.com
VITE_GOOGLE_API_KEY       = AIzaSyxxxxx...
VITE_REDIRECT_URI         = https://seu-app.vercel.app
VITE_APP_ENV              = production
```

5. Selecione os ambientes: **Production**, **Preview**, **Development**
6. Salve e faça um redeploy

---

## ✅ Verificação

### Checklist de Configuração

Marque conforme for completando:

- [ ] **Vercel CLI instalado** (`npm install -g vercel`)
- [ ] **Vercel login realizado** (`vercel login`)
- [ ] **Projeto vinculado** (`vercel link`)
- [ ] **IDs obtidos** (`.vercel/project.json`)
- [ ] **VERCEL_TOKEN** adicionado ao GitHub
- [ ] **VERCEL_ORG_ID** adicionado ao GitHub
- [ ] **VERCEL_PROJECT_ID** adicionado ao GitHub
- [ ] **VITE_GOOGLE_CLIENT_ID** adicionado ao GitHub
- [ ] **VITE_GOOGLE_API_KEY** adicionado ao GitHub
- [ ] **VITE_REDIRECT_URI** adicionado ao GitHub
- [ ] **Variáveis adicionadas no Vercel Dashboard**
- [ ] **Deploy manual testado** (Actions → Deploy → Run workflow)
- [ ] **Deploy em PR testado** (Criar PR de teste)

### Teste Rápido

```bash
# 1. Criar branch de teste
git checkout -b test/github-actions-deploy
echo "# Test" >> TEST_DEPLOY.md
git add TEST_DEPLOY.md
git commit -m "test: deploy automático"
git push origin test/github-actions-deploy

# 2. Abrir PR no GitHub
# - Ir para o repositório
# - Criar Pull Request
# - Aguardar workflow executar
# - Verificar comentário com URL de preview
```

---

## 🔧 Troubleshooting Rápido

### Problema: Deploy falha com "Invalid token"
**Solução:** Verifique se o token `ROh3NzABqd1N5Ksm68N3n68L` está correto no GitHub Secrets

### Problema: "Project not found"
**Solução:** Execute `vercel link` novamente e atualize `VERCEL_PROJECT_ID`

### Problema: Build falha com "Missing environment variables"
**Solução:** Adicione as variáveis do Google OAuth no Vercel Dashboard também

### Problema: App não carrega após deploy
**Solução:** Verifique se as variáveis de ambiente estão configuradas corretamente no Vercel

---

## 📚 Documentação Completa

Para informações detalhadas, consulte:

- **[CONFIGURACAO_VERCEL_TOKEN.md](./CONFIGURACAO_VERCEL_TOKEN.md)** - Guia completo do token Vercel
- **[GITHUB_ACTIONS_DEPLOY_GUIDE.md](./GITHUB_ACTIONS_DEPLOY_GUIDE.md)** - Guia dos workflows
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Documentação do deploy Vercel

---

## 🎯 Status da Configuração

| Item | Status | Data |
|------|--------|------|
| Token Vercel criado | ✅ Completo | 18/11/2025 |
| Workflows atualizados | ✅ Completo | 18/11/2025 |
| Documentação criada | ✅ Completo | 18/11/2025 |
| Secrets configurados | ⚠️ Pendente | - |
| Deploy testado | ⚠️ Pendente | - |

---

## 📝 Notas

1. **Token Expiration:** O token Vercel `ROh3NzABqd1N5Ksm68N3n68L` expira em **17 de maio de 2026**
2. **Renovação:** Adicione um lembrete para renovar o token antes da data de expiração
3. **Segurança:** Nunca commite os secrets no código - use apenas GitHub Secrets e Vercel Environment Variables
4. **AI Agent Access:** O agente de IA do GitHub Copilot poderá acessar as URLs de preview para testar o app

---

**Última atualização:** 18 de novembro de 2025
**Configurado por:** GitHub Copilot Agent
