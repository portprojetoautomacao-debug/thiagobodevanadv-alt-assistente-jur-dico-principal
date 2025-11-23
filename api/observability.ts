// api/observability.ts
// Endpoint de observabilidade para monitoramento dos agentes
// Monitora: circuit breakers, traces, health das APIs

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CircuitBreakerRegistry } from '../lib/ai/circuit-breaker';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'circuit-breakers':
        return handleCircuitBreakers(req, res);
      
      case 'health':
        return handleHealth(req, res);
      
      case 'reset-breakers':
        return handleResetBreakers(req, res);
      
      default:
        return res.status(200).json({
          ok: true,
          endpoints: {
            'circuit-breakers': 'GET /api/observability?action=circuit-breakers',
            'health': 'GET /api/observability?action=health',
            'reset-breakers': 'POST /api/observability?action=reset-breakers',
          },
        });
    }
  } catch (error: any) {
    console.error('[Observability] Erro:', error);
    return res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
}

/**
 * GET /api/observability?action=circuit-breakers
 * Retorna estado de todos os circuit breakers
 */
function handleCircuitBreakers(req: VercelRequest, res: VercelResponse) {
  const allBreakers = CircuitBreakerRegistry.getAll();
  
  const breakersData = Array.from(allBreakers.entries()).map(([name, stats]) => ({
    name,
    state: stats.state,
    failures: stats.failures,
    successes: stats.successes,
    lastFailureTime: stats.lastFailureTime,
    lastStateChange: stats.lastStateChange,
    isHealthy: stats.state !== 'OPEN',
    timeSinceLastFailure: stats.lastFailureTime 
      ? Date.now() - stats.lastFailureTime 
      : null,
  }));

  const summary = {
    total: breakersData.length,
    healthy: breakersData.filter(b => b.state === 'CLOSED').length,
    degraded: breakersData.filter(b => b.state === 'HALF_OPEN').length,
    down: breakersData.filter(b => b.state === 'OPEN').length,
  };

  return res.status(200).json({
    ok: true,
    summary,
    breakers: breakersData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/observability?action=health
 * Health check geral do sistema
 */
async function handleHealth(req: VercelRequest, res: VercelResponse) {
  const allBreakers = CircuitBreakerRegistry.getAll();
  
  const criticalApisDown = Array.from(allBreakers.entries())
    .filter(([_, stats]) => stats.state === 'OPEN')
    .map(([name]) => name);

  const isHealthy = criticalApisDown.length === 0;
  const status = isHealthy ? 'healthy' : 'degraded';

  return res.status(isHealthy ? 200 : 503).json({
    ok: isHealthy,
    status,
    details: {
      apis: {
        healthy: Array.from(allBreakers.entries())
          .filter(([_, stats]) => stats.state === 'CLOSED')
          .map(([name]) => name),
        degraded: Array.from(allBreakers.entries())
          .filter(([_, stats]) => stats.state === 'HALF_OPEN')
          .map(([name]) => name),
        down: criticalApisDown,
      },
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST /api/observability?action=reset-breakers
 * Reseta todos os circuit breakers (admin only)
 */
function handleResetBreakers(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Em produção: adicionar autenticação aqui
  const { adminKey } = req.body;
  const expectedKey = process.env.ADMIN_KEY;

  if (expectedKey && adminKey !== expectedKey) {
    return res.status(403).json({ ok: false, error: 'Unauthorized' });
  }

  CircuitBreakerRegistry.resetAll();

  return res.status(200).json({
    ok: true,
    message: 'Todos os circuit breakers foram resetados',
    timestamp: new Date().toISOString(),
  });
}
