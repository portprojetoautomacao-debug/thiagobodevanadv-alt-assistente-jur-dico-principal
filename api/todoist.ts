/**
 * Todoist API Proxy
 * Executa operações Todoist no servidor para evitar expor API key no cliente
 * 
 * Endpoint: /api/todoist
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TodoistApi } from '@doist/todoist-api-typescript';

// Inicializar cliente Todoist
const todoistClient = process.env.TODOIST_API_KEY
  ? new TodoistApi(process.env.TODOIST_API_KEY)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!todoistClient) {
    return res.status(500).json({ 
      error: 'Todoist API key not configured',
      configured: false
    });
  }

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'getTasks': {
        const { projectId, label } = req.method === 'POST' ? req.body : req.query;
        const tasks = await todoistClient.getTasks({
          projectId,
          label
        });
        return res.status(200).json({ ok: true, tasks });
      }

      case 'getProjects': {
        const projects = await todoistClient.getProjects();
        return res.status(200).json({ ok: true, projects });
      }

      case 'addTask': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for addTask' });
        }

        const { content, description, projectId, dueString, priority, labels } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'content is required' });
        }

        const task = await todoistClient.addTask({
          content,
          description,
          projectId,
          dueString,
          priority,
          labels
        });

        return res.status(200).json({ ok: true, task });
      }

      case 'updateTask': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for updateTask' });
        }

        const { id, content, description, dueString, priority, labels } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        const task = await todoistClient.updateTask(id, {
          content,
          description,
          dueString,
          priority,
          labels
        });

        return res.status(200).json({ ok: true, task });
      }

      case 'closeTask': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for closeTask' });
        }

        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        await todoistClient.closeTask(id);
        return res.status(200).json({ ok: true, message: 'Task closed' });
      }

      case 'deleteTask': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for deleteTask' });
        }

        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'id is required' });
        }

        await todoistClient.deleteTask(id);
        return res.status(200).json({ ok: true, message: 'Task deleted' });
      }

      case 'createProject': {
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'POST required for createProject' });
        }

        const { name, color } = req.body;
        
        if (!name) {
          return res.status(400).json({ error: 'name is required' });
        }

        const project = await todoistClient.addProject({ name, color });
        return res.status(200).json({ ok: true, project });
      }

      case 'checkConfig': {
        return res.status(200).json({ 
          ok: true, 
          configured: true,
          message: 'Todoist API configured'
        });
      }

      default:
        return res.status(400).json({ 
          error: 'Invalid action. Valid actions: getTasks, getProjects, addTask, updateTask, closeTask, deleteTask, createProject, checkConfig'
        });
    }
  } catch (error) {
    console.error('[Todoist API] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
