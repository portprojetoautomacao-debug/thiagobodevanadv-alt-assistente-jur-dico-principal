/**
 * Configuração de Monitoring e Alertas
 * Integração com Sentry para rastreamento de erros em produção
 */

/// <reference types="vite/client" />

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Configuração customizada para ambiente jurídico
export function initMonitoring() {
  if (!IS_PRODUCTION || !SENTRY_DSN) {
    console.log("[Monitoring] Sentry desabilitado em desenvolvimento");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: IS_PRODUCTION ? "production" : "development",
    release: `assistente-juridico@${APP_VERSION}`,

    // Performance Monitoring
    tracesSampleRate: 0.1,

    // Session Replay (opcional)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // LGPD Compliance
    sendDefaultPii: false,

    beforeSend(event, hint) {
      // Filtrar dados sensíveis
      if (event.request?.headers) {
        delete event.request.headers.Authorization;
        delete event.request.headers.Cookie;
      }
      return event;
    },
  });

  console.log("[Monitoring] Sentry inicializado", IS_PRODUCTION ? "em produção" : "em desenvolvimento");
}

// Adicionar contexto do usuário (após login)
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Não enviar dados sensíveis como nome completo
  });
  
  Sentry.setTag("user_role", user.role || "unknown");
}

// Limpar contexto (logout)
export function clearUserContext() {
  Sentry.setUser(null);
}

// Helper para capturar exceções customizadas
export function captureException(error: Error, context?: Record<string, any>) {
  if (!IS_PRODUCTION) {
    console.error("[Dev Error]", error, context);
    return;
  }

  Sentry.captureException(error, {
    level: "error",
    extra: context,
  });
}

// Helper para capturar mensagens (não-erros)
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, any>) {
  if (!IS_PRODUCTION) {
    console.log(`[Dev ${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}
