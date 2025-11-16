/**
 * Vercel Serverless Function to proxy Spark API requests to GitHub Runtime API
 * This function handles /_spark/* requests and forwards them to GitHub's runtime API
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  const { service, path } = req.query;
  
  // Get runtime configuration
  const githubRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME || process.env.VITE_GITHUB_RUNTIME_NAME;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubRuntimeName) {
    console.error('GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set');
    res.status(500).json({
      error: 'GITHUB_RUNTIME_PERMANENT_NAME environment variable is not set'
    });
    return;
  }

  if (!service) {
    res.status(400).json({ error: 'Service parameter is required' });
    return;
  }

  // Construct the GitHub API URL
  // For multiple path segments, path will be an array
  let pathSegment = '';
  if (path) {
    if (Array.isArray(path)) {
      pathSegment = '/' + path.join('/');
    } else {
      pathSegment = '/' + path;
    }
  }
  
  const targetUrl = `${githubApiUrl}/runtime/${githubRuntimeName}/${service}${pathSegment}`;
  
  console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}`);

  try {
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
    };

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Prepare fetch options
    const options: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    // Forward request body for non-GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // Make the request to GitHub API
    const response = await fetch(targetUrl, options);
    
    // Get response data
    const contentType = response.headers.get('content-type') || 'application/json';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Send response
    res.status(response.status);
    
    if (isJson) {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('Error proxying request to GitHub API:', error);
    res.status(500).json({
      error: 'Failed to proxy request to GitHub API',
      message: error.message || 'Unknown error',
      service,
      path: pathSegment
    });
  }
}
