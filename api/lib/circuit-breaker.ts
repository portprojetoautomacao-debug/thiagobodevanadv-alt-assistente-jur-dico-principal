```ts
/**
 * Circuit Breaker Pattern
 * Protege contra falhas em cascata em serviços externos
 */

import { SafeLogger } from './safe-logger.js'

const logger = new SafeLogger('CircuitBreaker')

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  failureThreshold: number    // Número de falhas para abrir o circuito
  successThreshold: number    // Número de sucessos para fechar o circuito
  timeout: number             // Tempo em ms para tentar novamente quando OPEN
  resetTimeout: number        // Tempo em ms para reset automático (reservado)
  monitoringPeriod: number    // Período para monitorar métricas (reservado)
}

export interface CircuitBreakerStats {
  state: CircuitState
  failures: number
  successes: number
  totalRequests: number
  lastFailureTime?: number
  lastSuccessTime?: number
  lastStateChange: number
  uptime: number
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED'
  private failures = 0
  private successes = 0
  private totalRequests = 0
  private lastFailureTime?: number
  private lastSuccessTime?: number
  private lastStateChange: number
  private config: CircuitBreakerConfig
  private name: string

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name
    this.lastStateChange = Date.now()
    this.config = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60_000,          // 1 minuto
      resetTimeout: 300_000,    // 5 minutos
      monitoringPeriod: 300_000, // 5 minutos
      ...config
    }
  }

  /**
   * Executa operação protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++

    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - (this.lastFailureTime ?? 0)

      if (timeSinceFailure >= this.config.timeout) {
        this.transitionTo('HALF_OPEN')
      } else {
        const retryInSec = Math.ceil((this.config.timeout - timeSinceFailure) / 1000)
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Retry in ${retryInSec}s`)
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  /**
   * Registra sucesso
   */
  private onSuccess(): void {
    this.failures = 0
    this.successes++
    this.lastSuccessTime = Date.now()

    if (this.state === 'HALF_OPEN' && this.successes >= this.config.successThreshold) {
      this.transitionTo('CLOSED')
    }
  }

  /**
   * Registra falha
   */
  private onFailure(): void {
    this.failures++
    this.successes = 0
    this.lastFailureTime = Date.now()

    if (this.state === 'HALF_OPEN') {
      // Qualquer falha em HALF_OPEN reabre circuito
      this.transitionTo('OPEN')
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN')
    }
  }

  /**
   * Transita para novo estado
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state
    this.state = newState
    this.lastStateChange = Date.now()

    if (newState === 'HALF_OPEN') {
      this.successes = 0
      this.failures = 0
    }

    logger.info(`Circuit breaker [${this.name}] transitioned: ${oldState} -> ${newState}`)
  }

  /**
   * Retorna estatísticas do circuit breaker
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastStateChange: this.lastStateChange,
      // Aqui é "uptime" desde a última mudança de estado
      uptime: Date.now() - this.lastStateChange
    }
  }

  /**
   * Reseta o circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED'
    this.failures = 0
    this.successes = 0
    this.totalRequests = 0
    this.lastFailureTime = undefined
    this.lastSuccessTime = undefined
    this.lastStateChange = Date.now()

    logger.info(`Circuit breaker [${this.name}] reset`)
  }

  /**
   * Verifica se pode executar
   */
  canExecute(): boolean {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN'
  }

  /**
   * Verifica se está aberto
   */
  isOpen(): boolean {
    return this.state === 'OPEN'
  }

  /**
   * Verifica se está fechado
   */
  isClosed(): boolean {
    return this.state === 'CLOSED'
  }

  /**
   * Verifica se está semi-aberto
   */
  isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN'
  }
}

/**
 * Registry global para circuit breakers
 */
export class CircuitBreakerRegistry {
  private static breakers = new Map<string, CircuitBreaker>()

  static getBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config))
    }
    return this.breakers.get(name)!
  }

  static resetAll(): void {
    this.breakers.forEach(breaker => {
      breaker.reset()
    })
  }

  static getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {}
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats()
    })
    return stats
  }
}

// Circuit breakers pré-configurados para serviços comuns
export const sparkCircuitBreaker = CircuitBreakerRegistry.getBreaker('spark', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30_000 // 30s
})

export const djenCircuitBreaker = CircuitBreakerRegistry.getBreaker('djen', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60_000 // 1min
})

export const redisCircuitBreaker = CircuitBreakerRegistry.getBreaker('redis', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 15_000 // 15s
})

/**
 * Wrapper para operações com circuit breaker
 */
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  serviceName: string,
  fallback?: () => Promise<T>
): Promise<T> {
  const breaker = CircuitBreakerRegistry.getBreaker(serviceName)

  try {
    return await breaker.execute(operation)
  } catch (error) {
    if (breaker.isOpen() && fallback) {
      logger.warn('Circuit breaker open, using fallback', { breaker: breaker.getStats() })
      return await fallback()
    }
    throw error
  }
}
```
