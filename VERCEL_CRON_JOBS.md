# Vercel Cron Jobs - Implementação

## 📋 Visão Geral

Este aplicativo agora possui **tarefas agendadas (cron jobs)** implementadas no Vercel para executar operações periódicas automaticamente no servidor.

## 🕐 Cron Jobs Configurados

### 1. Health Check (`/api/cron`)
- **Frequência**: A cada hora (`0 * * * *`)
- **Função**: Verificação de saúde do sistema
- **Descrição**: Confirma que o sistema está operacional e registra timestamps

### 2. DJEN Monitor (`/api/cron/djen-monitor`)
- **Frequência**: A cada 2 horas durante horário comercial, das 8h às 20h (`0 8-20/2 * * *`)
- **Função**: Monitoramento de publicações DJEN/DataJud
- **Descrição**: 
  - Consulta tribunais configurados para novas publicações
  - Filtra publicações relevantes para advogados/processos monitorados
  - Armazena novas publicações
  - Gera notificações para usuários
  
**Nota**: Implementação atual é um placeholder. A implementação completa requer:
- Acesso ao Spark KV no backend para buscar lista de advogados/processos
- Integração com APIs DJEN/DataJud
- Sistema de notificações

### 3. Daily Reset (`/api/cron/daily-reset`)
- **Frequência**: Diariamente à meia-noite (`0 0 * * *`)
- **Função**: Reset de contadores diários
- **Descrição**:
  - Reseta contadores `tasksToday` dos agentes autônomos
  - Arquiva tarefas completadas antigas (>30 dias)
  - Gera estatísticas diárias
  - Limpa logs antigos

**Nota**: Implementação atual é um placeholder. A implementação completa requer acesso ao Spark KV no backend.

## 📁 Estrutura de Arquivos

```
api/
├── cron.ts                    # Health check principal
└── cron/
    ├── djen-monitor.ts        # Monitor DJEN
    └── daily-reset.ts         # Reset diário
```

## ⚙️ Configuração

