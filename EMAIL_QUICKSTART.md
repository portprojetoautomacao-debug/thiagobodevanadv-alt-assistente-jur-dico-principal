# 🚀 Guia Rápido - Email Service

## ⚡ 3 Passos em 25 Minutos

### 1️⃣ GitHub Secret (5 min)

```bash
# Opção A: CLI (mais rápido)
gh secret set RESEND_API_KEY --body "re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2"

# Opção B: Web UI
# Visite: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets/actions
# Clique "New repository secret"
# Name: RESEND_API_KEY
# Value: re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2
```

### 2️⃣ Teste Local (10 min)

```bash
# Terminal 1
npm run dev

# Terminal 2
bash scripts/test-email-endpoint.sh seu-email@example.com
```

### 3️⃣ Deploy (5 min)

```bash
# Seu código já está commitado! Só fazer push
# Ou se quiser custom commit:
git add -A
git commit -m "deploy: email service production"
git push origin main

# Vercel fará deploy automaticamente
# Aguarde 2-3 minutos
```

---

## 🎯 Depois que Funcionar

### Use o Endpoint

```bash
curl -X POST https://assistente-juridico-github.vercel.app/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "to": "seu-email@example.com"
  }'
```

### Integre com Cron Jobs

Copie de `api/integrations/email-examples.ts`

```typescript
// Em api/cron.ts
import { sendUrgentDeadlineAlert } from './lib/email-service'

// Depois de detectar nova intimação:
await sendUrgentDeadlineAlert(
  'usuario@example.com',
  '1234567-89.2024.5.02.0999',
  '2024-12-25'
)
```

---

## 📊 Arquivos Principais

| Arquivo | Para quê |
|---------|----------|
| `api/lib/email-service.ts` | Funções de email (use diretamente em /api/*) |
| `api/emails.ts` | Endpoint POST /api/emails |
| `api/integrations/email-examples.ts` | 8 exemplos prontos para copiar |
| `scripts/test-email-endpoint.sh` | Teste automático local |
| `scripts/email-setup-wizard.sh` | Guia interativo (recomendado) |
| `scripts/email-status.sh` | Ver status visual |
| `docs/EMAIL_SETUP_GUIDE.md` | Documentação completa |
| `docs/EMAIL_SERVICE_COMPLETE.md` | Resumo detalhado |

---

## 🆘 Se Algo Der Errado

### Email não funciona?

1. Checar secret:
```bash
gh secret list | grep RESEND
```

2. Se estiver vazio, adicione novamente:
```bash
gh secret set RESEND_API_KEY --body "re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2"
```

3. Logs:
```bash
vercel logs assistente-juridico-p --prod
```

### Teste falha localmente?

1. Servidor rodando?
```bash
npm run dev
```

2. Email inválido? Use um real para ver resposta

### Testes GitHub Actions falhando?

```bash
# Ver o que falhou
# Visite: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/actions
```

---

## ✨ Pronto!

Seu sistema de emails está pronto para:

✅ Enviar notificações quando novas intimações chegam
✅ Alertas urgentes com prazos críticos
✅ Resumos diários para operadores
✅ Integrações com cron jobs 24/7

**Próximo passo:** Abra um terminal e execute:

```bash
bash scripts/email-setup-wizard.sh
```

Ele fará tudo passo a passo! 🎉

---

*Criado: 07/12/2024*
*Status: ✅ Pronto para Produção*
