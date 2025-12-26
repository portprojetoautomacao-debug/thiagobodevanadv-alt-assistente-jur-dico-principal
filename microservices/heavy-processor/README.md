# Heavy Processor Microservice

## 🎯 Visão Geral

Microserviço Java 21 (Spring Boot 3.2) com **Virtual Threads (Project Loom)** para processar tarefas pesadas de forma assíncrona, garantindo estabilidade da aplicação principal React/Node.js.

### 🔥 Por que Virtual Threads?

| Métrica | Threads Nativas | Virtual Threads |
|---------|----------------|-----------------|
| **Memória por thread** | ~2 MB | ~2 KB |
| **Máximo de threads** | ~10.000 | ~10.000.000 |
| **Overhead de contexto** | Alto | Mínimo |
| **Gerenciamento** | Manual | Automático (JVM) |

**Resultado**: Processe **milhões de expedientes** simultaneamente com hardware modesto!

---

## 🚀 Quick Start

### Pré-requisitos

- **Java 21 LTS** (OpenJDK 21.0.9+)
- **Maven 3.9+**
- **RAM**: 512 MB mínimo (1 GB recomendado)

### Instalação

```bash
# 1. Navegar para o microserviço
cd microservices/heavy-processor

# 2. Build
mvn clean package

# 3. Executar
java -jar target/heavy-processor-1.0.0.jar

# OU usar script de conveniência (raiz do projeto)
./scripts/start-heavy-processor.sh
```

### Health Check

```bash
curl http://localhost:8080/actuator/health

# Response:
# {
#   "status": "UP"
# }
```

---

## 📡 API Endpoints

### 1. Processamento em Lote (Batch)

**POST** `/api/v1/process/batch`

```typescript
// Request
{
  "expedientes": [
    {
      "id": "exp-123",
      "tipo": "intimacao",
      "conteudo": "...",
      // ... outros campos de Expediente
    }
  ],
  "operation": "pdf-extraction" | "batch-sync" | "bulk-analysis",
  "options": {
    "parallel": true,
    "priority": "high" | "normal" | "low",
    "maxThreads": 1000
  }
}

// Response
{
  "success": true,
  "results": [
    {
      "expedienteId": "exp-123",
      "success": true,
      "data": {
        "extractedText": "...",
        "analysis": "...",
        "metadata": {}
      }
    }
  ],
  "executionTimeMs": 1250,
  "threadsUsed": 10
}
```

### 2. Processamento com Streaming (SSE)

**POST** `/api/v1/process/stream`

```bash
curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"expedientes": [...], "operation": "bulk-analysis"}' \
  http://localhost:8080/api/v1/process/stream

# Response (Server-Sent Events):
data: {"expedienteId":"exp-123","status":"processing","progress":0.0}
data: {"expedienteId":"exp-123","status":"completed","progress":100.0,"chunk":"Análise completa"}
data: [DONE]
```

---

## 🔌 Integração com React App

### 1. Configurar Variáveis de Ambiente

```bash
# .env.local
VITE_HEAVY_PROCESSOR_URL=http://localhost:8080
VITE_HEAVY_PROCESSOR_API_KEY=seu-api-key-opcional
VITE_HEAVY_PROCESSOR_ENABLED=true
```

### 2. Usar no Frontend

```typescript
import { getHeavyProcessorClient } from '@/services/heavy-processor-client';

const client = getHeavyProcessorClient();

// Verificar disponibilidade
const isAvailable = await client.isAvailable();

// Processar expedientes
const response = await client.processBatch({
  expedientes: expedientes,
  operation: "bulk-analysis",
  options: { parallel: true }
});

// Streaming em tempo real
for await (const chunk of client.processWithStreaming({...})) {
  console.log(chunk.status, chunk.progress);
}
```

### 3. Integração Automática com Agentes

O sistema detecta automaticamente quando deve usar o Heavy Processor:

```typescript
import { tryHeavyProcessorFallback } from '@/lib/heavy-processor-helper';

// Dentro de processNextTask em use-autonomous-agents.ts
const usedFallback = await tryHeavyProcessorFallback(task, expedientes, {
  onChunk: (id, chunk) => console.log(chunk),
  onComplete: (results) => console.log('Concluído!'),
  updateTaskStatus: (id, status) => setTaskStatus(id, status)
});

if (usedFallback) {
  // Heavy Processor lidou com a tarefa
  return;
}

// Continua com processamento local...
```

---

## 🏗️ Arquitetura Interna

### Estrutura do Projeto

