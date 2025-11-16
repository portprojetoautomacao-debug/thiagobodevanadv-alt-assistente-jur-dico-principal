/**
 * Vercel Serverless Function to proxy Spark LLM requests to GitHub Models API
 * This function handles /_spark/llm requests
 */

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  const githubToken = process.env.GITHUB_TOKEN;
  const targetUrl = 'https://models.github.ai/inference/chat/completions';

  if (!githubToken) {
    console.error('GITHUB_TOKEN environment variable is not set');
    res.status(500).json({
      error: 'GITHUB_TOKEN environment variable is not set'
    });
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Only POST is supported.' });
    return;
  }

  console.log(`Proxying LLM request to ${targetUrl}`);

  try {
    // Get request body
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    // Forward the request to GitHub Models API
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`,
      },
      body,
    });

    // Get response data
    const contentType = response.headers.get('content-type') || 'application/json';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Send response
    res.status(response.status);
    
    if (isJson) {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('Error proxying LLM request:', error);
    res.status(500).json({
      error: 'Failed to proxy LLM request',
      message: error.message || 'Unknown error'
    });
  }
}
