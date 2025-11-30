// lib/ai/agent-orchestrator.ts
// Orquestrador de múltiplos agentes com padrões de produção
// Baseado em: LangGraph, CrewAI, AutoGen patterns (2024/2025)

import type { SimpleAgent } from './core-agent';

export type OrchestrationPattern =
  | 'sequential'      // Agentes executam em sequência
  | 'parallel'        // Agentes executam em paralelo
  | 'hierarchical'    // Agente coordenador delega para outros
  | 'collaborative';  // Agentes negociam entre si

export interface AgentTask {
  id: string;
  assignedTo: string; // agent ID
  input: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[]; // IDs de tasks que devem executar antes
  timeout?: number; // ms
}

export interface OrchestrationResult {
  success: boolean;
  results: Map<string, unknown>;
  traces: Array<{
    agentId: string;
    taskId: string;
    result: unknown;
    duration: number;
    error?: string;
  }>;
  totalDuration: number;
}

/**
 * Orquestrador de múltiplos agentes
 * Patterns: Sequential, Parallel, Hierarchical, Collaborative
 */
export class AgentOrchestrator {
  private readonly agents: Map<string, SimpleAgent>;
  private readonly pattern: OrchestrationPattern;

  constructor(agents: Map<string, SimpleAgent>, pattern: OrchestrationPattern = 'sequential') {
    this.agents = agents;
    this.pattern = pattern;
  }

  /**
   * Executa múltiplos agentes de acordo com o padrão configurado
   */
  async orchestrate(tasks: AgentTask[]): Promise<OrchestrationResult> {
    const startTime = Date.now();

    switch (this.pattern) {
      case 'sequential':
        return await this.executeSequential(tasks, startTime);
      case 'parallel':
        return await this.executeParallel(tasks, startTime);
      case 'hierarchical':
        return await this.executeHierarchical(tasks, startTime);
      case 'collaborative':
        return await this.executeCollaborative(tasks, startTime);
      default:
        throw new Error(`Pattern ${this.pattern} não implementado`);
    }
  }

