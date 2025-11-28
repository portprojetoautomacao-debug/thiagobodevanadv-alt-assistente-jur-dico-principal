aqui vai o arquivo revisado, padronizado e pronto pra colar no repositório:

````ts
/**
 * API para processar tarefas de agentes com IA real
 *
 * POST /api/agents/process-task
 * Body: { task, agent }
 *
 * Usa Gemini API para análise real de intimações
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

interface AgentTaskData {
  publicationId?: string
  text?: string
  processNumber?: string
  tribunal?: string
  type?: string
  source?: string
  description?: string
  // Permite campos extras sem perder type safety básica
  [key: string]: unknown
}

interface AgentTask {
  id: string
  agentId: string
  type: string
  priority: string
  status: string
  createdAt: string
  data: AgentTaskData
}

interface Agent {
  id: string
  type: string
  name: string
}

type AnalysisPriority = 'low' | 'medium' | 'high' | 'urgent'

interface AnalysisDeadline {
  days: number
  type: 'úteis' | 'corridos'
  startDate?: string
  endDate?: string
  description?: string
}

interface AnalysisData {
  summary: string
  deadline?: AnalysisDeadline
  suggestedActions: string[]
  priority: AnalysisPriority
  documentType: string
  parties?: {
    author?: string
    defendant?: string
  }
  nextSteps: string[]
  // Permite o modelo devolver informações extras sem quebrar o tipo
  [key: string]: unknown
}

interface AnalysisResult {
  success: boolean
  data?: AnalysisData
  message?: string
  error?: string
}

/**
 * Normaliza prioridade vinda do modelo pra enum interno
 */
function normalizePriority(value: unknown): AnalysisPriority {
  if (typeof value !== 'string') return 'medium'
  const v = value.toLowerCase().trim()

  if (v === 'low') return 'low'
  if (v === 'medium' || v === 'normal') return 'medium'
  if (v === 'high' || v === 'alta') return 'high'
  if (v === 'urgent' || v === 'urgente' || v === 'critical' || v === 'crítico') return 'urgent'

  return 'medium'
}

/**
 * Resolve API key do Gemini
 */
function getGeminiApiKey(): string {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GOOGLE_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key não configurada (GEMINI_API_KEY / GOOGLE_API_KEY)')
  }

  return apiKey.trim()
}

/**
 * Chamada à Gemini API (2.5-pro, endpoint v1 oficial)
 */
async function analyzeWithGemini(text: string, context: string): Promise<string> {
  const apiKey = getGeminiApiKey()

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

Retorne APENAS o JSON, sem markdown ou explicações.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Gemini API error: ${response.status} - ${errorText || 'no body'}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const parts = data.candidates?.[0]?.content?.parts || []
  const generatedText = parts.map(p => p.text || '').join('\n').trim()

  if (!generatedText) {
    throw new Error('No response text from Gemini')
  }

  return generatedText
}

/**
 * Tenta parsear JSON retornado pela IA, com alguns fallbacks
 */
function parseAnalysisJson(raw: string, fallbackDocumentType: string): AnalysisData {
  // Remove possíveis marcadores de código
  const cleanJson = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    const parsed = JSON.parse(cleanJson) as Partial<AnalysisData>

    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : raw.substring(0, 500)

    const suggestedActions =
      Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0
        ? parsed.suggestedActions.map(String)
        : ['Revisar intimação manualmente']

    const nextSteps =
      Array.isArray(parsed.nextSteps) && parsed.nextSteps.length > 0
        ? parsed.nextSteps.map(String)
        : ['Análise manual requerida']

    const priority = normalizePriority(parsed.priority)

    const documentType =
      typeof parsed.documentType === 'string' && parsed.documentType.trim().length > 0
        ? parsed.documentType
        : fallbackDocumentType

    const deadline = parsed.deadline
      ? {
          days: Number((parsed.deadline as AnalysisDeadline).days) || 0,
          type:
            (parsed.deadline as AnalysisDeadline).type === 'corridos'
              ? 'corridos'
              : 'úteis',
          description: (parsed.deadline as AnalysisDeadline).description
        }
      : undefined

    return {
      summary,
      suggestedActions,
      nextSteps,
      priority,
      documentType,
      deadline,
      parties: parsed.parties
    }
  } catch {
    // Fallback bem defensivo se o JSON vier quebrado
    return {
      summary: cleanJson.substring(0, 500),
      suggestedActions: ['Revisar intimação manualmente'],
      priority: 'medium',
      documentType: fallbackDocumentType,
      nextSteps: ['Análise manual requerida']
    }
  }
}

