/**
 * Vercel Serverless Function to proxy Spark LLM requests to GitHub Models API
 * This function handles /_spark/llm requests
 */

export default async function handler(req: any, res: any) {
  const githubToken = process.env.GITHUB_TOKEN;
  const targetUrl = 'https://models.github.ai/inference/chat/completions';

  if (!githubToken) {
    res.status(500).json({
      error: 'GITHUB_TOKEN environment variable is not set'
    });
    return;
  }

  try {
    // Read the request body
    const body = await new Promise<string>((resolve) => {
      let data = '';
      req.on('data', (chunk: any) => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(data);
      });
    });

    // Forward the request to GitHub Models API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`,
      },
      body,
    });

    const data = await response.text();

    // Forward the response
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    res.send(data);
  } catch (error) {
    console.error('Error proxying LLM request:', error);
    res.status(500).json({
      error: 'Failed to proxy LLM request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
