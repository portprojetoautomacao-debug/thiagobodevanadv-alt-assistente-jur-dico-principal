// api/_lib/circuit-breaker.ts
// Circuit Breaker Pattern para resiliência de APIs
// Baseado em: Netflix Hystrix, resilience4j patterns
// (Cópia para serverless functions - original em lib/ai/circuit-breaker.ts)

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de falhas para abrir circuito
  successThreshold: number;      // Sucessos necessários para fechar
  timeout: number;               // Tempo em ms para tentar HALF_OPEN
  resetTimeout: number;          // Tempo para resetar contadores
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

/**
 * Circuit Breaker para proteção de APIs externas
 * Estados: CLOSED (normal) → OPEN (bloqueado) → HALF_OPEN (teste)
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private lastStateChange = Date.now();
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold ?? 5,
      successThreshold: config?.successThreshold ?? 2,
      timeout: config?.timeout ?? 60000, // 60s
      resetTimeout: config?.resetTimeout ?? 300000, // 5min
    };
  }

  /**
   * Executa função protegida por circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se circuito está OPEN, rejeitar imediatamente
    if (this.state === 'OPEN') {
      // Checar se é hora de tentar HALF_OPEN
      const timeSinceFailure = Date.now() - (this.lastFailureTime ?? 0);
      
      if (timeSinceFailure >= this.config.timeout) {
        this.transitionTo('HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Retry in ${Math.ceil((this.config.timeout - timeSinceFailure) / 1000)}s`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Registra sucesso
   */
  private onSuccess() {
    this.failures = 0;
    this.successes++;

    if (this.state === 'HALF_OPEN' && this.successes >= this.config.successThreshold) {
      this.transitionTo('CLOSED');
    }
  }

  /**
   * Registra falha
   */
  private onFailure() {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Qualquer falha em HALF_OPEN reabre circuito
      this.transitionTo('OPEN');
    } else if (this.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Transição de estado
   */
  private transitionTo(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    if (newState === 'CLOSED') {
      this.failures = 0;
      this.successes = 0;
    }

    console.log(`[CircuitBreaker:${this.name}] ${oldState} → ${newState}`);
  }

  /**
   * Obtém estatísticas
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Reseta circuit breaker
   */
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.lastStateChange = Date.now();
    console.log(`[CircuitBreaker:${this.name}] RESET`);
  }

  /**
   * Verifica se pode executar
   */
  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN') return true;
    
    // Se OPEN, checar timeout
    const timeSinceFailure = Date.now() - (this.lastFailureTime ?? 0);
    return timeSinceFailure >= this.config.timeout;
  }
}

/**
 * Registry de circuit breakers para todas as APIs
 */
export class CircuitBreakerRegistry {
  private static breakers = new Map<string, CircuitBreaker>();

  /**
   * Obtém ou cria circuit breaker
   */
  static get(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(name);
    
    if (!breaker) {
      breaker = new CircuitBreaker(name, config);
      this.breakers.set(name, breaker);
    }

    return breaker;
  }

  /**
   * Lista todos os circuit breakers
   */
  static getAll(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats.set(name, breaker.getStats());
    }

    return stats;
  }

  /**
   * Reseta todos os circuit breakers
   */
  static resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}
