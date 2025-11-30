import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Get AI provider name based on available keys
 */
function getAIProvider(openaiKey?: string, geminiKey?: string): string {
  if (openaiKey) return 'OpenAI';
  if (geminiKey) return 'Gemini';
  return 'none';
}

/**
 * Configura headers CORS
 */
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * Handler para Spark Loaded Logic
 */
function handleSparkLoaded(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'POST') {
    res.status(200).json({
      status: 'loaded',
      timestamp: new Date().toISOString()
    });
    return true;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      service: 'spark-loaded',
      timestamp: new Date().toISOString()
    });
    return true;
  }

  return false;
}

/**
 * Gera resposta de health check
 */
function generateHealthCheck(res: VercelResponse): void {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;

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
    ai_configured: aiProvider !== 'none',
    openai_key_preview: process.env.OPENAI_API_KEY
      ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}` : 'not set',
    gemini_key_preview: geminiKey
      ? `...${geminiKey.slice(-4)}` : 'not set',
    gemini_var_source: geminiKey
      ? (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : 'VITE_GOOGLE_API_KEY')
      : 'none',
    app_env: process.env.VITE_APP_ENV || 'not set',
    node_env: process.env.NODE_ENV || 'not set',
  };

  const aiConfigured = checks.openai_api_key || checks.gemini_api_key;
  const statusCode = aiConfigured ? 200 : 500;

  res.status(statusCode).json({
    status: aiConfigured ? 'healthy' : 'unhealthy',
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
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  const type = req.query.type as string;

  // Spark Loaded Logic
  if (type === 'loaded' || req.url?.includes('/loaded')) {
    if (handleSparkLoaded(req, res)) {
      return;
    }
  }

  // Health Check Logic (Default)
  generateHealthCheck(res);
}
