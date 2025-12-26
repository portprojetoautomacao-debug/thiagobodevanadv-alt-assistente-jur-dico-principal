# 🎯 Sistema AOP Logging (Spring Boot Style)

**Data de Implementação:** 26/12/2025
**Arquivos:** `src/lib/aop-logging.ts`, `src/lib/aop-logging-examples.ts`, `src/lib/aop-logging.test.ts`
**Testes:** 14/14 passando ✅

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Features](#features-implementadas)
3. [Decorators Disponíveis](#decorators-disponíveis)
4. [Request Context](#request-context)
5. [Consolidated Log](#consolidated-log)
6. [Wrapper para Código Legado](#wrapper-para-código-legado)
7. [Middleware Vercel](#middleware-para-vercel-functions)
8. [Comparação com Spring Boot](#comparação-com-spring-boot-aop)
9. [Arquivos do Sistema](#arquivos-do-sistema-aop)
10. [Como Usar](#como-usar)

---

## Visão Geral

O projeto possui um **sistema de logging automático** inspirado no **Spring Boot AOP (@Aspect/@Around)**, usando decorators TypeScript para observabilidade completa sem código boilerplate.

Similar ao Spring Framework, o sistema intercepta execuções de métodos automaticamente, fornecendo:

- Logging estruturado com CorrelationId
- Performance monitoring (duration)
- Exception handling centralizado
- PII filtering automático (LGPD)
- History tracking por request
- Consolidated log no final (como Spring @AfterReturning)

---

## ✨ Features Implementadas

- ✅ **Auto-logging** de métodos com decorators (@LogMethod, @LogAgent, @LogController, @LogService)
- ✅ **Request Context global** (AsyncLocalStorage - similar ao RequestContextHolder do Spring)
- ✅ **History tracking** de todas as execuções em uma request
- ✅ **CorrelationId automático** (UUID único por request)
- ✅ **Performance monitoring** (duration de cada método)
- ✅ **Exception handling** centralizado
- ✅ **PII filtering** automático (LGPD compliant)
- ✅ **Consolidated Log** no final da request (similar ao Spring)
- ✅ **Wrapper para código legado** (sem modificar código existente)

---

## 🧩 Decorators Disponíveis

### 1. @LogMethod() - Logging Geral

Logging completo com input/output/duration/errors.

**Uso:**

```typescript
import { LogMethod } from '@/lib/aop-logging';

class DocumentService {
  @LogMethod()
  async processDocument(docId: string) {
    // Automaticamente logado com:
    // - correlationId
    // - duration
    // - input (sanitizado)
    // - output (sanitizado)
    // - errors (se houver)

    return { processed: true };
  }
}
```

**Opções customizadas:**

```typescript
class DocumentService {
  @LogMethod({
    logInput: true,        // Logar argumentos (default: true)
    logOutput: true,       // Logar resultado (default: true)
    logDuration: true,     // Logar duration (default: true)
    sanitize: true,        // Sanitizar PII (default: true)
    agentId: 'custom'      // Agent ID customizado
  })
  async customMethod(data: any) {
    return data;
  }
}
```

---

### 2. @LogAgent(agentId) - Para Agentes IA

Logging especializado para agentes de IA com agentId para rastreamento.

**Uso:**

```typescript
import { LogAgent } from '@/lib/aop-logging';

class JustineAgent {
  @LogAgent('justine')
  async analyzeIntimacao(expediente: Expediente) {
    // Log especial para agentes com agentId
    // Sanitização automática habilitada
    // Duration tracking automático

    const analysis = {
      urgencia: 'alta',
      prazo: 15,
      tipo: 'manifestacao'
    };

    return analysis;
  }
}
```

**Log gerado:**

```json
{
  "class": "JustineAgent",
  "method": "analyzeIntimacao",
  "correlationId": "abc123",
  "agentId": "justine",
  "duration": 250,
  "status": "success",
  "timestamp": "2025-12-26T15:30:00.000Z"
}
```

---

### 3. @LogController() - Para API Routes

Logging com input/output sanitizado, ideal para controllers/API routes.

**Uso:**

```typescript
import { LogController } from '@/lib/aop-logging';

class ProcessController {
  @LogController()
  async handleRequest(req: Request) {
    // Input e output sempre sanitizados (LGPD)
    // PII filtering automático

    return {
      status: 'ok',
      processId: req.body.processId
    };
  }
}
```

---

### 4. @LogService() - Para Services (Minimalista)

Logging minimalista apenas com duration, sem input/output (performance).

**Uso:**

```typescript
import { LogService } from '@/lib/aop-logging';

class EmailService {
  @LogService()
  async sendEmail(to: string, subject: string) {
    // Log apenas com duration
    // Sem input/output para evitar PII leakage
    // Ideal para operações sensíveis

    return { sent: true };
  }
}
```

---

## 🌐 Request Context (Similar ao Spring RequestContextHolder)

O sistema usa **AsyncLocalStorage** (Node.js) para manter um contexto global isolado por request, similar ao **RequestContextHolder** do Spring.

### Como Usar

```typescript
import {
  withRequestContext,
  getCurrentContext,
  getCorrelationId,
  generateConsolidatedLog
} from '@/lib/aop-logging';

// Criar contexto para toda a request
await withRequestContext(async () => {
  const correlationId = getCorrelationId(); // UUID único
  console.log('CorrelationId:', correlationId);

  // Todos os métodos decorados dentro compartilham o mesmo contexto
  const agent = new JustineAgent();
  const service = new DocumentService();

  await agent.analyzeIntimacao(expediente);
  await service.processDocument(docId);

  // Acessar contexto atual
  const ctx = getCurrentContext();
  console.log('History:', ctx?.history);

  // Log consolidado final
  const log = generateConsolidatedLog();
  console.info('[REQUEST_COMPLETE]', log);

}, { userId: '123', requestType: 'analyze' }); // Metadata opcional
```

### Context Structure

```typescript
interface RequestContext {
  requestId: string;         // CorrelationId (UUID)
  startTime: number;         // Timestamp de início
  history: ExecutionHistory[]; // Array de execuções
  metadata: Record<string, any>; // Metadata customizada
  agentId?: string;          // Agent ID se aplicável
  userId?: string;           // User ID se aplicável
}

interface ExecutionHistory {
  method: string;            // Nome do método
  className: string;         // Nome da classe
  duration: number;          // Duration em ms
  timestamp: number;         // Timestamp Unix
  status: "success" | "error";
  input?: any;               // Input sanitizado (se logInput: true)
  output?: any;              // Output sanitizado (se logOutput: true)
  error?: string;            // Mensagem de erro (se falhou)
  agentId?: string;          // Agent ID (se @LogAgent)
}
```

---

## 📊 Consolidated Log (Fim da Request)

No final de cada request, o sistema gera um **log consolidado** com todo o histórico de execuções, similar ao `@AfterReturning` do Spring.

### Exemplo de Log Consolidado

```json
{
  "correlationId": "8f3e9c12-4a5b-4c3d-8e9f-1234567890ab",
  "totalDuration": 350,
  "timestamp": "2025-12-26T15:30:00.000Z",
  "metadata": {
    "userId": "123",
    "requestType": "analyze"
  },
  "agentId": "justine",
  "userId": "123",
  "history": [
    {
      "method": "analyzeIntimacao",
      "className": "JustineAgent",
      "duration": 200,
      "timestamp": 1703608200000,
      "status": "success",
      "input": { "tipo": "INTIMACAO" },
      "output": { "urgencia": "alta" },
      "agentId": "justine"
    },
    {
      "method": "processDocument",
      "className": "DocumentService",
      "duration": 100,
      "timestamp": 1703608200200,
      "status": "success"
    },
    {
      "method": "sendResponse",
      "className": "ProcessController",
      "duration": 50,
      "timestamp": 1703608200300,
      "status": "success"
    }
  ],
  "summary": {
    "totalCalls": 3,
    "successCalls": 3,
    "errorCalls": 0,
    "avgDuration": 116.67
  }
}
```

### Usando o Consolidated Log

```typescript
import { generateConsolidatedLog } from '@/lib/aop-logging';

await withRequestContext(async () => {
  // ... executar métodos decorados ...

  // Gerar log consolidado
  const log = generateConsolidatedLog();

  // Enviar para monitoring (Sentry, CloudWatch, etc.)
  await sendToMonitoring(log);

  // Ou apenas logar
  console.info('[REQUEST_COMPLETE]', JSON.stringify(log, null, 2));
});
```

---

## 🔧 Wrapper para Código Legado (Sem Modificar)

Para adicionar AOP a **código existente sem modificar** o original, use `wrapAgentFunction`.

### Como Usar

```typescript
import { wrapAgentFunction } from '@/lib/aop-logging';

// Função existente sem decorator
async function existingAnalyzeFunction(data: any) {
  console.log('Analyzing...', data);
  return { result: 'analysis completed' };
}

// Adicionar AOP sem modificar o original
const analyzeFunctionWithAOP = wrapAgentFunction(
  'analise-documental',         // Agent ID
  'Analisador de Documentos',   // Agent Name
  existingAnalyzeFunction       // Função original
);

// Usar a versão wrapeada (cria contexto automaticamente)
const result = await analyzeFunctionWithAOP({ doc: 'data' });

// Log gerado automaticamente:
// {
//   "method": "execute",
//   "className": "Analisador de Documentos",
//   "agentId": "analise-documental",
//   "duration": 50,
//   "status": "success"
// }
```

### Integrando com Agentes Existentes

```typescript
// Importar agente existente
import { processAutonomousTask } from '@/hooks/use-autonomous-agents';

// Wrappear sem modificar código original
export const processAutonomousTaskWithAOP = wrapAgentFunction(
  'autonomous',
  'Autonomous Task Processor',
  processAutonomousTask
);

// Usar no lugar do original
async function processarTarefaComAOP(task: AgentTask) {
  const result = await processAutonomousTaskWithAOP(task);

  // Log consolidado disponível
  const log = generateConsolidatedLog();

  // Enviar para Sentry/monitoring
  if (log) {
    await sendToMonitoring(log);
  }

  return result;
}
```

---

## 🧪 Middleware para Vercel Functions

Para Vercel Functions, use o **middleware AOP** que cria contexto automaticamente.

### Como Usar

```typescript
import { aopMiddleware } from '@/lib/aop-logging';

export default aopMiddleware(async (req, res) => {
  // Contexto criado automaticamente
  // Todos os logs terão o mesmo correlationId
  // Metadata automaticamente populada (method, url, userAgent)

  const agent = new JustineAgent();
  const result = await agent.analyzeIntimacao(req.body);

  // Log consolidado gerado automaticamente no final
  // [AOP:REQUEST_COMPLETE] { correlationId, totalDuration, history, summary }

  return res.json(result);
});
```

### Middleware com Tratamento de Erros

```typescript
export default aopMiddleware(async (req, res) => {
  try {
    const result = await processRequest(req.body);
    return res.json(result);
  } catch (error) {
    // Log consolidado incluirá o erro automaticamente
    // [AOP:REQUEST_ERROR] { correlationId, error, stack, history }

    return res.status(500).json({ error: 'Internal error' });
  }
});
```

---

## 🔍 Comparação com Spring Boot AOP

| Spring Boot | TypeScript AOP (Este projeto) |
|-------------|------------------------------|
| `@Aspect` + `@Around` | `@LogMethod()` decorator |
| `@Pointcut` | Decorator aplicado diretamente |
| `ProceedingJoinPoint.proceed()` | `originalMethod.apply()` |
| `RequestContextHolder` | `AsyncLocalStorage` + `withRequestContext()` |
| `MDC` (Mapped Diagnostic Context) | Request Context metadata |
| `@AfterReturning` | `generateConsolidatedLog()` no final |
| XML/Annotation Configuration | TypeScript decorators |

### Exemplo Comparativo

**Spring Boot (Java):**

```java
@Aspect
@Component
public class LoggingAspect {
  @Around("@annotation(LogMethod)")
  public Object logMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    String correlationId = RequestContextHolder.currentRequestAttributes().getSessionId();
    long start = System.currentTimeMillis();

    try {
      Object result = joinPoint.proceed();
      long duration = System.currentTimeMillis() - start;

      log.info("[{}] Method {} completed in {}ms",
        correlationId, joinPoint.getSignature(), duration);

      return result;
    } catch (Exception e) {
      log.error("[{}] Method {} failed", correlationId, joinPoint.getSignature(), e);
      throw e;
    }
  }
}
```

**TypeScript AOP (Este projeto):**

```typescript
import { LogMethod, withRequestContext } from '@/lib/aop-logging';

class MyService {
  @LogMethod()
  async myMethod(data: any) {
    // Automaticamente:
    // - CorrelationId via AsyncLocalStorage
    // - Duration tracking
    // - Success/Error logging
    // - History tracking

    return result;
  }
}

// Uso
await withRequestContext(async () => {
  const service = new MyService();
  await service.myMethod({ data: 'test' });

  // Log consolidado automático
});
```

---

## 📚 Arquivos do Sistema AOP

| Arquivo | LOC | Descrição |
|---------|-----|-----------|
| `src/lib/aop-logging.ts` | 394 | **Core**: Decorators, Context, Middleware, Wrappers |
| `src/lib/aop-logging-examples.ts` | 257 | **Exemplos**: 6 casos de uso completos |
| `src/lib/aop-logging.test.ts` | 347 | **Testes**: 14 testes unitários (100% cobertura) |
| `src/lib/document-sanitizer.ts` | 98 | **PII Filtering**: Sanitização LGPD compliant |

### Exports Disponíveis

```typescript
// Decorators
export { LogMethod } from '@/lib/aop-logging';
export { LogAgent } from '@/lib/aop-logging';
export { LogController } from '@/lib/aop-logging';
export { LogService } from '@/lib/aop-logging';

// Context
export { withRequestContext } from '@/lib/aop-logging';
export { getCurrentContext } from '@/lib/aop-logging';
export { getCorrelationId } from '@/lib/aop-logging';
export { addToHistory } from '@/lib/aop-logging';

// Utils
export { generateConsolidatedLog } from '@/lib/aop-logging';
export { aopMiddleware } from '@/lib/aop-logging';
export { wrapAgentFunction } from '@/lib/aop-logging';

// Types
export type { RequestContext } from '@/lib/aop-logging';
export type { ExecutionHistory } from '@/lib/aop-logging';
```

---

## 🎯 Como Usar

### 1. Novo Código (Com Decorators)

```typescript
import { LogAgent } from '@/lib/aop-logging';

class MyAgent {
  @LogAgent('my-agent')
  async execute(input: any) {
    // Seu código aqui
    return result;
  }
}
```

### 2. Código Existente (Com Wrapper)

```typescript
import { wrapAgentFunction } from '@/lib/aop-logging';

// Código existente
async function myExistingFunction(input: any) {
  // ...
}

// Wrappear sem modificar
const myFunctionWithAOP = wrapAgentFunction(
  'my-function',
  'My Function Name',
  myExistingFunction
);

// Usar wrapeado
await myFunctionWithAOP(input);
```

### 3. Vercel Functions (Com Middleware)

```typescript
import { aopMiddleware } from '@/lib/aop-logging';

export default aopMiddleware(async (req, res) => {
  // Seu handler aqui
  return res.json({ ok: true });
});
```

### 4. Request Completa (Com Context)

```typescript
import { withRequestContext, generateConsolidatedLog } from '@/lib/aop-logging';

await withRequestContext(async () => {
  // Executar métodos decorados
  await agent1.execute();
  await service1.process();
  await controller1.handle();

  // Log consolidado
  const log = generateConsolidatedLog();
  await sendToMonitoring(log);
}, { userId: '123' });
```

---

## 🚀 Status

- ✅ **Implementado:** 26/12/2025
- ✅ **Testes:** 14/14 passando
- ✅ **Coverage:** 100% nas funções principais
- ✅ **TypeScript:** `experimentalDecorators: true` configurado
- ✅ **PII Filtering:** Integrado e testado
- ✅ **Pronto para Produção:** Sim

---

## 📖 Referências

- **Spring Boot AOP:** https://docs.spring.io/spring-framework/reference/core/aop.html
- **TypeScript Decorators:** https://www.typescriptlang.org/docs/handbook/decorators.html
- **AsyncLocalStorage:** https://nodejs.org/api/async_context.html

---

**Última atualização:** 26/12/2025
