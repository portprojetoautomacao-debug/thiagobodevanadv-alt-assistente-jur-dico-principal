/**
 * Retry logic com backoff exponencial
 * Para operações que podem falhar temporariamente
 */

import { SafeLogger } from './safe-logger';

const logger = new SafeLogger('Retry');

export interface RetryConfig {
  maxAttempts: number;      // Número máximo de tentativas
  baseDelay: number;        // Delay base em ms
  maxDelay: number;         // Delay máximo em ms
  backoffFactor: number;    // Fator de multiplicação do delay
  jitter: boolean;          // Adicionar jitter aleatório
  retryCondition?: (error: Error) => boolean; // Condição para retry
}

export interface RetryStats {
  attempts: number;
  totalDelay: number;
  lastError?: Error;
  success: boolean;
}

/**
 * Erros que geralmente são retryáveis
 */
export const RETRYABLE_ERRORS = [
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'ECONNABORTED'
];

/**
 * Verifica se um erro é retryável
 */
export function isRetryableError(error: Error): boolean {
  const errorCode = (error as any).code;
  const errorName = error.name;

  // Erros de rede comuns
  if (RETRYABLE_ERRORS.includes(errorCode)) {
    return true;
  }

  // Erros HTTP 5xx
  if (errorName === 'HTTPError') {
    const statusCode = (error as any).statusCode;
    return statusCode >= 500 && statusCode < 600;
  }

  // Timeouts
  if (errorName === 'TimeoutError' || error.message.includes('timeout')) {
    return true;
  }

  // Rate limits (mas com backoff maior)
  if (errorCode === '429' || error.message.includes('rate limit')) {
    return true;
  }

  return false;
}

/**
 * Calcula delay para próxima tentativa
 */
function calculateDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  const delay = Math.min(exponentialDelay, config.maxDelay);

  if (config.jitter) {
    // Adiciona jitter aleatório (±25%)
    const jitterRange = delay * 0.25;
    const jitter = (Math.random() - 0.5) * 2 * jitterRange;
    return Math.max(0, delay + jitter);
  }

  return delay;
}

/**
 * Executa operação com retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<{ result: T; stats: RetryStats }> {
  const fullConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: isRetryableError,
    ...config
  };

  let lastError: Error | null = null;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();

      return {
        result,
        stats: {
          attempts: attempt,
          totalDelay,
          success: true
        }
      };

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;

      // Verifica se deve tentar novamente
      const shouldRetry = attempt < fullConfig.maxAttempts &&
        (!fullConfig.retryCondition || fullConfig.retryCondition(err));

      if (!shouldRetry) {
        break;
      }

      // Calcula delay para próxima tentativa
      const delay = calculateDelay(attempt, fullConfig);
      totalDelay += delay;

      logger.warn(
        `Tentativa ${attempt}/${fullConfig.maxAttempts} falhou, tentando novamente em ${delay}ms`,
        { error: err.message, delay, totalDelay }
      );

      // Aguarda antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Todas as tentativas falharam
  throw new Error(
    `Operação falhou após ${fullConfig.maxAttempts} tentativas. Último erro: ${lastError?.message}`
  );
}

/**
 * Retry com configuração específica para APIs externas
 */
export const apiRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryCondition: (error) => {
    // Retry para erros de rede e HTTP 5xx
    return isRetryableError(error) ||
           error.message.includes('fetch failed') ||
           error.message.includes('network error');
  }
};

/**
 * Retry com configuração específica para DJEN API
 */
export const djenRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 2,
  baseDelay: 2000,
  maxDelay: 15000,
  backoffFactor: 2,
  jitter: false, // DJEN não gosta de muitos requests simultâneos
  retryCondition: (error) => {
    // Retry apenas para timeouts e erros 5xx
    return error.name === 'TimeoutError' ||
           error.message.includes('timeout') ||
           ((error as any).statusCode >= 500 && (error as any).statusCode < 600);
  }
};

/**
 * Retry com configuração específica para Spark API
 */
export const sparkRetryConfig: Partial<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  backoffFactor: 1.5,
  jitter: true,
  retryCondition: isRetryableError
};

/**
 * Wrapper para operações HTTP com retry automático
 */
export async function httpWithRetry<T>(
  url: string,
  options: RequestInit,
  retryConfig: Partial<RetryConfig> = apiRetryConfig
): Promise<{ result: T; stats: RetryStats }> {
  return withRetry(async () => {
    const response = await fetch(url, options);

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).statusCode = response.status;
      throw error;
    }

    return await response.json();
  }, retryConfig);
}

/**
 * Classe para operações que precisam de retry stateful
 */
export class RetryableOperation<T> {
  private attempts = 0;
  private lastError?: Error;
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffFactor: 2,
      jitter: true,
      retryCondition: isRetryableError,
      ...config
    };
  }

  async execute(operation: () => Promise<T>): Promise<T> {
    this.attempts++;

    try {
      const result = await operation();
      // Reset em caso de sucesso
      this.attempts = 0;
      this.lastError = undefined;
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.lastError = err;

      if (this.attempts >= this.config.maxAttempts) {
        throw new Error(
          `Operação falhou após ${this.attempts} tentativas: ${err.message}`
        );
      }

      const shouldRetry = !this.config.retryCondition || this.config.retryCondition(err);
      if (!shouldRetry) {
        throw err;
      }

      // Aguarda antes de tentar novamente
      const delay = calculateDelay(this.attempts, this.config);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Tenta novamente recursivamente
      return this.execute(operation);
    }
  }

  getAttempts(): number {
    return this.attempts;
  }

  getLastError(): Error | undefined {
    return this.lastError;
  }
}