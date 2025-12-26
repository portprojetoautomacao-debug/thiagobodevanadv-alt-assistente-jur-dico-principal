/**
 * Exemplos de Uso do Sistema AOP Logging
 *
 * Este arquivo demonstra como usar os decorators e wrappers
 * do sistema AOP para logging automático
 */

import {
  LogMethod,
  LogAgent,
  LogController,
  LogService,
  withRequestContext,
  generateConsolidatedLog,
  aopMiddleware,
  wrapAgentFunction,
} from "./aop-logging";
import type { Expediente } from "@/types";
import type { AgentTask } from "./agents";

// ============================================================================
// EXEMPLO 1: Decorator em Agente IA
// ============================================================================

class JustineAgent {
  @LogAgent("justine")
  async analyzeIntimacao(expediente: Expediente) {
    // Automaticamente logado:
    // - Input: expediente (sanitizado)
    // - Output: resultado da análise
    // - Duration: tempo de execução
    // - CorrelationId: rastreamento completo

    const analysis = {
      tipo: "INTIMAÇÃO",
      prazo: 15,
      urgencia: "alta" as const,
      requerAcao: true,
    };

    return analysis;
  }

  @LogAgent("justine")
  async generateTask(analysis: any): Promise<AgentTask> {
    // Cada método gera seu próprio log
    // Todos são agregados no history do RequestContext

    const task: AgentTask = {
      id: crypto.randomUUID(),
      type: "ANALYZE_INTIMATION",
      status: "queued",
      priority: analysis.urgencia === "alta" ? "high" : "medium",
      createdAt: new Date().toISOString(),
      agentId: "justine",
      data: {}, // Required property
    };

    return task;
  }
}

// ============================================================================
// EXEMPLO 2: Decorator em Service
// ============================================================================

class DocumentService {
  @LogService()
  async processDocument(docId: string) {
    // Log minimalista (só duration, sem input/output)

    await new Promise((resolve) => setTimeout(resolve, 100));
    return { processed: true };
  }

  @LogMethod({ logInput: true, logOutput: true, sanitize: true })
  async validateDocument(doc: any) {
    // Log customizado com sanitização

    if (!doc.numero) {
      throw new Error("Documento sem número");
    }

    return { valid: true };
  }
}

// ============================================================================
// EXEMPLO 3: API Route com AOP Middleware
// ============================================================================

// Vercel Function com middleware AOP
export default aopMiddleware(async (req, res) => {
  // Contexto criado automaticamente
  // Todos os logs terão o mesmo correlationId

  const agent = new JustineAgent();
  const expediente = req.body;

  // Cada chamada gera um log individual + adiciona ao history
  const analysis = await agent.analyzeIntimacao(expediente);
  const task = await agent.generateTask(analysis);

  const service = new DocumentService();
  await service.processDocument(task.id);

  // No final, log consolidado é gerado automaticamente:
  // {
  //   correlationId: "uuid",
  //   totalDuration: 250,
  //   history: [
  //     { method: 'analyzeIntimacao', duration: 100, status: 'success' },
  //     { method: 'generateTask', duration: 50, status: 'success' },
  //     { method: 'processDocument', duration: 100, status: 'success' }
  //   ],
  //   summary: { totalCalls: 3, successCalls: 3, errorCalls: 0 }
  // }

  res.status(200).json({ task });
});

// ============================================================================
// EXEMPLO 4: Wrapper para Função Existente (Sem Modificar Código)
// ============================================================================

// Função existente sem decorator
async function existingAnalyzeFunction(data: any) {
  return { result: "analysis" };
}

// Adicionar AOP sem modificar o original
const analyzeFunctionWithAOP = wrapAgentFunction(
  "analise-documental",
  "Analisador de Documentos",
  existingAnalyzeFunction
);

// Uso
async function example() {
  return withRequestContext(async () => {
    const result = await analyzeFunctionWithAOP({ doc: "data" });

    // Log consolidado disponível
    const log = generateConsolidatedLog();
    console.log("Consolidated Log:", JSON.stringify(log, null, 2));

    return result;
  });
}

// ============================================================================
// EXEMPLO 5: Workflow Completo com History
// ============================================================================

async function workflowCompletoAOP() {
  return withRequestContext(async () => {
    const agent = new JustineAgent();
    const service = new DocumentService();

    // 1. Analisar intimação
    const analysis = await agent.analyzeIntimacao({
      id: "123",
      tipo: "intimacao",
      conteudo: "Intimação para manifestação em 15 dias",
    } as Expediente);

    // 2. Gerar tarefa
    const task = await agent.generateTask(analysis);

    // 3. Processar documento
    await service.processDocument(task.id);

    // 4. Log consolidado final
    const consolidatedLog = generateConsolidatedLog();

    // Resultado similar ao Spring Boot:
    // {
    //   "correlationId": "8f3e9c...",
    //   "totalDuration": 350,
    //   "timestamp": "2024-12-26T13:30:00.000Z",
    //   "metadata": {},
    //   "history": [
    //     {
    //       "method": "analyzeIntimacao",
    //       "className": "JustineAgent",
    //       "duration": 150,
    //       "status": "success",
    //       "agentId": "justine"
    //     },
    //     {
    //       "method": "generateTask",
    //       "className": "JustineAgent",
    //       "duration": 100,
    //       "status": "success",
    //       "agentId": "justine"
    //     },
    //     {
    //       "method": "processDocument",
    //       "className": "DocumentService",
    //       "duration": 100,
    //       "status": "success"
    //     }
    //   ],
    //   "summary": {
    //     "totalCalls": 3,
    //     "successCalls": 3,
    //     "errorCalls": 0,
    //     "avgDuration": 116.67
    //   }
    // }

    return consolidatedLog;
  });
}

// ============================================================================
// EXEMPLO 6: Integração com Agentes Existentes
// ============================================================================

// Importar agente existente
import { processAutonomousTask } from "@/hooks/use-autonomous-agents";

// Wrappear sem modificar código original
export const processAutonomousTaskWithAOP = wrapAgentFunction(
  "autonomous",
  "Autonomous Task Processor",
  processAutonomousTask
);

// Usar no lugar do original
async function processarTarefaComAOP(task: AgentTask) {
  return withRequestContext(
    async () => {
      const result = await processAutonomousTaskWithAOP(task);

      // Log consolidado disponível
      const log = generateConsolidatedLog();

      // Enviar para Sentry/monitoring
      if (log) {
        // await sendToMonitoring(log);
      }

      return result;
    },
    { taskId: task.id, taskType: task.type }
  );
}

// ============================================================================
// UTILITY: Sanitização
// ============================================================================

function sanitizeData(data: any): any {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      typeof value === "string" &&
      (key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("key"))
    ) {
      sanitized[key] = "***REDACTED***";
    } else {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
}

// ============================================================================
// EXPORT
// ============================================================================

export { JustineAgent, DocumentService, workflowCompletoAOP, processarTarefaComAOP };
