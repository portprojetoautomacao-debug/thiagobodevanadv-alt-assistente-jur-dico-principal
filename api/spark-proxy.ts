/**
 * Vercel Serverless Function to proxy Spark API requests to GitHub Runtime API
 * This function handles /_spark/* requests and forwards them to GitHub's runtime API
 */

export default async function handler(req: any, res: any) {
  const { service, path } = req.query;
  
  // Get runtime configuration
  const githubRuntimeName = process.env.GITHUB_RUNTIME_PERMANENT_NAME || process.env.VITE_GITHUB_RUNTIME_NAME;
  const githubApiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubRuntimeName) {
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
  const pathSegment = path ? `/${path}` : '';
  const targetUrl = `${githubApiUrl}/runtime/${githubRuntimeName}/${service}${pathSegment}`;

  try {
    // Forward the request to GitHub API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (githubToken) {
      headers['Authorization'] = `Bearer ${githubToken}`;
    }

    // Forward the request method and body
    const options: RequestInit = {
      method: req.method || 'GET',
      headers,
    };

    // If there's a body, forward it
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await new Promise<string>((resolve) => {
        let data = '';
        req.on('data', (chunk: any) => {
          data += chunk;
        });
        req.on('end', () => {
          resolve(data);
        });
      });
      
      if (body) {
        options.body = body;
      }
    }

    const response = await fetch(targetUrl, options);
    const data = await response.text();

    // Forward the response
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(data);
  } catch (error) {
    console.error('Error proxying request to GitHub API:', error);
    res.status(500).json({
      error: 'Failed to proxy request to GitHub API',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
