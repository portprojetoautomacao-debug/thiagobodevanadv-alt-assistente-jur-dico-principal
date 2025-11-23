/**
 * Agente de IA para Todoist
 * 
 * Responsável por:
 * 1. Interpretar comandos em linguagem natural vindos do Todoist
 * 2. Sincronizar tarefas entre Sistema Jurídico <-> Todoist <-> Google Calendar
 * 3. Executar ações automáticas baseadas em eventos
 */

import { randomUUID } from 'crypto';
import type { TodoistClient } from '@/lib/todoist-stub';
import { getTodoistClient, updateLegalTask } from '../todoist-integration';
import { llmService } from '../llm-service';
import { googleCalendarService } from '../google-calendar-service';

// Tipos para eventos do Todoist
interface TodoistWebhookEvent {
  event_name: string;
  event_data: TodoistEventData;
}

interface TodoistEventData {
  id: string;
  content: string;
  description?: string;
  due?: {
    date: string;
    datetime?: string;
  };
  priority?: number;
  item_id?: string; // Para comentários
}

// Interface para comandos interpretados pela IA
interface InterpretedCommand {
  action: 'reschedule' | 'delegate' | 'complete' | 'create_event' | 'update_status' | 'unknown';
  parameters: {
    date?: string;
    assignee?: string;
    taskId?: string;
    processNumber?: string;
    description?: string;
    priority?: number;
    startTime?: string;
    endTime?: string;
  };
  confidence: number;
  originalText: string;
}

/**
 * Agente Todoist
 */
export class TodoistAgent {
  private client: TodoistClient;

  constructor() {
    this.client = getTodoistClient();
  }

  /**
   * Processa um evento vindo do Webhook do Todoist
   */
  async processWebhookEvent(event: TodoistWebhookEvent) {
    console.log('🤖 Agente Todoist processando evento:', event.event_name);

    switch (event.event_name) {
      case 'item:updated':
        await this.handleItemUpdated(event.event_data);
        break;
      case 'item:completed':
        await this.handleItemCompleted(event.event_data);
        break;
      case 'note:added':
        await this.handleCommentAdded(event.event_data);
        break;
      default:
        console.log('Evento ignorado pelo agente:', event.event_name);
    }
  }

  /**
   * Lida com atualizações de tarefas (ex: mudança de data)
   */
  private async handleItemUpdated(item: TodoistEventData) {
    // Se a data mudou, sincronizar com Google Calendar
    if (item.due) {
      console.log(`📅 Data da tarefa ${item.id} atualizada para ${item.due.date}`);
      
      // Tenta encontrar evento correspondente no Calendar (pelo ID da tarefa na descrição ou título)
      // Como não temos link direto, vamos buscar eventos do dia
      try {
        // TODO: Implementar busca inteligente no Calendar
        // Por enquanto, apenas logamos a intenção
        console.log('🔄 Sincronizando com Google Calendar...');
      } catch (error) {
        console.error('Erro ao sincronizar com Calendar:', error);
      }
    }
  }

