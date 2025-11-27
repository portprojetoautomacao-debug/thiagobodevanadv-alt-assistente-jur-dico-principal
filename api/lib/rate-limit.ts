/**
 * Rate Limiting básico usando Upstash Redis
 * Implementa proteção contra abuso de API
 */

import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requests por janela
  keyPrefix?: string; // Prefixo para chaves Redis
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalRequests: number;
}

class RateLimiter {
  private redis: Redis;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis não configurado para rate limiting');
    }

    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    this.config = {
      keyPrefix: 'ratelimit:',
      ...config
    };
  }

  /**
   * Getter para configuração (usado por middleware)
   */
  getConfig(): RateLimitConfig {
    return this.config;
  }

  /**
   * Verifica se o request é permitido
   */
  async check(key: string): Promise<RateLimitResult> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    try {
      // Remove requests fora da janela e conta requests atuais
      const multi = this.redis.multi();
      multi.zremrangebyscore(redisKey, 0, windowStart);
      multi.zcard(redisKey);
      multi.zrange(redisKey, 0, -1, { withScores: true });

      const results = await multi.exec();
      const currentCount = results[1] as number;

      if (currentCount >= this.config.maxRequests) {
        // Calcular quando a janela reseta
        const oldestRequest = results[2] as Array<string | number> | null;
        let resetTime = now + this.config.windowMs;

        // Verifica se há dados válidos antes de acessar
        if (oldestRequest && Array.isArray(oldestRequest) && oldestRequest.length >= 2) {
          const score = oldestRequest[1];
          if (score !== undefined && score !== null) {
            resetTime = (typeof score === 'number' ? score : parseInt(String(score))) + this.config.windowMs;
          }
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalRequests: currentCount
        };
      }

      // Adiciona o novo request
      await this.redis.zadd(redisKey, { score: now, member: now.toString() });

      // Define TTL para limpeza automática
      await this.redis.expire(redisKey, Math.ceil(this.config.windowMs / 1000) * 2);

      return {
        allowed: true,
        remaining: this.config.maxRequests - currentCount - 1,
        resetTime: now + this.config.windowMs,
        totalRequests: currentCount + 1
      };

    } catch (error) {
      console.error('[RateLimit] Erro:', error);
      // Em caso de erro, permite o request (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        totalRequests: 1
      };
    }
  }

  /**
   * Reseta o contador para uma chave
   */
  async reset(key: string): Promise<void> {
    const redisKey = `${this.config.keyPrefix}${key}`;
    await this.redis.del(redisKey);
  }
}

// Instâncias globais de rate limiters
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 100, // 100 requests por minuto
  keyPrefix: 'ratelimit:global:'
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30, // 30 requests por minuto por IP
  keyPrefix: 'ratelimit:api:'
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 5, // 5 tentativas de auth por 15 min
  keyPrefix: 'ratelimit:auth:'
});

/**
 * Middleware de rate limiting para APIs
 */
export async function rateLimitMiddleware(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter
): Promise<{ allowed: boolean; headers: Record<string, string>; error?: string }> {
  const result = await limiter.check(identifier);

  const headers = {
    'X-RateLimit-Limit': limiter.getConfig().maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Used': result.totalRequests.toString()
  };

  if (!result.allowed) {
    return {
      allowed: false,
      headers,
      error: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`
    };
  }

  return { allowed: true, headers };
}