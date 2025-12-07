/**
 * AutoGen Orchestrator - Vercel Serverless Function
 * 
 * This function orchestrates multi-agent workflows using the AutoGen framework.
 * It provides a serverless API for coordinating agent interactions.
 * 
 * Security Notes:
 * - API key authentication required
 * - No eval() or Function constructor
 * - Input validation on all requests
 * - Timeout protection (45s max for Vercel)
 * - Rate limiting via Vercel edge config
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface OrchestrationRequest {
  task: string;
  agents: string[];
  maxRounds?: number;
  timeout?: number;
}

interface AgentMessage {
  role: string;
  content: string;
  timestamp: number;
}

interface OrchestrationResult {
  success: boolean;
  messages: AgentMessage[];
  rounds: number;
  duration: number;
  error?: string;
}

// Configuration
const MAX_TIMEOUT_MS = 40000; // 40s (stay under Vercel 45s limit)
const MAX_ROUNDS = 10;
const ALLOWED_AGENTS = [
  'harvey',
  'justine',
  'analise-documental',
  'monitor-djen',
  'gestao-prazos',
  'redacao-peticoes',
];

/**
 * Validate authentication
 */
function validateAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.AUTOGEN_API_KEY;

  if (!apiKey) {
    console.warn('AUTOGEN_API_KEY not configured');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  
  // Constant-time comparison to prevent timing attacks
  if (token.length !== apiKey.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ apiKey.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Validate request payload
 */
function validateRequest(body: unknown): body is OrchestrationRequest {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const req = body as Record<string, unknown>;

  if (typeof req.task !== 'string' || req.task.length === 0) {
    return false;
  }

  if (!Array.isArray(req.agents) || req.agents.length === 0) {
    return false;
  }

  // Validate all agents are allowed
  if (req.agents.some(agent => typeof agent !== 'string' || !ALLOWED_AGENTS.includes(agent))) {
    return false;
  }

  if (req.maxRounds !== undefined && (typeof req.maxRounds !== 'number' || req.maxRounds < 1 || req.maxRounds > MAX_ROUNDS)) {
    return false;
  }

  if (req.timeout !== undefined && (typeof req.timeout !== 'number' || req.timeout < 1000 || req.timeout > MAX_TIMEOUT_MS)) {
    return false;
  }

  return true;
}

/**
 * Stub orchestration - to be implemented with actual AutoGen
 */
async function orchestrateAgents(
  request: OrchestrationRequest,
  signal: AbortSignal
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  const messages: AgentMessage[] = [];
  
  // Add initial message
  messages.push({
    role: 'system',
    content: `Task: ${request.task}`,
    timestamp: Date.now(),
  });

  // Simulate agent coordination (stub)
  for (const agent of request.agents) {
    if (signal.aborted) {
      throw new Error('Operation aborted');
    }

    messages.push({
      role: agent,
      content: `[Stub] Agent ${agent} acknowledges task`,
      timestamp: Date.now(),
    });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const duration = Date.now() - startTime;

  return {
    success: true,
    messages,
    rounds: 1,
    duration,
  };
}

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Validate authentication
  if (!validateAuth(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Validate request
  if (!validateRequest(req.body)) {
    res.status(400).json({ error: 'Invalid request payload' });
    return;
  }

  const request = req.body as OrchestrationRequest;
  const timeout = request.timeout || MAX_TIMEOUT_MS;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const result = await orchestrateAgents(request, controller.signal);
    
    clearTimeout(timeoutId);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Orchestration error:', errorMessage);
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

/**
 * Vercel configuration
 */
export const config = {
  maxDuration: 45, // Maximum for Vercel Hobby plan
  runtime: 'nodejs22.x',
};
