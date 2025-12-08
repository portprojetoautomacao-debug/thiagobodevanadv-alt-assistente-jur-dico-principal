# 📧 Guia de Integração Resend - Email API

## ✅ Status da Implementação

### Concluído ✓

- ✅ **Pacote instalado**: `resend` v4.1.3 + 11 dependências (0 vulnerabilidades)
- ✅ **Código atualizado**: `api/lib/email-service.ts` usando Resend real (sem stubs)
- ✅ **Testes criados**: 10 testes automatizados (100% passando)
- ✅ **Build validado**: Produção pronta para deploy
- ✅ **Documentação**: README.md + .github/copilot-instructions.md + .env.example

### Estrutura de Arquivos

```
api/
├── emails.ts                    # Endpoint POST /api/emails (4 tipos)
├── lib/
│   ├── email-service.ts         # Serviço Resend (real implementation)
│   └── email-service.test.ts    # 10 testes automatizados
.env.example                     # Template com RESEND_API_KEY
README.md                        # Seção "📧 API de Emails"
.github/copilot-instructions.md  # Instruções de manutenção
```

---

## 🚀 Próximos Passos - Configuração Vercel (OBRIGATÓRIO)

### 1. Criar Conta Resend (Grátis)

1. Acesse: https://resend.com/signup
2. Crie uma conta gratuita
3. Confirme o email de verificação

**Plano Gratuito:**
- ✅ 3.000 emails/mês
- ✅ 100 emails/dia
- ✅ Domínio padrão: `onboarding@resend.dev`

### 2. Gerar API Key

1. Acesse: https://resend.com/api-keys
2. Clique em **"Create API Key"**
3. Nome sugerido: `assistente-juridico-prod`
4. Permissão: **"Sending access"** (Full Access não é necessário)
5. Copie a chave (começa com `re_...`)

⚠️ **IMPORTANTE**: A chave só é exibida uma vez. Salve em local seguro!

### 3. Configurar Variáveis de Ambiente no Vercel

#### Opção A: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables
2. Adicione as variáveis:

| Variável           | Valor                                      | Ambientes         |
| ------------------ | ------------------------------------------ | ----------------- |
| `RESEND_API_KEY`   | `re_sua_chave_aqui`                        | Production, Preview |
| `EMAIL_API_KEY`    | `seu-token-seguro-aleatorio-minimo-32chars` | Production, Preview |

3. Clique em **"Save"**

#### Opção B: Via CLI Vercel

```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Login
vercel login

# Adicionar variáveis
vercel env add RESEND_API_KEY
# Cole a chave quando solicitado: re_...

vercel env add EMAIL_API_KEY
# Gere token seguro: openssl rand -base64 32
```

### 4. Redeploy da Aplicação

**Via Dashboard:**
1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/deployments
2. Selecione o último deployment
3. Clique nos 3 pontos (...) → **"Redeploy"**

**Via CLI:**
```bash
vercel --prod
```

### 5. Validar Configuração

Teste o endpoint de saúde:

```bash
# Produção
curl -X POST https://assistente-juridico-p.vercel.app/api/emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_EMAIL_API_KEY" \
  -d '{
    "type": "test",
    "to": "seu-email@exemplo.com",
    "subject": "Teste Resend",
    "message": "Email de teste do sistema"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "messageId": "abc123...",
  "message": "Email enviado com sucesso"
}
```

---

## 📋 Tipos de Email Suportados

### 1. Test (Teste básico)
```json
{
  "type": "test",
  "to": "email@exemplo.com",
  "subject": "Assunto",
  "message": "Mensagem"
}
```

### 2. Notification (Notificação geral)
```json
{
  "type": "notification",
  "to": "operador@escritorio.com",
  "title": "Nova Intimação",
  "message": "Processo 123: Nova intimação recebida",
  "actionUrl": "https://app.com/process/123"
}
```

### 3. Urgent (Alerta de prazo urgente)
```json
{
  "type": "urgent",
  "to": "advogado@escritorio.com",
  "processNumber": "1234567-89.2025.8.26.0100",
  "deadline": "15/12/2025 17:00",
  "taskType": "Contestação"
}
```

### 4. Daily Summary (Resumo diário)
```json
{
  "type": "daily_summary",
  "to": "gestor@escritorio.com",
  "summary": {
    "processesMonitored": 150,
    "deadlinesFound": 8,
    "documentsGenerated": 12,
    "errorsCount": 2
  }
}
```

---

## 🔐 Segurança Implementada

| Recurso                          | Status | Descrição                                  |
| -------------------------------- | ------ | ------------------------------------------ |
| **Autenticação**                 | ✅     | Bearer token (constant-time comparison)    |
| **Rate Limiting**                | ✅     | 100 req/min via Upstash Redis              |
| **Validação Zod**                | ✅     | Schema validation para todos os tipos      |
| **Sanitização HTML**             | ✅     | `escapeHtml()` para prevenir XSS           |
| **Retry com Backoff**            | ✅     | 3 tentativas com backoff exponencial       |
| **Timeout**                      | ✅     | 30s máximo por envio                       |
| **CORS**                         | ✅     | Origem permitida configurável              |
| **Environment Isolation**        | ✅     | Variáveis separadas por ambiente (prod/dev)|

