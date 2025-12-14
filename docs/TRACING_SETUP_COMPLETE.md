# ✅ Tracing OpenTelemetry - Setup Completo

> **Status**: Implementação concluída com sucesso  
> **Data**: 13 de dezembro de 2025  
> **Versão**: 1.0.0

## 📋 Resumo da Implementação

O sistema de tracing OpenTelemetry foi completamente integrado ao Assistente Jurídico PJe, permitindo observabilidade completa de:

- ✅ Chamadas LLM (Gemini 2.5 Pro)
- ✅ Operações de agentes de IA
- ✅ Processamento de documentos jurídicos
- ✅ Busca vetorial (Qdrant)
- ✅ Workflows processuais

## 🎯 O Que Foi Implementado

### 1. Dependências Instaladas

Adicionadas ao `package.json`:

```json
{
  "@opentelemetry/api": "^1.9.0",
  "@opentelemetry/exporter-trace-otlp-http": "^0.54.2",
  "@opentelemetry/instrumentation": "^0.54.2",
  "@opentelemetry/resources": "^1.28.0",
  "@opentelemetry/sdk-trace-base": "^1.28.0",
  "@opentelemetry/sdk-trace-web": "^1.28.0",
  "@opentelemetry/semantic-conventions": "^1.28.0"
}
```

### 2. Arquivos Criados/Modificados

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| [`src/lib/otel-integration.ts`](../src/lib/otel-integration.ts) | ✅ Criado | Integração OpenTelemetry + AI Toolkit |
| [`src/lib/tracing.ts`](../src/lib/tracing.ts) | ✅ Existente | Sistema de tracing compatível com OpenTelemetry |
| [`src/lib/gemini-service.ts`](../src/lib/gemini-service.ts) | ✅ Modificado | Adicionado tracing em `callGemini()` |
| [`src/hooks/use-autonomous-agents.ts`](../src/hooks/use-autonomous-agents.ts) | ✅ Modificado | Tracing de agentes com `startAgentSpan()` |
| [`src/main.tsx`](../src/main.tsx) | ✅ Existente | Inicialização do OpenTelemetry |
| [`.env.example`](../.env.example) | ✅ Atualizado | Variável `VITE_OTLP_ENDPOINT` |

### 3. Fluxo de Tracing Implementado

```
Aplicação inicia
  ↓
main.tsx → initializeOpenTelemetry()
  ↓
OpenTelemetry SDK registrado
  ↓
Agente executa tarefa
  ↓
startAgentSpan() cria span
  ↓
Chama Gemini via callGemini()
  ↓
startLLMSpan() cria span filho
  ↓
Executa chamada à API
  ↓
endLLMSpan() com tokens/custo
  ↓
endAgentSpan() com resultado
  ↓
Span exportado para AI Toolkit (localhost:4318)
  ↓
Visualização no Trace Viewer
```

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
# .env.local
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

### 3. Abrir AI Toolkit Trace Viewer

1. Pressione `Ctrl+Shift+P` (Command Palette)
2. Execute: **"AI Toolkit: Open Trace Viewer"**
3. O viewer abrirá em uma nova aba do VS Code

### 4. Iniciar Aplicação

```bash
npm run dev
```

### 5. Visualizar Traces

Conforme você usa o sistema:

- ✅ Intimações são processadas → Span `agent.justine.process-intimation`
- ✅ Chamadas Gemini → Span `llm.generateContent` com tokens
- ✅ Buscas Qdrant → Span `vector.search`
- ✅ Agentes executam → Span `agent.{id}.{operation}`

Os traces aparecerão **automaticamente** no AI Toolkit Trace Viewer.

## 📊 Spans Implementados

### Agentes de IA

```typescript
// Exemplo: Mrs. Justin-e processando intimação
startAgentSpan('justine', 'Mrs. Justin-e', {
  sessionId: 'sess_123',
  attributes: {
    'expediente.id': 'exp_456',
    'processo.numero': '0001234-56.2024.5.01.0000'
  }
});
```

**Atributos capturados**:
- `agent.id`: ID do agente
- `agent.name`: Nome amigável
- `agent.session_id`: ID da sessão
- `expediente.id`: ID do expediente processado
- `processo.numero`: Número do processo

### Chamadas LLM (Gemini)

