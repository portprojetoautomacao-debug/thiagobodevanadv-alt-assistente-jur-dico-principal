/**
 * Health Check Endpoint
 * Verifica se todas as variáveis de ambiente necessárias estão configuradas
 * 
 * Acesse: /api/health
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
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

  // Mensagens de ajuda
  const missingVars = Object.entries(checks)
    .filter(([_, value]) => !value)
    .map(([key]) => key.toUpperCase());

  const response = {
    status: allOk ? 'healthy' : allCriticalOk ? 'partially_healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    info,
    ...(missingVars.length > 0 && {
      missing_variables: missingVars,
      help: 'Configure as variáveis faltantes em: Vercel Dashboard → Settings → Environment Variables',
      docs: [
        'CORRIGIR_SPARK_VERCEL.md',
        'VERCEL_BUILD_CONFIGURATION.md'
      ]
    })
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(statusCode).json(response);
}
