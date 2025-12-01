/**
 * Helper para acessar variáveis de ambiente de forma segura em qualquer ambiente (Browser, Node.js, Vite, Vercel)
 * Evita o erro "ReferenceError: process is not defined" em aplicações Vite.
 */

export function getEnv(key: string, defaultValue: string = ""): string {
  // 1. Tenta import.meta.env (Vite client-side)
  // Nota: import.meta.env geralmente só tem variáveis prefixadas com VITE_ no cliente,
  // a menos que configurado diferente no vite.config.ts
  try {
    // @ts-ignore - import.meta pode não existir em alguns ambientes TS estritos sem config
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env[key] !== undefined
    ) {
      // @ts-ignore
      return String(import.meta.env[key]);
    }
  } catch (e) {
    // Ignora erro de acesso a import.meta
  }

  // 2. Tenta process.env (Node.js / Serverless)
  // Verificação segura de 'process' para não quebrar no browser
  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env[key] !== undefined
    ) {
      return process.env[key] || "";
    }
  } catch (e) {
    // Ignora erro de acesso a process
  }

  return defaultValue;
}

export function requireEnv(key: string): string {
  const value = getEnv(key);
  if (!value) {
    // Em produção no cliente, não queremos lançar erro fatal imediatamente se for uma variável de servidor
    // que talvez não seja usada no fluxo atual.
    console.warn(`[Env] Missing required environment variable: ${key}`);
  }
  return value || "";
}
