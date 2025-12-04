import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let _kv: Redis | null = null;
async function getKv(): Promise<Redis | null> {
  if (_kv) return _kv;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
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
function getAIProvider(openaiKey?: string, geminiKey?: string): string {
  if (openaiKey) return "OpenAI";
  if (geminiKey) return "Gemini";
  return "none";
}

/**
 * Determina a fonte da chave Gemini para diagnóstico
 */
function getGeminiVarSource(geminiKey: string | undefined): string {
  if (!geminiKey) return "none";
  if (process.env.GEMINI_API_KEY) return "GEMINI_API_KEY";
  return "VITE_GOOGLE_API_KEY";
}

/**
 * Gera preview seguro de uma chave API
 */
function getKeyPreview(key: string | undefined, prefix = ""): string {
  if (!key) return "not set";
  return `${prefix}...${key.slice(-4)}`;
}

/**
 * Handler para Spark Loaded Logic
 */
export function handleSparkLoaded(req: VercelRequest, res: VercelResponse): boolean {
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

export async function handleWatchdogRequest(req: VercelRequest, res: VercelResponse) {
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

export async function handleCronHealthRequest(req: VercelRequest, res: VercelResponse) {
  try {
    const kv = await getKv();

    // Buscar dados do KV de forma segura
    const queueHistory = kv
      ? await kv.get<Array<{ timestamp: string; queueLength: number; pendingCount: number }>>(
          "agent-queue-depth-history"
        )
      : null;
    const watchdog = kv ? await kv.get("watchdog-last-result") : null;
    const lastBackup = kv ? await kv.get("backup-list") : null;

    // Processar histórico de fila
    const processedHistory = Array.isArray(queueHistory) ? queueHistory.slice(0, 20) : [];

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      queue_history: processedHistory,
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
export function generateHealthCheck(res: VercelResponse): void {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

  const checks = {
    openai_api_key: !!process.env.OPENAI_API_KEY,
    gemini_api_key: !!geminiKey,
    google_client_id: !!process.env.VITE_GOOGLE_CLIENT_ID,
    app_env: !!process.env.VITE_APP_ENV,
    upstash_redis: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  const aiProvider = getAIProvider(process.env.OPENAI_API_KEY, geminiKey);
  const aiConfigured = checks.openai_api_key || checks.gemini_api_key;

  const info = {
    ai_provider: aiProvider,
    ai_configured: aiProvider !== "none",
    openai_key_preview: getKeyPreview(process.env.OPENAI_API_KEY, "sk-"),
    gemini_key_preview: getKeyPreview(geminiKey),
    gemini_var_source: getGeminiVarSource(geminiKey),
    app_env: process.env.VITE_APP_ENV || "not set",
    node_env: process.env.NODE_ENV || "not set",
  };

  const statusCode = aiConfigured ? 200 : 500;

  res.status(statusCode).json({
    status: aiConfigured ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    checks,
    info,
  });
}
