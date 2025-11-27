/**
 * Utilitários para sanitização de logs e dados sensíveis
 * Remove informações confidenciais antes do logging
 */

interface SanitizeOptions {
  maxLength?: number;
  maskFields?: string[];
  removeFields?: string[];
}

/**
 * Campos sensíveis que devem ser mascarados ou removidos
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'auth',
  'credential',
  'oauth',
  'client_secret',
  'api_key',
  'access_token',
  'refresh_token',
  'bearer',
  'x-api-key',
  'x-auth-token'
];

/**
 * Campos que contêm dados pessoais
 */
const PII_FIELDS = [
  'email',
  'cpf',
  'cnpj',
  'rg',
  'telefone',
  'celular',
  'endereco',
  'cep',
  'nome_completo',
  'data_nascimento',
  'numero_oab',
  'uf_oab'
];

/**
 * Mascara uma string sensível
 */
export function maskSensitive(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(value.length - visibleChars * 2);

  return `${start}${masked}${end}`;
}

/**
 * Sanitiza um objeto removendo ou mascarando campos sensíveis
 */
export function sanitizeObject(
  obj: any,
  options: SanitizeOptions = {}
): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Máscara strings que parecem tokens ou chaves
    if (obj.length > 20 && /^[A-Za-z0-9+/=.-]+$/.test(obj)) {
      return maskSensitive(obj);
    }
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Remove campos completamente
      if (options.removeFields?.includes(lowerKey) ||
          SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        continue;
      }

      // Máscara campos PII
      if (PII_FIELDS.some(field => lowerKey.includes(field))) {
        if (typeof value === 'string') {
          sanitized[key] = maskSensitive(value);
        } else {
          sanitized[key] = '[REDACTED]';
        }
        continue;
      }

      // Máscara campos especificados
      if (options.maskFields?.includes(lowerKey)) {
        if (typeof value === 'string') {
          sanitized[key] = maskSensitive(value);
        } else {
          sanitized[key] = value;
        }
        continue;
      }

      // Sanitiza recursivamente
      sanitized[key] = sanitizeObject(value, options);
    }

    return sanitized;
  }

  return obj;
}

/**
 * Sanitiza uma mensagem de erro
 */
export function sanitizeError(error: Error | any): any {
  if (!error) return error;

  return sanitizeObject(error, {
    removeFields: ['stack', 'cause'],
    maskFields: ['message']
  });
}

/**
 * Logger seguro que sanitiza automaticamente
 */
export class SafeLogger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => sanitizeObject(arg));
  }

  info(message: string, ...args: any[]): void {
    console.log(`[${this.context}] ${message}`, ...this.sanitizeArgs(args));
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] ${message}`, ...this.sanitizeArgs(args));
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    const sanitizedError = error ? sanitizeError(error) : undefined;
    console.error(`[${this.context}] ${message}`, sanitizedError, ...this.sanitizeArgs(args));
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] ${message}`, ...this.sanitizeArgs(args));
    }
  }
}

/**
 * Sanitiza headers HTTP
 */
export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = maskSensitive(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitiza URL removendo query parameters sensíveis
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    params.forEach((value, param) => {
      if (SENSITIVE_FIELDS.some(field => param.toLowerCase().includes(field))) {
        params.set(param, maskSensitive(value || ''));
      }
    });

    return urlObj.toString();
  } catch {
    return url;
  }
}