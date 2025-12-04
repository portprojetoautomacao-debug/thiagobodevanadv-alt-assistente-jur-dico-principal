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

// Função para processar análise de intimação
async function processIntimationAnalysis(task: AgentTask): Promise<AnalysisResult> {
  const text = task.data.text || "";
  const processNumber = task.data.processNumber || "N/A";
  const tribunal = task.data.tribunal || "N/A";
  const documentType = task.data.type || "Intimação";

  if (!text || text.length < 50) {
    return {
      success: false,
      error: "Texto da intimação muito curto ou vazio",
    };
  }

  const context = `Processo: ${processNumber} | Tribunal: ${tribunal} | Tipo: ${documentType}`;

  try {
    const aiResponse = await analyzeWithGemini(text, context);

    // Parse and sanitize AI response
    const analysisData = parseAIResponse(aiResponse, documentType);

    // Populate computed deadline dates (if any)
    applyDeadlineDates(analysisData);

    return {
      success: true,
      data: analysisData,
      message: `Análise concluída por Mrs. Justin-e - ${
        analysisData.suggestedActions?.length || 0
      } ações sugeridas`,
    };
  } catch (error) {
    console.error("[Process Task] Error analyzing intimation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido na análise",
    };
  }
}

// Handler principal
export async function dispatchTask(task: AgentTask, _agent: Agent): Promise<AnalysisResult> {
  // Roteia para o processador correto baseado no tipo de tarefa
  switch (task.type) {
    case "analyze_intimation":
    case "analyze_document":
      return await processIntimationAnalysis(task);

    case "monitor-djen":
    case "check-deadlines":
      // Estes são processados pelo cron, não por IA
      return {
        success: true,
        message: `Tarefa ${task.type} processada pelo sistema`,
      };

    default:
      // Análise genérica com IA
      if (task.data.text) {
        return await processIntimationAnalysis(task);
      }
      return {
        success: true,
        message: `Tarefa ${task.type} concluída (sem conteúdo para análise)`,
      };
  }
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
