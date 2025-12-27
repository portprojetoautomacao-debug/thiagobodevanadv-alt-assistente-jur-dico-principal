# 🚀 Configuração de Deploy Automático no Vercel

## ✅ O que já está configurado

O repositório JÁ possui tudo necessário para deploy automático:
- ✅ `vercel.json` - Configuração do projeto
- ✅ `.github/workflows/deploy.yml` - GitHub Actions para deploy
- ✅ Build otimizado e sem erros TypeScript

## 🔑 Passo 1: Obter Token do Vercel

### 1.1. Acessar o Vercel
1. Acesse https://vercel.com
2. Faça login com sua conta (GitHub recomendado)

### 1.2. Criar Token de API
1. Vá em **Settings** → **Tokens** → https://vercel.com/account/tokens
2. Clique em **Create Token**
3. Nome sugerido: `GitHub Actions Deploy`
4. Escopo: **Full Access** (ou selecione projetos específicos)
5. Copie o token gerado (começa com `ver_...`)

⚠️ **IMPORTANTE**: Guarde esse token em lugar seguro - ele só aparece uma vez!

---

## 🏢 Passo 2: Obter IDs do Projeto Vercel

### 2.1. Criar Projeto no Vercel (se ainda não existe)
1. Acesse https://vercel.com/new
2. Conecte o repositório: `portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal`
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Clique em **Deploy** (primeiro deploy)

### 2.2. Obter VERCEL_ORG_ID e VERCEL_PROJECT_ID

**Opção A: Via CLI (recomendado)**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Vincular projeto (execute na pasta do repositório)
vercel link

# Os IDs serão salvos em .vercel/project.json
cat .vercel/project.json
```

**Opção B: Via Interface Web**
1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **General**
3. **Project ID**: Copie o valor em "Project ID"
4. **Organization ID**:
   - Vá em https://vercel.com/account
   - Na URL você verá algo como `vercel.com/teams/SEU_ORG_ID`
   - Ou veja no dropdown do projeto

---

## 🔐 Passo 3: Configurar Secrets no GitHub

### 3.1. Acessar Configurações do Repositório
1. Vá para https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets/actions
2. Clique em **New repository secret**

### 3.2. Adicionar os 3 Secrets Obrigatórios

| Secret Name | Valor | Onde Obter |
|-------------|-------|------------|
| `VERCEL_TOKEN` | `ver_xxxxx...` | Passo 1.2 - Token criado no Vercel |
| `VERCEL_ORG_ID` | `team_xxxxx` ou `user_xxxxx` | Passo 2.2 - Organization ID |
| `VERCEL_PROJECT_ID` | `prj_xxxxx` | Passo 2.2 - Project ID do projeto |

**Para cada secret:**
1. Clique em **New repository secret**
2. **Name**: Cole exatamente o nome (ex: `VERCEL_TOKEN`)
3. **Value**: Cole o valor correspondente
4. Clique em **Add secret**

### 3.3. Secrets Opcionais (mas recomendados)

Para funcionalidades completas, adicione também:

| Secret Name | Descrição | Obrigatório? |
|-------------|-----------|--------------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Opcional |
| `VITE_GOOGLE_API_KEY` | Google API Key | Opcional |
| `VITE_GEMINI_API_KEY` | Gemini AI API Key | Recomendado |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Recomendado |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis Token | Recomendado |

---

## ⚡ Passo 4: Testar Deploy Automático

### 4.1. Deploy Manual (Teste)
1. Acesse https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions
2. Selecione workflow **Deploy**
3. Clique em **Run workflow** → **Run workflow**
4. Aguarde conclusão (~3-5 minutos)

### 4.2. Deploy Automático (Produção)
Agora todo push para `main` fará deploy automaticamente:

```bash
# Fazer qualquer alteração
echo "# Test deploy" >> README.md

# Commit e push
git add README.md
git commit -m "test: testar deploy automático"
git push origin main

# O GitHub Actions iniciará automaticamente
# Acompanhe em: https://github.com/.../actions
```

---

## 🎯 Como Funciona o Deploy Automático

### Fluxo Completo
```
Push para main
    ↓
GitHub Actions: CI Workflow
    ↓ (se passar)
GitHub Actions: Deploy Workflow
    ↓
Vercel Build
    ↓
Deploy Production (https://seu-projeto.vercel.app)
```

### Triggers Configurados
- ✅ **Push para `main`**: Deploy production automático
- ✅ **Pull Request**: Deploy preview (URL temporária)
- ✅ **Manual**: Botão "Run workflow" no GitHub Actions

---

## 🔍 Verificar Status do Deploy

### Via GitHub
1. Acesse https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions
2. Veja o status dos workflows (✅ verde = sucesso)

### Via Vercel
1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Veja histórico de deploys

### Via Badge (opcional)
Adicione ao README.md:
```markdown
[![Deploy](https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/workflows/deploy.yml/badge.svg)](https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions/workflows/deploy.yml)
```

---

## 🐛 Troubleshooting

### Erro: "VERCEL_TOKEN is not configured"
**Solução**: Verifique se o secret foi adicionado corretamente no GitHub (Passo 3)

### Erro: "Invalid token"
**Solução**:
1. Gere um novo token no Vercel
2. Atualize o secret `VERCEL_TOKEN` no GitHub

### Erro: "Project not found"
**Solução**:
1. Verifique se `VERCEL_PROJECT_ID` está correto
2. Execute `vercel link` localmente para verificar

### Deploy trava em "Building"
**Solução**:
1. Verifique logs do Vercel
2. Confirme que `npm run build` funciona localmente
3. Verifique se todas as variáveis de ambiente estão configuradas

### Deploy preview não aparece em PRs
**Solução**:
1. Certifique-se de que o PR não é draft
2. Verifique se o workflow tem permissões de escrita em PRs

---

## 📚 Recursos Úteis

- [Documentação Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel + GitHub Integration](https://vercel.com/docs/concepts/git/vercel-for-github)

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Token do Vercel criado e testado
- [ ] Secret `VERCEL_TOKEN` adicionado no GitHub
- [ ] Secret `VERCEL_ORG_ID` adicionado no GitHub
- [ ] Secret `VERCEL_PROJECT_ID` adicionado no GitHub
- [ ] Deploy manual executado com sucesso
- [ ] Push para main gerou deploy automático
- [ ] URL de produção acessível e funcionando

---

**🎉 Pronto! Seu deploy automático está configurado!**

Qualquer push para `main` agora fará deploy automaticamente no Vercel.
