/**
 * Client para interagir com agentes reais (backend)
 * Substitui as simulações por chamadas reais à API
 */

import type { AgentTask, Agent, AgentTaskResult } from './agents';

/**
 * Processa uma tarefa usando o backend real (Spark LLM)
 */
export async function processTaskWithRealAI(
  task: AgentTask,
  agent: Agent
): Promise<AgentTaskResult> {
  try {
    // Chama o endpoint serverless que processa com IA real
    const response = await fetch('/api/agents/process-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task,
        agent: {
          id: agent.id,
          type: agent.type,
          name: agent.name,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result;

  } catch (error) {
    console.error('[Real Agent Client] Error processing task:', error);
    throw error;
  }
}

/**
 * Busca tarefas pendentes do backend
 */
export async function fetchPendingTasks(agentId?: string): Promise<AgentTask[]> {
  try {
    const url = agentId 
      ? `/api/agents/tasks?agentId=${agentId}&status=queued`
      : '/api/agents/tasks?status=queued';

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data = await response.json();
    return data.tasks || [];

  } catch (error) {
    console.error('[Real Agent Client] Error fetching tasks:', error);
    return [];
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task }),
    });

    if (!response.ok) {
      throw new Error(`Failed to queue task: ${response.statusText}`);
    }

  } catch (error) {
    console.error('[Real Agent Client] Error queueing task:', error);
    throw error;
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tribunais }),
    });

    if (!response.ok) {
      throw new Error(`DJEN API error: ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[Real Agent Client] Error monitoring DJEN:', error);
    throw error;
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
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDate.toISOString(),
        businessDays,
        tribunalCode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Deadline API error: ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error('[Real Agent Client] Error calculating deadline:', error);
    throw error;
  }
}

/**
 * Verifica se o modo de agentes reais está habilitado
 */
export function isRealAgentsEnabled(): boolean {
  // Verifica se há configuração no localStorage ou variável de ambiente
  if (typeof window !== 'undefined') {
    const enabled = localStorage.getItem('real-agents-enabled');
    return enabled === 'true';
  }
  return false;
}

/**
 * Habilita/desabilita modo de agentes reais
 */
export function setRealAgentsMode(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('real-agents-enabled', enabled.toString());
    
    // Recarrega a página para aplicar mudanças
    if (window.confirm(
      enabled 
        ? 'Modo de agentes reais será ativado. Os agentes usarão IA real (Spark LLM) e APIs externas. Continuar?'
        : 'Modo de agentes simulados será ativado. Os agentes voltarão a usar dados fictícios. Continuar?'
    )) {
      window.location.reload();
    }
  }
}
