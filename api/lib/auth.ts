/**
 * Middleware de autenticação para endpoints sensíveis
 * Valida tokens de acesso e autoriza operações
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SafeLogger } from './safe-logger';

const logger = new SafeLogger('Auth');

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  error?: string;
  code?: string;
}

/**
 * Extrai token de autorização do request
 */
function extractToken(req: VercelRequest): string | null {
  // Header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Query parameter (para desenvolvimento/testing)
  const token = req.query.token as string;
  if (token) {
    return token;
  }

  // Body (para POST requests)
  if (req.method === 'POST' && req.body?.token) {
    return req.body.token;
  }

  return null;
}

/**
 * Valida token de autenticação
 */
export async function validateAuthToken(token: string): Promise<AuthResult> {
  try {
    // Token vazio ou inválido
    if (!token || typeof token !== 'string' || token.length < 10) {
      return {
        authenticated: false,
        error: 'Token inválido ou ausente',
        code: 'INVALID_TOKEN'
      };
    }

    // Para desenvolvimento: aceitar tokens de teste
    if (process.env.NODE_ENV === 'development') {
      const testTokens = [
        process.env.TEST_AUTH_TOKEN,
        'test-token-123',
        'dev-token-456'
      ].filter(Boolean);

      if (testTokens.includes(token)) {
        return {
          authenticated: true,
          userId: 'dev-user'
        };
      }
    }

    // TODO: Implementar validação real de JWT ou sessão
    // Por enquanto, aceita qualquer token não vazio em produção
    // Isso deve ser substituído por validação real de JWT

    logger.warn('Usando validação de token temporária - implementar JWT real');

    return {
      authenticated: true,
      userId: 'authenticated-user'
    };

  } catch (error) {
    logger.error('Erro na validação de token', error);
    return {
      authenticated: false,
      error: 'Erro interno na validação',
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Middleware de autenticação obrigatório
 */
export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<AuthResult> {
  const token = extractToken(req);

  if (!token) {
    logger.warn('Tentativa de acesso sem token', {
      method: req.method,
      url: req.url,
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    });

    return {
      authenticated: false,
      error: 'Autenticação obrigatória',
      code: 'AUTH_REQUIRED'
    };
  }

  const authResult = await validateAuthToken(token);

  if (!authResult.authenticated) {
    logger.warn('Token inválido rejeitado', {
      method: req.method,
      url: req.url,
      error: authResult.error
    });
  }

  return authResult;
}

/**
 * Middleware de autenticação opcional
 */
export async function optionalAuth(
  req: VercelRequest
): Promise<AuthResult> {
  const token = extractToken(req);

  if (!token) {
    return {
      authenticated: false,
      userId: undefined
    };
  }

  return await validateAuthToken(token);
}

/**
 * Helper para responder com erro de autenticação
 */
export function sendAuthError(res: VercelResponse, result: AuthResult): void {
  const statusCode = result.code === 'AUTH_REQUIRED' ? 401 : 403;

  res.status(statusCode).json({
    ok: false,
    error: result.error || 'Não autorizado',
    code: result.code,
    timestamp: new Date().toISOString()
  });
}

/**
 * Wrapper para handlers que requerem autenticação
 */
export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse, userId: string) => Promise<void> | void
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const auth = await requireAuth(req, res);

    if (!auth.authenticated) {
      sendAuthError(res, auth);
      return;
    }

    await handler(req, res, auth.userId!);
  };
}