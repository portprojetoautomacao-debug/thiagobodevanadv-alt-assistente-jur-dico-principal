# 🌐 Plataformas Gratuitas para Deploy

> Comparação completa de plataformas gratuitas para hospedar o Assistente Jurídico PJe

## 📊 Comparação Rápida

| Plataforma | Gratuito | Fácil Deploy | SSL | Build Auto | Sleep | Recomendação |
|------------|----------|--------------|-----|------------|-------|--------------|
| **Vercel** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ❌ | 🥇 Melhor opção |
| **Render** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ✅ | 🥈 Ótima alternativa |
| **Netlify** | ✅ | ⭐⭐⭐⭐⭐ | ✅ | ✅ | ❌ | 🥉 Bom para sites estáticos |
| **Railway** | ✅* | ⭐⭐⭐⭐ | ✅ | ✅ | ❌ | 💰 $5/mês grátis |
| **Fly.io** | ✅* | ⭐⭐⭐ | ✅ | ✅ | ✅ | ⚙️ Para devs avançados |
| **Cloudflare Pages** | ✅ | ⭐⭐⭐⭐ | ✅ | ✅ | ❌ | ⚡ Super rápido |

**Legenda:**
- ✅ Sim / Incluído
- ❌ Não
- ✅* Requer cartão de crédito (mas não cobra no free tier)

## 🥇 Vercel (Recomendado)

### ✅ Vantagens

- **Sem sleep**: Aplicação sempre ativa
- **Deploy ultra-rápido**: ~30 segundos
- **Preview automático**: Deploy de cada PR
- **Edge Functions**: APIs serverless rápidas
- **Analytics incluído**: Métricas de performance
- **100 GB/mês** de banda
- **Integração perfeita** com este projeto (já configurado)

### ❌ Desvantagens

- Requer configuração de variáveis de ambiente
- Limitado a 1 projeto pessoal no plano gratuito

### 📖 Guia Completo

