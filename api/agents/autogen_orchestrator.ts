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

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { requireApiKey } from "../lib/auth.js";
import { redactPii } from "../lib/pii.js";
import { rateLimitMiddleware } from "../lib/rate-limit.js";
import { retryWithBackoff } from "../lib/retry.js";
import { escapeHtml } from "../lib/sanitize.js";
import { withTimeout } from "../lib/timeout.js";

// Configuration
const MAX_TIMEOUT_MS = 40000; // 40s (stay under Vercel 45s limit)
const MAX_ROUNDS = 10;
const ALLOWED_AGENTS = [
  "harvey",
  "justine",
  "analise-documental",
  "monitor-djen",
  "gestao-prazos",
  "redacao-peticoes",
];

const OrchestrationRequestSchema = z.object({
  task: z.string().min(1).max(10000),
  agents: z.array(z.string()).min(1),
  maxRounds: z.number().int().min(1).max(MAX_ROUNDS).optional(),
  timeout: z.number().int().min(1000).max(MAX_TIMEOUT_MS).optional(),
});

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

type OrchestrationRequest = z.infer<typeof OrchestrationRequestSchema>;

/**
 * Validate authentication
 */
function validateAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.AUTOGEN_API_KEY;

  if (!apiKey) {
    console.warn("AUTOGEN_API_KEY not configured");
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
// Optionally keep a small guard, but prefer Zod schema validation
function validateRequest(body: unknown): body is OrchestrationRequest {
  return OrchestrationRequestSchema.safeParse(body).success;
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
    role: "system",
    content: `Task: ${request.task}`,
    timestamp: Date.now(),
  });

  // Simulate agent coordination (stub)
  for (const agent of request.agents) {
    if (signal.aborted) {
      throw new Error("Operation aborted");
    }

    messages.push({
      role: agent,
      content: `[Stub] Agent ${agent} acknowledges task`,
      timestamp: Date.now(),
    });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 100));
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
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS headers
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const origin = (req.headers && (req.headers["origin"] as string | undefined)) || "";
  if (origin && allowedOrigins.length > 0) {
    if (!allowedOrigins.includes(origin)) {
      res.status(403).json({ error: "Origin not allowed" });
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Validate authentication
  if (!validateAuth(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Prefer standard API key middleware
  if (!requireApiKey(req, res, "AUTOGEN_API_KEY")) return;

  // Validate request (Zod)
  const parsed = OrchestrationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request payload", details: parsed.error.format() });
    return;
  }
  const request = parsed.data as OrchestrationRequest;

  // Sanitize and redact input task text
  if (typeof request.task === "string") {
    request.task = redactPii(escapeHtml(request.task));
  }
  const timeout = request.timeout || MAX_TIMEOUT_MS;

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Rate limiting by IP
  const clientIP =
    (req.headers["x-forwarded-for"] as string | undefined) ||
    (req.headers["x-real-ip"] as string | undefined) ||
    "unknown";
  const rl = await rateLimitMiddleware(clientIP);
  Object.entries(rl.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
  if (!rl.allowed) {
    res.setHeader(
      "Retry-After",
      Math.max(
        1,
        Math.ceil((Number(rl.headers["X-RateLimit-Reset"]) - Date.now()) / 1000)
      ).toString()
    );
    res.status(429).json({ error: rl.error || "Rate limit exceeded" });
    return;
  }
  try {
    const exec = () => orchestrateAgents(request, controller.signal);
    const result = await retryWithBackoff(() => withTimeout(timeout, exec()), 3, 5000);

    clearTimeout(timeoutId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    clearTimeout(timeoutId);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("Orchestration error:", errorMessage);

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
  runtime: "nodejs22.x",
};
