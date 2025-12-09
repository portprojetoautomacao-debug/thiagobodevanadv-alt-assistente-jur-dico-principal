/**
 * Configura��o de Monitoring e Alertas
 * Integra��o com Sentry para rastreamento de erros em produ��o
 */

/// <reference types="vite/client" />

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "";
const IS_PRODUCTION = import.meta.env.PROD;
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "1.0.0";

// Configura��o customizada para ambiente jur�dico
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
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/assistente-juridico.*\.vercel\.app/,
          /^https:\/\/.*\.pje\.jus\.br/, // APIs externas
        ],
      }),
    ],

    // Sample rate (10% de eventos de performance)
    tracesSampleRate: 0.1,

    // Filtrar dados sens�veis (LGPD compliance)
    beforeSend(event, hint) {
      // Remover dados potencialmente sens�veis
      if (event.request?.url) {
        // Remove query params com dados sens�veis
        event.request.url = event.request.url.split("?")[0];
      }

      // Remove informa��es de processos dos breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.message?.includes("CNJ") || breadcrumb.message?.includes("CPF")) {
            return { ...breadcrumb, message: "[REDACTED - LGPD]" };
          }
          return breadcrumb;
        });
      }

      return event;
    },

    // Ignorar erros conhecidos e n�o cr�ticos
    ignoreErrors: [
      "ResizeObserver loop", // Erro comum de layout
      "Non-Error promise rejection", // Promisses n�o tratadas (n�o cr�ticas)
      /^Loading chunk \d+ failed/, // Falhas de carregamento de chunks (timeout/network)
    ],
  });

  console.log("[Monitoring] Sentry inicializado");
}

// Helper para capturar exce��es customizadas
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

// Helper para capturar mensagens (n�o-erros)
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) {
  if (!IS_PRODUCTION) {
    console.log(`[Dev ${level}]`, message, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// Adicionar contexto do usu�rio (ap�s login)
export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // N�o enviar dados sens�veis como nome completo
  });

  Sentry.setTag("user_role", user.role || "unknown");
}

// Limpar contexto (logout)
export function clearUserContext() {
  Sentry.setUser(null);
}
