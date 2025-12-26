# 📧 Configuração de Emails com Resend no Vercel

Guia completo para configurar o sistema de envio de emails em produção.

## 🎯 Overview

O sistema está configurado com 4 tipos de emails:

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **test** | Email de teste simples | Validar configuração |
| **notification** | Email com ação | Notificações gerais |
| **urgent** | Alerta de prazo crítico (vermelho) | Prazos urgentes |
| **daily_summary** | Resumo diário com métricas | Email automático 24h |

## 🚀 Início Rápido

### 1️⃣ Adicione as Secrets no GitHub

Visite: https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets/actions

**Adicione 1 secret:**
- **Name**: `RESEND_API_KEY`
- **Value**: `re_7ThT6k8r_FVT9baVy8BKD2KSWxCWfhTZ2`

### 2️⃣ Teste Localmente

```bash
npm run dev

# Em outro terminal:
bash scripts/test-email-endpoint.sh seu-email@example.com
```

### 3️⃣ Deploy no Vercel

```bash
git add -A
git commit -m "feat: add email endpoint with Resend integration"
git push origin main
```

O Vercel pegará a secret automaticamente e você pode testar em produção:

```bash
curl -X POST https://assistente-juridico-github.vercel.app/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "to": "seu-email@example.com"
  }'
```

## 📝 Exemplos de Uso

### Email de Teste

```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "to": "usuario@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "messageId": "a1b2c3d4e5f6g7h8",
  "message": "Email de tipo \"test\" enviado com sucesso"
}
```

### Notificação

```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "notification",
    "to": "usuario@example.com",
    "subject": "Nova Petição Disponível",
    "message": "Uma nova petição foi redacionada pelo agente IA",
    "actionUrl": "https://assistente-juridico-github.vercel.app/minutas"
  }'
```

### Alerta Urgente

```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "urgent",
    "to": "usuario@example.com",
    "processNumber": "1234567-89.2024.5.02.0999",
    "deadline": "2024-12-25"
  }'
```

### Resumo Diário

```bash
curl -X POST http://localhost:3000/api/emails \
  -H "Content-Type: application/json" \
  -d '{
    "type": "daily_summary",
    "to": "usuario@example.com",
    "summary": {
      "totalProcesses": 15,
      "newIntimations": 3,
      "deadlineAlerts": 2,
      "completedTasks": 8,
      "pendingReview": 1
    }
  }'
```

## 🔧 Integração com Cron Jobs

No arquivo `api/cron.ts`, adicione chamadas ao endpoint de emails:

```typescript
import { sendNotificationEmail } from './lib/email-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Monitorar DJEN...
    const newIntimations = await monitorDJEN();

    if (newIntimations.length > 0) {
      // Enviar email para cada intimação urgente
      for (const intimation of newIntimations) {
        await sendUrgentDeadlineAlert(
          'seu-email@example.com',
          intimation.processNumber,
          intimation.deadline
        );
      }
    }

    // Enviar resumo diário
    await sendDailySummaryEmail('seu-email@example.com', {
      totalProcesses: processes.length,
      newIntimations: newIntimations.length,
      // ... mais dados
    });

  } catch (error) {
    console.error('Erro no cron:', error);
  }
}
```

## 🌐 Arquitetura

```
User/Cron Job
      ↓
/api/emails (endpoint)
      ↓
api/lib/email-service.ts
      ↓
Resend API
      ↓
📧 Inbox do Usuário
```

## ✅ Checklist de Configuração

- [ ] Secret `RESEND_API_KEY` adicionado no GitHub
- [ ] Deploy feito no Vercel
- [ ] Email de teste enviado com sucesso
- [ ] Email recebido no inbox
- [ ] Teste de notificação realizado
- [ ] Teste de alerta urgente realizado
- [ ] Teste de resumo diário realizado
- [ ] Cron jobs configurados para enviar emails
- [ ] Monitoramento no Resend dashboard ativado

## 📊 Monitoramento

Acompanhe emails enviados no Resend:

**Dashboard Resend**: https://resend.com/emails

- Total de emails enviados
- Taxa de entrega
- Bounces e rejeições
- Performance por tipo

## 🐛 Troubleshooting

### Email não está sendo enviado

**Verificações:**

1. **Secret configurada?**
   ```bash
   gh secret list
   ```

2. **Variável de ambiente carregada?**
   ```javascript
   console.log(process.env.RESEND_API_KEY); // Não deve estar undefined
   ```

3. **Vercel logs:**
   ```bash
   vercel logs assistente-juridico-p --follow
   ```

### Erro: "Not authorized"

A secret precisa estar no GitHub primeiro:
- https://github.com/portprojetoautomacao-debug/thiagobodevanadv-alt-assistente-jur-dico-principal/settings/secrets/actions

### Email llegando à pasta de spam

- Verifique se o `from` está configurado corretamente
- Configure DNS/SPF/DKIM no Resend dashboard
- Teste domínio personalizado

## 📚 Referências

- [Documentação Resend](https://resend.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [API Endpoint](/api/emails.ts)
- [Email Service Library](/api/lib/email-service.ts)
- [Test Script](/scripts/test-email-endpoint.sh)

## 🔐 Segurança

- ✅ API Key em secret (não em código)
- ✅ Validação de input no endpoint
- ✅ Erro handling completo
- ✅ Rate limiting recomendado para produção (adicionar em próxima fase)

## 📞 Suporte

Para issues com Resend:
- Dashboard: https://resend.com
- Email: support@resend.com

Para issues com Vercel:
- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs

---

**Status**: ✅ Pronto para teste e produção
