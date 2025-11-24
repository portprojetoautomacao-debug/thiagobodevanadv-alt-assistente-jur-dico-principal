/**
 * API consolidada para processamento de agentes IA
 * Endpoints:
 * - POST /api/agents?action=process-queue - Processa fila de tarefas (cron)
 * - POST /api/agents?action=process-task - Processa tarefa individual
 * 
 * Usa Spark LLM real para processamento com IA
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types duplicated from src/lib/agents.ts for serverless compatibility
interface AgentTask {
  id: string
  agentId: string
  type: 'analyze_document' | 'monitor_djen' | 'calculate_deadline' | 'draft_petition' | 'check_datajud' | 'organize_files' | 'research_precedents' | 'risk_analysis' | 'contract_review' | 'client_communication' | 'billing_analysis' | 'case_strategy' | 'legal_translation' | 'compliance_check'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'human_intervention'
  createdAt: string
  startedAt?: string
  completedAt?: string
  data: Record<string, unknown>
  result?: Record<string, unknown>
  error?: string
}

interface Agent {
  id: string
  name: string
  type: 'analyzer' | 'monitor' | 'calculator' | 'writer' | 'organizer' | 'researcher' | 'strategic' | 'compliance' | 'translator' | 'communicator'
  status: 'active' | 'idle' | 'processing' | 'paused' | 'waiting_human'
  enabled: boolean
}

function getSystemPrompt(agentType: string): string {
  const prompts: Record<string, string> = {
    analyzer: `Você é um assistente jurídico especializado em análise de documentos processuais.
Sua função é extrair informações críticas de documentos jurídicos, identificar prazos, partes envolvidas, e sugerir ações.
Sempre retorne respostas em formato JSON estruturado.`,

    monitor: `Você é um agente de monitoramento de publicações jurídicas especializado em DJEN e DataJud.
Analise intimações, extraia dados do processo, identifique prazos e classifique a urgência.
Retorne sempre em JSON com campos: processo, tipo, prazo, urgência.`,

    calculator: `Você é um especialista em cálculo de prazos processuais segundo o CPC/2015.
Considere: dias úteis, feriados nacionais e estaduais, suspensões de prazos, recesso forense.
Retorne JSON com: deadline (ISO date), businessDays, reasoning (array).`,

    writer: `Você é um redator jurídico sênior especializado em peças processuais.
Redija petições, manifestações e documentos jurídicos com linguagem técnica, formal e persuasiva.
Siga normas ABNT, formatação padrão, e fundamente juridicamente.`,

    researcher: `Você é um pesquisador jurídico especializado em jurisprudência e doutrina.
Busque precedentes, analise tendências jurisprudenciais, identifique teses vencedoras.
Retorne JSON com: precedentsFound, relevantCases, thematicAnalysis.`,

    strategic: `Você é um estrategista jurídico com visão de negócios.
Analise casos sob perspectiva estratégica, identifique riscos, oportunidades e probabilidades de sucesso.
Retorne JSON com: riskLevel, successProbability, recommendations.`,

    organizer: `Você é um especialista em organização e gestão de documentos jurídicos.
Classifique documentos por tipo, processo, data e relevância.
Retorne JSON com: categories, filesOrganized, indexingStrategy.`,

    compliance: `Você é um especialista em compliance jurídico e regulatório.
Verifique conformidade com LGPD, Código de Ética OAB, legislação trabalhista e civil.
Retorne JSON com: complianceStatus, violations, recommendations.`,

    translator: `Você é um especialista em tradução de jargão jurídico para linguagem acessível.
Simplifique termos técnicos mantendo precisão jurídica.
Retorne JSON com: simplifiedText, glossary, readabilityScore.`,

    communicator: `Você é um especialista em comunicação com clientes jurídicos.
Redija comunicações claras, empáticas e profissionais.
Retorne JSON com: messageText, tone, channels, urgency.`,
  };

  return prompts[agentType] || 'Você é um assistente jurídico inteligente.';
}

function getUserPrompt(task: AgentTask): string {
  const data = task.data;
  const taskData = JSON.stringify(data, null, 2);

  const basePrompts: Record<AgentTask['type'], string> = {
    analyze_document: `Analise o seguinte documento jurídico e retorne JSON estruturado:\n\n${taskData}\n\nRetorne: summary, extractedData, suggestedActions, deadlines, confidence.`,
    
    monitor_djen: `Verifique publicações no DJEN/DataJud para:\n\n${taskData}\n\nRetorne JSON: newIntimations (array), checked, tribunaisVerificados, nextCheck.`,
    
    calculate_deadline: `Calcule prazo processual:\n\n${taskData}\n\nRetorne JSON: deadline (ISO), businessDays, reasoning (array), holidays, alerts.`,
    
    draft_petition: `Redija peça processual:\n\n${taskData}\n\nRetorne JSON: draft (texto completo), confidence, needsReview, suggestions, metadata.`,
    
    check_datajud: `Consulte DataJud:\n\n${taskData}\n\nRetorne JSON: processosEncontrados, ultimaAtualizacao, movimentacoes, status, partes.`,
    
    organize_files: `Organize arquivos:\n\n${taskData}\n\nRetorne JSON: filesOrganized, categoriesCreated, duplicatesFound, spaceSaved.`,
    
    research_precedents: `Pesquise precedentes:\n\n${taskData}\n\nRetorne JSON: precedentsFound, relevantCases, thematicAnalysis, recommendation.`,
    
    risk_analysis: `Análise de risco:\n\n${taskData}\n\nRetorne JSON: riskLevel, riskScore, factors, recommendations, probabilitySuccess.`,
    
    contract_review: `Revise contrato:\n\n${taskData}\n\nRetorne JSON: contractAnalysis, findings, compliance, riskAssessment.`,
    
    client_communication: `Comunique ao cliente:\n\n${taskData}\n\nRetorne JSON: messageGenerated, template, tone, urgency, channels.`,
    
    billing_analysis: `Analise faturamento:\n\n${taskData}\n\nRetorne JSON: periodAnalyzed, totalBilled, pendingInvoices, insights.`,
    
    case_strategy: `Estratégia para caso:\n\n${taskData}\n\nRetorne JSON: strategyAnalysis, recommendedActions, successProbability.`,
    
    legal_translation: `Simplifique texto jurídico:\n\n${taskData}\n\nRetorne JSON: translationCompleted, simplifiedText, keyTermsGlossary.`,
    
    compliance_check: `Verifique compliance:\n\n${taskData}\n\nRetorne JSON: complianceStatus, checksPerformed, violations, recommendations.`,
  };

  return basePrompts[task.type] || `Processe:\n\n${taskData}`;
}

async function processTaskWithAI(task: AgentTask, agent: Agent): Promise<Record<string, unknown>> {
  const systemPrompt = getSystemPrompt(agent.type);
  const userPrompt = getUserPrompt(task);

  // Timeout protection: default 30s, configurable per task
  const timeoutMs = task.timeout || 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const sparkResponse = await fetch('/_spark/llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!sparkResponse.ok) {
      throw new Error(`Spark LLM error: ${sparkResponse.statusText}`);
    }

    const sparkData = await sparkResponse.json() as { 
      choices?: Array<{ message?: { content?: string } }>, 
      usage?: { total_tokens?: number } 
    };
    
    const aiContent = sparkData.choices?.[0]?.message?.content || '';

    // Parse JSON from AI response
    let result: Record<string, unknown>;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawResponse: aiContent };
    } catch {
      result = { rawResponse: aiContent };
    }

    result.processedAt = new Date().toISOString();
    result.agentId = agent.id;
    result.taskType = task.type;
    result.tokensUsed = sparkData.usage?.total_tokens;

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Task timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  // Verificar autenticação (cron ou API key)
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development';
  
  if (!isVercelCron && !isLocalTest && !req.headers['x-api-key']) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // PROCESS QUEUE (cron job)
    if (action === 'process-queue' && req.method === 'POST') {
      const kvEndpoint = '/_spark/kv/agent-task-queue';
      
      const tasksResponse = await fetch(kvEndpoint, {
        headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` },
      });

      if (!tasksResponse.ok) {
        throw new Error('Failed to fetch tasks from KV');
      }

      const kvData = await tasksResponse.json() as { value?: AgentTask[] };
      const taskQueue = kvData.value || [];
      const pendingTasks = taskQueue.filter((t: AgentTask) => t.status === 'queued');

      console.log(`[Agents] Found ${pendingTasks.length} pending tasks`);

      if (pendingTasks.length === 0) {
        return res.status(200).json({
          ok: true,
          message: 'No pending tasks',
          processed: 0,
        });
      }

      // Processar até 5 tarefas por execução
      const tasksToProcess = pendingTasks.slice(0, 5);
      const results: Array<{ taskId: string; status: 'completed' | 'failed'; error?: string }> = [];

      for (const task of tasksToProcess) {
        try {
          const agentsResponse = await fetch('/_spark/kv/autonomous-agents', {
            headers: { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` },
          });

          const agentsData = await agentsResponse.json() as { value?: Agent[] };
          const agents = agentsData.value || [];
          const agent = agents.find((a: Agent) => a.id === task.agentId);

          if (!agent || !agent.enabled) {
            console.log(`[Agents] Skipping task ${task.id} - agent not found/disabled`);
            continue;
          }

          console.log(`[Agents] Processing task ${task.id} for ${agent.name}`);
          const result = await processTaskWithAI(task, agent);

          task.status = 'completed';
          task.completedAt = new Date().toISOString();
          task.result = result;

          // Chain tasks based on analysis
          if (task.type === 'analyze_document' && result.suggestedActions && Array.isArray(result.suggestedActions)) {
            for (const action of result.suggestedActions) {
              const actionStr = String(action).toLowerCase();
              let nextTask: AgentTask | null = null;

              if (actionStr.includes('prazo') || actionStr.includes('deadline')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'deadline-tracker',
                  type: 'calculate_deadline',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('petição') || actionStr.includes('defesa') || actionStr.includes('recurso') || actionStr.includes('manifestação')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'petition-writer',
                  type: 'draft_petition',
                  priority: 'medium',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('pesquisa') || actionStr.includes('jurisprudência')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'precedent-researcher',
                  type: 'research_precedents',
                  priority: 'low',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('avisar') || actionStr.includes('comunicar') || actionStr.includes('informar') || actionStr.includes('cliente')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'client-communicator',
                  type: 'client_communication',
                  priority: 'medium',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('datajud') || actionStr.includes('andamento') || actionStr.includes('autos') || actionStr.includes('movimentação')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'datajud-query',
                  type: 'check_datajud',
                  priority: 'medium',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('sentença') || actionStr.includes('decisão') || actionStr.includes('acórdão') || actionStr.includes('risco')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'risk-analyst',
                  type: 'risk_analysis',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('custas') || actionStr.includes('honorários') || actionStr.includes('depósito') || actionStr.includes('guia') || actionStr.includes('pagamento')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'billing-analyst',
                  type: 'billing_analysis',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('arquivar') || actionStr.includes('salvar') || actionStr.includes('pasta') || actionStr.includes('organizar')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'document-organizer',
                  type: 'organize_files',
                  priority: 'low',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('lgpd') || actionStr.includes('sigilo') || actionStr.includes('segredo') || actionStr.includes('ética') || actionStr.includes('compliance')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'compliance-officer',
                  type: 'compliance_check',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('explicar') || actionStr.includes('simplificar') || actionStr.includes('traduzir') || actionStr.includes('leigo')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'legal-translator',
                  type: 'legal_translation',
                  priority: 'medium',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('contrato') || actionStr.includes('minuta') || actionStr.includes('aditivo') || actionStr.includes('cláusula') || actionStr.includes('rescisão')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'contract-reviewer',
                  type: 'contract_review',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              } else if (actionStr.includes('estratégia') || actionStr.includes('plano') || actionStr.includes('probabilidade') || actionStr.includes('tese') || actionStr.includes('linha de defesa')) {
                nextTask = {
                  id: crypto.randomUUID(),
                  agentId: 'case-strategist',
                  type: 'case_strategy',
                  priority: 'high',
                  status: 'queued',
                  createdAt: new Date().toISOString(),
                  data: {
                    ...task.data,
                    instruction: action,
                    sourceTask: task.id
                  }
                };
              }

              if (nextTask) {
                console.log(`[Agents] Chaining task: ${nextTask.type} for ${nextTask.agentId}`);
                // We use the imported function, but we need to be careful about mixing fetch/direct KV usage.
                // Since we are in the loop, we can just push to taskQueue if we are updating it at the end.
                // BUT the code below updates taskQueue via fetch PUT.
                // So we should push to taskQueue array directly.
                taskQueue.push(nextTask as AgentTask);
              }
            }
          }

          results.push({ taskId: task.id, status: 'completed' });

        } catch (error) {
          console.error(`[Agents] Error processing task ${task.id}:`, error);
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Unknown error';
          
          results.push({
            taskId: task.id,
            status: 'failed',
            error: task.error,
          });
        }
      }

      // Atualizar fila no KV
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
    }

    // PROCESS TASK (individual)
    if (action === 'process-task' && req.method === 'POST') {
      const { task, agent } = req.body as { 
        task: AgentTask; 
        agent: Agent 
      };

      if (!task || !agent) {
        return res.status(400).json({ 
          error: 'Missing required fields: task and agent' 
        });
      }

      const result = await processTaskWithAI(task, agent);

      return res.status(200).json({
        ok: true,
        result,
        metadata: {
          tokensUsed: result.tokensUsed,
          processedAt: result.processedAt,
        },
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action. Use: process-queue or process-task' 
    });

  } catch (error) {
    console.error('[Agents API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
