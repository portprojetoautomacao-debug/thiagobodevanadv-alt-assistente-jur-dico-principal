import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let _kv: Redis | null = null;
async function getKv (): Promise<Redis | null>
{
  if (_kv) return _kv;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    _kv = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
    });
    return _kv;
  }
  return null;
}

/**
 * Get AI provider name based on available keys
 */
function getAIProvider (openaiKey?: string, geminiKey?: string): string
{
  if (openaiKey) return "OpenAI";
  if (geminiKey) return "Gemini";
  return "none";
}

/**
 * Configura headers CORS
 */
function setCorsHeaders (res: VercelResponse): void
{
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Handler para Spark Loaded Logic
 */
function handleSparkLoaded (req: VercelRequest, res: VercelResponse): boolean
{
  if (req.method === "POST") {
    res.status(200).json({
      status: "loaded",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (req.method === "GET") {
    res.status(200).json({
      status: "ok",
      service: "spark-loaded",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  return false;
}

async function handleWatchdogRequest (req: VercelRequest, res: VercelResponse)
{
  try {
    const kv = await getKv();
    const data = kv ? await kv.get("watchdog-last-result") : null;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      watchdog: data || null,
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}

async function handleCronHealthRequest (req: VercelRequest, res: VercelResponse)
{
  try {
    const kv = await getKv();
    const queueHistory = kv
      ? ((await kv.get("agent-queue-depth-history")) as Array<{
        timestamp: string;
        queueLength: number;
        pendingCount: number;
      }>)
      : [];
    const watchdog = kv ? await kv.get("watchdog-last-result") : null;
    const lastBackup = kv ? await kv.get("backup-list") : null;
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      queue_history: Array.isArray(queueHistory) ? queueHistory.slice(0, 20) : [],
      last_watchdog: watchdog || null,
      backups: lastBackup || [],
    });
  } catch (e) {
    res.status(500).json({
      status: "error",
      error: e instanceof Error ? e.message : "unknown",
    });
  }
}

/**
 * Gera resposta de health check
 */
function generateHealthCheck (res: VercelResponse): void
{
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const checks = {
    openai_api_key: !!process.env.OPENAI_API_KEY,
    gemini_api_key: !!geminiKey,
    google_client_id: !!process.env.VITE_GOOGLE_CLIENT_ID,
    app_env: !!process.env.VITE_APP_ENV,
    upstash_redis: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const aiProvider = getAIProvider(process.env.OPENAI_API_KEY, geminiKey);

  const info = {
    ai_provider: aiProvider,
    ai_configured: aiProvider !== "none",
    openai_key_preview: process.env.OPENAI_API_KEY
      ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
      : "not set",
    gemini_key_preview: geminiKey ? `...${geminiKey.slice(-4)}` : "not set",
    gemini_var_source: geminiKey
      ? process.env.GEMINI_API_KEY
        ? "GEMINI_API_KEY"
        : "VITE_GOOGLE_API_KEY"
      : "none",
    app_env: process.env.VITE_APP_ENV || "not set",
    node_env: process.env.NODE_ENV || "not set",
  };

  const aiConfigured = checks.openai_api_key || checks.gemini_api_key;
  const statusCode = aiConfigured ? 200 : 500;

  res.status(statusCode).json({
    status: aiConfigured ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
    info,
  });
}

/**
 * Status Endpoint
 * Combines Health Check and Spark Loaded functionality
 *
 * Access:
 * - /api/status?type=health (Health Check)
 * - /api/status?type=loaded (Spark Loaded)
 */
export default async function handler (req: VercelRequest, res: VercelResponse)
{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  const type = req.query.type as string;

  // Spark Loaded Logic
  if (type === "loaded" || req.url?.includes("/loaded")) {
    if (handleSparkLoaded(req, res)) {
      return;
    }
  }

  // Watchdog last result (read-only)
  if (type === "watchdog") {
    await handleWatchdogRequest(req, res);
    return;
  }

  // Cron health (fila agentes + watchdog + próximos backups)
  if (type === "cron-health") {
    await handleCronHealthRequest(req, res);
    return;
  }

  // Health Check Logic (Default)
  generateHealthCheck(res);
}
