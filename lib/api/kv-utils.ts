/**
 * Vercel KV Utilities for Cron Jobs
 * 
 * This module provides utilities for interacting with Vercel KV storage
 * from serverless cron job functions.
 */

import { kv } from '@vercel/kv';

// Key prefixes for different data types
export const KV_KEYS = {
  MONITORED_LAWYERS: 'monitored-lawyers',
  PUBLICATIONS: 'publications',
  AGENTS: 'autonomous-agents',
  COMPLETED_TASKS: 'completed-agent-tasks',
  ACTIVITY_LOG: 'agent-activity-log',
  LAST_DJEN_CHECK: 'last-djen-check',
  NOTIFICATION_QUEUE: 'notification-queue'
} as const;

// Types for data stored in KV
export interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

export interface StoredPublication {
  id: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  matchType: 'nome' | 'oab' | 'ambos';
  lawyerId: string;
  notified: boolean;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  enabled: boolean;
  tasksCompleted: number;
  tasksToday: number;
  status: 'idle' | 'active' | 'paused' | 'processing' | 'waiting_human';
  lastActivity?: string;
  continuousMode: boolean;
  currentTask?: unknown;
}

// Get monitored lawyers
export async function getMonitoredLawyers(): Promise<MonitoredLawyer[]> {
  try {
    const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS);
    return lawyers || [];
  } catch (error) {
    console.error('[KV] Error getting monitored lawyers:', error);
    return [];
  }
}

// Store a new publication
export async function storePublication(publication: StoredPublication): Promise<void> {
  try {
    const key = `${KV_KEYS.PUBLICATIONS}:${publication.lawyerId}`;
    const existing = await kv.get<StoredPublication[]>(key) || [];
    
    // Avoid duplicates
    const isDuplicate = existing.some(p => 
      p.tribunal === publication.tribunal &&
      p.data === publication.data &&
      p.numeroProcesso === publication.numeroProcesso
    );
    
    if (!isDuplicate) {
      existing.unshift(publication);
      // Keep only last 1000 publications per lawyer
      const trimmed = existing.slice(0, 1000);
      await kv.set(key, trimmed);
    }
  } catch (error) {
    console.error('[KV] Error storing publication:', error);
    throw error;
  }
}

// Get publications for a lawyer
export async function getPublications(lawyerId: string): Promise<StoredPublication[]> {
  try {
    const key = `${KV_KEYS.PUBLICATIONS}:${lawyerId}`;
    const publications = await kv.get<StoredPublication[]>(key);
    return publications || [];
  } catch (error) {
    console.error('[KV] Error getting publications:', error);
    return [];
  }
}

// Update last DJEN check timestamp
export async function updateLastDJENCheck(): Promise<void> {
  try {
    await kv.set(KV_KEYS.LAST_DJEN_CHECK, new Date().toISOString());
  } catch (error) {
    console.error('[KV] Error updating last DJEN check:', error);
  }
}

// Get last DJEN check timestamp
export async function getLastDJENCheck(): Promise<string | null> {
  try {
    return await kv.get<string>(KV_KEYS.LAST_DJEN_CHECK);
  } catch (error) {
    console.error('[KV] Error getting last DJEN check:', error);
    return null;
  }
}

// Get all autonomous agents
export async function getAgents(): Promise<Agent[]> {
  try {
    const agents = await kv.get<Agent[]>(KV_KEYS.AGENTS);
    return agents || [];
  } catch (error) {
    console.error('[KV] Error getting agents:', error);
    return [];
  }
}

// Update agents
export async function updateAgents(agents: Agent[]): Promise<void> {
  try {
    await kv.set(KV_KEYS.AGENTS, agents);
  } catch (error) {
    console.error('[KV] Error updating agents:', error);
    throw error;
  }
}

// Get completed tasks
export async function getCompletedTasks(): Promise<unknown[]> {
  try {
    const tasks = await kv.get<unknown[]>(KV_KEYS.COMPLETED_TASKS);
    return tasks || [];
  } catch (error) {
    console.error('[KV] Error getting completed tasks:', error);
    return [];
  }
}

// Update completed tasks
export async function updateCompletedTasks(tasks: unknown[]): Promise<void> {
  try {
    await kv.set(KV_KEYS.COMPLETED_TASKS, tasks);
  } catch (error) {
    console.error('[KV] Error updating completed tasks:', error);
    throw error;
  }
}

// Add notification to queue
export async function queueNotification(notification: {
  type: 'publication' | 'agent' | 'system';
  title: string;
  message: string;
  data?: unknown;
  recipientEmail?: string;
}): Promise<void> {
  try {
    const queue = await kv.get<Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      data?: unknown;
      recipientEmail?: string;
      createdAt: string;
      sent: boolean;
    }>>(KV_KEYS.NOTIFICATION_QUEUE) || [];
    queue.push({
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      sent: false
    });
    await kv.set(KV_KEYS.NOTIFICATION_QUEUE, queue);
  } catch (error) {
    console.error('[KV] Error queuing notification:', error);
  }
}
