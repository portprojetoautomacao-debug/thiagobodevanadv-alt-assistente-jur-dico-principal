/**
 * API para gerenciar expedientes/publicações do DJEN
 * 
 * Endpoints:
 * - GET /api/expedientes - Lista todas as publicações encontradas
 * - POST /api/expedientes/sync - Força sincronização com DJEN (trigger manual)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

const KV_KEYS = {
  PUBLICATIONS: 'publications',
  LAST_CHECK: 'last-djen-check',
  MONITORED_LAWYERS: 'monitored-lawyers'
};

interface StoredPublication {
  id: string;
  djenId?: string;
  tribunal: string;
  data: string;
  tipo: string;
  teor: string;
  numeroProcesso?: string;
  orgao?: string;
  meio?: string;
  link?: string;
  hash?: string;
  lawyerId: string;
  lawyerName: string;
  lawyerOAB: string;
  matchType: 'nome' | 'oab' | 'ambos';
  notified: boolean;
  createdAt: string;
}

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
    throw new Error('Upstash Redis not configured');
  }
  
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL.trim(),
    token: process.env.UPSTASH_REDIS_REST_TOKEN.trim(),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const kv = await getKv();

    // GET - Lista expedientes/publicações
    if (req.method === 'GET') {
      const { lawyerId, limit, status } = req.query;
      
      let publications = await kv.get<StoredPublication[]>(KV_KEYS.PUBLICATIONS) || [];
      
      // Filtros
      if (lawyerId && typeof lawyerId === 'string') {
        publications = publications.filter(p => p.lawyerId === lawyerId);
      }
      
      if (status === 'unread') {
        publications = publications.filter(p => !p.notified);
      }
      
      // Ordena por data mais recente
      publications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Limita resultados
      const maxResults = limit ? parseInt(limit as string, 10) : 50;
      publications = publications.slice(0, maxResults);
      
      const lastCheck = await kv.get<string>(KV_KEYS.LAST_CHECK);
      const lawyers = await kv.get<MonitoredLawyer[]>(KV_KEYS.MONITORED_LAWYERS) || [];
      
      // Converter para formato de Expediente do frontend
      const expedientes = publications.map(pub => ({
        id: pub.id,
        type: pub.tipo || 'Intimação',
        tipo: pub.tipo,
        content: pub.teor,
        teor: pub.teor,
        receivedAt: pub.data,
        dataRecebimento: pub.data,
        analyzed: false,
        tribunal: pub.tribunal,
        numeroProcesso: pub.numeroProcesso,
        orgao: pub.orgao,
        lawyerName: pub.lawyerName,
        matchType: pub.matchType,
        source: 'DJEN',
        createdAt: pub.createdAt
      }));

      return res.status(200).json({
        success: true,
        expedientes,
        publications,
        count: publications.length,
        lastCheck,
        lawyersConfigured: lawyers.length,
        message: lawyers.length === 0 
          ? 'Nenhum advogado configurado. Use POST /api/lawyers para adicionar.' 
          : `${lawyers.length} advogado(s) monitorado(s)`
      });
    }

    // POST - Força sync manual
    if (req.method === 'POST' && req.url?.includes('/sync')) {
      // Chama o cron de DJEN manualmente
      const cronUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/cron?action=djen-monitor`;
      
      const response = await fetch(cronUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer manual-sync-token'
        }
      });
      
      const result = await response.json();
      
      return res.status(200).json({
        success: true,
        message: 'Sincronizacao iniciada',
        result
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[API Expedientes] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      hint: 'Verifique se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estao configurados no Vercel'
    });
  }
}
