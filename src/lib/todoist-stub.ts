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

export class TodoistApi {
  constructor(_apiKey: string) {
    console.warn('[Todoist Stub] TodoistApi should only be used server-side. Use API routes from the client.');
  }

  getTasks() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  getProjects() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  addTask() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  updateTask() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  closeTask() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }

  deleteTask() {
    throw new Error('TodoistApi is not available in the browser. Use /api/todoist-* endpoints instead.');
  }
}

export interface Task {
  id: string;
  content: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  parentId?: string;
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
