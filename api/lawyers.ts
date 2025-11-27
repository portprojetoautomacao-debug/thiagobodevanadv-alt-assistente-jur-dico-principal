/**
 * API para gerenciar advogados monitorados
 * 
 * Endpoints:
 * - GET /api/lawyers - Lista todos os advogados
 * - POST /api/lawyers - Adiciona um advogado
 * - DELETE /api/lawyers?id=xxx - Remove um advogado
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const KV_KEY = 'monitored-lawyers';

interface MonitoredLawyer {
  id: string;
  name: string;
  oab: string;
  email?: string;
  enabled: boolean;
  tribunals: string[];
}

async function getKv(): Promise<Redis> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Upstash Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kv = await getKv();

    // GET - Lista advogados
    if (req.method === 'GET') {
      const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEY) || [];
      return res.status(200).json({
        success: true,
        lawyers,
        count: lawyers.length
      });
    }

    // POST - Adiciona advogado
    if (req.method === 'POST') {
      const { name, oab, email, tribunals } = req.body;

      if (!name || !oab) {
        return res.status(400).json({
          success: false,
          error: 'Nome e OAB sao obrigatorios'
        });
      }

      const newLawyer: MonitoredLawyer = {
        id: `lawyer-${Date.now()}`,
        name,
        oab,
        email: email || '',
        enabled: true,
        tribunals: tribunals || ['TJMG', 'TRT3', 'TST', 'STJ', 'TRF1']
      };

      const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEY) || [];

      // Verifica se já existe
      const exists = lawyers.some(l => l.oab === oab);
      if (exists) {
        return res.status(400).json({
          success: false,
          error: 'Advogado com esta OAB ja cadastrado'
        });
      }

      lawyers.push(newLawyer);
      await kv.set(KV_KEY, lawyers);

      return res.status(201).json({
        success: true,
        message: 'Advogado cadastrado com sucesso',
        lawyer: newLawyer
      });
    }

    // DELETE - Remove advogado
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'ID do advogado e obrigatorio'
        });
      }

      const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEY) || [];
      const filtered = lawyers.filter(l => l.id !== id);

      if (filtered.length === lawyers.length) {
        return res.status(404).json({
          success: false,
          error: 'Advogado nao encontrado'
        });
      }

      await kv.set(KV_KEY, filtered);

      return res.status(200).json({
        success: true,
        message: 'Advogado removido com sucesso'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[API Lawyers] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}
