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
  const checks = {
    github_token: !!process.env.GITHUB_TOKEN,
    runtime_name: !!process.env.GITHUB_RUNTIME_PERMANENT_NAME,
    api_url: !!process.env.GITHUB_API_URL,
    google_client_id: !!process.env.VITE_GOOGLE_CLIENT_ID,
    app_env: !!process.env.VITE_APP_ENV,
  };

  // Informações adicionais (sem expor valores sensíveis)
  const info = {
    runtime_name_set: process.env.GITHUB_RUNTIME_PERMANENT_NAME ? 
      `${process.env.GITHUB_RUNTIME_PERMANENT_NAME.substring(0, 4)}...` : 'not set',
    api_url: process.env.GITHUB_API_URL || 'not set (using default)',
    app_env: process.env.VITE_APP_ENV || 'not set',
    node_env: process.env.NODE_ENV || 'not set',
  };

  // Verificar se todas as checks críticas passaram
  const criticalChecks = {
    github_token: checks.github_token,
    runtime_name: checks.runtime_name,
  };

  const allCriticalOk = Object.values(criticalChecks).every(v => v);
  const allOk = Object.values(checks).every(v => v);

  // Status code baseado nas checks
  const statusCode = allCriticalOk ? 200 : 500;

  const response = {
    status: allOk ? 'healthy' : allCriticalOk ? 'partially_healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    info,
  };

  res.status(statusCode).json(response);
}