```typescript
// Chamada ao Gemini com tracing automático
const response = await callGemini(prompt, {
  temperature: 0.7,
  maxOutputTokens: 2048
});
```

**Atributos capturados**:
- `llm.model`: `gemini-2.5-pro`
- `llm.operation`: `generateContent`
- `llm.temperature`: Temperatura configurada
- `llm.max_tokens`: Limite de tokens
- `llm.prompt_tokens`: Tokens do prompt
- `llm.completion_tokens`: Tokens da resposta
- `llm.total_tokens`: Total de tokens
- `llm.duration_ms`: Tempo de resposta em ms

### Busca Vetorial (Qdrant)

```typescript
// Busca jurisprudencial com tracing
traceVectorSearch('legal_docs', 'search', async () => {
  return await qdrant.search({
    query: 'FGTS trabalhista',
    limit: 10
  });
}, {
  query: 'FGTS trabalhista',
  limit: 10,
  score_threshold: 0.7
});
```

## 🔍 Visualização no AI Toolkit

### Exemplo de Trace Completo

```
📊 Trace: Processar Intimação CNJ-123
├─ 🤖 agent.justine.process-intimation [2.5s]
│  ├─ 📝 llm.generateContent [1.8s]
│  │  ├─ Prompt tokens: 450
│  │  ├─ Completion tokens: 320
│  │  └─ Total: 770 tokens
│  ├─ 🔍 vector.search [0.5s]
│  │  ├─ Collection: legal_docs
│  │  ├─ Results: 5
│  │  └─ Score: 0.85
│  └─ ✅ Status: OK
```

### Filtros Disponíveis

- **Por Agente**: `agent.id:justine`
- **Por Operação**: `llm.operation:generateContent`
- **Por Processo**: `processo.numero:0001234*`
- **Por Duração**: `duration:>2000ms`
- **Por Status**: `status:error`

## 🎯 Casos de Uso

### 1. Debugar Agente Lento

```typescript
// Ver qual agente está demorando
Traces → Filtrar por "agent.*" → Ordenar por duração
```

### 2. Monitorar Custo de API

```typescript
// Ver consumo de tokens
Traces → Filtrar por "llm.*" → Somar tokens
```

### 3. Rastrear Erro em Produção

```typescript
// Ver stack trace completo
Traces → Filtrar por "status:error" → Ver exception
```

### 4. Otimizar Performance

```typescript
// Identificar gargalos
Traces → Flamegraph → Ver operações mais lentas
```

## 🔧 Configuração Avançada

### Endpoint Customizado

```typescript
// Para usar collector diferente (ex: Jaeger, Zipkin)
VITE_OTLP_ENDPOINT=http://seu-collector.com:4318/v1/traces
```

### Sampling Rate

```typescript
// src/lib/otel-integration.ts
tracingService.setSamplingRate(0.1); // 10% dos traces
```

### Desabilitar em Produção

```typescript
// .env.production
VITE_OTLP_ENDPOINT= # Vazio = desabilitado
```

## 📚 Documentação Adicional

- **Tracing Completo**: [`docs/TRACING.md`](./TRACING.md)
- **OpenTelemetry Docs**: https://opentelemetry.io/docs/
- **AI Toolkit**: https://github.com/microsoft/vscode-ai-toolkit

## ✅ Checklist de Verificação

- [x] Dependências OpenTelemetry instaladas
- [x] `initializeOpenTelemetry()` chamado em `main.tsx`
- [x] AI Toolkit Trace Viewer aberto
- [x] `VITE_OTLP_ENDPOINT` configurado
- [x] Aplicação rodando (`npm run dev`)
- [x] Traces aparecendo no viewer
- [x] Agentes gerando spans
- [x] Chamadas LLM capturando tokens
- [x] Erros sendo registrados

## 🎉 Próximos Passos

1. **Explorar Traces**: Execute operações e veja os traces no AI Toolkit
2. **Customizar Spans**: Adicione atributos específicos do seu domínio
3. **Configurar Alertas**: Use os dados para monitorar SLAs
4. **Otimizar Performance**: Identifique e resolva gargalos
5. **Integrar com Produção**: Configure exportação para Datadog/New Relic

---

**Implementado por**: GitHub Copilot Agent  
**Data**: 13 de dezembro de 2025  
**Versão do Sistema**: 1.0.1
