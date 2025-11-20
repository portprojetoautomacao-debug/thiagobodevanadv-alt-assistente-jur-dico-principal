/**
 * Vercel KV API endpoint
 * 
 * Handles GET and POST requests for key-value storage
 * - GET: Retrieve value by key
 * - POST: Set value for key
 * 
 * Uses Vercel KV in production, returns 404 in development (falls back to localStorage)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Check if we're in a production environment with Vercel KV available
const isVercelKVAvailable = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // If Vercel KV is not available, return success with fallback indication
  // This allows the client to use localStorage as fallback
  if (!isVercelKVAvailable) {
    if (req.method === 'GET') {
      // Return null for GET requests when KV is not available
      res.status(200).json({ key: req.query.key, value: null, fallback: true });
    } else if (req.method === 'POST') {
      // Return success for POST requests when KV is not available
      res.status(200).json({ success: true, key: req.body?.key, fallback: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    return;
  }

  try {
    // Dynamically import @vercel/kv (only available in production)
    const { kv } = await import('@vercel/kv');

    if (req.method === 'GET') {
      // GET: Retrieve value
      const { key } = req.query;

      if (!key || typeof key !== 'string') {
        res.status(400).json({ error: 'Key parameter is required' });
        return;
      }

      const value = await kv.get(key);

      if (value === null) {
        res.status(404).json({ error: 'Key not found' });
        return;
      }

      res.status(200).json({ key, value });
    } else if (req.method === 'POST') {
      // POST: Set value
      const { key, value } = req.body;

      if (!key || typeof key !== 'string') {
        res.status(400).json({ error: 'Key is required in request body' });
        return;
      }

      if (value === undefined) {
        res.status(400).json({ error: 'Value is required in request body' });
        return;
      }

      await kv.set(key, value);
      res.status(200).json({ success: true, key });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Vercel KV error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
