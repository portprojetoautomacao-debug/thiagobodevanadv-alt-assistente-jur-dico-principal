/**
 * Vercel Serverless Function to proxy Spark API requests to GitHub Runtime API
 * This function handles /_spark/* requests and forwards them to GitHub's runtime API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Configura headers CORS
 */
function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Valida variáveis de ambiente necessárias
 */
function validateEnvVars(res: VercelResponse): { runtimeName: string; apiUrl: string; token: string } | null {
  const githubRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME || process.env.VITE_GITHUB_RUNTIME_NAME;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubRuntimeName) {
    console.error('GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set');
    res.status(500).json({
      error: 'GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set',
      message: 'Please configure this in Vercel environment variables.',
      quickFix: 'See QUICK_FIX_403.md or VERCEL_ENV_SETUP.md for setup instructions',
      value: '97a1cb1e48835e0ecf1e'
    });
    return null;
  }

  if (!githubToken) {
    console.error('GITHUB_TOKEN environment variable is not set');
    res.status(500).json({
      error: 'GITHUB_TOKEN environment variable is not set',
      message: 'Please configure this in Vercel environment variables.',
      quickFix: 'See QUICK_FIX_403.md or VERCEL_ENV_SETUP.md for setup instructions',
      createToken: 'https://github.com/settings/tokens'
    });
    return null;
  }

  return { runtimeName: githubRuntimeName, apiUrl: githubApiUrl, token: githubToken };
}

/**
 * Constrói o path segment a partir da query
 */
function buildPathSegment(path: string | string[] | undefined): string {
  if (!path) return '';
  if (Array.isArray(path)) {
    return '/' + path.join('/');
  }
  return '/' + path;
}

/**
 * Processa resposta do proxy
 */
async function handleProxyResponse(
  response: Response,
  res: VercelResponse,
  targetUrl: string
): Promise<void> {
  const contentType = response.headers.get('content-type') || 'application/json';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  res.setHeader('Content-Type', contentType);
  setCorsHeaders(res);
  res.status(response.status);

  if (isJson) {
    res.json(data);
  } else {
    if (typeof data === 'string' && data.trim().startsWith('<')) {
      console.warn(`Proxy request to ${targetUrl} returned HTML (status ${response.status}). This likely indicates a rewrite to index.html or a login page. Response snippet: ${data.slice(0, 512)}`);
    }
    res.send(data);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  const { service, path } = req.query;

  // Validar variáveis de ambiente
  const envVars = validateEnvVars(res);
  if (!envVars) return;

  if (!service) {
    res.status(400).json({ error: 'Service parameter is required' });
    return;
  }

  const pathSegment = buildPathSegment(path as string | string[] | undefined);
  const targetUrl = `${envVars.apiUrl}/runtime/${envVars.runtimeName}/${service}${pathSegment}`;

  console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}`);

  try {
    const incomingAccept = req.headers['accept'] as string | undefined;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': incomingAccept || 'application/json',
      'Authorization': `bearer ${envVars.token}`,
    };

    const options: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, options);
    await handleProxyResponse(response, res, targetUrl);
  } catch (error) {
    console.error('Error proxying request to GitHub API:', error);
    res.status(500).json({
      error: 'Failed to proxy request to GitHub API',
      message: error instanceof Error ? error.message : 'Unknown error',
      service,
      path: pathSegment
    });
  }
}
