# Guia de Deploy - Assistente Jurídico PJe

## Qual plataforma usar?

### 🎯 Recomendação: Use APENAS o Vercel

Você **NÃO precisa** do Render. O Vercel é suficiente e mais adequado para esta aplicação.

## Por que Vercel?

✅ **Vantagens do Vercel:**
- Integração perfeita com React + Vite
- Serverless functions automáticas (para as APIs do Spark)
- Deploy automático a cada push no GitHub
- Interface web simples e intuitiva
- SSL/HTTPS automático
- CDN global incluído
- Plano gratuito generoso

## Como fazer o deploy no Vercel (Passo a Passo)

### 1. Criar conta no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Sign Up"
3. Conecte com sua conta do GitHub

### 2. Importar o projeto
1. No dashboard do Vercel, clique em **"Add New Project"**
2. Selecione o repositório `assistente-jurdico-p`
3. Clique em **"Import"**

### 3. Configurar as variáveis de ambiente

**IMPORTANTE:** Antes de fazer o deploy, adicione estas variáveis:

#### Obrigatórias para o Spark funcionar:
```
GITHUB_RUNTIME_PERMANENT_NAME=97a1cb1e48835e0ecf1e
GITHUB_TOKEN=seu_token_do_github_aqui
```

#### Como obter o GITHUB_TOKEN:
1. Vá em [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token (classic)"
3. Dê um nome (ex: "Vercel Deploy")
4. Selecione os escopos: `repo` e `workflow`
5. Clique em "Generate token"
6. **Copie o token** (você só verá uma vez!)

#### Opcionais (para Google Calendar):
```
VITE_GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=sua_api_key
VITE_REDIRECT_URI=https://seu-app.vercel.app
VITE_APP_ENV=production
```

### 4. Deploy
1. Deixe as configurações padrão:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Clique em **"Deploy"**
3. Aguarde 1-2 minutos

### 5. Pronto! 🎉
Seu app estará disponível em `https://seu-app.vercel.app`

## Estrutura do Deploy

```
Vercel Deploy
│
├── Frontend (React/Vite)
│   └── Arquivos estáticos servidos do /dist
│
└── Serverless Functions (Node.js)
    ├── /api/spark-proxy.ts  → Proxy para GitHub Spark KV
    └── /api/llm-proxy.ts    → Proxy para GitHub Models AI
```

## E o Render?

O arquivo `render.yaml` pode ser **ignorado** se você usar o Vercel.

Ele estava lá de tentativas anteriores de deploy, mas **não é necessário** para o Vercel.

## Troubleshooting

### Erro 404 nas rotas `/_spark/*`
- Verifique se adicionou as variáveis de ambiente
- Confirme que `GITHUB_TOKEN` está correto
- Confirme que `GITHUB_RUNTIME_PERMANENT_NAME` está correto

### Build falhou
- Verifique os logs no dashboard do Vercel
- Confirme que o build funciona localmente: `npm run build`

### App carrega mas não funciona
- Abra o DevTools (F12) → Console
- Verifique se há erros de autenticação nas chamadas `/_spark/*`
- Confirme que o token do GitHub tem os escopos corretos

## Resumo

**Use apenas o Vercel!**
1. Conecte seu GitHub ao Vercel
2. Importe o repositório
3. Adicione as variáveis de ambiente
4. Deploy!

Não precisa do Render, Docker, ou qualquer outra ferramenta. O Vercel cuida de tudo.

## Mais Informações

Para detalhes completos sobre o deploy no Vercel, veja: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)
