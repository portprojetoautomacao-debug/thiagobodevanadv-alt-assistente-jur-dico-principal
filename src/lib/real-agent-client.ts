/**
 * Client para interagir com agentes reais (backend)
 * Substitui as simulações por chamadas reais à API
 * Agora com suporte a STREAMING para respostas em tempo real
 */

import type { AgentTask, Agent, AgentTaskResult } from './agents'

interface ProcessTaskAPIResponse {
  result: AgentTaskResult
}

interface FetchTasksAPIResponse {
  tasks?: AgentTask[]
}

interface StreamingCallbacks {
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

/**
 * Processa uma tarefa usando o backend real COM STREAMING
 */
export async function processTaskWithStreamingAI(
  task: AgentTask,
  agent: Agent,
  callbacks?: StreamingCallbacks
): Promise<AgentTaskResult> {
  try {
    const systemPrompt = buildAgentSystemPrompt(agent)
    const userPrompt = buildTaskPrompt(task)

    const response = await fetch('/api/llm-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      throw new Error(`Streaming API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No reader available')

    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed?.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))

          if (json.type === 'content' && json.content) {
            fullContent += json.content
            callbacks?.onChunk?.(json.content)
          } else if (json.type === 'done') {
            callbacks?.onComplete?.(fullContent)
          } else if (json.type === 'error') {
            throw new Error(json.message)
          }
        } catch (e) {
          // Ignorar linhas inválidas
        }
      }
    }

    return {
      success: true,
      message: fullContent || 'Tarefa processada com sucesso',
      data: { content: fullContent, streamedAt: new Date().toISOString() },
      confidence: 0.9
    }
  } catch (error) {
    console.error('[Streaming Agent] Error:', error)
    callbacks?.onError?.(error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}

/**
 * Constrói o system prompt baseado no tipo de agente
 */
function buildAgentSystemPrompt(agent: Agent): string {
  const basePrompts: Record<string, string> = {
    'harvey': `Você é Harvey Specter, estrategista jurídico do escritório.
Analise com visão macro, identifique riscos e oportunidades.
Responda de forma direta e estratégica.`,

    'justine': `Você é Mrs. Justin-e, especialista em análise de intimações judiciais brasileiras.
Identifique prazos, tipo de documento, urgência e ações necessárias.
Retorne análises estruturadas em JSON quando possível.`,

    'analise-documental': `Você é o Agente de Análise Documental.
Extraia informações relevantes de documentos jurídicos.
Classifique e organize dados de forma estruturada.`,

    'monitor-djen': `Você é o Monitor DJEN.
Acompanhe publicações do Diário de Justiça Eletrônico.
Identifique intimações relevantes para o escritório.`,

    'gestao-prazos': `Você é o Gestor de Prazos.
Calcule prazos processuais considerando dias úteis e feriados.
Alerte sobre prazos críticos.`,

    'redacao-peticoes': `Você é um Redator Jurídico Profissional.
Crie petições, recursos e manifestações em linguagem jurídica formal.
Use estrutura correta e cite legislação quando apropriado.`,

    'pesquisa-juris': `Você é um Pesquisador de Jurisprudência.
Busque precedentes relevantes do STF, STJ e tribunais regionais.
Fundamentação sólida para petições.`,

    'analise-risco': `Você é um Analista de Riscos Processuais.
Avalie viabilidade de casos e probabilidade de sucesso.
Calcule custos vs benefícios.`,

    'estrategia-processual': `Você é um Consultor de Estratégia Processual.
Sugira estratégias baseadas em dados e precedentes.
Otimize chances de êxito.`
  }

  return basePrompts[agent.id] || `Você é ${agent.name}, um agente especializado do escritório jurídico.
Execute tarefas de forma eficiente e profissional.`
}

/**
 * Constrói o prompt da tarefa
 */
function buildTaskPrompt(task: AgentTask): string {
  const data = task.data || {}

  let prompt = `**Tarefa: ${task.type}**\n`
  prompt += `Prioridade: ${task.priority}\n\n`

  if (data.description) {
    prompt += `Descrição: ${data.description}\n\n`
  }

  if (data.content || data.teor) {
    prompt += `Conteúdo:\n${data.content || data.teor}\n\n`
  }

  if (data.processNumber) {
    prompt += `Processo: ${data.processNumber}\n`
  }

  if (data.expedienteId) {
    prompt += `ID do Expediente: ${data.expedienteId}\n`
  }

  prompt += `\nExecute a tarefa e forneça uma resposta estruturada.`

  return prompt
}

/**
 * Processa uma tarefa usando o backend real (Spark LLM)
 */
export async function processTaskWithRealAI(
  task: AgentTask,
  agent: Agent
): Promise<AgentTaskResult> {
  try {
    const response = await fetch('/api/agents/process-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        task,
        agent: {
          id: agent.id,
          type: agent.type,
          name: agent.name
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as ProcessTaskAPIResponse

    if (!data || typeof data !== 'object' || !data.result) {
      throw new Error('Invalid API response: missing result')
    }

    return data.result
  } catch (error) {
    console.error('[Real Agent Client] Error processing task:', error)
    throw error
  }
}

/**
 * Busca tarefas pendentes do backend
 */
export async function fetchPendingTasks(agentId?: string): Promise<AgentTask[]> {
  try {
    const url = agentId
      ? `/api/agents/tasks?agentId=${encodeURIComponent(agentId)}&status=queued`
      : '/api/agents/tasks?status=queued'

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as FetchTasksAPIResponse

    return Array.isArray(data.tasks) ? data.tasks : []
  } catch (error) {
    console.error('[Real Agent Client] Error fetching tasks:', error)
    return []
  }
}

/**
 * Envia uma tarefa para a fila de processamento
 */
export async function queueTask(task: AgentTask): Promise<void> {
  try {
    const response = await fetch('/api/agents/queue-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ task })
    })

    if (!response.ok) {
      throw new Error(`Failed to queue task: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.error('[Real Agent Client] Error queueing task:', error)
    throw error
  }
}

/**
 * Monitora DJEN usando o endpoint real
 */
export async function monitorDJEN(tribunais: string[]): Promise<any> {
  try {
    const response = await fetch('/api/djen/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tribunais })
    })

    if (!response.ok) {
      throw new Error(`DJEN API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Real Agent Client] Error monitoring DJEN:', error)
    throw error
  }
}

/**
 * Calcula prazos usando lógica real de dias úteis
 */
export async function calculateRealDeadline(
  startDate: Date,
  businessDays: number,
  tribunalCode?: string
): Promise<any> {
  try {
    const response = await fetch('/api/deadline/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        businessDays,
        tribunalCode
      })
    })

    if (!response.ok) {
      throw new Error(`Deadline API error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('[Real Agent Client] Error calculating deadline:', error)
    throw error
  }
}

/**
 * Verifica se o modo de agentes reais está habilitado
 * SEMPRE retorna true - não há mais modo simulado
 */
export function isRealAgentsEnabled(): boolean {
  // Agentes SEMPRE usam IA real - não há mais modo simulado
  return true
}

/**
 * @deprecated Modo simulado foi removido. Agentes sempre usam IA real.
 */
export function setRealAgentsMode(_enabled: boolean): void {
  console.warn(
    '[DEPRECATED] setRealAgentsMode: Modo simulado foi removido. Agentes sempre usam IA real.'
  )
  // Função mantida apenas para compatibilidade - não faz nada
}
