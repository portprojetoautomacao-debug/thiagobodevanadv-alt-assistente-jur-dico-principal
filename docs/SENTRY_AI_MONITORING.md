# Sentry AI Agent Monitoring - Guia de Uso

## 📊 Visão Geral

A instrumentação Sentry AI Agent Monitoring foi implementada para rastrear e monitorar todos os agentes de IA do sistema em tempo real. Os dados aparecem no **Sentry AI Insights Dashboard**.

## 🎯 O que é Monitorado

### 1. Invocação de Agentes (`gen_ai.invoke_agent`)
- **Quando**: Toda vez que um agente IA é chamado
- **Dados capturados**:
  - Nome do agente (Harvey Specter, Mrs. Justin-e, etc)
  - Modelo usado (gemini-2.5-pro)
  - Provider (google.gemini)
  - Tokens utilizados (input/output/total)
  - Resposta gerada

### 2. Chamadas LLM (`gen_ai.chat`)
- **Quando**: Interações diretas com modelos de IA
- **Dados capturados**:
  - Mensagens enviadas (prompts)
  - Configuração do modelo (temperature, maxTokens)
  - Resposta do LLM
  - Uso de tokens

### 3. Execução de Ferramentas (`gen_ai.execute_tool`)
- **Quando**: Agentes chamam ferramentas externas
- **Dados capturados**:
  - Nome da ferramenta
  - Input fornecido
  - Output retornado

### 4. Handoffs (`gen_ai.handoff`)
- **Quando**: Um agente transfere trabalho para outro
- **Dados capturados**:
  - Agente origem
  - Agente destino

## 🔧 Funções Implementadas

### `startAgentInvokeSpan()`
```typescript
const span = startAgentInvokeSpan(agent, {
  model: "gemini-2.5-pro",
  provider: "google.gemini",
  temperature: 0.7,
  maxTokens: 4096,
});
```

### `finishAgentInvokeSpan()`
```typescript
finishAgentInvokeSpan(span, {
  output: "Análise concluída...",
  tokensUsed: {
    input: 150,
    output: 500,
    total: 650
  }
});
```

### `startAIChatSpan()`
```typescript
const chatSpan = startAIChatSpan({
  model: "gemini-2.5-pro",
  provider: "google.gemini",
  messages: [{ role: "user", content: "Analise este processo" }],
  temperature: 0.7,
});
```

### `finishAIChatSpan()`
```typescript
finishAIChatSpan(chatSpan, {
  text: "Resposta do modelo...",
  tokensUsed: { total: 650 }
});
```

## 📈 Onde Ver os Dados

### Sentry Dashboard
1. Acesse: https://sentry.io/organizations/[org]/insights/ai/agents/
2. Visualize métricas:
   - **Token Usage**: Custo por agente/modelo
   - **Latency**: Tempo de resposta
   - **Error Rate**: Taxa de falhas
   - **Agent Performance**: Performance comparativa

### Filtros Disponíveis
- Por agente: `gen_ai.agent.name:"Harvey Specter"`
- Por modelo: `gen_ai.request.model:"gemini-2.5-pro"`
- Por operação: `gen_ai.operation.name:"chat"`

## 🚀 Agentes Instrumentados

| Agente | Status | Provider |
|--------|--------|----------|
| Harvey Specter | ✅ Ativo | Gemini 2.5 Pro |
| Mrs. Justin-e | ✅ Ativo | Gemini 2.5 Pro |
| Análise Documental | ✅ Ativo | Gemini 2.5 Pro |
| Monitor DJEN | ✅ Ativo | Gemini 2.5 Pro |
| Gestão de Prazos | ✅ Ativo | Gemini 2.5 Pro |
| Redação de Petições | ✅ Ativo | Gemini 2.5 Pro |
| Todos os 15 agentes | ✅ Ativo | Gemini 2.5 Pro |

## 🔍 Exemplos de Uso

### Monitorar Token Usage
```sql
-- Query no Sentry
SELECT 
  gen_ai.agent.name,
  SUM(gen_ai.usage.total_tokens) as total_tokens
FROM spans
WHERE op = 'gen_ai.invoke_agent'
GROUP BY gen_ai.agent.name
ORDER BY total_tokens DESC
```

### Detectar Agentes Lentos
```sql
SELECT 
  gen_ai.agent.name,
  AVG(duration) as avg_duration_ms
FROM spans
WHERE op = 'gen_ai.invoke_agent'
GROUP BY gen_ai.agent.name
HAVING avg_duration_ms > 5000
```

## ⚠️ Notas Importantes

1. **Spans são finalizados automaticamente** com `try/catch/finally`
2. **Erros são capturados** e marcados no span com `code: 2`
3. **Dados sensíveis**: Mensagens completas são stringificadas (JSON)
4. **Performance**: Overhead mínimo (~1-5ms por span)

## 🛠️ Troubleshooting

### Spans não aparecem no Sentry
- Verificar `SENTRY_DSN` está configurado
- Confirmar que Sentry está inicializado (`src/services/error-tracking.ts`)
- Checar se `tracesSampleRate` > 0

### Token count incorreto
- Gemini API nem sempre retorna token usage
- Fallback: contamos apenas `total_tokens` quando disponível

### Latência alta
- Normal para modelos grandes (gemini-2.5-pro)
- Streaming reduz tempo percebido

## 📚 Referências

- [Sentry AI Monitoring Docs](https://docs.sentry.io/platforms/python/tracing/instrumentation/custom-instrumentation/ai-agents/)
- [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Código fonte: `/src/lib/sentry-ai-monitoring.ts`](/src/lib/sentry-ai-monitoring.ts)

---

**Última atualização**: 5 de dezembro de 2025
**Versão**: 1.0.0
**Autor**: Assistente Jurídico PJe Team
