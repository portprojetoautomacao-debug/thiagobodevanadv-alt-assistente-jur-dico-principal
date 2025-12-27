# ✅ Tracing Configurado - AI Toolkit + OTLP

## 🎯 Status Final da Configuração

**Data**: 2024-12-15
**Objetivo**: Capturar traces do app React (http://127.0.0.1:5173) no AI Toolkit

---

## ✅ O Que Foi Configurado

### 1. **Servidor Vite** (`vite.config.ts`)
```typescript
server: {
  host: "0.0.0.0", // ✅ NOVO: Aceita conexões de 127.0.0.1
  port: 5173,
}
```

**Antes**: Servidor escutava apenas em `localhost` (bloqueava 127.0.0.1)
**Depois**: Servidor aceita conexões de `localhost`, `127.0.0.1` e IPs externos

### 2. **OpenTelemetry Browser** (`src/lib/tracing-browser.ts`)

#### Exportador OTLP Otimizado (linhas 27-56)
```typescript
const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT || "http://localhost:5173/v1/traces";
const tracingEnabled = import.meta.env.VITE_ENABLE_TRACING === "true";

if (tracingEnabled && otlpEndpoint) {
  const otlpExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: {},
    timeoutMillis: 5000, // Timeout de 5s
  });

  spanProcessor = new BatchSpanProcessor(otlpExporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 10,
    scheduledDelayMillis: 1000, // Envia a cada 1 segundo
  });
}
```

#### Fetch Instrumentation com CORS (linhas 67-77)
```typescript
new FetchInstrumentation({
  propagateTraceHeaderCorsUrls: [
    /localhost/,
    /127\.0\.0\.1/, // ✅ NOVO: Suporte para 127.0.0.1
    /generativelanguage\.googleapis\.com/, // Gemini
    /openai\.azure\.com/, // ✅ NOVO: Azure OpenAI
    /services\.ai\.azure\.com/, // ✅ NOVO: Azure AI Foundry
  ],
  ignoreUrls: [
    /\/api\/health/,
    /\.(js|css|png|jpg|svg|woff|woff2)$/, // ✅ NOVO: Filtrar estáticos
  ],
})
```

### 3. **Variáveis de Ambiente** (`.env`)
```bash
# Tracing com AI Toolkit
VITE_OTLP_ENDPOINT=http://localhost:5173/v1/traces
OTLP_ENDPOINT=http://localhost:5173/v1/traces
VITE_ENABLE_TRACING=true
```

---

## 🚀 Como Usar

### Passo 1: Reiniciar Servidor Dev

O servidor Vite precisa ser reiniciado para carregar a nova configuração:

```bash
# Parar servidor atual (se estiver rodando)
npm run kill

# Iniciar servidor com nova configuração
npm run dev
```

**Resultado esperado:**
```
VITE v6.2.1  ready in 1234 ms

➜  Local:   http://localhost:5173/
➜  Network: http://172.16.5.4:5173/
➜  press h + enter to show help
```

### Passo 2: Abrir AI Toolkit Trace Viewer

1. **Abrir Command Palette**: `Ctrl+Shift+P`
2. **Digitar**: `AI Toolkit: Open Trace Viewer`
3. **Enter** para abrir

### Passo 3: Testar Captura de Traces

1. **Abrir o app**: http://127.0.0.1:5173
2. **Fazer login** no sistema
3. **Usar alguma funcionalidade** que chama IA:
   - Abrir processos
   - Usar agentes (Mrs. Justin-e, Harvey Specter, etc.)
   - Gerar minutas automáticas
   - Fazer pesquisa jurisprudencial

### Passo 4: Verificar Traces no Viewer

No AI Toolkit Trace Viewer você verá:

- **Nome da operação**: Ex: `POST /api/agents`, `fetch /v1/chat/completions`
- **Duração**: Tempo total da requisição
- **Status**: 200 OK, 400 Bad Request, etc.
- **Atributos**: Modelo usado, tokens, endpoint, etc.
- **Timeline**: Linha do tempo com todas as operações

---

## 🧪 Script de Validação

Para testar se tudo está funcionando:

```bash
./scripts/test-tracing.sh
```

**Saída esperada:**
```
🔍 Teste de Tracing - AI Toolkit
================================

1️⃣ Verificando AI Toolkit Collector...
   ✅ HTTP Collector ativo na porta 5173
   ✅ gRPC Collector ativo na porta 5173

2️⃣ Verificando variáveis de ambiente...
   ✅ VITE_ENABLE_TRACING=true
   ✅ VITE_OTLP_ENDPOINT=http://localhost:5173/v1/traces

3️⃣ Testando conexão HTTP com OTLP...
   ✅ Endpoint respondendo (HTTP 200)

4️⃣ Verificando servidor Vite...
   ✅ Servidor rodando em http://127.0.0.1:5173

5️⃣ Verificando traces capturados...
   ✅ Database de traces: 84K

================================
📊 RESUMO:
✅ Tudo configurado corretamente!

🚀 Próximos passos:
   1. Acesse http://127.0.0.1:5173
   2. Use o app (login, abrir processos, etc.)
   3. Veja traces no AI Toolkit: Ctrl+Shift+P → 'AI Toolkit: Open Trace Viewer'
```

---

## 🔍 Troubleshooting

### Problema: Traces não aparecem no Viewer

**Checklist:**
1. ✅ Servidor dev está rodando? (`npm run dev`)
2. ✅ `VITE_ENABLE_TRACING=true` no `.env`?
3. ✅ AI Toolkit Trace Viewer está aberto?
4. ✅ Você fez alguma ação no app que chama API?

**Comandos de debug:**
```bash
# Ver logs do servidor
tail -f /tmp/vite-dev.log

# Ver logs do AI Toolkit
tail -f /home/node/.aitk/*tracing.log

# Verificar se traces estão sendo enviados
curl -X POST http://localhost:5173/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

### Problema: Servidor não inicia em 127.0.0.1

**Solução:**
```bash
# Verificar se porta 5173 está ocupada
lsof -ti:5173 | xargs kill -9

# Reiniciar servidor
npm run dev
```

### Problema: CORS error ao chamar APIs

**Causa**: Endpoint não está na lista `propagateTraceHeaderCorsUrls`

**Solução**: Adicionar endpoint em `src/lib/tracing-browser.ts`:
```typescript
propagateTraceHeaderCorsUrls: [
  /localhost/,
  /127\.0\.0\.1/,
  /seu-novo-endpoint\.com/, // ← Adicionar aqui
],
```

---

## 📊 Arquitetura do Fluxo de Tracing

```
┌─────────────────────────────────────────────────────────┐
│  React App (http://127.0.0.1:5173)                      │
│                                                           │
│  ┌──────────────────────────────────────────┐            │
│  │ src/lib/tracing-browser.ts               │            │
│  │                                           │            │
│  │  • WebTracerProvider                     │            │
│  │  • FetchInstrumentation                  │            │
│  │  • BatchSpanProcessor                    │            │
│  │     └─ maxQueueSize: 100                 │            │
│  │     └─ scheduledDelayMillis: 1000ms      │            │
│  └──────────────────────────────────────────┘            │
│                     │                                     │
│                     │ Spans a cada 1s                     │
│                     ▼                                     │
└─────────────────────────────────────────────────────────┘
                      │
                      │ HTTP POST
                      │ Content-Type: application/json
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  AI Toolkit OTLP Collector (localhost:4318)             │
│                                                           │
│  ┌──────────────────────────────────────────┐            │
│  │ /v1/traces endpoint                      │            │
│  │                                           │            │
│  │  • Recebe spans em OTLP/HTTP             │            │
│  │  • Armazena em SQLite                    │            │
│  │  • Indexa por timestamp, service, etc.   │            │
│  └──────────────────────────────────────────┘            │
│                     │                                     │
│                     ▼                                     │
│  ┌──────────────────────────────────────────┐            │
│  │ /home/node/.aitk/tracing/traces.db       │            │
│  │ (SQLite database - 84KB)                 │            │
│  └──────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
                      │
                      │ Query
                      ▼
┌─────────────────────────────────────────────────────────┐
│  AI Toolkit Trace Viewer (VS Code)                      │
│                                                           │
│  • Timeline visual                                       │
│  • Filtros por service, operation, status                │
│  • Detalhes de cada span (atributos, erros)             │
│  • Metrics agregadas (latência p50/p95/p99)             │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 O Que Você Pode Rastrear

### Chamadas AI
- **Gemini API**: `POST https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent`
- **Kimi K2 Thinking**: `POST https://thiagobodevanadv-1707-resource.services.ai.azure.com/models/chat/completions`
- **GPT-4o Azure**: `POST https://acessoradvazure-resource.openai.azure.com/openai/deployments/gpt-4o/chat/completions`

### APIs Internas
- `/api/agents` - Execução de agentes
- `/api/pje-sync` - Sincronização PJe
- `/api/expedientes` - CRUD de expedientes
- `/api/processes` - CRUD de processos
- `/api/minutas` - Geração de documentos

### Serviços Externos
- **DJEN**: `https://djen-api.cnj.jus.br`
- **DataJud**: `https://api.cnj.jus.br/datajud`
- **Google Calendar**: `https://www.googleapis.com/calendar/v3`

---

## 🏆 Benefícios do Tracing

1. **Debug de Performance**: Identifique gargalos (ex: Gemini demorando 10s)
2. **Monitoramento de Erros**: Veja stack traces completos de falhas
3. **Análise de Custos**: Conte quantas chamadas AI por dia/hora
4. **Otimização**: Compare latência antes/depois de mudanças
5. **Compliance**: Audit trail de todas as operações com IA
6. **Observabilidade**: Entenda o fluxo completo das requisições

---

## 📚 Documentação Relacionada

- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [AI Toolkit for VS Code](https://github.com/microsoft/vscode-ai-toolkit)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Vite Server Configuration](https://vite.dev/config/server-options.html)

---

## ✅ Checklist Final

- [x] Servidor Vite configurado com `host: "0.0.0.0"`
- [x] Tracing habilitado com `VITE_ENABLE_TRACING=true`
- [x] OTLP endpoint configurado: `http://localhost:5173/v1/traces`
- [x] Fetch instrumentation com CORS para 127.0.0.1 + Azure
- [x] Batch processor otimizado (1s intervals)
- [x] Static assets filtrados do tracing
- [x] AI Toolkit Collector rodando (portas 5173 + 5173)
- [x] Trace database criada (traces.db - 84KB)
- [x] Script de validação criado (`scripts/test-tracing.sh`)
- [ ] **PENDENTE**: Reiniciar servidor dev
- [ ] **PENDENTE**: Testar captura de traces no Viewer

---

## 🚀 Próximos Passos

### Imediato (5 minutos)
1. Reiniciar servidor: `npm run dev`
2. Abrir Trace Viewer: `Ctrl+Shift+P` → `AI Toolkit: Open Trace Viewer`
3. Usar o app e verificar traces aparecendo

### Curto Prazo (1-2 dias)
1. Configurar alertas para latências > 5s
2. Criar dashboard com métricas agregadas
3. Exportar traces para análise offline

### Médio Prazo (1-2 semanas)
1. Integrar com Sentry para correlação de erros
2. Adicionar custom spans para lógica de negócio
3. Configurar sampling (10% em prod) para reduzir overhead

---

**Configurado por**: GitHub Copilot
**Data**: 2024-12-15
**Versão do AI Toolkit**: 0.26.5
**Versão do OpenTelemetry**: 1.29.0
