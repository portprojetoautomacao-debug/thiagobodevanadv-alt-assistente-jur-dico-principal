# 🔍 AI Toolkit - Tracing Habilitado

## ✅ Configuração Completa para Desenvolvimento Local

Este guia mostra como habilitar **tracing avançado com OpenTelemetry** para debugging profundo dos agentes de IA.

---

## 🎯 O que é AI Toolkit / Tracing?

**OpenTelemetry Tracing** permite visualizar:
- ✅ Todas as chamadas aos agentes de IA
- ✅ Tempo de resposta de cada operação
- ✅ Fluxo completo de requisições
- ✅ Erros e exceções em tempo real
- ✅ Performance dos modelos LLM

---

## 📦 Opções de Configuração

### **Opção 1: Mock Server (Recomendado para Dev)** ✅

**Vantagens:**
- Sem instalação de dependências externas
- Leve e rápido
- Aceita traces mas não os processa (apenas logging)

**Como usar:**

```bash
# Terminal 1: Iniciar OTLP Mock Server
npm run tracing:start

# Terminal 2: Iniciar app com tracing habilitado
npm run dev

# Ou iniciar ambos de uma vez:
npm run dev:with-tracing
```

**Porta:** `4318` (padrão OTLP HTTP)  
**Endpoint:** `http://localhost:4318/v1/traces`

---

### **Opção 2: OpenTelemetry Collector (Produção/Avançado)**

**Vantagens:**
- Processa e exporta traces para backends (Jaeger, Zipkin, etc.)
- Permite visualização avançada de traces
- Suporta múltiplos backends

**Como usar:**

1. **Instalar OpenTelemetry Collector:**

```bash
# Linux/Mac
wget https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.91.0/otelcol_0.91.0_linux_amd64.tar.gz
tar -xvf otelcol_0.91.0_linux_amd64.tar.gz
sudo mv otelcol /usr/local/bin/

# Ou via Docker
docker run -p 4318:4318 -p 4317:4317 otel/opentelemetry-collector
```

2. **Criar arquivo de configuração `otel-config.yaml`:**

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:

exporters:
  logging:
    loglevel: debug
  jaeger:
    endpoint: localhost:14250
    tls:
      insecure: true

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging, jaeger]
```

3. **Iniciar Collector:**

```bash
otelcol --config otel-config.yaml
```

---

## 🔧 Configuração do .env

O arquivo `.env` já está configurado para tracing:

```bash
# Tracing habilitado
VITE_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTLP_ENDPOINT=http://localhost:4318/v1/traces
VITE_ENABLE_TRACING=true
```

**Para desabilitar tracing:**

```bash
# Tracing desabilitado
VITE_OTLP_ENDPOINT=
VITE_ENABLE_TRACING=false
```

---

## 🚀 Como Usar

### **1. Iniciar com Mock Server (Simples)**

```bash
# Em um terminal
npm run tracing:start

# Em outro terminal
npm run dev
```

**Ou iniciar tudo de uma vez:**

```bash
npm run dev:with-tracing
```

### **2. Visualizar Logs de Traces**

Os traces aparecerão no terminal do OTLP Mock Server:

```
[2025-12-15T16:40:00.000Z] ✅ Trace recebido (#1) - 2456 bytes
[2025-12-15T16:40:01.234Z] ✅ Trace recebido (#2) - 1892 bytes
```

### **3. Health Check**

```bash
curl http://localhost:4318/health
```

**Resposta:**

```json
{
  "status": "healthy",
  "tracesReceived": 42,
  "uptime": 123.45,
  "lastTrace": {
    "timestamp": "2025-12-15T16:40:01.234Z",
    "size": 1892
  }
}
```

---

## 📊 Produção

Para produção, configure um backend OTLP real:

**Opções populares:**
- **Vercel OpenTelemetry** (integrado)
- **Grafana Tempo** (gratuito)
- **Honeycomb** (gratuito até 20GB/mês)
- **Jaeger** (self-hosted, gratuito)
- **Zipkin** (self-hosted, gratuito)

**Configuração no Vercel:**

```bash
# No dashboard do Vercel, adicionar:
VITE_OTLP_ENDPOINT=https://your-collector-url/v1/traces
OTLP_ENDPOINT=https://your-collector-url/v1/traces
VITE_ENABLE_TRACING=true
```

---

## 🛠️ Troubleshooting

### **Erro: "Failed to send traces"**

1. Verificar se o servidor OTLP está rodando:
   ```bash
   curl http://localhost:4318/health
   ```

2. Verificar porta 4318 está livre:
   ```bash
   lsof -i:4318
   ```

3. Reiniciar servidor OTLP:
   ```bash
   # Matar processo na porta 4318
   lsof -ti:4318 | xargs kill -9
   
   # Reiniciar
   npm run tracing:start
   ```

### **Erro: "Port 4318 already in use"**

```bash
# Matar processo existente
lsof -ti:4318 | xargs kill -9

# Ou usar porta alternativa
OTLP_PORT=4319 npm run tracing:start
```

---

## 📚 Recursos Adicionais

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [OTLP Specification](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/otlp.md)
- [Vercel OpenTelemetry](https://vercel.com/docs/observability/otel-overview)

---

## ✅ Resumo

| Aspecto | Mock Server | OpenTelemetry Collector |
|---------|-------------|-------------------------|
| **Instalação** | ✅ Zero (built-in) | ⚠️ Requer instalação |
| **Complexidade** | ✅ Simples | ⚠️ Moderada |
| **Uso** | 🔧 Desenvolvimento | 🚀 Produção |
| **Visualização** | ⚠️ Apenas logs | ✅ UI avançada |
| **Performance** | ✅ Leve | ⚠️ Mais pesado |

**Recomendação:** Use **Mock Server** para desenvolvimento local e **OpenTelemetry Collector** para produção.
