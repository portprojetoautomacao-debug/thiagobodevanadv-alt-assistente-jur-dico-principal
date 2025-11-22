/**
 * Integração do Todoist AI com o Assistente Jurídico PJe
 * 
 * Este arquivo fornece funções wrapper para usar o cliente Todoist
 * no contexto do assistente jurídico, permitindo gerenciar tarefas relacionadas
 * a processos judiciais, prazos e atividades jurídicas.
 */

import { TodoistApi, Task } from '@doist/todoist-api-typescript';
import { 
  findTasksByDate, 
  addTasks,
  findTasks,
  updateTasks,
  completeTasks
} from '@doist/todoist-ai';

// Prioridade no Todoist: 4 (Vermelho/Urgente) a 1 (Branco/Normal)
type Priority = 1 | 2 | 3 | 4;

interface LegalTaskInput {
  content: string;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  labels?: string[];
  projectId?: string;
}

/**
 * Cliente Todoist singleton
 */
let todoistClient: TodoistApi | null = null;

/**
 * Inicializa o cliente Todoist com a API key
 */
export function initializeTodoistClient(apiKey: string): TodoistApi {
  if (!todoistClient) {
    todoistClient = new TodoistApi(apiKey);
  }
  return todoistClient;
}

/**
 * Obtém o cliente Todoist (deve ser inicializado primeiro)
 */
export function getTodoistClient(): TodoistApi {
  if (!todoistClient) {
    throw new Error('Cliente Todoist não inicializado. Chame initializeTodoistClient primeiro.');
  }
  return todoistClient;
}

/**
 * Wrapper para adicionar tarefas jurídicas ao Todoist
 * 
 * @param tasks Array de tarefas a adicionar
 * @example
 * await addLegalTasks([{
 *   content: "Elaborar contestação - Processo 1234567-89.2024.8.09.0000",
 *   description: "Prazo: 15 dias úteis",
 *   dueDate: "2024-12-15",
 *   priority: 4
 * }])
 */
export async function addLegalTasks(tasks: LegalTaskInput[]): Promise<Task[]> {
  const client = getTodoistClient();
  
  const createdTasks: Task[] = [];
  for (const task of tasks) {
    const created = await client.addTask({
      content: task.content,
      description: task.description,
      dueString: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      projectId: task.projectId
    });
    createdTasks.push(created);
  }
  
  return createdTasks;
}

/**
 * Busca tarefas de uma data específica
 * 
 * @param date Data no formato YYYY-MM-DD
 * @example
 * const tasks = await findLegalTasksByDate("2024-12-15");
 */
export async function findLegalTasksByDate(date: string): Promise<Task[]> {
  const client = getTodoistClient();
  // Usar filtro do Todoist para data
  const response = await client.getTasksByFilter({ query: date });
  return response.results;
}

/**
 * Busca tarefas com filtro customizado
 * 
 * @param searchText Texto para buscar nas tarefas ou filtro Todoist
 * @example
 * const urgentTasks = await searchLegalTasks("@processo & p1");
 */
export async function searchLegalTasks(searchText: string): Promise<Task[]> {
  const client = getTodoistClient();
  // Tenta usar como filtro primeiro
  try {
    const response = await client.getTasksByFilter({ query: searchText });
    return response.results;
  } catch {
    // Se falhar, busca todas e filtra localmente (menos eficiente)
    const response = await client.getTasks();
    const allTasks = response.results;
    return allTasks.filter(task => 
      task.content.toLowerCase().includes(searchText.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchText.toLowerCase())
    );
  }
}

/**
 * Atualiza uma tarefa existente
 * 
 * @param taskId ID da tarefa no Todoist
 * @param updates Atualizações a aplicar
 */
export async function updateLegalTask(
  taskId: string,
  updates: {
    content?: string;
    description?: string;
    dueDate?: string;
    priority?: Priority;
    labels?: string[];
  }
) {
  const client = getTodoistClient();
  const { dueDate, ...rest } = updates;
  return await client.updateTask(taskId, {
    ...rest,
    dueString: dueDate
  });
}

/**
 * Marca uma tarefa como concluída
 * 
 * @param taskId ID da tarefa no Todoist
 */
export async function completeLegalTask(taskId: string) {
  const client = getTodoistClient();
  return await client.closeTask(taskId);
}

/**
 * Cria uma tarefa a partir de um prazo processual
 * 
 * @param processNumber Número do processo
 * @param taskType Tipo de tarefa (ex: "Contestação", "Recurso", "Alegações Finais")
 * @param deadline Data limite
 * @param description Descrição adicional
 */
export async function createTaskFromDeadline(
  processNumber: string,
  taskType: string,
  deadline: string,
  description?: string
) {
  const taskContent = `${taskType} - Processo ${processNumber}`;
  const taskDescription = description 
    ? `${description}\n\nProcesso: ${processNumber}`
    : `Processo: ${processNumber}`;

  return await addLegalTasks([{
    content: taskContent,
    description: taskDescription,
    dueDate: deadline,
    priority: 4, // Alta prioridade para prazos processuais
    labels: ['processo', 'prazo', taskType.toLowerCase()]
  }]);
}

/**
 * Busca todas as tarefas relacionadas a um processo específico
 * 
 * @param processNumber Número do processo
 */
export async function findTasksByProcess(processNumber: string) {
  return await searchLegalTasks(processNumber);
}

/**
 * Cria tarefas para um novo processo judicial
 * 
 * @param processData Dados do processo
 */
export async function createProcessTasks(processData: {
  number: string;
  type: string;
  deadlines: Array<{
    type: string;
    date: string;
    description?: string;
  }>;
}) {
  const tasks = processData.deadlines.map(deadline => ({
    content: `${deadline.type} - Processo ${processData.number}`,
    description: `${deadline.description || ''}\n\nProcesso: ${processData.number}\nTipo: ${processData.type}`,
    dueDate: deadline.date,
    priority: 4 as Priority,
    labels: ['processo', 'prazo', deadline.type.toLowerCase()]
  }));

  return await addLegalTasks(tasks);
}

/**
 * Obtém tarefas de hoje
 */
export async function getTodayTasks() {
  const today = new Date().toISOString().split('T')[0];
  return await findLegalTasksByDate(today);
}

/**
 * Obtém tarefas urgentes (próximos 3 dias)
 */
export async function getUrgentTasks() {
  const client = getTodoistClient();
  const response = await client.getTasksByFilter({ query: '3 days' });
  return response.results;
}

/**
 * Exporta as ferramentas configuradas para uso com LLMs
 * (compatível com Vercel AI SDK e similares)
 */
export function getTodoistTools(client: TodoistApi) {
  // Helper to wrap tools with the client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function wrapTool(tool: any) {
    return {
      ...tool,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute(args: any) {
        return tool.execute(args, client);
      }
    };
  }

  return {
    findTasksByDate: wrapTool(findTasksByDate),
    addTasks: wrapTool(addTasks),
    findTasks: wrapTool(findTasks),
    updateTasks: wrapTool(updateTasks),
    completeTasks: wrapTool(completeTasks)
  };
}

