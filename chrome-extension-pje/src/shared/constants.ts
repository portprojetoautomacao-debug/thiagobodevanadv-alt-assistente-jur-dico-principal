/**
 * Constantes compartilhadas
 */

export const BACKEND_URL = "https://assistente-juridico-p.vercel.app";

export const API_ENDPOINTS = {
  PJE_SYNC: "/api/pje-sync",
  STATUS: "/api/status",
  GENERATE_KEY: "/api/generate-api-key",
} as const;

export const STORAGE_KEYS = {
  API_KEY: "apiKey",
  PROCESSOS: "processos",
  PROCESSOS_TIMESTAMP: "processos_timestamp",
  EXPEDIENTES_TODAY: "expedientes_today",
  LAST_SYNC: "lastSync",
  ENABLED: "enabled",
} as const;

export const SYNC_INTERVAL = 60000; // 1 minuto
export const DEBOUNCE_DELAY = 1000; // 1 segundo
export const RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 2000; // 2 segundos

export const PJE_SELECTORS = {
  PROCESSO_ROW: ".processo-row, [data-processo]",
  NUMERO_PROCESSO: ".numero-processo, [data-numero-processo]",
  CLASSE: ".classe-processo, [data-classe]",
  ASSUNTO: ".assunto, [data-assunto]",
  PARTE_AUTOR: ".parte-autor, [data-autor]",
  PARTE_REU: ".parte-reu, [data-reu]",
  VARA: ".vara, [data-vara]",
  MOVIMENTO: ".ultimo-movimento, [data-movimento]",
  DATA: ".data-movimento, [data-data]",
  SITUACAO: ".situacao, [data-situacao]",
} as const;

export const CNJ_REGEX = /(\d{7})-?(\d{2})\.?(\d{4})\.?(\d{1})\.?(\d{2})\.?(\d{4})/;
export const CNJ_CLEAN_REGEX = /^\d{20}$/;