### vercel.json

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/djen-monitor",
      "schedule": "0 8-20/2 * * *"
    },
    {
      "path": "/api/cron/daily-reset",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Formato de Schedule (Cron Expression)

Os schedules usam o formato cron padrão:
```
┌────────── minuto (0 - 59)
│ ┌──────── hora (0 - 23)
│ │ ┌────── dia do mês (1 - 31)
│ │ │ ┌──── mês (1 - 12)
│ │ │ │ ┌── dia da semana (0 - 6) (Domingo=0)
│ │ │ │ │
* * * * *
```

**Exemplos:**
- `0 * * * *` - A cada hora no minuto 0
- `0 8-20/2 * * *` - A cada 2 horas das 8h às 20h
- `0 0 * * *` - Diariamente à meia-noite
- `0 9 * * 1-5` - Dias úteis às 9h
- `*/15 * * * *` - A cada 15 minutos

## 🔒 Segurança

### Autenticação

Os endpoints de cron verificam o header `Authorization`:
- Em produção: Vercel adiciona automaticamente `Bearer <token>`
- Em desenvolvimento: Aceita requisições sem token para testes locais

```typescript
const authHeader = req.headers.authorization;
const isVercelCron = authHeader?.startsWith('Bearer ');
const isLocalTest = process.env.NODE_ENV === 'development' || !authHeader;

if (!isVercelCron && !isLocalTest) {
  return res.status(401).json({ 
    error: 'Unauthorized - This endpoint is only for Vercel Cron Jobs' 
  });
}
```

### Variáveis de Ambiente

Configure no Vercel Dashboard:

```bash
# Tribunais a serem monitorados pelo DJEN (separados por vírgula)
DJEN_TRIBUNAIS=TST,TRT3,TJMG,TRF1,TJES,TJSP,STJ

# Outras variáveis necessárias
GITHUB_TOKEN=<seu-token>
GITHUB_RUNTIME_PERMANENT_NAME=<nome-do-runtime>
```

## 🧪 Testes Locais

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Testar Endpoints Localmente

```bash
# Iniciar servidor de desenvolvimento
vercel dev

# Em outro terminal, testar endpoints:
curl http://localhost:3000/api/cron
curl http://localhost:3000/api/cron/djen-monitor
curl http://localhost:3000/api/cron/daily-reset
```

### 3. Verificar Logs

Os cron jobs registram logs detalhados:
```
[Cron] Health check executed at 2025-11-17T13:45:00.000Z
[DJEN Monitor Cron] Starting execution at 2025-11-17T14:00:00.000Z
[Daily Reset Cron] Executing daily maintenance tasks
```

## 📊 Monitoramento

### Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Vá para seu projeto
3. Clique em **Cron Jobs** no menu lateral
4. Visualize:
   - Histórico de execuções
   - Status (sucesso/falha)
   - Duração de cada execução
   - Logs completos

### Logs de Cron

```bash
# Via Vercel CLI
vercel logs --follow

# Filtrar por função específica
vercel logs --follow --filter=cron
```

## 🔧 Manutenção

### Atualizar Schedule

1. Edite `vercel.json`
2. Commit e push para GitHub
3. Vercel re-deploya automaticamente
4. Novos schedules entram em vigor imediatamente

### Desabilitar Cron Job Temporariamente

Remova ou comente a entrada no `vercel.json`:

```json
{
  "crons": [
    // {
    //   "path": "/api/cron/daily-reset",
    //   "schedule": "0 0 * * *"
    // }
  ]
}
```

### Adicionar Novo Cron Job

1. Crie arquivo em `api/cron/seu-job.ts`
2. Adicione entrada em `vercel.json`
3. Deploy para produção

## 📈 Próximos Passos

Para implementação completa dos cron jobs, será necessário:

### Backend State Management
Os cron jobs atuais são placeholders porque Vercel Serverless Functions são stateless. Para funcionalidade completa:

**Opção 1: Usar Vercel KV (Recomendado)**
```bash
# Instalar
npm install @vercel/kv

# Configurar
# Adicionar Vercel KV no dashboard
```

**Opção 2: Usar Backend Externo**
- MongoDB Atlas
- PostgreSQL (Vercel Postgres)
- Firebase Firestore
- Supabase

### Implementação DJEN Monitor Completo

```typescript
// Pseudo-código
import { kv } from '@vercel/kv';

async function djenMonitorComplete() {
  // 1. Buscar lista de advogados para monitorar
  const lawyers = await kv.get('monitored-lawyers');
  
  // 2. Para cada advogado, consultar DJEN
  for (const lawyer of lawyers) {
    const publications = await consultarDJEN({
      nomeAdvogado: lawyer.name,
      numeroOAB: lawyer.oab
    });
    
    // 3. Filtrar novas publicações
    const newPubs = filterNewPublications(publications);
    
    // 4. Armazenar
    await kv.set(`publications:${lawyer.id}`, newPubs);
    
    // 5. Notificar usuários
    await sendNotifications(lawyer.userId, newPubs);
  }
}
```

### Implementação Daily Reset Completo

```typescript
import { kv } from '@vercel/kv';

async function dailyResetComplete() {
  // 1. Buscar todos os agentes
  const agents = await kv.get('autonomous-agents');
  
  // 2. Reset contadores
  for (const agent of agents) {
    agent.tasksToday = 0;
    await kv.set(`agent:${agent.id}`, agent);
  }
  
  // 3. Arquivar tarefas antigas
  const oldTasks = await kv.get('completed-tasks');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  
  const toArchive = oldTasks.filter(t => 
    new Date(t.completedAt) < cutoffDate
  );
  
  await kv.set('archived-tasks', toArchive);
  await kv.set('completed-tasks', 
    oldTasks.filter(t => new Date(t.completedAt) >= cutoffDate)
  );
}
```

## 🆘 Troubleshooting

### Cron não está executando

1. Verifique que está em produção (crons não rodam em preview)
2. Confirme formato do schedule no vercel.json
3. Verifique logs no Vercel Dashboard

### Erro 401 Unauthorized

- Em produção: Vercel deve adicionar Authorization header automaticamente
- Verifique se não há middleware bloqueando o header

### Timeout

Vercel Serverless Functions têm limite de 10s (Hobby) ou 60s (Pro):
- Otimize operações longas
- Use filas para processamento assíncrono
- Considere quebrar em múltiplos cron jobs

## 📚 Referências

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Syntax](https://crontab.guru/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel KV Database](https://vercel.com/docs/storage/vercel-kv)

## ✅ Status da Implementação

- [x] Estrutura básica de cron jobs criada
- [x] Health check implementado
- [x] DJEN monitor placeholder criado
- [x] Daily reset placeholder criado
- [x] Configuração no vercel.json
- [x] Documentação completa
- [ ] Implementação completa DJEN com backend state
- [ ] Implementação completa daily reset com backend state
- [ ] Testes automatizados dos endpoints
- [ ] Sistema de notificações
- [ ] Integração com Vercel KV ou backend externo
