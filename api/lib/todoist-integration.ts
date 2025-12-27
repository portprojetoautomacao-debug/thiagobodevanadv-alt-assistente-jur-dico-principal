/**
 * Todoist Integration for API routes
 * Standalone version without src/ dependencies
 */

import { TodoistApi } from "@doist/todoist-api-typescript";

interface LegalTaskInput {
  content: string;
  description?: string;
  dueDate?: string;
  priority?: 1 | 2 | 3 | 4;
  labels?: string[];
  projectId?: string;
}

/**
 * Get Todoist API client
 */
function getTodoistClient(): TodoistApi {
  const apiKey = process.env.TODOIST_API_KEY;

  if (!apiKey) {
    throw new Error("TODOIST_API_KEY not configured in environment variables");
  }

  return new TodoistApi(apiKey);
}

/**
 * Add legal tasks to Todoist
 */
export async function addLegalTasks(tasks: LegalTaskInput[]) {
  const client = getTodoistClient();

  const createdTasks = [];
  for (const task of tasks) {
    const created = await client.addTask({
      content: task.content,
      description: task.description,
      dueString: task.dueDate,
      priority: task.priority,
      labels: task.labels,
      projectId: task.projectId,
    });
    createdTasks.push(created);
  }

  return createdTasks;
}

/**
 * Update legal task
 */
export async function updateLegalTask(
  taskId: string,
  updates: {
    content?: string;
    description?: string;
    dueDate?: string;
    priority?: 1 | 2 | 3 | 4;
    labels?: string[];
  }
) {
  const client = getTodoistClient();
  const { dueDate, ...rest } = updates;

  return await client.updateTask(taskId, {
    ...rest,
    dueString: dueDate,
  });
}