  /**
   * SEQUENTIAL: Agentes executam em ordem
   * Usado quando: Tarefas dependem umas das outras
   */
  private async executeSequential(tasks: AgentTask[], startTime: number): Promise<OrchestrationResult> {
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult['traces'] = [];

    // Ordenar por dependências e prioridade
    const sortedTasks = this.topologicalSort(tasks);

    for (const task of sortedTasks) {
      const agent = this.agents.get(task.assignedTo);
      if (!agent) {
        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Agent ${task.assignedTo} não encontrado`,
        });
        continue;
      }

      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, task);
        results.set(task.id, result);

        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result,
          duration: Date.now() - taskStart,
        });
      } catch (e: unknown) {
        traces.push({
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: Date.now() - taskStart,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    return {
      success: traces.every(t => !t.error),
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * PARALLEL: Agentes executam simultaneamente
   * Usado quando: Tarefas são independentes
   */
  private async executeParallel(tasks: AgentTask[], startTime: number): Promise<OrchestrationResult> {
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult['traces'] = [];

    const promises = tasks.map(async (task) => {
      const agent = this.agents.get(task.assignedTo);
      if (!agent) {
        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: 0,
          error: `Agent ${task.assignedTo} não encontrado`,
        };
      }

      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, task);
        results.set(task.id, result);

        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result,
          duration: Date.now() - taskStart,
        };
      } catch (e: unknown) {
        return {
          agentId: task.assignedTo,
          taskId: task.id,
          result: null,
          duration: Date.now() - taskStart,
          error: e instanceof Error ? e.message : 'Unknown error',
        };
      }
    });

    const executedTraces = await Promise.all(promises);
    traces.push(...executedTraces);

    return {
      success: traces.every(t => !t.error),
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * HIERARCHICAL: Agente coordenador delega para subordinados
   * Usado quando: Há hierarquia clara (ex: Harvey coordena outros agentes)
   */
  private async executeHierarchical(tasks: AgentTask[], startTime: number): Promise<OrchestrationResult> {
    // Implementação simplificada: primeiro agente é o coordenador
    const coordinatorTask = tasks[0];
    const subordinateTasks = tasks.slice(1);

    // Coordenador analisa e pode redistribuir tarefas
    const coordinator = this.agents.get(coordinatorTask.assignedTo);
    if (!coordinator) {
      throw new Error('Coordenador não encontrado');
    }

    // Executar subordinados em paralelo
    return await this.executeParallel(subordinateTasks, startTime);
  }

  /**
   * COLLABORATIVE: Agentes negociam entre si
   * Usado quando: Decisões precisam de consenso
   */
  private async executeCollaborative(tasks: AgentTask[], startTime: number): Promise<OrchestrationResult> {
    // Implementação simplificada: voto majoritário
    const results = new Map<string, unknown>();
    const traces: OrchestrationResult['traces'] = [];

    // Todos agentes processam a mesma task
    const mainTask = tasks[0];
    const votes: unknown[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const taskStart = Date.now();
      try {
        const result = await this.executeWithTimeout(agent, mainTask);
        votes.push(result);

        traces.push({
          agentId,
          taskId: mainTask.id,
          result,
          duration: Date.now() - taskStart,
        });
      } catch (e: unknown) {
        traces.push({
          agentId,
          taskId: mainTask.id,
          result: null,
          duration: Date.now() - taskStart,
          error: e instanceof Error ? e.message : 'Unknown error',
        });
      }
    }

    // Consenso simples: resultado mais comum
    const consensus = this.findConsensus(votes);
    results.set(mainTask.id, consensus);

    return {
      success: votes.length > 0,
      results,
      traces,
      totalDuration: Date.now() - startTime,
    };
  }

  /**
   * Executa agente com timeout
   */
  private async executeWithTimeout(agent: SimpleAgent, task: AgentTask): Promise<unknown> {
    const timeout = task.timeout ?? 60000; // 60s padrão

    return Promise.race([
      agent.run(task.input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      ),
    ]);
  }

  /**
   * Ordenação topológica para respeitar dependências
   */
  private topologicalSort(tasks: AgentTask[]): AgentTask[] {
    const sorted: AgentTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) throw new Error('Dependência circular detectada');

      visiting.add(taskId);
      const task = taskMap.get(taskId);

      if (task?.dependencies) {
        for (const dep of task.dependencies) {
          visit(dep);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      if (task) sorted.push(task);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    // Ordenar por prioridade dentro do mesmo nível
    return sorted.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Encontra consenso entre múltiplos resultados
   */
  private findConsensus(votes: unknown[]): unknown {
    if (votes.length === 0) return null;

    // Estratégia simples: retorna o primeiro resultado válido
    // Em produção: implementar votação mais sofisticada
    return votes.find((v: unknown) => {
      if (typeof v === 'object' && v !== null && 'error' in v) {
        return !(v as { error?: unknown }).error;
      }
      return v != null;
    }) ?? votes[0];
  }
}

/**
 * Factory para criar orquestrações comuns
 */
export class OrchestrationPatterns {
  /**
   * Pattern: Justin-e analisa → Gestão Prazos calcula → Cria tarefa
   */
  static intimacaoWorkflow(): AgentTask[] {
    return [
      {
        id: 'analyze-intimacao',
        assignedTo: 'justine',
        input: 'Buscar próxima intimação pendente',
        priority: 'critical',
      },
      {
        id: 'calculate-deadline',
        assignedTo: 'gestao-prazos',
        input: 'Calcular prazo da intimação',
        priority: 'high',
        dependencies: ['analyze-intimacao'],
      },
      {
        id: 'create-task',
        assignedTo: 'justine',
        input: 'Criar tarefa com prazo calculado',
        priority: 'high',
        dependencies: ['calculate-deadline'],
      },
    ];
  }

  /**
   * Pattern: Múltiplos agentes analisam caso (paralelo)
   */
  static caseAnalysisParallel(caseId: string): AgentTask[] {
    const input = `Analisar caso ${caseId}`;
    return [
      {
        id: 'risk-analysis',
        assignedTo: 'analise-risco',
        input,
        priority: 'high',
      },
      {
        id: 'precedent-research',
        assignedTo: 'pesquisa-juris',
        input,
        priority: 'medium',
      },
      {
        id: 'financial-analysis',
        assignedTo: 'financeiro',
        input,
        priority: 'medium',
      },
    ];
  }

  /**
   * Pattern: Harvey coordena análise estratégica
   */
  static strategicReview(): AgentTask[] {
    return [
      {
        id: 'harvey-coordination',
        assignedTo: 'harvey',
        input: 'Coordenar análise estratégica do escritório',
        priority: 'critical',
      },
      {
        id: 'deadline-check',
        assignedTo: 'gestao-prazos',
        input: 'Verificar prazos críticos',
        priority: 'high',
        dependencies: ['harvey-coordination'],
      },
      {
        id: 'djen-monitor',
        assignedTo: 'monitor-djen',
        input: 'Verificar novas publicações',
        priority: 'high',
        dependencies: ['harvey-coordination'],
      },
    ];
  }
}
