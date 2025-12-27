# 📊 Tracing Setup - OpenTelemetry Integration

Este guia explica como configurar e usar o sistema de tracing com OpenTelemetry no Assistente Jurídico PJe.

## 🎯 Objetivo

Rastrear e monitorar:
- Chamadas aos agentes de IA
- Requisições à API Gemini
- Fluxos de automação (DJEN, DataJud, etc.)
- Performance de workflows processuais
- Integração com Chrome Extension PJe Sync

## 🛠️ Configuração Rápida

### 1. Iniciar AI Toolkit Trace Viewer

**ANTES de rodar a aplicação**, abra o VS Code Command Palette (`Ctrl+Shift+P` ou `Cmd+Shift+P`) e execute:

```
AI Toolkit: Open Trace Viewer
```

Isso iniciará o coletor de traces local na porta `4318` (HTTP) e `4317` (gRPC).

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
# OpenTelemetry Endpoints
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces  # Frontend
OTLP_ENDPOINT=http://localhost:4318/v1/traces        # Backend (API)

# Habilitar tracing
VITE_ENABLE_TRACING=true
```

### 3. Iniciar Aplicação

```bash
npm run dev
```

O tracing será inicializado automaticamente e você verá no console:

```
[Tracing] OpenTelemetry Browser inicializado
[Tracing] OTLP Endpoint: http://localhost:4318/v1/traces
```

## 📊 Visualizando Traces

### AI Toolkit (Recomendado)

1. Abra o **AI Toolkit Trace Viewer** no VS Code
2. As traces aparecerão automaticamente à medida que a aplicação é usada
3. Clique em uma trace para ver detalhes:
   - Tempo de execução
   - Tokens usados (Gemini)
   - Errors/exceptions
   - Context propagation

### Alternativas

O sistema também é compatível com:

- **Azure Monitor / Application Insights**
- **Sentry Performance**
- **Datadog APM**
- **Jaeger**
- **Zipkin**

Para usar outro backend, altere `OTLP_ENDPOINT` para o endpoint do serviço.

## 🎨 Instrumentação Automática

O sistema já instrumenta automaticamente:

### ✅ Frontend (Browser)
- ✅ `fetch()` requests (incluindo Gemini API)
- ✅ `XMLHttpRequest`
- ✅ Chamadas aos agentes autônomos
- ✅ Workflows LangGraph
- ✅ Interações do usuário (opcional)

### ✅ Backend (Node.js / Vercel Functions)
- ✅ HTTP/HTTPS requests
- ✅ API routes (`/api/*`)
- ✅ Cron jobs (`/api/cron`)
- ✅ Agentes em background

## 🔧 Instrumentação Manual (Quando Necessário)

Para adicionar traces customizadas aos seus agentes:

```typescript
import { startAgentSpan, endSpan, setAttribute } from '@/lib/tracing';

async function meuAgente(input: string) {
  // Criar span do agente
  const span = startAgentSpan('meu-agente-id', 'Meu Agente Custom', {
    sessionId: 'session-123',
    attributes: {
      'input.length': input.length,
    }
  });

  try {
    // Adicionar atributos durante execução
    setAttribute(span, 'step', 'analyzing');

    // Seu código aqui
    const result = await processarAlgo(input);

    setAttribute(span, 'result.size', result.length);

    // Finalizar span com sucesso
    await endSpan(span, 'ok');
    return result;

  } catch (error) {
    // Registrar erro no span
    recordException(span, error);
    await endSpan(span, 'error', error.message);
    throw error;
  }
}
```

### Para Chamadas LLM (Gemini):

```typescript
import { startLLMSpan, endLLMSpan } from '@/lib/tracing';

async function chamarGemini(prompt: string) {
  const span = startLLMSpan('gemini-2.5-pro', {
    temperature: 0.7,
    maxTokens: 2048,
  });

  try {
    const response = await model.generateContent(prompt);
    const usage = response.usageMetadata;

    await endLLMSpan(span, {
      promptTokens: usage.promptTokenCount,
      completionTokens: usage.candidatesTokenCount,
      success: true,
    });

    return response;
  } catch (error) {
    await endLLMSpan(span, {
      promptTokens: 0,
      completionTokens: 0,
      success: false,
      error,
    });
    throw error;
  }
}
```

## 📈 Métricas Disponíveis

### Spans Automáticas Criadas:

| Span Name | Tipo | Descrição |
|-----------|------|-----------|
| `agent.*` | Internal | Execução de agentes IA |
| `llm.*` | Client | Chamadas à API Gemini |
| `http.*` | Client | HTTP requests externos |
| `api.*` | Server | Endpoints da API |
| `workflow.*` | Internal | Workflows LangGraph |

### Atributos Padrão:

| Atributo | Descrição | Exemplo |
|----------|-----------|---------|
| `agent.id` | ID do agente | `harvey`, `justine` |
| `agent.name` | Nome do agente | `Harvey Specter` |
| `llm.model` | Modelo LLM usado | `gemini-2.5-pro` |
| `llm.prompt_tokens` | Tokens do prompt | `150` |
| `llm.completion_tokens` | Tokens da resposta | `320` |
| `llm.total_tokens` | Total de tokens | `470` |
| `http.method` | Método HTTP | `POST` |
| `http.url` | URL da requisição | `https://api.com/v1/chat` |

## 🔍 Queries Úteis (AI Toolkit)

### Ver todos os traces de um agente específico:

```
agent.id = "justine"
```

### Ver traces com erros:

```
status = "error"
```

### Ver chamadas Gemini com alto uso de tokens:

```
llm.total_tokens > 1000
```

### Ver traces lentas (> 5s):

```
duration > 5000
```

## 🚨 Troubleshooting

### Traces não aparecem no AI Toolkit

1. **Verificar se o Trace Viewer está aberto**:
   ```
   Command Palette > AI Toolkit: Open Trace Viewer
   ```

2. **Verificar endpoint**:
   ```bash
   curl http://localhost:4318/v1/traces
   ```
   Deve retornar resposta HTTP (não erro de conexão)

3. **Verificar console do browser**:
   Deve aparecer: `[Tracing] OpenTelemetry Browser inicializado`

### Performance degradada

1. **Reduzir sampling rate** (padrão: 100%):
   ```typescript
   import { tracingService } from '@/lib/tracing';
   tracingService.setSamplingRate(0.1); // 10% das requisições
   ```

2. **Desabilitar em produção** (se necessário):
   ```bash
   VITE_ENABLE_TRACING=false
   ```

### CORS errors com OTLP endpoint

Se estiver usando endpoint remoto (não localhost), adicione headers CORS:

```typescript
// src/lib/tracing-browser.ts
const otlpExporter = new OTLPTraceExporter({
  url: 'https://seu-backend.com/v1/traces',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Authorization': 'Bearer seu-token',
  },
});
```

## 🎓 Melhores Práticas

1. ✅ **Sempre inicie AI Toolkit Trace Viewer ANTES de rodar a app**
2. ✅ **Use instrumentação automática** quando possível (já configurada)
3. ✅ **Adicione atributos relevantes** aos spans customizados
4. ✅ **Registre exceptions** usando `recordException(span, error)`
5. ✅ **Use sampling em produção** para reduzir overhead (10-20%)
6. ✅ **Monitore tokens LLM** para controlar custos
7. ✅ **Correlacione traces** com logs e errors (Sentry)

## 📚 Recursos

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [AI Toolkit Tracing](https://aka.ms/ai-toolkit/tracing)
- [Gemini API Usage](https://ai.google.dev/gemini-api/docs/tokens)
- [Trace Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)

## 🔗 Integrações

### Azure Monitor / Application Insights

```bash
OTLP_ENDPOINT=https://your-workspace.monitor.azure.com/v1/traces
```

Configure Instrumentation Key no Application Insights.

### Sentry Performance

Já integrado via `src/lib/monitoring.ts`. Traces aparecem automaticamente na aba Performance do Sentry.

### Datadog

```bash
OTLP_ENDPOINT=https://http-intake.logs.datadoghq.com/v1/input
```

Adicione API Key nos headers do exporter.

---

**Dúvidas?** Consulte a documentação completa em `docs/` ou abra uma issue no GitHub.
