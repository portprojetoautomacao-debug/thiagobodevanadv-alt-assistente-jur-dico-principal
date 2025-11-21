/**
 * Vercel Cron Job - Daily Agent Counter Reset
 * This endpoint runs daily at midnight to reset agent task counters
 * 
 * Schedule: Daily at 00:00 (midnight)
 * Path: /api/cron/daily-reset
 * 
 * This cron job will:
 * 1. Reset daily task counters for all autonomous agents
 * 2. Archive completed tasks older than 30 days
 * 3. Log daily statistics
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAgents, updateAgents, getCompletedTasks, updateCompletedTasks } from '../../lib/api/kv-utils';

interface DailyResetResult {
  success: boolean;
  timestamp: string;
  agentsReset: number;
  tasksArchived: number;
  errors: string[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron request
  const authHeader = req.headers.authorization;
  const isVercelCron = authHeader?.startsWith('Bearer ');
  const isLocalTest = process.env.NODE_ENV === 'development';
  
  if (!isVercelCron && !isLocalTest) {
    return res.status(401).json({ 
      error: 'Unauthorized - This endpoint is only for Vercel Cron Jobs' 
    });
  }

  const timestamp = new Date().toISOString();
  console.log(`[Daily Reset Cron] Starting execution at ${timestamp}`);

  try {
    const result: DailyResetResult = {
      success: true,
      timestamp,
      agentsReset: 0,
      tasksArchived: 0,
      errors: []
    };

    // Get all agents from Vercel KV
    const agents = await getAgents();
    console.log(`[Daily Reset Cron] Found ${agents.length} agents`);

    if (agents.length > 0) {
      // Reset tasksToday counter for each agent
      const updatedAgents = agents.map(agent => ({
        ...agent,
        tasksToday: 0
      }));

      await updateAgents(updatedAgents);
      result.agentsReset = updatedAgents.length;
      console.log(`[Daily Reset Cron] Reset counters for ${result.agentsReset} agents`);
    }

    // Archive old completed tasks (older than 30 days)
    const completedTasks = await getCompletedTasks();
    console.log(`[Daily Reset Cron] Found ${completedTasks.length} completed tasks`);

    if (completedTasks.length > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const tasksToKeep = completedTasks.filter((task: { completedAt?: string }) => {
        if (!task.completedAt) return true;
        return new Date(task.completedAt) >= cutoffDate;
      });

      result.tasksArchived = completedTasks.length - tasksToKeep.length;

      if (result.tasksArchived > 0) {
        await updateCompletedTasks(tasksToKeep);
        console.log(`[Daily Reset Cron] Archived ${result.tasksArchived} old tasks`);
      }
    }

    // Generate daily statistics
    console.log(`[Daily Reset Cron] Daily statistics:`);
    console.log(`  - Agents reset: ${result.agentsReset}`);
    console.log(`  - Tasks archived: ${result.tasksArchived}`);
    console.log(`  - Active tasks: ${completedTasks.length - result.tasksArchived}`);

    console.log(`[Daily Reset Cron] Daily maintenance completed successfully`);

    return res.status(200).json({
      ok: true,
      message: 'Daily reset cron executed successfully',
      result
    });

  } catch (error) {
    console.error('[Daily Reset Cron] Error:', error);
    
    return res.status(500).json({
      ok: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    });
  }
}
