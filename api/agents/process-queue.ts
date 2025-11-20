/**
 * Serverless Agent Queue Processor
 * Processa tarefas reais dos agentes de IA usando Spark LLM
 * 
 * Path: /api/agents/process-queue
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { AgentTask, Agent } from '@/lib/agents';

interface QueueItem {
  task: AgentTask;
  agent: Agent;
}

/**
 * Processa tarefas usando Spark LLM real
 */
async function processTaskWithRealAI(task: AgentTask, agent: Agent): Promise<any> {
  const sparkEndpoint = process.env.GITHUB_RUNTIME_PERMANENT_NAME 
    ? `/_spark/llm`
    : 'https://assistente-jurdico-p.vercel.app/_spark/llm';

  const systemPrompt = getSystemPromptForAgent(agent.type, task.type);
  const userPrompt = getUserPromptForTask(task);

  try {
    const response = await fetch(sparkEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Spark LLM error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResult = data.choices[0]?.message?.content;

    // Parse AI response based on task type
    return parseAIResponse(task.type, aiResult, task.data);

  } catch (error) {
    console.error('[Agent Queue] Error processing with AI:', error);
    throw error;
  }
}

function getSystemPromptForAgent(agentType: string, taskType: string): string {
  const prompts: Record<string, string> = {
    analyzer: `Você é um assistente jurídico especializado em análise de documentos. 
Analise o documento fornecido e extraia informações importantes como prazos, partes, tipo de processo, e ações necessárias.
Retorne sempre em formato JSON estruturado.`,
    
    monitor: `Você é um agente de monitoramento de publicações jurídicas.
Sua função é analisar intimações e publicações do DJEN/DataJud e extrair informações críticas.
Identifique: número do processo, tipo de intimação, prazo, tribunal, e urgência.`,
    
    calculator: `Você é um especialista em cálculo de prazos processuais.
Considere: dias úteis, feriados nacionais, recesso forense, e regras do CPC.
Retorne sempre a data de vencimento e o raciocínio do cálculo.`,
    
    writer: `Você é um redator jurídico especializado.
Crie peças processuais formais, claras e tecnicamente corretas.
Siga sempre as normas da ABNT e formatação jurídica padrão.`,
    
    researcher: `Você é um pesquisador jurídico especializado em jurisprudência.
Analise precedentes, identifique tendências, e forneça recomendações baseadas em casos similares.`,
    
    strategic: `Você é um estrategista jurídico.
Analise casos do ponto de vista estratégico, identifique riscos e oportunidades, sugira melhores abordagens.`,
  };

  return prompts[agentType] || 'Você é um assistente jurídico inteligente.';
}

function getUserPromptForTask(task: AgentTask): string {
  const taskData = JSON.stringify(task.data, null, 2);
  
  const prompts: Record<string, string> = {
    analyze_document: `Analise o seguinte documento e extraia as informações principais:\n\n${taskData}\n\nRetorne em formato JSON com: summary, extractedData, suggestedActions, deadlines.`,
    
    monitor_djen: `Verifique se há novas publicações para os tribunais especificados:\n\n${taskData}\n\nRetorne JSON com: newIntimations (array), checked (boolean), tribunaisVerificados.`,
    
    calculate_deadline: `Calcule o prazo processual com os seguintes dados:\n\n${taskData}\n\nRetorne JSON com: deadline (ISO date), businessDays, reasoning (array de strings).`,
    
    draft_petition: `Redija uma peça processual com as seguintes informações:\n\n${taskData}\n\nRetorne JSON com: draft (texto completo), confidence, needsReview, suggestions.`,
    
    research_precedents: `Pesquise precedentes jurídicos sobre:\n\n${taskData}\n\nRetorne JSON com: precedentsFound, relevantCases (array), thematicAnalysis, recommendation.`,
    
    risk_analysis: `Faça uma análise de risco do caso:\n\n${taskData}\n\nRetorne JSON com: riskLevel, riskScore, factors (array), recommendations, probabilitySuccess.`,
  };

  return prompts[task.type] || `Processe a seguinte tarefa:\n\n${taskData}`;
}

function parseAIResponse(taskType: string, aiResponse: string, taskData: any): any {
  try {
    // Tenta extrair JSON do response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: retorna resposta estruturada
    return {
      rawResponse: aiResponse,
      processedAt: new Date().toISOString(),
      taskType,
      confidence: 0.85,
    };
  } catch (error) {
    console.error('[Agent Queue] Error parsing AI response:', error);
    return {
      rawResponse: aiResponse,
      error: 'Failed to parse as JSON',
      processedAt: new Date().toISOString(),
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify authentication
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development';
  
  if (!isVercelCron && !isLocalTest && !req.headers['x-api-key']) {
    return res.status(401).json({ 
      error: 'Unauthorized' 
    });
  }

  try {
    // Get pending tasks from KV (via Spark KV endpoint)
    const kvEndpoint = process.env.GITHUB_RUNTIME_PERMANENT_NAME 
      ? `/_spark/kv/agent-task-queue`
      : 'https://assistente-jurdico-p.vercel.app/_spark/kv/agent-task-queue';

    const tasksResponse = await fetch(kvEndpoint, {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });

    if (!tasksResponse.ok) {
      throw new Error('Failed to fetch tasks from KV');
    }

    const { value: taskQueue = [] } = await tasksResponse.json();
    const pendingTasks = taskQueue.filter((t: AgentTask) => t.status === 'queued');

    console.log(`[Agent Queue] Found ${pendingTasks.length} pending tasks`);

    if (pendingTasks.length === 0) {
      return res.status(200).json({
        ok: true,
        message: 'No pending tasks',
        processed: 0,
      });
    }

    // Process up to 5 tasks per execution
    const tasksToProcess = pendingTasks.slice(0, 5);
    const results = [];

    for (const task of tasksToProcess) {
      try {
        // Get agent info
        const agentsResponse = await fetch(
          process.env.GITHUB_RUNTIME_PERMANENT_NAME 
            ? `/_spark/kv/autonomous-agents`
            : 'https://assistente-jurdico-p.vercel.app/_spark/kv/autonomous-agents',
          {
            headers: {
              'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
            },
          }
        );

        const { value: agents = [] } = await agentsResponse.json();
        const agent = agents.find((a: Agent) => a.id === task.agentId);

        if (!agent || !agent.enabled) {
          console.log(`[Agent Queue] Skipping task ${task.id} - agent not found or disabled`);
          continue;
        }

        // Process with real AI
        console.log(`[Agent Queue] Processing task ${task.id} for agent ${agent.name}`);
        const result = await processTaskWithRealAI(task, agent);

        // Update task as completed
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        task.result = result;

        results.push({
          taskId: task.id,
          agentId: agent.id,
          status: 'completed',
        });

      } catch (error) {
        console.error(`[Agent Queue] Error processing task ${task.id}:`, error);
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';
        
        results.push({
          taskId: task.id,
          status: 'failed',
          error: task.error,
        });
      }
    }

    // Update task queue in KV
    await fetch(kvEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ value: taskQueue }),
    });

    return res.status(200).json({
      ok: true,
      message: 'Tasks processed',
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Agent Queue] Fatal error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
