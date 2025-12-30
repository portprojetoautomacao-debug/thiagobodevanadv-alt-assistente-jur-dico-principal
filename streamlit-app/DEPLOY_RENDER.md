# 🚀 Deploy no Render - Guia Completo

## 📋 Pré-requisitos

- Conta no [Render.com](https://render.com) (gratuita)
- Repositório GitHub conectado
- Chaves API necessárias (Gemini, Upstash Redis)

---

## 🎯 Opção 1: Deploy Automático via render.yaml

### Passo 1: Acesse o Render

```
https://dashboard.render.com/
```

### Passo 2: New → Blueprint

1. Clique em **New +** no topo
2. Selecione **Blueprint**
3. Conecte seu repositório GitHub:
   - `portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal`
4. Branch: `main`
5. **Blueprint Path:** `streamlit-app/render.yaml`

### Passo 3: Configure Secrets

O Render vai criar 2 serviços automaticamente:

#### **Backend** (`assistente-juridico-backend`)
Acesse Environment → Add Environment Variables:

```bash
GOOGLE_API_KEY=AIza...  # Sua chave do Google AI Studio (recomendado)
# ou GEMINI_API_KEY=AIza...  # compatibilidade com versões antigas do app
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxx...
DJEN_USERNAME=seu-cpf
DJEN_PASSWORD=sua-senha
```

#### **Frontend** (`assistente-juridico-frontend`)
Acesse Environment → Add Environment Variables:

```bash
GOOGLE_API_KEY=AIza...  # Mesma do backend (recomendado)
# ou GEMINI_API_KEY=AIza...  # compatibilidade com versões antigas do app
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxx...
BACKEND_URL=https://assistente-juridico-backend.onrender.com  # Ajuste se necessário
```

### Passo 4: Deploy!

Clique em **Apply** e aguarde ~5 minutos.

**URLs finais:**
- Frontend: `https://assistente-juridico-frontend.onrender.com`
- Backend API: `https://assistente-juridico-backend.onrender.com/api`

---

## 🎯 Opção 2: Deploy Manual (Tudo em Um)

Se preferir um único serviço rodando Streamlit + FastAPI juntos:

### Passo 1: New Web Service

```
Dashboard → New + → Web Service
```

### Passo 2: Configurar

| Campo | Valor |
|-------|-------|
| **Name** | `assistente-juridico-pje` |
| **Region** | Oregon (mais rápido) |
| **Branch** | `main` |
| **Root Directory** | `streamlit-app` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `streamlit run app.py --server.port $PORT --server.address 0.0.0.0` |

### Passo 3: Environment Variables

Adicione em Environment:

```bash
# Obrigatórias
GOOGLE_API_KEY=AIza...  # (recomendado)
# ou GEMINI_API_KEY=AIza...  # compatibilidade
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=Axxx...

# Opcionais
DJEN_USERNAME=seu-cpf
DJEN_PASSWORD=sua-senha
QDRANT_URL=https://xxx.qdrant.io
QDRANT_API_KEY=xxx
```

### Passo 4: Deploy

Clique em **Create Web Service** e aguarde ~3-5 minutos.

**URL final:** `https://assistente-juridico-pje.onrender.com`

---

## 🔧 Configurações Adicionais

### Health Checks

Render faz health check automático:
- **Backend:** `GET /api/health`
- **Frontend:** `GET /` (página Streamlit)

### Auto-Deploy

✅ **Ativado por padrão** - cada push na `main` faz deploy automático.

Para desabilitar:
```
Settings → Build & Deploy → Auto-Deploy: OFF
```

### Custom Domain

1. Settings → Custom Domain
2. Adicione seu domínio (ex: `app.seuescritorio.com.br`)
3. Configure DNS:
   ```
   CNAME app.seuescritorio.com.br → assistente-juridico-pje.onrender.com
   ```

### Logs e Monitoramento

```
Dashboard → Seu serviço → Logs
```

Ou via CLI:
```bash
# Instalar Render CLI
npm i -g render-cli

# Login
render login

# Ver logs
render logs assistente-juridico-pje

# Ver status
render services
```

---

## 🧪 Testar Antes do Deploy

```bash
cd streamlit-app

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cat > .env << EOF
GEMINI_API_KEY=sua-chave
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
EOF

# Rodar localmente
streamlit run app.py

# Abrir: http://localhost:8501
```

---

## 🆘 Troubleshooting

### Erro: "Application failed to respond"

**Causa:** Porta incorreta ou app não iniciou.

**Solução:** Certifique-se que o comando usa `$PORT`:
```bash
streamlit run app.py --server.port $PORT --server.address 0.0.0.0
```

### Erro: "Module not found"

**Causa:** Dependência faltando em `requirements.txt`.

**Solução:** Adicione a dependência:
```bash
echo "sua-biblioteca==1.0.0" >> requirements.txt
git add requirements.txt
git commit -m "fix: adicionar dependência"
git push
```

### Erro: "Redis connection failed"

**Causa:** Variáveis `UPSTASH_*` não configuradas.

**Solução:** Adicione em Environment Variables no dashboard.

### Deploy muito lento (>10 min)

**Causa:** Render free tier tem limite de recursos.

**Soluções:**
1. Remova dependências pesadas desnecessárias
2. Use cache de build (Render faz automaticamente)
3. Considere upgrade para plano pago ($7/mês)

---

## 💰 Limites do Plano Gratuito

| Recurso | Limite |
|---------|--------|
| **Horas ativas** | 750h/mês (suficiente para 1 app 24/7) |
| **RAM** | 512 MB |
| **CPU** | Compartilhada |
| **Build time** | 15 min/build |
| **Sleep após inatividade** | 15 minutos (reativa ao acessar) |
| **Largura de banda** | 100 GB/mês |

**Dica:** Para evitar sleep, use um serviço de ping (ex: UptimeRobot) que acessa sua URL a cada 5 minutos.

---

## 🚀 Próximos Passos Após Deploy

1. **Testar funcionalidades críticas:**
   - Login DJEN
   - Integração Gemini
   - Cache Redis
   - Geração de minutas

2. **Configurar domínio customizado** (opcional)

3. **Configurar notificações:**
   - Settings → Notifications
   - Adicione email ou Slack

4. **Habilitar backups automáticos** (se usar banco de dados)

5. **Monitorar performance:**
   - Dashboard → Metrics
   - Verifique uso de CPU/RAM

---

## 📞 Suporte

- **Documentação Render:** https://render.com/docs
- **Status:** https://status.render.com
- **Comunidade:** https://community.render.com

---

**Deploy realizado com sucesso?** 🎉

Acesse seu app em: `https://seu-servico.onrender.com`