  /**
   * Lida com conclusão de tarefas
   */
  private async handleItemCompleted(item: TodoistEventData) {
    console.log(`✅ Tarefa ${item.content} concluída!`);
    
    // Verificar se é uma tarefa de processo
    const processMatch = item.content.match(/Processo\s+(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/);
    if (processMatch) {
      const processNumber = processMatch[1];
      console.log(`🔄 Atualizando progresso do processo ${processNumber}...`);
      
      // TODO: Atualizar status no CRM/Kanban
      // await crmAgent.updateProcessStatus(processNumber, 'completed_task', item.content);
      
      // Sugerir próxima tarefa (simulação de IA)
      await this.suggestNextSteps(processNumber);
    }
  }

  /**
   * Lida com comentários (onde a mágica dos comandos acontece)
   */
  private async handleCommentAdded(comment: TodoistEventData) {
    const text = comment.content;
    
    // Verificar se é um comando para o agente (ex: "@Harvey ...")
    if (text.toLowerCase().includes('@harvey') || text.toLowerCase().includes('urgente:')) {
      console.log(`🧠 Interpretando comando: "${text}"`);
      
      const command = await this.interpretCommandWithAI(text, comment.item_id || comment.id);
      await this.executeCommand(command);
    }
  }

  /**
   * Interpreta comandos via LLM (GPT-4)
   */
  private async interpretCommandWithAI(text: string, taskId: string): Promise<InterpretedCommand> {
    const prompt = `
      Você é um assistente jurídico inteligente (Harvey) integrado ao Todoist.
      Analise o seguinte comando do usuário e extraia a intenção e parâmetros.
      
      Comando: "${text}"
      ID da Tarefa: "${taskId}"
      Data Atual: "${new Date().toISOString().split('T')[0]}"
      
      Responda APENAS com um JSON no seguinte formato:
      {
        "action": "reschedule" | "delegate" | "complete" | "create_event" | "update_status" | "unknown",
        "parameters": {
          "date": "YYYY-MM-DD" (se aplicável),
          "assignee": "nome" (se aplicável),
          "taskId": "${taskId}",
          "priority": 1-4 (se aplicável, 4 é urgente),
          "startTime": "HH:MM" (se aplicável),
          "endTime": "HH:MM" (se aplicável),
          "description": "descrição do evento" (se aplicável)
        },
        "confidence": 0.0-1.0
      }
    `;

    try {
      const response = await llmService.execute(prompt, {
        model: 'gpt-4o',
        temperature: 0.1,
        feature: 'todoist-agent'
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as InterpretedCommand;
      }
    } catch (error) {
      console.error('Erro ao interpretar comando com IA:', error);
    }

    // Fallback simples se a IA falhar
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgente')) {
      return {
        action: 'update_status',
        parameters: { taskId, priority: 4 },
        confidence: 0.8,
        originalText: text
      };
    }

    return {
      action: 'unknown',
      parameters: {},
      confidence: 0,
      originalText: text
    };
  }

  /**
   * Executa o comando interpretado
   */
  private async executeCommand(command: InterpretedCommand) {
    console.log('🚀 Executando ação:', command.action);

    switch (command.action) {
      case 'reschedule':
        if (command.parameters.taskId && command.parameters.date) {
          await updateLegalTask(command.parameters.taskId, {
            dueDate: command.parameters.date
          });
          // Responder no Todoist
          // await this.client.addComment({ taskId: command.parameters.taskId, content: "✅ Remarcado para " + command.parameters.date });
        }
        break;
        
      case 'update_status':
        if (command.parameters.taskId && command.parameters.priority) {
          // Validar prioridade (1-4)
          const priority = Math.min(Math.max(command.parameters.priority, 1), 4) as 1 | 2 | 3 | 4;
          await updateLegalTask(command.parameters.taskId, {
            priority: priority
          });
        }
        break;

      case 'create_event':
        if (command.parameters.date && command.parameters.description) {
          // Criar evento no Google Calendar
          const startTime = command.parameters.startTime || '09:00';
          
          try {
            await googleCalendarService.createEvent({
              id: randomUUID(),
              title: command.parameters.description,
              description: `Criado via Todoist Agent. Comando original: ${command.originalText}`,
              date: command.parameters.date,
              time: startTime,
              duration: 60, // Default 1h
              type: 'outro'
            });
            console.log('📅 Evento criado no Google Calendar');
          } catch (e) {
            console.error('Erro ao criar evento no Calendar:', e);
          }
        }
        break;
    }
  }

  /**
   * Sugere próximos passos baseado no histórico (IA Preditiva)
   */
  private async suggestNextSteps(processNumber: string) {
    // Lógica simulada de IA preditiva
    const suggestions = [
      { content: `Verificar publicação - Processo ${processNumber}`, due: 'tomorrow' }
    ];

    // Criar tarefas sugeridas
    // await addLegalTasks(...)
    console.log('💡 Sugestões geradas:', suggestions);
  }
}

export const todoistAgent = new TodoistAgent();