/**
 * Calcula datas de início/fim do prazo, considerando dias úteis/corridos
 */
function computeDeadlineDates(deadline: AnalysisDeadline | undefined): AnalysisDeadline | undefined {
  if (!deadline || !deadline.days || deadline.days <= 0) return deadline

  const startDate = new Date()
  const endDate = new Date(startDate)

  if (deadline.type === 'úteis') {
    // Aproximação: só pula fim de semana (sem feriados)
    let daysAdded = 0
    while (daysAdded < deadline.days) {
      endDate.setDate(endDate.getDate() + 1)
      const dayOfWeek = endDate.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        daysAdded++
      }
    }
  } else {
    endDate.setDate(endDate.getDate() + deadline.days)
  }

  return {
    ...deadline,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

/**
 * Processa análise de intimação usando Gemini
 */
async function processIntimationAnalysis(task: AgentTask): Promise<AnalysisResult> {
  const text = (task.data.text || '').toString()
  const processNumber = (task.data.processNumber || 'N/A').toString()
  const tribunal = (task.data.tribunal || 'N/A').toString()
  const documentType = (task.data.type || 'Intimação').toString()

  if (!text || text.length < 50) {
    return {
      success: false,
      error: 'Texto da intimação muito curto ou vazio'
    }
  }

  const context = `Processo: ${processNumber} | Tribunal: ${tribunal} | Tipo: ${documentType}`

  try {
    const aiResponse = await analyzeWithGemini(text, context)
    const parsed = parseAnalysisJson(aiResponse, documentType)

    const deadlineWithDates = computeDeadlineDates(parsed.deadline)

    const finalData: AnalysisData = {
      ...parsed,
      deadline: deadlineWithDates
    }

    return {
      success: true,
      data: finalData,
      message: `Análise concluída por Mrs. Justin-e - ${
        finalData.suggestedActions?.length || 0
      } ações sugeridas`
    }
  } catch (error) {
    console.error('[Process Task] Error analyzing intimation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na análise'
    }
  }
}

// Handler principal
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { task, agent } = (req.body || {}) as { task?: AgentTask; agent?: Agent }

  if (!task || !agent) {
    return res.status(400).json({
      error: 'Missing required fields: task, agent'
    })
  }

  console.log(
    `[Process Task] Processing task ${task.id} for agent ${agent.name} (${agent.id})`
  )

  try {
    let result: AnalysisResult

    // Roteia para o processador correto baseado no tipo de tarefa
    const taskType = (task.type || '').toLowerCase()

    switch (taskType) {
      case 'analyze_intimation':
      case 'analyze-intimation':
      case 'analyze_document':
      case 'analyze-document':
        result = await processIntimationAnalysis(task)
        break

      case 'monitor-djen':
      case 'check-deadlines':
      case 'monitor_djen':
      case 'check_deadlines':
        // Estes são processados pelo cron, não por IA aqui
        result = {
          success: true,
          message: `Tarefa ${task.type} processada pelo sistema (cron)`
        }
        break

      default:
        // Análise genérica com IA se houver texto
        if (task.data?.text) {
          result = await processIntimationAnalysis(task)
        } else {
          result = {
            success: true,
            message: `Tarefa ${task.type} concluída (sem conteúdo para análise)`
          }
        }
    }

    console.log(
      `[Process Task] Task ${task.id} completed: ${result.success ? 'success' : 'failed'}`
    )

    return res.status(200).json({
      success: true,
      taskId: task.id,
      agentId: agent.id,
      result,
      processedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Process Task] Fatal error:', error)

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      taskId: task.id,
      agentId: agent.id
    })
  }
}
````
