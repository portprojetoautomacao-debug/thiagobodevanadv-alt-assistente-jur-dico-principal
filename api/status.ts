import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  const type = req.query.type as string;

  // Spark Loaded Logic
  if (type === 'loaded' || req.url?.includes('/loaded')) {
    // For POST requests (runtime loaded signal), just return success
    if (req.method === 'POST') {
      res.status(200).json({
        status: 'loaded',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // For GET requests, return a simple health check
    if (req.method === 'GET') {
      res.status(200).json({
        status: 'ok',
        service: 'spark-loaded',
        timestamp: new Date().toISOString()
      });
      return;
    }
  }

  // Health Check Logic (Default)
  // Verificar variáveis de ambiente
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GOOGLE_API_KEY;
  
  const checks = {
    // AI Providers (pelo menos um deve estar configurado)
    openai_api_key: !!process.env.OPENAI_API_KEY,
    gemini_api_key: !!geminiKey,
    // Outras variáveis
    google_client_id: !!process.env.VITE_GOOGLE_CLIENT_ID,
    app_env: !!process.env.VITE_APP_ENV,
    upstash_redis: !!process.env.UPSTASH_REDIS_REST_URL,
  };

  // Qual provedor de IA está ativo
  const aiProvider = process.env.OPENAI_API_KEY
    ? 'OpenAI'
    : geminiKey
      ? 'Gemini'
      : 'none';

  // Informações adicionais (sem expor valores sensíveis)
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

  // Verificar se IA está configurada (crítico para funcionalidade)
  const aiConfigured = checks.openai_api_key || checks.gemini_api_key;

  // Status code baseado nas checks
  const statusCode = aiConfigured ? 200 : 500;

  const response = {
    status: aiConfigured ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    info,
  };

  res.status(statusCode).json(response);
}
