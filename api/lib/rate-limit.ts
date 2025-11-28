/**
 * Rate Limiting básico usando Upstash Redis
 * Implementa proteção contra abuso de API
 */

import { Redis } from '@upstash/redis'

export interface RateLimitConfig {
  windowMs: number // Janela de tempo em ms
  maxRequests: number // Máximo de requests por janela
  keyPrefix?: string // Prefixo para chaves Redis
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  totalRequests: number
}

export class RateLimiter {
  private redis: Redis
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

    if (!url || !token) {
      throw new Error('Upstash Redis não configurado para rate limiting')
    }

    this.redis = new Redis({
      url,
      token
    })

    this.config = {
      keyPrefix: 'ratelimit:',
      ...config
    }
  }

  /**
   * Getter para configuração (usado por middleware)
   */
  getConfig(): RateLimitConfig {
    return this.config
  }

  /**
   * Verifica se o request é permitido
   */
  async check(key: string): Promise<RateLimitResult> {
    const prefix = this.config.keyPrefix ?? 'ratelimit:'
    const redisKey = `${prefix}${key}`
    const now = Date.now()
    const windowStart = now - this.config.windowMs

    try {
      // Remove requests fora da janela e conta requests atuais
      const multi = this.redis.multi()

      multi.zremrangebyscore(redisKey, 0, windowStart)
      multi.zcard(redisKey)
      // com withScores, o Redis retorna [member, score, member, score, ...]
      multi.zrange(redisKey, 0, -1, { withScores: true })

      const results = (await multi.exec()) as [unknown, number, (string | number)[] | null]

      const currentCount = typeof results[1] === 'number' ? results[1] : 0
      const rawRange = results[2]

      if (currentCount >= this.config.maxRequests) {
        // Calcula quando a janela reseta
        let resetTime = now + this.config.windowMs

        if (Array.isArray(rawRange) && rawRange.length >= 2) {
          // Pega o score do primeiro par [member, score, ...]
          const score = rawRange[1]
          if (score !== undefined && score !== null && !Number.isNaN(Number(score))) {
            const firstTs = typeof score === 'number' ? score : parseInt(String(score), 10)
            resetTime = firstTs + this.config.windowMs
          }
        }

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalRequests: currentCount
        }
      }

      // Adiciona o novo request
      await this.redis.zadd(redisKey, { score: now, member: now.toString() })

      // Define TTL para limpeza automática (2x a janela)
      const ttlSeconds = Math.ceil(this.config.windowMs / 1000) * 2
      await this.redis.expire(redisKey, ttlSeconds)

      return {
        allowed: true,
        remaining: this.config.maxRequests - currentCount - 1,
        resetTime: now + this.config.windowMs,
        totalRequests: currentCount + 1
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RateLimit] Erro:', error)
      // Em caso de erro, permite o request (fail-open)
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
        totalRequests: 1
      }
    }
  }

  /**
   * Reseta o contador para uma chave
   */
  async reset(key: string): Promise<void> {
    const prefix = this.config.keyPrefix ?? 'ratelimit:'
    const redisKey = `${prefix}${key}`
    await this.redis.del(redisKey)
  }
}

// Instâncias globais de rate limiters
export const globalRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 200, // 200 requests por minuto (aumentado para acomodar transição)
  keyPrefix: 'ratelimit:global:'
})

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 200, // 200 requests por minuto por IP (aumentado para suportar batching inicial)
  keyPrefix: 'ratelimit:api:'
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 10, // 10 tentativas de auth por 15 min
  keyPrefix: 'ratelimit:auth:'
})

/**
 * Middleware de rate limiting para APIs
 */
export async function rateLimitMiddleware(
  identifier: string,
  limiter: RateLimiter = apiRateLimiter
): Promise<{ allowed: boolean; headers: Record<string, string>; error?: string }> {
  const result = await limiter.check(identifier)

  const cfg = limiter.getConfig()

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': cfg.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    'X-RateLimit-Used': result.totalRequests.toString()
  }

  if (!result.allowed) {
    const seconds = Math.max(0, Math.ceil((result.resetTime - Date.now()) / 1000))
    return {
      allowed: false,
      headers,
      error: `Rate limit exceeded. Try again in ${seconds} seconds.`
    }
  }

  return { allowed: true, headers }
}
