/**
 * Todoist API Stub for Browser
 * 
 * This is a browser-safe stub for @doist/todoist-api-typescript
 * The real API is only available server-side (in /api functions)
 * 
 * Client-side code should use API routes instead of direct Todoist calls
 */

export function getTaskUrl(taskId: string): string {
  return `https://todoist.com/app/task/${taskId}`;
}

export function getProjectUrl(projectId: string): string {
  return `https://todoist.com/app/project/${projectId}`;
}

export interface GetTasksResponse {
  results: Task[];
  nextCursor: string | null;
}

export class TodoistApi {
  constructor(_apiKey: string) {
    console.warn('[Todoist Stub] TodoistApi should only be used server-side. Use API routes from the client.');
  }

  getTasks(_args?: { projectId?: string; label?: string }): Promise<GetTasksResponse> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  getTasksByFilter(_args?: { query?: string; cursor?: string; limit?: number }): Promise<GetTasksResponse> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  getProjects(): Promise<Project[]> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  addTask(_args: { content: string; description?: string; projectId?: string; dueString?: string; priority?: number; labels?: string[] }): Promise<Task> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  updateTask(_id: string, _args: { content?: string; description?: string; dueString?: string; priority?: number; labels?: string[] }): Promise<Task> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  closeTask(_id: string): Promise<boolean> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  deleteTask(_id: string): Promise<boolean> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  addProject(_args: { name: string; color?: string }): Promise<Project> {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  projectId: string;
  sectionId: string | null;
  parentId: string | null;
  order?: number;
  labels?: string[];
  priority?: number;
  dueString?: string;
  dueDate?: string;
  dueDatetime?: string;
  dueLang?: string;
  assigneeId?: string;
  url?: string;
  commentCount?: number;
  isCompleted?: boolean;
  createdAt?: string;
  userId?: string;
  addedByUid?: string | null;
  assignedByUid?: string | null;
  responsibleUid?: string | null;
  syncId?: string | null;
  completedAt?: string | null;
  isCollapsed?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
  order?: number;
  commentCount?: number;
  isShared?: boolean;
  isFavorite?: boolean;
  isInboxProject?: boolean;
  isTeamInbox?: boolean;
  viewStyle?: string;
  url?: string;
}

export interface Section {
  id: string;
  projectId: string;
  order: number;
  name: string;
}

export interface Comment {
  id: string;
  taskId?: string;
  projectId?: string;
  content: string;
  postedAt: string;
  attachment?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    resourceType: string;
  };
}

export interface Label {
  id: string;
  name: string;
  color: string;
  order: number;
  isFavorite: boolean;
}