---

## 🧪 Testes Automatizados

### Executar Testes

```bash
# Todos os testes do email service (10 tests)
npm run test:api -- email-service.test.ts

# Com coverage
npm run test:coverage -- email-service.test.ts
```

### Suíte de Testes (10 cenários)

1. ✅ Envio de email básico com sucesso
2. ✅ Erro quando RESEND_API_KEY não configurada
3. ✅ Múltiplos destinatários
4. ✅ Tags opcionais
5. ✅ Notificação com actionUrl
6. ✅ Notificação sem actionUrl
7. ✅ Alerta urgente de prazo
8. ✅ Inclusão de número do processo
9. ✅ Resumo diário com métricas
10. ✅ Métricas zeradas

---

## 📊 Monitoramento e Logs

### Logs no Vercel

1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/logs
2. Filtre por função: `api/emails`
3. Procure por:
   - ✅ `Email enviado com sucesso: [messageId]`
   - ❌ `RESEND_API_KEY não configurada`
   - ❌ `Erro ao enviar email: [erro]`

### Dashboard Resend

- Acesse: https://resend.com/emails
- Monitore:
  - Emails enviados/falhados
  - Taxa de entrega
  - Bounces e reclamações

---

## 🔧 Troubleshooting

### Erro: "RESEND_API_KEY não configurada"

**Causa**: Variável de ambiente não definida no Vercel

**Solução**:
1. Acesse: https://vercel.com/thiagobodevan-a11y/assistente-juridico-p/settings/environment-variables
2. Adicione `RESEND_API_KEY` com valor `re_...`
3. Redeploy da aplicação

### Erro: "Invalid API key"

**Causa**: API key inválida ou expirada

**Solução**:
1. Acesse: https://resend.com/api-keys
2. Revogue a chave antiga
3. Crie nova chave
4. Atualize no Vercel
5. Redeploy

### Erro: "Rate limit exceeded"

**Causa**: Mais de 100 emails/minuto ou 3.000/mês (plano gratuito)

**Solução**:
- Aguarde reset do limite (1 minuto)
- Ou faça upgrade do plano: https://resend.com/pricing

### Email não chega

**Checklist**:
- ✅ Chave API configurada corretamente no Vercel?
- ✅ Email de destino válido?
- ✅ Verifique pasta de SPAM
- ✅ Domínio verificado no Resend (para enviar de domínio próprio)?
- ✅ Logs do Vercel sem erros?

---

## 📈 Próximos Passos (Opcional)

### 1. Domínio Personalizado (Profissional)

**Atualmente**: Emails saem de `onboarding@resend.dev`

**Configurar domínio próprio**:
1. Acesse: https://resend.com/domains
2. Adicione seu domínio: `escritorio.com.br`
3. Configure registros DNS (SPF, DKIM)
4. Atualize `from` em `api/lib/email-service.ts`:
   ```typescript
   from: "Assistente Jurídico <noreply@escritorio.com.br>"
   ```

### 2. Templates HTML Profissionais

Crie templates visuais:
- https://resend.com/docs/send-with-react
- Integre com React Email

### 3. Webhooks (Rastreamento)

Configure webhooks para rastrear:
- Emails entregues
- Emails abertos (open tracking)
- Clicks em links
- Bounces

Docs: https://resend.com/docs/dashboard/webhooks/introduction

### 4. Analytics

Monitore métricas:
- Taxa de abertura
- Taxa de cliques
- Horário de pico de envio
- Dispositivos dos destinatários

---

## 📚 Referências

- **Resend Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api-reference/emails/send-email
- **React Email**: https://react.email
- **Código Fonte**:
  - Endpoint: `api/emails.ts`
  - Serviço: `api/lib/email-service.ts`
  - Testes: `api/lib/email-service.test.ts`

---

## ✅ Checklist de Conclusão

- [x] Pacote `resend` instalado
- [x] Código sem stubs (implementação real)
- [x] 10 testes automatizados passando
- [x] Build de produção validado
- [x] Documentação completa
- [ ] **RESEND_API_KEY configurada no Vercel** ⬅️ **VOCÊ ESTÁ AQUI**
- [ ] **EMAIL_API_KEY configurada no Vercel** ⬅️ **VOCÊ ESTÁ AQUI**
- [ ] Primeiro email de teste enviado com sucesso
- [ ] Monitoramento configurado

---

**🎉 Após configurar as variáveis no Vercel, o sistema de emails estará 100% operacional!**

Se tiver dúvidas, consulte:
- `.env.example` - Template de variáveis
- `README.md` - Seção "📧 API de Emails"
- `.github/copilot-instructions.md` - Instruções para manutenção