→ [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md)  
→ [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### 🚀 Deploy em 3 Passos

1. **Conecte ao GitHub**: [vercel.com/new](https://vercel.com/new)
2. **Configure variáveis**: Veja [VERCEL_ENV_CHECKLIST.md](./VERCEL_ENV_CHECKLIST.md)
3. **Deploy**: Automático!

---

## 🥈 Render (Ótima Alternativa)

### ✅ Vantagens

- **100% gratuito**: Sem cartão de crédito
- **750 horas/mês**: Suficiente para 1 app rodando 24/7
- **Deploy automático**: A cada push no GitHub
- **SSL grátis**: HTTPS automático
- **Interface simples**: Muito fácil de usar
- **Logs em tempo real**: Debugging facilitado

### ❌ Desvantagens

- **Sleep após 15 min**: Primeira requisição demora ~30-60s
- **512 MB RAM**: Pode ser limitado
- **100 GB/mês** de banda

### 📖 Guia Completo

→ [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md)

### 🚀 Deploy em 5 Passos

1. **Criar conta**: [render.com](https://render.com)
2. **Conectar GitHub**: Autorize o repositório
3. **Configurar service**: Use o `render.yaml` do projeto
4. **Adicionar env vars**: Configure variáveis necessárias
5. **Deploy**: Automático via `render.yaml`!

**Dica:** Use [UptimeRobot](https://uptimerobot.com/) (grátis) para fazer ping a cada 5 min e evitar o sleep.

---

## 🥉 Netlify

### ✅ Vantagens

- **CDN global**: Performance excelente
- **100 GB/mês** de banda
- **Sem sleep**: Aplicação sempre ativa
- **Deploy automático**: GitHub integration
- **Forms grátis**: Formulários sem backend
- **Muito fácil**: Deploy com drag & drop

### ❌ Desvantagens

- Menos ideal para aplicações com APIs serverless complexas
- Build minutes limitados (300 min/mês)

### 📖 Guia Completo

→ [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md)

### 🚀 Deploy Rápido

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod

# Ou via interface web em netlify.com
```

### ⚙️ netlify.toml (criar na raiz)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20"
```

---

## 💰 Railway

### ✅ Vantagens

- **$5/mês grátis**: Crédito mensal
- **Sem sleep**: Aplicação sempre ativa
- **PostgreSQL grátis**: Banco de dados incluído
- **Logs excelentes**: Interface muito boa
- **Deploy rápido**: ~2 minutos

### ❌ Desvantagens

- **Requer cartão**: Mesmo para plano gratuito
- **Créditos limitados**: Pode acabar antes do fim do mês
- **Menos intuitivo**: Curva de aprendizado maior

### 📖 Guia Completo

→ [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md)

### 🚀 Deploy em 4 Passos

1. **Criar conta**: [railway.app](https://railway.app)
2. **Novo projeto**: GitHub Repo
3. **Configurar vars**: Settings → Variables
4. **Deploy**: Automático!

### 📋 Variáveis Necessárias

```
NODE_VERSION=20
VITE_GOOGLE_CLIENT_ID=...
VITE_REDIRECT_URI=https://seu-app.up.railway.app
GITHUB_TOKEN=...
GITHUB_RUNTIME_PERMANENT_NAME=...
```

---

## ⚙️ Fly.io

### ✅ Vantagens

- **Global edge network**: Muito rápido
- **PostgreSQL grátis**: 3 GB storage
- **Controle total**: Dockerfile customizado
- **Múltiplas regiões**: Deploy global

### ❌ Desvantagens

- **Requer cartão**: Para verificação
- **Mais complexo**: Precisa entender Docker
- **CLI obrigatória**: Sem interface web simples

### 📖 Setup Necessário

```bash
# 1. Instalar flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Criar app
fly launch

# 4. Deploy
fly deploy
```

### 📄 Dockerfile (criar na raiz)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "8080"]
EXPOSE 8080
```

### 📄 fly.toml (criar na raiz)

```toml
app = "assistente-juridico-pje"
primary_region = "gru" # São Paulo

[build]

[env]
  NODE_VERSION = "20"
  VITE_APP_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  memory = '512mb'
  cpu_kind = 'shared'
  cpus = 1
```

---

## ⚡ Cloudflare Pages

### ✅ Vantagens

- **CDN global**: Performance excepcional
- **Ilimitado banda**: Sem limites!
- **Sem sleep**: Sempre ativo
- **500 builds/mês**: Muito generoso
- **Workers grátis**: 100k req/dia

### ❌ Desvantagens

- Menos recursos para apps complexas
- Documentação pode ser confusa

### 🚀 Deploy via Git

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Connect GitHub**
3. Selecione o repositório
4. Configure:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Environment variables**: Adicione as variáveis necessárias

### 🚀 Deploy via CLI

```bash
# 1. Instalar Wrangler
npm install -g wrangler

# 2. Login
wrangler login

# 3. Build
npm run build

# 4. Deploy
wrangler pages deploy dist
```

---

## 📊 Matriz de Decisão

### Use **Vercel** se:
- ✅ Quer a melhor performance
- ✅ Precisa de preview automático em PRs
- ✅ Quer deploy instantâneo
- ✅ Aplicação precisa estar sempre rápida

### Use **Render** se:
- ✅ Quer algo 100% gratuito (sem cartão)
- ✅ Não se importa com sleep
- ✅ Prefere interface super simples
- ✅ Quer configuração via `render.yaml`

### Use **Netlify** se:
- ✅ Aplicação é principalmente frontend
- ✅ Quer CDN global excelente
- ✅ Precisa de forms sem backend
- ✅ Quer deploy por drag & drop

### Use **Railway** se:
- ✅ Precisa de banco de dados PostgreSQL
- ✅ Tem cartão e quer $5/mês grátis
- ✅ Aplicação precisa estar sempre ativa
- ✅ Prefere logs mais detalhados

### Use **Fly.io** se:
- ✅ É desenvolvedor avançado
- ✅ Quer controle total (Docker)
- ✅ Precisa de múltiplas regiões
- ✅ Tem experiência com containers

### Use **Cloudflare Pages** se:
- ✅ Performance é prioridade máxima
- ✅ Precisa de banda ilimitada
- ✅ Quer usar Workers para APIs
- ✅ Aplicação é principalmente estática

---

## 🎯 Recomendação Final

### Para produção séria:
**🥇 Vercel** - Melhor performance, sem sleep, preview automático

### Para projetos pessoais/teste:
**🥈 Render** - 100% grátis, fácil de usar, sem cartão

### Para sites estáticos simples:
**🥉 Netlify** ou **Cloudflare Pages** - CDN global, super rápido

---

## 📖 Guias Detalhados

- 📘 [GUIA_DEPLOY_RENDER.md](./GUIA_DEPLOY_RENDER.md) - Deploy no Render (completo)
- 📗 [GUIA_DEPLOY_NETLIFY.md](./GUIA_DEPLOY_NETLIFY.md) - Deploy no Netlify
- 📕 [GUIA_DEPLOY_RAILWAY.md](./GUIA_DEPLOY_RAILWAY.md) - Deploy no Railway
- 📙 [GUIA_RAPIDO_DEPLOY.md](./GUIA_RAPIDO_DEPLOY.md) - Deploy no Vercel

---

## 💡 Dicas Importantes

### 🔐 Segurança

- **Nunca** commite variáveis de ambiente no código
- Use variáveis de ambiente em **todas** as plataformas
- Configure OAuth corretamente para cada URL de produção

### ⚡ Performance

- Use CDN quando possível (Vercel, Netlify, Cloudflare)
- Configure cache headers corretamente
- Minimize o tamanho do bundle

### 💰 Custos

- **Gratuito permanente**: Vercel, Netlify, Cloudflare Pages
- **Gratuito com limites**: Render (sleep), Railway ($5/mês)
- **Monitore uso**: Para não exceder limites

---

**Escolha a plataforma ideal para suas necessidades e faça o deploy em minutos! 🚀**
