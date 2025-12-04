/**
 * API para processar tarefas de agentes com IA real
 *
 * POST /api/agents/process-task
 * Body: { task, agent }
 *
 * Usa Gemini API para análise real de intimações
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { analyzeWithGemini } from "../lib/gemini-analyzer.js";
import { AnalysisResult, applyDeadlineDates, parseAIResponse } from "../lib/task-helpers.js";

interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: string;
  status: string;
  createdAt: string;
  data: {
    publicationId?: string;
    text?: string;
    processNumber?: string;
    tribunal?: string;
    type?: string;
    source?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface Agent {
  id: string;
  type: string;
  name: string;
}

/**
 * Valida o texto da intimação
 */
function validateIntimationText(text: string): boolean {
  return !!text && text.length >= 50;
}

/**
 * Constrói contexto para análise
 */
function buildAnalysisContext(task: AgentTask): string {
  const processNumber = task.data.processNumber || "N/A";
  const tribunal = task.data.tribunal || "N/A";
  const documentType = task.data.type || "Intimação";
  return `Processo: ${processNumber} | Tribunal: ${tribunal} | Tipo: ${documentType}`;
}

/**
 * Processa rota de análise de intimação
 */
async function handleIntimationRoute(task: AgentTask): Promise<AnalysisResult> {
  const text = task.data.text || "";

  if (!validateIntimationText(text)) {
    return {
      success: false,
      error: "Texto da intimação muito curto ou vazio",
    };
  }

  const context = buildAnalysisContext(task);

  try {
    const aiResponse = await analyzeWithGemini(text, context);
    const analysisData = parseAIResponse(aiResponse, task.data.type || "Intimação");
    applyDeadlineDates(analysisData);

    return {
      success: true,
      data: analysisData,
      message: `Análise concluída - ${analysisData.suggestedActions?.length || 0} ações sugeridas`,
    };
  } catch (error) {
    console.error("[Process Task] Error analyzing intimation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido na análise",
    };
  }
}

/**
 * Processa rotas de monitoramento
 */
function handleMonitoringRoute(taskType: string): AnalysisResult {
  return {
    success: true,
    message: `Tarefa ${taskType} processada pelo sistema`,
  };
}

/**
 * Processa rota padrão
 */
async function handleDefaultRoute(task: AgentTask): Promise<AnalysisResult> {
  if (task.data.text) {
    return await handleIntimationRoute(task);
  }
  return {
    success: true,
    message: `Tarefa ${task.type} concluída (sem conteúdo para análise)`,
  };
}

/**
 * Verifica se tarefa é de análise
 */
function isAnalysisTask(taskType: string): boolean {
  return taskType === "analyze_intimation" || taskType === "analyze_document";
}

/**
 * Verifica se tarefa é de monitoramento
 */
function isMonitoringTask(taskType: string): boolean {
  return taskType === "monitor-djen" || taskType === "check-deadlines";
}

// Handler principal
export async function dispatchTask(task: AgentTask, _agent: Agent): Promise<AnalysisResult> {
  if (isAnalysisTask(task.type)) {
    return await handleIntimationRoute(task);
  }

  if (isMonitoringTask(task.type)) {
    return handleMonitoringRoute(task.type);
  }

  return await handleDefaultRoute(task);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { task, agent } = req.body as { task: AgentTask; agent: Agent };

  if (!task || !agent) {
    return res.status(400).json({
      error: "Missing required fields: task, agent",
    });
  }

  console.log(`[Process Task] Processing task ${task.id} for agent ${agent.name} (${agent.id})`);

  try {
    const result: AnalysisResult = await dispatchTask(task, agent);

    console.log(
      `[Process Task] Task ${task.id} completed: ${result.success ? "success" : "failed"}`
    );

    return res.status(200).json({
      success: true,
      taskId: task.id,
      agentId: agent.id,
      result,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Process Task] Fatal error:", error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
      taskId: task.id,
      agentId: agent.id,
    });
  }
}
