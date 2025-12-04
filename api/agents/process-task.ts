/**
 * API para processar tarefas de agentes com IA real
 *
 * POST /api/agents/process-task
 * Body: { task, agent }
 *
 * Usa Gemini API para análise real de intimações
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface AgentTask
{
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
    [ key: string ]: unknown;
  };
}

interface Agent
{
  id: string;
  type: string;
  name: string;
}

interface AnalysisResult
{
  success: boolean;
  data?: {
    summary: string;
    deadline?: {
      days: number;
      type: "úteis" | "corridos";
      startDate: string;
      endDate: string;
    };
    suggestedActions: string[];
    priority: "low" | "medium" | "high" | "urgent";
    documentType: string;
    parties?: {
      author?: string;
      defendant?: string;
    };
    nextSteps: string[];
  };
  message?: string;
  error?: string;
}

// Função para chamar Gemini API
async function analyzeWithGemini (
  text: string,
  context: string
): Promise<string>
{
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const prompt = `Você é Mrs. Justin-e, uma assistente jurídica especialista em análise de intimações judiciais brasileiras.

CONTEXTO: ${context}

INTIMAÇÃO PARA ANÁLISE:
${text}

TAREFA: Analise a intimação acima e retorne um JSON estruturado com:
{
  "summary": "Resumo executivo da intimação em 2-3 frases",
  "deadline": {
    "days": número de dias do prazo,
    "type": "úteis" ou "corridos",
    "description": "descrição do prazo"
  },
  "suggestedActions": ["lista de ações sugeridas"],
  "priority": "low|medium|high|urgent",
  "documentType": "tipo do documento (intimação, citação, despacho, sentença, etc)",
  "parties": {
    "author": "nome do autor/exequente se identificado",
    "defendant": "nome do réu/executado se identificado"
  },
  "nextSteps": ["próximos passos recomendados com prazos"]
}

REGRAS:
- Identifique prazos mencionados (geralmente 5, 10, 15, 30 dias)
- Prazos processuais são em dias úteis, salvo indicação contrária
- Prioridade 'urgent' se prazo < 5 dias
- Prioridade 'high' se prazo < 10 dias
- Sempre sugira ações concretas e práticas

Retorne APENAS o JSON, sem markdown ou explicações.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [ { parts: [ { text: prompt } ] } ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[ 0 ]?.content?.parts?.[ 0 ]?.text;

  if (!generatedText) {
    throw new Error("No response from Gemini");
  }

  return generatedText;
}

// Função para processar análise de intimação
async function processIntimationAnalysis (
  task: AgentTask
): Promise<AnalysisResult>
{
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
      message: `Análise concluída por Mrs. Justin-e - ${analysisData.suggestedActions?.length || 0
        } ações sugeridas`,
    };
  } catch (error) {
    console.error("[Process Task] Error analyzing intimation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Erro desconhecido na análise",
    };
  }
}

// Helper to parse AI's response into a structured AnalysisResult.data
function parseAIResponse (aiResponse: string, documentType: string)
{
  try {
    const cleanJson = aiResponse
      .replaceAll(/```json\n?/g, "")
      .replaceAll(/```\n?/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch {
    return {
      summary: aiResponse.substring(0, 500),
      suggestedActions: [ "Revisar intimação manualmente" ],
      priority: "medium",
      documentType: documentType,
      nextSteps: [ "Análise manual requerida" ],
    } as unknown as AnalysisResult[ "data" ];
  }
}

// Helper to compute and assign startDate/endDate from a 'deadline' object
function applyDeadlineDates (analysisData: AnalysisResult["data"] | null | undefined)
{
  if (!analysisData?.deadline?.days) return;

  const startDate = new Date();
  const endDate = new Date(startDate);

  if (analysisData.deadline.type === "úteis") {
    // Add business days (simple approach - doesn't consider holidays)
    let daysAdded = 0;
    while (daysAdded < analysisData.deadline.days) {
      endDate.setDate(endDate.getDate() + 1);
      const dayOfWeek = endDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++;
      }
    }
  } else {
    endDate.setDate(endDate.getDate() + analysisData.deadline.days);
  }

  analysisData.deadline.startDate = startDate.toISOString().split("T")[ 0 ];
  analysisData.deadline.endDate = endDate.toISOString().split("T")[ 0 ];
}

// Handler principal
export async function dispatchTask (
  task: AgentTask,
  _agent: Agent
): Promise<AnalysisResult>
{
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

export default async function handler (req: VercelRequest, res: VercelResponse)
{
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

  console.log(
    `[Process Task] Processing task ${task.id} for agent ${agent.name} (${agent.id})`
  );

  try {
    const result: AnalysisResult = await dispatchTask(task, agent);

    console.log(
      `[Process Task] Task ${task.id} completed: ${result.success ? "success" : "failed"
      }`
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
