/**
 * Spark loaded endpoint
 * This endpoint is called by the Spark runtime to signal that it has loaded successfully
 * Returns a simple success response
 */

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

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

  // Method not allowed
  res.status(405).json({ error: 'Method not allowed' });
}