```
microservices/heavy-processor/
├── pom.xml                          # Maven config (Java 21 enforced)
├── src/main/
│   ├── java/br/jus/pje/assistente/processor/
│   │   ├── ProcessorApplication.java       # Main class + Virtual Threads config
│   │   ├── controller/
│   │   │   └── ProcessorController.java    # REST endpoints
│   │   ├── service/
│   │   │   ├── HeavyProcessorService.java  # Core processing logic
│   │   │   ├── PdfExtractionService.java   # PDF text extraction
│   │   │   └── AnalysisService.java        # AI analysis
│   │   └── model/
│   │       ├── Expediente.java             # Espelha src/types.ts
│   │       ├── ProcessorRequest.java
│   │       ├── ProcessorResponse.java
│   │       ├── ProcessorResult.java
│   │       └── StreamingChunk.java
│   └── resources/
│       └── application.yml                 # Spring Boot config
└── README.md
```

### Fluxo de Processamento

```
1. Frontend detecta volume alto (> 10 expedientes) ou PDFs complexos
   ↓
2. shouldUseHeavyProcessor() retorna true
   ↓
3. HeavyProcessorClient envia requisição para Java Service
   ↓
4. Spring Boot cria Virtual Thread para cada expediente
   ↓
5. Processamento paralelo massivo (1000+ threads simultâneas)
   ↓
6. Streaming de progresso via SSE (opcional)
   ↓
7. Retorna resultados ao frontend
   ↓
8. Frontend atualiza UI em tempo real
```

---

## 🧪 Testes

```bash
# Unit tests
mvn test

# Integration tests
mvn verify

# Teste manual de carga
curl -X POST http://localhost:8080/api/v1/process/batch \
  -H "Content-Type: application/json" \
  -d '{
    "expedientes": [/* array com 1000 expedientes */],
    "operation": "bulk-analysis",
    "options": { "parallel": true }
  }'
```

---

## 📊 Métricas e Monitoramento

### Actuator Endpoints (habilitados)

- `/actuator/health` - Health check
- `/actuator/info` - Info da aplicação
- `/actuator/metrics` - Métricas detalhadas

### Exemplo de Métricas

```bash
curl http://localhost:8080/actuator/metrics/jvm.threads.virtual

# Response:
# {
#   "name": "jvm.threads.virtual",
#   "measurements": [
#     {"statistic": "VALUE", "value": 10523}
#   ]
# }
```

---

## 🚀 Deploy

### Opção 1: Railway

```bash
# railway.toml
[build]
builder = "DOCKERFILE"

[deploy]
startCommand = "java -jar target/heavy-processor-1.0.0.jar"
```

### Opção 2: Google Cloud Run

```bash
# Dockerfile
FROM openjdk:21-slim
COPY target/heavy-processor-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

# Deploy
gcloud run deploy heavy-processor \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Opção 3: AWS ECS

```bash
# task-definition.json
{
  "containerDefinitions": [{
    "name": "heavy-processor",
    "image": "openjdk:21",
    "memory": 1024,
    "cpu": 512,
    "portMappings": [{"containerPort": 8080}]
  }]
}
```

---

## 🔐 Segurança

### CORS Configurado

```yaml
# application.yml
cors:
  allowed-origins:
    - http://localhost:5173
    - https://assistente-juridico-github.vercel.app
```

### API Key (Opcional)

```typescript
// Frontend
const client = new HeavyProcessorClient({
  apiKey: import.meta.env.VITE_HEAVY_PROCESSOR_API_KEY
});

// Backend valida header Authorization: Bearer <api-key>
```

---

## 🎯 Quando Usar

| Cenário | Usar Heavy Processor? | Razão |
|---------|----------------------|--------|
| < 10 expedientes | ❌ | Overhead não justificado |
| > 10 expedientes | ✅ | Paralelismo massivo |
| PDFs > 10 MB | ✅ | Evita timeout no Vercel |
| Análise complexa | ✅ | Não bloqueia agentes |
| Tempo real crítico | ❌ | Latência de rede |

---

## 📚 Referências

- [Project Loom (Virtual Threads)](https://openjdk.org/projects/loom/)
- [Spring Boot 3.2 Virtual Threads](https://spring.io/blog/2022/10/11/embracing-virtual-threads)
- [Java 21 Release Notes](https://openjdk.org/projects/jdk/21/)

---

## 🤝 Contribuindo

**MODO MANUTENÇÃO**: Sistema em produção estável. Apenas correções de bugs são aceitas.

Para reportar bugs: abra issue com:
1. Versão Java
2. Payload de teste
3. Logs completos
4. Steps to reproduce

---

## 📄 Licença

MIT License - veja LICENSE na raiz do projeto.
