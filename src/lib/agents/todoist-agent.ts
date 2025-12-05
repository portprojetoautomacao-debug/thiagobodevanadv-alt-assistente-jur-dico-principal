/**
 * Agente de IA para Todoist
 *
 * Responsável por:
 * 1. Interpretar comandos em linguagem natural vindos do Todoist
 * 2. Sincronizar tarefas entre Sistema Jurídico <-> Todoist <-> Google Calendar
 * 3. Executar ações automáticas baseadas em eventos
 */

import { callGemini } from "../gemini-service";
import { googleCalendarService } from "../google-calendar-service";
import { llmService } from "../llm-service";
import type { TodoistClient } from "../todoist-client";
import { todoistClient } from "../todoist-client";
import { addLegalTasks, updateLegalTask } from "../todoist-integration";

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
  action: "reschedule" | "delegate" | "complete" | "create_event" | "update_status" | "unknown";
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
  private readonly client: TodoistClient;

  constructor() {
    this.client = todoistClient;
  }

  /**
   * Processa um evento vindo do Webhook do Todoist
   */
  async processWebhookEvent(event: TodoistWebhookEvent) {
    console.log("🤖 Agente Todoist processando evento:", event.event_name);

    switch (event.event_name) {
      case "item:updated":
        await this.handleItemUpdated(event.event_data);
        break;
      case "item:completed":
        await this.handleItemCompleted(event.event_data);
        break;
      case "note:added":
        await this.handleCommentAdded(event.event_data);
        break;
      default:
        console.log("Evento ignorado pelo agente:", event.event_name);
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
        console.log("🔄 Sincronizando com Google Calendar...");
      } catch (error) {
        console.error("Erro ao sincronizar com Calendar:", error);
      }
    }
  }

  /**
   * Lida com conclusão de tarefas
   */
  private async handleItemCompleted(item: TodoistEventData) {
    console.log(`✅ Tarefa ${item.content} concluída!`);

    // Verificar se é uma tarefa de processo
    const processMatch = /Processo\s+(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/.exec(item.content);
    if (processMatch) {
      const processNumber = processMatch[1];
      console.log(`🔄 Atualizando progresso do processo ${processNumber}...`);

      // TODO: Atualizar status no CRM/Kanban
      // await crmAgent.updateProcessStatus(processNumber, 'completed_task', item.content);

      // Sugerir próxima tarefa via IA
      // TODO: Implementar sugestão inteligente com Gemini
      await this.suggestNextSteps(processNumber);
    }
  }

  /**
   * Lida com comentários (onde a mágica dos comandos acontece)
   */
  private async handleCommentAdded(comment: TodoistEventData) {
    const text = comment.content;

    // Verificar se é um comando para o agente (ex: "@Harvey ...")
    if (text.toLowerCase().includes("@harvey") || text.toLowerCase().includes("urgente:")) {
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
      Data Atual: "${new Date().toISOString().split("T")[0]}"
      
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
        model: "gpt-4o",
        temperature: 0.1,
        feature: "todoist-agent",
      });

      // Buscar JSON de forma segura sem regex greedy
      const startIdx = response.indexOf("{");
      const endIdx = response.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = response.substring(startIdx, endIdx + 1);
        return JSON.parse(jsonStr) as InterpretedCommand;
      }
    } catch (error) {
      console.error("Erro ao interpretar comando com IA:", error);
    }

    // Fallback simples se a IA falhar
    const lowerText = text.toLowerCase();
    if (lowerText.includes("urgente")) {
      return {
        action: "update_status",
        parameters: { taskId, priority: 4 },
        confidence: 0.8,
        originalText: text,
      };
    }

    return {
      action: "unknown",
      parameters: {},
      confidence: 0,
      originalText: text,
    };
  }

  /**
   * Executa o comando interpretado
   */
  private async executeCommand(command: InterpretedCommand) {
    console.log("🚀 Executando ação:", command.action);

    switch (command.action) {
      case "reschedule":
        if (command.parameters.taskId && command.parameters.date) {
          await updateLegalTask(command.parameters.taskId, {
            dueDate: command.parameters.date,
          });
          // Responder no Todoist
          // await this.client.addComment({ taskId: command.parameters.taskId, content: "✅ Remarcado para " + command.parameters.date });
        }
        break;

      case "update_status":
        if (command.parameters.taskId && command.parameters.priority) {
          // Validar prioridade (1-4)
          const priority = Math.min(Math.max(command.parameters.priority, 1), 4) as 1 | 2 | 3 | 4;
          await updateLegalTask(command.parameters.taskId, {
            priority: priority,
          });
        }
        break;

      case "create_event":
        if (command.parameters.date && command.parameters.description) {
          // Criar evento no Google Calendar
          const startTime = command.parameters.startTime || "09:00";

          try {
            await googleCalendarService.createEvent({
              id: crypto.randomUUID(),
              title: command.parameters.description,
              description: `Criado via Todoist Agent. Comando original: ${command.originalText}`,
              date: command.parameters.date,
              time: startTime,
              duration: 60, // Default 1h
              type: "outro",
            });
            console.log("📅 Evento criado no Google Calendar");
          } catch (e) {
            console.error("Erro ao criar evento no Calendar:", e);
          }
        }
        break;
    }
  }

  /**
   * Sugere próximos passos baseado no histórico usando Gemini AI
   * Analisa o contexto do processo e gera sugestões inteligentes de tarefas
   */
  private async suggestNextSteps(processNumber: string) {
    try {
      console.log(`💡 Gerando sugestões inteligentes para processo ${processNumber}...`);

      // Buscar histórico de tarefas do processo (simulado - em produção viria do banco)
      const taskHistory = await this.getProcessTaskHistory(processNumber);

      // Criar prompt contextualizado para Gemini
      const prompt = `
Você é um assistente jurídico especializado em processos judiciais brasileiros.

**Contexto:**
Processo: ${processNumber}
Tarefas já concluídas: ${taskHistory.join(", ")}

**Tarefa:**
Com base no histórico de tarefas concluídas, sugira as próximas 3 ações mais importantes que o advogado deve tomar neste processo. Considere:
- Prazos processuais típicos
- Sequência lógica de atos processuais
- Documentos que devem ser preparados
- Possíveis audiências ou eventos futuros

**Formato da resposta (JSON ESTRITO):**
{
  "tasks": [
    {
      "content": "Descrição da tarefa 1 - Processo ${processNumber}",
      "description": "Detalhes e justificativa da tarefa",
      "dueDate": "YYYY-MM-DD ou 'today', 'tomorrow', '3 days', 'next week', etc",
      "priority": 1-4 (4=urgente, 3=alta, 2=normal, 1=baixa)
    },
    {
      "content": "Descrição da tarefa 2 - Processo ${processNumber}",
      "description": "Detalhes e justificativa da tarefa",
      "dueDate": "YYYY-MM-DD ou data relativa",
      "priority": 1-4
    },
    {
      "content": "Descrição da tarefa 3 - Processo ${processNumber}",
      "description": "Detalhes e justificativa da tarefa",
      "dueDate": "YYYY-MM-DD ou data relativa",
      "priority": 1-4
    }
  ],
  "reasoning": "Breve explicação da estratégia processual sugerida"
}

**IMPORTANTE:** Responda APENAS com o JSON, sem texto adicional antes ou depois.
`;

      // Chamar Gemini para gerar sugestões
      const response = await callGemini(prompt, {
        temperature: 0.7,
        maxOutputTokens: 2048,
      });

      if (response.error) {
        console.error("❌ Erro ao chamar Gemini:", response.error);
        // Fallback para sugestão padrão
        return this.createDefaultSuggestion(processNumber);
      }

      // Parse da resposta JSON
      let suggestions;
      try {
        // Limpar possíveis markdown code blocks
        const cleanJson = response.text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        suggestions = JSON.parse(cleanJson);
      } catch (parseError) {
        console.error("❌ Erro ao fazer parse da resposta Gemini:", parseError);
        console.error("Resposta recebida:", response.text);
        return this.createDefaultSuggestion(processNumber);
      }

      // Validar estrutura da resposta
      if (!suggestions.tasks || !Array.isArray(suggestions.tasks)) {
        console.error("❌ Resposta do Gemini em formato inválido");
        return this.createDefaultSuggestion(processNumber);
      }

      console.log(`✨ Estratégia sugerida: ${suggestions.reasoning}`);

      // Criar tarefas no Todoist
      const tasksToCreate = suggestions.tasks.map(
        (task: { content: string; description?: string; dueDate?: string; priority?: number }) => ({
          content: task.content,
          description: task.description || "",
          dueDate: task.dueDate || "tomorrow",
          priority: (task.priority || 2) as 1 | 2 | 3 | 4,
          labels: ["auto-generated", "ai-suggestion", "processo"],
        })
      );

      // Adicionar tarefas via Todoist API
      const createdTasks = await addLegalTasks(tasksToCreate);

      console.log(`✅ ${createdTasks.length} tarefas criadas automaticamente pelo Gemini`);

      return {
        success: true,
        tasksCreated: createdTasks.length,
        reasoning: suggestions.reasoning,
      };
    } catch (error) {
      console.error("❌ Erro ao gerar sugestões:", error);
      // Fallback para sugestão padrão em caso de erro
      return this.createDefaultSuggestion(processNumber);
    }
  }

  /**
   * Busca histórico de tarefas do processo
   * TODO: Implementar busca real no Todoist por processo
   */
  private async getProcessTaskHistory(processNumber: string): Promise<string[]> {
    // Placeholder - em produção, buscar tarefas concluídas via API
    // const client = getTodoistClient();
    // const tasks = await client.getTasks({ filter: `${processNumber} & completed` });

    // Por enquanto, retorna histórico simulado baseado em padrões comuns
    return ["Protocolar contestação", "Juntar documentos", "Notificar cliente sobre andamento"];
  }

  /**
   * Cria sugestão padrão (fallback quando Gemini falha)
   */
  private async createDefaultSuggestion(processNumber: string) {
    console.log("⚠️ Usando sugestão padrão (fallback)");

    const defaultTasks = [
      {
        content: `Verificar publicação - Processo ${processNumber}`,
        description: "Conferir diário oficial para novas publicações",
        dueDate: "tomorrow",
        priority: 3 as 1 | 2 | 3 | 4,
        labels: ["auto-generated", "default-suggestion", "processo"],
      },
    ];

    try {
      const createdTasks = await addLegalTasks(defaultTasks);
      return {
        success: true,
        tasksCreated: createdTasks.length,
        reasoning: "Sugestão padrão criada devido a erro no Gemini",
      };
    } catch (error) {
      console.error("❌ Erro ao criar tarefa padrão:", error);
      return {
        success: false,
        tasksCreated: 0,
        reasoning: "Falha ao criar tarefas",
      };
    }
  }
}

export const todoistAgent = new TodoistAgent();
